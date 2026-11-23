# Decision Ledger

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
- Associate every decision with its authenticated user.

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

### 7. JWT Authentication & Authorization
- Register users with email and password.
- Securely hash passwords using bcrypt.
- Authenticate users through login credentials.
- Generate signed JWT access tokens.
- Protect decision endpoints using a custom JWT authentication guard.
- Require authentication before accessing decision APIs.
- Automatically associate newly created decisions with the authenticated user.
- Restrict decision retrieval, updates, and version operations to their owners.
- Prevent users from accessing other users' decisions.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| TypeScript | Programming language |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and migrations |
| class-validator | Request validation |
| bcrypt | Password hashing |
| JSON Web Tokens | Authentication |
| @nestjs/jwt | JWT generation and verification |
| Jest | Backend unit testing |
| REST API | Client-server communication |

---

## Database Design

Decision Ledger currently uses three primary models:

**User**
- Stores registered user information.
- Maintains a unique email address.
- Stores the bcrypt password hash.
- Maintains creation and update timestamps.
- Has a one-to-many relationship with decisions.

**Decision**
- Stores the latest state of a decision.
- Contains title, context, options, rationale, summary, status, and owner.
- Tracks creation and update timestamps.
- Contains a mandatory `userId` referencing its owner.

**DecisionVersion**
- Stores historical snapshots of decisions.
- Maintains sequential version numbers.
- Stores commit messages and restoration metadata.
- Preserves previous states independently.

### Relationships

- One user can own multiple decisions.
- One decision can have multiple historical versions.

`User (1) → Decision (Many)`

`Decision (1) → DecisionVersion (Many)`

---

## Authentication API Documentation

Base URL: `http://localhost:3000`

Authentication endpoints are public and do not require an existing JWT.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate and receive a JWT |

### Register a User

`POST /auth/register`

Example request:

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

Example response:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "generated-user-id",
    "email": "user@example.com",
    "createdAt": "2026-11-23T10:00:00.000Z"
  }
}
```

Passwords are hashed using bcrypt before being stored in the database.

### Login

`POST /auth/login`

Example request:

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

Example response:

```json
{
  "message": "Login successful",
  "accessToken": "your-jwt-access-token",
  "user": {
    "id": "generated-user-id",
    "email": "user@example.com"
  }
}
```

### Access Protected Endpoints

After logging in, include the JWT in the HTTP Authorization header:

```http
Authorization: Bearer <your-access-token>
```

- JWT tokens are signed using a secret configured through environment variables.
- Tokens expire after one hour.
- Missing, invalid, and expired tokens are rejected.
- The authentication guard verifies the token and attaches the authenticated user's information to the request.

Unauthenticated requests receive HTTP 401 Unauthorized.

---

## Decision API Documentation

All decision endpoints require a valid JWT access token.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/decisions` | Create a decision |
| GET | `/decisions` | Retrieve the authenticated user's decisions |
| GET | `/decisions/:id` | Retrieve an individual decision |
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

The backend automatically assigns the authenticated user's ID. Clients must not supply their own `userId`.

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

### User Ownership and Isolation

Decision Ledger enforces ownership at the service layer.

- Users can retrieve only their own decisions.
- Users cannot update another user's decisions.
- Users cannot access another user's version history.
- Version comparison and restoration enforce parent-decision ownership.
- Attempts to access another user's decision return HTTP 404 Not Found.

---

## Search, Filtering & Pagination

The decisions API supports searching, filtering, and paginating decision records belonging to the authenticated user.

### Query Parameters

| Parameter | Description | Example |
|---|---|---|
| search | Search title and context | `search=database` |
| status | Filter by decision status | `status=ACCEPTED` |
| owner | Filter by owner | `owner=Niharika` |
| page | Page number (default: 1) | `page=1` |
| limit | Records per page (default: 10, max: 100) | `limit=10` |

### Example Request

`GET /decisions?search=PostgreSQL&status=ACCEPTED&owner=Niharika&page=1&limit=10`

### Response

Returns matching decisions along with pagination metadata:

- total: Total matching records
- page: Current page
- limit: Records per page
- totalPages: Total number of pages

Invalid query parameters return HTTP 400 Bad Request.

---

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

The automated unit tests cover:

**Decision Management**
- Service initialization.
- Decision creation and automatic Version 1 creation.
- Search, filtering, and pagination.
- Handling non-existent decisions.
- Valid and invalid decision status transitions.
- Automatic version creation during updates.
- Decision version history retrieval.
- Version comparison and change detection.
- Restoring older decision versions.

**Authentication**
- User registration.
- Password hashing.
- Duplicate email rejection.
- Successful login and JWT generation.
- Invalid email and password handling.

**JWT Authentication Guard**
- Missing authorization headers.
- Invalid authorization schemes.
- Invalid and expired tokens.
- Empty Bearer tokens.
- Malformed JWT payloads.
- Successful token verification and request user attachment.

### Build Verification

Run the production build:

```bash
npm run build
```

The backend has been verified with **25 passing tests across 5 test suites**.

---

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/NiharikaSingh0306/DecisionLedger.git
```

### 2. Navigate to the Backend

```bash
cd DecisionLedger/backend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the backend directory:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/decision_ledger"
SHADOW_DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/decision_ledger_shadow"
JWT_SECRET="YOUR_SECURE_RANDOM_SECRET"
```

Replace the database placeholders with your PostgreSQL credentials.

Generate a cryptographically secure JWT secret and keep it private.

**Security notes:**
- Never commit `.env` to GitHub.
- Never expose your JWT secret.
- Use a different secret for production.
- Keep database credentials private.

### 5. Run Database Migrations

```bash
npx prisma migrate dev
```

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Start the Development Server

```bash
npm run start:dev
```

The backend should now be accessible at:

`http://localhost:3000`

### 8. Register and Log In

Register a user through:

`POST /auth/register`

Then authenticate through:

`POST /auth/login`

Use the returned JWT access token when accessing protected decision endpoints.

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
- [x] Backend hardening and automated testing
- [x] JWT authentication
- [x] User ownership and decision isolation
- [x] Authentication unit testing
- [ ] Role-based access control
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
