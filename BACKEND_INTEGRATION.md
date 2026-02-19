# 🔌 Backend Integration Guide

## For the Backend Team (3 members)

This document explains what the frontend extension needs from your FastAPI backend.

---

## 📋 API Requirements

### Endpoint 1: Get Professor Data

**URL:** `GET /professor`

**Query Parameters:**
- `name` (string, required) - Professor's full name (e.g., "Smith, John" or "John Smith")

**Example Request:**
```
GET http://localhost:8000/professor?name=Smith,%20John
```

**Expected Response (200 OK):**
```json
{
  "name": "Smith, John",
  "rating": 4.2,
  "summary": "Students generally appreciate this professor's clear explanations and engaging lectures. Some find the workload challenging but fair.",
  "reviews": [
    {
      "rating": 5.0,
      "text": "Great professor! Very clear explanations and helpful during office hours.",
      "course": "CSE 142",
      "date": "2024-03-15"  // Optional
    },
    {
      "rating": 4.0,
      "text": "Challenging but fair. Learned a lot in this class.",
      "course": "CSE 143",
      "date": "2024-02-20"  // Optional
    },
    {
      "rating": 3.5,
      "text": "Good lectures, but exams are tough. Make sure to study!",
      "course": "CSE 154",
      "date": "2024-01-10"  // Optional
    }
  ]
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Professor not found",
  "message": "No reviews available for this professor"
}
```

**Error Response (500 Server Error):**
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch reviews"
}
```

---

## 🔧 FastAPI Implementation Example

Here's a starter template for your backend team:

```python
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# CRITICAL: Enable CORS for Chrome Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class Review(BaseModel):
    rating: float
    text: str
    course: Optional[str] = None
    date: Optional[str] = None

class ProfessorData(BaseModel):
    name: str
    rating: float
    summary: str
    reviews: List[Review]

# Your endpoint
@app.get("/professor", response_model=ProfessorData)
async def get_professor(name: str = Query(..., description="Professor's full name")):
    """
    Fetch professor reviews and ratings.
    
    This is where you'll:
    1. Query Rate My Professor API/scraping
    2. Run AI summarization on reviews
    3. Filter out flagged/abusive reviews
    4. Return processed data
    """
    
    # TODO: Replace this with your actual logic
    # - Fetch reviews from Rate My Professor
    # - Run Hugging Face models (abuse detection, summarization)
    # - Filter and process reviews
    
    try:
        # Example: Query your database or RMP API
        # reviews = fetch_reviews_from_rmp(name)
        # clean_reviews = filter_abusive_reviews(reviews)
        # summary = generate_summary(clean_reviews)
        
        # For now, return mock data
        return {
            "name": name,
            "rating": 4.2,
            "summary": "AI-generated summary will go here. This professor is well-regarded for clear explanations.",
            "reviews": [
                {
                    "rating": 5.0,
                    "text": "Excellent professor!",
                    "course": "CSE 142"
                },
                {
                    "rating": 4.0,
                    "text": "Good but challenging.",
                    "course": "CSE 143"
                }
            ]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch professor data: {str(e)}"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 🚀 Testing Your Backend

### 1. Start Your Server

```bash
uvicorn main:app --reload --port 8000
```

### 2. Test with cURL

```bash
curl "http://localhost:8000/professor?name=Smith%2C%20John"
```

### 3. Test with Browser

Open in browser:
```
http://localhost:8000/professor?name=Smith,%20John
```

### 4. Check CORS is Working

The response headers should include:
```
Access-Control-Allow-Origin: *
```

---

## 🔄 Data Flow Overview

```
Chrome Extension (Frontend)
    ↓
    Hover over professor name
    ↓
GET /professor?name=Smith, John
    ↓
FastAPI Backend
    ↓
1. Fetch reviews from Rate My Professor
2. Run Hugging Face abuse detection model
3. Filter out flagged reviews
4. Run Hugging Face summarization model
5. Calculate average rating
    ↓
Return JSON response
    ↓
Chrome Extension displays data in popup
```

---

## 🧪 Expected Behavior

### Scenario 1: Professor Has Reviews
- Return 3-5 most recent/relevant reviews
- Include AI-generated summary
- Calculate average rating

### Scenario 2: Professor Not Found
- Return 404 error
- Frontend will show "No reviews found"

### Scenario 3: All Reviews Flagged as Abusive
- Return valid response but with empty reviews array
- Summary should indicate insufficient data

---

## 🎯 Your Implementation Checklist

For the 3 backend team members:

### Person 1: API Infrastructure
- [ ] Set up FastAPI project
- [ ] Implement `/professor` endpoint
- [ ] Enable CORS middleware
- [ ] Add error handling
- [ ] Test with Postman/cURL

### Person 2: Data Fetching & Processing
- [ ] Connect to Rate My Professor (API or scraping)
- [ ] Parse and clean review data
- [ ] Handle professor name matching
- [ ] Implement caching (optional but recommended)

### Person 3: AI Integration
- [ ] Set up Hugging Face API
- [ ] Implement abuse detection pipeline
- [ ] Implement summarization pipeline
- [ ] Filter reviews based on flags
- [ ] Generate summaries at runtime

---

## 🔐 Hugging Face Setup

### Get Your API Token

1. Go to https://huggingface.co/settings/tokens
2. Create a new token
3. Save it securely

### Use Hosted Inference API

```python
import requests

HF_API_TOKEN = "your_token_here"
HF_API_URL = "https://api-inference.huggingface.co/models/"

def detect_abuse(text: str) -> bool:
    """
    Check if review contains abusive language.
    Returns True if abusive, False otherwise.
    """
    response = requests.post(
        f"{HF_API_URL}facebook/roberta-hate-speech-dynabench-r4-target",
        headers={"Authorization": f"Bearer {HF_API_TOKEN}"},
        json={"inputs": text}
    )
    
    result = response.json()
    # Process result and return boolean
    return False  # Placeholder

def summarize_reviews(reviews: List[str]) -> str:
    """
    Generate summary from multiple reviews.
    """
    combined_text = " ".join(reviews)
    
    response = requests.post(
        f"{HF_API_URL}facebook/bart-large-cnn",
        headers={"Authorization": f"Bearer {HF_API_TOKEN}"},
        json={"inputs": combined_text[:1024]}  # Token limit
    )
    
    result = response.json()
    return result[0]['summary_text']
```

---

## 📊 Performance Considerations

### Caching Strategy

Since summarization happens at runtime, implement caching:

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def get_professor_cached(name: str):
    # Your logic here
    pass
```

Or use Redis for persistent caching:

```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)

