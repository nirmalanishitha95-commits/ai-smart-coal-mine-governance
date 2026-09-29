import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("coalguard_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("coalguard_token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      authService.getMe()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("coalguard_user", JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      const { access_token, user: loggedUser } = res.data;
      setToken(access_token);
      setUser(loggedUser);
      localStorage.setItem("coalguard_token", access_token);
      localStorage.setItem("coalguard_user", JSON.stringify(loggedUser));
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("coalguard_token");
    localStorage.removeItem("coalguard_user");
  };

  // Instant role switch for SIH presentation evaluation
  const switchDemoRole = async (targetRole) => {
    const credentials = {
      SUPER_ADMIN: { email: "admin@coalguard.gov.in", pass: "Admin@123" },
      GOVERNMENT_OFFICER: { email: "officer@coalguard.gov.in", pass: "Officer@123" },
      MINE_MANAGER: { email: "manager@coalguard.gov.in", pass: "Manager@123" },
      INSPECTOR: { email: "inspector@coalguard.gov.in", pass: "Inspector@123" }
    };
    const cred = credentials[targetRole];
    if (cred) {
      return await login(cred.email, cred.pass);
    }
  };

  const role = user?.role || "GUEST";
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        switchDemoRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
