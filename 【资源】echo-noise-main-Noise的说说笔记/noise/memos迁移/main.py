import sqlite3
import os
from datetime import datetime

def transfer_data(source_db_path, destination_db_path):
    try:
        # 确保源文件和目标文件存在
        if not os.path.exists(source_db_path):
            raise FileNotFoundError(f"源数据库文件 {source_db_path} 不存在！")
        if not os.path.exists(destination_db_path):
            raise FileNotFoundError(f"目标数据库文件 {destination_db_path} 不存在！")

        # 连接到源数据库
        source_conn = sqlite3.connect(source_db_path)
        source_cursor = source_conn.cursor()

        # 连接到目标数据库
        destination_conn = sqlite3.connect(destination_db_path)
        destination_cursor = destination_conn.cursor()

        # 获取源数据库中的memo表数据
        source_cursor.execute("SELECT content, created_ts FROM memo;")
        memo_rows = source_cursor.fetchall()

        if not memo_rows:
            print("源数据库中没有memo表数据，无需迁移。")
            return

        # 遍历memo表中的每一条记录
        for memo_row in memo_rows:
            content, created_ts = memo_row

            # 将created_ts转换为目标数据库中的时间格式
            created_at = datetime.fromtimestamp(created_ts).strftime('%Y-%m-%d %H:%M:%S')

            # 构建插入的数据，noise为用户名
            insert_data = (content, created_at, "noise", 1)

            try:
                # 插入数据到目标数据库的messages表
                destination_cursor.execute("""
                    INSERT INTO messages (content, created_at, username, user_id)
                    VALUES (?, ?, ?, ?)
                """, insert_data)
            except sqlite3.IntegrityError as e:
                print(f"插入失败：{e}，跳过该记录。")
                continue

        # 提交更改并关闭连接
        destination_conn.commit()
        source_conn.close()
        destination_conn.close()

        print(f"数据迁移完成！共迁移 {len(memo_rows)} 条记录。")

    except sqlite3.Error as e:
        print(f"数据库错误: {e}")
    except Exception as e:
        print(f"发生了错误: {e}")

if __name__ == "__main__":
    # 设置源数据库和目标数据库的路径
    source_db_path = "memos_prod.db"
    destination_db_path = "database.db"

    # 调用函数进行数据迁移
    transfer_data(source_db_path, destination_db_path)
