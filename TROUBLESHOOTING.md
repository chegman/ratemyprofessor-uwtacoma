# 🔧 Troubleshooting Guide

Quick fixes for common issues you'll encounter.

---

## 🚫 Extension Won't Load

### Symptom
Extension doesn't appear in `chrome://extensions/`

### Fixes

1. **Check folder structure:**
   ```
   professor-review-extension/
   ├── manifest.json  ← Must be in root folder!
   ├── content.js
   └── popup.css
   ```

2. **Check manifest.json syntax:**
   - Open in a text editor
   - Look for missing commas or brackets
   - Validate JSON: https://jsonlint.com/

3. **Re-load the extension:**
   - Go to `chrome://extensions/`
   - Click "Remove" then "Load unpacked" again

4. **Check Chrome version:**
   - Extension requires Manifest V3 (Chrome 88+)
   - Update Chrome if needed

---

## 🔍 Professor Names Not Detected

### Symptom
No dotted underlines appear on MyPlan, console shows "Found 0 professor names"

### Fixes

1. **Inspect the actual HTML:**
   ```
   Right-click professor name → Inspect
   ```
   Look at the HTML structure:
   ```html
   <td class="instructor-cell">
     <span>Smith, John</span>
   </td>
   ```

2. **Update selectors in content.js:**
   ```javascript
   const possibleSelectors = [
     '.instructor-cell span',  // ← Add what you found!
     'td.instructor',
     // ... more selectors
   ];
   ```

3. **Check page URL:**
   - Extension only works on `myplan.uw.edu`
   - Verify you're on the right domain

4. **Look for dynamic content:**
   - MyPlan might load content with JavaScript
   - Wait a few seconds for page to fully load

5. **Test the regex pattern:**
   - Open Console (F12)
   - Type:
     ```javascript
     /\b([A-Z][a-z]+),\s*([A-Z][a-z]+)\b/.test("Smith, John")
     // Should return: true
     ```

---

## 📦 Popup Won't Appear

### Symptom
Hovering over names doesn't show popup

### Fixes

1. **Check console for errors:**
   - Press F12 → Console tab
   - Look for red error messages
   - Fix any JavaScript errors

2. **Verify event listeners:**
   - Add debug log:
     ```javascript
     element.addEventListener('mouseenter', (e) => {
       console.log('HOVER DETECTED!', e.target);  // ← Add this
       // ... rest of code
     });
     ```

3. **Check popup.css is loading:**
   - Console should show no 404 errors
   - Verify `popup.css` is in same folder as `content.js`

4. **Test popup creation manually:**
   - In Console, type:
     ```javascript
     const testPopup = document.createElement('div');
     testPopup.className = 'rmp-popup';
     testPopup.innerHTML = '<h3>Test</h3>';
     testPopup.style.position = 'fixed';
     testPopup.style.top = '100px';
     testPopup.style.left = '100px';
     document.body.appendChild(testPopup);
     ```
   - Should see a popup appear

5. **Check z-index:**
   - MyPlan might have high z-index elements
   - Increase popup z-index in CSS:
     ```css
     .rmp-popup {
       z-index: 999999 !important;
     }
     ```

---

## 🌐 Network/API Errors

### Symptom
Console shows errors like:
- "Failed to fetch"
- "CORS policy"
- "NetworkError"

### CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:8000/professor' has been blocked by CORS policy
```

**Fixes:**
1. Backend must enable CORS (backend team's job)
2. Share `BACKEND_INTEGRATION.md` with backend team
3. Verify CORS in backend:
   ```python
   # In FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Backend Not Running

**Error:**
```
Failed to fetch
```

**Fixes:**
1. Check backend is actually running:
   - Open http://localhost:8000 in browser
   - Should see FastAPI response
2. Check backend URL matches:
   ```javascript
   const BACKEND_URL = 'http://localhost:8000';  // Correct port?
   ```
3. Try backend's health endpoint:
   ```
   http://localhost:8000/health
   ```

### Wrong URL

**Error:**
```
404 Not Found
```

**Fixes:**
1. Check endpoint path:
   ```javascript
   // Should be:
   `${BACKEND_URL}/professor?name=...`
   
   // NOT:
   `${BACKEND_URL}/professors?name=...`  // ❌ wrong
   `${BACKEND_URL}/api/professor?name=...`  // ❌ wrong
   ```
2. Ask backend team for exact URL

---

## 💥 JavaScript Errors

### "Cannot read property of undefined"

**Error:**
```
Cannot read property 'reviews' of undefined
```

**Fix:**
```javascript
// Before:
const reviews = data.reviews;  // ❌ Fails if data is undefined

// After:
const reviews = data?.reviews || [];  // ✅ Safe
// or
const reviews = data && data.reviews ? data.reviews : [];
```

### "querySelector returns null"

**Error:**
```
Cannot read property 'innerHTML' of null
```

**Fix:**
```javascript
// Before:
const popupBody = popupElement.querySelector('.rmp-popup-body');
popupBody.innerHTML = '...';  // ❌ Fails if not found

// After:
const popupBody = popupElement.querySelector('.rmp-popup-body');
if (popupBody) {  // ✅ Check first
  popupBody.innerHTML = '...';
}
```

---

## 🎨 Styling Issues

### Popup Looks Broken

**Issues:**
- Overlapping text
- Wrong colors
- Weird sizing

**Fixes:**

1. **Clear Chrome cache:**
   - Press Ctrl+Shift+R (or Cmd+Shift+R)
   - Force reload to get fresh CSS

2. **Check CSS loaded:**
   - DevTools → Network tab
   - Should see `popup.css` loaded (200 status)

