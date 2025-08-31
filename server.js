const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) console.error("DB Error:", err.message);
  else console.log("✅ Connected to SQLite database.");
});

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    course TEXT,
    contact TEXT,
    category TEXT,
    description TEXT,
    status TEXT,
    image TEXT,
    date TEXT
  )
`, (err) => {
  if (err) console.error("Table creation error:", err.message);
});

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET all items
app.get("/api/items", (req, res) => {
  db.all("SELECT * FROM items ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Make image URLs absolute for frontend
    const items = rows.map(row => ({
      ...row,
      image: row.image ? `${req.protocol}://${req.get('host')}${row.image}` : null
    }));

    res.json(items);
  });
});

// POST new item
app.post("/api/items", upload.single("image"), (req, res) => {
  const { name, course, contact, category, description, status } = req.body;

  if (!name || !course || !contact || !category || !description) {
    return res.status(400).json({ error: "All fields except image are required." });
  }

  const itemStatus = status || "Lost";
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const date = new Date().toLocaleDateString();

  db.run(
    `INSERT INTO items (name, course, contact, category, description, status, image, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, course, contact, category, description, itemStatus, image, date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        id: this.lastID,
        name,
        course,
        contact,
        category,
        description,
        status: itemStatus,
        image: image ? `${req.protocol}://${req.get('host')}${image}` : null,
        date
      });
    }
  );
});

// Serve index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 404 fallback
app.use((req, res) => res.status(404).send("404 Not Found"));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unexpected Error:", err);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
