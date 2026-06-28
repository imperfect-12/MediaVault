import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsMenuRef = useRef(null);
  const { user, logout } = useAuth();
  const { settings, updateSetting } = useSettings();

  const closeMenu = () => {
    setOpen(false);
    setSettingsOpen(false);
  };

  useEffect(() => {
    const closeSettings = (event) => {
      if (event.key === "Escape" || !settingsMenuRef.current?.contains(event.target)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeSettings);
    document.addEventListener("keydown", closeSettings);
    return () => {
      document.removeEventListener("mousedown", closeSettings);
      document.removeEventListener("keydown", closeSettings);
    };
  }, []);

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
        <NavLink to="/manga" onClick={closeMenu}>
          Manga
        </NavLink>
        <NavLink to="/anime" onClick={closeMenu}>
          Anime
        </NavLink>
        <NavLink to="/games" onClick={closeMenu}>
          Games
        </NavLink>
      </nav>

      <div className={`nav-user ${open ? "is-open" : ""}`}>
        <div className="settings-menu" ref={settingsMenuRef}>
          <button
            className="ghost-button settings-button"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((current) => !current)}
          >
            <span aria-hidden="true">&#9881;</span> Settings
          </button>

          {settingsOpen && (
            <section className="settings-panel" aria-label="Add entry settings">
              <div className="settings-panel-header">
                <strong>Add entry defaults</strong>
                <small>Saved on this device</small>
              </div>

              <label className="settings-option">
                <span>
                  <strong>Use image filename</strong>
                  <small>Preselect the filename as the media name.</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.useImageNameByDefault}
                  onChange={(event) => updateSetting("useImageNameByDefault", event.target.checked)}
                />
              </label>

              <label className="settings-option">
                <span>
                  <strong>Keep adding entries</strong>
                  <small>Reset the form for another upload after saving.</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.reopenAddAfterSave}
                  onChange={(event) => updateSetting("reopenAddAfterSave", event.target.checked)}
                />
              </label>
            </section>
          )}
        </div>
        <span className="username">{user?.username}</span>
        <button className="ghost-button" type="button" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
