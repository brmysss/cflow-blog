/**
 * 处理cflow嵌入HTML内容
 * 自定义处理函数
 */

// 在DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查路径，看是否是单卡片模式(/m/123格式)
    const pathParts = window.location.pathname.split('/');
    let memoId = null;
    
    // 检查URL格式，支持/m/123格式
    if (pathParts.length >= 3 && pathParts[1] === 'm') {
        memoId = pathParts[2];
        console.log('从路径中识别到卡片ID:', memoId);
    } else {
        // 向后兼容: 检查URL参数中是否有id
        const urlParams = new URLSearchParams(window.location.search);
        memoId = urlParams.get('id');
        if (memoId) {
            console.log('从URL参数中识别到卡片ID:', memoId);
            // 更新URL格式为新的路径格式，但不刷新页面
            const newUrl = `/m/${memoId}`;
            window.history.replaceState({}, '', newUrl);
        }
    }
    
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
                    // 返回主页
                    window.location.href = '/';
                });
                
                // 添加到memos容器前面
                memosContainer.parentNode.insertBefore(backButton, memosContainer);
                
                // 确保激活说说页面
                showPage('memos');
            }
        }
    }
    
    // 如果是单卡片模式
    if (memoId) {
        console.log('启用单卡片模式:', memoId);
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
                originalUpdateHTMl(data);
                
                // 更新后过滤卡片
                setTimeout(function() {
                    const found = window.filterSingleMemo(memoId);
                    if (found) {
                        console.log('成功找到并显示卡片:', memoId);
                    } else {
                        console.log('未找到卡片:', memoId);
                        // 加载更多可能存在该卡片
                        const loadMoreBtn = document.querySelector('.button-load');
                        if (loadMoreBtn && !loadMoreBtn.disabled) {
                            console.log('尝试加载更多内容查找卡片');
                            loadMoreBtn.click();
                        }
                    }
                }, 100);
            };
        }
        
        // 立即过滤已加载的卡片
        setTimeout(function() {
            const found = window.filterSingleMemo(memoId);
            if (!found) {
                console.log('首次加载未找到卡片，将尝试加载更多');
                const loadMoreBtn = document.querySelector('.button-load');
                if (loadMoreBtn) {
                    loadMoreBtn.click();
                    // 立即隐藏按钮，避免用户看到闪烁
                    loadMoreBtn.style.display = 'none';
                }
            }
        }, 1000);
        
        // 创建样式元素隐藏所有加载更多按钮
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .button-load { 
                display: none !important; 
            }
        `;
        document.head.appendChild(styleElement);
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
                
                // 替换B站视频iframe为视频容器
                htmlContent = htmlContent.replace(bilibiliRegex, function(match, params) {
                    console.log('识别到Bilibili视频，参数:', params);
                    
                    // 确保params包含必要参数
                    if (!params.includes('page=') && !params.includes('p=')) {
                        params += '&p=1';
                    }
                    
                    // 添加其他必要参数确保移动端兼容性
                    if (!params.includes('high_quality=')) {
                        params += '&high_quality=1';
                    }
                    
                    if (!params.includes('danmaku=')) {
                        params += '&danmaku=0';
                    }
                    
                    // 如果缺少必要的BV参数，提取它
                    if (!params.includes('bvid=') && match.includes('bvid=')) {
                        const bvidMatch = /bvid=([^&"']+)/.exec(match);
                        if (bvidMatch && bvidMatch[1]) {
                            params += '&bvid=' + bvidMatch[1];
                        }
                    }
                    
                    // 修正移动端的一些问题，添加更多参数以确保兼容性
                    return `<div class="video-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:10px 0;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        <iframe 
                            src="https://player.bilibili.com/player.html?${params}&as_wide=1&autoplay=0&high_quality=1&is_h5=1" 
                            style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" 
                            scrolling="no" 
                            frameborder="no" 
                            framespacing="0" 
                            sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"
                            referrerpolicy="no-referrer"
                            loading="lazy"
                            allowfullscreen="true">
                        </iframe>
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
            if (src.startsWith('//')) {
                src = 'https:' + src;
            }
            
            // 确保URL有必要的参数
            if (!src.includes('as_wide=1')) {
                src += (src.includes('?') ? '&' : '?') + 'as_wide=1';
            }
            
            if (!src.includes('high_quality=')) {
                src += '&high_quality=1';
            }
            
            if (!src.includes('is_h5=')) {
                src += '&is_h5=1';
            }
            
            // 应用更新后的URL
            iframe.setAttribute('src', src);
            console.log('修复视频URL:', src);
            
            // 添加必要的属性
            iframe.setAttribute('referrerpolicy', 'no-referrer');
            iframe.setAttribute('loading', 'lazy');
            iframe.setAttribute('sandbox', 'allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups');
            iframe.setAttribute('allowfullscreen', 'true');
            
            // 确保父元素有正确的样式
            const parent = iframe.parentElement;
            if (parent && parent.classList.contains('video-wrapper')) {
                // 检查video-wrapper是否有正确的样式
                parent.style.position = 'relative';
                parent.style.paddingBottom = '56.25%';
                parent.style.height = '0';
                parent.style.overflow = 'hidden';
                parent.style.maxWidth = '100%';
                parent.style.margin = '10px 0';
                parent.style.borderRadius = '8px';
                parent.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                
                // 给iframe添加样式
                iframe.style.position = 'absolute';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = '0';
                
                console.log('修复视频容器样式');
            } else if (parent) {
                // 如果父元素不是video-wrapper，创建一个新的包装容器
                const wrapper = document.createElement('div');
                wrapper.className = 'video-wrapper';
                wrapper.style.position = 'relative';
                wrapper.style.paddingBottom = '56.25%';
                wrapper.style.height = '0';
                wrapper.style.overflow = 'hidden';
                wrapper.style.maxWidth = '100%';
                wrapper.style.margin = '10px 0';
                wrapper.style.borderRadius = '8px';
                wrapper.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                
                // 保存iframe的原始属性
                const iframeSrc = iframe.getAttribute('src');
                const scrolling = iframe.getAttribute('scrolling') || 'no';
                const frameborder = iframe.getAttribute('frameborder') || 'no';
                const framespacing = iframe.getAttribute('framespacing') || '0';
                
                // 创建新的iframe确保所有属性都正确设置
                const newIframe = document.createElement('iframe');
                newIframe.setAttribute('src', iframeSrc);
                newIframe.setAttribute('scrolling', scrolling);
                newIframe.setAttribute('frameborder', frameborder);
                newIframe.setAttribute('framespacing', framespacing);
                newIframe.setAttribute('allowfullscreen', 'true');
                newIframe.setAttribute('referrerpolicy', 'no-referrer');
                newIframe.setAttribute('loading', 'lazy');
                newIframe.setAttribute('sandbox', 'allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups');
                
                newIframe.style.position = 'absolute';
                newIframe.style.top = '0';
                newIframe.style.left = '0';
                newIframe.style.width = '100%';
                newIframe.style.height = '100%';
                newIframe.style.border = '0';
                
                // 把新iframe放到包装容器中
                wrapper.appendChild(newIframe);
                
                // 替换原始iframe
                parent.replaceChild(wrapper, iframe);
                console.log('创建新的视频容器替换原始iframe');
            }
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
                                    numberLink.href = `/m/${memoId}`;
                                    numberLink.style.color = 'var(--color-memos-id)';
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
    
    // 劫持main.js中的updateHTMl函数
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
                const iframes = document.querySelectorAll('iframe[src*="player.bilibili.com"]');
                iframes.forEach(function(iframe) {
                    let src = iframe.getAttribute('src');
                    if (src.startsWith('//')) {
                        src = 'https:' + src;
                        iframe.setAttribute('src', src);
                    }
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
                        const iframes = document.querySelectorAll('iframe[src*="player.bilibili.com"]');
                        iframes.forEach(function(iframe) {
                            let src = iframe.getAttribute('src');
                            if (src.startsWith('//')) {
                                src = 'https:' + src;
                                iframe.setAttribute('src', src);
                            }
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
});
