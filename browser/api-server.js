const express = require("express");
const browserManager = require("./browser-manager");
const cors = require("cors");

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// Create a new browser instance
app.post("/create", async (req, res) => {
  try {
    const result = await browserManager.createBrowserInstance();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Stop a browser instance
app.post("/stop", async (req, res) => {
  const { uniqueId } = req.body;
  if (!uniqueId) {
    return res.status(400).json({
      status: "error",
      message: "uniqueId is required",
    });
  }

  try {
    const result = await browserManager.stopBrowserInstance(uniqueId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Get browser instance status
app.get("/get/:uniqueId", async (req, res) => {
  const { uniqueId } = req.params;
  if (!uniqueId) {
    return res.status(400).json({
      status: "error",
      message: "uniqueId is required",
    });
  }

  try {
    const result = await browserManager.getBrowserInstance(uniqueId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 9221;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
