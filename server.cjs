
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Temporary share records. They reset if the server restarts.
const shares = new Map();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.get("/", (req, res) => {
  res.json({ message: "CloudNest API is running" });
});

app.post("/api/files", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please select a file" });
  }

  res.status(201).json({
    message: "File uploaded successfully",
    file: {
      name: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
    },
  });
});

app.get("/api/files", (req, res) => {
  const files = fs.readdirSync(uploadDir).map((name) => {
    const stats = fs.statSync(path.join(uploadDir, name));
    return { name, size: stats.size };
  });

  res.json(files);
});

app.get("/api/files/:name", (req, res) => {
  const name = path.basename(req.params.name);
  const filePath = path.join(uploadDir, name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath);
});

app.delete("/api/files/:name", (req, res) => {
  const name = path.basename(req.params.name);
  const filePath = path.join(uploadDir, name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  fs.unlinkSync(filePath);

  // Invalidate all share links for this file.
  for (const [token, share] of shares) {
    if (share.name === name) shares.delete(token);
  }

  res.json({ message: "File deleted successfully" });
});

// Create a share link. Allowed expiry: 10 minutes, 1 hour, or 24 hours.
app.post("/api/shares", (req, res) => {
  const { name, expiresInMinutes } = req.body || {};
  const safeName = typeof name === "string" ? path.basename(name) : "";
  const allowedExpiries = [10, 60, 1440];
  const minutes = Number(expiresInMinutes);

  if (!safeName || !allowedExpiries.includes(minutes)) {
    return res.status(400).json({
      error: "Choose a file and an expiry of 10, 60, or 1440 minutes",
    });
  }

  if (!fs.existsSync(path.join(uploadDir, safeName))) {
    return res.status(404).json({ error: "File not found" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + minutes * 60 * 1000;

  shares.set(token, { name: safeName, expiresAt });

  res.status(201).json({
    message: "Share link created",
    token,
    url: `http://localhost:${PORT}/api/share/${token}`,
    expiresAt: new Date(expiresAt).toISOString(),
  });
});

// Download a file using its share token.
app.get("/api/share/:token", (req, res) => {
  const share = shares.get(req.params.token);

  if (!share) {
    return res.status(404).send("Share link is invalid or has expired.");
  }

  if (Date.now() >= share.expiresAt) {
    shares.delete(req.params.token);
    return res.status(410).send("This share link has expired.");
  }

  const filePath = path.join(uploadDir, share.name);

  if (!fs.existsSync(filePath)) {
    shares.delete(req.params.token);
    return res.status(404).send("The shared file no longer exists.");
  }

  res.download(filePath);
});

app.listen(PORT, () => {
  console.log(`CloudNest API running at http://localhost:${PORT}`);
});
