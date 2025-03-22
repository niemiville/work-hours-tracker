import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { TimeEntry, CreateTimeEntryRequest, UpdateTimeEntryRequest, fetchTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry } from "../api/timeEntryApi";
import "../styles/TimeEntryList.css";

type TimeEntryForm = Omit<TimeEntry, "id">;

const TimeEntryList = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [newEntry, setNewEntry] = useState<TimeEntryForm>({
    userid: 0,
    date: new Date().toISOString().split('T')[0],
    tasktype: "",
    taskid: null,
    description: "",
    hours: 0,
  });
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadEntries = async () => {
      try {
        const data = await fetchTimeEntries(user.token);
        // Sort entries by date (descending order)
        const sortedEntries = data.sort((a: TimeEntry, b: TimeEntry) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setEntries(sortedEntries);
      } catch (error) {
        console.error("Failed to fetch time entries:", error);
      }
    };

    loadEntries();
  }, [navigate, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editingEntry) {
      setEditingEntry({ 
        ...editingEntry, 
        [name]: name === 'taskid' ? (value === '' ? null : Number(value)) : value 
      });
    } else {
      setNewEntry((prev) => ({ 
        ...prev, 
        [name]: name === 'taskid' ? (value === '' ? null : Number(value)) : value 
      }));
    }
  };

  const isFormValid = () => {
    return newEntry.date && 
           newEntry.tasktype.trim() && 
           newEntry.hours > 0;
  };

  const handleCreate = async () => {
    if (!newEntry || !user) return;

    // Validate required fields
    if (!newEntry.date || !newEntry.tasktype.trim()) {
      alert("Please fill in both Date and Task Type fields");
      return;
    }

    // Validate hours is not negative or zero
    if (newEntry.hours <= 0) {
      alert("Hours cannot be negative or zero");
      return;
    }

    try {
      const entryToCreate: CreateTimeEntryRequest = {
        date: newEntry.date,
        tasktype: newEntry.tasktype,
        taskid: newEntry.taskid,
        description: newEntry.description,
        hours: newEntry.hours
      };
      const createdEntry = await createTimeEntry(entryToCreate, user.token);
      setEntries((prev) => [createdEntry, ...prev]);
      setNewEntry({ 
        userid: user.id, 
        date: newEntry.date, 
        tasktype: "", 
        taskid: null, 
        description: "", 
        hours: 0 
      });
      // Reset the task ID input field
      const taskIdInput = document.querySelector('input[name="taskid"]') as HTMLInputElement;
      if (taskIdInput) {
        taskIdInput.value = '';
      }
    } catch (error) {
      console.error("Failed to create time entry:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingEntry || !user) return;

    try {
      const entryToUpdate: UpdateTimeEntryRequest = {
        date: editingEntry.date,
        tasktype: editingEntry.tasktype,
        taskid: editingEntry.taskid,
        description: editingEntry.description,
        hours: editingEntry.hours
      };
      const updatedEntry = await updateTimeEntry(editingEntry.id, entryToUpdate, user.token);
      setEntries((prev) =>
        prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
      );
      setEditingEntry(null);
    } catch (error) {
      console.error("Failed to update time entry:", error);
    }
  };

  const handleEdit = (entry: TimeEntry) => setEditingEntry(entry);
  const handleCancelEdit = () => setEditingEntry(null);
  const formatDate = (date: string) => new Date(date).toLocaleDateString("fi-FI");

  const handleDelete = async (id: number) => {
    if (!user) return;
    
    const entryToDelete = entries.find(entry => entry.id === id);
    if (!entryToDelete) return;

    const confirmMessage = `Are you sure you want to delete this time entry?\n\n` +
      `Date: ${formatDate(entryToDelete.date)}\n` +
      `Task Type: ${entryToDelete.tasktype}\n` +
      `Task ID: ${entryToDelete.taskid || ''}\n` +
      `Hours: ${entryToDelete.hours}\n` +
      `Description: ${entryToDelete.description}`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteTimeEntry(id, user.token);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error("Failed to delete time entry:", error);
      alert("Failed to delete time entry");
    }
  };

  const handleDuplicate = async (entry: TimeEntry) => {
    if (!user) return;

    try {
      const entryToCreate: CreateTimeEntryRequest = {
        date: new Date().toISOString().split('T')[0],
        tasktype: entry.tasktype,
        taskid: entry.taskid,
        description: entry.description,
        hours: entry.hours
      };
      const createdEntry = await createTimeEntry(entryToCreate, user.token);
      setEntries((prev) => [createdEntry, ...prev]);
    } catch (error) {
      console.error("Failed to duplicate time entry:", error);
      alert("Failed to duplicate time entry");
    }
  };

  const handleDuplicateYesterday = async () => {
    if (!user) return;

    try {
      // Find the most recent date before today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all unique dates from entries
      const uniqueDates = [...new Set(entries.map(entry => entry.date))];
      
      // Find the most recent date before today
      const yesterdayDate = uniqueDates
        .map(date => new Date(date))
        .filter(date => date < today)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      if (!yesterdayDate) {
        alert("No entries found from previous days to duplicate");
        return;
      }

      // Get all entries from that date
      const entriesToDuplicate = entries.filter(entry => 
        new Date(entry.date).toISOString().split('T')[0] === yesterdayDate.toISOString().split('T')[0]
      );

      if (entriesToDuplicate.length === 0) {
        alert("No entries found from previous days to duplicate");
        return;
      }

      // Confirm with user
      const confirmMessage = `Are you sure you want to duplicate ${entriesToDuplicate.length} entries from ${formatDate(new Date(yesterdayDate.getTime()).toISOString().split('T')[0])} to today?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }

      // Duplicate each entry with today's date
      const todayStr = new Date().toISOString().split('T')[0];
      const duplicatedEntries = await Promise.all(
        entriesToDuplicate.map(async (entry) => {
          const entryToCreate: CreateTimeEntryRequest = {
            date: todayStr,
            tasktype: entry.tasktype,
            taskid: entry.taskid,
            description: entry.description,
            hours: entry.hours
          };
          return createTimeEntry(entryToCreate, user.token);
        })
      );

      // Add new entries to the top of the list
      setEntries((prev) => [...duplicatedEntries, ...prev]);
    } catch (error) {
      console.error("Failed to duplicate yesterday's entries:", error);
      alert("Failed to duplicate yesterday's entries");
    }
  };

  return (
    <div className="time-entry-container">
      <div className="form-container">
        <div className="input-row">
          <div>
            <label>Date</label>
            <input type="date" name="date" value={editingEntry?.date || newEntry.date} onChange={handleInputChange} />
          </div>

          <div>
            <label>Task Type</label>
            <input type="text" name="tasktype" value={editingEntry?.tasktype || newEntry.tasktype} onChange={handleInputChange} />
          </div>

          <div>
            <label>Task ID</label>
            <input type="number" name="taskid" value={editingEntry?.taskid || newEntry.taskid || ''} onChange={handleInputChange} />
          </div>

          <div>
            <label>Hours</label>
            <input type="number" name="hours" step="0.25" value={editingEntry?.hours || newEntry.hours} onChange={handleInputChange} />
          </div>
        </div>

        <div>
          <label>Description</label>
          <textarea name="description" value={editingEntry?.description || newEntry.description} onChange={handleInputChange} />
        </div>

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
            <>
              <button 
                className="duplicate-yesterday-button" 
                onClick={handleDuplicateYesterday}
              >
                Duplicate Yesterday
              </button>
              <button 
                className="add-button" 
                onClick={handleCreate}
                disabled={!isFormValid()}
              >
                Add Entry
              </button>
            </>
          )}
        </div>
      </div>

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
              <td>{entry.taskid || ''}</td>
              <td>{entry.description}</td>
              <td>{entry.hours}</td>
              <td className="action-buttons">
                <button className="edit-button" onClick={() => handleEdit(entry)}>
                  Edit
                </button>
                <button className="duplicate-button" onClick={() => handleDuplicate(entry)}>
                  Duplicate
                </button>
                <button className="delete-button" onClick={() => handleDelete(entry.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimeEntryList;
