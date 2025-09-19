// Memos Start

// 智能处理换行符，避免在代码块中插入&nbsp;
function processLineBreaks(content) {
    // 先保护代码块，避免在代码块中进行换行处理
    const codeBlocks = [];
    let protectedContent = content.replace(/```[\s\S]*?```/g, function(match) {
        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(match);
        return placeholder;
    });
    
    // 在非代码块内容中处理换行
    protectedContent = protectedContent.replace(/\n\n/g, "\n\n&nbsp;\n\n");
    
    // 恢复代码块
    codeBlocks.forEach((block, index) => {
        protectedContent = protectedContent.replace(`__CODE_BLOCK_${index}__`, block);
    });
    
    return protectedContent;
}

// 添加代码块复制功能
function addCodeBlockCopyButtons() {
    const codeBlocks = document.querySelectorAll('.memos__text pre');
    
    codeBlocks.forEach((pre, index) => {
        // 检查是否已经有复制按钮
        if (pre.querySelector('.copy-btn')) {
            return;
        }
        
        const code = pre.querySelector('code');
        if (!code) return;
        
        // 创建复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '复制';
        copyBtn.setAttribute('aria-label', '复制代码');
        
        // 添加复制功能
        copyBtn.addEventListener('click', async () => {
            try {
                const text = code.textContent || code.innerText;
                await navigator.clipboard.writeText(text);
                
                // 更新按钮状态
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '已复制';
                copyBtn.classList.add('copied');
                
                // 2秒后恢复原状
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
                // 降级方案：使用传统的复制方法
                const textArea = document.createElement('textarea');
                textArea.value = code.textContent || code.innerText;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    copyBtn.textContent = '已复制';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.textContent = '复制';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                } catch (fallbackErr) {
                    console.error('降级复制也失败:', fallbackErr);
                }
                document.body.removeChild(textArea);
            }
        });
        
        pre.appendChild(copyBtn);
    });
}

// 检测代码块语言并添加语言标识
function detectCodeLanguage(pre) {
    const code = pre.querySelector('code');
    if (!code) return;
    
    const text = code.textContent || code.innerText;
    const firstLine = text.split('\n')[0].trim();
    
    // 检测语言
    let language = '';
    if (firstLine.match(/^(javascript|js)$/i)) language = 'JavaScript';
    else if (firstLine.match(/^(python|py)$/i)) language = 'Python';
    else if (firstLine.match(/^(html)$/i)) language = 'HTML';
    else if (firstLine.match(/^(css)$/i)) language = 'CSS';
    else if (firstLine.match(/^(json)$/i)) language = 'JSON';
    else if (firstLine.match(/^(xml)$/i)) language = 'XML';
    else if (firstLine.match(/^(sql)$/i)) language = 'SQL';
    else if (firstLine.match(/^(bash|sh|shell)$/i)) language = 'Bash';
    else if (firstLine.match(/^(java)$/i)) language = 'Java';
    else if (firstLine.match(/^(cpp|c\+\+)$/i)) language = 'C++';
    else if (firstLine.match(/^(c)$/i)) language = 'C';
    else if (firstLine.match(/^(php)$/i)) language = 'PHP';
    else if (firstLine.match(/^(ruby|rb)$/i)) language = 'Ruby';
    else if (firstLine.match(/^(go)$/i)) language = 'Go';
    else if (firstLine.match(/^(rust|rs)$/i)) language = 'Rust';
    else if (firstLine.match(/^(typescript|ts)$/i)) language = 'TypeScript';
    else if (firstLine.match(/^(markdown|md)$/i)) language = 'Markdown';
    else if (firstLine.match(/^(yaml|yml)$/i)) language = 'YAML';
    else if (firstLine.match(/^(dockerfile)$/i)) language = 'Dockerfile';
    else if (firstLine.match(/^(nginx)$/i)) language = 'Nginx';
    else if (firstLine.match(/^(apache)$/i)) language = 'Apache';
    else if (firstLine.match(/^(vim|vimrc)$/i)) language = 'Vim';
    else if (firstLine.match(/^(diff|patch)$/i)) language = 'Diff';
    else if (firstLine.match(/^(ini|conf|config)$/i)) language = 'INI';
    else if (firstLine.match(/^(log)$/i)) language = 'Log';
    else if (firstLine.match(/^(plain|text|txt)$/i)) language = 'Plain Text';
    
    // 更新标题栏显示语言
    if (language) {
        pre.style.setProperty('--code-language', `"${language}"`);
        pre.setAttribute('data-language', language.toLowerCase());
    }
}

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
// 移除加载更多按钮
var isLoading = false; // 加载状态标志
var isMemosPage = true; // 默认在碎碎念页面

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 配置marked解析器，启用高亮语法
    if (typeof marked !== 'undefined') {
        // 添加高亮标记支持
        marked.use({
            extensions: [{
                name: 'highlight',
                level: 'inline',
                start(src) { return src.match(/==/)?.index; },
                tokenizer(src) {
                    const rule = /^==([^=]+)==/;
                    const match = rule.exec(src);
                    if (match) {
                        return {
                            type: 'highlight',
                            raw: match[0],
                            text: match[1].trim()
                        };
                    }
                    return false;
                },
                renderer(token) {
                    return `<mark>${token.text}</mark>`;
                }
            }]
        });
        
        console.log("Marked解析器配置完成，已启用高亮语法");
    }
    
    // 初始化 Mermaid
    if (typeof mermaid !== 'undefined') {
        // 配置 Mermaid
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'monospace',
            flowchart: {
                htmlLabels: true,
                curve: 'linear'
            },
            er: {
                layoutDirection: 'TB',
                minEntityWidth: 100,
                minEntityHeight: 75
            },
            gantt: {
                titleTopMargin: 25,
                barHeight: 20,
                barGap: 4,
                topPadding: 50,
                sidePadding: 75
            }
        });
        console.log("Mermaid 图表库初始化完成");
    }
    
