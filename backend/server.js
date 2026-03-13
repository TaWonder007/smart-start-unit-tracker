const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let db;

async function initializeDatabase() {
  db = await open({
    filename: path.join(__dirname, "smartstart.db"),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property TEXT NOT NULL,
      unit TEXT NOT NULL,
      cleaningStatus TEXT NOT NULL,
      invoiceStatus TEXT NOT NULL,
      paymentStatus TEXT NOT NULL,
      invoiceAmount REAL DEFAULT 0
    )
  `);

  const existing = await db.get("SELECT COUNT(*) as count FROM units");

  if (existing.count === 0) {
    await db.run(
      `INSERT INTO units (property, unit, cleaningStatus, invoiceStatus, paymentStatus, invoiceAmount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["Maple Grove Apartments", "101", "Not Started", "Not Sent", "Unpaid", 250]
    );
  }
}

app.get("/", (req, res) => {
  res.send("Smart Start Unit Tracker API is running");
});

app.get("/api/units", async (req, res) => {
  const units = await db.all("SELECT * FROM units ORDER BY id DESC");
  res.json(units);
});

app.post("/api/units", async (req, res) => {
  const {
    property,
    unit,
    cleaningStatus,
    invoiceStatus,
    paymentStatus,
    invoiceAmount,
  } = req.body;

  const result = await db.run(
    `INSERT INTO units (property, unit, cleaningStatus, invoiceStatus, paymentStatus, invoiceAmount)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      property,
      unit,
      cleaningStatus,
      invoiceStatus,
      paymentStatus,
      Number(invoiceAmount) || 0,
    ]
  );

  const newUnit = await db.get("SELECT * FROM units WHERE id = ?", [result.lastID]);

  res.status(201).json(newUnit);
});

app.patch("/api/units/:id", async (req, res) => {
  const id = Number(req.params.id);

  const existing = await db.get("SELECT * FROM units WHERE id = ?", [id]);

  if (!existing) {
    return res.status(404).json({ message: "Unit not found" });
  }

  const updated = {
    ...existing,
    ...req.body,
  };

  await db.run(
    `UPDATE units
     SET property = ?, unit = ?, cleaningStatus = ?, invoiceStatus = ?, paymentStatus = ?, invoiceAmount = ?
     WHERE id = ?`,
    [
      updated.property,
      updated.unit,
      updated.cleaningStatus,
      updated.invoiceStatus,
      updated.paymentStatus,
      Number(updated.invoiceAmount) || 0,
      id,
    ]
  );

  const saved = await db.get("SELECT * FROM units WHERE id = ?", [id]);

  res.json(saved);
});

app.delete("/api/units/:id", async (req, res) => {
  const id = Number(req.params.id);

  await db.run("DELETE FROM units WHERE id = ?", [id]);

  res.json({ message: "Unit deleted" });
});

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});