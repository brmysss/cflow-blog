// Memos Start
var memo = {
    host: 'https://demo.usememos.com/',
    limit: '10',
    creatorId: '1',
    domId: '#memos',
    username: 'Admin',
    name: 'Administrator',
    APIVersion: 'legacy',
    language: 'zh-CN',
    total: true,
    doubanAPI: '',
}
if (typeof (memos) !== "undefined") {
    for (var key in memos) {
        if (memos[key]) {
            memo[key] = memos[key];
        }
    }
}

var limit = parseInt(memo.limit) || 10; // 确保limit是数字
var memos = memo.host.replace(/\/$/, '')

let memoUrl;
if (memo.APIVersion === 'new') {
    const filter = `creator=='users/${memo.creatorId}'&&visibilities==['PUBLIC']`;
    memoUrl = `${memos}/api/v1/memos?filter=${encodeURIComponent(filter)}`;
} else if (memo.APIVersion === 'legacy') {
    memoUrl = memos + "/api/v1/memo?creatorId=" + memo.creatorId + "&rowStatus=NORMAL";
} else {
    throw new Error('Invalid APIVersion');
}

var page = 1,
    nextLength = 0,
    nextDom = [],
    offset = 0; // 确保offset从0开始
var tag = '';
var nextPageToken = '';
var btnRemove = 0;
var memoDom = document.querySelector(memo.domId);
var load = '<button class="load-btn button-load">加载更多...</button>';
var isLoading = false; // 加载状态标志
var isMemosPage = true; // 默认在碎碎念页面

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
if (memoDom) {
        // 确保只添加一次按钮
        if (!document.querySelector('.button-load')) {
    memoDom.insertAdjacentHTML('afterend', load);
            console.log("初始化加载更多按钮");
        }
        
        // 直接绑定点击事件，简化处理逻辑
        document.querySelector('.button-load').addEventListener('click', function loadMoreHandler() {
            console.log("点击加载更多按钮");
            const btn = this;
            
            // 如果按钮被禁用或标记为移除，忽略点击
            if (btn.disabled || btnRemove) {
                console.log("按钮已禁用或已被移除，忽略点击");
                return;
            }
            
            // 设置按钮为加载状态
            btn.textContent = '加载中...';
            btn.disabled = true;
            
            // 页码增加，计算新的偏移量
            page++;
            offset = limit * (page - 1);
            console.log(`加载第${page}页数据，偏移量: ${offset}`);
            
            // 构建API请求URL
            var apiUrl;
            if (memo.APIVersion === 'legacy') {
                apiUrl = `${memoUrl}&limit=${limit}&offset=${offset}`;
                if (tag) {
                    apiUrl += `&tag=${tag}`;
                }
            } else {
                // 处理新版API
                apiUrl = `${memoUrl}&pageSize=${limit}`;
                if (nextPageToken) {
                    apiUrl += `&pageToken=${nextPageToken}`;
                }
            }
            
            console.log("请求URL:", apiUrl);
            
            // 发送请求获取数据
            fetch(apiUrl)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`网络请求错误: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    console.log(`成功获取第${page}页数据，条数:`, data.length);
                    
                    // 确保数据是数组
                    if (!Array.isArray(data)) {
                        throw new Error("返回数据不是数组");
                    }
                    
                    // 如果返回数据为空，表示没有更多内容
                    if (data.length === 0) {
                        handleNoMoreData();
                        return;
                    }
                    
                    // 直接更新HTML显示
                    updateHTMl(data);
                    
                    // 如果返回的数据少于请求的限制，表示已经到底了
                    if (data.length < limit) {
                        handleNoMoreData();
                    } else {
                        // 恢复按钮状态
                        btn.textContent = '加载更多...';
                        btn.disabled = false;
                    }
                })
                .catch(err => {
                    console.error("加载更多数据失败:", err);
                    
                    // 显示错误信息
                    const errorMsg = document.createElement('p');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = `加载失败: ${err.message}`;
                    errorMsg.style.color = 'red';
                    errorMsg.style.textAlign = 'center';
                    errorMsg.style.margin = '10px 0';
                    
                    // 将错误信息插入到按钮之前
                    btn.parentNode.insertBefore(errorMsg, btn);
                    
                    // 3秒后移除错误信息
                    setTimeout(() => {
                        if (errorMsg.parentNode) {
                            errorMsg.parentNode.removeChild(errorMsg);
                        }
                    }, 3000);
                    
                    // 恢复按钮状态，允许用户重试
                    btn.textContent = '加载更多...';
                    btn.disabled = false;
                });
        });
        
        // 获取第一页数据
        getFirstList();
    }
});

function getFirstList() {
    // 重置状态
    page = 1;
    offset = 0;
    btnRemove = 0;
    memoDom.innerHTML = ""; // 清空内容

    // 构建API URL
    let apiUrl;
    if (memo.APIVersion === 'legacy') {
        apiUrl = `${memoUrl}&limit=${limit}`;
        if (tag) {
            apiUrl += `&tag=${tag}`;
        }
    } else {
        apiUrl = `${memoUrl}&pageSize=${limit}`;
    }
    
    console.log("首页请求URL:", apiUrl);
    
    // 禁用加载按钮，直到数据加载完成
    const btn = document.querySelector('.button-load');
    if (btn) {
        btn.textContent = '加载中...';
        btn.disabled = true;
    }
    
    // 发送请求获取数据
    fetch(apiUrl)
        .then(res => {
            if (!res.ok) {
                throw new Error(`网络请求错误: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("首页数据加载成功，条数:", data.length);
            
            // 确保数据是数组
            if (!Array.isArray(data)) {
                throw new Error("返回数据不是数组");
            }
            
            // 如果返回数据为空
            if (data.length === 0) {
                memoDom.innerHTML = "<p class='empty-data'>未找到任何数据</p>";
                if (btn) btn.style.display = 'none';
                return;
            }
            
            // 更新HTML显示
            updateHTMl(data);
            
            // 如果返回的数据少于请求的限制，表示已经到底了
            if (data.length < limit) {
                handleNoMoreData();
            } else {
                // 恢复按钮状态
                if (btn) {
                    btn.textContent = '加载更多...';
                    btn.disabled = false;
                }
            }
        })
        .catch(err => {
            console.error("首页数据加载失败:", err);
            memoDom.innerHTML = `<p class="error-text">获取数据失败: ${err.message}</p>`;
            
            // 隐藏加载按钮
            if (btn) btn.style.display = 'none';
        });
}

