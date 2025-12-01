import z from "zod/v4";

const attachmentSchema = z.object({
  url: z.url().trim().optional(),
  public_id: z.string().trim().optional(),
  text: z.string().trim().optional(),
});

export const messageIDSchema = z.object({
  chatID: z.string(),
});

export const sendMessageSchema = z.object({
  replyTo: z.string(),
  attachments: z.array(attachmentSchema).optional(),
  text: z.string().trim().optional(),
});

export const editMessageSchema = z.object({
  text: z.string().trim().min(1),
});

export type MessageForm = z.infer<typeof sendMessageSchema>;  
export type EditMessageForm = z.infer<typeof editMessageSchema>;

