import { Router } from "express";
import { validate } from "@/middlewares/validator.middleware";
import {
  changePasswordSchema,
  forgotPasswordRequestSchema,
  loginSchema,
  otpSchema,
  resetPasswordSchema,
  signupSchema,
  verificationTokenSchema,
} from "@/validators/users/auth";
import {
  chechUsernameAvailable,
  userRegister,
  userLogin,
  userLogout,
  refreshSession,
  verifyEmail,
  verifyOTP,
  resendVerificationEmail,
  resendVerificationOTP,
  resetForgottenPassword,
  forgotPasswordRequest,
  changeCurrentPassword,
} from "./controller";
import { isLoggedIn } from "@/middlewares/auth.middleware";

const router = Router();

router.route("/register").post(validate(signupSchema), userRegister);
router.route("/login").post(validate(loginSchema), userLogin);
router.route("/logout").post(isLoggedIn, userLogout);
router.route("/refresh-session").post(refreshSession);
router.route("/check-username-available").post(chechUsernameAvailable)
router
  .route("/verify-email")
  .post(validate(verificationTokenSchema), verifyEmail);

router.route("/verify-otp").post(validate(otpSchema), verifyOTP);

router.route("/resend-email").post(isLoggedIn, resendVerificationEmail);

router.route("/resend-otp").post(isLoggedIn, resendVerificationOTP);

router
  .route("/forgot-password-request")
  .post(validate(forgotPasswordRequestSchema), forgotPasswordRequest);

router
  .route("/reset-password")
  .post(validate(resetPasswordSchema), resetForgottenPassword);

router
  .route("/change-password")
  .post(validate(changePasswordSchema), changeCurrentPassword);

export default router;
