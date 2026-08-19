import mongoose from "mongoose";

// Rank history for a keyword
const rankEntrySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    position: {
      type: Number,
      default: null,
    },

    page: {
      type: Number,
      default: null,
    },

    title: {
      type: String,
      default: "",
    },

    snippet: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// Competitor information
const competitorSchema = new mongoose.Schema(
  {
    position: {
      type: Number,
      required: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    domain: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    snippet: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// Keyword tracking schema
const keywordTrackingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    keyword: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    domain: {
      type: String,
      required: true,
      trim: true,
    },

    currentPosition: {
      type: Number,
      default: null,
    },

    currentPage: {
      type: Number,
      default: null,
    },

    bestPosition: {
      type: Number,
      default: null,
    },

    positionChange: {
      type: Number,
      default: 0,
    },

    rankHistory: {
      type: [rankEntrySchema],
      default: [],
    },

    competitors: {
      type: [competitorSchema],
      default: [],
    },

    active: {
      type: Boolean,
      default: true,
    },

    lastChecked: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "checking", "complete", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same user from tracking the same keyword + domain twice
keywordTrackingSchema.index(
  {
    userId: 1,
    keyword: 1,
    domain: 1,
  },
  {
    unique: true,
  }
);

const KeywordTracking = mongoose.model(
  "KeywordTracking",
  keywordTrackingSchema
);

export default KeywordTracking;