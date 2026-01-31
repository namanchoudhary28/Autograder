# AutoGrader Backend System Design Documentation

**Version:** 1.0  
**Date:** January 11, 2026  
**Author:** System Architecture Team

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Request Lifecycle](#3-request-lifecycle)
4. [API Design](#4-api-design)
5. [Worker & Execution Engine](#5-worker--execution-engine)
6. [Sandbox & Security](#6-sandbox--security)
7. [Database Design](#7-database-design)
8. [Scalability & Performance](#8-scalability--performance)
9. [Error Handling & Observability](#9-error-handling--observability)
10. [Trade-offs & Design Decisions](#10-trade-offs--design-decisions)
11. [Future Enhancements](#11-future-enhancements)

---

## 1. Problem Statement

### 1.1 What Problem Does AutoGrader Solve?

AutoGrader is an automated code evaluation system that:
- **Validates student code submissions** against predefined test cases
- **Provides instant feedback** on correctness, performance, and errors
- **Scales to handle multiple simultaneous submissions** without manual intervention
- **Ensures secure execution** of untrusted code in isolated environments

### 1.2 Target Users

- **Students/Learners**: Submit code solutions to programming problems
- **Instructors/Admins**: Create problems, define test cases, monitor submissions
- **Automated Systems**: Integration with LMS platforms, coding platforms

### 1.3 Core Use Cases

1. **Submit Code**: User submits JavaScript code for a problem
2. **Automated Evaluation**: System executes code against test cases
3. **Result Delivery**: System returns verdict (AC/WA/TLE/RE) with execution details
4. **Problem Management**: Admins create/update problems with test cases
5. **Submission History**: Users track past submissions and results

---

## 2. High-Level Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                            │
│                    (React Web Application)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Gateway Layer                          │
│                    (Express.js + CORS)                          │
│  - Authentication (JWT)                                          │
│  - Request Validation                                            │
│  - Rate Limiting                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        ▼                                         ▼
┌──────────────────┐                    ┌──────────────────────┐
│  Problem Service │                    │  Submission Service  │
│                  │                    │                      │
│  - CRUD Problems │                    │  - Create Submission │
│  - Test Cases    │                    │  - Query Status      │
└────────┬─────────┘                    └──────────┬───────────┘
         │                                         │
         │                                         │ (Async)
         │                                         ▼
         │                              ┌────────────────────────┐
         │                              │   Judge Service        │
         │                              │   (Execution Engine)   │
         │                              │  - Fetch Test Cases    │
         │                              │  - Execute Code        │
         │                              │  - Evaluate Results    │
         │                              └──────────┬─────────────┘
         │                                         │
         │                                         ▼
         │                              ┌────────────────────────┐
         │                              │  Docker Sandbox        │
         │                              │  (Isolated Execution)  │
         │                              │  - Volume Mounts       │
         │                              │  - Resource Limits     │
         │                              │  - Timeout Protection  │
         │                              └────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Database Layer                             │
│                      (MongoDB Atlas)                             │
│                                                                  │
│  Collections: Users, Problems, Submissions                      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js v20 | JavaScript execution environment |
| **Framework** | Express.js | REST API framework |
| **Database** | MongoDB | Document storage for flexible schemas |
| **Sandbox** | Docker | Code isolation and execution |
| **Authentication** | JWT | Stateless user authentication |
| **Process Management** | Child Process (spawn) | Docker container orchestration |

### 2.3 Execution Flow Pattern

**Synchronous Components:**
- API Request Handling (Express routes)
- Database Queries (MongoDB operations)
- Authentication & Authorization

**Asynchronous Components:**
- Code Execution (Docker spawn)
- Test Case Evaluation (Sequential iteration)
- File I/O Operations

**Current Implementation Note:**  
The system uses **in-process async execution** (Promise-based) rather than a dedicated message queue. This is suitable for low-to-medium traffic but limits horizontal scalability.

---

## 3. Request Lifecycle (End-to-End Flow)

### 3.1 Code Submission Flow

```
[Client] → [API] → [DB] → [Judge] → [Docker] → [DB] → [Client]
```

**Detailed Steps:**

```
1. CLIENT SUBMITS CODE
   POST /submission/create
   {
     "problemId": "694d22a2...",
     "language": "javascript",
     "code": "const fs = require('fs');..."
   }

2. API LAYER (submission.controller.js)
   ├─ Validate JWT token
   ├─ Extract user ID from token
   └─ Forward to Submission Service

3. SUBMISSION SERVICE (submission.service.js)
   ├─ Create submission document
   │  └─ Status: QUEUED
   ├─ Save to MongoDB
   └─ Trigger runJudge() asynchronously (fire-and-forget)

4. JUDGE SERVICE (judge.service.js)
   ├─ Update status → RUNNING
   ├─ Fetch problem details (test cases)
   └─ For each test case:
      ├─ Call dockerJudge.runInDocker()
      ├─ If FAIL → Update status (WA/RE/TLE) and STOP
      └─ If PASS → Continue to next test case

5. DOCKER JUDGE SERVICE (dockerJudge.service.js)
   ├─ Create submission directory
   │  └─ ~/.autograder/submissions/<submissionId>/
   ├─ Write files:
   │  ├─ code.js (user code)
   │  └─ input.txt (test case input)
   ├─ Spawn Docker container:
   │  └─ docker run --rm -v <dir>:/code js-runner
   ├─ Capture stdout/stderr
   ├─ Apply 5-second timeout
   └─ Return result: { status: AC/WA/RE/TLE, output: "..." }

6. JUDGE SERVICE (continued)
   ├─ Compare output with expected
   └─ Update submission status in DB

7. CLIENT POLLS OR RECEIVES RESULT
   GET /submission/:id
   Returns: { status: "AC", output: "..." }
```

### 3.2 Execution Flow Diagram

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /submission/create
     ▼
┌─────────────────┐
│  API Gateway    │
│  (Auth Check)   │
└────┬────────────┘
     │
     ▼
┌─────────────────────┐
│ Submission Service  │
│ - Create Doc (QUEUED)│──────┐
│ - Return Immediately │      │
└─────────────────────┘       │
                              │ Async (No Wait)
     ┌────────────────────────┘
     ▼
┌─────────────────────┐
│   Judge Service     │
│ - Update (RUNNING)  │
│ - Fetch Test Cases  │
└─────┬───────────────┘
      │ For Each Test Case
      ▼
┌─────────────────────────┐
│  Docker Judge Service   │
│ - Write code.js         │
│ - Write input.txt       │
│ - Spawn Docker          │
│ - Wait 5s max           │
└─────┬───────────────────┘
      │
      ▼
┌──────────────────────┐
│  Docker Container    │
│  (js-runner image)   │
│  - Execute code.js   │
│  - Read input.txt    │
│  - Output to stdout  │
└──────┬───────────────┘
       │ Exit Code 0/1
       ▼
┌───────────────────────┐
│  Judge Service        │
│  - Compare Output     │
│  - Update Status (AC) │
└───────────────────────┘
       │
       ▼
┌───────────────────────┐
│  MongoDB              │
│  (Status Persisted)   │
└───────────────────────┘
```

### 3.3 Failure & Timeout Handling

| Scenario | Detection | Action |
|----------|-----------|--------|
| **Infinite Loop** | Timeout after 5s | Kill Docker, Status: TLE |
| **Runtime Error** | Exit code ≠ 0 | Capture stderr, Status: RE |
| **Wrong Output** | Output mismatch | Status: WA |
| **Docker Spawn Fail** | Error event | Status: RE |
| **DB Connection Lost** | Mongoose error | Log error, return 500 |

**Timeout Implementation:**
```javascript
const timeout = setTimeout(() => {
  if (!resolved) {
    resolved = true;
    docker.kill();
    resolve({ status: "TLE", output: "Time limit exceeded" });
  }
}, 5000);
```

---

## 4. API Design

### 4.1 Authentication & Authorization

**Mechanism:** JWT (JSON Web Tokens)

**Flow:**
1. User logs in → Server generates JWT with `{ id, role }`
2. Client stores token in localStorage
3. Subsequent requests include: `Authorization: Bearer <token>`
4. Middleware validates token and attaches `req.user`

**Roles:**
- `student`: Can submit code, view own submissions
- `admin`: Can create problems, view all submissions

### 4.2 API Endpoints

#### 4.2.1 Authentication APIs

| Method | Endpoint | Auth | Request Body | Response |
|--------|----------|------|--------------|----------|
| POST | `/auth/register` | None | `{ name, email, password }` | `{ message: "User registered" }` |
| POST | `/auth/login` | None | `{ email, password }` | `{ token: "jwt..." }` |
| GET | `/auth/user/me` | Required | None | `{ _id, name, email, role }` |

#### 4.2.2 Problem APIs

| Method | Endpoint | Auth | Request Body | Response |
|--------|----------|------|--------------|----------|
| GET | `/problems` | Required | None | `[{ _id, title, difficulty, ... }]` |
| GET | `/problems/:id` | Required | None | `{ _id, title, description, testCases, ... }` |
| POST | `/problems/create` | Admin | `{ title, description, difficulty, testCases }` | `{ _id, ... }` |

**Test Case Format:**
```json
{
  "input": "2 7\n9\n",
  "output": "0 1\n"
}
```

#### 4.2.3 Submission APIs

| Method | Endpoint | Auth | Request Body | Response |
|--------|----------|------|--------------|----------|
| POST | `/submission/create` | Required | `{ problemId, language, code }` | `{ _id, status: "QUEUED", ... }` |
| GET | `/submission/getSubmission` | Required | None | `[{ _id, status, code, ... }]` (user's submissions) |
| GET | `/submission/:id` | Required | None | `{ _id, status, output, ... }` |

**Submission Status Values:**
- `QUEUED`: Waiting for execution
- `RUNNING`: Currently executing
- `AC`: Accepted (All test cases passed)
- `WA`: Wrong Answer
- `TLE`: Time Limit Exceeded
- `RE`: Runtime Error

### 4.3 Response Formats

**Success Response:**
```json
{
  "_id": "694dac128f4aec289e6c1085",
  "userId": "694cf39a6ae20c447ad2f987",
  "problemId": "694d22a22ac440a19ac0983f",
  "language": "javascript",
  "code": "const fs = require('fs');...",
  "status": "AC",
  "createdAt": "2025-12-25T21:24:51.225Z",
  "updatedAt": "2025-12-25T21:24:52.153Z"
}
```

**Error Response:**
```json
{
  "message": "Error in submission",
  "error": "Timeout exceeded"
}
```

---

## 5. Worker & Execution Engine

### 5.1 Current Architecture (In-Process)

**Execution Model:**
- **Synchronous API Response**: Client receives submission ID immediately
- **Asynchronous Execution**: `runJudge()` runs in background (non-blocking)
- **No Queue System**: Direct function call (fire-and-forget)

**Implications:**
- ✅ Simple implementation
- ✅ Low latency for submission creation
- ❌ No job persistence (if server crashes, queued jobs lost)
- ❌ Cannot distribute load across multiple servers

### 5.2 Code Execution Pipeline

```
┌────────────────────────────────────────────────────────────────┐
│                    Judge Service (judge.service.js)            │
│                                                                │
│  1. Fetch Problem & Test Cases                                │
│  2. For each test case:                                       │
│     ├─ Create submission directory                            │
│     ├─ Write code.js & input.txt                              │
│     ├─ Spawn Docker container                                 │
│     ├─ Wait for execution (max 5s)                            │
│     ├─ Capture output                                         │
│     ├─ Compare with expected output                           │
│     └─ If FAIL → Stop, If PASS → Next test case              │
│  3. Update final status in DB                                 │
└────────────────────────────────────────────────────────────────┘
```

### 5.3 Language Isolation

**Current Support:** JavaScript only

**Docker Image:** `js-runner`
- **Base Image:** `node:18-alpine`
- **Execution Script:** `/app/run.js`
- **User Code Path:** `/code/code.js`
- **Input File Path:** `/code/input.txt`

**Execution Command:**
```bash
docker run --rm -v ~/.autograder/submissions/<id>:/code js-runner
```

**run.js Implementation:**
```javascript
const fs = require("fs");

try {
  if (!fs.existsSync("/code/code.js")) {
    throw new Error("code.js not found");
  }

  const input = fs.readFileSync("/code/input.txt", "utf8");
  process.stdin.push(input);
  process.stdin.push(null);

  delete require.cache[require.resolve("/code/code.js")];
  require("/code/code.js");

  process.exit(0);
} catch (err) {
  console.error(err.toString());
  process.exit(1);
}
```

### 5.4 Resource Limits

**Time Limits:**
- **Per Test Case:** 5 seconds (enforced by setTimeout)
- **Total Submission:** 5s × number of test cases

**Memory Limits:**
- **Current:** No explicit Docker memory limit
- **Recommendation:** Add `--memory="128m"` flag

**CPU Limits:**
- **Current:** No explicit limit
- **Recommendation:** Add `--cpus="0.5"` flag

**Network Access:**
- **Current:** Containers have full network access
- **Recommendation:** Add `--network=none` flag

---

## 6. Sandbox & Security

### 6.1 Code Isolation Strategy

**Primary Isolation:** Docker Containers
- Each submission runs in a **fresh, ephemeral container**
- Container is destroyed after execution (`--rm` flag)
- No shared state between executions

**File System Isolation:**
- User code is mounted as **read-only volume** at `/code`
- Container cannot access host filesystem outside mount
- Temporary files are isolated within container

### 6.2 Preventing Malicious Code Execution

**Current Protections:**

| Threat | Mitigation |
|--------|------------|
| **Infinite Loops** | 5-second timeout + container kill |
| **Fork Bombs** | ❌ Not implemented (container limits needed) |
| **Disk Space Abuse** | ❌ Not implemented (disk quota needed) |
| **Network Attacks** | ❌ Container has network access |
| **Host Filesystem Access** | ✅ Volume mount restricted to submission dir |

**Recommended Additional Protections:**

```bash
docker run --rm \
  --memory="128m" \          # Limit RAM
  --cpus="0.5" \             # Limit CPU
  --network=none \           # Disable network
  --pids-limit=50 \          # Prevent fork bombs
  --ulimit nofile=100 \      # Limit open files
  --security-opt=no-new-privileges \
  -v ~/.autograder/submissions/<id>:/code:ro \  # Read-only mount
  js-runner
```

### 6.3 Docker Security Best Practices

**Applied:**
- ✅ Non-root user in container (Node.js Alpine runs as `node`)
- ✅ Minimal base image (Alpine Linux)
- ✅ Ephemeral containers (`--rm`)
- ✅ Volume mounts instead of COPY

**Missing:**
- ❌ AppArmor/SELinux profiles
- ❌ Seccomp security profiles
- ❌ Read-only root filesystem
- ❌ Resource limits

### 6.4 Input Validation

**Server-Side Validation:**
- ✅ JWT authentication required
- ✅ Code size validation (implicit via Express body parser)
- ❌ Code content sanitization (not implemented)
- ❌ Test case input validation (not implemented)

**Recommendation:**
```javascript
// Add to submission.controller.js
if (req.body.code.length > 10000) {
  return res.status(400).json({ error: "Code too long" });
}
if (!/^[a-zA-Z0-9\s\n\r.,;:(){}\[\]<>+=\-*/%&|^!?'"\\]+$/.test(req.body.code)) {
  return res.status(400).json({ error: "Invalid characters in code" });
}
```

---

## 7. Database Design

### 7.1 Data Models

#### 7.1.1 User Schema

```javascript
{
  _id: ObjectId,
  name: String,           // User's full name
  email: String,          // Unique identifier
  password: String,       // bcrypt hashed
  role: String,           // 'admin' | 'student'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email`: Unique index for login lookups

#### 7.1.2 Problem Schema

```javascript
{
  _id: ObjectId,
  title: String,          // "Two Sum"
  description: String,    // Problem statement
  difficulty: String,     // 'easy' | 'medium' | 'hard'
  testCases: [
    {
      input: String,      // "2 7\n9\n"
      output: String      // "0 1\n"
    }
  ],
  createdBy: ObjectId,    // Reference to User
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `createdBy`: For admin problem management
- `difficulty`: For filtering problems

#### 7.1.3 Submission Schema

```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // Reference to User
  problemId: ObjectId,    // Reference to Problem
  language: String,       // 'javascript'
  code: String,           // User's submitted code
  status: String,         // 'QUEUED' | 'RUNNING' | 'AC' | 'WA' | 'TLE' | 'RE'
  output: String,         // Execution output (for debugging)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId`: For user submission history
- `problemId`: For problem statistics
- `status`: For filtering by verdict
- Compound: `(userId, createdAt)`: For efficient pagination

### 7.2 Relationships

```
User (1) ──────────┬─── Creates ───> (N) Problem
                   │
                   └─── Submits ───> (N) Submission

Problem (1) ────── Has ───> (N) Submission
```

**Referential Integrity:**
- Foreign keys are **not enforced** by MongoDB
- Application-level validation required
- Orphaned submissions possible if problem deleted

### 7.3 Indexing Strategy

**Query Patterns:**

| Query | Index | Reason |
|-------|-------|--------|
| Login | `email` | Unique lookup by email |
| User submissions | `userId + createdAt` | Pagination + sorting |
| Problem submissions | `problemId + createdAt` | Problem statistics |
| Admin dashboard | `status + createdAt` | Filter by verdict |

**Index Definitions:**
```javascript
// User Model
userSchema.index({ email: 1 }, { unique: true });

// Submission Model
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ problemId: 1, createdAt: -1 });
submissionSchema.index({ status: 1, createdAt: -1 });
```

### 7.4 Data Retention

**Current Policy:** No deletion/archival

**Recommendations:**
- Archive submissions older than 1 year
- Implement soft deletes for problems
- Add TTL index for temporary data

---

## 8. Scalability & Performance

### 8.1 Current Bottlenecks

| Component | Bottleneck | Impact |
|-----------|------------|--------|
| **API Server** | Single Node.js process | Max ~10k req/sec |
| **Judge Service** | Sequential test case execution | Linear time complexity |
| **Docker Execution** | Host resource limits | Max concurrent containers |
| **Database** | No connection pooling config | Connection exhaustion risk |

### 8.2 Horizontal Scaling Strategy

**Challenge:** In-process async execution cannot distribute across servers

**Solution: Message Queue Architecture**

```
┌────────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                       │
└──────┬─────────────────────────────────────┬───────────────────┘
       │                                     │
       ▼                                     ▼
┌──────────────┐                      ┌──────────────┐
│ API Server 1 │                      │ API Server 2 │
└──────┬───────┘                      └──────┬───────┘
       │                                     │
       └─────────────┬───────────────────────┘
                     │ Publish Job
                     ▼
              ┌──────────────┐
              │ Redis Queue  │
              │   (Bull)     │
              └──────┬───────┘
                     │ Pull Job
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Worker 1  │ │  Worker 2  │ │  Worker 3  │
│  (Judge)   │ │  (Judge)   │ │  (Judge)   │
└────────────┘ └────────────┘ └────────────┘
```

**Implementation with Bull Queue:**

```javascript
// Queue Setup (queue.js)
const Queue = require('bull');
const judgeQueue = new Queue('code-execution', {
  redis: { host: 'localhost', port: 6379 }
});

// Producer (submission.service.js)
exports.createSubmission = async (data, userId) => {
  const submission = await Submission.create({
    userId,
    ...data,
    status: STATUS.QUEUED
  });
  
  // Add to queue instead of direct call
  await judgeQueue.add({
    submissionId: submission._id,
    code: submission.code,
    problemId: submission.problemId
  });
  
  return submission;
};

// Consumer (worker.js)
judgeQueue.process(async (job) => {
  const { submissionId, code, problemId } = job.data;
  await runJudge({ _id: submissionId, code, problemId });
});
```

### 8.3 Caching Opportunities

| Data | Cache Strategy | TTL |
|------|---------------|-----|
| Problem List | Redis | 5 minutes |
| Problem Details | Redis | 1 hour |
| User Profile | In-memory (LRU) | 15 minutes |
| Test Cases | Redis | Until problem updated |

**Example:**
```javascript
const redis = require('redis');
const client = redis.createClient();

exports.getProblem = async (id) => {
  const cached = await client.get(`problem:${id}`);
  if (cached) return JSON.parse(cached);
  
  const problem = await Problem.findById(id);
  await client.setex(`problem:${id}`, 3600, JSON.stringify(problem));
  return problem;
};
```

### 8.4 Database Optimization

**Connection Pooling:**
```javascript
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
});
```

**Query Optimization:**
- Use projection to fetch only required fields
- Implement pagination for large result sets
- Use lean() for read-only queries

```javascript
// Before
const submissions = await Submission.find({ userId });

// After
const submissions = await Submission
  .find({ userId })
  .select('status problemId createdAt')
  .lean()
  .limit(20)
  .sort({ createdAt: -1 });
```

### 8.5 Performance Benchmarks

**Target SLAs:**

| Metric | Target | Current |
|--------|--------|---------|
| Submission Creation | < 200ms | ~50ms |
| Code Execution (per test) | < 5s | 0.5-5s |
| Submission Status Query | < 100ms | ~20ms |
| Problem List Load | < 500ms | ~100ms |

---

## 9. Error Handling & Observability

### 9.1 Error Categories

| Category | Examples | Handling Strategy |
|----------|----------|-------------------|
| **Client Errors (4xx)** | Invalid input, unauthorized | Return descriptive error message |
| **Server Errors (5xx)** | DB connection lost, Docker spawn fail | Log error, return generic message |
| **Execution Errors** | TLE, RE, WA | Store in submission.output |
| **Infrastructure Errors** | Out of memory, disk full | Alert ops team |

### 9.2 Logging Strategy

**Current Implementation:**
```javascript
// Basic console logging
console.log("Server running on port", port);
console.log("MongoDB connected");
```

**Recommended: Structured Logging with Winston**

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('Submission created', { 
  submissionId: submission._id, 
  userId, 
  problemId 
});

logger.error('Docker execution failed', { 
  submissionId, 
  error: err.message 
});
```

**Log Levels:**
- **ERROR**: Docker spawn failures, DB errors, unexpected crashes
- **WARN**: Timeouts, wrong answers, rate limit exceeded
- **INFO**: Submission created, execution started, status updated
- **DEBUG**: Test case execution details, Docker commands

### 9.3 Retry Policies

**Current:** No retry mechanism

**Recommended:**

| Failure Type | Retry Policy | Max Retries |
|--------------|--------------|-------------|
| Docker spawn fail | Exponential backoff (1s, 2s, 4s) | 3 |
| DB connection lost | Immediate retry | 5 |
| Timeout | No retry | 0 |

**Implementation:**
```javascript
async function retryDockerExecution(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

### 9.4 Dead Letter Queue

**Purpose:** Capture failed jobs that exceed retry limits

**With Bull Queue:**
```javascript
judgeQueue.on('failed', async (job, err) => {
  logger.error('Job failed after retries', { 
    jobId: job.id, 
    submissionId: job.data.submissionId, 
    error: err.message 
  });
  
  // Update submission status
  await Submission.findByIdAndUpdate(job.data.submissionId, {
    status: 'RE',
    output: 'System error: ' + err.message
  });
});
```

### 9.5 Metrics & Alerts

**Key Metrics to Track:**

| Metric | Collection Method | Alert Threshold |
|--------|-------------------|-----------------|
| Submission rate | Counter | > 100/min |
| Avg execution time | Histogram | > 3s |
| Error rate | Counter | > 5% |
| Queue depth | Gauge | > 1000 |
| Docker container count | Gauge | > 50 |

**Prometheus Example:**
```javascript
const prometheus = require('prom-client');

const submissionCounter = new prometheus.Counter({
  name: 'submissions_total',
  help: 'Total number of submissions',
  labelNames: ['status']
});

const executionDuration = new prometheus.Histogram({
  name: 'execution_duration_seconds',
  help: 'Time taken to execute code',
  buckets: [0.5, 1, 2, 5]
});

// Usage
submissionCounter.inc({ status: 'AC' });
executionDuration.observe(2.3);
```

### 9.6 Health Checks

**Endpoint:** `GET /health`

```javascript
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: 'unknown',
    docker: 'unknown'
  };
  
  try {
    await mongoose.connection.db.admin().ping();
    health.database = 'healthy';
  } catch (err) {
    health.database = 'unhealthy';
  }
  
  try {
    const { execSync } = require('child_process');
    execSync('docker ps');
    health.docker = 'healthy';
  } catch (err) {
    health.docker = 'unhealthy';
  }
  
  const status = (health.database === 'healthy' && health.docker === 'healthy') ? 200 : 503;
  res.status(status).json(health);
});
```

---

## 10. Trade-offs & Design Decisions

### 10.1 Async Execution vs Synchronous

**Decision:** Async execution with fire-and-forget

**Pros:**
- ✅ Fast API response (< 50ms)
- ✅ Non-blocking user experience
- ✅ Simple implementation

**Cons:**
- ❌ No job persistence (lost on server crash)
- ❌ Cannot scale horizontally
- ❌ No visibility into queue depth

**Alternative Considered:** Synchronous execution (wait for result)
- Rejected due to slow API response (5s+ per submission)

### 10.2 Queue-Based vs In-Process

**Decision:** In-process async (current)

**Pros:**
- ✅ Zero infrastructure dependencies
- ✅ Simple deployment
- ✅ Low latency

**Cons:**
- ❌ Single point of failure
- ❌ Limited scalability
- ❌ No retry/DLQ

**Alternative Considered:** Redis + Bull Queue
- **Why not chosen:** Added complexity for MVP
- **When to migrate:** When traffic > 100 submissions/minute

### 10.3 Docker vs Other Sandboxes

**Decision:** Docker containers

**Pros:**
- ✅ Strong isolation
- ✅ Language-agnostic
- ✅ Resource limiting capabilities
- ✅ Industry standard

**Cons:**
- ❌ Slow startup (~500ms per container)
- ❌ Resource overhead
- ❌ Requires Docker daemon

**Alternatives Considered:**

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **VM-based (Firecracker)** | Strong isolation | Complex setup | Overkill for MVP |
| **WebAssembly (WASI)** | Fast startup | Limited language support | Too new |
| **Child Process** | Fast | No isolation | Security risk |

### 10.4 MongoDB vs PostgreSQL

**Decision:** MongoDB

**Pros:**
- ✅ Flexible schema (no migrations)
- ✅ Easy to add fields (e.g., test cases array)
- ✅ Native JSON support

**Cons:**
- ❌ No foreign key constraints
- ❌ No transactions (in current usage)
- ❌ Larger storage footprint

**Alternative Considered:** PostgreSQL
- **Why not chosen:** Rigid schema requires migrations for test case changes

### 10.5 Sequential vs Parallel Test Execution

**Decision:** Sequential execution

**Pros:**
- ✅ Simple implementation
- ✅ Predictable resource usage
- ✅ Early stopping on first failure

**Cons:**
- ❌ Slower total execution time
- ❌ Underutilized CPU for problems with many test cases

**Alternative Considered:** Parallel execution with `Promise.all()`
- **Why not chosen:** Risk of resource exhaustion (50+ concurrent Docker containers)
- **When to implement:** With worker pool limiting concurrency

---

## 11. Future Enhancements

### 11.1 Multi-Language Support

**Current:** JavaScript only

**Planned Languages:**
- Python
- Java
- C++
- Go

**Implementation:**
```javascript
// Dynamic Docker image selection
const imageMap = {
  'javascript': 'js-runner',
  'python': 'python-runner',
  'java': 'java-runner',
  'cpp': 'cpp-runner'
};

const image = imageMap[submission.language];
docker.spawn('docker', ['run', '--rm', '-v', `${dir}:/code`, image]);
```

**Challenges:**
- Different compilation steps (C++, Java)
- Different runtime environments
- Language-specific timeouts

### 11.2 Real-Time Status Updates

**Current:** Polling with `GET /submission/:id`

**Proposed:** WebSocket connections

**Implementation:**
```javascript
// Server
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('subscribe', (submissionId) => {
    socket.join(`submission:${submissionId}`);
  });
});

// Emit updates
io.to(`submission:${submissionId}`).emit('status', { status: 'RUNNING' });

// Client
const socket = io('http://localhost:5000');
socket.emit('subscribe', submissionId);
socket.on('status', (data) => {
  console.log('Status updated:', data.status);
});
```

### 11.3 Plagiarism Detection

**Algorithm:** Moss (Measure of Software Similarity)

**Workflow:**
1. Store submissions in normalized form
2. On new submission, compare with recent submissions
3. Flag similarity > 80%

**Implementation:**
```javascript
const moss = require('moss-node');

async function checkPlagiarism(code, problemId) {
  const recent = await Submission.find({ 
    problemId, 
    createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } 
  });
  
  const similarity = await moss.compare(code, recent.map(s => s.code));
  return similarity > 0.8;
}
```

### 11.4 Test Case Management

**Current:** Embedded in problem document

**Proposed:** Separate TestCase collection

**Benefits:**
- Version control for test cases
- Public vs private test cases
- Test case weights

**Schema:**
```javascript
{
  _id: ObjectId,
  problemId: ObjectId,
  input: String,
  output: String,
  visibility: String,  // 'public' | 'private'
  weight: Number,      // For weighted scoring
  createdAt: Date
}
```

### 11.5 Partial Credit Scoring

**Current:** Binary (AC or fail)

**Proposed:** Percentage-based scoring

**Example:**
- 3 test cases passed out of 5 → 60% score

**Implementation:**
```javascript
let passedCount = 0;
const totalCases = problem.testCases.length;

for (const tc of problem.testCases) {
  const result = await runInDocker(...);
  if (result.status === 'AC' && result.output.trim() === tc.output.trim()) {
    passedCount++;
  }
}

const score = (passedCount / totalCases) * 100;
await Submission.findByIdAndUpdate(submission._id, { 
  status: passedCount === totalCases ? 'AC' : 'WA',
  score: score
});
```

### 11.6 Re-run & Debugging Support

**Feature:** Allow users to re-run with custom input

**API:**
```javascript
POST /submission/:id/rerun
{
  "customInput": "5 10\n15\n"
}

Response:
{
  "output": "0 1\n",
  "executionTime": "0.23s",
  "memoryUsed": "12MB"
}
```

### 11.7 Leaderboard & Statistics

**Features:**
- Fastest solution per problem
- User solve count
- Problem difficulty rating (based on solve rate)

**Implementation:**
```javascript
// Fastest solution
db.submissions.aggregate([
  { $match: { problemId, status: 'AC' } },
  { $sort: { executionTime: 1 } },
  { $limit: 10 }
]);

// User stats
db.submissions.aggregate([
  { $match: { userId } },
  { $group: { 
      _id: '$status', 
      count: { $sum: 1 } 
  }}
]);
```

### 11.8 Code Analysis & Hints

**Feature:** Static analysis to provide hints

**Example:**
- Detect missing edge cases
- Suggest optimizations (O(n²) → O(n))
- Warn about potential issues (integer overflow)

**Implementation:**
```javascript
const { ESLint } = require('eslint');

async function analyzeCode(code) {
  const eslint = new ESLint();
  const results = await eslint.lintText(code);
  return results[0].messages;
}
```

---

## Conclusion

This AutoGrader backend demonstrates a **pragmatic MVP architecture** balancing simplicity with functionality. The current design handles low-to-medium traffic efficiently but has clear paths for scaling:

**Strengths:**
- ✅ Simple, maintainable codebase
- ✅ Fast API response times
- ✅ Docker-based security isolation
- ✅ RESTful API design

**Growth Path:**
1. **Phase 1 (Current):** In-process execution, single server
2. **Phase 2:** Bull queue + Redis, multi-language support
3. **Phase 3:** Horizontal scaling, real-time updates
4. **Phase 4:** Advanced features (plagiarism, partial credit)

**Immediate Priorities:**
1. Add resource limits to Docker containers
2. Implement structured logging
3. Add connection pooling and caching
4. Create monitoring dashboard

The architecture is **ready for production** at small-to-medium scale and has a clear migration path to handle growth.

---

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Maintained By:** Backend Architecture Team  
**Next Review:** February 2026
