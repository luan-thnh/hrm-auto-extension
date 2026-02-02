// Hàm để đồng bộ hóa 3 trường (Giờ, Phút, AM/PM) thành giá trị HH:MM (24h)
const syncTimeValue = () => {
  const hourInput = document.getElementById('time-hour');
  const minuteInput = document.getElementById('time-minute');
  // Lấy nút AM/PM đang được chọn bằng class 'ampm-active' mới trong CSS thuần
  const ampmBtn = document.querySelector('.ampm-btn.ampm-active');
  const timeHiddenInput = document.getElementById('time');

  let hour = parseInt(hourInput.value || 0, 10);
  let minute = parseInt(minuteInput.value || 0, 10);
  const ampm = ampmBtn ? ampmBtn.getAttribute('data-value') : 'AM';

  // Xử lý chuyển đổi 12h sang 24h
  if (ampm === 'PM' && hour < 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0; // 12 AM (Nửa đêm) là 00:xx
  }

  // Định dạng giờ/phút thành chuỗi 2 chữ số
  const formattedHour = String(hour).padStart(2, '0');
  const formattedMinute = String(minute).padStart(2, '0');

  timeHiddenInput.value = `${formattedHour}:${formattedMinute}`;
};

// Hàm để đặt trạng thái màu sắc cho nút AM/PM (Cập nhật để dùng class CSS thuần)
const setAmpmActive = (activeBtnId) => {
  const amBtn = document.getElementById('ampm-am');
  const pmBtn = document.getElementById('ampm-pm');

  [amBtn, pmBtn].forEach((btn) => {
    if (btn.id === activeBtnId) {
      btn.classList.add('ampm-active');
      btn.classList.remove('ampm-inactive');
    } else {
      btn.classList.remove('ampm-active');
      btn.classList.add('ampm-inactive');
    }
  });
};

// === STATUS DISPLAY FUNCTIONS ===

function loadStatus() {
  chrome.storage.local.get(['lastRunDate', 'lastRunStatus', 'lastRunTimestamp'], (data) => {
    const statusBadge = document.getElementById('status-badge');
    const lastRunTime = document.getElementById('last-run-time');

    if (!statusBadge || !lastRunTime) return;

    // Cập nhật status badge
    if (data.lastRunStatus) {
      statusBadge.className = 'status-badge status-' + data.lastRunStatus;
      switch (data.lastRunStatus) {
        case 'success':
          statusBadge.textContent = 'Thành công';
          break;
        case 'failed':
          statusBadge.textContent = 'Thất bại';
          break;
        case 'pending':
          statusBadge.textContent = 'Đang chạy...';
          break;
        default:
          statusBadge.textContent = 'Chưa chạy';
          statusBadge.className = 'status-badge status-idle';
      }
    } else {
      statusBadge.textContent = 'Chưa chạy';
      statusBadge.className = 'status-badge status-idle';
    }

    // Cập nhật last run time
    if (data.lastRunTimestamp) {
      const date = new Date(data.lastRunTimestamp);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const mi = String(date.getMinutes()).padStart(2, '0');
      lastRunTime.textContent = `${dd}/${mm} lúc ${hh}:${mi}`;
    } else {
      lastRunTime.textContent = 'Chưa chạy lần nào';
    }
  });
}

// === LOG HISTORY FUNCTIONS ===

