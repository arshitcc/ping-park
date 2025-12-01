import {
  ChangeCurrentPasswordFormData,
  ForgotPasswordFormData,
  LoginFormData,
  ResetPasswordFormData,
  SignupFormData,
  UpdateProfileFormData,
} from "../lib/schemas/auth";
import api from "./axios";

class AuthService {
  static async getCurrentUser() {
    return api.get("/users");
  }

  static async checkUsernameAvailable(data: { username: string }) {
    return api.post("/users/auth/check-username-available", data);
  }

  static async register(data: SignupFormData) {
    return api.post("/users/auth/register", data);
  }

  static async login(data: LoginFormData) {
    return api.post("/users/auth/login", data);
  }

  static async loginWithGoogle() {
    return api.get("/users/auth/google/customer");
  }

  static async logout() {
    return api.post("/users/auth/logout");
  }
  static async refreshAccessToken(refreshToken: string) {
    return api.post("/users/auth/refresh-tokens", { refreshToken });
  }
  static async verifyEmail(token: string) {
    return api.get(`/users/auth/verify?token=${token}`);
  }
  static async forgotPasswordRequest(data: ForgotPasswordFormData) {
    return api.post("/users/auth/forgot-password", data);
  }
  static async resetForgottenPassword(
    token: string,
    data: ResetPasswordFormData
  ) {
    return api.post(`/users/auth/reset-password?token=${token}`, data);
  }
  static async changeAvatar(formData: FormData) {
    return api.post("/users/profile/change-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  static async resendVerificationEmail() {
    return api.post("/users/profile/resend-verification-email");
  }
  static async changeCurrentPassword(data: ChangeCurrentPasswordFormData) {
    return api.post("/users/profile/change-current-password", {
      oldPassword: data.currentPassword,
      ...data,
    });
  }
  static async deleteUserAccount(userId: string) {
    return api.delete(`/users/${userId}`);
  }
  static async updateUserProfile(data: UpdateProfileFormData) {
    return api.post("/users/profile/update-profile", data);
  }
  static async deleteUserDocument(documentId: string) {
    return api.delete(`/users/profile/delete-document/${documentId}`);
  }
}

export default AuthService;