// 预加载下一页数据 - 简化版本，保持向后兼容
function getNextList() {
    console.log("调用已废弃的getNextList函数，该函数已被内联替代");
    
    // 实际上我们不再需要此函数，但保留它以避免引用错误
    // 现在的做法是在加载更多按钮事件处理程序中直接获取数据
        return;
}

// 处理无更多数据的情况
function handleNoMoreData() {
    var btn = document.querySelector("button.button-load");
    if (btn) {
        btn.textContent = '已加载全部'; // 修改按钮文本
        btn.disabled = true; // 禁用按钮
        btnRemove = 1; // 标记按钮已移除
    }
}

// 更新 HTML 内容的函数
function updateHTMl(data) {
    // 确保数据是数组
    if (!Array.isArray(data)) {
        console.error("updateHTMl: 数据不是数组", data);
        return;
    }
    
    console.log("收到数据:", data.length, "条");
    
    // 如果是第一页，清空现有内容
    if (page === 1) {
        memoDom.innerHTML = "";
    }

    // 添加样式变量，设置头像URL
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --avatar-url: url(./assets/img/avatar.png);
        }
    `;
    if (!document.head.querySelector('style[data-avatar-style]')) {
        style.setAttribute('data-avatar-style', 'true');
        document.head.appendChild(style);
    }

    var memoResult = "";
    var resultAll = "";

    // 解析 TAG 标签，添加样式
    const TAG_REG = /#([^\s#]+?) /g;

    // 遍历数据并生成HTML
    if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            
            if (memo.APIVersion === 'legacy') {
                // 确保项目包含必要的字段
                if (!item || !item.content) {
                    console.warn("跳过无效的条目:", item);
                    continue;
                }
                
                var content = item.content || '';
                var creator = item.creatorName || memo.name;
                
                // console.log("处理项目:", item.id, "创建时间戳:", item.createdTs, "类型:", typeof item.createdTs);
                
                // 正确处理时间戳 - 检查是否需要乘以1000
                var timestamp = item.createdTs;
                if (typeof timestamp === 'number' && timestamp < 10000000000) { // 秒级时间戳需要乘以1000
                    timestamp = timestamp * 1000;
                }
                var date = new Date(timestamp);
                // console.log("转换后的日期对象:", date, "时间戳值:", timestamp);
                
                var uid = item.id; // 使用memo ID作为唯一标识
                
                // 格式化时间
                var timeString = getRelativeTime(date);
                
                // 处理内容中的标签
                content = content.replace(TAG_REG, "<span class='tag-span'><a rel='noopener noreferrer' href='#$1'>#$1</a></span>");
                
                // 使用Marked解析Markdown
                var parsedContent = marked.parse(content);
                
                // 生成唯一评论框ID
                const safeRelativeTime = timeString.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                const commenthost = `${safeRelativeTime}-${uid}`;
                
                // 处理资源（图片等）
                var resourceHTML = '';
                if (item.resourceList && item.resourceList.length > 0) {
                    var imgHTML = '';
                    var fileHTML = '';
                    
                    item.resourceList.forEach(resource => {
                        var resourceUrl = '';
                        
                        // 构建完整的资源URL
                        if (resource.externalLink) {
                            resourceUrl = resource.externalLink;
                        } else {
                            resourceUrl = `${memos}/o/r/${resource.id}/${resource.filename}`;
                        }
                        
                        // 根据资源类型处理
                        if (resource.type.startsWith('image/')) {
                            imgHTML += `<div class="img-container"><img src="${resourceUrl}" alt="${resource.filename}" loading="lazy" class="resource-img" /></div>`;
                        } else {
                            fileHTML += `<a href="${resourceUrl}" target="_blank" class="resource-link">${resource.filename}</a>`;
                        }
                    });
                    
                    // 添加资源HTML
                    if (imgHTML) {
                        resourceHTML += `<div class="images-wrapper">${imgHTML}</div>`;
                    }
                    if (fileHTML) {
                        resourceHTML += `<div class="files-wrapper">${fileHTML}</div>`;
                    }
                }
                
                // 构建HTML卡片
                memoResult += `
