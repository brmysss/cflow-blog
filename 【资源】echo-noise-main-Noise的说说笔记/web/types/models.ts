export interface Message {
    id: number;
    content: string;
    username?: string;
    image_url?: string;
    private: boolean;
    created_at: string;
}

export interface MessageToSave {
    username?: string;
    content: string;
    image_url?: string;
    private: boolean;
    notify: boolean;
}

export interface PageQuery {
    page: number;
    pageSize: number;
}

export interface PageQueryResult {
    total: number;
    items: Message[];
}

// UserToLogin
export interface UserToLogin {
    username: string;
    password: string;
}

// UserToRegister
export interface UserToRegister {
    username: string;
    password: string;
}

// User
export interface User {
    userid: number;
    username: string;
    is_admin: boolean;
    total_messages: number;
    token?: string;
}

export interface UserStatus {
    user_id: number;
    username: string;
    is_admin: boolean;
}

export interface Status {
    username: string;
    status: string;
    is_admin: boolean;
    sys_admin_id: number;
    users: UserStatus[];
    total_messages: number;
    messages?: Message[];  // 添加消息列表字段
    total?: number;        // 添加总数字段
    items?: Message[];     // 添加与后端返回结构匹配的字段
}

export interface Response<T> {
    code: number;
    msg: string;
    data: T;
}