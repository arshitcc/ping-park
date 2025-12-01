import z from "zod/v4";

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
  chatID: z.string(),
});

export const searchUsersQuerySchema = z.object({
  s: z.string().min(1, "username is required"),
});

export const createGroupSchema = z.object({
  participants: z
    .array(z.string())
    .min(1, "participants must contain at least one user"),
  title: z.string().min(1, "title is required"),
  description: z.string().optional(),
  image: imageSchema.optional(),
});

export const startDirectChatSchema = z.object({
  receiverID: z.string(),
  attachments: z.array(attachmentSchema).optional(),
  text: z.string().optional(),
});

export const addNewParticipantsSchema = z.object({
  participants: z
    .array(z.string())
    .min(1, "participants must contain at least one user"),
});

export const removeParticipantsSchema = z.object({
  participants: z.array(z.string()).min(1, "no participants found to remove"),
});

export const deleteGroupSchema = z.object({
  chatID: z.string(),
});

export const assignParticipantRoleSchema = z.object({
  role: z.enum(["admin"], {
    error: "Select a valid role",
  }),
});

export const updateGroupProfileSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: imageSchema.optional(),
});

export type CreateGroupForm = z.infer<typeof createGroupSchema>;
export type DirectChatForm = z.infer<typeof startDirectChatSchema>;
export type AddParticipantsForm = z.infer<typeof addNewParticipantsSchema>;
export type RemoveParticipantsForm = z.infer<typeof removeParticipantsSchema>;
export type DeleteGroupForm = z.infer<typeof deleteGroupSchema>;
export type AssignParticipantRoleForm = z.infer<typeof assignParticipantRoleSchema>;
export type UpdateGroupProfileForm = z.infer<typeof updateGroupProfileSchema>;
