/**
 * 处理cflow嵌入HTML内容
 * 自定义处理函数
 */

// 在DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取URL参数，检查是否有卡片ID
    const urlParams = new URLSearchParams(window.location.search);
    const memoId = urlParams.get('id');
    
    // 添加返回全部卡片的按钮
    function addBackButton() {
        // 检查是否已添加
        if (!document.querySelector('.back-to-all')) {
            const memosContainer = document.getElementById('memos');
            if (memosContainer) {
                const backButton = document.createElement('button');
                backButton.className = 'back-to-all nav-button';
                backButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill='#ffffff' width='16' height='16' viewBox="0 0 16 16">
                        <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                    </svg>
                    返回全部
                `;
                backButton.style.marginBottom = '15px';
                backButton.addEventListener('click', function() {
                    // 移除URL参数并刷新页面
                    const url = new URL(window.location.href);
                    url.search = '';
                    window.location.href = url.toString();
                });
                
                // 添加到memos容器前面
                memosContainer.parentNode.insertBefore(backButton, memosContainer);
                
                // 确保激活说说页面
                showPage('memos');
            }
        }
    }
    
    // 如果URL中有卡片ID参数，显示单个卡片
    if (memoId) {
        console.log('找到卡片ID参数:', memoId);
        // 添加返回按钮
        setTimeout(addBackButton, 500);
        
        // 过滤显示单个卡片的函数
        window.filterSingleMemo = function(memoId) {
            const memoItems = document.querySelectorAll('.timeline');
            let foundMemo = false;
            
            memoItems.forEach(function(item) {
                const meta = item.querySelector('.memos__meta');
                if (meta) {
                    const link = meta.querySelector('a[href*="/m/"]');
                    if (link) {
                        const href = link.getAttribute('href');
                        const id = href.split('/').pop();
                        
                        // 如果不是目标卡片，隐藏
                        if (id !== memoId) {
                            item.style.display = 'none';
                        } else {
                            item.style.display = '';
                            foundMemo = true;
                        }
                    }
                }
            });
            
            // 隐藏"加载更多"按钮
            const loadMoreBtn = document.querySelector('.button-load');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
            
            return foundMemo;
        };
        
        // 添加过滤逻辑到updateHTMl函数之后
        const originalUpdateHTMl = window.updateHTMl;
        if (typeof originalUpdateHTMl === 'function') {
            window.updateHTMl = function(data) {
                console.log('劫持updateHTMl函数:', data ? data.length : 'no data');
                
                // 处理每个memo的content字段
                if (Array.isArray(data)) {
                    for (let i = 0; i < data.length; i++) {
                        if (data[i] && data[i].content) {
                            // 应用嵌入内容处理
                            let processedContent = window.processEmbeddedHTML(data[i].content);
                            
                            // 输出处理前后的内容（用于调试）
                            if (data[i].content !== processedContent) {
                                console.log('处理前:', data[i].content);
                                console.log('处理后:', processedContent);
                            }
                            
                            data[i].content = processedContent;
                        }
                    }
                }
                
                // 调用原始updateHTMl函数处理数据
                originalUpdateHTMl(data);
                
                // 在更新完DOM后，修复视频iframe
                setTimeout(function() {
                    // 修复B站视频iframe
                    const iframes = document.querySelectorAll('iframe[src*="player.bilibili.com"]');
                    iframes.forEach(function(iframe) {
                        let src = iframe.getAttribute('src');
                        if (src.startsWith('//')) {
                            src = 'https:' + src;
                            iframe.setAttribute('src', src);
                        }
                        
                        // 添加移动端兼容的参数
                        if (src.indexOf('as_wide=') === -1) {
                            src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'as_wide=1&high_quality=1&danmaku=0';
                            iframe.setAttribute('src', src);
                        }
                        
                        // 确保iframe在正确的容器中
                        const parent = iframe.parentElement;
                        if (!parent.classList.contains('video-wrapper')) {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'video-wrapper';
                            parent.insertBefore(wrapper, iframe);
                            wrapper.appendChild(iframe);
                        }
                    });
                    
                    // 处理本地上传的视频
                    const videoElements = document.querySelectorAll('video.resource-video');
                    videoElements.forEach(function(video) {
                        // 确保视频有控制条
                        if (!video.hasAttribute('controls')) {
                            video.setAttribute('controls', '');
                        }
                        // 确保使用元数据预加载
                        if (!video.hasAttribute('preload')) {
                            video.setAttribute('preload', 'metadata');
                        }
                        
                        // 确保视频在正确的容器中
                        const parent = video.parentElement;
                        if (!parent.classList.contains('video-wrapper')) {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'video-wrapper';
                            parent.insertBefore(wrapper, video);
                            wrapper.appendChild(video);
                        }
                    });
                    
                    // 处理本地上传的音频
                    const audioElements = document.querySelectorAll('audio.resource-audio');
                    audioElements.forEach(function(audio) {
                        // 确保音频有控制条
                        if (!audio.hasAttribute('controls')) {
                            audio.setAttribute('controls', '');
                        }
                        // 确保使用元数据预加载
                        if (!audio.hasAttribute('preload')) {
                            audio.setAttribute('preload', 'metadata');
                        }
                        
                        // 设置音频样式
                        audio.style.width = '100%';
                        audio.style.borderRadius = '8px';
                        audio.style.backgroundColor = document.body.classList.contains('dark-theme') ? '#2d333b' : '#f5f5f5';
                    });
                    
                    // 为新添加的memo添加卡片编号
                    addCardNumbers();
                }, 100);
            };
            console.log('成功劫持updateHTMl函数');
        } else {
            console.error('原始updateHTMl函数不存在，在main.js加载完成后才能劫持此函数');
            
            // 如果原始函数不可用，尝试延迟劫持
            const checkInterval = setInterval(function() {
                if (typeof window.updateHTMl === 'function') {
                    const originalFn = window.updateHTMl;
                    window.updateHTMl = function(data) {
                        console.log('延迟劫持updateHTMl函数:', data ? data.length : 'no data');
                        
                        // 处理每个memo的content字段
                        if (Array.isArray(data)) {
                            for (let i = 0; i < data.length; i++) {
                                if (data[i] && data[i].content) {
                                    // 应用嵌入内容处理
                                    data[i].content = window.processEmbeddedHTML(data[i].content);
                                }
                            }
                        }
                        
                        // 调用原始函数
                        originalFn(data);
                        
                        // 在更新完DOM后，修复视频iframe和添加卡片编号
                        setTimeout(function() {
                            // 修复B站视频iframe
                            const iframes = document.querySelectorAll('iframe[src*="player.bilibili.com"]');
                            iframes.forEach(function(iframe) {
                                let src = iframe.getAttribute('src');
                                if (src.startsWith('//')) {
                                    src = 'https:' + src;
                                    iframe.setAttribute('src', src);
                                }
                                
                                // 添加移动端兼容的参数
                                if (src.indexOf('as_wide=') === -1) {
                                    src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'as_wide=1&high_quality=1&danmaku=0';
                                    iframe.setAttribute('src', src);
                                }
                                
                                // 确保iframe在正确的容器中
                                const parent = iframe.parentElement;
                                if (!parent.classList.contains('video-wrapper')) {
                                    const wrapper = document.createElement('div');
                                    wrapper.className = 'video-wrapper';
                                    parent.insertBefore(wrapper, iframe);
                                    wrapper.appendChild(iframe);
                                }
                            });
                            
                            // 处理本地上传的视频
                            const videoElements = document.querySelectorAll('video.resource-video');
                            videoElements.forEach(function(video) {
                                // 确保视频有控制条
                                if (!video.hasAttribute('controls')) {
                                    video.setAttribute('controls', '');
                                }
                                // 确保使用元数据预加载
                                if (!video.hasAttribute('preload')) {
                                    video.setAttribute('preload', 'metadata');
                                }
                                
                                // 确保视频在正确的容器中
                                const parent = video.parentElement;
                                if (!parent.classList.contains('video-wrapper')) {
                                    const wrapper = document.createElement('div');
                                    wrapper.className = 'video-wrapper';
                                    parent.insertBefore(wrapper, video);
                                    wrapper.appendChild(video);
                                }
                            });
                            
                            // 处理本地上传的音频
                            const audioElements = document.querySelectorAll('audio.resource-audio');
                            audioElements.forEach(function(audio) {
                                // 确保音频有控制条
                                if (!audio.hasAttribute('controls')) {
                                    audio.setAttribute('controls', '');
                                }
                                // 确保使用元数据预加载
                                if (!audio.hasAttribute('preload')) {
                                    audio.setAttribute('preload', 'metadata');
                                }
                                
                                // 设置音频样式
                                audio.style.width = '100%';
                                audio.style.borderRadius = '8px';
                                audio.style.backgroundColor = document.body.classList.contains('dark-theme') ? '#2d333b' : '#f5f5f5';
                            });
                            
                            // 为新添加的memo添加卡片编号
                            addCardNumbers();
                        }, 100);
                    };
                    console.log('成功延迟劫持updateHTMl函数');
                    clearInterval(checkInterval);
                }
            }, 100);
        }
    }
    
    // 处理嵌入HTML内容
    window.processEmbeddedHTML = function(content) {
        if (!content) return content;
        
        // 处理HTML代码块，与cflow使用的格式一致
        const htmlCodeBlockRegex = /```__html\s*\n([\s\S]*?)\n```/g;
        
        return content.replace(htmlCodeBlockRegex, function(match, htmlContent) {
            console.log('处理HTML代码块:', htmlContent);
            
            // 解析B站视频iframe - 匹配所有可能的B站视频iframe格式
            const bilibiliRegex = /<iframe.+?src=["'](?:https?:)?\/\/player\.bilibili\.com\/player\.html\?(.+?)["'].+?<\/iframe>/g;
            
            // 检查是否包含B站视频iframe
            if (bilibiliRegex.test(htmlContent)) {
                // 重置正则表达式的lastIndex
                bilibiliRegex.lastIndex = 0;
                
                // 替换B站视频iframe为视频容器 - 超级简化版，减少嵌套层级
                htmlContent = htmlContent.replace(bilibiliRegex, function(match, params) {
                    console.log('识别到Bilibili视频，参数:', params);
                    
                    // 提取视频ID (bvid或aid)
                    let bvid = '';
                    let aid = '';
                    let cid = '';
                    let page = '1';
                    
                    // 解析参数
                    params.split('&').forEach(function(param) {
                        const [key, value] = param.split('=');
                        if (key === 'bvid') bvid = value;
                        if (key === 'aid') aid = value;
                        if (key === 'cid') cid = value;
                        if (key === 'p') page = value;
                    });
                    
                    // 移动端友好的视频容器 - 使用更直接的样式和属性
                    return `<div style="position:relative;width:100%;height:0;padding-bottom:56.25%;margin:10px 0;background-color:#000;display:block;overflow:hidden;z-index:2">
<iframe src="https://player.bilibili.com/player.html?${params}&as_wide=1&high_quality=1&danmaku=0&autoplay=0" 
allowfullscreen="true" frameborder="0" scrolling="no" 
sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"
style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;min-height:200px;display:block !important;visibility:visible !important"></iframe>
</div>`;
                });
                
                return htmlContent;
            }
            
            // 如果不是B站视频，则完整保留原始HTML
            return `<div class="embedded-html">${htmlContent}</div>`;
        });
    };
    
    // 直接修改marked处理器，确保HTML代码块被正确处理
    if (window.marked && typeof window.marked.parse === 'function') {
        // 保存原始parse函数
        const originalParse = window.marked.parse;
        
        // 重写parse函数
        window.marked.parse = function(content, options) {
            // 首先处理HTML代码块
            if (content && typeof content === 'string') {
                content = window.processEmbeddedHTML(content);
            }
            
            // 然后调用原始的parse函数
            return originalParse.call(window.marked, content, options);
        };
        console.log('成功修改marked.parse函数以处理HTML代码块');
    }
    
    // 修复静态页面中的已渲染视频
    setTimeout(function() {
        // 查找页面中所有的视频iframe
        const iframes = document.querySelectorAll('iframe[src*="player.bilibili.com"]');
        console.log('发现B站视频iframe:', iframes.length);
        
        iframes.forEach(function(iframe) {
            // 获取当前src
            let src = iframe.getAttribute('src');
            
            // 如果src以//开头，添加https:
            if (src && src.startsWith('//')) {
                src = 'https:' + src;
                iframe.setAttribute('src', src);
                console.log('修复视频URL:', src);
            }
            
            // 添加移动端兼容的参数
            if (src && src.indexOf('as_wide=') === -1) {
                src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'as_wide=1&high_quality=1&danmaku=0&autoplay=0';
                iframe.setAttribute('src', src);
                console.log('添加移动端兼容参数:', src);
            }
            
            // 设置关键iframe属性
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('sandbox', 'allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups');
            
            // 强制应用内联样式确保显示
            iframe.style.position = 'absolute';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = '0';
            iframe.style.minHeight = '200px';
            iframe.style.display = 'block';
            iframe.style.visibility = 'visible';
            iframe.style.opacity = '1';
            iframe.style.zIndex = '2';
            
            // 确保父元素有正确的样式
            const parent = iframe.parentElement;
            
            // 重新包装为新的容器确保样式正确
            if (parent) {
                // 创建新的视频容器，确保干净的样式环境
                const wrapper = document.createElement('div');
                
                // 强制应用内联样式
                wrapper.style.position = 'relative';
                wrapper.style.width = '100%';
                wrapper.style.height = '0';
                wrapper.style.paddingBottom = '56.25%';
                wrapper.style.overflow = 'hidden';
                wrapper.style.backgroundColor = '#000';
                wrapper.style.margin = '10px 0';
                wrapper.style.display = 'block';
                wrapper.style.visibility = 'visible';
                wrapper.style.zIndex = '2';
                
                // 注入到DOM（如果不是video-wrapper的直接子元素）
                if (!parent.classList.contains('video-wrapper')) {
                    parent.insertBefore(wrapper, iframe);
                    wrapper.appendChild(iframe);
                    console.log('创建移动端优化的视频容器');
                } else {
                    // 如果父元素是video-wrapper，直接应用样式
                    Object.assign(parent.style, {
                        position: 'relative',
                        width: '100%',
                        height: '0',
                        paddingBottom: '56.25%',
                        overflow: 'hidden',
                        backgroundColor: '#000',
                        margin: '10px 0',
                        display: 'block',
                        visibility: 'visible',
                        zIndex: '2'
                    });
                }
            }
        });

        // 处理本地视频元素
        const videoElements = document.querySelectorAll('video.resource-video');
        console.log('发现本地视频元素:', videoElements.length);
        
        videoElements.forEach(function(video) {
            // 确保视频元素有正确的属性
            if (!video.hasAttribute('controls')) {
                video.setAttribute('controls', '');
            }
            if (!video.hasAttribute('preload')) {
                video.setAttribute('preload', 'metadata');
            }
            
            // 确保父元素有正确的样式
            const parent = video.parentElement;
            if (parent && parent.classList.contains('video-wrapper')) {
                // 检查video-wrapper是否有正确的样式
                if (window.getComputedStyle(parent).position !== 'relative') {
                    parent.style.position = 'relative';
                    parent.style.paddingBottom = '56.25%';
                    parent.style.height = '0';
                    parent.style.overflow = 'hidden';
                    parent.style.maxWidth = '100%';
                    parent.style.margin = '10px 0';
                    parent.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
                    parent.style.borderRadius = '4px';
                    
                    // 给视频添加样式
                    video.style.position = 'absolute';
                    video.style.top = '0';
                    video.style.left = '0';
                    video.style.width = '100%';
                    video.style.height = '100%';
                    video.style.border = '0';
                    
                    console.log('修复本地视频容器样式');
                }
            } else if (parent) {
                // 如果父元素不是video-wrapper，则创建一个包装器
                const wrapper = document.createElement('div');
                wrapper.className = 'video-wrapper';
                wrapper.style.position = 'relative';
                wrapper.style.paddingBottom = '56.25%';
                wrapper.style.height = '0';
                wrapper.style.overflow = 'hidden';
                wrapper.style.maxWidth = '100%';
                wrapper.style.margin = '10px 0';
                wrapper.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
                wrapper.style.borderRadius = '4px';
                
                // 设置视频样式
                video.style.position = 'absolute';
                video.style.top = '0';
                video.style.left = '0';
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.border = '0';
                
                // 替换视频
                parent.insertBefore(wrapper, video);
                wrapper.appendChild(video);
                console.log('创建本地视频容器并移动视频元素');
            }
        });
        
        // 处理音频元素
        const audioElements = document.querySelectorAll('audio.resource-audio');
        console.log('发现音频元素:', audioElements.length);
        
        audioElements.forEach(function(audio) {
            // 确保音频元素有正确的属性
            if (!audio.hasAttribute('controls')) {
                audio.setAttribute('controls', '');
            }
            if (!audio.hasAttribute('preload')) {
                audio.setAttribute('preload', 'metadata');
            }
            
            // 设置音频样式
            audio.style.width = '100%';
            audio.style.borderRadius = '8px';
            audio.style.backgroundColor = document.body.classList.contains('dark-theme') ? '#2d333b' : '#f5f5f5';
            
            console.log('修复音频元素样式');
        });
    }, 1000); // 等待1秒确保页面加载完成
    
    // 监听DOM变化，为新添加的memo增加卡片编号和点击事件
    const addCardNumbers = function() {
        // 查找所有没有编号的用户信息区域
        const userInfoDivs = document.querySelectorAll('.memos__userinfo');
        userInfoDivs.forEach(function(div) {
            // 检查是否已经添加了编号
            if (!div.querySelector('.memo-number')) {
                // 找到memo的ID
                const memoContent = div.closest('.memos__content');
                if (memoContent) {
                    const metaDiv = memoContent.querySelector('.memos__meta');
                    if (metaDiv) {
                        const linkElement = metaDiv.querySelector('a[href*="/m/"]');
                        if (linkElement) {
                            const href = linkElement.getAttribute('href');
                            // 从链接中提取ID
                            const memoId = href.split('/').pop();
                            if (memoId) {
                                // 找到用户ID元素
                                const userIdDiv = div.querySelector('.memos__id');
                                if (userIdDiv) {
                                    // 提取原始用户名
                                    const originalText = userIdDiv.textContent;
                                    // 创建编号元素，设置为链接
                                    const numberLink = document.createElement('a');
                                    numberLink.className = 'memo-number';
                                    numberLink.textContent = ` · #${memoId}`;
                                    numberLink.href = `?id=${memoId}`;
                                    // 移除内联颜色样式，使用CSS样式表中的颜色
                                    numberLink.style.textDecoration = 'none';
                                    numberLink.addEventListener('mouseover', function() {
                                        this.style.textDecoration = 'underline';
                                    });
                                    numberLink.addEventListener('mouseout', function() {
                                        this.style.textDecoration = 'none';
                                    });
                                    // 将编号添加到用户ID后
                                    userIdDiv.appendChild(numberLink);
                                    console.log(`为memo #${memoId}添加了可点击编号`);
                                }
                            }
                        }
                    }
                }
            }
        });
        
        // 如果设置了单篇显示，更新过滤
        if (memoId) {
            window.filterSingleMemo(memoId);
        }
    };
    
    // 初始执行一次添加卡片编号
    setTimeout(addCardNumbers, 1000);
    
    // 添加处理marked的钩子，允许HTML标签
    if (window.marked) {
        console.log('配置marked以允许HTML标签');
        window.marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false,
            smartLists: true,
            langPrefix: 'language-',
            sanitize: false, // 允许HTML标签
            smartypants: false,
            xhtml: false
        });
    } else {
        console.warn('marked未找到，等待它加载完成');
        
        // 延迟检查和配置marked
        const checkMarkedInterval = setInterval(function() {
            if (window.marked && typeof window.marked.setOptions === 'function') {
                console.log('延迟配置marked以允许HTML标签');
                window.marked.setOptions({
                    breaks: true,
                    gfm: true,
                    headerIds: false,
                    mangle: false,
                    smartLists: true,
                    langPrefix: 'language-',
                    sanitize: false, // 允许HTML标签
                    smartypants: false,
                    xhtml: false
                });
                clearInterval(checkMarkedInterval);
            }
        }, 100);
    }
    
    // 添加一个特殊的全局函数，专门用于修复B站视频在移动端的显示问题
    window.fixBilibiliVideosForMobile = function() {
        console.log("执行B站视频移动端特殊修复...");
        
        // 查找所有B站视频iframe
        const biliIframes = document.querySelectorAll('iframe[src*="bilibili"]');
        
        if (biliIframes.length === 0) {
            console.log("未找到B站视频，跳过修复");
            return;
        }
        
        console.log(`找到 ${biliIframes.length} 个B站视频，开始修复`);
        
        // 先把所有iframe直接放到body下，避免嵌套问题
        biliIframes.forEach(function(iframe, index) {
            try {
                // 1. 保存原始位置
                const originalParent = iframe.parentElement;
                const nextSibling = iframe.nextSibling;
                
                // 2. 创建新容器
                const newContainer = document.createElement('div');
                newContainer.setAttribute('data-bilibili-video', 'true');
                newContainer.id = `bilibili-container-${index}`;
                
                // 3. 设置关键样式
                Object.assign(newContainer.style, {
                    position: 'relative',
                    width: '100%',
                    height: '0',
                    paddingBottom: '56.25%',
                    margin: '10px 0',
                    backgroundColor: '#000',
                    zIndex: '5',
                    display: 'block',
                    visibility: 'visible',
                    overflow: 'hidden'
                });
                
                // 4. 修复iframe属性和样式
                let src = iframe.getAttribute('src') || '';
                if (src.startsWith('//')) src = 'https:' + src;
                if (src.indexOf('as_wide=') === -1) {
                    src += (src.indexOf('?') > -1 ? '&' : '?') + 'as_wide=1&high_quality=1&danmaku=0&autoplay=0';
                }
                
                iframe.setAttribute('src', src);
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('sandbox', 'allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups');
                
                Object.assign(iframe.style, {
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                    visibility: 'visible',
                    opacity: '1',
                    zIndex: '6',
                    minHeight: '200px'
                });
                
                // 5. 插入新容器并移动iframe
                originalParent.insertBefore(newContainer, nextSibling);
                newContainer.appendChild(iframe);
                
                console.log(`已修复B站视频 #${index+1}`);
            } catch (error) {
                console.error(`修复B站视频 #${index+1} 时出错:`, error);
            }
        });
        
        console.log("B站视频移动端修复完成");
    };
    
    // 页面加载完成后自动执行移动端视频修复
    setTimeout(window.fixBilibiliVideosForMobile, 800);
    
    // 再次延迟执行，确保处理异步加载的内容
    setTimeout(window.fixBilibiliVideosForMobile, 2000);
});
