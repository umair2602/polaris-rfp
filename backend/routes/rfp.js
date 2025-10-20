const express = require("express");
const multer = require("multer");
const RFP = require("../models/RFP");
const rfpAnalyzer = require("../services/rfpAnalyzer");
const SectionTitlesGenerator = require("../services/aiSectionsTitleGenerator");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Analyze RFP from URL
router.post("/analyze-url", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log("Analyzing RFP from URL:", url);

    // Analyze the RFP from URL
    const analysis = await rfpAnalyzer.analyzeRFP(url, url);

    // Create RFP document
    const rfp = new RFP({
      ...analysis,
      fileName: `URL_${Date.now()}`,
      fileSize: 0, // URLs don't have file size
      clientName: analysis.clientName || "Unknown Client",
    });

    await rfp.save();

    console.log("RFP from URL saved successfully:", rfp._id);
    res.status(201).json(rfp);
  } catch (error) {
    console.error("RFP URL analysis error:", error);
    res.status(500).json({
      error: "Failed to analyze RFP from URL",
      message: error.message,
    });
  }
});

// Upload and analyze RFP
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Analyzing RFP:", req.file.originalname);

    // Analyze the RFP
    const analysis = await rfpAnalyzer.analyzeRFP(
      req.file.buffer,
      req.file.originalname
    );
    console.log(analysis);
    // Create RFP document
    const rfp = new RFP({
      ...analysis,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      clientName: analysis.clientName || "Unknown Client",
    });

    await rfp.save();

    console.log("RFP saved successfully:", rfp._id);
    res.status(201).json(rfp);
  } catch (error) {
    console.error("RFP upload error:", error);
    res.status(500).json({
      error: "Failed to process RFP",
      message: error.message,
    });
  }
});

// Get all RFPs
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const rfps = await RFP.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-rawText -parsedSections");

    // Check disqualification status for each RFP
    const rfpsWithStatus = rfps.map(rfp => {
      rfp.checkDisqualification();
      return rfp;
    });

    // Save updated disqualification status (batch update)
    await Promise.all(rfpsWithStatus.map(rfp => rfp.save()));

    const total = await RFP.countDocuments();

    res.json({
      data: rfpsWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching RFPs:", error);
    res.status(500).json({ error: "Failed to fetch RFPs" });
  }
});

// Get single RFP
router.get("/:id", async (req, res) => {
  try {
    const rfp = await RFP.findById(req.params.id);

    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    // Check and update disqualification status
    rfp.checkDisqualification();
    await rfp.save();

    res.json(rfp);
  } catch (error) {
    console.error("Error fetching RFP:", error);
    res.status(500).json({ error: "Failed to fetch RFP" });
  }
});

// Generate AI-driven proposal section titles (titles only)
router.post("/:id/ai-section-titles", async (req, res) => {
  try {
    const rfp = await RFP.findById(req.params.id);
    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    // Return existing if present
    if (Array.isArray(rfp.sectionTitles) && rfp.sectionTitles.length > 0) {
      return res.json({ titles: rfp.sectionTitles });
    }

    // Otherwise, generate and persist
  const titles = await SectionTitlesGenerator.generateSectionTitles(rfp);
    rfp.sectionTitles = titles;
    await rfp.save();
    return res.json({ titles });
  } catch (error) {
    console.error("AI section titles error:", error);
    return res.status(500).json({ error: "Failed to generate section titles", message: error.message });
  }
});

// Update RFP
router.put("/:id", async (req, res) => {
  try {
    const allowedUpdates = [
      "title",
      "clientName",
      "submissionDeadline",
      "questionsDeadline",
      "bidMeetingDate",
      "bidRegistrationDate",
      "budgetRange",
      "keyRequirements",
      "deliverables",
      "specialRequirements",
      "timeline",
    ];

    const rfp = await RFP.findById(req.params.id);

    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    // Apply updates
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        rfp[key] = req.body[key];
      }
    });

    // Save (this will trigger pre-save hook to check disqualification)
    await rfp.save();

    res.json(rfp);
  } catch (error) {
    console.error("Error updating RFP:", error);
    res.status(500).json({ error: "Failed to update RFP" });
  }
});

// Get proposals for a specific RFP
router.get("/:id/proposals", async (req, res) => {
  try {
    const rfpId = req.params.id;
    const Proposal = require("../models/Proposal");

    const proposals = await Proposal.find({ rfpId })
      .sort({ createdAt: -1 })
      .select("-sections"); // Exclude large sections data for list view

    res.json({
      data: proposals
    });
  } catch (error) {
    console.error("Error fetching RFP proposals:", error);
    res.status(500).json({ error: "Failed to fetch RFP proposals" });
  }
});

// Delete RFP
router.delete("/:id", async (req, res) => {
  try {
    const rfp = await RFP.findByIdAndDelete(req.params.id);

    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    res.json({ message: "RFP deleted successfully" });
  } catch (error) {
    console.error("Error deleting RFP:", error);
    res.status(500).json({ error: "Failed to delete RFP" });
  }
});

// Search RFPs
router.get("/search/:query", async (req, res) => {
  try {
    const query = req.params.query;
    const searchRegex = new RegExp(query, "i");

    const rfps = await RFP.find({
      $or: [
        { title: searchRegex },
        { clientName: searchRegex },
        { projectType: searchRegex },
        { keyRequirements: { $in: [searchRegex] } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-rawText -parsedSections");

    res.json(rfps);
  } catch (error) {
    console.error("Error searching RFPs:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
