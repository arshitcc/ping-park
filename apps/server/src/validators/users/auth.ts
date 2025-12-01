import z from "zod/v4";

const loginSchema = z.object({
  body: z.object({
    user: z.string().toLowerCase(),
    password: z.string(),
  }),
});

const signupSchema = z.object({
  body: z.object({
    username: z.string().toLowerCase(),
    email: z.email().toLowerCase(),
    password: z.string(),
  }),
});

const otpSchema = z.object({
  body: z.object({
    otp: z.string().min(6).max(6),
  }),
});

const verificationTokenSchema = z.object({
  query: z.object({
    token: z
      .hex({ error: "Invalid Link. Start verification again" })
      .min(32)
      .max(32),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z
      .string({ error: "Old password is required" })
      .trim()
      .min(8, { error: "Password must be at least 8 characters" }),
    newPassword: z
      .string({ error: "New password is required" })
      .trim()
      .min(8, { error: "Password must be at least 8 characters" }),
  }),
});

const forgotPasswordRequestSchema = z.object({
  body: z.object({
    user: z
      .string({ error: "Username or email is required" })
      .min(3, { error: "Enter at least 3 characters" }),
  }),
});

const resetPasswordSchema = z.object({
  // new password after forget Password Request
  body: z.object({
    newPassword: z
      .string({ error: "Password is required" })
      .trim()
      .min(8, { error: "Password must be at least 8 characters" }),
  }),
});

export {
  loginSchema,
  signupSchema,
  otpSchema,
  verificationTokenSchema,
  changePasswordSchema,
  forgotPasswordRequestSchema,
  resetPasswordSchema,
};
