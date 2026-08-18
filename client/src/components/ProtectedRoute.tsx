import { Navigate, Outlet } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function ProtectedRoute() {
  const { token, loading } = useAppContext();

  // Wait until we finish checking the stored token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // User is not authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated
  return <Outlet />;
}