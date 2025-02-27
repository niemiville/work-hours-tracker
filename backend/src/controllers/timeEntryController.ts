import { Request, Response } from 'express';
import pool from '../config/database';

export const getTimeEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM timeentry ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const createTimeEntry = async (req: Request, res: Response): Promise<void> => {
  const { userid, date, tasktype, taskid, description, hours } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO timeentry (userid, date, tasktype, taskid, description, hours) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userid, date, tasktype, taskid, description, hours]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const updateTimeEntry = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { date, tasktype, taskid, description, hours } = req.body;
  try {
    const result = await pool.query(
      'UPDATE timeentry SET date=$1, tasktype=$2, taskid=$3, description=$4, hours=$5, updated=CURRENT_TIMESTAMP WHERE id=$6 RETURNING *',
      [date, tasktype, taskid, description, hours, id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Entry not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};
