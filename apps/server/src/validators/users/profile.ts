import z from "zod/v4";

const imageSchema = z.object({
  body: z.object({
    url: z.url({ protocol: /^https$/, hostname: /^res.cloudinary.com$/ }),
    public_id: z.string(),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    fullname: z.string().optional(),
    email: z.email().optional(),
    phone: z
      .string()
      .regex(/^(\+91[-\s]?)?[6-9]\d{9$/, {
        error: "Please enter a valid Indian phone number.",
      })
      .min(10)
      .max(14)
      .optional(),
  }),
});

export { imageSchema, updateProfileSchema };
