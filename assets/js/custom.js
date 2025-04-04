/**
 * 处理cflow嵌入HTML内容
 * 自定义处理函数
 */

// 在DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取URL参数或路径中的卡片ID
    let memoId = null;
    
    // 检查URL格式 - 支持两种格式
    // 1. 参数形式: ?id=222
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id')) {
        memoId = urlParams.get('id');
    } 
    // 2. 路径形式: /m/222
    const pathMatch = window.location.pathname.match(/\/m\/(\d+)/);
    if (pathMatch && pathMatch[1]) {
        memoId = pathMatch[1];
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
                    // 返回首页而不只是删除参数
                    window.location.href = window.location.origin + window.location.pathname.replace(/\/m\/\d+/, '');
                });
                
                // 添加到memos容器前面
                memosContainer.parentNode.insertBefore(backButton, memosContainer);
                
                // 确保激活说说页面
                showPage('memos');
            }
        }
    }
    
    // 添加未公开卡片提示
    function addPrivateCardNotice() {
        // 检查是否已添加
        if (!document.querySelector('.private-card-notice')) {
            const memosContainer = document.getElementById('memos');
            if (memosContainer) {
                const noticeDiv = document.createElement('div');
                noticeDiv.className = 'private-card-notice';
                noticeDiv.innerHTML = `
                    <div class="memos__text" style="text-align: center; padding: 20px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 10px;">
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM7 6.5C7 5.672 7.672 5 8.5 5s1.5.672 1.5 1.5S9.328 8 8.5 8 7 7.328 7 6.5zm.5 8.5a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 1 0v4z"/>
                        </svg>
                        <p style="font-size: 16px; font-weight: bold;">当前卡片内容未公开</p>
                        <p style="margin-top: 10px; color: var(--color-memos-id);">该卡片可能已被删除或设为私有</p>
                    </div>
                `;
                memosContainer.innerHTML = '';
                memosContainer.appendChild(noticeDiv);
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
        
        // 检查卡片是否存在
        function checkCardExists() {
            let foundMemo = window.filterSingleMemo(memoId);
            if (!foundMemo) {
                console.log('卡片加载尝试失败:', memoId);
                
                // 构建指向卡片的API URL
                let apiUrl;
                if (memos.APIVersion === 'legacy') {
                    apiUrl = memos.host.replace(/\/$/, '') + '/api/v1/memo/' + memoId;
                } else {
                    apiUrl = memos.host.replace(/\/$/, '') + '/api/v1/memos/' + memoId;
                }
                
                // 尝试直接通过API获取单个卡片
                fetch(apiUrl)
                    .then(response => {
                        if (!response.ok) {
                            // 如果API返回错误，显示未公开提示
                            console.log('API返回错误:', response.status);
                            addPrivateCardNotice();
                            return null;
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data) {
                            // 检查卡片可见性
                            if (data.visibility === 'PUBLIC') {
                                console.log('API获取成功，但未在页面上找到该卡片，将尝试重新加载');
                                const loadMoreBtn = document.querySelector('.button-load');
                                if (loadMoreBtn && !loadMoreBtn.disabled) {
                                    loadMoreBtn.click();
                                    // 再次尝试过滤
                                    setTimeout(() => {
                                        if (!window.filterSingleMemo(memoId)) {
                                            // 尝试直接渲染这张卡片
                                            try {
                                                window.renderSingleMemo(data);
                                            } catch (e) {
                                                console.error('渲染单个卡片失败:', e);
                                                addPrivateCardNotice();
                                            }
                                        }
                                    }, 300);
                                } else {
                                    // 尝试直接渲染这张卡片
                                    try {
                                        window.renderSingleMemo(data);
                                    } catch (e) {
                                        console.error('渲染单个卡片失败:', e);
                                        addPrivateCardNotice();
                                    }
                                }
                            } else {
                                // 卡片不公开
                                console.log('卡片不公开');
                                addPrivateCardNotice();
                            }
                        } else {
                            // 卡片不存在
                            addPrivateCardNotice();
                        }
                    })
                    .catch(error => {
                        console.error('API请求失败:', error);
                        addPrivateCardNotice();
                    });
            } else {
                console.log('成功找到卡片:', memoId);
                // 隐藏加载按钮
                const loadMoreBtn = document.querySelector('.button-load');
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                }
            }
        }
        
        // 渲染单个卡片的函数
        window.renderSingleMemo = function(memo) {
            // 清空memos容器
            const memosContainer = document.getElementById('memos');
            memosContainer.innerHTML = '';
            
            // 创建timeline元素
            const timeline = document.createElement('li');
            timeline.className = 'timeline';
            
            // 创建内容容器
            const contentDiv = document.createElement('div');
            contentDiv.className = 'memos__content';
            
            // 创建用户信息区域
            const userInfoDiv = document.createElement('div');
            userInfoDiv.className = 'memos__userinfo';
            
            // 添加用户头像
            if (memos.avatarUrl) {
                const avatarImg = document.createElement('img');
                avatarImg.src = memos.avatarUrl;
                avatarImg.alt = memos.name || 'avatar';
                avatarImg.className = 'memos__avatar';
                userInfoDiv.appendChild(avatarImg);
            }
            
            // 添加用户ID
            const userIdDiv = document.createElement('div');
            userIdDiv.className = 'memos__id';
            userIdDiv.textContent = memos.name || memos.username || 'User';
            
            // 添加卡片编号
            const numberLink = document.createElement('a');
            numberLink.className = 'memo-number';
            numberLink.textContent = ` · #${memo.id}`;
            numberLink.href = `/m/${memo.id}`;
            numberLink.style.color = 'var(--color-memos-id)';
            numberLink.style.textDecoration = 'none';
            userIdDiv.appendChild(numberLink);
            
            userInfoDiv.appendChild(userIdDiv);
            contentDiv.appendChild(userInfoDiv);
            
            // 创建文本区域
            const textDiv = document.createElement('div');
            textDiv.className = 'memos__text';
            
            // 处理内容
            let processedContent = memo.content;
            if (window.processEmbeddedHTML) {
                processedContent = window.processEmbeddedHTML(processedContent);
            }
            
            // 使用marked处理markdown内容
            if (window.marked) {
                textDiv.innerHTML = window.marked.parse(processedContent);
            } else {
                textDiv.textContent = processedContent;
            }
            
            contentDiv.appendChild(textDiv);
            
            // 创建元数据区域
            const metaDiv = document.createElement('div');
            metaDiv.className = 'memos__meta';
            
            // 添加时间戳
            const timeSmall = document.createElement('small');
            const date = new Date(memo.createdTs * 1000);
            const formattedDate = date.toLocaleString();
            timeSmall.textContent = formattedDate;
            
            // 添加链接到原始卡片
            const linkSmall = document.createElement('a');
            linkSmall.href = `${memos.host.replace(/\/$/, '')}/m/${memo.id}`;
            linkSmall.style.marginLeft = '10px';
            linkSmall.textContent = '#' + memo.id;
            
            metaDiv.appendChild(timeSmall);
            metaDiv.appendChild(linkSmall);
            contentDiv.appendChild(metaDiv);
            
            timeline.appendChild(contentDiv);
            memosContainer.appendChild(timeline);
            
            // 修复视频iframe
            setTimeout(function() {
                const iframes = document.querySelectorAll('iframe[src*="player.bilibili.com"]');
                iframes.forEach(function(iframe) {
                    let src = iframe.getAttribute('src');
                    if (src.startsWith('//')) {
                        src = 'https:' + src;
                        iframe.setAttribute('src', src);
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
                            
                            // 给iframe添加样式
                            iframe.style.position = 'absolute';
                            iframe.style.top = '0';
                            iframe.style.left = '0';
                            iframe.style.width = '100%';
                            iframe.style.height = '100%';
                            iframe.style.border = '0';
                        }
                    }
                });
            }, 100);
        };
        
        // 添加过滤逻辑到updateHTMl函数之后
        const originalUpdateHTMl = window.updateHTMl;
        if (typeof originalUpdateHTMl === 'function') {
            window.updateHTMl = function(data) {
                originalUpdateHTMl(data);
                
                // 更新后检查卡片
                setTimeout(checkCardExists, 100);
            };
        }
        
        // 立即检查卡片
        setTimeout(checkCardExists, 1000);
        
        // 创建样式元素隐藏所有加载更多按钮
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .button-load, .load-btn { 
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
                    return `<div class="video-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:10px 0;">
                        <iframe src="https://player.bilibili.com/player.html?${params}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" scrolling="no" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
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
                    
                    // 给iframe添加样式
                    iframe.style.position = 'absolute';
                    iframe.style.top = '0';
                    iframe.style.left = '0';
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = '0';
                    
                    console.log('修复视频容器样式');
                }
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
                                    // 使用新的URL格式
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
            if (window.filterSingleMemo) {
                window.filterSingleMemo(memoId);
            }
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
