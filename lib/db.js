import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { PRICING_RULES } from "@/config/pricing";

const DB_PATH = path.join(process.cwd(), "tc_studio.sqlite");

// Maintain singleton DB instance across fast reloads
let dbInstance = global._tc_dbInstance;

function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec("PRAGMA journal_mode = WAL;");
    dbInstance.exec("PRAGMA foreign_keys = ON;");
    initTables(dbInstance);
    global._tc_dbInstance = dbInstance;
  }
  return dbInstance;
}

function initTables(db) {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      avatar TEXT,
      provider TEXT,
      plan TEXT DEFAULT 'free',
      credits_balance INTEGER DEFAULT 100,
      created_at TEXT
    );
  `);

  // 2. Credit Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id TEXT,
      created_at TEXT
    );
  `);

  // 3. Jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      job_type TEXT DEFAULT 'transcribe',
      video_duration_sec REAL DEFAULT 0,
      credits_cost INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      created_at TEXT,
      completed_at TEXT
    );
  `);

  // 4. Guest Sessions table (pre-configured for Phase 6)
  db.exec(`
    CREATE TABLE IF NOT EXISTS guest_sessions (
      id TEXT PRIMARY KEY,
      ip_address TEXT,
      trials_count INTEGER DEFAULT 0,
      created_at TEXT,
      last_active_at TEXT
    );
  `);

  // 5. Guest Projects table (pre-configured for Phase 6)
  db.exec(`
    CREATE TABLE IF NOT EXISTS guest_projects (
      id TEXT PRIMARY KEY,
      guest_id TEXT NOT NULL,
      user_id TEXT,
      title TEXT,
      video_url TEXT,
      duration_sec REAL DEFAULT 0,
      segments_json TEXT,
      status TEXT DEFAULT 'completed',
      claimed INTEGER DEFAULT 0,
      created_at TEXT
    );
  `);
}

/**
 * Synchronize or create user upon authentication.
 * Guarantees every user receives 100 bonus credits once via signup_bonus.
 */
export function getOrCreateUser(userData) {
  if (!userData || (!userData.id && !userData.email)) return null;

  const db = getDb();
  const userId = userData.id || `usr_${crypto.randomBytes(6).toString("hex")}`;
  const userEmail = userData.email || `${userId}@example.com`;

  // Look up existing user by ID or Email
  let user = db.prepare("SELECT * FROM users WHERE id = ? OR email = ?").get(userId, userEmail);

  if (!user) {
    const now = new Date().toISOString();
    const initialCredits = PRICING_RULES.SIGNUP_BONUS_CREDITS; // 100 credits
    const plan = userData.plan || "free";

    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(`
        INSERT INTO users (id, name, email, avatar, provider, plan, credits_balance, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        userData.name || "Telugu Creator",
        userEmail,
        userData.avatar || "",
        userData.provider || "email",
        plan,
        initialCredits,
        now
      );

      // Record signup_bonus transaction
      const txId = `tx_${crypto.randomBytes(8).toString("hex")}`;
      db.prepare(`
        INSERT INTO credit_transactions (id, user_id, amount, reason, reference_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(txId, userId, initialCredits, "signup_bonus", "initial_signup", now);

      db.exec("COMMIT");
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  } else {
    // Safe migration: check if existing user ever received signup bonus
    const bonusTx = db.prepare(`
      SELECT id FROM credit_transactions WHERE user_id = ? AND reason = 'signup_bonus'
    `).get(user.id);

    if (!bonusTx) {
      const now = new Date().toISOString();
      const bonusAmount = PRICING_RULES.SIGNUP_BONUS_CREDITS;
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare(`
          UPDATE users SET credits_balance = credits_balance + ? WHERE id = ?
        `).run(bonusAmount, user.id);

        const txId = `tx_${crypto.randomBytes(8).toString("hex")}`;
        db.prepare(`
          INSERT INTO credit_transactions (id, user_id, amount, reason, reference_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(txId, user.id, bonusAmount, "signup_bonus", "migration_bonus", now);

        db.exec("COMMIT");
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
      } catch (err) {
        db.exec("ROLLBACK");
      }
    }
  }

  return user;
}

/**
 * Retrieve user by ID
 */
