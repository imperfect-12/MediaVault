import { useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const closeMenu = () => setOpen(false);

  return (
    <header className="navbar">
      <NavLink to="/" className="brand" onClick={closeMenu}>
        <span className="brand-mark">MV</span>
        <span>MediaVault</span>
      </NavLink>

      <button
        className="hamburger"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`nav-links ${open ? "is-open" : ""}`}>
        <NavLink to="/" onClick={closeMenu}>
          Home
        </NavLink>
        <NavLink to="/movies" onClick={closeMenu}>
          Movies
        </NavLink>
        <NavLink to="/anime" onClick={closeMenu}>
          Anime
        </NavLink>
        <NavLink to="/games" onClick={closeMenu}>
          Games
        </NavLink>
      </nav>

      <div className={`nav-user ${open ? "is-open" : ""}`}>
        <span className="username">{user?.username}</span>
        <button className="ghost-button" type="button" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
