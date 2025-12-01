export const UserLoginMethodEnum = {
  GOOGLE: "GOOGLE",
  FACEBOOK: "FACEBOOK",
  CREDENTIALS: "CREDENTIALS",
} as const;

export const ChatTypesEnum = {
  DIRECT: "DIRECT",
  GROUP: "GROUP",
  CHANNEL: "CHANNEL",
} as const;

export const ChatRoleEnum = {
  MEMBER: "MEMBER",
  ADMIN: "ADMIN",
} as const;

export const ChatEventsEnum = {
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  LEAVE_CHAT: "LEAVE_CHAT",
  UPDATE_CHAT: "UPDATE_CHAT",
  JOIN_CHAT: "JOIN_CHAT",
  NEW_CHAT: "NEW_CHAT",
  TYPING: "TYPING",
  NOT_TYPING: "NOT_TYPING",
  MESSAGE_SEEN: "MESSAGE_SEEN",
  MESSAGE_DELIVERED: "MESSAGE_DELIVERED",
  MESSAGE_SENT: "MESSAGE_SENT",
  MESSAGE_EDITED: "MESSAGE_EDITED",
  MESSAGE_RECIEVED: "MESSAGE_RECEIVED",
  MESSAGE_DELETED: "MESSAGE_DELETED",
} as const;

export const AvailableLoginMethods = Object.values(UserLoginMethodEnum);
export const AvailableChatRoles = Object.values(ChatRoleEnum);
export const AvailableChatTypes = Object.values(ChatTypesEnum);

export type LoginMethods = (typeof AvailableLoginMethods)[number];
export type ChatRoles = (typeof AvailableChatRoles)[number];
export type ChatType = (typeof AvailableChatTypes)[number];
