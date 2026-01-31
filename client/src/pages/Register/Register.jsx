import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../store/auth.slice";
import "./Register.css";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const changeHandler = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      return alert("All fields are required");
    }

    try {
      await dispatch(register(form)).unwrap();
      alert("Registered successfully");
      navigate("/login");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={submitHandler}>
        <h2>Register</h2>

        <input
          name="name"
          placeholder="Name"
          onChange={changeHandler}
        />

        <input
          name="email"
          placeholder="Email"
          onChange={changeHandler}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={changeHandler}
        />

        <button type="submit">Register</button>

        <p>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