def get_professor_data(name: str):
    # Check cache first
    cached = r.get(f"professor:{name}")
    if cached:
        return json.loads(cached)
    
    # Fetch and process
    data = fetch_and_process(name)
    
    # Cache for 1 hour
    r.setex(f"professor:{name}", 3600, json.dumps(data))
    
    return data
```

---

## 🐛 Common Issues

### Issue 1: CORS Errors

**Symptom:** Frontend shows "CORS policy" error in console

**Fix:** Make sure CORS middleware is properly configured:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 2: Slow Response Times

**Symptom:** Popup takes 5+ seconds to load

**Solutions:**
- Implement caching
- Limit number of reviews processed
- Use async operations
- Optimize Hugging Face model selection

### Issue 3: Hugging Face Rate Limits

**Symptom:** 429 Too Many Requests error

**Solutions:**
- Implement request throttling
- Cache results aggressively
- Consider upgrading to paid tier
- Batch process reviews

---

## 📞 Communication with Frontend Team

### What Frontend Needs to Know:

1. **Backend URL**
   - Local: `http://localhost:8000`
   - Deployed: `https://your-app.com`

2. **Expected Response Time**
   - Target: < 2 seconds
   - Max acceptable: < 5 seconds

3. **Rate Limits (if any)**
   - Requests per minute
   - Daily quota

4. **Deployment Status**
   - When is backend available for testing?
   - What's the testing URL?

### Share This Info:

```
Backend Status: ✅ Ready for Testing
URL: http://localhost:8000
Response Time: ~1-2 seconds
Known Issues: None

Test Professor: "Smith, John"
Expected Response: See API docs above
```

---

## 🎯 Thursday Deliverables

By Thursday, backend team should have:

1. ✅ `/professor` endpoint working locally
2. ✅ CORS properly configured
3. ✅ Returns mock or real data
4. ✅ Handles basic error cases
5. ✅ Shared backend URL with frontend team

---

## 📚 Helpful Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)
- [CORS Explanation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

**Good luck! Let the frontend team know when you're ready! 🚀**