export function getUserById(id) {
  if (!id) return null;
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

/**
 * Atomically check user credit balance and deduct credits in a single transaction.
 * Prevents double-spend and balances falling below zero.
 */
export function deductCreditsAtomically(userId, amount, reason, referenceId = null) {
  if (!userId || amount <= 0) return { success: true, balance: 0 };
  const db = getDb();

  db.exec("BEGIN IMMEDIATE");
  try {
    const user = db.prepare("SELECT credits_balance FROM users WHERE id = ?").get(userId);
    if (!user) {
      throw new Error("User account not found");
    }

    if (user.credits_balance < amount) {
      throw new Error(`Insufficient credits. Required: ${amount}, Available: ${user.credits_balance}`);
    }

    const newBalance = user.credits_balance - amount;
    db.prepare("UPDATE users SET credits_balance = ? WHERE id = ?").run(newBalance, userId);

    const txId = `tx_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, amount, reason, reference_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(txId, userId, -amount, reason, referenceId, now);

    db.exec("COMMIT");
    return { success: true, txId, newBalance };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Atomically refund credits when downstream jobs fail.
 */
export function refundCreditsAtomically(userId, amount, reason = "refund", referenceId = null) {
  if (!userId || amount <= 0) return { success: true };
  const db = getDb();

  db.exec("BEGIN IMMEDIATE");
  try {
    const user = db.prepare("SELECT credits_balance FROM users WHERE id = ?").get(userId);
    if (!user) throw new Error("User not found for refund");

    const newBalance = user.credits_balance + amount;
    db.prepare("UPDATE users SET credits_balance = ? WHERE id = ?").run(newBalance, userId);

    const txId = `tx_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, amount, reason, reference_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(txId, userId, amount, reason, referenceId, now);

    db.exec("COMMIT");
    return { success: true, txId, newBalance };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Create a tracked job in DB
 */
export function createJob({ userId, jobType, videoDurationSec, creditsCost }) {
  const db = getDb();
  const jobId = `job_${crypto.randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO jobs (id, user_id, job_type, video_duration_sec, credits_cost, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(jobId, userId, jobType || "transcribe", videoDurationSec || 0, creditsCost || 0, now);

  return jobId;
}

/**
 * Update job status & completion timestamp
 */
export function updateJobStatus(jobId, status, errorMessage = null) {
  if (!jobId) return;
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE jobs
    SET status = ?, error_message = ?, completed_at = ?
    WHERE id = ?
  `).run(status, errorMessage, now, jobId);
}

/**
 * Fetch recent user credit transactions
 */
export function getUserTransactions(userId, limit = 20) {
  if (!userId) return [];
  const db = getDb();
  return db.prepare(`
    SELECT * FROM credit_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit);
}

/**
 * PHASE 6: Guest Session & Project Management
 */

/**
 * Retrieve or create an anonymous guest session.
 */
export function getOrCreateGuestSession(existingGuestId, ipAddress = "127.0.0.1") {
  const db = getDb();
  const now = new Date().toISOString();

  if (existingGuestId) {
    const existing = db.prepare("SELECT * FROM guest_sessions WHERE id = ?").get(existingGuestId);
    if (existing) {
      db.prepare("UPDATE guest_sessions SET last_active_at = ? WHERE id = ?").run(now, existingGuestId);
      return existing;
    }
  }

  const guestId = `gst_${crypto.randomBytes(12).toString("hex")}`;
  db.prepare(`
    INSERT INTO guest_sessions (id, ip_address, trials_count, created_at, last_active_at)
    VALUES (?, ?, 0, ?, ?)
  `).run(guestId, ipAddress, now, now);

  return {
    id: guestId,
    ip_address: ipAddress,
    trials_count: 0,
    created_at: now,
    last_active_at: now
  };
}

/**
 * Count total guest trials from an IP in the last 24 hours.
 */
export function getGuestTrialsCountForIp(ipAddress) {
  if (!ipAddress) return 0;
  const db = getDb();
  const row = db.prepare(`
    SELECT COALESCE(SUM(trials_count), 0) AS total
    FROM guest_sessions
    WHERE ip_address = ? AND created_at > datetime('now', '-24 hours')
  `).get(ipAddress);
  return Number(row?.total || 0);
}

/**
 * Record a trial usage on a guest session.
 */
export function recordGuestTrial(guestId) {
  if (!guestId) return;
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE guest_sessions
    SET trials_count = trials_count + 1, last_active_at = ?
    WHERE id = ?
  `).run(now, guestId);
}

/**
 * Store a guest project linked to a guest ID.
 */
export function saveGuestProject({ guestId, title, videoUrl, durationSec, segments }) {
  if (!guestId) return null;
  const db = getDb();
  const projId = `gproj_${crypto.randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();
  const segmentsJson = JSON.stringify(segments || []);

  db.prepare(`
    INSERT INTO guest_projects (id, guest_id, title, video_url, duration_sec, segments_json, status, claimed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'completed', 0, ?)
  `).run(projId, guestId, title || "telugu_reel", videoUrl || "", durationSec || 0, segmentsJson, now);

  return {
    id: projId,
    guest_id: guestId,
    title: title || "telugu_reel",
    video_url: videoUrl || "",
    duration_sec: durationSec || 0,
    segments,
    claimed: 0,
    created_at: now
  };
}

/**
 * Claim all guest projects for a newly logged in or signed up user.
 */
export function claimGuestProjects(guestId, userId) {
  if (!guestId || !userId) return [];
  const db = getDb();

  const unclaimed = db.prepare(`
    SELECT * FROM guest_projects
    WHERE guest_id = ? AND claimed = 0
  `).all(guestId);

  if (unclaimed.length > 0) {
    db.prepare(`
      UPDATE guest_projects
      SET user_id = ?, claimed = 1
      WHERE guest_id = ? AND claimed = 0
    `).run(userId, guestId);
  }

  return unclaimed.map(p => ({
    ...p,
    segments: p.segments_json ? JSON.parse(p.segments_json) : []
  }));
}

/**
 * Automatically delete unclaimed guest projects and expired guest sessions older than 48 hours.
 */
export function cleanupUnclaimedGuestProjects() {
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const expiredProjects = db.prepare(`
      SELECT id, video_url FROM guest_projects
      WHERE claimed = 0 AND created_at < ?
    `).all(cutoff);

    // Delete any disk video files if applicable
    for (const proj of expiredProjects) {
      if (proj.video_url && proj.video_url.startsWith("/")) {
        try {
          const filePath = path.join(process.cwd(), "public", proj.video_url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          // ignore disk unlink error
        }
      }
    }

    db.prepare(`
      DELETE FROM guest_projects
      WHERE claimed = 0 AND created_at < ?
    `).run(cutoff);

    db.prepare(`
      DELETE FROM guest_sessions
      WHERE created_at < ?
    `).run(cutoff);
  } catch (err) {
    console.warn("Guest cleanup warning:", err.message);
  }
}

