// 全局变量
let editor;
let lastSentMessageId = null;
let isPrivate = false; // 添加私密发送状态变量

// 存储编辑器内容的键名
const EDITOR_CONTENT_KEY = 'editorContent';

// DOM 元素
const settingsBtn = document.getElementById('settingsBtn');
const sendBtn = document.getElementById('sendBtn');
const tagBtn = document.getElementById('tagBtn');
const linkBtn = document.getElementById('linkBtn');
const imageBtn = document.getElementById('imageBtn');
const resultContainer = document.getElementById('resultContainer');
const closeResultBtn = document.getElementById('closeResultBtn');
const previewContent = document.getElementById('previewContent');
const viewLink = document.getElementById('viewLink');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const siteUrlInput = document.getElementById('siteUrl');
const apiTokenInput = document.getElementById('apiToken');
const resultMessage = document.getElementById('resultMessage');


// 初始化编辑器
document.addEventListener('DOMContentLoaded', () => {
  // 加载已保存的编辑器内容
  chrome.storage.local.get([EDITOR_CONTENT_KEY], (result) => {
    const savedContent = result[EDITOR_CONTENT_KEY] || '';
    
    // 初始化 EasyMDE 编辑器
    editor = new EasyMDE({
    element: document.getElementById('editor'),
    autofocus: true,
    spellChecker: false,
    placeholder: '灵感笔记..',
    toolbar: false,
    status: false,
    minHeight: '200px',
    maxHeight: '300px',
    sideBySideFullscreen: false,
    forceSync: true,
    autoSave: false,
    previewClass: 'preview-content',
    renderingConfig: {
      singleLineBreaks: true,
      codeSyntaxHighlighting: true
    },
    autoDownloadFontAwesome: false,
    promptURLs: false,
    shortcuts: { "togglePreview": null, "toggleSideBySide": null, "drawTable": null },
    previewRender: (plainText) => {
      const html = marked.parse(plainText);
      return `<div class="preview-content">${html}</div>`;
    }
  });
  
  // 添加编辑器内容变化事件监听
  editor.codemirror.on('change', function() {
    updatePreview();
    // 保存编辑器内容到本地存储
    const content = editor.value();
    chrome.storage.local.set({ [EDITOR_CONTENT_KEY]: content });
  });

  // 设置已保存的内容
  if (savedContent) {
    editor.value(savedContent);
  }

  // 加载设置
  loadSettings();

  // 设置事件监听器
  setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
  // 设置按钮点击事件
  settingsBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);

  // 工具栏按钮点击事件
  tagBtn.addEventListener('click', () => insertMarkdown('#标签 '));
  linkBtn.addEventListener('click', insertLink);
  imageBtn.addEventListener('click', insertImage);

  // 发送按钮点击事件
  sendBtn.addEventListener('click', sendMessage);

  // 结果容器关闭按钮点击事件
  closeResultBtn.addEventListener('click', () => {
    resultContainer.classList.add('hidden');
  });
  
  // 移除私密发送功能
}

// 加载设置
function loadSettings() {
  chrome.storage.sync.get(['siteUrl', 'apiToken'], (result) => {
    if (result.siteUrl) {
      siteUrlInput.value = result.siteUrl;
    }
    if (result.apiToken) {
      apiTokenInput.value = result.apiToken;
    }
  });
}

// 打开设置模态框
function openSettings() {
  settingsModal.classList.remove('hidden');
}

// 关闭设置模态框
function closeSettings() {
  settingsModal.classList.add('hidden');
}

// 保存设置
function saveSettings() {
  const siteUrl = siteUrlInput.value.trim();
  const apiToken = apiTokenInput.value.trim();

  if (!siteUrl) {
    alert('请输入站点地址');
    return;
  }

  chrome.storage.sync.set({ siteUrl, apiToken }, () => {
    alert('设置已保存');
    closeSettings();
  });
}

// 插入Markdown格式文本
function insertMarkdown(text) {
  const cm = editor.codemirror;
  const startPoint = cm.getCursor('start');
  const endPoint = cm.getCursor('end');
  cm.replaceSelection(text);
  cm.setSelection(
    { line: startPoint.line, ch: startPoint.ch + text.length },
    { line: endPoint.line, ch: endPoint.ch + text.length }
  );
  cm.focus();
}

// 插入链接
function insertLink() {
  const url = prompt('请输入链接地址:', 'https://');
  if (url) {
    const text = prompt('请输入链接文本:', '链接');
    if (text) {
      insertMarkdown(`[${text}](${url})`);
    }
  }
}

// 插入图片
function insertImage() {
  const url = prompt('请输入图片地址:', 'https://');
  if (url) {
    const alt = prompt('请输入图片描述:', '图片');
    insertMarkdown(`![${alt}](${url})`);
  }
}


// 发送消息
function sendMessage() {
  const content = editor.value().trim();
  if (!content) {
    showResult('', null, '', false);
    // 设置错误消息
    const resultMessage = document.getElementById('resultMessage');
    resultMessage.textContent = '请输入内容';
    return;
  }

  chrome.storage.sync.get(['siteUrl', 'apiToken'], (result) => {
    if (!result.siteUrl) {
      alert('请先在设置中配置站点地址');
      openSettings();
      return;
    }

    const apiUrl = `${result.siteUrl}/api/token/messages`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': result.apiToken ? `Bearer ${result.apiToken}` : ''
    };

    // 如果没有设置token，尝试使用普通API端点
    const fallbackUrl = `${result.siteUrl}/api/messages`;

    console.log('Sending request to:', apiUrl);
    console.log('Headers:', JSON.stringify(headers));
    console.log('Body:', JSON.stringify({
      content: content,
      private: isPrivate,
      notify: false,
      username: ''
    }));

    fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        content: content,
        private: isPrivate,
        notify: false,
        username: '' // 由服务端根据token获取用户名
      })
    })
    .then(response => {
      console.log('Response status:', response.status);
      if (!response.ok && !result.apiToken) {
        // 如果没有token且请求失败，尝试使用普通API端点
        console.log('Falling back to regular API endpoint:', fallbackUrl);
        return fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: content,
            private: isPrivate,
            notify: false
          }),
          credentials: 'include' // 包含cookie以使用会话认证
        });
      }
      return response;
    })
    .then(response => {
      console.log('Processing response...');
      return response.json();
    })
    .then(data => {
      console.log('Response data:', JSON.stringify(data));
      if (data.code === 1) {
        // 成功发送
        const messageId = data.data?.id || null;
        showResult(content, messageId, result.siteUrl, true);
        editor.value(''); // 清空编辑器
      } else {
        // 发送失败
        showResult(content, null, result.siteUrl, false);
        // 设置错误消息
        const resultMessage = document.getElementById('resultMessage');
        resultMessage.textContent = `发送失败: ${data.msg || '未知错误'}`;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showResult(content, null, result.siteUrl, false);
      // 设置错误消息
      const resultMessage = document.getElementById('resultMessage');
      resultMessage.textContent = `发送失败: ${error.message}`;
    });
  });
}

