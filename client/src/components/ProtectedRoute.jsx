import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const FullScreenSpinner = () => (
  <div className="screen-loader" aria-label="Loading">
    <div className="spinner" />
  </div>
);

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
