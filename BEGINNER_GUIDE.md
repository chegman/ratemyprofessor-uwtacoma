# 🎯 BEGINNER'S STEP-BY-STEP GUIDE

## Part 1: Setting Up Your Development Environment

### What You'll Need
- Chrome browser
- A text editor (VS Code recommended)
- This extension folder
- Your team's backend running (eventually)

### Step 1: Download and Organize Files

1. Create a new folder on your computer called `professor-review-extension`
2. Put all these files inside:
   - `manifest.json`
   - `content.js`
   - `popup.css`
   - `README.md`

### Step 2: Install the Extension in Chrome

**Watch this happen in real-time:**

1. Open Google Chrome
2. Type in the address bar: `chrome://extensions/`
3. Look for a toggle switch in the top-right that says "Developer mode" - **turn it ON**
4. You'll see new buttons appear. Click "Load unpacked"
5. Navigate to your `professor-review-extension` folder and select it
6. Click "Select Folder"

**What you should see:**
- Your extension appears in the list with a puzzle piece icon
- It says "RateMyProf UW Assistant"

🎉 **Congrats! Your extension is installed!**

---

## Part 2: Testing Without Backend (Mock Data)

### Step 3: Test on MyPlan

1. Open a new tab and go to: https://myplan.uw.edu
2. Navigate to any course schedule or catalog page
3. Look for professor names on the page

**What should happen:**
- Professor names will have a dotted purple underline
- When you hover over them, they'll highlight in light purple
- After 300ms, a popup appears with mock data

**If nothing happens:**
- Open Chrome DevTools (F12 or right-click → Inspect)
- Go to the "Console" tab
- Look for the message: "RateMyProf Extension loaded on MyPlan!"
- Check for any red error messages

### Troubleshooting Common Issues

**Problem: "RateMyProf Extension loaded" doesn't appear**
- Solution: Make sure you're on myplan.uw.edu (not another site)
- Refresh the page (Ctrl+R or Cmd+R)

**Problem: Names aren't detected**
- This is OK! MyPlan's HTML structure might be different than expected
- We'll fix this by inspecting the actual page structure (see Part 4)

