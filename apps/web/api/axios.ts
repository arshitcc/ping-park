import axios from "axios";
import { initialAuthState } from "../lib/store/useAuthStore";
import AuthService from "./auth.api";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1",
  withCredentials: true,
  timeout: 120000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("x-key");
    if (token?.trim()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error?.config?.url?.includes("refresh-tokens")) {
      localStorage.clear();
      localStorage.setItem("x-auth", JSON.stringify(initialAuthState));
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = localStorage.getItem("x-auth-key");
        if (!token) {
          throw new Error("Session Expired. Please Login Again");
        }
        const res = await AuthService.refreshAccessToken(token);
        if (res.data.success) {
          localStorage.setItem("x-key", res.data.data.key);
          localStorage.setItem("x-auth-key", res.data.data.refreshKey);
        }
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("x-key");
        localStorage.removeItem("x-auth-key");
        localStorage.setItem("x-auth", JSON.stringify(initialAuthState));
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
