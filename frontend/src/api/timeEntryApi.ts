import axios from 'axios';

const API_URL = 'http://localhost:3001/api/time-entries';

export const fetchTimeEntries = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createTimeEntry = async (entry: {
  userid: number;
  date: string;
  tasktype: string;
  taskid: number;
  description?: string;
  hours: number;
}) => {
  const response = await axios.post(API_URL, entry);
  return response.data;
};

export const updateTimeEntry = async (id: number, entry: {
  date: string;
  tasktype: string;
  taskid: number;
  description?: string;
  hours: number;
}) => {
  const response = await axios.put(`${API_URL}/${id}`, entry);
  return response.data;
};
