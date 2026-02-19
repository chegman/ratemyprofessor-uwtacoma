# 📦 Project Overview & Integration Checklist

## 🗂️ File Structure

```
professor-review-extension/
│
├── manifest.json              ← Chrome extension config
├── content.js                 ← Main logic (YOU & ALEX work here)
├── popup.css                  ← Styling (YOU work here)
│
├── README.md                  ← Quick reference
├── BEGINNER_GUIDE.md          ← Step-by-step for YOU
├── ALEX_GUIDE.md              ← Step-by-step for ALEX
├── BACKEND_INTEGRATION.md     ← For backend team
└── icons/                     ← Add your extension icons here
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🎯 Team Responsibilities

### YOU - Frontend (UI + Page Detection)
**Files you'll edit:**
- `content.js` (functions: `detectProfessorNames`, `showPopup`, `attachHoverListeners`)
- `popup.css` (all styling)

**Your tasks:**
1. ✅ Make professor names detectable on MyPlan
2. ✅ Show popup on hover
3. ✅ Style the popup to look good
4. ✅ Set up initial API call structure

### ALEX - Frontend (API + Data Display)
**Files you'll edit:**
- `content.js` (functions: `fetchProfessorData`, `displayProfessorData`, error handlers)
- `popup.css` (error state styles)

**Your tasks:**
1. ✅ Handle API communication
2. ✅ Parse and display backend data
3. ✅ Implement error handling
4. ✅ Add loading states

### Backend Team (3 people)
**Their deliverable:**
- FastAPI endpoint: `GET /professor?name=...`
- Returns professor data with reviews and summary
- Enables CORS for Chrome extension

---

## 🔄 Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: USER HOVERS OVER PROFESSOR NAME                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: YOUR CODE (detectProfessorNames)                  │
│  - Detects "Smith, John" on page                           │
│  - Adds hover listeners                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: YOUR CODE (showPopup)                             │
│  - Creates popup element                                    │
│  - Shows "Loading..." spinner                              │
│  - Positions popup near professor name                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: ALEX'S CODE (fetchProfessorData)                  │
│  - Calls: GET /professor?name=Smith,%20John                │
│  - Waits for response                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: BACKEND RESPONDS                                   │
│  - Returns JSON with rating, summary, reviews              │
│  - Or returns error (404, 500, etc.)                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 6: ALEX'S CODE (displayProfessorData)                │
│  - Parses JSON response                                     │
│  - Updates popup with real data                            │
│  - Or shows error message if request failed                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 7: USER SEES FINAL RESULT                            │
│  - Popup shows rating, summary, reviews                     │
│  - User can read reviews and make informed decision        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Thursday Deliverables Checklist

### Your Deliverables (Frontend UI)

- [ ] **Extension loads on MyPlan**
  - Test: Go to myplan.uw.edu, check console for "Extension loaded"
  
- [ ] **Professor names are detected**
  - Test: Names should have dotted purple underline
  - Console should show "Found X professor names"
  
- [ ] **Popup appears on hover**
  - Test: Hover over name, popup shows after 300ms
  
- [ ] **Popup is styled properly**
  - Test: Check colors, spacing, readability
  - UW purple (#4b2e83) theme applied
  
- [ ] **Loading state works**
  - Test: Spinning loader appears while waiting
  
- [ ] **API call is initiated**
  - Test: Check Network tab in DevTools
  - Should see request to `/professor?name=...`

### Alex's Deliverables (API Integration)

- [ ] **API calls connect to backend**
  - Test: Change BACKEND_URL and verify connection
  
- [ ] **Real data displays correctly**
  - Test: Rating, summary, reviews all show up
  
- [ ] **Error handling works**
  - Test: Show "No reviews found" for 404
  - Test: Show "Server error" for 500
  - Test: Show network error when backend down
  
- [ ] **3-5 reviews display**
  - Test: Reviews are limited and formatted nicely
  
- [ ] **Console logging is helpful**
  - Test: Errors show clear messages for debugging

### Backend Team Deliverables

- [ ] **Endpoint is live**
  - URL: `GET /professor?name=...`
  
- [ ] **CORS is enabled**
  - Test: No CORS errors in browser console
  
- [ ] **Response format matches spec**
  - Test: Returns JSON with name, rating, summary, reviews
  
- [ ] **Error responses work**
  - Test: 404 for professor not found
  - Test: 500 for server errors

---

## 🧪 Testing Scenarios

### Scenario 1: Happy Path (Everything Works)

**Steps:**
1. Go to MyPlan
2. Find a professor name
3. Hover over it
4. See loading spinner
5. See real data appear

**Expected Result:**
- Popup shows within 2-3 seconds
- Displays rating, summary, and 3-5 reviews
- Everything is styled nicely

### Scenario 2: Professor Not Found

**Steps:**
1. Hover over obscure professor name
2. Backend returns 404

**Expected Result:**
- Popup shows "No reviews found" message
- Suggests being first to review
- No console errors

### Scenario 3: Backend is Down

**Steps:**
1. Stop backend server
2. Hover over professor name

**Expected Result:**
- Popup shows network error message
- Suggests checking connection
- OR shows mock data with warning

### Scenario 4: Slow Response

**Steps:**
1. Backend takes 5+ seconds
2. User is waiting

**Expected Result:**
- Loading spinner keeps spinning
- Eventually times out after 10 seconds
- Shows timeout error message

---

## 🔧 Development Workflow

### Day-to-Day Process

1. **Make changes to code**
   - Edit `content.js` or `popup.css`
   
2. **Reload extension**
   - Go to `chrome://extensions/`
   - Click reload button on your extension
   
