import { Router } from "express";
import {
  addNewParticipantsToGroup,
  assignParticipantRole,
  createGroup,
  deleteGroup,
  getUserChats,
  leaveGroup,
  removeParticipantsFromGroup,
  searchUsers,
  startDirectChat,
  updateGroupProfile,
} from "./controller";
import { isChatAdmin, isChatMember } from "./middleware";
import messagesRouter from "./messages/route";
import { isLoggedIn } from "@/middlewares/auth.middleware";
import {
  addNewParticipantsSchema,
  assignParticipantRoleSchema,
  chatIDSchema,
  createGroupSchema,
  deleteGroupSchema,
  removeParticipantsSchema,
  searchUsersQuerySchema,
  startDirectChatSchema,
  updateGroupProfileSchema,
} from "@/validators/chats";
import { validate } from "@/middlewares/validator.middleware";

const router = Router();

router.use(isLoggedIn);

router.route("/").get(getUserChats);

router
  .route("/c")
  .get(validate(searchUsersQuerySchema), searchUsers)
  .post(validate(createGroupSchema), createGroup)
  .put(validate(startDirectChatSchema), startDirectChat);

router.use("/c/:chatID/m", validate(chatIDSchema), messagesRouter);

router
  .route("/c/:chatID")
  .all(validate(chatIDSchema), isChatAdmin)
  .put(validate(addNewParticipantsSchema), addNewParticipantsToGroup)
  .patch(validate(removeParticipantsSchema), removeParticipantsFromGroup)
  .delete(validate(deleteGroupSchema), deleteGroup);

router
  .route("/c/:chatID/settings")
  .all(validate(chatIDSchema), isChatAdmin)
  .patch(validate(assignParticipantRoleSchema), assignParticipantRole)
  .put(validate(updateGroupProfileSchema), updateGroupProfile);

router
  .route("/c/:chatID/leave")
  .all(validate(chatIDSchema), isChatMember)
  .delete(leaveGroup);

export default router;
