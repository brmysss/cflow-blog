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
                        
                        // 确保iframe有正确的属性
                        iframe.setAttribute('allowfullscreen', 'true');
                        iframe.setAttribute('scrolling', 'no');
                        iframe.setAttribute('frameborder', '0');
                        
                        // 创建一个新的简单容器替换现有的复杂结构
                        const parent = iframe.parentElement;
                        
                        if (parent) {
                            // 判断是否需要重构DOM
                            const needsRestructuring = !parent.style.position || 
                                                      parent.style.position !== 'relative' ||
                                                      parent.style.paddingBottom !== '56.25%';
                            
                            if (needsRestructuring) {
                                console.log('重构B站视频容器');
                                
                                // 创建新的简单容器
                                const newContainer = document.createElement('div');
                                
                                // 直接设置所有需要的样式
                                newContainer.style.position = 'relative';
                                newContainer.style.width = '100%';
                                newContainer.style.paddingBottom = '56.25%';
                                newContainer.style.height = '0';
                                newContainer.style.overflow = 'hidden';
                                newContainer.style.margin = '10px 0';
                                newContainer.style.borderRadius = '8px';
                                newContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
                                
                                // 设置iframe样式
                                iframe.style.position = 'absolute';
                                iframe.style.top = '0';
                                iframe.style.left = '0';
                                iframe.style.width = '100%';
                                iframe.style.height = '100%';
                                iframe.style.border = 'none';
                                
                                // 获取祖父元素
                                const grandparent = parent.parentElement;
                                
                                // 用新容器替换整个旧结构
                                if (grandparent && (grandparent.classList.contains('bilibili-container') || 
                                                   grandparent.classList.contains('embedded-html'))) {
                                    grandparent.parentNode.replaceChild(newContainer, grandparent);
                                } else {
                                    // 如果没有特定的祖父容器，就替换父容器
                                    parent.parentNode.replaceChild(newContainer, parent);
                                }
                                
                                // 将iframe添加到新容器
                                newContainer.appendChild(iframe);
                            }
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
                                
                                // 确保iframe有正确的属性
                                iframe.setAttribute('allowfullscreen', 'true');
                                iframe.setAttribute('scrolling', 'no');
                                iframe.setAttribute('frameborder', '0');
                                
                                // 创建一个新的简单容器替换现有的复杂结构
                                const parent = iframe.parentElement;
                                
                                if (parent) {
                                    // 判断是否需要重构DOM
                                    const needsRestructuring = !parent.style.position || 
                                                              parent.style.position !== 'relative' ||
                                                              parent.style.paddingBottom !== '56.25%';
                                    
                                    if (needsRestructuring) {
                                        console.log('重构B站视频容器');
                                        
                                        // 创建新的简单容器
                                        const newContainer = document.createElement('div');
                                        
                                        // 直接设置所有需要的样式
                                        newContainer.style.position = 'relative';
                                        newContainer.style.width = '100%';
                                        newContainer.style.paddingBottom = '56.25%';
                                        newContainer.style.height = '0';
                                        newContainer.style.overflow = 'hidden';
                                        newContainer.style.margin = '10px 0';
                                        newContainer.style.borderRadius = '8px';
                                        newContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
                                        
                                        // 设置iframe样式
                                        iframe.style.position = 'absolute';
                                        iframe.style.top = '0';
                                        iframe.style.left = '0';
                                        iframe.style.width = '100%';
                                        iframe.style.height = '100%';
                                        iframe.style.border = 'none';
                                        
                                        // 获取祖父元素
                                        const grandparent = parent.parentElement;
                                        
                                        // 用新容器替换整个旧结构
                                        if (grandparent && (grandparent.classList.contains('bilibili-container') || 
                                                           grandparent.classList.contains('embedded-html'))) {
                                            grandparent.parentNode.replaceChild(newContainer, grandparent);
                                        } else {
                                            // 如果没有特定的祖父容器，就替换父容器
                                            parent.parentNode.replaceChild(newContainer, parent);
                                        }
                                        
                                        // 将iframe添加到新容器
                                        newContainer.appendChild(iframe);
                                    }
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
                
                // 替换B站视频iframe为直接样式
                htmlContent = htmlContent.replace(bilibiliRegex, function(match, params) {
                    console.log('识别到Bilibili视频，参数:', params);
                    
                    // 确保参数中包含移动端兼容的设置
                    if (params.indexOf('as_wide=') === -1) {
                        params += '&as_wide=1&high_quality=1&danmaku=0';
                    }
                    
                    // 使用单一容器直接包含iframe
                    return `<div style="position:relative;width:100%;padding-bottom:56.25%;height:0;overflow:hidden;margin:10px 0;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.15);">
                        <iframe src="https://player.bilibili.com/player.html?${params}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" frameborder="0" allowfullscreen="true" scrolling="no"></iframe>
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
    
    // 修复B站视频函数 - 简化版
    function fixBilibiliVideos() {
        // 查找所有B站视频iframe
        const iframes = document.querySelectorAll('iframe[src*="player.bilibili.com"]');
        console.log('修复B站视频:', iframes.length);
        
        iframes.forEach(function(iframe) {
            // 修复源URL
            let src = iframe.getAttribute('src');
            if (!src) return;
            
            if (src.startsWith('//')) {
                src = 'https:' + src;
                iframe.setAttribute('src', src);
            }
            
            // 添加移动端参数
            if (src.indexOf('as_wide=') === -1) {
                src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'as_wide=1&high_quality=1&danmaku=0';
                iframe.setAttribute('src', src);
            }
            
            // 确保重要属性存在
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('frameborder', '0');
            
            // 创建一个全新的容器
            const container = document.createElement('div');
            container.style.position = 'relative';
            container.style.width = '100%';
            container.style.paddingBottom = '56.25%';
            container.style.height = '0';
            container.style.overflow = 'hidden';
            container.style.margin = '10px 0';
            container.style.borderRadius = '8px';
            container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
            
            // 设置iframe样式
            iframe.style.position = 'absolute';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            
            // 替换现有结构
            // 查找最近的容器祖先
            let parent = iframe.parentElement;
            while (parent && 
                   parent.tagName !== 'DIV' && 
                   parent.tagName !== 'P' && 
                   parent.tagName !== 'BODY') {
                parent = parent.parentElement;
            }
            
            // 如果有合适的父元素，替换它
            if (parent && parent.tagName !== 'BODY') {
                // 如果父元素包含其他内容，只替换iframe
                if (parent.childNodes.length > 1) {
                    const placeholder = document.createElement('span');
                    parent.insertBefore(placeholder, iframe);
                    container.appendChild(iframe);
                    parent.insertBefore(container, placeholder);
                    parent.removeChild(placeholder);
                } else {
                    // 替换整个容器
                    parent.parentNode.insertBefore(container, parent);
                    container.appendChild(iframe);
                    parent.parentNode.removeChild(parent);
                }
            } else {
                // 如果找不到合适的父元素，把新容器放在iframe旁边
                iframe.parentNode.insertBefore(container, iframe);
                container.appendChild(iframe);
            }
        });
    }
    
    // 定期检查和修复B站视频
    setInterval(fixBilibiliVideos, 2000);
    
    // 初次执行
    setTimeout(fixBilibiliVideos, 1000);
    
    // 监听DOM变化
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            let hasBilibiliIframe = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 检查所有添加的节点及其子节点中是否有B站iframe
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // 元素节点
                            if (node.tagName === 'IFRAME' && 
                                node.src && 
                                node.src.includes('player.bilibili.com')) {
                                hasBilibiliIframe = true;
                            } else if (node.querySelector && 
                                      node.querySelector('iframe[src*="player.bilibili.com"]')) {
                                hasBilibiliIframe = true;
                            }
                        }
                    });
                }
            });
            
            if (hasBilibiliIframe) {
                console.log('检测到新的B站视频，执行修复');
                setTimeout(fixBilibiliVideos, 100);
            }
        });
        
        // 监听整个文档的变化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
});