3. **Refresh MyPlan page**
   - Press Ctrl+R (or Cmd+R on Mac)
   
4. **Test your changes**
   - Check console for errors
   - Test hover behavior
   - Verify API calls

5. **Commit to Git**
   ```bash
   git add .
   git commit -m "Added error handling"
   git push
   ```

### Coordinating Changes

**YOU & ALEX working together:**

```bash
# YOU: Create a branch for your work
git checkout -b feature/ui-detection

# Make your changes
# ...

# Commit and push
git add .
git commit -m "Implement professor name detection"
git push origin feature/ui-detection

# ALEX: Create a branch for his work
git checkout -b feature/api-integration

# Make changes
# ...

# Commit and push
git add .
git commit -m "Add API error handling"
git push origin feature/api-integration

# MERGE: When both are done
git checkout main
git merge feature/ui-detection
git merge feature/api-integration
```

---

## 🚨 Red Flags to Watch For

### Warning Signs

1. **Console is full of errors**
   - Fix errors one by one
   - Don't ignore them!

2. **Popup appears in wrong position**
   - Adjust positioning logic in `showPopup()`

3. **API calls are slow (>5 seconds)**
   - Tell backend team
   - Might need caching

4. **Professor names not detected**
   - MyPlan's HTML might have changed
   - Inspect page and update selectors

5. **CORS errors keep appearing**
   - Backend hasn't enabled CORS properly
   - Share BACKEND_INTEGRATION.md with them

---

## 📞 Communication Checklist

### With Each Other (YOU & ALEX)

- [ ] Agreed on which functions each person owns
- [ ] Shared BACKEND_URL variable value
- [ ] Tested together at least once
- [ ] Merged code without conflicts

### With Backend Team

- [ ] Shared expected API response format
- [ ] Confirmed CORS is enabled
- [ ] Got backend URL for testing
- [ ] Know who to ask if API breaks

### With Whole Team

- [ ] Everyone knows Thursday deadline
- [ ] Scheduled integration testing time
- [ ] Prepared demo for Thursday
- [ ] Documented any issues/blockers

---

## 🎯 Demo Preparation (Thursday)

### What to Show

1. **Open MyPlan in browser**
2. **Open DevTools console** (show technical work)
3. **Navigate to page with professors**
4. **Hover over a name** → Popup appears!
5. **Show the data**:
   - Rating
   - Summary
   - Reviews
6. **Show error handling**:
   - Demo what happens when backend is down
   - Demo "no reviews found" case

### What to Say

"Our Chrome extension detects professor names on MyPlan and shows their Rate My Professor reviews in a popup. The reviews are summarized by AI and filtered for abusive content. The frontend successfully calls our backend API and displays the results in real-time."

---

## 📚 Quick Reference

### Important URLs

- Chrome Extensions: `chrome://extensions/`
- MyPlan: `https://myplan.uw.edu`
- Backend (local): `http://localhost:8000`
- Backend (deployed): `https://your-backend.com`

### Important Files

- Extension logic: `content.js`
- Extension styles: `popup.css`
- Extension config: `manifest.json`

### Key Functions

- `detectProfessorNames()` - Finds professors (YOU)
- `showPopup()` - Shows the popup (YOU)
- `fetchProfessorData()` - Calls backend (ALEX)
- `displayProfessorData()` - Shows data (ALEX)

### Debugging Commands

```javascript
// In console:
console.log('Debug message:', variableName);

// Check if extension loaded
// Should see: "RateMyProf Extension loaded on MyPlan!"

// Check professor detection
// Should see: "Found X professor names"
```

---

## 🎓 Final Tips

1. **Start simple, add complexity later**
   - Get basic version working first
   - Add fancy features after core works

2. **Test frequently**
   - Don't write 100 lines before testing
   - Test after every small change

3. **Use console.log() liberally**
   - Add logs everywhere
   - They help you understand what's happening

4. **Ask for help early**
   - Stuck for 30+ minutes? Ask teammate or professor
   - Don't waste hours on one issue

5. **Document as you go**
   - Add comments explaining tricky parts
   - Update README with new findings

**Good luck with your Thursday deadline! 🚀**