<li class="timeline">
    <div class="memos__content">
        <div class="memos__text">
            <div class="memos__userinfo">
                <div>${memo.name}</div>
                <div class="memos__id">@${memo.username}</div>
            </div>
            <p>${parsedContent}</p>
            ${resourceHTML}
        </div>
        <div class="memos__meta">
            <small class="memos__date">${timeString} • From「<a href="${memo.host}m/${uid}" target="_blank">Cflow</a>」</small>
        </div>
        <div id="comment-box-${commenthost}" class="comment-box" style="display: none;"></div>
    </div>
</li>`;
            } else {
                console.error("Unknown API version:", memo.APIVersion);
                return;
            }
        }
        
        resultAll = `<ul class="">${memoResult}</ul>`;
        memoDom.insertAdjacentHTML('beforeend', resultAll);
        
        // 初始化图片查看器
        if (window.ViewImage) {
            ViewImage.init('.memos img, .resource-img');
        }
    } else {
        // 处理空数据情况
        if (page === 1) {
            memoDom.innerHTML = "<p class='empty-data'>未找到任何数据</p>";
        }
    }
    
    // 绑定评论按钮事件
    document.querySelectorAll('.comment-button').forEach(button => {
        if (!button.hasAttribute('data-event-bound')) {
            button.setAttribute('data-event-bound', 'true');
            button.addEventListener('click', function() {
                const host = this.getAttribute('data-host');
                toggleCommentBox(host);
            });
        }
    });
    
    // 检查加载按钮状态
    checkLoadButtonStatus();
}

// 检查并重置加载按钮状态
function checkLoadButtonStatus() {
    var btn = document.querySelector("button.button-load");
    if (btn) {
        // 如果按钮处于禁用状态且不是已加载全部，就启用它
        if (btn.disabled && btn.textContent !== '已加载全部') {
            btn.disabled = false;
            btn.textContent = '加载更多...';
            console.log("强制重置按钮状态为可点击");
        }
    } else if (!btnRemove) {
        // 如果按钮不存在但应该存在，则重新添加
        memoDom.insertAdjacentHTML('afterend', load);
        
        // 重新绑定事件监听
        const newBtn = document.querySelector("button.button-load");
        if (newBtn) {
            newBtn.addEventListener('click', function() {
                console.log("点击重新添加的加载更多按钮");
                // 与原按钮事件处理逻辑相同
                const btn = this;
                
                // 如果按钮被禁用或标记为移除，忽略点击
                if (btn.disabled || btnRemove) {
                    return;
                }
                
                // 设置按钮为加载状态
                btn.textContent = '加载中...';
                btn.disabled = true;
                
                // 页码增加，计算新的偏移量
                page++;
                offset = limit * (page - 1);
                
                // 构建API请求URL
                var apiUrl;
                if (memo.APIVersion === 'legacy') {
                    apiUrl = `${memoUrl}&limit=${limit}&offset=${offset}`;
                    if (tag) {
                        apiUrl += `&tag=${tag}`;
                    }
                } else {
                    apiUrl = `${memoUrl}&pageSize=${limit}`;
                    if (nextPageToken) {
                        apiUrl += `&pageToken=${nextPageToken}`;
                    }
                }
                
                // 发送请求获取数据
                fetch(apiUrl)
                    .then(res => {
                        if (!res.ok) throw new Error(`网络请求错误: ${res.status}`);
                        return res.json();
                    })
                    .then(data => {
                        if (!Array.isArray(data)) throw new Error("返回数据不是数组");
                        
                        if (data.length === 0) {
                            handleNoMoreData();
                            return;
                        }
                        
                        updateHTMl(data);
                        
                        if (data.length < limit) {
                            handleNoMoreData();
                        } else {
                            btn.textContent = '加载更多...';
                            btn.disabled = false;
                        }
                    })
                    .catch(err => {
                        console.error("加载失败:", err);
                        btn.textContent = '加载更多...';
                        btn.disabled = false;
                    });
            });
        }
        
        console.log("重新添加加载更多按钮");
    }
}

// 标签选择
document.addEventListener('click', function (event) {
    var target = event.target;
    if (target.tagName.toLowerCase() === 'a' && target.getAttribute('href').startsWith('#')) {
        event.preventDefault();
        var tag = target.getAttribute('href').substring(1); // 获取标签名
        
        // 获取与标签相关的内容
        getTagFirstList(tag);
        
        // 显示过滤器
        var filterElem = document.getElementById('tag-filter');
        filterElem.style.display = 'block';    
        var tags = document.getElementById('tags');
        var tagresult = `Filter: <span class='tag-span'><a rel='noopener noreferrer' href=''>#${tag}</a></span>`;
        tags.innerHTML = tagresult;
        
        scrollTo(0, 0); // 回到顶部

        // 当前不是碎碎念页面，移除加载更多按钮
        if (!isMemosPage) {
            var btn = document.querySelector("button.button-load");
            if (btn) {
                btn.remove(); // 移除加载更多按钮
            }
        }
    }
});

