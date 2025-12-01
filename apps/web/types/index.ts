import { ChatRoles, ChatType, LoginMethods } from "../constants";

export type CloudinaryStoredAsset = {
  url: string;
  public_id: string;
  resource_type: string;
  format: string;
};

export interface User {
  _id: string;
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

  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  _id: string;
  type: ChatType;
  title: string;
  description: string;
  participants: { member: Partial<User>; role: ChatRoles }[];
  chatHash: string;
  image: CloudinaryStoredAsset;
  settings: {
    participantsCanSendMessages: boolean;
    participantsCanAddParticipants: boolean;
    participantsCanRemoveParticipants: boolean;
  };
  community: Community;
  createdBy: User | string;
  lastMessage: Message;

  createdAt: Date;
  updatedAt: Date;
}

export interface Community {
  _id: string;
  name: string;
  description: string;
  announcementChannel: Chat;
  groups: Chat[];
  image: CloudinaryStoredAsset;
  createdBy: User;

  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  _id: string;
  chat: Chat;
  member: User;
  role: ChatRoles;
  unreadCount: number;
  lastReadAt: Date;
  joinedAt: Date;
  isBanned: Boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  chat: Chat;
  sender: User;
  text: string;
  attachments: { asset: CloudinaryStoredAsset; content?: string }[];
  replyTo: Message;
  reactions: { member: User; emoji: string }[];
  editedAt: Date;
  readBy: { member: User; readAt: Date }[];
  seenBy: { member: User; seenAt: Date }[];
  deletedBy: { member: User; deletedAt: Date };

  createdAt: Date;
  updatedAt: Date;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string = "Something went wrong",
    public data: object | null = null,
    public success: boolean = false,
    public errors: any[] = [],
    public stack: string = ""
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype); // If your tsconfig.json has target < ES2015, now natively it does same thing as TS emits code so that subclasses of built-ins don’t automatically get a correct prototype link
    this.statusCode = statusCode;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ApiResponse {
  constructor(
    public statusCode: number,
    public success: boolean,
    public message: string = "Success",
    public data: object | null = null
  ) {
    this.success = statusCode < 400;
  }
}
