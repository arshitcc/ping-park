import { Request } from "express";
import { IChat, IUser } from "./model";

export interface UserRequest extends Request {
  user: IUser;
  chat: IChat;
}