if (memoDom) {
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
    
    // 移除加载按钮相关代码
    
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
                return;
            }
            
            // 更新HTML显示
            updateHTMl(data);
            
            // 如果返回的数据少于请求的限制，表示已经到底了
            if (data.length < limit) {
                handleNoMoreData();
            }
        })
        .catch(err => {
            console.error("首页数据加载失败:", err);
            memoDom.innerHTML = `<p class="error-text">获取数据失败: ${err.message}</p>`;
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
    // 移除加载更多按钮相关处理
    btnRemove = 1; // 标记按钮已移除
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
    
    // 检测是否为移动设备
    const isMobile = window.innerWidth <= 600;

    // 处理移动端头像显示
    const avatarHTML = isMobile ? '' : '<img class="avatar" src="./assets/img/avatar.png" alt="avatar" style="position: absolute; width: 40px; height: 40px; border-radius: 40px; left: -50px; top: 10px; border: 0; object-fit: cover;">';

    // 解析 TAG 标签，添加样式
    const TAG_REG = /#([^\s#]+?) /g;

    // 解析各种链接（链接标签格式）
    const BILIBILI_REG = /<a\shref="https:\/\/www\.bilibili\.com\/video\/((av[\d]{1,10})|(BV([\w]{10})))\/?">.*<\/a>/g;
    const QQMUSIC_REG = /<a\shref="https\:\/\/y\.qq\.com\/.*(\/[0-9a-zA-Z]+)(\.html)?".*?>.*?<\/a>/g;
    const QQVIDEO_REG = /<a\shref="https:\/\/v\.qq\.com\/.*\/([a-zA-Z0-9]+)\.html".*?>.*?<\/a>/g;
    const SPOTIFY_REG = /<a\shref="https:\/\/open\.spotify\.com\/(track|album)\/([\s\S]+)".*?>.*?<\/a>/g;
    const YOUKU_REG = /<a\shref="https:\/\/v\.youku\.com\/.*\/id_([a-zA-Z0-9=]+)\.html".*?>.*<\/a>/g;
    const YOUTUBE_REG = /<a\shref="https:\/\/(www\.youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})".*?>.*<\/a>/g;
    const NETEASE_MUSIC_REG = /<a\shref="https?:\/\/music\.163\.com\/.*?id=(\d+)<\/a>/g;

    // 解析纯文本链接（未包装在a标签中的链接）
    const TEXT_BILIBILI_REG = /https:\/\/www\.bilibili\.com\/video\/((av[\d]{1,10})|(BV[\w]{10}))\/?/g;
    const TEXT_YOUTUBE_REG = /https?:\/\/(www\.youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    const TEXT_QQMUSIC_REG = /https:\/\/y\.qq\.com\/.*\/([\w]+)(\.html)?/g;
    const TEXT_QQVIDEO_REG = /https:\/\/v\.qq\.com\/.*\/([a-zA-Z0-9]+)\.html/g;
    const TEXT_SPOTIFY_REG = /https:\/\/open\.spotify\.com\/(track|album)\/([\w]+)/g;
    const TEXT_YOUKU_REG = /https:\/\/v\.youku\.com\/.*\/id_([a-zA-Z0-9=]+)\.html/g;
    const TEXT_NETEASE_MUSIC_REG = /https?:\/\/music\.163\.com\/.*id=(\d+)/g;

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
                
                var uid = item.id; // 使用memo ID作为唯一标识
                
                // 使用绝对日期格式而不是相对时间
                var timeString = formatDate(date);
                
                // 保存相对时间用于ID生成
                var relativeTime = getRelativeTime(date);
                
                // 处理内容中的标签
                content = content.replace(TAG_REG, "<span class='tag-span'><a rel='noopener noreferrer' href='#$1'>#$1</a></span>");
                
                // 处理连续的换行，确保它们在HTML中得到保留（但不在代码块中）
                content = processLineBreaks(content);
                
                // 特殊处理单行换行，确保它们能够被正确呈现
                content = content.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");
                
                // 处理高亮语法，替换为HTML mark标签（即使marked不支持该功能也能工作）
                content = content.replace(/==([^=]+?)==/g, function(match, p1) {
                    // 检查这个高亮是否在代码块内，如果是则不处理
                    // 简单检测：如果前后有反引号，可能是代码块
                    const isInCode = /`[^`]*==/.test(content) && /==.*`/.test(content);
                    if (isInCode) {
                        return match; // 在代码块内，保持原样
                    }
                    return "<mark>" + p1 + "</mark>";
                });
                
                // 预处理 Mermaid 代码块，确保它们被正确标记
                content = preprocessMermaidBlocks(content);
                
                // 处理纯文本链接 - 在解析Markdown之前
                content = content
                    .replace(TEXT_BILIBILI_REG, function(match, id) {
                        // 检查捕获的ID是否是BV号
                        const bvid = id.startsWith('BV') ? id : (id.includes('BV') ? id.match(/BV[\w]{10}/)[0] : id);
                        return `<div class="video-wrapper"><iframe src="https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=${bvid}&as_wide=1&high_quality=1&danmaku=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="position:absolute;height:100%;width:100%;" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"></iframe></div>`;
                    })
                    .replace(TEXT_YOUTUBE_REG, '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/$2" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"></iframe></div>')
                    .replace(TEXT_NETEASE_MUSIC_REG, function(match) {
                        // 提取音乐ID
                        const idMatch = match.match(/id=(\d+)/);
                        if (idMatch && idMatch[1]) {
                            const musicId = idMatch[1];
                            return `<div class="music-wrapper"><meting-js auto="https://music.163.com/#/song?id=${musicId}"></meting-js></div>`;
                        }
                        return match; // 如果无法提取ID，保持原样
                    })
                    .replace(TEXT_QQMUSIC_REG, '<meting-js auto="https://y.qq.com/n/yqq/song/$1.html"></meting-js>')
                    .replace(TEXT_QQVIDEO_REG, '<div class="video-wrapper"><iframe src="//v.qq.com/iframe/player.html?vid=$1" allowFullScreen="true" frameborder="no" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"></iframe></div>')
                    .replace(TEXT_SPOTIFY_REG, '<div class="spotify-wrapper"><iframe style="border-radius:12px" src="https://open.spotify.com/embed/$1/$2?utm_source=generator&theme=0" width="100%" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"></iframe></div>')
                    .replace(TEXT_YOUKU_REG, '<div class="video-wrapper"><iframe src="https://player.youku.com/embed/$1" frameborder=0 allowfullscreen sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"></iframe></div>');
                
                // 使用Marked解析Markdown
                var parsedContent = marked.parse(content);
                
                // 修复解析后的HTML，确保空行正确显示
                parsedContent = parsedContent
                    .replace(/<p>&nbsp;<\/p>/g, '<p class="empty-line"></p>')
                    .replace(/<p><br><\/p>/g, '<p class="empty-line"></p>');
                
                // 去除首尾的空段落 - 更完善的正则表达式
                parsedContent = parsedContent
                    .replace(/^(<p[^>]*>\s*(&nbsp;|<br\s*\/?>)*\s*<\/p>)+/i, '') // 移除开头的空段落
                    .replace(/(<p[^>]*>\s*(&nbsp;|<br\s*\/?>)*\s*<\/p>)+$/i, ''); // 移除结尾的空段落
                
                // 处理已经是链接的视频
                parsedContent = parsedContent
                    .replace(BILIBILI_REG, "<div class='video-wrapper'><iframe src='https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=$1&as_wide=1&high_quality=1&danmaku=0' scrolling='no' border='0' frameborder='no' framespacing='0' allowfullscreen='true' style='position:absolute;height:100%;width:100%;' sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'></iframe></div>")
                    .replace(YOUTUBE_REG, "<div class='video-wrapper'><iframe src='https://www.youtube.com/embed/$2' title='YouTube video player' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'></iframe></div>")
                    .replace(NETEASE_MUSIC_REG, "<div class='music-wrapper'><meting-js auto='https://music.163.com/#/song?id=$1'></meting-js></div>")
                    .replace(QQMUSIC_REG, "<meting-js auto='https://y.qq.com/n/yqq/song$1.html'></meting-js>")
                    .replace(QQVIDEO_REG, "<div class='video-wrapper'><iframe src='//v.qq.com/iframe/player.html?vid=$1' allowFullScreen='true' frameborder='no' sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'></iframe></div>")
                    .replace(SPOTIFY_REG, "<div class='spotify-wrapper'><iframe style='border-radius:12px' src='https://open.spotify.com/embed/$1/$2?utm_source=generator&theme=0' width='100%' frameBorder='0' allowfullscreen='' allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture' loading='lazy' sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'></iframe></div>")
                    .replace(YOUKU_REG, "<div class='video-wrapper'><iframe src='https://player.youku.com/embed/$1' frameborder=0 allowfullscreen sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'></iframe></div>");

                // 生成唯一评论框ID，继续使用相对时间避免ID冲突
                const safeRelativeTime = relativeTime.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                const commenthost = `${safeRelativeTime}-${uid}`;
                
                // 处理资源（图片等）
                var resourceHTML = '';
                if (item.resourceList && item.resourceList.length > 0) {
                    var imgHTML = '';
                    var videoHTML = '';
                    var audioHTML = '';
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
                        } else if (resource.type.startsWith('video/')) {
                            videoHTML += `<div class="video-wrapper"><video src="${resourceUrl}" controls preload="metadata" class="resource-video" playsinline webkit-playsinline></video></div>`;
                        } else if (resource.type.startsWith('audio/')) {
                            audioHTML += `<div class="audio-wrapper"><audio src="${resourceUrl}" controls preload="metadata" class="resource-audio"></audio></div>`;
                        } else {
                            fileHTML += `<a href="${resourceUrl}" target="_blank" class="resource-link">${resource.filename}</a>`;
                        }
                    });
                    
                    // 添加资源HTML
                    if (imgHTML) {
                        resourceHTML += `<div class="images-wrapper">${imgHTML}</div>`;
                    }
                    if (videoHTML) {
                        resourceHTML += `<div class="videos-wrapper">${videoHTML}</div>`;
                    }
                    if (audioHTML) {
                        resourceHTML += `<div class="audios-wrapper">${audioHTML}</div>`;
                    }
                    if (fileHTML) {
                        resourceHTML += `<div class="files-wrapper">${fileHTML}</div>`;
                    }
                }
                
                // 构建HTML卡片
                memoResult += `
<li class="timeline">
    <div class="memos__content">
        ${avatarHTML}
        <div class="memos__text">
            <div class="memos__userinfo">
                <div>${memo.name}</div>
                <div class="memos__id">@${memo.username}</div>
            </div>${parsedContent.trim()}
            ${resourceHTML}
            <div class="memos__meta">
                <small class="memos__date">${timeString}</small>
                <small>From「<a href="${memo.host}m/${uid}" target="_blank">cflow</a>」</small>
            </div>
        </div>
        <div id="comment-box-${commenthost}" class="comment-box" style="display: none;"></div>
    </div>
</li>`;
            } else if (memo.APIVersion === 'new') {
                // 确保项目包含必要的字段
                if (!item || !item.content) {
                    console.warn("跳过无效的条目:", item);
                    continue;
                }
                
                var content = item.content || '';
                
                // 处理内容中的标签
                content = content.replace(TAG_REG, "<span class='tag-span'><a rel='noopener noreferrer' href='#$1'>#$1</a></span>");
                
                // 处理连续的换行，确保它们在HTML中得到保留（但不在代码块中）
                content = processLineBreaks(content);
                
                // 特殊处理单行换行，确保它们能够被正确呈现
                content = content.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");
                
                // 处理高亮语法，替换为HTML mark标签（即使marked不支持该功能也能工作）
                content = content.replace(/==([^=]+?)==/g, function(match, p1) {
                    // 检查这个高亮是否在代码块内，如果是则不处理
                    // 简单检测：如果前后有反引号，可能是代码块
                    const isInCode = /`[^`]*==/.test(content) && /==.*`/.test(content);
                    if (isInCode) {
                        return match; // 在代码块内，保持原样
                    }
                    return "<mark>" + p1 + "</mark>";
                });
                
                // 预处理 Mermaid 代码块，确保它们被正确标记
                content = preprocessMermaidBlocks(content);
                
                // 处理纯文本链接 - 在解析Markdown之前
                content = content
                    .replace(TEXT_BILIBILI_REG, function(match, id) {
                        // 检查捕获的ID是否是BV号
                        const bvid = id.startsWith('BV') ? id : (id.includes('BV') ? id.match(/BV[\w]{10}/)[0] : id);
                        return `<div class="video-wrapper"><iframe src="https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=${bvid}&as_wide=1&high_quality=1&danmaku=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="position:absolute;height:100%;width:100%;" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"></iframe></div>`;
                    })
                    .replace(TEXT_YOUTUBE_REG, '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/$2" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"></iframe></div>')
                    .replace(TEXT_NETEASE_MUSIC_REG, function(match) {
                        // 提取音乐ID
                        const idMatch = match.match(/id=(\d+)/);
                        if (idMatch && idMatch[1]) {
                            const musicId = idMatch[1];
                            return `<div class="music-wrapper"><meting-js auto="https://music.163.com/#/song?id=${musicId}"></meting-js></div>`;
                        }
                        return match; // 如果无法提取ID，保持原样
                    })
                    .replace(TEXT_QQMUSIC_REG, '<meting-js auto="https://y.qq.com/n/yqq/song/$1.html"></meting-js>')
                    .replace(TEXT_QQVIDEO_REG, '<div class="video-wrapper"><iframe src="//v.qq.com/iframe/player.html?vid=$1" allowFullScreen="true" frameborder="no" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"></iframe></div>')
                    .replace(TEXT_SPOTIFY_REG, '<div class="spotify-wrapper"><iframe style="border-radius:12px" src="https://open.spotify.com/embed/$1/$2?utm_source=generator&theme=0" width="100%" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"></iframe></div>')
                    .replace(TEXT_YOUKU_REG, '<div class="video-wrapper"><iframe src="https://player.youku.com/embed/$1" frameborder=0 allowfullscreen sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"></iframe></div>');
                
                // 使用Marked解析Markdown
                var parsedContent = marked.parse(content);
                
                // 修复解析后的HTML，确保空行正确显示
                parsedContent = parsedContent
                    .replace(/<p>&nbsp;<\/p>/g, '<p class="empty-line"></p>')
                    .replace(/<p><br><\/p>/g, '<p class="empty-line"></p>');
                
                // 去除首尾的空段落 - 更完善的正则表达式
                parsedContent = parsedContent
                    .replace(/^(<p[^>]*>\s*(&nbsp;|<br\s*\/?>)*\s*<\/p>)+/i, '') // 移除开头的空段落
                    .replace(/(<p[^>]*>\s*(&nbsp;|<br\s*\/?>)*\s*<\/p>)+$/i, ''); // 移除结尾的空段落
                
                // 处理已经是链接的视频
                parsedContent = parsedContent
                    .replace(BILIBILI_REG, "<div class='video-wrapper'><iframe src='https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=$1&as_wide=1&high_quality=1&danmaku=0' scrolling='no' border='0' frameborder='no' framespacing='0' allowfullscreen='true' style='position:absolute;height:100%;width:100%;' sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'></iframe></div>")
                    .replace(YOUTUBE_REG, "<div class='video-wrapper'><iframe src='https://www.youtube.com/embed/$2' title='YouTube video player' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'></iframe></div>")
                    .replace(NETEASE_MUSIC_REG, "<div class='music-wrapper'><meting-js auto='https://music.163.com/#/song?id=$1'></meting-js></div>")
                    .replace(QQMUSIC_REG, "<meting-js auto='https://y.qq.com/n/yqq/song$1.html'></meting-js>")
                    .replace(QQVIDEO_REG, "<div class='video-wrapper'><iframe src='//v.qq.com/iframe/player.html?vid=$1' allowFullScreen='true' frameborder='no' sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'></iframe></div>")
                    .replace(SPOTIFY_REG, "<div class='spotify-wrapper'><iframe style='border-radius:12px' src='https://open.spotify.com/embed/$1/$2?utm_source=generator&theme=0' width='100%' frameBorder='0' allowfullscreen='' allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture' loading='lazy' sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'></iframe></div>")
                    .replace(YOUKU_REG, "<div class='video-wrapper'><iframe src='https://player.youku.com/embed/$1' frameborder=0 allowfullscreen sandbox='allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'></iframe></div>");
                
                // 创建日期和UID
                var createTime = new Date(item.createTime);
                var uid = item.id;
                
                // 格式化时间
                var timeString = formatDate(createTime);
                var relativeTime = getRelativeTime(createTime);
                
                // 生成唯一评论框ID
                const safeRelativeTime = relativeTime.replace(/\s+/g, '-').replace(/[^\w-]/g, ''); 
                const commenthost = `${safeRelativeTime}-${uid}`;
                
                // 处理资源（图片等）
                var resourceHTML = '';
                if (item.resources && item.resources.length > 0) {
                    var imgHTML = '';
                    var videoHTML = '';
                    var audioHTML = '';
                    var fileHTML = '';
                    
                    item.resources.forEach(resource => {
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
                        } else if (resource.type.startsWith('video/')) {
                            videoHTML += `<div class="video-wrapper"><video src="${resourceUrl}" controls preload="metadata" class="resource-video" playsinline webkit-playsinline></video></div>`;
                        } else if (resource.type.startsWith('audio/')) {
                            audioHTML += `<div class="audio-wrapper"><audio src="${resourceUrl}" controls preload="metadata" class="resource-audio"></audio></div>`;
                        } else {
                            fileHTML += `<a href="${resourceUrl}" target="_blank" class="resource-link">${resource.filename}</a>`;
                        }
                    });
                    
                    // 添加资源HTML
                    if (imgHTML) {
                        resourceHTML += `<div class="images-wrapper">${imgHTML}</div>`;
                    }
                    if (videoHTML) {
                        resourceHTML += `<div class="videos-wrapper">${videoHTML}</div>`;
                    }
                    if (audioHTML) {
                        resourceHTML += `<div class="audios-wrapper">${audioHTML}</div>`;
                    }
                    if (fileHTML) {
                        resourceHTML += `<div class="files-wrapper">${fileHTML}</div>`;
                    }
                }
                
                // 构建HTML卡片
                memoResult += `
<li class="timeline">
    <div class="memos__content">
        ${avatarHTML}
        <div class="memos__text">
            <div class="memos__userinfo">
                <div>${memo.name}</div>
                <div class="memos__id">@${memo.username}</div>
            </div>${parsedContent.trim()}
            ${resourceHTML}
            <div class="memos__meta">
                <small class="memos__date">${timeString}</small>
                <small>From「<a href="${memo.host}m/${uid}" target="_blank">cflow</a>」</small>
            </div>
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
        
        // 处理首尾多余空行
        removeExtraEmptyParagraphs();
        
        // 处理 Mermaid 图表
        processMermaidCharts();
        
        // 优化代码块显示
        setTimeout(() => {
            addCodeBlockCopyButtons();
            // 检测代码块语言
            document.querySelectorAll('.memos__text pre').forEach(detectCodeLanguage);
        }, 100);
        
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
    
    // 移除加载按钮状态检查
}

// 移除加载按钮状态检查函数

// 标签选择
document.addEventListener('click', function (event) {
    var target = event.target;
    
    // 处理标签点击
    if (target.tagName.toLowerCase() === 'a' && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
        event.preventDefault();
        var tag = target.getAttribute('href').substring(1); // 获取标签名
        
        console.log(`点击标签: #${tag}`);
        
        // 处理清除筛选的情况
        if (target.closest('#tag-filter') && !tag) {
            // 点击了Filter区域里的清除标签
            console.log('清除标签筛选');
            
            // 重置标签和页面状态
            tag = '';
            page = 1;
            
            // 隐藏标签筛选器
            var filterElem = document.getElementById('tag-filter');
            filterElem.style.display = 'none';
            
            // 重新加载所有内容
            getFirstList();
            
            return;
        }
        
        // 获取与标签相关的内容
        getTagFirstList(tag);
        
        // 显示过滤器
        var filterElem = document.getElementById('tag-filter');
        filterElem.style.display = 'block';    
        var tags = document.getElementById('tags');
        var tagresult = `Filter: <span class='tag-span'><a rel='noopener noreferrer' href=''>#${tag}</a></span> <span class="clear-filter">[<a href="" onclick="event.preventDefault(); clearTagFilter();">清除</a>]</span>`;
        tags.innerHTML = tagresult;
        
        scrollTo(0, 0); // 回到顶部

        // 移除加载更多按钮相关处理
    }
});

