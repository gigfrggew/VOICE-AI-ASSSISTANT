import mongoose from "mongoose";

const WorkflowSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    workflowName: {
      type: String,
      required: true,
      trim: true,
    },

    trigger: {
      type: String,
      default: "missed_call",
    },

    greeting: {
      type: String,
      required: true,
      trim: true,
    },

    fields: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        question: {
          type: String,
          required: true,
          trim: true,
        },

        required: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Conditional branches
    conditions: [
      {
        field: {
          type: String,
          required: true,
          trim: true,
        },

        operator: {
          type: String,
          required: true,
          enum: [
            "equals",
            "not_equals",
            "contains",
            "greater_than",
            "less_than",
          ],
        },

        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },

        action: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    closingMessage: {
      type: String,
      required: true,
      trim: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    followUpStatus: {
      type: String,
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Workflow = mongoose.model("Workflow", WorkflowSchema);

export default Workflow;