import { useEffect, useState } from "react";
import { fetchTimeEntries, createTimeEntry, updateTimeEntry } from "../api/timeEntryApi";
import { getUser } from "../api/authApi"; // Fetch logged-in user
import { useNavigate } from "react-router-dom";
import "../styles/TimeEntryList.css";

type TimeEntry = {
  id: number;
  userid: number;
  date: string;
  tasktype: string;
  taskid: number;
  description: string;
  hours: number;
};

const TimeEntryList = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [newEntry, setNewEntry] = useState<Omit<TimeEntry, "id">>({
    userid: 0,
    date: "",
    tasktype: "",
    taskid: 0,
    description: "",
    hours: 0,
  });
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserAndEntries = async () => {
      const user = await getUser(); // Get logged-in user
      if (!user) {
        navigate("/login"); // Redirect if not logged in
        return;
      }

      setUserId(user.id);
      setToken(user.token); // Assuming the token is part of the user object
      fetchTimeEntries(user.token).then((data) => {
        // Sort entries by date (ascending order)
        const sortedEntries = data.sort((a: TimeEntry, b: TimeEntry) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setEntries(sortedEntries);
      });
    };

    loadUserAndEntries();
  }, [navigate]);

  const handleCreate = async () => {
    if (!newEntry || !userId || !token) return;
    const createdEntry = await createTimeEntry({ ...newEntry }, token);
    setEntries((prev) => [...prev, createdEntry]);
    setNewEntry({ userid: userId, date: "", tasktype: "", taskid: 0, description: "", hours: 0 });
  };

  const handleUpdate = async () => {
    if (!editingEntry || !token) return;
    const updatedEntry = await updateTimeEntry(editingEntry.id, editingEntry, token);
    setEntries((prev) => prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)));
    setEditingEntry(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editingEntry) setEditingEntry({ ...editingEntry, [name]: value });
    else setNewEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (entry: TimeEntry) => setEditingEntry(entry);
  const handleCancelEdit = () => setEditingEntry(null);
  const formatDate = (date: string) => new Date(date).toLocaleDateString("fi-FI");

  return (
    <div className="time-entry-container">
      <h2>My Time Entries</h2>
      <table className="time-entry-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Task Type</th>
            <th>Task ID</th>
            <th>Description</th>
            <th>Hours</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{formatDate(entry.date)}</td>
              <td>{entry.tasktype}</td>
              <td>{entry.taskid}</td>
              <td>{entry.description}</td>
              <td>{entry.hours}</td>
              <td>
                <button className="edit-button" onClick={() => handleEdit(entry)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>{editingEntry ? "Edit Entry" : "Add New Entry"}</h3>
      <div className="form-container">
        <label>Date:</label>
        <input type="date" name="date" value={editingEntry?.date || newEntry.date} onChange={handleInputChange} />

        <label>Task Type:</label>
        <input type="text" name="tasktype" value={editingEntry?.tasktype || newEntry.tasktype} onChange={handleInputChange} />

        <label>Task ID:</label>
        <input type="number" name="taskid" value={editingEntry?.taskid || newEntry.taskid} onChange={handleInputChange} />

        <label>Description:</label>
        <textarea name="description" value={editingEntry?.description || newEntry.description} onChange={handleInputChange} />

        <label>Hours:</label>
        <input type="number" name="hours" step="0.1" value={editingEntry?.hours || newEntry.hours} onChange={handleInputChange} />

        <div className="form-actions">
          {editingEntry ? (
            <>
              <button className="save-button" onClick={handleUpdate}>
                Save Changes
              </button>
              <button className="cancel-button" onClick={handleCancelEdit}>
                Cancel
              </button>
            </>
          ) : (
            <button className="add-button" onClick={handleCreate}>
              Add Entry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeEntryList;
