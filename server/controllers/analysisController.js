import Analysis from "../models/Analysis.js";

// Create SEO analysis
export const createAnalysis = async (req, res) => {
  try {
    const { url, keywordTrackingId } = req.body;

    // Validate URL
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    // Create initial analysis
    const analysis = await Analysis.create({
      userId: req.user._id,
      keywordTrackingId: keywordTrackingId || null,
      url,

      overallScore: 0,

      seo: 0,
      performance: 0,
      accessibility: 0,
      bestPractices: 0,

      metadata: {
        title: {
          value: "",
          length: 0,
          status: "missing",
        },

        description: {
          value: "",
          length: 0,
          status: "missing",
        },

        canonical: {
          value: "",
          status: "missing",
        },

        robots: {
          value: "",
          status: "missing",
        },

        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        twitterCard: "",
        viewport: "",
        charset: "",
      },

      headings: {
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
      },

      text: {
        wordCount: 0,
        keywords: [],
      },

      links: {
        total: 0,
        internal: 0,
        external: 0,
        broken: 0,
      },

      images: {
        total: 0,
        withAlt: 0,
        missingAlt: 0,
      },

      pageMetrics: {
        loadTime: 0,
        pageSize: 0,
        wordCount: 0,
        status: null,
      },

      issues: [],
      schemaIssues: [],
    });

    return res.status(201).json({
      success: true,
      message: "Analysis created successfully",
      analysis,
    });
  } catch (error) {
    console.error("Create analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create analysis",
    });
  }
};

// Get analysis by ID
export const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await Analysis.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Get analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get analysis",
    });
  }
};

// Get all analyses for logged-in user
export const getAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find({
      userId: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: analyses.length,
      analyses,
    });
  } catch (error) {
    console.error("Get analyses error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get analyses",
    });
  }
};

// Delete analysis
export const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await Analysis.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Analysis deleted successfully",
    });
  } catch (error) {
    console.error("Delete analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete analysis",
    });
  }
};