import mongoose from "mongoose";
import { ICommunity } from "../types/model";

const communitySchema = new mongoose.Schema<ICommunity>(
  {
    name: {
      type: String,
      required: true,
      minLength: 1,
      trim: true,
    },

    description: {
      type: String,
    },

    image: {
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
      required: false,
    },

    announcementChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },

    groups: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chat",
        },
      ],
      required: false,
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Community = mongoose.model("Community", communitySchema);
