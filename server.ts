import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("firs.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS fir_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fir_no TEXT UNIQUE,
    data TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed admin user if not exists
const seedAdmin = db.prepare("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)");
seedAdmin.run("admin", "admin123", "admin");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    
    if (user) {
      res.json({ 
        id: user.id, 
        username: user.username, 
        role: user.role 
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // API Routes
  app.get("/api/firs", (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const rows = db.prepare("SELECT * FROM fir_records WHERE user_id = ? ORDER BY created_at DESC").all(userId);
      res.json(rows.map((row: any) => ({
        ...row,
        data: JSON.parse(row.data)
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FIRs" });
    }
  });

  app.post("/api/firs", (req, res) => {
    const { firNo, data, userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const jsonData = JSON.stringify(data);
      
      // Check if exact same data already exists for this FIR number
      const existing = db.prepare("SELECT data FROM fir_records WHERE fir_no = ? AND user_id = ?").get(firNo, userId) as any;
      
      if (existing && existing.data === jsonData) {
        return res.json({ success: true, message: "No changes detected, record is already up to date." });
      }

      // Duplicate check based on name and phone number (as requested by user)
      if (data.complainantName && data.complainantMobile) {
        // We use json_extract to query inside the JSON data column
        const duplicate = db.prepare(`
          SELECT fir_no FROM fir_records 
          WHERE user_id = ? 
          AND json_extract(data, '$.complainantName') = ? 
          AND json_extract(data, '$.complainantMobile') = ?
          AND fir_no != ?
        `).get(userId, data.complainantName, data.complainantMobile, firNo) as any;

        if (duplicate) {
          return res.status(409).json({ 
            error: "You have already complained with this name and phone number (FIR #" + duplicate.fir_no + ")" 
          });
        }
      }

      const stmt = db.prepare("INSERT OR REPLACE INTO fir_records (fir_no, data, user_id) VALUES (?, ?, ?)");
      stmt.run(firNo, jsonData, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to save FIR" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
