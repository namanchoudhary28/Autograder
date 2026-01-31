import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProblems } from "../../store/problems.slice";
import { useNavigate } from "react-router-dom";
import "./Problems.css";

export default function Problems() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list = [], loading = false, error = null } = useSelector(
    (state) => state.problems || {}
  );

  useEffect(() => {
    dispatch(fetchProblems());
  }, [dispatch]);

  if (loading) return <p className="center">Loading problems...</p>;
  if (error) return <p className="center error">{error}</p>;

  return (
    <div className="problems-container">
      <h2>Problems</h2>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Difficulty</th>
          </tr>
        </thead>

        <tbody>
          {list.map((p) => (
            <tr
              key={p._id}
              onClick={() => navigate(`/problems/${p._id}`)}
            >
              <td>{p.title}</td>
              <td className={`diff ${p.difficulty}`}>
                {p.difficulty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
