/**
 * HRM Auto Task - Background Service Worker
 * Xu ly alarm scheduling va task execution
 */

// === LOG HELPER ===

async function addLog(type, message, detail = '') {
  try {
    const data = await chrome.storage.local.get(['logs']);
    const logs = data.logs || [];

    // Them log moi
    logs.push({
      timestamp: Date.now(),
      type: type, // 'success', 'failed', 'pending', 'info'
      message: message,
      detail: detail,
    });

    // Giu toi da 50 logs
    if (logs.length > 50) {
      logs.shift();
    }

    await chrome.storage.local.set({ logs });
  } catch (error) {
    console.error('[HRM] Add log error:', error);
  }
}

// === LIFECYCLE EVENTS ===

// Khoi tao alarm khi extension duoc cai dat hoac cap nhat
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('checkTask', { periodInMinutes: 1 });
  console.log('[HRM] Alarm initialized on install');
  addLog('info', 'Extension đã được cài đặt/cập nhật', 'Alarm đã được khởi tạo');
});

// Dang ky lai alarm khi browser khoi dong (MV3 service worker co the bi terminate)
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('checkTask', { periodInMinutes: 1 });
  console.log('[HRM] Alarm re-registered on startup');
  addLog('info', 'Browser khởi động', 'Alarm đã được đăng ký lại');
});

// === ALARM HANDLER ===

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'checkTask') return;

  try {
    // Lay settings tu storage
    const data = await chrome.storage.local.get([
      'username',
      'password',
      'task',
      'detail',
      'time',
      'weekdays',
      'lastRunDate',
    ]);

    // Kiem tra co settings chua
    if (!data.username || !data.time || !data.weekdays?.length) {
      // Khong log de tranh spam console
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const todayDay = now.getDay().toString(); // 0-6 (0=Sunday)

    // 1. Kiem tra da chay hom nay chua
    if (data.lastRunDate === todayStr) {
      return;
    }

    // 2. Kiem tra co phai ngay duoc chon khong
    if (!data.weekdays.includes(todayDay)) {
      return;
    }

    // 3. Kiem tra da den gio chua
    const [targetHour, targetMinute] = data.time.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = targetHour * 60 + targetMinute;

    if (currentMinutes < targetMinutes) {
      return;
    }

    // 4. Tat ca dieu kien thoa man - thuc thi task
    console.log('[HRM] All conditions met, executing task at', now.toLocaleTimeString());
    addLog('pending', 'Bắt đầu thực thi task tự động', `Giờ hiện tại: ${now.toLocaleTimeString()}`);
    await executeTask(data, false); // isTestMode = false
  } catch (error) {
    console.error('[HRM] Alarm handler error:', error);
    addLog('failed', 'Lỗi alarm handler', error.message);
  }
});

// === TASK EXECUTION ===

async function executeTask(data, isTestMode = false) {
  try {
    // Danh dau dang chay va test mode
    await chrome.storage.local.set({
      lastRunDate: new Date().toISOString().split('T')[0],
      lastRunStatus: 'pending',
      lastRunTimestamp: Date.now(),
      isTestMode: isTestMode, // Flag de content.js biet co nen submit hay khong
    });

    // Tim tab HRM hoac tao moi
    const tabs = await chrome.tabs.query({ url: 'https://hrm.donga.edu.vn/*' });
    let targetTabId;

    if (tabs.length > 0) {
      // Inject vao tab dang co
      console.log('[HRM] Found existing HRM tab, injecting script');
      addLog('info', 'Tìm thấy tab HRM đang mở', 'Đang inject content script...');
      targetTabId = tabs[0].id;
      await chrome.scripting.executeScript({
        target: { tabId: targetTabId },
        files: ['content.js'],
      });
    } else {
      // Tao tab moi
      console.log('[HRM] Creating new HRM tab');
      addLog('info', 'Tạo tab HRM mới', 'Mở trang đăng nhập...');
      const newTab = await chrome.tabs.create({
        url: 'https://hrm.donga.edu.vn/nhan-vien/dang-nhap',
        active: false, // Chay ngam
      });
      targetTabId = newTab.id;
    }

    // Theo doi tab navigation de re-inject script khi trang thay doi
    // (sau login, trang se redirect -> can inject lai)
    const navigationHandler = function listener(tabId, info, tab) {
      if (tabId !== targetTabId) return;

      // Chi xu ly khi page load xong va la trang HRM
      if (info.status === 'complete' && tab.url && tab.url.includes('hrm.donga.edu.vn')) {
        console.log('[HRM] Tab navigated to:', tab.url);

        // Inject script vao trang moi
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: ['content.js'],
          })
          .catch((err) => console.log('[HRM] Script injection error:', err));
      }
    };

    // Dang ky listener
    chrome.tabs.onUpdated.addListener(navigationHandler);

    // Tu dong remove listener sau 60 giay de tranh memory leak
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(navigationHandler);
      console.log('[HRM] Navigation handler removed after timeout');
    }, 60000);
  } catch (error) {
    console.error('[HRM] Execute task error:', error);
    await chrome.storage.local.set({ lastRunStatus: 'failed' });
    addLog('failed', 'Lỗi thực thi task', error.message);
  }
}

// === MESSAGE HANDLERS ===

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Xu ly manual trigger tu popup
  if (message.type === 'MANUAL_TRIGGER') {
    handleManualTrigger(sendResponse);
    return true; // Giu connection cho async response
  }

  // Xu ly thong bao hoan thanh tu content script
  if (message.type === 'TASK_COMPLETE') {
    const status = message.success ? 'success' : 'failed';
    chrome.storage.local.set({
      lastRunStatus: status,
      lastRunTimestamp: Date.now(),
    });
    console.log('[HRM] Task completed:', status, message.message);
    addLog(status, message.success ? 'Task hoàn thành thành công' : 'Task thất bại', message.message);
  }
});

async function handleManualTrigger(sendResponse) {
  try {
    const data = await chrome.storage.local.get(['username', 'password', 'task', 'detail']);

    if (!data.username || !data.task) {
      addLog('failed', 'Manual trigger thất bại', 'Chưa cấu hình đầy đủ');
      sendResponse({ success: false, error: 'Chua cau hinh day du' });
      return;
    }

    addLog('pending', 'Manual trigger đã kích hoạt', 'Đang thực thi task thủ công...');

    // Reset lastRunDate de cho phep chay lai
    await chrome.storage.local.set({ lastRunDate: null });
    await executeTask(data, true); // isTestMode = true (khong submit)
    sendResponse({ success: true });
  } catch (error) {
    addLog('failed', 'Manual trigger lỗi', error.message);
    sendResponse({ success: false, error: error.message });
  }
}
