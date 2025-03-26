import { Request, Response } from "express";
import pool from "../config/database";

// Extend Request to include user
interface AuthRequest extends Request {
  user?: { id: number };
}

// Get statistics by task ID for the logged-in user
export const getStatsByTaskId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id: userId } = req.user;
    
    // Get total hours for percentage calculation
    const totalResult = await pool.query(
      "SELECT SUM(hours) as total_hours FROM timeentry WHERE userid = $1",
      [userId]
    );
    
    const totalHours = parseFloat(totalResult.rows[0].total_hours) || 0;
    
    // Get task ID stats with percentage and limit to top 100
    const result = await pool.query(
      `SELECT 
        taskid, 
        SUM(hours) as hours,
        (SUM(hours) / $2 * 100) as percentage
      FROM timeentry 
      WHERE userid = $1 AND taskid IS NOT NULL
      GROUP BY taskid
      ORDER BY hours DESC
      LIMIT 100`,
      [userId, totalHours]
    );
    
    res.json({
      taskStats: result.rows,
      totalHours
    });
  } catch (err) {
    console.error("Error fetching task ID statistics:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Get statistics by task type for the logged-in user
export const getStatsByTaskType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id: userId } = req.user;
    
    // Get total hours for percentage calculation
    const totalResult = await pool.query(
      "SELECT SUM(hours) as total_hours FROM timeentry WHERE userid = $1",
      [userId]
    );
    
    const totalHours = parseFloat(totalResult.rows[0].total_hours) || 0;
    
    // Get hours by task type
    const result = await pool.query(
      `SELECT 
        tasktype, 
        SUM(hours) as hours,
        (SUM(hours) / $2 * 100) as percentage
      FROM timeentry 
      WHERE userid = $1
      GROUP BY tasktype
      ORDER BY hours DESC`,
      [userId, totalHours]
    );
    
    res.json({
      taskTypes: result.rows,
      totalHours
    });
  } catch (err) {
    console.error("Error fetching task type statistics:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Get summary statistics for the logged-in user
export const getStatsSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id: userId } = req.user;
    
    // Get total hours
    const totalHoursResult = await pool.query(
      "SELECT SUM(hours) as total_hours FROM timeentry WHERE userid = $1",
      [userId]
    );
    
    // Get total days with entries
    const totalDaysResult = await pool.query(
      "SELECT COUNT(DISTINCT date) as total_days FROM timeentry WHERE userid = $1",
      [userId]
    );
    
    // Get average hours per day
    const avgHoursPerDayResult = await pool.query(
      `SELECT AVG(daily_hours) as avg_hours_per_day
       FROM (
         SELECT date, SUM(hours) as daily_hours
         FROM timeentry
         WHERE userid = $1
         GROUP BY date
       ) as daily_totals`,
      [userId]
    );
    
    res.json({
      totalHours: parseFloat(totalHoursResult.rows[0].total_hours) || 0,
      totalDays: parseInt(totalDaysResult.rows[0].total_days) || 0,
      avgHoursPerDay: parseFloat(avgHoursPerDayResult.rows[0].avg_hours_per_day) || 0
    });
  } catch (err) {
    console.error("Error fetching summary statistics:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Get statistics by task ID per month for the logged-in user
export const getStatsByTaskIdPerMonth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id: userId } = req.user;
    
    // Get monthly stats grouped by task ID
    const result = await pool.query(
      `WITH monthly_data AS (
        SELECT 
          TO_CHAR(date, 'YYYY-MM') as month,
          taskid,
          SUM(hours) as hours
        FROM timeentry 
        WHERE userid = $1 AND taskid IS NOT NULL
        GROUP BY TO_CHAR(date, 'YYYY-MM'), taskid
      ),
      monthly_totals AS (
        SELECT 
          month,
          SUM(hours) as total_month_hours
        FROM monthly_data
        GROUP BY month
      )
      SELECT 
        md.month,
        md.taskid,
        md.hours,
        (md.hours / mt.total_month_hours * 100) as percentage,
        mt.total_month_hours
      FROM monthly_data md
      JOIN monthly_totals mt ON md.month = mt.month
      ORDER BY md.month DESC, md.hours DESC`,
      [userId]
    );
    
    // Group results by month
    const monthlyStats: Record<string, any> = {};
    
    result.rows.forEach(row => {
      const { month, taskid, hours, percentage, total_month_hours } = row;
      
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          month,
          totalHours: parseFloat(total_month_hours),
          taskStats: []
        };
      }
      
      monthlyStats[month].taskStats.push({
        taskid,
        hours: parseFloat(hours),
        percentage: parseFloat(percentage)
      });
    });
    
    // Convert to array sorted by most recent month first
    const monthlyStatsArray = Object.values(monthlyStats)
      .sort((a: any, b: any) => b.month.localeCompare(a.month));
    
    res.json(monthlyStatsArray);
  } catch (err) {
    console.error("Error fetching monthly task ID statistics:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Get statistics by task ID for the last 30 days for the logged-in user
export const getStatsLast30Days = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id: userId } = req.user;
    
    // Get total hours in last 30 days for percentage calculation
    const totalResult = await pool.query(
      "SELECT SUM(hours) as total_hours FROM timeentry WHERE userid = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'",
      [userId]
    );
    
    const totalHours = parseFloat(totalResult.rows[0].total_hours) || 0;
    
    // Get task ID stats for last 30 days
    const result = await pool.query(
      `SELECT 
        taskid, 
        SUM(hours) as hours,
        (SUM(hours) / $2 * 100) as percentage
      FROM timeentry 
      WHERE userid = $1 
        AND taskid IS NOT NULL
        AND date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY taskid
      ORDER BY hours DESC`,
      [userId, totalHours]
    );
    
    res.json({
      taskStats: result.rows,
      totalHours,
      period: "Last 30 Days"
    });
  } catch (err) {
    console.error("Error fetching last 30 days statistics:", err);
    res.status(500).json({ error: "Database error" });
  }
}; 