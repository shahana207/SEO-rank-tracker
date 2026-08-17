import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios, { type AxiosInstance } from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  analysisCount?: number;
}

interface AuthResponse {
  success: boolean;
  message?: string;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  api: AxiosInstance;

  login: (
    email: string,
    password: string
  ) => Promise<AuthResponse>;

  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthResponse>;

  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: "http://localhost:5000/api",
  });

  // Add token to every API request
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Get user error:", error);

        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  // Login
  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        const newToken = response.data.token;

        localStorage.setItem("token", newToken);

        setToken(newToken);
        setUser(response.data.user);
      }

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Login error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message || "Login failed",
      };
    }
  };

  // Register
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      if (response.data.success) {
        const newToken = response.data.token;

        localStorage.setItem("token", newToken);

        setToken(newToken);
        setUser(response.data.user);
      }

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Register error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message || "Registration failed",
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value: AppContextType = {
    user,
    token,
    loading,
    api,
    login,
    register,
    logout,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook
export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext must be used inside AppProvider"
    );
  }

  return context;
}