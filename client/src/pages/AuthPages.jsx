import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const AuthShell = ({ mode }) => {
  const isRegister = mode === "register";
  const { user, loading, login, register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <p className="eyebrow">MediaVault</p>
        <h1>{isRegister ? "Create your vault" : "Welcome back"}</h1>
        <p className="auth-copy">
          {isRegister
            ? "Start tracking the stories, worlds, and games you want to keep close."
            : "Pick up where your watchlist, backlog, and favourites left off."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              <span>Username</span>
              <input
                required
                type="text"
                value={form.username}
                onChange={(event) => setField("username", event.target.value)}
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => setField("password", event.target.value)}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to MediaVault?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Log in" : "Create one"}
          </Link>
        </p>
      </section>
    </main>
  );
};

export const LoginPage = () => <AuthShell mode="login" />;

export const RegisterPage = () => <AuthShell mode="register" />;
