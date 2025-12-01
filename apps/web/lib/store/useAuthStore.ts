import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AxiosError, AxiosResponse } from "axios";
import { ApiResponse, User } from "../../types";
import {
  ChangeCurrentPasswordFormData,
  ForgotPasswordFormData,
  LoginFormData,
  ResetPasswordFormData,
  SignupFormData,
  UpdateProfileFormData,
} from "../schemas/auth";
import AuthService from "../../api/auth.api";

type AuthStore = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (
    user: User | null,
    isAuthenticated?: boolean,
    loading?: boolean,
    error?: string | null
  ) => void;

  getCurrentUser: () => Promise<void>;
  register: (data: SignupFormData) => Promise<void>;
  login: (data: LoginFormData) => Promise<void>;
  logout: () => Promise<void>;
  checkUsernameAvailable: (data: {
    username: string;
  }) => Promise<Partial<AxiosResponse["data"]>>;
  verifyEmail: (token: string) => Promise<boolean>;
  forgotPasswordRequest: (data: ForgotPasswordFormData) => Promise<void>;
  resetForgottenPassword: (
    token: string,
    data: ResetPasswordFormData
  ) => Promise<void>;
  changeAvatar: (file: File, old_avatar_public_id?: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  changeCurrentPassword: (data: ChangeCurrentPasswordFormData) => Promise<void>;
  updateUserProfile: (data: UpdateProfileFormData) => Promise<ApiResponse>;
};

export const initialAuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialAuthState,
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setUser: (user, isAuthenticated, loading, error) =>
        set({ user, isAuthenticated, loading, error }),

      getCurrentUser: async () => {
        set({ loading: true, error: null });
        try {
          const response = await AuthService.getCurrentUser();
          set({ user: response.data.data, isAuthenticated: true });
        } catch (error: AxiosError | any) {
          set({
            user: null,
            isAuthenticated: false,
            error: error.response?.data?.message || "Failed to get profile",
          });
        } finally {
          set({ loading: false });
        }
      },

      checkUsernameAvailable: async (data: { username: string }) => {
        set({ loading: true, error: null });
        try {
          const response = await AuthService.checkUsernameAvailable(data);
          return response.data;
        } catch (error: AxiosError | any) {
          if (typeof error.response.data === "object") {
            return error.response.data;
          }
          throw new Error("Something went wrong. Please try again later");
        }
      },

      register: async (data) => {
        set({ loading: true, error: null });
        try {
          await AuthService.register(data);
          set({ error: null });
        } catch (error: AxiosError | any) {
          set({
            error: error.response?.data?.message || "Registration failed",
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      login: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await AuthService.login(data);
          if (res.data.success) {
            set({ user: res.data.data.user, isAuthenticated: true });
            localStorage.setItem("x-key", res.data.data.key);
            localStorage.setItem("x-auth-key", res.data.data.refreshKey);
          }
        } catch (error: AxiosError | any) {
          set({ error: error.response?.data?.message || "Login failed" });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      logout: async () => {
        set({ loading: true, error: null });
        try {
          await AuthService.logout();
          localStorage.clear();
          window.localStorage.clear();
          localStorage.removeItem("x-key");
          localStorage.removeItem("x-auth-key");
          set({ user: null, isAuthenticated: false });
        } catch (error: AxiosError | any) {
          localStorage.removeItem("x-key");
          localStorage.removeItem("x-auth-key");
          set({ error: error.response?.data?.message || "Logout failed" });
        } finally {
          set({ loading: false });
        }
      },

      verifyEmail: async (token) => {
        set({ loading: true, error: null });
        try {
          await AuthService.verifyEmail(token);
          await get().getCurrentUser();
          return true;
        } catch (error: AxiosError | any) {
          set({
            error: error.response?.data?.message || "Verify email failed",
          });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      forgotPasswordRequest: async (data) => {
        set({ loading: true, error: null });
        try {
          await AuthService.forgotPasswordRequest(data);
        } catch (error: AxiosError | any) {
          set({
            error: error.response?.data?.message || "Forgot password failed",
          });
        } finally {
          set({ loading: false });
        }
      },

      resetForgottenPassword: async (token, data) => {
        set({ loading: true, error: null });
        try {
          await AuthService.resetForgottenPassword(token, data);
        } catch (error: AxiosError | any) {
          set({
            error: error.response?.data?.message || "Reset password failed",
          });
        } finally {
          set({ loading: false });
        }
      },

      changeAvatar: async (file, old_avatar_public_id) => {
        set({ loading: true, error: null });
        try {
          const formData = new FormData();
          formData.append("avatar", file);
          if (old_avatar_public_id)
            formData.append("old_avatar_public_id", old_avatar_public_id);

          const response = await AuthService.changeAvatar(formData);
          set({ user: response.data.data, loading: false, error: null });
        } catch (error: AxiosError | any) {
          set({
            error: error.response?.data?.message || "Change avatar failed",
          });
        } finally {
          set({ loading: false });
        }
      },

      resendEmailVerification: async () => {
        set({ loading: true, error: null });
        try {
          await AuthService.resendVerificationEmail();
        } catch (error: AxiosError | any) {
          set({
            error: error.response?.data?.message || "Resend email failed",
          });
        } finally {
          set({ loading: false });
        }
      },

      changeCurrentPassword: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await AuthService.changeCurrentPassword(data);
        } catch (error: AxiosError | any) {
          set({
            error: error.response?.data?.message || "Change password failed",
          });
        } finally {
          set({ loading: false });
        }
      },

      updateUserProfile: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await AuthService.updateUserProfile(data);
          // if (res.data.data.role === "CUSTOMER") set({ users: [] });
          set({ user: res.data.data });
          return res.data;
        } catch (error: AxiosError | any) {
          const errData = error?.response?.data;
          return (
            errData ?? {
              success: false,
              message: error?.message ?? "Network Error",
            }
          );
        } finally {
          set({ loading: false });
        }
      },
    }),

    { name: "x-auth" }
  )
);
