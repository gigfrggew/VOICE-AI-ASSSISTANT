import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );

  function login(token) {
    localStorage.setItem("accessToken", token);
    setAccessToken(token);
  }

  function logout() {
    localStorage.removeItem("accessToken");
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}