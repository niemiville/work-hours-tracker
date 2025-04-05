import axios from "axios";
import { API_ENDPOINTS } from "./config";

const API_URL = API_ENDPOINTS.TIME_ENTRIES;

export interface TimeEntry {
  id: number;
  userid: number;
  date: string;
  tasktype: string;
  taskid: number | null;
  subtaskid: number | null;
  description: string;
  hours: number;
}

export interface CreateTimeEntryRequest {
  date: string;
  tasktype: string;
  taskid: number | null;
  subtaskid: number | null;
  description?: string;
  hours: number;
}

export interface UpdateTimeEntryRequest {
  date: string;
  tasktype: string;
  taskid: number | null;
  subtaskid: number | null;
  description?: string;
  hours: number;
}

export interface TimeEntriesResponse {
  entries: TimeEntry[];
  totalDates: number;
  page: number;
  limit: number;
}

// ✅ Fetch time entries for the logged-in user with pagination
export const fetchTimeEntries = async (token: string, page: number = 1, limit: number = 5): Promise<TimeEntriesResponse> => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params: { page, limit }
  });
  return response.data;
};

// ✅ Create a time entry (Authenticated)
export const createTimeEntry = async (entry: CreateTimeEntryRequest, token: string): Promise<TimeEntry> => {
  const response = await axios.post(API_URL, entry, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ✅ Update a time entry (Authenticated)
export const updateTimeEntry = async (id: number, entry: UpdateTimeEntryRequest, token: string): Promise<TimeEntry> => {
  const response = await axios.put(`${API_URL}/${id}`, entry, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ✅ Delete a time entry (Authenticated)
export const deleteTimeEntry = async (id: number, token: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// ✅ Fetch time entries for a specific date (Authenticated)
export const fetchEntriesByDate = async (date: string, token: string): Promise<TimeEntry[]> => {
  const response = await axios.get(`${API_URL}/date/${date}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.entries;
};

// ✅ Fetch latest entries before a specific date (Authenticated)
export const fetchLatestEntriesBeforeDate = async (date: string, token: string): Promise<{entries: TimeEntry[], latestDate: string | null}> => {
  const response = await axios.get(`${API_URL}/latest-before/${date}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
