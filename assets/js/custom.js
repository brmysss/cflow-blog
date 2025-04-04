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
                    
                    // 确保添加必要的参数以兼容移动端
                    if (!params.includes('high_quality=1')) {
                        if (params.includes('&')) {
                            params += '&high_quality=1';
                        } else {
                            params += 'high_quality=1';
                        }
                    }
                    
                    if (!params.includes('danmaku=0')) {
                        if (params.includes('&')) {
                            params += '&danmaku=0';
                        } else {
                            params += 'danmaku=0';
                        }
                    }
                    
                    if (!params.includes('t=0')) {
                        if (params.includes('&')) {
                            params += '&t=0';
                        } else {
                            params += 't=0';
                        }
                    }
                    
                    // 确保添加autoplay=0以防止自动播放
                    if (!params.includes('autoplay=')) {
                        if (params.includes('&')) {
                            params += '&autoplay=0';
                        } else {
                            params += 'autoplay=0';
                        }
                    }
                    
                    // 使用更强的移动端兼容样式
                    return `<div class="video-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:10px 0;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <iframe src="https://player.bilibili.com/player.html?${params}" 
                               allow="fullscreen" 
                               style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" 
                               scrolling="no" 
                               border="0" 
                               frameborder="no" 
                               framespacing="0" 
                               allowfullscreen="true"
                               sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"
                               referrerpolicy="no-referrer"></iframe>
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
                iframe.setAttribute('src', src);
                console.log('修复视频URL:', src);
            }
            
            // 添加必要的属性以提高兼容性
            iframe.setAttribute('allow', 'fullscreen');
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('frameborder', 'no');
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('border', '0');
            iframe.setAttribute('framespacing', '0');
            iframe.setAttribute('sandbox', 'allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups');
            iframe.setAttribute('referrerpolicy', 'no-referrer');
            
            // 检查URL参数并添加高质量和禁用弹幕等参数
            if (src.includes('?')) {
                let urlObj = new URL(src);
                let params = new URLSearchParams(urlObj.search);
                
                if (!params.has('high_quality')) {
                    params.set('high_quality', '1');
                }
                
                if (!params.has('danmaku')) {
                    params.set('danmaku', '0');
                }
                
                if (!params.has('autoplay')) {
                    params.set('autoplay', '0');
                }
                
                // 确保有t=0参数
                if (!params.has('t')) {
                    params.set('t', '0');
                }
                
                // 更新src
                urlObj.search = params.toString();
                iframe.setAttribute('src', urlObj.toString());
                console.log('更新视频参数:', urlObj.toString());
            }
            
            // 确保父元素有正确的样式
            const parent = iframe.parentElement;
            if (parent && parent.classList.contains('video-wrapper')) {
                // 检查video-wrapper是否有正确的样式
                if (window.getComputedStyle(parent).position !== 'relative') {
                    parent.style.position = 'relative';
                    parent.style.paddingBottom = '56.25%';
                    parent.style.height = '0';
                    parent.style.overflow = 'hidden';
                    parent.style.maxWidth = '100%';
                    parent.style.margin = '10px 0';
                    parent.style.borderRadius = '8px';
                    parent.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    
                    // 给iframe添加样式
                    iframe.style.position = 'absolute';
                    iframe.style.top = '0';
                    iframe.style.left = '0';
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = '0';
                    
                    console.log('修复视频容器样式');
                }
            } else if (parent) {
                // 如果父元素不是video-wrapper，创建一个并替换
                const wrapper = document.createElement('div');
                wrapper.className = 'video-wrapper';
                wrapper.style.position = 'relative';
                wrapper.style.paddingBottom = '56.25%';
                wrapper.style.height = '0';
                wrapper.style.overflow = 'hidden';
                wrapper.style.maxWidth = '100%';
                wrapper.style.margin = '10px 0';
                wrapper.style.borderRadius = '8px';
                wrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                
                // 复制iframe样式
                iframe.style.position = 'absolute';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = '0';
                
                // 将iframe插入新容器，并替换原来的iframe
                parent.insertBefore(wrapper, iframe);
                wrapper.appendChild(iframe);
                console.log('创建新的视频容器');
            }
        });
        
        // 再次检查3秒后，防止动态加载的iframe被遗漏
        setTimeout(function() {
            const laterIframes = document.querySelectorAll('iframe[src*="player.bilibili.com"]');
            if (laterIframes.length > iframes.length) {
                console.log('发现新增的B站视频iframe:', laterIframes.length - iframes.length);
                
                laterIframes.forEach(function(iframe) {
                    // 检查是否已经处理过
                    if (iframe.getAttribute('data-processed') !== 'true') {
                        // 处理这个iframe
                        let src = iframe.getAttribute('src');
                        if (!src.startsWith('https:')) {
                            src = src.startsWith('//') ? 'https:' + src : 'https://' + src;
                            iframe.setAttribute('src', src);
                        }
                        
                        // 添加处理标记
                        iframe.setAttribute('data-processed', 'true');
                        console.log('处理新增iframe:', src);
                    }
                });
            }
        }, 3000);
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
