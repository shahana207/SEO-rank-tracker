import mongoose from "mongoose";

// SEO issue schema
const issueSchema = new mongoose.Schema(
  {
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low", "info"],
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    recommendation: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// Main analysis schema
const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    keywordTrackingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KeywordTracking",
      default: null,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // SEO category scores
    seo: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    performance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    accessibility: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    bestPractices: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Metadata
    metadata: {
      title: {
        value: {
          type: String,
          default: "",
        },

        length: {
          type: Number,
          default: 0,
        },

        status: {
          type: String,
          enum: ["good", "warning", "error", "missing"],
          default: "missing",
        },
      },

      description: {
        value: {
          type: String,
          default: "",
        },

        length: {
          type: Number,
          default: 0,
        },

        status: {
          type: String,
          enum: ["good", "warning", "error", "missing"],
          default: "missing",
        },
      },

      canonical: {
        value: {
          type: String,
          default: "",
        },

        status: {
          type: String,
          enum: ["present", "missing", "invalid"],
          default: "missing",
        },
      },

      robots: {
        value: {
          type: String,
          default: "",
        },

        status: {
          type: String,
          enum: ["present", "missing"],
          default: "missing",
        },
      },

      ogTitle: {
        type: String,
        default: "",
      },

      ogDescription: {
        type: String,
        default: "",
      },

      ogImage: {
        type: String,
        default: "",
      },

      twitterCard: {
        type: String,
        default: "",
      },

      viewport: {
        type: String,
        default: "",
      },

      charset: {
        type: String,
        default: "",
      },
    },

    // Headings
    headings: {
      h1: {
        type: [String],
        default: [],
      },

      h2: {
        type: [String],
        default: [],
      },

      h3: {
        type: [String],
        default: [],
      },

      h4: {
        type: [String],
        default: [],
      },

      h5: {
        type: [String],
        default: [],
      },
    },

    // Text analysis
    text: {
      wordCount: {
        type: Number,
        default: 0,
      },

      keywords: [
        {
          keyword: {
            type: String,
            trim: true,
          },

          count: {
            type: Number,
            default: 0,
          },

          density: {
            type: Number,
            default: 0,
          },
        },
      ],
    },

    // Link analysis
    links: {
      total: {
        type: Number,
        default: 0,
      },

      internal: {
        type: Number,
        default: 0,
      },

      external: {
        type: Number,
        default: 0,
      },

      broken: {
        type: Number,
        default: 0,
      },
    },

    // Image analysis
    images: {
      total: {
        type: Number,
        default: 0,
      },

      withAlt: {
        type: Number,
        default: 0,
      },

      missingAlt: {
        type: Number,
        default: 0,
      },
    },

    // Page performance
    pageMetrics: {
      loadTime: {
        type: Number,
        default: 0,
      },

      pageSize: {
        type: Number,
        default: 0,
      },

      wordCount: {
        type: Number,
        default: 0,
      },

      status: {
        type: Number,
        default: null,
      },
    },

    // SEO issues
    issues: {
      type: [issueSchema],
      default: [],
    },

    // Structured data / Schema.org issues
    schemaIssues: {
      type: [issueSchema],
      default: [],
    },

    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  }
);

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;