import { Document } from "mongoose";
import { ChatRoles, ChatType, LoginMethods } from "../constants";

export type CloudinaryStoredAsset = {
  url: string;
  public_id: string;
  resource_type: string;
  format: string;
};

export interface IUser extends Document {
  username: string;
  email: string;
  fullname: string;
  phone: string;
  password: string;
  avatar: CloudinaryStoredAsset;
  loginMethod: LoginMethods;

  isPhoneVerified: boolean;
  otpVerificationToken?: string;
  otpVerificationExpiry?: Date;

  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;

  refreshToken: string;
  forgotPasswordToken?: string;
  forgotPasswordExpiry?: Date;

  isPasswordCorrect(password: string): boolean;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateTemporaryToken(): {
    unHashedToken: string;
    hashedToken: string;
    tokenExpiry: Date;
  };
}

export interface IChat extends Document {
  type: ChatType;
  title: string;
  description: string;
  participants: { member: IUser; role: ChatRoles }[];
  chatHash: string;
  image: CloudinaryStoredAsset;
  settings: {
    participantsCanSendMessages: boolean;
    participantsCanAddParticipants: boolean;
    participantsCanRemoveParticipants: boolean;
  };
  community: ICommunity;
  createdBy: IUser | string;
  lastMessage: IMessage;
}

export interface ICommunity extends Document {
  name: string;
  description: string;
  announcementChannel: IChat;
  groups: IChat[];
  image: CloudinaryStoredAsset;
  createdBy: IUser;
}

export interface IMembership extends Document {
  chat: IChat;
  member: IUser;
  role: ChatRoles;
  unreadCount: number;
  lastReadAt: Date;
  joinedAt: Date;
  isBanned: Boolean;
}

export interface IMessage extends Document {
  chat: IChat;
  sender: IUser;
  text: string;
  attachments: { asset: CloudinaryStoredAsset; content?: string }[];
  replyTo: IMessage;
  reactions: { member: IUser; emoji: string }[];
  editedAt: Date;
  readBy: { member: IUser; readAt: Date }[];
  seenBy: { member: IUser; seenAt: Date }[];
  deletedBy: { member: IUser; deletedAt: Date };
}
