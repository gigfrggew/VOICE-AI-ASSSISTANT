import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema({

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  businessName: {
    type: String,
    required: true,
    trim: true,
  },

  businessType: {
    type: String,
    required: true,
    trim: true,
  },

  phone: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  googleCalendar: {
    refreshToken: {
      type: String,
      default: null,
    },

    calendarId: {
      type: String,
      default: "primary",
    },

    connected: {
      type: Boolean,
      default: false,
    },
  },

}, { timestamps: true });

const Business = mongoose.model("Business", BusinessSchema);

export default Business;