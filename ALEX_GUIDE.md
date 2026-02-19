# 👨‍💻 Alex's Guide - API Integration & Data Display

## Your Mission

Handle the data flow between the Chrome extension and the backend, and make sure reviews display nicely.

---

## 📋 Your Deliverables (Due Thursday)

1. ✅ Handle API calls from extension → backend
2. ✅ Replace mock data with real API response
3. ✅ Format and display 3-5 raw reviews
4. ✅ Add error handling for:
   - "No reviews found"
   - "Server error"

**Definition of Done:** Extension successfully displays real reviews from backend inside popup.

---

## 🎯 Where to Focus in the Code

You'll mainly work in `content.js` - specifically these functions:

### 1. `fetchProfessorData()` - API Call Handler

**Current code:**
```javascript
async function fetchProfessorData(professorName, popupElement) {
  try {
    const response = await fetch(`${BACKEND_URL}/professor?name=${encodeURIComponent(professorName)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    displayProfessorData(data, popupElement);
    
  } catch (error) {
    console.error('Error fetching professor data:', error);
    displayMockData(professorName, popupElement);
  }
}
```

**Your improvements:**

```javascript
async function fetchProfessorData(professorName, popupElement) {
  try {
    console.log(`Fetching data for: ${professorName}`);
    
    const response = await fetch(
      `${BACKEND_URL}/professor?name=${encodeURIComponent(professorName)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    );
    
    // Handle different HTTP status codes
    if (response.status === 404) {
      displayNoReviewsFound(popupElement);
      return;
    }
    
    if (response.status === 500) {
      displayServerError(popupElement);
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Received data:', data);
    
    // Validate data structure
    if (!data || !data.reviews) {
      throw new Error('Invalid data format from backend');
    }
    
    displayProfessorData(data, popupElement);
    
  } catch (error) {
    console.error('Error fetching professor data:', error);
    
    // Different error messages for different error types
    if (error.name === 'AbortError') {
      displayTimeoutError(popupElement);
    } else if (error.message.includes('Failed to fetch')) {
      displayNetworkError(popupElement);
    } else {
      displayGenericError(popupElement, error.message);
    }
  }
}
```

---

### 2. `displayProfessorData()` - Format Real Data

**Your task:** Make this function handle real backend responses.

```javascript
function displayProfessorData(data, popupElement) {
  const popupBody = popupElement.querySelector('.rmp-popup-body');
  
  // Validate data
  const rating = data.rating || 'N/A';
  const summary = data.summary || 'No summary available';
  const reviews = data.reviews || [];
  
  // Build HTML
  let html = `
    <div class="rmp-rating-section">
      <div class="rmp-rating-badge">${rating}</div>
      <div class="rmp-rating-label">Overall Rating</div>
    </div>
  `;
  
  // Add summary if available
  if (summary && summary !== 'No summary available') {
    html += `
      <div class="rmp-summary-section">
        <h4>AI Summary</h4>
        <p class="rmp-summary-text">${escapeHtml(summary)}</p>
      </div>
    `;
  }
  
  // Display reviews
  html += `<div class="rmp-reviews-section">`;
  html += `<h4>Recent Reviews (${reviews.length})</h4>`;
  
  if (reviews.length === 0) {
    html += `<p class="rmp-no-reviews">No reviews found for this professor.</p>`;
  } else {
    // Limit to 5 reviews
    const displayReviews = reviews.slice(0, 5);
    
    displayReviews.forEach((review, index) => {
      html += `
        <div class="rmp-review-card">
          <div class="rmp-review-rating">⭐ ${review.rating || 'N/A'}</div>
          <p class="rmp-review-text">${escapeHtml(review.text || 'No comment')}</p>
          ${review.course ? `<div class="rmp-review-course">Course: ${escapeHtml(review.course)}</div>` : ''}
          ${review.date ? `<div class="rmp-review-date">${formatDate(review.date)}</div>` : ''}
        </div>
      `;
    });
    
    // If there are more reviews, show count
    if (reviews.length > 5) {
      html += `
        <div class="rmp-more-reviews">
          + ${reviews.length - 5} more reviews available
        </div>
      `;
    }
  }
  
  html += `</div>`;
  
  popupBody.innerHTML = html;
}

// Helper function to prevent XSS attacks
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to format dates
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateString;
  }
}
```

---

### 3. Error Display Functions - Your New Functions

Add these new functions to handle different error states:

```javascript
// No reviews found (404)
function displayNoReviewsFound(popupElement) {
  const popupBody = popupElement.querySelector('.rmp-popup-body');
  popupBody.innerHTML = `
    <div class="rmp-error-state">
      <div class="rmp-error-icon">🔍</div>
      <h4>No Reviews Found</h4>
      <p>This professor doesn't have any reviews yet.</p>
      <p class="rmp-error-suggestion">Be the first to review!</p>
    </div>
  `;
}

// Server error (500)
function displayServerError(popupElement) {
  const popupBody = popupElement.querySelector('.rmp-popup-body');
  popupBody.innerHTML = `
    <div class="rmp-error-state">
      <div class="rmp-error-icon">⚠️</div>
      <h4>Server Error</h4>
      <p>Something went wrong on our end.</p>
      <p class="rmp-error-suggestion">Please try again in a moment.</p>
    </div>
  `;
}

// Network error
function displayNetworkError(popupElement) {
  const popupBody = popupElement.querySelector('.rmp-popup-body');
  popupBody.innerHTML = `
    <div class="rmp-error-state">
      <div class="rmp-error-icon">📡</div>
      <h4>Connection Error</h4>
      <p>Unable to connect to the server.</p>
      <p class="rmp-error-suggestion">Check your internet connection.</p>
    </div>
  `;
}

// Timeout error
function displayTimeoutError(popupElement) {
  const popupBody = popupElement.querySelector('.rmp-popup-body');
  popupBody.innerHTML = `
    <div class="rmp-error-state">
      <div class="rmp-error-icon">⏱️</div>
      <h4>Request Timeout</h4>
      <p>The server is taking too long to respond.</p>
      <p class="rmp-error-suggestion">Please try again.</p>
    </div>
  `;
}

// Generic error
function displayGenericError(popupElement, errorMessage) {
  const popupBody = popupElement.querySelector('.rmp-popup-body');
  popupBody.innerHTML = `
    <div class="rmp-error-state">
      <div class="rmp-error-icon">❌</div>
      <h4>Error</h4>
      <p>An error occurred while loading reviews.</p>
      <p class="rmp-error-detail">${escapeHtml(errorMessage)}</p>
    </div>
  `;
}
```

---

### 4. Add CSS for Error States

Add this to `popup.css`:

```css
/* Error States */
.rmp-error-state {
  text-align: center;
  padding: 40px 20px;
}

.rmp-error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.rmp-error-state h4 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #333;
}

.rmp-error-state p {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
}

.rmp-error-suggestion {
  font-style: italic;
  color: #999;
}

.rmp-error-detail {
  font-size: 12px;
  color: #999;
  margin-top: 12px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
}

/* More reviews indicator */
.rmp-more-reviews {
  text-align: center;
  padding: 12px;
  color: #666;
  font-size: 13px;
  font-style: italic;
}

/* Review date */
.rmp-review-date {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}
```

---

## 🧪 Testing Your Changes

### Test Plan

1. **Test with Mock Backend**
   
   Create a simple test server:
   
   ```javascript
   // test-server.js (run with Node.js)
   const http = require('http');
   
   const server = http.createServer((req, res) => {
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Content-Type', 'application/json');
     
     if (req.url.startsWith('/professor')) {
       // Simulate delay
       setTimeout(() => {
         res.writeHead(200);
         res.end(JSON.stringify({
           name: "Smith, John",
           rating: 4.5,
           summary: "Great professor according to students!",
           reviews: [
             {
               rating: 5.0,
               text: "Best professor ever!",
               course: "CSE 142",
               date: "2024-03-15"
             },
             {
               rating: 4.0,
               text: "Good but challenging.",
               course: "CSE 143",
               date: "2024-02-20"
             }
           ]
         }));
       }, 1000);
     } else {
       res.writeHead(404);
       res.end(JSON.stringify({ error: "Not found" }));
     }
   });
   
   server.listen(8000, () => {
     console.log('Test server running on http://localhost:8000');
   });
   ```

2. **Test Different Scenarios**

   ```javascript
   // In content.js, temporarily override fetchProfessorData for testing:
   
   async function fetchProfessorData(professorName, popupElement) {
     // Test Case 1: Success
     displayProfessorData({
       name: professorName,
       rating: 4.5,
       summary: "Test summary",
       reviews: [
         { rating: 5.0, text: "Great!", course: "CSE 142" }
       ]
     }, popupElement);
     
     // Test Case 2: No reviews (uncomment to test)
     // displayNoReviewsFound(popupElement);
     
     // Test Case 3: Server error (uncomment to test)
     // displayServerError(popupElement);
   }
   ```

3. **Check Console Logs**
   - Open DevTools (F12)
   - Look for your console.log messages
   - Verify data structure

---

## 📊 What Real Backend Data Looks Like

Your backend team will return JSON like this:

```json
{
  "name": "Smith, John",
  "rating": 4.2,
  "summary": "Students appreciate this professor's clear explanations and helpful office hours. Some find the workload challenging but manageable.",
  "reviews": [
    {
      "rating": 5.0,
      "text": "Excellent professor! Very approachable and explains concepts clearly.",
      "course": "CSE 142",
      "date": "2024-03-15"
    },
    {
      "rating": 4.0,
      "text": "Good lectures but tough exams. Office hours are helpful.",
      "course": "CSE 143",
      "date": "2024-02-28"
    },
    {
      "rating": 4.5,
      "text": "Really enjoyed this class. Professor makes difficult topics understandable.",
      "course": "CSE 154",
      "date": "2024-01-20"
    }
  ]
}
```

Make sure your code handles:
- Missing fields (rating, summary, course, date)
- Empty arrays
- Extra fields (ignore them gracefully)

---

## ✅ Your Definition of Done Checklist

Before Thursday, make sure:

- [ ] API calls work with real backend URL
- [ ] Loading state shows while waiting
- [ ] Real data displays correctly in popup
- [ ] At least 3-5 reviews show (if available)
- [ ] Rating and summary display properly
- [ ] Error handling for 404 (no reviews)
- [ ] Error handling for 500 (server error)
- [ ] Error handling for network issues
- [ ] Console logs show helpful debugging info
- [ ] Code is commented and clean

---

## 🤝 Coordinating with Your Teammate

**Your teammate (frontend UI) handles:**
- Detecting professor names
- Showing/positioning popup
- Basic styling

**You handle:**
- API communication
- Data formatting
- Error states
- Response validation

**Where you'll both edit `content.js`:**
- They focus on: `detectProfessorNames()`, `showPopup()`, positioning
- You focus on: `fetchProfessorData()`, `displayProfessorData()`, error functions

**Tips to avoid conflicts:**
- Use Git branches
- Communicate before editing same functions
- Test together frequently

---

## 🐛 Common Issues You'll Face

### Issue 1: CORS Error

**Error message:**
```
Access to fetch at 'http://localhost:8000/professor' has been blocked by CORS policy
```

**Solution:** Tell backend team they need to enable CORS (see BACKEND_INTEGRATION.md)

### Issue 2: Data Format Mismatch

**Error message:**
```
Cannot read property 'reviews' of undefined
```

**Solution:** Backend isn't returning expected format. Add validation:
```javascript
if (!data || typeof data !== 'object') {
  throw new Error('Invalid response format');
}
```

### Issue 3: Slow Responses

**Issue:** Popup shows loading forever

**Solutions:**
- Add timeout (already in improved code above)
- Show "taking longer than expected" message after 5 seconds
- Ask backend team to optimize

---

## 📞 Questions to Ask Backend Team

Before integrating:

1. "What's the exact URL I should use?"
2. "What's the response format? Can I see an example?"
3. "What HTTP status codes will you return for errors?"
4. "How long should I expect responses to take?"
5. "Is there a rate limit I should know about?"

---

## 🎯 Next Steps

1. **Today:** Set up test server or coordinate with backend
2. **Tomorrow:** Implement error handling
3. **Wednesday:** Test with real backend data
4. **Thursday:** Polish and prepare for demo

**You've got this! 🚀**
