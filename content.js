/**
 * HRM Auto Task - Content Script
 * State machine pattern: moi trang = 1 state rieng biet
 * LOGIN -> NAVIGATE -> FILL_FORM -> COMPLETE
 *
 * IMPORTANT: Script nay CHI chay khi duoc inject boi background.js
 * Khong tu dong chay khi load trang (da xoa khoi manifest content_scripts)
 */

(async function () {
  'use strict';

  // Guard: Tranh chay nhieu lan tren cung 1 trang
  if (window.__HRM_CONTENT_LOADED__) {
    console.log('[HRM Content] Already loaded, skipping');
    return;
  }
  window.__HRM_CONTENT_LOADED__ = true;

  const currentUrl = window.location.href;
  console.log('[HRM Content] Script started on:', currentUrl);

  // === KIEM TRA DA HOAN THANH HOM NAY CHUA ===
  const storageData = await chrome.storage.local.get(['lastRunDate', 'lastRunStatus']);
  const todayStr = new Date().toISOString().split('T')[0];

  // Neu da hoan thanh hom nay (success) -> khong lam gi nua
  if (storageData.lastRunDate === todayStr && storageData.lastRunStatus === 'success') {
    console.log('[HRM Content] Task already completed today, skipping');
    return;
  }

  try {
    if (currentUrl.includes('/nhan-vien/dang-nhap')) {
      await handleLoginPage();
    } else if (currentUrl.includes('/social/home/congviecngay')) {
      await handleTaskPage();
    } else if (currentUrl.includes('hrm.donga.edu.vn')) {
      // Trang khac trong HRM (vd: trang chu sau login) -> chuyen den task page
      console.log('[HRM Content] Redirecting to task page');
      window.location.href = 'https://hrm.donga.edu.vn/social/home/congviecngay';
    }
  } catch (error) {
    console.error('[HRM Content] Error:', error);
    notifyBackground(false, error.message);
  }

  // === PAGE HANDLERS ===

  async function handleLoginPage() {
    console.log('[HRM Content] On login page');

    const data = await chrome.storage.local.get(['username', 'password']);

    if (!data.username || !data.password) {
      console.error('[HRM Content] No credentials found');
      notifyBackground(false, 'No credentials');
      return;
    }

    // Doi form load
    await sleep(500);

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.querySelector('#form button');

    if (!usernameInput || !passwordInput || !submitBtn) {
      console.error('[HRM Content] Login form elements not found');
      notifyBackground(false, 'Login form not found');
      return;
    }

    // Dien thong tin dang nhap
    usernameInput.value = data.username;
    passwordInput.value = data.password;

    // Trigger input events (mot so form can de validate)
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

    console.log('[HRM Content] Submitting login form');
    submitBtn.click();

    // Sau khi submit, trang se redirect
    // Content script se tu dong chay lai tren trang moi (do manifest content_scripts)
  }

  async function handleTaskPage() {
    console.log('[HRM Content] On task page');

    const data = await chrome.storage.local.get(['task', 'detail', 'isTestMode']);

    if (!data.task || !data.detail) {
      console.error('[HRM Content] No task data found');
      notifyBackground(false, 'No task data');
      return;
    }

    // Doi DOM load hoan toan
    await sleep(1000);

    // Tim va click nut mo form
    const formBtn = document.querySelector('#bscv div button');
    if (!formBtn) {
      console.error('[HRM Content] Form button not found');
      notifyBackground(false, 'Form button not found');
      return;
    }

    formBtn.click();
    console.log('[HRM Content] Form opened');

    // Doi form modal hien thi
    await waitForElement('#congviec', 5000);
    await sleep(500); // Cho animation hoan thanh

    // Dien form
    const taskInput = document.getElementById('congviec');
    const timeInput = document.getElementById('thoigian');

    if (!taskInput || !timeInput) {
      console.error('[HRM Content] Form inputs not found');
      notifyBackground(false, 'Form inputs not found');
      return;
    }

    // Dien ten cong viec
    taskInput.value = data.task;
    taskInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Dien ngay hom nay
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    timeInput.value = `${dd}/${mm}/${yyyy}`;
    timeInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Dien chi tiet vao iframe editor (TinyMCE hoac CKEditor)
    await fillEditorContent(data.detail);

    console.log('[HRM Content] Form filled successfully');

    // Tu dong click nut Luu (chi khi KHONG phai test mode)
    if (data.isTestMode) {
      console.log('[HRM Content] Test mode - form filled but NOT submitting');
      notifyBackground(true, 'Form filled (test mode - no submit)');
    } else {
      await sleep(500);
      const saveBtn = document.querySelector("input[value='Lưu'], button[type='submit'], .btn-primary");
      if (saveBtn) {
        console.log('[HRM Content] Clicking save button');
        saveBtn.click();
        await sleep(1000);
        notifyBackground(true, 'Form saved');
      } else {
        console.warn('[HRM Content] Save button not found, form filled but not saved');
        notifyBackground(true, 'Form filled (save btn not found)');
      }
    }
  }

  // === HELPER FUNCTIONS ===

  async function fillEditorContent(content) {
    // Thu tim iframe editor (TinyMCE style)
    const iframe = document.querySelector(
      "iframe[title*='soạn thảo'], iframe[title*='editor'], iframe[title*='Bộ soạn thảo']",
    );
    if (iframe) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const body = iframeDoc.querySelector('body');
        if (body) {
          body.innerHTML = content;
          console.log('[HRM Content] Detail filled in iframe');
          return;
        }
      } catch (e) {
        console.warn('[HRM Content] Could not access iframe:', e);
      }
    }

    // Thu tim contenteditable div (CKEditor 5 style)
    const editableDiv = document.querySelector('[contenteditable="true"]');
    if (editableDiv) {
      editableDiv.innerHTML = content;
      editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[HRM Content] Detail filled in contenteditable div');
      return;
    }

    // Thu tim textarea fallback
    const textarea = document.querySelector('#chitiet, textarea[name="chitiet"]');
    if (textarea) {
      textarea.value = content;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[HRM Content] Detail filled in textarea');
      return;
    }

    console.warn('[HRM Content] Could not find editor element for detail');
  }

  function notifyBackground(success, message) {
    try {
      chrome.runtime.sendMessage({
        type: 'TASK_COMPLETE',
        success: success,
        message: message,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('[HRM Content] Could not notify background:', e);
    }
  }

  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) {
          obs.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
})();
