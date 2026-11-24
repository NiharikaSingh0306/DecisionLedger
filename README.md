# Decision Ledger

**Version-controlled decision management for teams and organizations.**

Decision Ledger is a full-stack application designed to record, track, compare, and restore important technical and organizational decisions.

Inspired by Git's version-control philosophy, it maintains a chronological history of decisions, preserving previous versions and making changes traceable.

Instead of simply storing the latest decision, Decision Ledger captures how and why a decision evolves over time.

---

## Key Features

### 1. Decision Management
- Create, retrieve, and update decisions.
- Maintain decision context, alternatives, rationale, and summaries.
- Track decision status and assigned ownership.
- Associate every decision with its creator.

### 2. Automatic Version Control
- Automatically creates Version 1 when a decision is created.
- Creates a new snapshot whenever a decision is updated.
- Maintains sequential version numbers.
- Preserves historical snapshots instead of overwriting them.

### 3. Decision History
- Retrieve the complete version history.
- View individual historical versions.
- Inspect previous decision details independently.

### 4. Version Comparison
- Compare any two versions.
- Identify modified fields.
- Display previous and updated values.
- Detect when two versions are identical.

### 5. Version Restoration
- Restore a decision to an earlier version.
- Create a new version after restoration.
- Preserve all original historical snapshots.
- Track the source version used during restoration.

### 6. Commit Messages and Metadata
- Attach commit messages to decision changes.
- Record why a decision was created, modified, or restored.
- Maintain restoration metadata and timestamps.

### 7. Authentication and Authorization
- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected decision APIs.
- Ownership-based editing and restoration permissions.

### 8. Public and Private Decisions
- Create decisions with PUBLIC or PRIVATE visibility.
- View public decisions across authenticated accounts.
- Keep private decisions accessible only to their creators.
- Allow read-only access to public decision details and version history.
- Restrict editing and restoration to the decision creator.

### 9. Search, Filtering, and Pagination
- Search decisions by title and context.
- Filter by status, assigned owner, and visibility.
- Paginate decision results.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend framework |
| TypeScript | Frontend and backend language |
| Vite | Frontend development and build tooling |
| Tailwind CSS | UI styling |
| NestJS | Backend framework |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and migrations |
| class-validator | Request validation |
| bcrypt | Password hashing |
| JSON Web Tokens | Authentication |
| Jest | Backend unit testing |
| Axios | Frontend API communication |

---

## Database Design

Decision Ledger uses three primary database models.

### User
- Stores registered user information.
- Maintains a unique email address.
- Stores the password hash.
- Maintains creation and update timestamps.
- Has a one-to-many relationship with decisions.

### Decision
- Stores the latest state of a decision.
- Contains title, context, options, summary, rationale, and status.
- Tracks assigned ownership and visibility.
- References the user who created the decision.
- Maintains creation and update timestamps.

### DecisionVersion
- Stores historical snapshots of decisions.
- Maintains sequential version numbers.
- Stores commit messages and restoration metadata.
- Preserves previous decision states independently.

### Relationships

- One user can create multiple decisions.
- One decision can have multiple historical versions.

`User (1) → Decision (Many)`

`Decision (1) → DecisionVersion (Many)`

---

## Authentication API

Base URL: `http://localhost:3000`

Authentication endpoints do not require an existing JWT.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Authenticate and receive a JWT |

### Register

`POST /auth/register`

Example request:

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

### Login

`POST /auth/login`

Example request:

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

The login endpoint returns an access token and authenticated user information.

Passwords are hashed using bcrypt before storage.

### Access Protected Endpoints

Include the JWT in the HTTP Authorization header:

```http
Authorization: Bearer <your-access-token>
```

- Tokens are signed using a secret configured through environment variables.
- Tokens expire after one hour.
- Missing, invalid, and expired tokens are rejected.
- Protected routes require successful JWT verification.

---

## Decision API

