import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const res = await api.get("/users/profile");
          if (res.data?.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (identifierOrEmail, password, role) => {
    try {
      const payload =
        typeof identifierOrEmail === "object"
          ? identifierOrEmail
          : {
              identifier: identifierOrEmail,
              email: identifierOrEmail,
              password,
              role: role || undefined,
            };

      const res = await api.post("/users/login", payload);
      if (res.data?.success) {
        const { token: jwtToken, user: userData } = res.data;
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("user", JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, message: res.data?.message || "Login failed" };
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to log in";
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post("/users/register", userData);
      return {
        success: true,
        message: res.data?.message || "Registration successful! Please log in.",
      };
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Registration failed";
      return { success: false, message };
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get("/users/profile");
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
