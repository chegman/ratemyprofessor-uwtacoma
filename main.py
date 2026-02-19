"""
RateMyProf UW Tacoma Assistant - Backend (main.py)
============================================================
Run:  uvicorn main:app --reload --port 8000
"""

import os
import re
import logging
import asyncio
import requests
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# UW Tacoma's RMP school ID
UWT_SCHOOL_ID = "U2Nob29sLTQ3NDQ="

RMP_GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql"
RMP_HEADERS = {"User-Agent": "Mozilla/5.0"}

app = FastAPI(title="RateMyProf UW Tacoma Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Keep alive ───────────────────────────────────────────────
@app.on_event("startup")
async def keep_alive():
    async def ping():
        while True:
            await asyncio.sleep(300)  # every 5 minutes
            logger.info("Keep alive ping")
    asyncio.create_task(ping())


# ── Data Models ──────────────────────────────────────────────
class Review(BaseModel):
    rating: float
    text: str
    course: Optional[str] = None
    date: Optional[str] = None


class ProfessorData(BaseModel):
    name: str
    rating: float
    difficulty: Optional[float] = None
    wouldTakeAgain: Optional[float] = None
    numRatings: Optional[int] = None
    department: Optional[str] = None
    summary: str
    reviews: List[Review]


# ── RMP GraphQL helpers ──────────────────────────────────────

def search_professor(name: str) -> Optional[dict]:
    """Search UW Tacoma professors by name. Returns the best match or None."""
    query = """
    {
      newSearch {
        teachers(query: {text: "%s", schoolID: "%s"}) {
          edges {
            node {
              id
              firstName
              lastName
              rating: avgRating
              difficulty: avgDifficulty
              wouldTakeAgainPercent
              numRatings
              department
            }
          }
        }
      }
    }
    """ % (name.replace('"', ''), UWT_SCHOOL_ID)

    try:
        resp = requests.post(RMP_GRAPHQL_URL, json={"query": query}, headers=RMP_HEADERS, timeout=10)
        resp.raise_for_status()
        edges = resp.json()["data"]["newSearch"]["teachers"]["edges"]
    except Exception as e:
        logger.error(f"RMP professor search failed: {e}")
        return None

    if not edges:
        return None

    # Only consider professors with at least 1 rating
    rated = [e["node"] for e in edges if e["node"]["numRatings"] > 0]
    if not rated:
        return None

    # Must match at least first and last name
    name_parts = name.lower().split()
    for prof in rated:
        first = prof['firstName'].lower().strip()
        last = prof['lastName'].lower().strip()
        if last in name_parts and first in name_parts:
            return prof

    # No confident match found — return nothing rather than guess wrong
    return None


def fetch_reviews(professor_id: str, count: int = 5) -> List[dict]:
    """Fetch the most recent reviews for a professor by their RMP ID."""
    query = """
    {
      node(id: "%s") {
        ... on Teacher {
          ratings(first: %d) {
            edges {
              node {
                comment
                qualityRating
                class
                date
              }
            }
          }
        }
      }
    }
    """ % (professor_id, count)

    try:
        resp = requests.post(RMP_GRAPHQL_URL, json={"query": query}, headers=RMP_HEADERS, timeout=10)
        resp.raise_for_status()
        edges = resp.json()["data"]["node"]["ratings"]["edges"]
    except Exception as e:
        logger.error(f"RMP review fetch failed: {e}")
        return []

    reviews = []
    for edge in edges:
        node = edge["node"]
        comment = (node.get("comment") or "").strip()
        if not comment:
            continue
        raw_date = node.get("date", "")
        short_date = raw_date[:10] if raw_date else None
        reviews.append({
            "rating": float(node.get("qualityRating") or 0),
            "text": comment,
            "course": node.get("class") or None,
            "date": short_date,
        })

    return reviews


# ── Claude AI helpers ────────────────────────────────────────

SYSTEM_PROMPT = """You are a helpful assistant that summarizes Rate My Professor reviews for University of Washington Tacoma professors.

Given a list of student reviews, write a 2-3 sentence summary that:
- Highlights the professor's main strengths mentioned by students
- Mentions any consistent complaints or weaknesses
- Notes teaching style if mentioned (e.g. lecture-heavy, project-based, etc.)
- Stays neutral and factual — do not exaggerate positives or negatives
- Is written for a student deciding whether to take this professor

Keep the summary under 60 words. Do not use bullet points. Write in plain paragraph form."""


def is_abusive(text: str) -> bool:
    if not anthropic_client:
        return False
    try:
        response = anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=10,
            system="You are a content moderator. Reply with only 'YES' if the text contains hate speech, personal attacks, slurs, or clearly inappropriate content. Reply with only 'NO' otherwise.",
            messages=[{"role": "user", "content": text[:512]}],
        )
        result = response.content[0].text.strip().upper()
        if result == "YES":
            logger.info(f"Review flagged as abusive: {text[:60]}...")
            return True
    except Exception as e:
        logger.warning(f"Abuse detection failed: {e}")
    return False


def summarize_reviews(review_texts: List[str]) -> str:
    if not anthropic_client or not review_texts:
        return _fallback_summary(review_texts)

    numbered = "\n".join([f"{i+1}. \"{text}\"" for i, text in enumerate(review_texts)])
    user_message = f"Here are the student reviews:\n\n{numbered}\n\nPlease summarize these reviews."

    try:
        response = anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=150,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.warning(f"Summarization failed: {e}")
        return _fallback_summary(review_texts)


def _fallback_summary(review_texts: List[str]) -> str:
    if not review_texts:
        return "No reviews available to summarize."
    count = len(review_texts)
    return (
        f"Based on {count} student review{'s' if count != 1 else ''} from Rate My Professor. "
        "See individual reviews below for details."
    )


# ── In-memory cache ──────────────────────────────────────────
_cache: dict = {}

def _cache_key(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip().lower())


# ── Endpoints ────────────────────────────────────────────────

@app.get("/professor", response_model=ProfessorData)
async def get_professor(name: str = Query(..., description="Professor's full name")):
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Professor name is required.")

    key = _cache_key(name)
    if key in _cache:
        logger.info(f"Cache hit: {name}")
        return _cache[key]

    # 1. Find professor on RMP
    prof = search_professor(name)
    if not prof:
        raise HTTPException(status_code=404, detail=f"No professor found for '{name}' at UW Tacoma.")

    logger.info(f"Found: {prof['firstName']} {prof['lastName']} ({prof['numRatings']} ratings)")

    # 2. Fetch reviews
    raw_reviews = fetch_reviews(prof["id"], count=5)

    # 3. Filter abusive reviews
    clean_reviews = [r for r in raw_reviews if not is_abusive(r["text"])]

    # 4. Generate summary
    summary = summarize_reviews([r["text"] for r in clean_reviews])

    # 5. Build response
    result = ProfessorData(
        name=f"{prof['firstName']} {prof['lastName']}",
        rating=round(float(prof["rating"]), 1),
        difficulty=round(float(prof["difficulty"]), 1) if prof.get("difficulty") else None,
        wouldTakeAgain=round(float(prof["wouldTakeAgainPercent"]), 1) if prof.get("wouldTakeAgainPercent") and prof["wouldTakeAgainPercent"] >= 0 else None,
        numRatings=prof["numRatings"],
        department=prof.get("department"),
        summary=summary,
        reviews=[Review(**r) for r in clean_reviews],
    )

    _cache[key] = result
    return result


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "school": "UW Tacoma",
        "claude_configured": bool(ANTHROPIC_API_KEY),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
