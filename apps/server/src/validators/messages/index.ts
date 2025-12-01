import z from "zod/v4";
import { isValidObjectId } from "mongoose";

const mongoId = z
  .string()
  .refine((v) => isValidObjectId(v), { message: "Invalid Entity ID" });

const imageSchema = z
  .object({
    public_id: z.string().optional(),
    url: z.url().optional(),
  })
  .refine((img) => Boolean(img.public_id || img.url), {
    message: "image must include either public_id or url",
  });

const attachmentSchema = z.object({
  url: z.url().trim().optional(),
  public_id: z.string().trim().optional(),
  text: z.string().trim().optional(),
});

export const messageIDSchema = z.object({
  params: z.object({ chatID: mongoId }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    replyTo: mongoId,
    attachments: z.array(attachmentSchema).optional(),
    text: z.string().trim().optional(),
  }),
});

export const editMessageSchema = z.object({
  body: {
    text: z.string().trim().min(1),
  },
});
