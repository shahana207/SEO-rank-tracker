import KeywordTracking from "../models/keywordTracking.js";
import { keywordTracking } from "../services/keywordTrackingService.js";

// Add a keyword to track
export const addKeyword = async (req, res) => {
  try {
    const { keyword, url } = req.body;

    // Validate required fields
    if (!keyword || !url) {
      return res.status(400).json({
        success: false,
        message: "Keyword and URL are required",
      });
    }

    // Get logged-in user from auth middleware
    const userId = req.userId;

    // Check if keyword already exists for this user
    const existingKeyword = await KeywordTracking.findOne({
      userId,
      keyword: keyword.toLowerCase().trim(),
      url: url.trim(),
    });

    if (existingKeyword) {
      return res.status(400).json({
        success: false,
        message: "This keyword is already being tracked",
      });
    }

    // Extract domain from URL
    let domain;

    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid URL",
      });
    }

    // Create keyword tracking record
    const keywordTracking = await KeywordTracking.create({
      userId,
      keyword: keyword.toLowerCase().trim(),
      url: url.trim(),
      domain,
      currentPosition: null,
      currentPage: null,
      bestPosition: null,
      positionChange: 0,
      rankHistory: [],
      competitors: [],
      active: true,
      lastChecked: null,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Keyword added successfully",
      keyword: keywordTracking,
    });
  } catch (error) {
    console.error("Add keyword error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add keyword",
    });
  }
};


// Get all tracked keywords for user
export const getKeywords = async (req, res) => {
  try {
    const userId = req.userId;

    const keywords = await KeywordTracking.find({
      userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: keywords.length,
      keywords,
    });
  } catch (error) {
    console.error("Get keywords error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get tracked keywords",
    });
  }
};

// Get single keyword with full history
export const getKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const keyword = await KeywordTracking.findOne({
      _id: id,
      userId,
    });

    if (!keyword) {
      return res.status(404).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }

    return res.status(200).json({
      success: true,
      keyword,
    });
  } catch (error) {
    console.error("Get keyword error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get keyword",
    });
  }
};


// Manually refresh a keyword ranking
export const refreshKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const keyword = await KeywordTracking.findOne({
      _id: id,
      userId,
    });

    if (!keyword) {
      return res.status(404).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }

    // Mark keyword as checking
    keyword.status = "checking";
    await keyword.save();

    /*
      Ranking API will be connected here later.

      For now we are only preparing the keyword
      for the ranking-checking process.
    */

    return res.status(200).json({
      success: true,
      message: "Keyword refresh started",
      keyword,
    });
  } catch (error) {
    console.error("Refresh keyword error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh keyword",
    });
  }
};

// Delete keyword tracking

export const deleteKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const keyword = await KeywordTracking.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!keyword) {
      return res.status(404).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Keyword tracking deleted successfully",
    });
  } catch (error) {
    console.error("Delete keyword error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete keyword",
    });
  }
};

// Toggle tracking active/inactive
export const toggleTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const keyword = await KeywordTracking.findOne({
      _id: id,
      userId,
    });

    if (!keyword) {
      return res.status(404).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }

    // Toggle active state
    keyword.active = !keyword.active;

    await keyword.save();

    return res.status(200).json({
      success: true,
      message: keyword.active
        ? "Keyword tracking activated"
        : "Keyword tracking deactivated",
      keyword,
    });
  } catch (error) {
    console.error("Toggle tracking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to toggle keyword tracking",
    });
  }
};