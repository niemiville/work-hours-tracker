import axios from "axios";

const API_URL = "http://localhost:3001/api/time-entries";

// ✅ Fetch time entries for the logged-in user
export const fetchTimeEntries = async (token: string) => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ✅ Create a time entry (Authenticated)
export const createTimeEntry = async (
  entry: { date: string; tasktype: string; taskid: number; description?: string; hours: number },
  token: string
) => {
  const response = await axios.post(API_URL, entry, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ✅ Update a time entry (Authenticated)
export const updateTimeEntry = async (
  id: number,
  entry: { date: string; tasktype: string; taskid: number; description?: string; hours: number },
  token: string
) => {
  const response = await axios.put(`${API_URL}/${id}`, entry, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