// 显示发送结果
function showResult(content, messageId, siteUrl, success = true) {
  lastSentMessageId = messageId;
  
  // 设置结果消息并显示在发送按钮旁
  resultContainer.style.position = 'fixed'; // 改为 fixed 定位
  const sendBtnRect = sendBtn.getBoundingClientRect();
  resultContainer.style.top = `${sendBtnRect.bottom + 5}px`; // 调整位置到按钮下方
  resultContainer.style.left = `${sendBtnRect.left}px`;
  resultContainer.style.zIndex = '9999'; // 提高 z-index 值
  
  resultMessage.textContent = success ? '发送成功' : '发送失败';
  
  // 移除所有状态类
  resultContainer.classList.remove('success-message', 'error-message', 'hidden');
  // 添加新的状态类
  resultContainer.classList.add(success ? 'success-message' : 'error-message');
  
  // 如果发送成功，显示预览内容和前往查看链接，并清除本地存储的内容
  if (success && content && messageId) {
    // 清除本地存储的内容
    chrome.storage.local.remove([EDITOR_CONTENT_KEY]);
    // 显示预览内容
    previewContent.innerHTML = marked.parse(content);
    previewContent.classList.remove('hidden');
    
    // 设置前往查看链接
    if (siteUrl && messageId) {
      const messageUrl = `${siteUrl}/message/${messageId}`;
      viewLink.href = messageUrl;
      viewLink.textContent = '前往查看';
      viewLink.classList.remove('hidden');
    }
  } else {
    // 发送失败或没有内容时隐藏预览和链接
    previewContent.classList.add('hidden');
    viewLink.classList.add('hidden');
  }
  
  // 重新绑定关闭按钮事件
  closeResultBtn.addEventListener('click', () => {
    resultContainer.classList.add('hidden');
  });
  
  // 3秒后自动隐藏结果容器
  setTimeout(() => {
    resultContainer.classList.add('hidden');
  }, 3000);
}

// 实时预览功能 - 已由编辑器的即时预览模式替代
function updatePreview() {
  const content = editor.value().trim();
  if (content) {
    if (!resultContainer.classList.contains('hidden') && previewContent.innerHTML) {
      previewContent.innerHTML = marked.parse(content);
    }
  } else {
    resultContainer.classList.add('hidden');
  }
}

// 删除多余的括号，正确闭合 DOMContentLoaded 事件监听器
}); // 这是 DOMContentLoaded 的结束
