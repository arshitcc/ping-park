import { Router } from "express";
import {
  getChatMessages,
  deleteMessage,
  editMessage,
  sendMessage,
} from "./controller";
import { isChatMember } from "../middleware";
import { validate } from "@/middlewares/validator.middleware";
import {
  editMessageSchema,
  messageIDSchema,
  sendMessageSchema,
} from "@/validators/messages";

const router = Router({ mergeParams: true });

// already authenicated users

router
  .route("/")
  .all(isChatMember)
  .get(getChatMessages)
  .post(validate(sendMessageSchema), sendMessage);

router
  .route("/:messageID")
  .all(validate(messageIDSchema), isChatMember)
  .patch(validate(editMessageSchema), editMessage)
  .delete(deleteMessage);

export default router;
