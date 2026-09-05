import { createContext, useContext, useState } from "react";
import API_URL from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );

  const [role, setRole] = useState(
    localStorage.getItem("role")
  );

  function login(token, userRole) {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("role", userRole);

    setAccessToken(token);
    setRole(userRole);
  }

  async function logout() {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");

      setAccessToken(null);
      setRole(null);

      window.location.href = "/login";
    }
  }

  return (
    <AuthContext.Provider value={{ accessToken, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}