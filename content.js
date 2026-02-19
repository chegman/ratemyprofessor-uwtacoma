// ============================================================
// RateMyProf UW Assistant - content.js
// Integrated: API calls, error handling, data display
// ============================================================

const BACKEND_URL = 'http://localhost:8000'; // Change to deployed backend URL when ready
const API_TIMEOUT_MS = 10000;               // 10-second timeout

let currentPopup = null;
let hoverTimeout = null;

console.log('RateMyProf Extension loaded on MyPlan!');


// ============================================================
// PROFESSOR NAME DETECTION
// ============================================================

function detectProfessorNames() {
  const professorElements = [];
  const processedElements = new Set();

  console.log('Scanning for Instructor columns...');

  const allCells = document.querySelectorAll('th, td, div');

  allCells.forEach(cell => {
    const cellText = cell.textContent.trim().toLowerCase();

    if (
      cellText === 'instructor' ||
      cellText === 'instructors' ||
      cellText.startsWith('instructor')
    ) {
      console.log('Found Instructor label:', cell);

      if (cell.tagName === 'TH') {
        findNamesInColumn(cell, professorElements, processedElements);
      } else if (cell.tagName === 'TD') {
        findNamesInAdjacentCells(cell, professorElements, processedElements);
      } else {
        findNamesInSiblings(cell, professorElements, processedElements);
      }
    }
  });

  console.log(`Found ${professorElements.length} professor names`);
  return professorElements;
}

function findNamesInColumn(headerCell, professorElements, processedElements) {
  const columnIndex = Array.from(headerCell.parentElement.children).indexOf(headerCell);
  const table = headerCell.closest('table');
  if (!table) return;

  table.querySelectorAll('tbody tr, tr').forEach(row => {
    const cells = row.querySelectorAll('td, th');
    if (cells[columnIndex]) {
      const nameText = cells[columnIndex].textContent.trim();
      if (isValidProfessorName(nameText) && !processedElements.has(cells[columnIndex])) {
        markAsProfessor(cells[columnIndex], nameText, professorElements, processedElements);
      }
    }
  });
}

function findNamesInAdjacentCells(labelCell, professorElements, processedElements) {
  const nextCell = labelCell.nextElementSibling;
  if (nextCell && nextCell.tagName === 'TD') {
    const nameText = nextCell.textContent.trim();
    if (isValidProfessorName(nameText) && !processedElements.has(nextCell)) {
      markAsProfessor(nextCell, nameText, professorElements, processedElements);
    }
  }

  const row = labelCell.closest('tr');
  if (row) {
    const columnIndex = Array.from(row.children).indexOf(labelCell);
    let nextRow = row.nextElementSibling;
    while (nextRow) {
      const cells = nextRow.querySelectorAll('td, th');
      if (cells[columnIndex]) {
        const nameText = cells[columnIndex].textContent.trim();
        if (isValidProfessorName(nameText) && !processedElements.has(cells[columnIndex])) {
          markAsProfessor(cells[columnIndex], nameText, professorElements, processedElements);
        }
      }
      nextRow = nextRow.nextElementSibling;
    }
  }
}

function findNamesInSiblings(labelElement, professorElements, processedElements) {
  let nextElement = labelElement.nextElementSibling;
  for (let i = 0; i < 3 && nextElement; i++) {
    const nameText = nextElement.textContent.trim();
    if (isValidProfessorName(nameText) && !processedElements.has(nextElement)) {
      markAsProfessor(nextElement, nameText, professorElements, processedElements);
    }
    nextElement = nextElement.nextElementSibling;
  }
}