function getTagFirstList(tag) { // 接收标签参数
    if (memo.APIVersion === 'new') {
        console.log('Could not list tag');
    } else if (memo.APIVersion === 'legacy') {
        page = 1;
        nextLength = 0;
        nextDom = [];
        memoDom.innerHTML = ""; // 清空现有内容
        
        // 构造请求 URL
        var memoUrl_tag = `${memoUrl}&limit=${limit}&tag=${tag}`;
        
        fetch(memoUrl_tag)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(resdata => {
                // 检查返回的数据
                if (!Array.isArray(resdata) || resdata.length === 0) {
                    memoDom.innerHTML = "<p>No content found for this tag.</p>";
                    return;
                }

                // 过滤数据
                const filteredData = resdata.filter(item => item.tags && item.tags.includes(tag));
                
                // 更新 HTML 内容
                updateHTMl(filteredData);
                
                var nowLength = filteredData.length;
                if (nowLength < limit) { // 返回数据条数小于 limit 则直接移除"加载更多"按钮
                    handleNoMoreData();
                    return;
                }
                page++;
                nextPageToken = resdata.nextPageToken; // 更新下一页的标识
                getNextList(); // 加载下一页数据
            })
            .catch(err => {
                console.error(err);
                memoDom.innerHTML = "<p>Error loading content.</p>";
            });
    } else {
        throw new Error('Invalid APIVersion');
    }
}

