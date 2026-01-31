import { useDispatch, useSelector } from "react-redux";
import { logout, fetchUser } from "../../store/auth.slice";
import { useNavigate, NavLink } from "react-router-dom";
import { useEffect } from "react";
import "./Navbar.css";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutHandler = () => {
    dispatch(logout());
    navigate("/login");
  };
  const { user, token } = useSelector((state) => state.auth);

  // Fetch user on mount if token exists
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchUser());
    }
  }, [token, user, dispatch]);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <NavLink to="/problems" className="logo">
          AutoGrader
        </NavLink>

        <nav className="nav-links">
          <NavLink
            to="/problems"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Problems
          </NavLink>

          <NavLink
            to="/submissions"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Submissions
          </NavLink>
          
          {user?.role === 'admin' && (
            <NavLink
              to="/addproblem"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Add Problem
            </NavLink>
          )}
        </nav>
      </div>

      <div className="navbar-right">
        <button className="logout-btn" onClick={logoutHandler}>
          Logout
        </button>
      </div>
    </header>
  );
}