function isValidProfessorName(text) {
  if (!text || text.length < 3 || text.length > 40) return false;

  const blacklist = [
    'instructor', 'course', 'credits', 'schedule', 'section',
    'click', 'select', 'search', 'update', 'add', 'remove',
    'status', 'enrollment', 'available', 'closed', 'open',
    'syllabus', 'grading', 'time', 'location', 'building'
  ];
  const lowerText = text.toLowerCase();
  if (blacklist.some(w => lowerText.includes(w))) return false;
  if (text === text.toUpperCase() && text.length > 5) return false;
  if (/[0-9!@#$%^&*()+=[\]{};':"\\|<>?/]/.test(text)) return false;
  if (text.includes(',')) return false;
  if (!text.includes(' ')) return false;

  const namePattern = /^[A-Z][a-z]+(-[A-Z][a-z]+)?(\s+[A-Z]\.?)?(\s+[A-Z][a-z.''-]+)+$/;
  if (!namePattern.test(text)) return false;

  console.log('Valid professor name found:', text);
  return true;
}

function markAsProfessor(element, nameText, professorElements, processedElements) {
  element.classList.add('rmp-professor-name');
  element.setAttribute('data-professor-name', nameText);
  element.style.cursor = 'pointer';
  element.style.borderBottom = '2px dotted #4b2e83';
  element.style.transition = 'all 0.2s ease';
  professorElements.push(element);
  processedElements.add(element);
  console.log('Marked as professor:', nameText, element);
}


// ============================================================
// HOVER LISTENERS & POPUP TRIGGER
// ============================================================

function attachHoverListeners(elements) {
  elements.forEach(element => {
    if (element.hasAttribute('data-rmp-listener')) return;
    element.setAttribute('data-rmp-listener', 'true');

    element.addEventListener('mouseenter', e => {
      e.target.style.backgroundColor = '#e8e3f3';
      hoverTimeout = setTimeout(() => showPopup(e.target), 300);
    });

    element.addEventListener('mouseleave', e => {
      e.target.style.backgroundColor = 'transparent';
      clearTimeout(hoverTimeout);
    });
  });
}


// ============================================================
// POPUP CREATION & POSITIONING
// ============================================================

function showPopup(professorElement) {
  removePopup();

  const professorName =
    professorElement.getAttribute('data-professor-name') ||
    professorElement.textContent.trim();

  const popup = document.createElement('div');
  popup.className = 'rmp-popup';
  popup.id = 'rmp-popup';

  popup.innerHTML = `
    <div class="rmp-popup-header">
      <h3 class="rmp-header-name">${escapeHtml(professorName)}</h3>
      <button class="rmp-close-btn" aria-label="Close">&times;</button>
    </div>
    <div class="rmp-popup-body">
      <div class="rmp-loading">
        <div class="rmp-spinner"></div>
        <p>Loading reviews...</p>
      </div>
    </div>
  `;

  positionPopup(popup, professorElement);
  document.body.appendChild(popup);
  currentPopup = popup;

  popup.querySelector('.rmp-close-btn').addEventListener('click', removePopup);
  popup.addEventListener('mouseenter', () => clearTimeout(hoverTimeout));
  popup.addEventListener('mouseleave', () => setTimeout(removePopup, 500));

  fetchProfessorData(professorName, popup);
}

function positionPopup(popup, professorElement) {
  const rect = professorElement.getBoundingClientRect();
  const popupWidth = 400;
  const popupMaxHeight = 600;
  const margin = 10;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = rect.left;
  if (left + popupWidth > vw - margin) left = rect.right - popupWidth;
  if (left < margin) left = margin;

  let top;
  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;

  if (spaceAbove > spaceBelow && spaceBelow < popupMaxHeight + margin) {
    top = Math.max(margin, rect.top - popupMaxHeight - margin);
  } else {
    top = rect.bottom + margin;
    if (top + popupMaxHeight > vh - margin) {
      top = vh - popupMaxHeight - margin;
    }
  }

  popup.style.position = 'fixed';
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
}

function removePopup() {
  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
}


// ============================================================
// API INTEGRATION
// ============================================================

async function fetchProfessorData(professorName, popupElement) {
  console.log(`Fetching data for: ${professorName}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(
      `${BACKEND_URL}/professor?name=${encodeURIComponent(professorName)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    console.log(`Response status: ${response.status}`);

    if (response.status === 404) {
      displayNoReviewsFound(popupElement);
      return;
    }

    if (response.status === 500) {
      displayServerError(popupElement);
      return;
    }

    if (!response.ok) {
      throw new Error(`Unexpected HTTP status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received data:', data);

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from backend');
    }

    if (!Array.isArray(data.reviews)) {
      throw new Error('Missing or invalid reviews field in response');
    }

    displayProfessorData(data, popupElement);

  } catch (error) {
    console.error('Error fetching professor data:', error);

    if (error.name === 'AbortError') {
      displayTimeoutError(popupElement);
    } else if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('net::')
    ) {
      displayNetworkError(popupElement);
    } else {
      displayGenericError(popupElement, error.message);
    }
  }
}


// ============================================================
// DATA DISPLAY
// ============================================================

function displayProfessorData(data, popupElement) {
  const popupBody = popupElement.querySelector('.rmp-popup-body');

  const rating = data.rating != null ? Number(data.rating).toFixed(1) : 'N/A';
  const summary = data.summary || null;
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];

  let html = `
    <div class="rmp-rating-section">
      <div class="rmp-rating-badge">${escapeHtml(String(rating))}</div>
      <div class="rmp-rating-label">Overall Rating</div>
    </div>
  `;

  if (summary) {
    html += `
      <div class="rmp-summary-section">
        <h4>AI Summary</h4>
        <p class="rmp-summary-text">${escapeHtml(summary)}</p>
      </div>
    `;
  }

  html += `<div class="rmp-reviews-section">`;
  html += `<h4>Recent Reviews (${reviews.length})</h4>`;

  if (reviews.length === 0) {
    html += `<p class="rmp-no-reviews">No reviews found for this professor.</p>`;
  } else {
    reviews.slice(0, 5).forEach(review => {
      const reviewRating = review.rating != null ? Number(review.rating).toFixed(1) : 'N/A';
      const reviewText = review.text || review.comment || 'No comment provided.';
      html += `
        <div class="rmp-review-card">
          <div class="rmp-review-rating">⭐ ${escapeHtml(String(reviewRating))}</div>
          <p class="rmp-review-text">${escapeHtml(reviewText)}</p>
          ${review.course
            ? `<div class="rmp-review-course">Course: ${escapeHtml(review.course)}</div>`
            : ''}
          ${review.date
            ? `<div class="rmp-review-date">${escapeHtml(formatDate(review.date))}</div>`
            : ''}
        </div>
      `;
    });

    if (reviews.length > 5) {
      html += `
        <div class="rmp-more-reviews">
          + ${reviews.length - 5} more reviews on Rate My Professor
        </div>
      `;
    }
  }

  html += `</div>`;
  popupBody.innerHTML = html;
}


// ============================================================
// ERROR STATES
// ============================================================

function displayNoReviewsFound(popupElement) {
  const popupBody = popupElement.querySelector('.rmp-popup-body');
  popupBody.innerHTML = `
    <div class="rmp-error-state">
      <div class="rmp-error-icon">🔍</div>
      <h4>No Reviews Found</h4>
      <p>This professor doesn't have any reviews yet.</p>
      <p class="rmp-error-suggestion">
        <a href="https://www.ratemyprofessors.com/search/professors/4744?q=*" target="_blank" 
           style="color: #4b2e83; text-decoration: underline;">
          Be the first to leave a review on Rate My Professor!
        </a>
      </p>
    </div>
  `;
}

function displayServerError(popupElement) {
  _setErrorHTML(popupElement, '⚠️', 'Server Error',
    'Something went wrong on our end.',
    'Please try again in a moment.');
}

function displayNetworkError(popupElement) {
  _setErrorHTML(popupElement, '📡', 'Connection Error',
    'Unable to connect to the server.',
    'Check that the backend is running and your network is connected.');
}

function displayTimeoutError(popupElement) {
  _setErrorHTML(popupElement, '⏱️', 'Request Timed Out',
    'The server took too long to respond.',
    'Please try again — the server may be warming up.');
}

function displayGenericError(popupElement, errorMessage) {
  const popupBody = popupElement.querySelector('.rmp-popup-body');
  popupBody.innerHTML = `
    <div class="rmp-error-state">
      <div class="rmp-error-icon">❌</div>
      <h4>Something Went Wrong</h4>
      <p>An error occurred while loading reviews.</p>
      <p class="rmp-error-detail">${escapeHtml(errorMessage)}</p>
    </div>
  `;
}

function _setErrorHTML(popupElement, icon, title, message, suggestion) {
  const popupBody = popupElement.querySelector('.rmp-popup-body');
  popupBody.innerHTML = `
    <div class="rmp-error-state">
      <div class="rmp-error-icon">${icon}</div>
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(message)}</p>
      <p class="rmp-error-suggestion">${escapeHtml(suggestion)}</p>
    </div>
  `;
}


// ============================================================
// HELPERS
// ============================================================

/** Escapes HTML to prevent XSS. Always use this before injecting user/API data. */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

/** Formats an ISO date string to a human-readable date. */
function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}


// ============================================================
// INITIALIZATION
// ============================================================

function initialize() {
  console.log('Initializing RateMyProf Extension...');
  const professorElements = detectProfessorNames();
  attachHoverListeners(professorElements);

  // Re-scan every 3 seconds to catch dynamically loaded content
  setInterval(() => {
    const newElements = detectProfessorNames();
    attachHoverListeners(newElements);
  }, 3000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