// 添加清除标签筛选的函数
function clearTagFilter() {
    console.log('清除标签筛选');
    
    // 重置标签和页面状态
    tag = '';
    page = 1;
    
    // 隐藏标签筛选器
    var filterElem = document.getElementById('tag-filter');
    if (filterElem) {
        filterElem.style.display = 'none';
    }
    
    // 重新加载所有内容
    getFirstList();
}

function getTagFirstList(tag) { // 接收标签参数
    console.log(`尝试获取标签: "${tag}"的内容`);
    
    if (memo.APIVersion === 'new') {
        console.log('新版API不支持标签筛选');
        memoDom.innerHTML = "<p>当前API版本不支持标签筛选功能</p>";
    } else if (memo.APIVersion === 'legacy') {
        page = 1;
        nextLength = 0;
        nextDom = [];
        memoDom.innerHTML = "<p class='loading'>正在加载标签内容...</p>"; // 显示加载中
        
        // 构造请求 URL，注意这里不使用tag参数，因为我们需要在客户端处理
        var memoUrl_tag = `${memoUrl}&limit=50`; // 增加limit值以提高一次性获取的内容
        
        console.log(`发送请求: ${memoUrl_tag}`);
        
        fetch(memoUrl_tag)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`网络请求失败: ${res.status}`);
                }
                return res.json();
            })
            .then(resdata => {
                // 检查返回的数据
                if (!Array.isArray(resdata) || resdata.length === 0) {
                    memoDom.innerHTML = "<p class='empty-data'>未找到任何标签内容</p>";
                    return;
                }

                console.log(`获取到 ${resdata.length} 条数据，开始筛选标签: "${tag}"`);

                // 改进的标签过滤逻辑
                let filteredData = [];
                
                // 先尝试使用服务器返回的tags字段
                filteredData = resdata.filter(item => {
                    // 检查是否有tags字段
                    if (item.tags && Array.isArray(item.tags)) {
                        return item.tags.some(t => t === tag);
                    }
                    
                    // 如果没有tags字段，尝试从content中解析
                    if (item.content) {
                        // 查找标签格式 #标签名 
                        const tagRegex = new RegExp(`#(${tag})[\\s\\n]`, 'i');
                        return tagRegex.test(item.content);
                    }
                    
                    return false;
                });
                
                // 如果没有找到项目，可能是格式问题，尝试更宽松的匹配
                if (filteredData.length === 0) {
                    filteredData = resdata.filter(item => {
                        if (item.content) {
                            // 更宽松的标签匹配
                            return item.content.includes(`#${tag}`);
                        }
                        return false;
                    });
                }
                
                console.log(`筛选后得到 ${filteredData.length} 条匹配数据`);
                
                if (filteredData.length === 0) {
                    memoDom.innerHTML = `<p class='empty-data'>未找到包含标签 "#${tag}" 的内容</p>`;
                    return;
                }
                
                // 清空加载中的提示
                memoDom.innerHTML = "";
                
                // 更新 HTML 内容
                updateHTMl(filteredData);
                
                // 如果匹配结果较少，隐藏加载更多按钮
                if (filteredData.length < 10) {
                    handleNoMoreData();
                } else {
                    // 设置标签，以备后续加载
                    tag = tag;
                    
                    // 移除加载按钮状态恢复
                    
                    page++;
                }
            })
            .catch(err => {
                console.error("加载标签内容失败:", err);
                memoDom.innerHTML = `<p class='error-text'>加载失败: ${err.message}</p>`;
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
        // 格式化为 "2025年03月18日 09:20:22" 格式
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
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
        
    // 主题切换后重新渲染 Mermaid 图表
    if (typeof mermaid !== 'undefined') {
        try {
            // 设置新主题
            const isDark = document.body.classList.contains("dark-theme");
            mermaid.initialize({
                theme: isDark ? 'dark' : 'default'
            });
            // 重新渲染所有图表
            setTimeout(() => {
                processMermaidCharts();
            }, 300);
        } catch (error) {
            console.error("主题切换后重新渲染 Mermaid 图表失败:", error);
        }
    }
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

// 新增处理首尾多余空行的辅助函数
function removeExtraEmptyParagraphs() {
    // 处理所有memo卡片
    document.querySelectorAll('.memos__text').forEach(textDiv => {
        // 移除第一个空段落(如果存在)
        const firstChild = textDiv.firstElementChild;
        if (firstChild && (firstChild.classList.contains('empty-line') || 
                          firstChild.innerHTML === '&nbsp;' || 
                          firstChild.innerHTML === '<br>' || 
                          !firstChild.innerHTML.trim())) {
            firstChild.remove();
        }
        
        // 移除最后一个空段落(如果存在)
        const lastChild = textDiv.lastElementChild;
        if (lastChild && lastChild.tagName === 'P' && 
            (lastChild.classList.contains('empty-line') || 
             lastChild.innerHTML === '&nbsp;' || 
             lastChild.innerHTML === '<br>' || 
             !lastChild.innerHTML.trim())) {
            // 确保不是用户信息或元数据区域
            if (!lastChild.classList.contains('memos__userinfo') && 
                !lastChild.classList.contains('memos__meta')) {
                lastChild.remove();
            }
        }
    });
}  

// 处理 Mermaid 图表的函数
function processMermaidCharts() {
    // 查找所有的 pre > code.language-mermaid 元素
    const mermaidCodeBlocks = document.querySelectorAll('pre > code.language-mermaid, pre > code.mermaid');
    
    if (mermaidCodeBlocks.length === 0) return;
    
    console.log(`找到 ${mermaidCodeBlocks.length} 个 Mermaid 图表，开始处理...`);
    
    mermaidCodeBlocks.forEach((codeBlock, index) => {
        const pre = codeBlock.parentNode;
        if (!pre) return;
        
        // 提取 Mermaid 代码
        const mermaidCode = codeBlock.textContent;
        if (!mermaidCode.trim()) return;
        
        // 创建一个新的 div 用于渲染图表
        const chartId = `mermaid-chart-${Date.now()}-${index}`;
        const chartDiv = document.createElement('div');
        chartDiv.id = chartId;
        chartDiv.className = 'mermaid';
        chartDiv.innerHTML = mermaidCode;
        
        // 替换原来的 pre 元素
        pre.parentNode.replaceChild(chartDiv, pre);
    });
    
    // 重新渲染所有 Mermaid 图表
    if (typeof mermaid !== 'undefined') {
        try {
            mermaid.init(undefined, '.mermaid');
            console.log("Mermaid 图表渲染完成");
        } catch (error) {
            console.error("Mermaid 渲染错误:", error);
        }
    }
}

// 在解析 Markdown 前检测 Mermaid 代码块，确保它们被正确标记
function preprocessMermaidBlocks(content) {
    // 查找 Markdown 中的 Mermaid 代码块
    return content.replace(/```\s*(mermaid)\s*\n([\s\S]*?)```/g, function(match, language, code) {
        // 返回添加了正确语言标记的代码块
        return '```mermaid\n' + code + '```';
    });
}  