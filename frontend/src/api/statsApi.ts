import axios from "axios";
import { API_ENDPOINTS } from "./config";

const API_URL = API_ENDPOINTS.STATS;

export interface TaskIdStats {
  taskid: number;
  hours: number | string;
  percentage: number | string;
}

export interface TaskTypeStats {
  tasktype: string;
  hours: number | string;
  percentage: number | string;
}

export interface TaskTypeStatsResponse {
  taskTypes: TaskTypeStats[];
  totalHours: number;
}

export interface StatsSummary {
  totalHours: number;
  totalDays: number;
  avgHoursPerDay: number;
}

export interface MonthlyTaskStat {
  taskid: number;
  hours: number;
  percentage: number;
}

export interface MonthlyStats {
  month: string;
  totalHours: number;
  taskStats: MonthlyTaskStat[];
}

export interface Last30DaysStats {
  taskStats: {
    taskid: number;
    hours: number | string;
    percentage: number | string;
  }[];
  totalHours: number;
  period: string;
}

export interface TaskIdStatsResponse {
  taskStats: TaskIdStats[];
  totalHours: number;
}

// Fetch statistics by task ID
export const fetchStatsByTaskId = async (token: string): Promise<TaskIdStatsResponse> => {
  const response = await axios.get(`${API_URL}/task-id`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Fetch statistics by task type
export const fetchStatsByTaskType = async (token: string): Promise<TaskTypeStatsResponse> => {
  const response = await axios.get(`${API_URL}/task-type`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Fetch summary statistics
export const fetchStatsSummary = async (token: string): Promise<StatsSummary> => {
  const response = await axios.get(`${API_URL}/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Fetch monthly task ID statistics
export const fetchMonthlyTaskIdStats = async (token: string): Promise<MonthlyStats[]> => {
  const response = await axios.get(`${API_URL}/task-id-monthly`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Fetch task ID statistics for the last 30 days
export const fetchLast30DaysStats = async (token: string): Promise<Last30DaysStats> => {
  const response = await axios.get(`${API_URL}/last-30-days`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}; 