3. **Inspect element:**
   - Right-click popup → Inspect
   - Check which styles are applied
   - Look for overriding styles

4. **Add !important temporarily:**
   ```css
   .rmp-popup {
     width: 400px !important;
     background: white !important;
   }
   ```

### Popup Position is Wrong

**Issue:**
Popup appears off-screen or in wrong location

**Fix:**
```javascript
// In showPopup() function, adjust positioning:
const rect = professorElement.getBoundingClientRect();

// Try different positions:
popup.style.top = `${rect.bottom + 10}px`;  // Below element
// or
popup.style.top = `${rect.top - popupHeight}px`;  // Above element

// Keep within viewport:
const maxLeft = window.innerWidth - 420;  // 400px width + 20px margin
popup.style.left = `${Math.min(rect.left, maxLeft)}px`;
```

---

## 🐌 Performance Issues

### Extension Makes Page Slow

**Symptom:**
MyPlan page becomes laggy

**Fixes:**

1. **Reduce scan frequency:**
   ```javascript
   // In initialize() function:
   // Before:
   setInterval(() => {
     const newElements = detectProfessorNames();
     attachHoverListeners(newElements);
   }, 2000);  // ❌ Every 2 seconds is too often
   
   // After:
   setInterval(() => {
     const newElements = detectProfessorNames();
     attachHoverListeners(newElements);
   }, 5000);  // ✅ Every 5 seconds
   ```

2. **Optimize selectors:**
   ```javascript
   // Avoid:
   document.querySelectorAll('*');  // ❌ Selects everything!
   
   // Use specific selectors:
   document.querySelectorAll('.instructor-name');  // ✅ Specific
   ```

3. **Debounce hover events:**
   ```javascript
   // Add delay before showing popup
   let hoverTimeout = null;
   
   element.addEventListener('mouseenter', (e) => {
     clearTimeout(hoverTimeout);
     hoverTimeout = setTimeout(() => {
       showPopup(e.target);
     }, 300);  // Wait 300ms before showing
   });
   ```

---

## 🔄 Changes Not Appearing

### Symptom
You edit code but nothing changes in the browser

### Fixes

**THE THREE-STEP RELOAD:**

1. **Reload extension:**
   - `chrome://extensions/`
   - Click 🔄 on your extension

2. **Refresh page:**
   - Press Ctrl+R (or Cmd+R)

3. **Hard refresh if needed:**
   - Press Ctrl+Shift+R (or Cmd+Shift+R)
   - Clears cache completely

**Pro tip:** Get in the habit of doing this after EVERY code change!

---

## 🔍 Debugging Techniques

### Add More Logging

```javascript
// Add console.logs EVERYWHERE:

function showPopup(professorElement) {
  console.log('showPopup called!', professorElement);
  
  const professorName = professorElement.textContent;
  console.log('Professor name:', professorName);
  
  const popup = document.createElement('div');
  console.log('Popup created:', popup);
  
  document.body.appendChild(popup);
  console.log('Popup added to page');
  
  // ... rest of function
}
```

### Use Debugger

```javascript
// Add breakpoints:
function fetchProfessorData(professorName, popupElement) {
  debugger;  // ← Execution will pause here
  
  const response = await fetch(`${BACKEND_URL}/professor?name=...`);
  // ... rest of function
}
```

Then:
1. Open DevTools → Sources tab
2. Execution pauses at `debugger`
3. Inspect variables, step through code

### Check Network Tab

1. Open DevTools → Network tab
2. Hover over professor name
3. Look for API request
4. Click on request to see:
   - Request URL
   - Response status
   - Response data
   - Timing

---

## 📞 When to Ask for Help

**Ask teammate/professor if:**

- ✅ Stuck for 30+ minutes
- ✅ Error message is completely confusing
- ✅ Something works on their computer but not yours
- ✅ Tried all fixes in this guide

**Include when asking:**

1. What you're trying to do
2. What happens instead
3. Error messages (screenshots)
4. What you've already tried

---

## 🆘 Emergency Fixes

### "Nothing works, I'm giving up!"

**DON'T GIVE UP!** Try this reset:

1. **Start fresh:**
   ```bash
   # Make backup
   cp -r professor-review-extension professor-review-extension-backup
   
   # Download clean files again
   # Test with minimal code first
   ```

2. **Test piece by piece:**
   - Comment out all code
   - Add back one function at a time
   - Test after each addition
   - Find exactly what breaks

3. **Use mock data:**
   - Skip backend integration temporarily
   - Just show mock data
   - Get basic popup working first
   - Add real API later

4. **Ask for pair programming:**
   - Work with Alex or teammate
   - Two brains are better than one
   - They might spot issue immediately

---

## ✅ Prevention Checklist

**Do this to avoid issues:**

- [ ] Test after every small change
- [ ] Keep DevTools console open
- [ ] Reload extension after code changes
- [ ] Add console.logs liberally
- [ ] Comment code you don't understand
- [ ] Backup working versions
- [ ] Test on different MyPlan pages
- [ ] Don't copy-paste without understanding

---

## 🎯 Quick Diagnostic Checklist

When something breaks, check these in order:

1. [ ] Console errors? (Fix those first)
2. [ ] Extension reloaded?
3. [ ] Page refreshed?
4. [ ] On myplan.uw.edu?
5. [ ] File paths correct?
6. [ ] Backend running?
7. [ ] CORS enabled?
8. [ ] Internet connection working?

**90% of issues are fixed by checking these!**

---

Remember: Every developer struggles with these issues. It's part of the learning process! 🚀
