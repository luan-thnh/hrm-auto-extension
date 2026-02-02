# HRM Auto Task Extension

🤖 Chrome Extension that automatically fills daily work reports for Dong A University HRM

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-extension-orange)

## ✨ Features

- ⏰ **Scheduled Automation** - Set time and weekdays for automatic report submission
- 🔐 **Credential Storage** - Auto-login to HRM system
- 📝 **Auto Form Fill** - Automatically fills task name, details, and date
- 🧪 **Test Mode** - Dry run without submission for verification
- 📊 **Activity History** - View execution logs for debugging
- 👁️ **Show/Hide Password** - Toggle password visibility
- 🚫 **Anti-Duplicate** - Runs only once per day, prevents repeats

## 📦 Installation

### Method 1: From Release (Recommended)

1. Download `.zip` file from [Releases](https://github.com/luan-thnh/hrm-auto-extension/releases)
2. Extract the zip file
3. Open Chrome, navigate to `chrome://extensions/`
4. Enable **Developer mode** (top right corner)
5. Click **Load unpacked** and select the extracted folder

### Method 2: Clone from source

```bash
git clone https://github.com/luan-thnh/hrm-auto-extension.git
```

Then load unpacked as in Method 1.

## 🚀 Usage

1. **Click extension icon** on Chrome toolbar
2. **Fill in information**:
   - HRM Username & Password
   - Task name
   - Task details
   - Run time (e.g., 9:00 AM)
   - Select weekdays
3. **Click "Save & Activate"** to save and enable
4. Extension will **run automatically** at scheduled time

### Test Mode

- Click **"Chạy thử ngay (Test)"** to test
- Test mode only fills the form, **DOES NOT submit**
- Verify the form is correct before letting extension auto-submit

### View History

- Click **"Lịch sử"** tab to view execution logs
- Useful for debugging issues

## 📁 Structure

```
hrm-auto-extension/
├── manifest.json      # Extension manifest (MV3)
├── background.js      # Service worker - handles alarms & scheduling
├── content.js         # Content script - interacts with HRM page
├── popup.html         # Popup interface
├── popup.css          # Styles
├── popup.js           # Popup logic
├── icons/             # Extension icons
└── meo.jpg            # Cat avatar 🐱
```

## 🔧 How it Works

```
1. Alarm runs every minute to check conditions
2. If correct day + correct time + not run today:
   → Open HRM tab (if not exists)
   → Inject content script
   → Login (if needed)
   → Fill work report form
   → Submit (if not test mode)
   → Mark as completed
```

## ⚠️ Important Notes

- Extension requires access to `https://hrm.donga.edu.vn/*`
- Only works when Chrome is running
- If already run successfully today, won't run again

## 🐛 Troubleshooting

| Issue                      | Solution                                        |
| -------------------------- | ----------------------------------------------- |
| Extension not running      | Check if "Save & Activate" was clicked          |
| Runs but doesn't fill form | Reload extension in `chrome://extensions/`      |
| Login fails                | Verify username/password                        |
| Form doesn't submit        | Save button selector may have changed           |

## 🚀 Release Process

See [RELEASE.md](RELEASE.md) for detailed release workflow and automation setup.

## 📄 License

MIT License - See [LICENSE](LICENSE) file

## 👨‍💻 Author

Created by **V99** with AI assistance 🤖

---

⭐ If you find this useful, please star this repo!

