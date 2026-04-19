# ShelterSeek Testing Infrastructure

This project now features a robust testing suite for both the backend and frontend, with the ability to generate detailed HTML reports on demand.

## 🚀 Quick Start: Running Tests

To run all tests and generate a unified HTML report:

```bash
# From the root directory
node generate_test_report.js
```

This will:
1.  Run all **Backend** unit tests (including Room, Booking, Auth, and Cache logic).
2.  Run all **Frontend** unit tests.
3.  Generate a **Combined Dashboard** in `combined-test-report.html`.

---

## 📂 Core Testing Files

### 🖥️ Backend (Jest)
- **Report**: [backend/test-report.html](file:///Users/sumukesh/Documents/shelterseek-react%20copy%203/backend/test-report.html)
- **Tests Location**: `backend/tests/`
- **Key Tests**:
    - `auth.test.js`: Validates JWT token generation.
    - `room.test.js`: Core logic for fetching and counting rooms.
    - `booking.test.js`: Validates traveler booking fetch logic.
    - `helpers.test.js`: Unit tests for critical utility functions (pagination, date overlaps, etc.).
    - `cache.test.js`: Ensures the caching layer falls back gracefully if Redis is unavailable.

### 🎨 Frontend (React Testing Library)
- **Report**: [frontend/test-report.html](file:///Users/sumukesh/Documents/shelterseek-react%20copy%203/frontend/test-report.html)
- **Tests Location**: `frontend/src/*.test.js`
- **Key Tests**:
    - `simple.test.js`: Infrastructure verification and utility testing.
    - `App.test.js`: basic component smoke test.

---

## 🛠️ Configuration Details

- **Backend `package.json`**: Added `test`, `test:report`, and `test:coverage` scripts. Using `node node_modules/jest/bin/jest.js` directly to avoid permission issues on the binary.
- **Frontend `package.json`**: Added `test:report` script configured with `jest-html-reporter`.
- **`catchAsync.js`**: Improved to return the underlying promise, allowing unit tests to correctly `await` controller responses.
- **Database Models**: Fixed `Room.js` and `Booking.js` initialization to skip real database connections during unit tests if a URI is not provided.

---

## 📊 Viewing Reports
After running the tests, you can open the following files in your browser to see the results:
- **Unified Dashboard**: `combined-test-report.html` (at the project root)
- **Backend Details**: `backend/test-report.html`
- **Frontend Details**: `frontend/test-report.html`