// 当前页数
let currentPage = 0;

// 切换评论框显示
function toggleCommentBox(host) {
    const commentBox = document.getElementById(`comment-box-${host}`);
    if (commentBox) {
        if (commentBox.style.display === "none") {
            // 关闭所有已打开的评论框
            document.querySelectorAll('.comment-box[style*="display: block"]').forEach(box => {
                if (box.id !== `comment-box-${host}`) {
                    box.style.display = "none";
                }
            });
            
            commentBox.style.display = "block";
            // 初始化 Waline 评论框
            initWaline(commentBox, host);
        } else {
            commentBox.style.display = "none";
        }
    }
}

// 初始化 Waline 评论框
function initWaline(container, host) {
    // 如果已经初始化，则不重复初始化
    if (container.querySelector('.waline')) return;
    
    const commentId = `waline-${host}`; // 使用 host 生成唯一 ID
    container.innerHTML = `<div id="${commentId}"></div>`;
    
    // 尝试使用 import 加载 Waline
    try {
        // 尝试使用 import
    import('https://unpkg.com/@waline/client@v3/dist/waline.js').then(({ init }) => {
        const uid = host.split('-').pop(); // 从 host 中提取 uid
        init({
            el: `#${commentId}`, // 使用生成的唯一 ID
                serverURL: 'https://ment.noisework.cn', //修改为你自己的地址，或者移除此处的评论功能
            meta: ['nick', 'mail', 'link'],
            requiredMeta: ['mail', 'nick'],
                pageview: false,
            search: false,
            wordLimit: 200,
            pageSize: 5,
            avatar: 'monsterid',
            emoji: [
                'https://unpkg.com/@waline/emojis@1.2.0/tieba',
            ],
            imageUploader: false,
            copyright: false,
            // 使用 path 参数来确保评论区的唯一性
            path: `/m/${uid}`, // 指向实际链接
        });
        }).catch(err => {
            console.error("Failed to load Waline:", err);
            container.innerHTML = `<div class="comment-error">评论加载失败，请刷新页面重试。</div>`;
        });
    } catch (error) {
        console.error("Error initializing Waline:", error);
        container.innerHTML = `<div class="comment-error">评论加载失败，请刷新页面重试。</div>`;
    }
}

// Images lightbox
window.ViewImage && ViewImage.init('.container img');

// Memos Total Start
// Get Memos total count
function getTotal() {
    let totalUrl;
    if (memo.APIVersion === 'new') {
        const filter = `creator=='users/${memo.creatorId}'&&visibilities==['PUBLIC']`;
        totalUrl = `${memos}/api/v1/memos?pageSize=1&pageToken=&&filter=${encodeURIComponent(filter)}`;
        fetch(totalUrl).then(res => res.json()).then(resdata => {
            if (resdata) {
                var allnums = resdata.memos.map(memo => {
                    const match = memo.name.match(/\d+/);
                    return match ? parseInt(match[0], 10) : null;
                }).filter(num => num !== null);
                // 不准确，但没有找到更好的办法获取总数
                var memosCount = document.getElementById('total');
                memosCount.innerHTML = allnums;
            }
        }).catch(err => {
            // Do something for an error here
            console.error("获取总数失败:", err);
            var memosCount = document.getElementById('total');
            memosCount.innerHTML = "获取失败";
        });
    } else if (memo.APIVersion === 'legacy') {
        // 尝试不同的接口获取总数
        // 方法1: 直接计算memos列表的长度
        totalUrl = memos + "/api/v1/memo?creatorId=" + memo.creatorId + "&rowStatus=NORMAL";
        fetch(totalUrl).then(res => res.json()).then(resdata => {
            if (resdata && Array.isArray(resdata)) {
                var allnums = resdata.length;
                var memosCount = document.getElementById('total');
                memosCount.innerHTML = allnums;
            } else {
                throw new Error("返回数据结构不正确");
            }
        }).catch(err => {
            console.error("方法1获取总数失败:", err);
            
            // 方法2: 尝试使用stats接口
            totalUrl = memos + "/api/v1/memo/stats?creatorId=" + memo.creatorId;
            fetch(totalUrl).then(res => res.json()).then(resdata => {
                if (resdata && Array.isArray(resdata)) {
                    var allnums = resdata.length;
                    var memosCount = document.getElementById('total');
                    memosCount.innerHTML = allnums;
                } else {
                    throw new Error("返回数据结构不正确");
                }
            }).catch(err => {
                console.error("方法2获取总数失败:", err);
                var memosCount = document.getElementById('total');
                memosCount.innerHTML = "获取失败";
            });
        });
    } else {
        throw new Error('Invalid APIVersion');
    }
};
if (memo.total === true) {
    window.onload = getTotal();
} else {
    var totalDiv = document.querySelector('div.total');
    if (totalDiv) {
        totalDiv.remove();
    }
}
// Relative Time Start
function getRelativeTime(date) {
    // 检查日期是否有效
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error("无效的日期对象:", date);
        return "未知时间";
    }

    // 确保使用正确的语言设置，默认为中文
    const language = memo.language || 'zh-CN';
    
    try {
        const rtf = new Intl.RelativeTimeFormat(language, { numeric: "auto", style: 'narrow' });

    const now = new Date();
    const diff = now - date;

        // 如果差异为负值或过大，可能是日期格式问题
        if (diff < 0 || diff > 5 * 365 * 24 * 60 * 60 * 1000) {
            console.warn("日期差异异常:", diff, "毫秒");
            // 回退到标准日期格式
            return formatDate(date);
        }

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
        return rtf.format(-years, 'year');
    } else if (months > 0) {
        return rtf.format(-months, 'month');
    } else if (days > 0) {
        return rtf.format(-days, 'day');
    } else if (hours > 0) {
        return rtf.format(-hours, 'hour');
    } else if (minutes > 0) {
        return rtf.format(-minutes, 'minute');
    } else {
        return rtf.format(-seconds, 'second');
        }
    } catch (e) {
        console.error("相对时间格式化错误:", e);
        return formatDate(date);
    }
}

