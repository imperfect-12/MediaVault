import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMeRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "../api/auth";

const AuthContext = createContext(null);

const getErrorMessage = (error) => {
  if (!error?.response) {
    return "Could not reach the API server. Make sure the backend is running on port 5000.";
  }

  return error.response.data?.message || "The API returned an unexpected error.";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await getMeRequest();
        setUser(data.user);
      } catch (_error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    try {
      const data = await loginRequest(credentials);
      setUser(data.user);
      navigate("/");
      return data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const register = async (payload) => {
    try {
      const data = await registerRequest(payload);
      setUser(data.user);
      navigate("/");
      return data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
    navigate("/login");
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      register,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
};
