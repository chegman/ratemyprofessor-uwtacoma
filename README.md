# RateMyProf UW Assistant

A Chrome extension that shows professor reviews and ratings when hovering over professor names on MyPlan.uw.edu.

## 🚀 Quick Start

1. **Install the extension:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select this folder

2. **Test it:**
   - Go to https://myplan.uw.edu
   - Find a course with professor names
   - Hover over a professor name
   - See the popup with reviews!

## 📁 Project Files

- `manifest.json` - Chrome extension configuration
- `content.js` - Main logic (detects professors, shows popups)
- `popup.css` - Styling for the popup
- `INSTALLATION.md` - Detailed setup and update instructions
- `TROUBLESHOOTING.md` - Solutions to common problems

## 🎯 How It Works

1. Scans MyPlan pages for "Instructor" labels
2. Detects professor names underneath
3. Shows a popup on hover with:
   - Overall rating
   - AI-generated summary
   - Recent reviews from Rate My Professor

## 🔧 For Developers

### Connecting to Backend

Edit `content.js` line 2:
```javascript
const BACKEND_URL = 'http://localhost:8000'; // Change to your backend URL
```

### Updating the Extension

After changing any file:
1. Go to `chrome://extensions/`
2. Click reload button (🔄) on this extension
3. Refresh the MyPlan page

### Expected API Format

```json
{
  "name": "John Smith",
  "rating": 4.2,
  "summary": "Great professor...",
  "reviews": [
    {
      "rating": 5.0,
      "text": "Excellent!",
      "course": "CSE 142"
    }
  ]
}
```

## 👥 Team Responsibilities

- **Frontend (UI):** Detect professors, style popup
- **Frontend (API):** Handle backend calls, display data
- **Backend:** Provide `/professor?name=...` endpoint

## 📚 Documentation

- **INSTALLATION.md** - Setup and update guide
- **BEGINNER_GUIDE.md** - Step-by-step for beginners
- **ALEX_GUIDE.md** - API integration guide
- **BACKEND_INTEGRATION.md** - For backend team
- **TROUBLESHOOTING.md** - Common issues and fixes

## ✅ Features

- ✅ Automatic professor name detection
- ✅ Hover-triggered popup (300ms delay)
- ✅ Smart positioning (stays in viewport)
- ✅ UW purple theme
- ✅ Loading states
- ✅ Error handling
- ✅ Supports middle initials (e.g., "Bryan S Goda")
- ✅ Mock data for testing

## 🐛 Issues?

Check the console (F12) for error messages, then see `TROUBLESHOOTING.md`.

## 📝 Current Status

**Version:** 1.0  
**Status:** ✅ Working with mock data  
**Next:** Connect to backend API

---

**Built for UW Tacoma students** 🎓

