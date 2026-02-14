import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import Add from "./pages/Add/Add";
import Update from "./pages/Update/Update";

// Simple Protected Route
function PrivateRoute({ element }) {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" replace />;
}

export default function App() {
  const [token, setToken] = React.useState(() =>
    localStorage.getItem("token")
  );

  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute element={<Home onLogout={handleLogout} />} />
          }
        />

        <Route
          path="/add"
          element={<PrivateRoute element={<Add />} />}
        />

        <Route
          path="/update/:id"
          element={<PrivateRoute element={<Update />} />}
        />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={token ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
