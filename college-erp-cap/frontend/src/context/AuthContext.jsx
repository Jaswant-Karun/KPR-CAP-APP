import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginService, signup as signupService } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await loginService(credentials);

      setUser(data?.user || null);
      setToken(data?.token || null);

      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

      if (data?.user?.role === "student") {
        navigate("/student/dashboard");
      } else if (data?.user?.role === "faculty") {
        navigate("/faculty/dashboard");
      } else if (data?.user?.role === "admin") {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Invalid Login");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload) => {
    setLoading(true);
    try {
      const data = await signupService(payload);

      setUser(data?.user || null);
      setToken(data?.token || null);

      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

      if (data?.user?.role === "student") {
        navigate("/student/dashboard");
      } else if (data?.user?.role === "faculty") {
        navigate("/faculty/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
