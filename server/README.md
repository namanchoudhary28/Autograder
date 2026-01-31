okay to Phase 1 will setup frontend and backend code and authentication should work, let keep it simple

autograder/
│
├── client/              # React App
│   ├── src/
│   │   ├── app/
│   │   │   └── store.js
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── problems/
│   │   │   └── submissions/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Problems.jsx
│   │   │   └── ProblemDetail.jsx
│   │   └── App.jsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Problem.js
│   │   │   └── Submission.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── problem.routes.js
│   │   │   └── submission.routes.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── app.js
│   └── package.json
│
└── README.md