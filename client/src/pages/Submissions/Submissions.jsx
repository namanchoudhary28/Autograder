import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMySubmissions } from "../../store/submissions.slice";
import "./Submissions.css";

export default function Submissions() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.submissions);

  useEffect(() => {
    dispatch(fetchMySubmissions());
  }, [dispatch]);

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div className="submissions-page">
      <h2>My Submissions</h2>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Problem</th>
            <th>Language</th>
            <th>Status</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {list.map((s, idx) => (
            <tr key={s._id}>
              <td>{idx + 1}</td>
              <td>{s.problemId?.title || "Problem"}</td>
              <td>{s.language}</td>
              <td>
                <span className={`status ${s.status}`}>
                  {s.status}
                </span>
              </td>
              <td>{new Date(s.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
