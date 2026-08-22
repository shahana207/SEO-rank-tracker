import KeywordTracking from "../models/keywordTracking.js";
import { keywordTracking } from "../services/keywordTrackingService.js";

// Add a keyword to track
export const addKeyword = async (req, res) => {
  try {
    const { keyword, url } = req.body;
    const userId = req.userId;

    if (!keyword || !url) {
      return res.status(400).json({
        success: false,
        message: "Keyword and URL are required",
      });
    }

    let domain;

    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid URL",
      });
    }

    const cleanKeyword = keyword.trim().toLowerCase();
    const cleanUrl = url.trim();

    const existingKeyword = await KeywordTracking.findOne({
      userId,
      keyword: cleanKeyword,
      domain,
    });

    if (existingKeyword) {
      return res.status(400).json({
        success: false,
        message: "This keyword is already being tracked",
      });
    }

    const tracking = await KeywordTracking.create({
      userId,
      keyword: cleanKeyword,
      url: cleanUrl,
      domain,
      status: "checking",
    });

    // Start ranking check
    keywordTracking(tracking).catch((error) => {
      console.error("Ranking check error:", error.message);
    });

    return res.status(201).json({
      success: true,
      message: "Keyword added successfully",
      tracking,
    });
  } catch (error) {
    console.error("Add keyword error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to add keyword",
    });
  }
};

// Get all tracked keywords
export const getKeywords = async (req, res) => {
  try {
    const keywords = await KeywordTracking.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: keywords.length,
      keywords,
    });
  } catch (error) {
    console.error("Get keywords error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to get tracked keywords",
    });
  }
};

// Get one keyword
export const getKeyword = async (req, res) => {
  try {
    const keyword = await KeywordTracking.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!keyword) {
      return res.status(404).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }

    return res.status(200).json({
      success: true,
      tracking: keyword,
    });
  } catch (error) {
    console.error("Get keyword error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to get keyword",
    });
  }
};

// Refresh keyword ranking
export const refreshKeyword = async (req, res) => {
  try {
    const tracking = await KeywordTracking.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }

    if (tracking.status === "checking") {
      return res.status(400).json({
        success: false,
        message: "Keyword is already being checked",
      });
    }

    tracking.status = "checking";
    await tracking.save();

    keywordTracking(tracking).catch((error) => {
      console.error("Refresh ranking error:", error.message);
    });

    return res.status(200).json({
      success: true,
      message: "Keyword refresh started",
      tracking,
    });
  } catch (error) {
    console.error("Refresh keyword error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh keyword",
    });
  }
};

// Delete keyword
export const deleteKeyword = async (req, res) => {
  try {
    const tracking = await KeywordTracking.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!tracking) {
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
    console.error("Delete keyword error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete keyword",
    });
  }
};

// Toggle tracking
export const toggleTracking = async (req, res) => {
  try {
    const tracking = await KeywordTracking.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Keyword tracking not found",
      });
    }

    tracking.active = !tracking.active;

    await tracking.save();

    return res.status(200).json({
      success: true,
      message: tracking.active
        ? "Keyword tracking activated"
        : "Keyword tracking paused",
      tracking,
    });
  } catch (error) {
    console.error("Toggle tracking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to toggle keyword tracking",
    });
  }
};