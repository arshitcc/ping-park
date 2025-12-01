import { Router } from "express";
import usersRouter from "./users/route";
import chatsRouter from "./chats/route";
import messagesRouter from "./chats/messages/route";

const router = Router();

router.use("/users", usersRouter);
router.use("/chats", chatsRouter);

export default router;