All decision endpoints require a valid JWT.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/decisions` | Create a decision |
| GET | `/decisions` | Retrieve accessible decisions |
| GET | `/decisions/:id` | Retrieve a decision |
| PATCH | `/decisions/:id` | Update a decision |
| GET | `/decisions/:id/versions` | Retrieve version history |
| GET | `/decisions/:id/versions/:versionNumber` | Retrieve a specific version |
| GET | `/decisions/:id/versions/compare?from=1&to=2` | Compare versions |
| POST | `/decisions/:id/versions/:versionNumber/restore` | Restore a historical version |

### Create a Decision

`POST /decisions`

Example request:

```json
{
  "title": "Choose PostgreSQL for Decision Ledger",
  "context": "We need a reliable relational database.",
  "options": ["MongoDB", "PostgreSQL", "MySQL"],
  "decisionSummary": "Use PostgreSQL as the primary database.",
  "rationale": "PostgreSQL provides ACID transactions and relational integrity.",
  "status": "PROPOSED",
  "owner": "Development Team",
  "visibility": "PRIVATE",
  "commitMessage": "Initial database selection"
}
```

The backend automatically associates the decision with the authenticated user. Clients must not supply their own `userId`.

### Update a Decision

`PATCH /decisions/:id`

Example request:

```json
{
  "rationale": "Updated rationale after technical review",
  "commitMessage": "Updated rationale after technical review"
}
```

### Restore a Version

`POST /decisions/:id/versions/1/restore`

Restoration creates a new version rather than overwriting historical data.

---

## Access Control and Visibility

Decision Ledger supports two visibility levels.

| Visibility | Access |
|---|---|
| PRIVATE | Only the creator can access the decision |
| PUBLIC | Any authenticated user can view the decision |

### Permission Rules

| Operation | Creator | Other authenticated users |
|---|---|---|
| View private decision | Yes | No |
| View public decision | Yes | Yes |
| View public version history | Yes | Yes |
| Edit decision | Yes | No |
| Restore historical version | Yes | No |

Additional safeguards:
- Private decisions are excluded from other users' results.
- Public decisions are available in read-only mode to other users.
- Creator information is displayed separately from the assigned decision owner.
- Unauthorized access to another user's private decision returns HTTP 404.

---

## Search, Filtering and Pagination

The decisions API supports the following query parameters:

| Parameter | Description | Example |
|---|---|---|
| `search` | Search title and context | `search=database` |
| `status` | Filter by decision status | `status=ACCEPTED` |
| `owner` | Filter by assigned owner | `owner=Development` |
| `visibility` | Filter by visibility | `visibility=PUBLIC` |
| `page` | Page number | `page=1` |
| `limit` | Records per page | `limit=10` |

Example request:

```http
GET /decisions?search=PostgreSQL&status=ACCEPTED&visibility=PUBLIC&page=1&limit=10
```

The response includes matching decisions and pagination metadata.

---

## Decision Lifecycle Management

Decision Ledger enforces valid status transitions.

| Current Status | Allowed Next Status |
|---|---|
| PROPOSED | ACCEPTED, REVERSED |
| ACCEPTED | SUPERSEDED, REVERSED |
| SUPERSEDED | None |
| REVERSED | None |

- Invalid transitions return HTTP 400.
- Every valid update creates a new decision version.
- Rejected transitions do not modify the decision or its history.
- Restoration is handled separately from normal lifecycle transitions.

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
cd DecisionLedger
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend directory:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/decision_ledger"
SHADOW_DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/decision_ledger_shadow"
JWT_SECRET="YOUR_SECURE_RANDOM_SECRET"
```

Replace the placeholders with your PostgreSQL credentials and a secure JWT secret.

Run database migrations and generate Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate
```

Start the backend:

```bash
npm run start:dev
```

Backend URL:

`http://localhost:3000`

### 3. Frontend Setup

Open another terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local frontend URL, typically:

`http://localhost:5173`

### Security Notes

- Never commit `.env` files to GitHub.
- Never expose database credentials or JWT secrets.
- Use a separate secure secret for production.
- Configure production database credentials securely.

---

## Testing

Decision Ledger uses Jest for backend unit testing.

Run tests from the `backend` directory:

```bash
npm test -- --runInBand
```

Run the backend production build:

```bash
npm run build
```

Run frontend TypeScript verification:

```bash
npx tsc --noEmit
```

Run the frontend production build:

```bash
npm run build
```

### Backend Test Verification

The backend has been verified with **25 passing tests across 5 test suites**.

---

## Project Roadmap

- [x] NestJS backend setup
- [x] PostgreSQL integration
- [x] Prisma database migrations
- [x] Decision CRUD APIs
- [x] Automatic decision versioning
- [x] Historical version retrieval
- [x] Version comparison
- [x] Historical version restoration
- [x] Commit messages and restoration metadata
- [x] Decision lifecycle management
- [x] Search, filtering, and pagination
- [x] JWT authentication
- [x] User ownership and access control
- [x] Public and private decision visibility
- [x] React frontend
- [x] Frontend-backend integration
- [x] Backend unit testing
- [ ] GitHub integration
- [ ] Deployment and production documentation


---

## Author

**Niharika Singh**

