import Database from "better-sqlite3";
import { PDF_TOOLS } from "./src/constants/tools.ts";

const db = new Database("pdfmaster.db");

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
`);

db.exec("DELETE FROM tools");

const insert = db.prepare(`
  INSERT INTO tools (id, name, description, category, seoTitle, seoDescription, longDescription, features, useCases, steps)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const tool of PDF_TOOLS) {
  insert.run(
    tool.id,
    tool.name,
    tool.description,
    tool.category,
    tool.seoTitle,
    tool.seoDescription,
    tool.longDescription || "",
    JSON.stringify(tool.features || []),
    JSON.stringify(tool.useCases || []),
    JSON.stringify(tool.steps || [])
  );
}

console.log("Database seeded successfully!");
