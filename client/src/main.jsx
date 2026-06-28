import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import AnimePage from "./pages/AnimePage";
import GamesPage from "./pages/GamesPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MangaPage from "./pages/MangaPage";
import RegisterPage from "./pages/RegisterPage";
import "./styles.css";

const AppLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/manga" element={<MangaPage />} />
                <Route path="/anime" element={<AnimePage />} />
                <Route path="/games" element={<GamesPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
