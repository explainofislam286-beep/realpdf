import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("pdfmaster.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    seoTitle TEXT,
    seoDescription TEXT,
    longDescription TEXT,
    features TEXT,
    useCases TEXT,
    steps TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL
  );
`);

// Seed initial data if empty
const toolsCount = db.prepare("SELECT COUNT(*) as count FROM tools").get() as { count: number };
if (toolsCount.count === 0) {
  // We'll seed this in a separate step to keep server.ts clean
}

const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", "admin123");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, token: "mock-jwt-token" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.get("/api/tools", (req, res) => {
    const tools = db.prepare("SELECT * FROM tools").all();
    res.json(tools.map((t: any) => ({
      ...t,
      features: JSON.parse(t.features || "[]"),
      useCases: JSON.parse(t.useCases || "[]"),
      steps: JSON.parse(t.steps || "[]")
    })));
  });

  app.get("/api/tools/:id", (req, res) => {
    const tool = db.prepare("SELECT * FROM tools WHERE id = ?").get(req.params.id);
    if (tool) {
      res.json({
        ...tool,
        features: JSON.parse(tool.features || "[]"),
        useCases: JSON.parse(tool.useCases || "[]"),
        steps: JSON.parse(tool.steps || "[]")
      });
    } else {
      res.status(404).json({ message: "Tool not found" });
    }
  });

  app.put("/api/tools/:id", (req, res) => {
    const { name, description, category, seoTitle, seoDescription, longDescription, features, useCases, steps } = req.body;
    db.prepare(`
      UPDATE tools SET 
        name = ?, description = ?, category = ?, 
        seoTitle = ?, seoDescription = ?, longDescription = ?, 
        features = ?, useCases = ?, steps = ?
      WHERE id = ?
    `).run(
      name, description, category, 
      seoTitle, seoDescription, longDescription, 
      JSON.stringify(features), JSON.stringify(useCases), JSON.stringify(steps),
      req.params.id
    );
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
