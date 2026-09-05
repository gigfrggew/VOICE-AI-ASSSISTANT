import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },

    callerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    callerName: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      default: "in_progress",
    },

    intent: {
      type: String,
      trim: true,
    },

    capturedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    summary: {
      type: String,
      trim: true,
    },

    action: {
      type: String,
      trim: true,
    },

    urgency: {
      type: String,
      default: "normal",
    },

    followUpStatus: {
      type: String,
      default: "pending",
    },

    transcript: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },

        message: {
          type: String,
          required: true,
        },

        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model("Conversation",ConversationSchema);

export default Conversation;