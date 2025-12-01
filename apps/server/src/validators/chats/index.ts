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
  url: z.url().optional(),
  public_id: z.string().optional(),
  text: z.string().optional(),
});

export const chatIDSchema = z.object({
  params: z.object({ chatID: mongoId }),
});

export const searchUsersQuerySchema = z.object({
  query: z.object({
    s: z.string().min(1, "search field is rsequired"),
  }),
});

export const createGroupSchema = z.object({
  body: z.object({
    participants: z
      .array(mongoId)
      .min(1, "participants must contain at least one user"),
    title: z.string().min(1, "title is required"),
    description: z.string().optional(),
    image: imageSchema.optional(),
  }),
});

export const startDirectChatSchema = z.object({
  body: z.object({
    receiverID: mongoId,
    attachments: z.array(attachmentSchema).optional(),
    text: z.string().optional(),
  }),
});

export const addNewParticipantsSchema = z.object({
  body: z.object({
    participants: z
      .array(mongoId)
      .min(1, "participants must contain at least one user"),
  }),
});

export const removeParticipantsSchema = z.object({
  body: z.object({
    participants: z.array(mongoId).min(1, "no participants found to remove"),
  }),
});

export const deleteGroupSchema = z.object({
  params: z.object({
    chatID: mongoId,
  }),
});

export const assignParticipantRoleSchema = z.object({
  body: z.object({
    role: z.enum(["admin"], {
      error: "Select a valid role",
    }),
  }),
});

export const updateGroupProfileSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    image: imageSchema.optional(),
  }),
});
