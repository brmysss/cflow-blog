// 背景脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log('说说笔记扩展已安装');
  
  // 初始化默认设置
  chrome.storage.sync.get(['siteUrl', 'apiToken'], (result) => {
    if (!result.siteUrl) {
      chrome.storage.sync.set({ siteUrl: '' });
    }
    if (!result.apiToken) {
      chrome.storage.sync.set({ apiToken: '' });
    }
  });
});

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openTab') {
    chrome.tabs.create({ url: request.url });
    sendResponse({ success: true });
  }
  return true;
});