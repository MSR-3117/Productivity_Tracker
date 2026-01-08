-- Daily Planner & Dedication Tracker Database Schema
-- SQLite

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User settings table (theme preferences)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY,
  theme TEXT DEFAULT 'dark' CHECK(theme IN ('dark', 'light')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tasks table (with soft delete per ASSUMPTIONS.md)
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'done')),
  due_date DATE NOT NULL,
  scheduled_time TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
  notes TEXT,
  recurrence TEXT CHECK(recurrence IN ('daily', 'weekly', 'monthly') OR recurrence IS NULL),
  recurrence_end DATE,
  completed_at DATETIME,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for faster task queries by user and date
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_deleted ON tasks(user_id, deleted_at);

-- Dedication metrics table (for caching if needed)
CREATE TABLE IF NOT EXISTS dedication_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  month_year TEXT NOT NULL,
  completion_rate REAL,
  total_tasks INTEGER,
  completed_tasks INTEGER,
  streak_days INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, month_year)
);

-- SQL View for monthly dedication metrics (per PLAN.md)
CREATE VIEW IF NOT EXISTS monthly_dedication AS
SELECT 
  user_id,
  strftime('%Y-%m', due_date) AS month_year,
  COUNT(*) AS total_tasks,
  SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
  ROUND(100.0 * SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) / COUNT(*), 2) AS completion_rate
FROM tasks
WHERE deleted_at IS NULL
GROUP BY user_id, strftime('%Y-%m', due_date);
