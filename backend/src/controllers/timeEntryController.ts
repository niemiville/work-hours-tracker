import { Request, Response } from "express";
import pool from "../config/database";

// Extend Request to include user
interface AuthRequest extends Request {
  user?: { id: number };
}

// ✅ Get time entries for logged-in user with pagination
export const getTimeEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id: userId } = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    
    // First, get the distinct dates with entries, ordered by date descending
    const datesResult = await pool.query(
      "SELECT DISTINCT date FROM timeentry WHERE userid = $1 ORDER BY date DESC LIMIT $2 OFFSET $3",
      [userId, limit, (page - 1) * limit]
    );
    
    if (datesResult.rows.length === 0) {
      res.json({ entries: [], totalDates: 0, page, limit });
      return;
    }
    
    // Extract the dates
    const dates = datesResult.rows.map(row => row.date);
    
    // Get entries for these dates
    const entriesResult = await pool.query(
      "SELECT * FROM timeentry WHERE userid = $1 AND date = ANY($2) ORDER BY date DESC, id DESC",
      [userId, dates]
    );
    
    // Get total count of distinct dates for pagination
    const totalResult = await pool.query(
      "SELECT COUNT(DISTINCT date) as total FROM timeentry WHERE userid = $1",
      [userId]
    );
    
    const totalDates = parseInt(totalResult.rows[0].total);
    
    res.json({
      entries: entriesResult.rows,
      totalDates,
      page,
      limit
    });
  } catch (err) {
    console.error("Error fetching time entries:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Create a new time entry (Only for logged-in user)
export const createTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id: userId } = req.user;
    const { date, tasktype, taskid, subtaskid, description, hours } = req.body;
    
    const result = await pool.query(
      "INSERT INTO timeentry (userid, date, tasktype, taskid, subtaskid, description, hours) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [userId, date, tasktype, taskid, subtaskid, description, hours]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Update an existing time entry (Only if user owns it)
export const updateTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { date, tasktype, taskid, subtaskid, description, hours } = req.body;
    const { id: userId } = req.user;

    const result = await pool.query(
      "UPDATE timeentry SET date=$1, tasktype=$2, taskid=$3, subtaskid=$4, description=$5, hours=$6, updated=CURRENT_TIMESTAMP WHERE id=$7 AND userid=$8 RETURNING *",
      [date, tasktype, taskid, subtaskid, description, hours, id, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Entry not found or unauthorized" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Delete a time entry (Only if user owns it)
export const deleteTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { id: userId } = req.user;

    const result = await pool.query(
      "DELETE FROM timeentry WHERE id=$1 AND userid=$2 RETURNING *",
      [id, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Entry not found or unauthorized" });
    } else {
      res.json({ message: "Entry deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Get time entries for a specific date (Only for logged-in user)
export const getEntriesByDate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id: userId } = req.user;
    const { date } = req.params;
    
    // Validate the date format (YYYY-MM-DD)
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      return;
    }
    
    // Get entries for the specified date
    const result = await pool.query(
      "SELECT * FROM timeentry WHERE userid = $1 AND date = $2 ORDER BY id DESC",
      [userId, date]
    );
    
    res.json({
      entries: result.rows
    });
  } catch (err) {
    console.error("Error fetching time entries by date:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Get latest time entries before a specific date (Only for logged-in user)
export const getLatestEntriesBeforeDate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id: userId } = req.user;
    const { date } = req.params;
    
    // Validate the date format (YYYY-MM-DD)
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      return;
    }
    
    // First, find the latest date before the specified date that has entries
    const latestDateResult = await pool.query(
      "SELECT MAX(date) as latest_date FROM timeentry WHERE userid = $1 AND date < $2",
      [userId, date]
    );
    
    const latestDate = latestDateResult.rows[0]?.latest_date;
    
    if (!latestDate) {
      res.json({ entries: [], latestDate: null });
      return;
    }
    
    // Get entries for the latest date
    const entriesResult = await pool.query(
      "SELECT * FROM timeentry WHERE userid = $1 AND date = $2 ORDER BY id DESC",
      [userId, latestDate]
    );
    
    res.json({
      entries: entriesResult.rows,
      latestDate
    });
  } catch (err) {
    console.error("Error fetching latest entries before date:", err);
    res.status(500).json({ error: "Database error" });
  }
};