// 添加格式化日期的辅助函数
function formatDate(date) {
    try {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return date.toLocaleDateString(memo.language || 'zh-CN', options);
    } catch (e) {
        console.error("日期格式化错误:", e);
        return date.toISOString().split('T')[0]; // 基本的日期格式 YYYY-MM-DD
    }
}
// Relative Time End

// Toggle Darkmode
const localTheme = window.localStorage && window.localStorage.getItem("theme");
const themeToggle = document.querySelector(".theme-toggle");

if (localTheme) {
    document.body.classList.remove("light-theme", "dark-theme");
    document.body.classList.add(localTheme);
}

themeToggle.addEventListener("click", () => {
    const themeUndefined = !new RegExp("(dark|light)-theme").test(document.body.className);
    const isOSDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (themeUndefined) {
        if (isOSDark) {
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.add("dark-theme");
        }
    } else {
        document.body.classList.toggle("light-theme");
        document.body.classList.toggle("dark-theme");
    }

    window.localStorage &&
        window.localStorage.setItem(
            "theme",
            document.body.classList.contains("dark-theme") ? "dark-theme" : "light-theme",
        );
});
//显隐按钮 - 修改为原生JavaScript  
function showReposBtn() {  
    try {
        var clientHeight = window.innerHeight;  
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;  
        var maxScroll = document.documentElement.scrollHeight - clientHeight;  
        
    //滚动距离超过可视一屏的距离时显示返回顶部按钮  
        var retopbtn = document.getElementById('retopbtn');
        if (retopbtn) {
            if (scrollTop > clientHeight) {  
                retopbtn.style.display = 'block';  
            } else {  
                retopbtn.style.display = 'none';  
            }
        }
        
    //滚动距离到达最底部时隐藏返回底部按钮  
        var rebtmbtn = document.getElementById('rebtmbtn');
        if (rebtmbtn) {
            if (scrollTop >= maxScroll) {  
                rebtmbtn.style.display = 'none';  
            } else {  
                rebtmbtn.style.display = 'block';  
            }
        }
    } catch (e) {
        console.error("显隐按钮错误:", e);
    }
}  
  
window.addEventListener('load', function() {
    // 显示按钮  
    showReposBtn();  
});
  
window.addEventListener('scroll', function() {
    // 滚动时调整按钮显隐  
    showReposBtn();  
});
  
//返回顶部  
function returnTop() {  
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}  
  
//返回底部  
function returnBottom() {  
    window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
    });
}  