function formatLogTime(timestamp) {
  const date = new Date(timestamp);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

function loadLogs() {
  const logsContainer = document.getElementById('logs-container');
  if (!logsContainer) return;

  chrome.storage.local.get(['logs'], (data) => {
    const logs = data.logs || [];

    if (logs.length === 0) {
      logsContainer.innerHTML = '<div class="log-empty">Chưa có log nào</div>';
      return;
    }

    // Sắp xếp theo thời gian mới nhất trước
    const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

    logsContainer.innerHTML = sortedLogs
      .map(
        (log) => `
      <div class="log-item log-${log.type || 'info'}">
        <span class="log-time">${formatLogTime(log.timestamp)}</span>
        <span class="log-message">${log.message}</span>
        ${log.detail ? `<span class="log-detail">${log.detail}</span>` : ''}
      </div>
    `,
      )
      .join('');
  });
}

function clearLogs() {
  if (confirm('Bạn có chắc muốn xóa tất cả log?')) {
    chrome.storage.local.set({ logs: [] }, () => {
      loadLogs();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // --- Lắng nghe sự kiện AM/PM và Time Input ---
  const ampmBtns = document.querySelectorAll('.ampm-btn');
  const hourInput = document.getElementById('time-hour');
  const minuteInput = document.getElementById('time-minute');
  const saveButton = document.getElementById('save');
  const cancelButton = document.getElementById('cancel-auto');
  const manualTriggerBtn = document.getElementById('manual-trigger');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const eyeOpen = document.getElementById('eye-open');
  const eyeClosed = document.getElementById('eye-closed');

  // --- 0. Tải status khi popup mở ---
  loadStatus();
  loadLogs();

  // Tự động cập nhật status mỗi 2 giây
  setInterval(loadStatus, 2000);
  // Tự động cập nhật logs mỗi 3 giây
  setInterval(loadLogs, 3000);

  // --- Tabs Switching ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Remove active from all tabs
      tabBtns.forEach((b) => b.classList.remove('tab-active'));
      tabContents.forEach((c) => c.classList.remove('tab-content-active'));

      // Add active to clicked tab
      btn.classList.add('tab-active');
      document.getElementById(`tab-${targetTab}`).classList.add('tab-content-active');

      // Reload logs when switching to logs tab
      if (targetTab === 'logs') {
        loadLogs();
      }
    });
  });

  // --- Clear Logs Button ---
  const clearLogsBtn = document.getElementById('clear-logs');
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', clearLogs);
  }

  // --- Password Toggle ---
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      // Toggle icon visibility
      // When password is hidden (type="password"): show eye-open, hide eye-closed
      // When password is visible (type="text"): hide eye-open, show eye-closed
      eyeOpen.classList.toggle('hidden', isPassword);
      eyeClosed.classList.toggle('hidden', !isPassword);
    });
  }

  // Lắng nghe click cho AM/PM
  ampmBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setAmpmActive(btn.id);
      syncTimeValue();
    });
  });

  // Lắng nghe thay đổi cho Giờ và Phút
  [hourInput, minuteInput].forEach((input) => {
    input.addEventListener('change', syncTimeValue);
  });

  // --- 1. Tải dữ liệu đã lưu khi popup mở ---
  chrome.storage.local.get(['username', 'password', 'task', 'detail', 'time', 'weekdays'], (data) => {
    // Tải các trường dữ liệu thông thường
    if (data.username) document.getElementById('username').value = data.username;
    if (data.password) document.getElementById('password').value = data.password;
    if (data.task) document.getElementById('task').value = data.task;
    if (data.detail) document.getElementById('detail').value = data.detail;

    // Xử lý Giờ: Phân tích giá trị 24h đã lưu (data.time)
    if (data.time) {
      const [fullHour, minute] = data.time.split(':').map((val) => parseInt(val, 10));

      let displayHour = fullHour;
      let ampm = 'AM';

      if (fullHour >= 12) {
        ampm = 'PM';
        displayHour = fullHour === 12 ? 12 : fullHour - 12;
      } else if (fullHour === 0) {
        displayHour = 12; // 00:xx hiển thị là 12:xx AM
        ampm = 'AM';
      }

      hourInput.value = displayHour;
      minuteInput.value = String(minute).padStart(2, '0');

      setAmpmActive(ampm === 'AM' ? 'ampm-am' : 'ampm-pm');
      document.getElementById('time').value = data.time;
    } else {
      // Nếu không có dữ liệu, đặt mặc định 9:00 AM
      hourInput.value = 9;
      minuteInput.value = '00';
      setAmpmActive('ampm-am');
      document.getElementById('time').value = '09:00';
    }

    // Xử lý các checkbox ngày trong tuần
    const checkboxes = document.querySelectorAll('input[name="weekday"]');
    if (data.weekdays && Array.isArray(data.weekdays)) {
      checkboxes.forEach((cb) => {
        cb.checked = false;
        if (data.weekdays.includes(cb.value)) {
          cb.checked = true;
        }
      });
    }
  });

  // --- 2. Logic Lưu & Kích hoạt ---
  saveButton.addEventListener('click', () => {
    // Đảm bảo đồng bộ hóa lần cuối trước khi lưu
    syncTimeValue();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const task = document.getElementById('task').value;
    const detail = document.getElementById('detail').value;
    const time = document.getElementById('time').value;

    const weekdays = Array.from(document.querySelectorAll('input[name="weekday"]:checked')).map((cb) => cb.value);

    // Kiểm tra validation
    if (
      !username ||
      !password ||
      !task ||
      !detail ||
      !time ||
      weekdays.length === 0 ||
      !hourInput.value ||
      !minuteInput.value
    ) {
      alert('Vui lòng điền đầy đủ thông tin và chọn ít nhất 1 ngày!');
      return;
    }

    chrome.storage.local.set({ username, password, task, detail, time, weekdays }, () => {
      alert('Thông tin đã lưu & Kích hoạt. Extension sẽ tự động điền báo cáo vào ngày được chọn!');
      // Đặt lại báo thức để đảm bảo nó đang chạy
      chrome.alarms.create('checkTask', { periodInMinutes: 1 });
    });
  });

  // --- 3. Logic Hủy Auto ---
  cancelButton.addEventListener('click', () => {
    // Xóa báo thức (alarm)
    chrome.alarms.clear('checkTask', (wasCleared) => {
      if (wasCleared) {
        // Xóa dữ liệu đã lưu
        chrome.storage.local.remove(
          [
            'username',
            'password',
            'task',
            'detail',
            'time',
            'weekdays',
            'lastRunDate',
            'lastRunStatus',
            'lastRunTimestamp',
          ],
          () => {
            alert('Đã Hủy Auto thành công! Tác vụ điền báo cáo tự động đã dừng.');
            window.location.reload();
          },
        );
      } else {
        alert('Không có tác vụ Auto nào đang chạy để hủy.');
      }
    });
  });

  // --- 4. Logic Manual Trigger (MỚI) ---
  if (manualTriggerBtn) {
    manualTriggerBtn.addEventListener('click', () => {
      // Disable button để tránh click nhiều lần
      manualTriggerBtn.disabled = true;
      manualTriggerBtn.textContent = 'Đang chạy...';

      try {
        // Gửi message đến background để trigger task
        chrome.runtime.sendMessage({ type: 'MANUAL_TRIGGER' }, (response) => {
          if (chrome.runtime.lastError) {
            alert('Lỗi: ' + chrome.runtime.lastError.message);
          } else if (response && response.success) {
            alert('Đã kích hoạt! Kiểm tra tab HRM.');
          } else {
            alert('Không thể kích hoạt: ' + (response?.error || 'Unknown error'));
          }

          // Re-enable button
          manualTriggerBtn.disabled = false;
          manualTriggerBtn.textContent = 'Chạy thử ngay (Test)';

          // Reload status
          loadStatus();
        });
      } catch (error) {
        alert('Lỗi: ' + error.message);
        manualTriggerBtn.disabled = false;
        manualTriggerBtn.textContent = 'Chạy thử ngay (Test)';
      }
    });
  }
});