**Problem: Popup doesn't show**
- Check the Console for JavaScript errors
- Make sure the name has a dotted underline (if not, it wasn't detected)

---

## Part 3: Understanding the Code (For YOUR Tasks)

### Your Job: Frontend UI + Page Detection

Here's what each file does:

#### `manifest.json` - The Configuration
```json
{
  "content_scripts": [
    {
      "matches": ["https://myplan.uw.edu/*"],  // Only runs on MyPlan
      "js": ["content.js"],                     // JavaScript to run
      "css": ["popup.css"]                      // Styles to inject
    }
  ]
}
```

#### `content.js` - The Brain (YOUR MAIN FILE)

**Key functions you'll work with:**

1. **`detectProfessorNames()`** - Finds professor names on the page
   - You might need to update this based on MyPlan's actual HTML
   
2. **`attachHoverListeners()`** - Makes names interactive
   - Already working!

3. **`showPopup()`** - Creates and displays the popup
   - You can customize the look here

4. **`fetchProfessorData()`** - Calls your backend API
   - Change `BACKEND_URL` when backend is ready

#### `popup.css` - The Styling

- Changes colors, sizes, animations
- Uses UW purple (#4b2e83) as the main color
- You can customize this to match your vision

---

## Part 4: Inspecting MyPlan to Find Professor Names

**This is CRITICAL for your deliverable!**

### Step 4: Inspect the Actual HTML

1. Go to myplan.uw.edu and find a page with professor names
2. Right-click on a professor name
3. Select "Inspect" or "Inspect Element"
4. You'll see HTML that looks like:

```html
<td class="some-class">
  <span>Smith, John</span>
</td>
```

5. Look for patterns:
   - What HTML tag contains the name? (`<span>`, `<td>`, `<div>`)
   - Does it have a class name? (e.g., `class="instructor"`)
   - Where is it in the page structure?

### Step 5: Update the Selector

In `content.js`, find this section:

```javascript
const possibleSelectors = [
  '.instructor-name',     // ← Add the classes you found
  '[data-professor]',
  '.faculty-name',
  // Add more here!
];
```

**Add the actual selectors you found!** For example:
```javascript
const possibleSelectors = [
  '.instructor-name',
  'td.instructor',        // ← If you found this
  '.faculty-member',      // ← Or this
  'span.prof-name',       // ← Or this
];
```

### Step 6: Reload and Test

1. Go back to `chrome://extensions/`
2. Find your extension
3. Click the circular reload icon 🔄
4. Go back to MyPlan and refresh the page
5. Check if names are now detected!

---

## Part 5: Connecting to Backend (When Ready)

### Step 7: Update Backend URL

When your backend team has the server running:

1. Open `content.js`
2. Find this line at the top:
```javascript
const BACKEND_URL = 'http://localhost:8000';
```

3. Change it to your backend's address:
   - If running locally: `http://localhost:8000` (or their port)
   - If deployed: `https://your-backend.herokuapp.com` (or wherever)

### Step 8: Test Backend Connection

The extension will automatically try to call:
```
GET http://localhost:8000/professor?name=Smith,%20John
```

**Check if it works:**
1. Open DevTools Console (F12)
2. Hover over a professor name
3. Look for:
   - Network requests in the Network tab
   - Console logs showing the API response
   - Any error messages

---

## Part 6: Working with Alex

### Division of Labor

**YOU focus on:**
- ✅ Detecting professor names (Steps 4-6 above)
- ✅ Making the popup appear on hover
- ✅ Styling and positioning the popup
- ✅ Initial API call setup

**ALEX focuses on:**
- Handling the API response format
- Displaying the actual review data nicely
- Error handling (what if no reviews? what if server down?)
- Loading states and animations

### How to Collaborate

1. **You**: Get the popup showing with mock data
2. **Alex**: Replace mock data display with real API response
3. **Together**: Test and refine

**File Sharing:**
- Put your code in the GitHub repo
- Alex can modify the same files
- Use different functions so you don't conflict

---

## Part 7: Testing Checklist

### Your Definition of Done ✅

Test each of these:

- [ ] Extension loads on MyPlan without errors
- [ ] Professor names are detected and highlighted
- [ ] Hovering shows a popup after 300ms
- [ ] Popup displays professor name correctly
- [ ] Popup calls `GET /professor?name=...` (check DevTools Network tab)
- [ ] Loading spinner appears while waiting
- [ ] Mock data displays correctly (before backend ready)
- [ ] Popup closes when clicking X button
- [ ] Popup closes when mouse leaves
- [ ] Popup stays open when hovering over it

---

## Part 8: Common Beginner Mistakes to Avoid

### ❌ Mistake 1: Forgetting to Reload Extension
**After changing ANY code:**
1. Go to `chrome://extensions/`
2. Click reload 🔄 on your extension
3. Refresh the MyPlan page

### ❌ Mistake 2: Wrong Backend URL
- Double-check the URL matches your backend team's server
- Include `http://` or `https://`
- Check the port number

### ❌ Mistake 3: Not Checking Console
- **Always** have DevTools open when testing
- Console shows helpful error messages
- Network tab shows API requests

### ❌ Mistake 4: Testing on Wrong Website
- Extension ONLY works on myplan.uw.edu
- Won't work on google.com or other sites

---

## 🎓 Next Steps for Thursday

**Before your deadline:**

1. ✅ Get extension loading on MyPlan
2. ✅ Find the correct HTML selectors for professor names
3. ✅ Get popup showing on hover
4. ✅ Confirm API call is being made (even if it fails)
5. ✅ Share code with Alex so he can work on API handling

**Demo to your team:**
1. Show the extension detecting names
2. Show the popup appearing
3. Show it trying to call the backend (Network tab)

---

## 🆘 If You Get Stuck

### Debug Workflow:

1. **Check Console First**
   - Are there red errors?
   - What do they say?

2. **Check Network Tab**
   - Is the API call being made?
   - What's the response?

3. **Check Extension Page**
   - Go to `chrome://extensions/`
   - Look for errors under your extension

4. **Simplify and Test**
   - Comment out complex code
   - Add `console.log()` everywhere
   - Test one piece at a time

### Ask Your Team:
- "Can you check if my extension loads for you?"
- "Does the popup appear when you test it?"
- "What backend URL should I use?"

---

## 📚 Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [JavaScript Debugging](https://developer.chrome.com/docs/devtools/javascript/)
- [FastAPI CORS Setup](https://fastapi.tiangolo.com/tutorial/cors/)

**Good luck! You've got this! 🚀**
