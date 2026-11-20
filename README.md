# Decision Ledger

**A Git-inspired, version-controlled decision management system.**

Decision Ledger is a backend-driven application designed to record, track, compare, and restore important technical and organizational decisions.

Inspired by Git's version-control philosophy, it maintains a chronological history of decisions, ensuring that every change is traceable and previous versions are preserved.

Instead of simply storing the latest decision, Decision Ledger captures how and why a decision evolves over time.

---

## Key Features

### 1. Decision Management (CRUD)
- Create new decisions.
- Retrieve all decisions.
- Retrieve an individual decision.
- Update existing decisions.
- Track decision status and ownership.

### 2. Automatic Version Control
- Automatically creates Version 1 when a decision is created.
- Creates a new snapshot whenever a decision is updated.
- Maintains sequential version numbers.
- Preserves historical snapshots instead of overwriting them.

### 3. Decision History
- Retrieve the complete version history of a decision.
- Retrieve a specific historical version.
- View historical decision details independently.

### 4. Version Comparison (Diff Engine)
- Compare any two versions of a decision.
- Identify modified fields.
- Display old and new values for every changed field.
- Return an empty changes object when versions are identical.

### 5. Version Restoration
- Restore a decision to any previous version.
- Create a new version after restoration instead of overwriting history.
- Preserve the original historical snapshots.
- Track which version was restored.

### 6. Commit Messages & Version Metadata
- Attach meaningful commit messages to decision changes.
- Record why a decision was created, modified, or restored.
- Track the source version during restoration.
- Maintain timestamps for historical versions.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| TypeScript | Programming language |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and migrations |
| class-validator | Request validation |
| REST API | Client-server communication |

---

## Database Design

Decision Ledger currently uses two primary models:

**Decision**
- Stores the latest state of a decision.
- Contains title, context, options, rationale, summary, status, and owner.
- Tracks creation and update timestamps.

**DecisionVersion**
- Stores historical snapshots of decisions.
- Maintains sequential version numbers.
- Stores commit messages and restoration metadata.
- Preserves previous states independently.

### Relationship

One decision can have multiple historical versions.

`Decision (1) → DecisionVersion (Many)`

---

## API Documentation

Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/decisions` | Create a decision |
| GET | `/decisions` | Retrieve all decisions |
| GET | `/decisions/:id` | Retrieve a decision |
| PATCH | `/decisions/:id` | Update a decision |
| GET | `/decisions/:id/versions` | Retrieve version history |
| GET | `/decisions/:id/versions/:versionNumber` | Retrieve a specific version |
| GET | `/decisions/:id/versions/compare?from=1&to=2` | Compare two versions |
| POST | `/decisions/:id/versions/:versionNumber/restore` | Restore a historical version |

### Example: Create a Decision

```json
{
  "title": "Choose PostgreSQL for Decision Ledger",
  "context": "We need a reliable relational database.",
  "options": ["MongoDB", "PostgreSQL", "MySQL"],
  "decisionSummary": "Use PostgreSQL as the primary database.",
  "rationale": "PostgreSQL provides ACID transactions and relational integrity.",
  "status": "ACCEPTED",
  "owner": "Niharika",
  "commitMessage": "Initial database selection"
}
```

### Example: Update a Decision

```json
{
  "rationale": "Updated rationale after technical review",
  "commitMessage": "Updated rationale after technical review"
}
```

### Example: Restore a Version

`POST /decisions/:id/versions/1/restore`

```json
{
  "commitMessage": "Restored original decision after reviewing alternatives"
}
```

A restoration creates a new version and records its source:

```json
{
  "versionNumber": 5,
  "commitMessage": "Restored original decision after reviewing alternatives",
  "restoredFromVersion": 1
}
```

---
## Search, Filtering & Pagination

The decisions API supports searching, filtering, and paginating decision records.

### Query Parameters

| Parameter | Description | Example |
|---|---|---|
| search | Search title and context | search=database |
| status | Filter by decision status | status=ACCEPTED |
| owner | Filter by owner | owner=Niharika |
| page | Page number (default: 1) | page=1 |
| limit | Records per page (default: 10, max: 100) | limit=10 |

### Example Request

GET /decisions?search=PostgreSQL&status=ACCEPTED&owner=Niharika&page=1&limit=10

### Response

Returns matching decisions along with pagination metadata:
- total: Total matching records
- page: Current page
- limit: Records per page
- totalPages: Total number of pages

Invalid query parameters return HTTP 400 Bad Request.

## Decision Lifecycle Management

Decision Ledger enforces valid status transitions to maintain decision integrity.

| Current Status | Allowed Next Status |
|---|---|
| PROPOSED | ACCEPTED, REVERSED |
| ACCEPTED | SUPERSEDED, REVERSED |
| SUPERSEDED | None |
| REVERSED | None |

- Invalid status transitions return HTTP 400.
- Every valid update creates a new decision version.
- Rejected transitions do not modify the decision or its version history.
- Restoring a historical version is handled separately from normal lifecycle transitions.

---

## Testing

Decision Ledger uses Jest for backend unit testing.

### Run Tests

From the `backend` directory:

```bash
npm test -- --runInBand
```

### Test Coverage

The current unit tests cover:

- Service initialization
- Decision creation and automatic Version 1 creation
- Search, filtering, and pagination
- Handling non-existent decisions
- Valid and invalid decision status transitions
- Automatic version creation during updates
- Decision version history retrieval
- Version comparison and change detection
- Restoring older decision versions

### Build Verification

Run the production build:

```bash
npm run build
```

The backend has been verified with **12 passing tests across 3 test suites**.


## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/NiharikaSingh0306/DecisionLedger.git
```

### 2. Navigate to the backend

```bash
cd DecisionLedger/backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the backend directory:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/decision_ledger"
SHADOW_DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/decision_ledger_shadow"
```

Replace the placeholders with your PostgreSQL credentials and configure the shadow database.

### 5. Run database migrations

```bash
npx prisma migrate dev
```

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Start the development server

```bash
npm run start:dev
```

The backend should now be accessible at:

`http://localhost:3000`

---

## Project Roadmap

The project is being developed incrementally.

- [x] NestJS backend setup
- [x] PostgreSQL integration
- [x] Decision CRUD APIs
- [x] Prisma database migrations
- [x] Decision versioning
- [x] Historical version retrieval
- [x] Version comparison engine
- [x] Historical version restoration
- [x] Commit messages and restoration metadata
- [x] Decision lifecycle management
- [x] Search, filtering, and pagination
- [ ] Backend hardening and automated testing
- [ ] JWT authentication and role-based access control
- [ ] GitHub integration
- [ ] React frontend
- [ ] Deployment and production documentation

---

## Vision

The long-term goal of Decision Ledger is to bring version-control principles to organizational decision-making.

Just as Git tracks how code evolves, Decision Ledger aims to track how decisions evolve — including their reasoning, alternatives, dependencies, and historical context.

**Because understanding why something was built is just as important as knowing what was built.**

---

## Author

**Niharika Singh**



