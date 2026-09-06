import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, register as apiRegister } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Deliberately NOT restoring a saved session on load — every fresh visit
  // (or page refresh) always starts at the login page, no "stay signed in."
  // We still clear any leftover token so nothing stale lingers in storage.
  useEffect(() => {
    localStorage.removeItem("sd_token");
    localStorage.removeItem("sd_user");
  }, []);

  async function login(email, password) {
    const { token, user } = await apiLogin(email, password);
    localStorage.setItem("sd_token", token);
    localStorage.setItem("sd_user", JSON.stringify(user));
    setUser(user);
  }

  async function register(name, email, password) {
    const { token, user } = await apiRegister(name, email, password);
    localStorage.setItem("sd_token", token);
    localStorage.setItem("sd_user", JSON.stringify(user));
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("sd_token");
    localStorage.removeItem("sd_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}