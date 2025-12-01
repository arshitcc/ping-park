import mongoose from "mongoose";
import { type IMessage } from "../types/model";

const messageSchema = new mongoose.Schema<IMessage>(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      default: "",
    },

    attachments: {
      type: [
        {
          asset: {
            type: {
              public_id: {
                type: String,
                required: true,
              },
              url: {
                type: String,
                required: true,
              },
              resource_type: {
                type: String,
                required: true,
              },
              format: {
                type: String,
                required: true,
              },
            },
            required: true,
          },
          text: {
            type: String,
          },
        },
      ],
      maxLength: 5,
      default: [],
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    reactions: {
      type: [
        {
          emoji: {
            type: String,
          },
          member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
      ],
      default: [],
    },

    editedAt: {
      type: Date,
    },

    readBy: {
      type: [
        {
          member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          readAt: {
            type: Date,
          },
        },
      ],
      default: [],
    },

    seenBy: {
      type: [
        {
          member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          seenAt: {
            type: Date,
          },
        },
      ],
      default: [],
    },

    deletedBy: {
      type: {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        deletedAt: {
          type: Date,
        },
      },
      default: null,
      required: false,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
