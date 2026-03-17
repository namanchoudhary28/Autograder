# 🚀 AutoGrader - Scalable Code Evaluation System

## 🔥 Overview

AutoGrader is a **secure and scalable code evaluation system** that executes untrusted user code inside **isolated Docker containers** and evaluates it against predefined test cases.

It is designed with **asynchronous execution and system design principles**, making it capable of handling concurrent submissions while ensuring safety and performance.

---

## ⚡ Key Features

* 🐳 **Docker-based sandboxing** for secure code execution
* ⚡ **Asynchronous processing pipeline** (non-blocking execution)
* 📊 **Real-time status handling** (queue-ready architecture)
* 🧠 **Test case-based evaluation** (AC / WA / TLE / RE)
* 🔐 **JWT-based authentication & authorization**
* 📈 Designed for **horizontal scalability**

---

## 🏗️ High-Level Architecture

```
User → API → Submission Service → Judge Engine → Docker → Database
```

* **API Layer** → Handles requests, authentication, validation
* **Submission Service** → Stores submission & triggers execution
* **Judge Engine** → Runs test cases
* **Docker Sandbox** → Executes untrusted code securely
* **Database (MongoDB)** → Stores users, problems, submissions

---

## 🔄 Execution Flow

1. User submits code via API
2. Submission stored in DB with status `QUEUED`
3. Async judge process starts execution
4. Code runs inside Docker container
5. Output is validated against test cases
6. Status updated (`AC / WA / TLE / RE`)
7. User fetches result

---

## 🚀 Key Design Concepts

* **Asynchronous Processing** → Non-blocking execution
* **Containerized Execution** → Secure sandboxing
* **Timeout Handling** → Prevent infinite loops
* **Scalable Architecture** → Easily extendable to queue-based system (BullMQ + Redis)
* **Fault Isolation** → Each submission runs independently

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Execution Engine:** Docker
* **Auth:** JWT
* **Process Handling:** Child Process (spawn)

---

## 📡 API Example

### Submit Code

```
POST /submission/create
```

```json
{
  "problemId": "123",
  "language": "javascript",
  "code": "console.log('Hello World')"
}
```

### Get Submission Status

```
GET /submission/:id
```

---

## ▶️ Run Locally

```bash
# Install dependencies
npm install

# Start server
npm start
```

### Prerequisites

* Node.js (v18+)
* Docker installed & running
* MongoDB instance

---

## 🔒 Security

* Code executed inside **isolated Docker containers**
* Timeout protection (prevents infinite loops)
* No shared state between executions
* Designed to support resource limits (CPU / Memory)

---

## 📈 Scalability (Design Ready)

Current system uses **in-process async execution**, but architecture is designed to scale using:

* **BullMQ + Redis (Queue-based processing)**
* **Multiple worker instances**
* **Load-balanced API servers**

---

## 📄 Detailed System Design

👉 For complete architecture, trade-offs, and deep dive:
**[View Full System Design Documentation](./BACKEND_DESIGN_DOCUMENTATION.md)**

---

## 🚀 Future Enhancements

* Multi-language support (Python, Java, C++)
* Queue-based distributed workers
* Real-time updates via WebSockets
* Plagiarism detection
* Partial scoring system

---

## 🎯 Why This Project Matters

This project demonstrates:

* Real-world **system design thinking**
* Handling **concurrent workloads**
* Secure execution of **untrusted code**
* Designing for **scalability and fault tolerance**

---

## 👨‍💻 Author

**Naman Singh Choudhary**

* LinkedIn: https://www.linkedin.com/in/naman-choudhary-040353154/
* GitHub: https://github.com/namanchoudhary28

---
