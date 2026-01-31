import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchProblemById } from "../../store/problems.slice";
import api from "../../shared/api/axios";
import "./ProblemDetail.css";

export default function ProblemDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, loading } = useSelector((state) => state.problems);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchProblemById(id));
  }, [id, dispatch]);

  const submitHandler = async () => {
    if (!code.trim()) return alert("Write code first");

    setSubmitting(true);
    setStatus("QUEUED");

    const res = await api.post("/submission/create", {
      problemId: current._id,
      language,
      code
    });

    pollSubmission(res.data._id);
  };

  const pollSubmission = (submissionId) => {
    const interval = setInterval(async () => {
      const res = await api.get(`/submission/${submissionId}`);
      setStatus(res.data.status);

      if (["AC", "WA", "RE", "TLE"].includes(res.data.status)) {
        clearInterval(interval);
        setSubmitting(false);
      }
    }, 2000);
  };

  if (loading || !current) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div className="problem-detail">
      {/* LEFT */}
      <div className="problem-info">
        <h2>{current.title}</h2>
        <span className={`badge ${current.difficulty}`}>
          {current.difficulty}
        </span>

        <p className="description">{current.description}</p>

        <div className="testcases">
          <h4>Example Test Cases</h4>
          {current.testCases.map((tc) => (
            <div key={tc._id} className="testcase">
              <p><strong>Input:</strong></p>
              <pre>{tc.input}</pre>
              <p><strong>Output:</strong></p>
              <pre>{tc.output}</pre>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="editor-section">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>

        </select>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Write your solution here..."
        />

        <button disabled={submitting} onClick={submitHandler}>
          {submitting ? "Running..." : "Submit"}
        </button>

        {status && (
          <p className={`status ${status}`}>
            Status: <strong>{status}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
