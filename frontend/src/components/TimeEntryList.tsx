import { useEffect, useState } from 'react';
import { fetchTimeEntries, createTimeEntry, updateTimeEntry } from '../api/timeEntryApi';
import '../styles/TimeEntryList.css'; // Importing the CSS file for styles

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
  const [newEntry, setNewEntry] = useState<TimeEntry>({
    id: 0,
    userid: 0,
    date: '',
    tasktype: '',
    taskid: 0,
    description: '',
    hours: 0,
  });
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  useEffect(() => {
    fetchTimeEntries().then((data) => {
      // Sort the entries by date in ascending order (newest at the bottom)
      const sortedEntries = data.sort((a: TimeEntry, b: TimeEntry) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime(); // Ascending order
      });
      setEntries(sortedEntries);
    });
  }, []);

  const handleCreate = async () => {
    if (!newEntry) return;
    const createdEntry = await createTimeEntry(newEntry);
    setEntries((prevEntries) => [...prevEntries, createdEntry]);
    setNewEntry({
      id: 0,
      userid: 0,
      date: '',
      tasktype: '',
      taskid: 0,
      description: '',
      hours: 0,
    }); // Reset new entry form
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;
    const updatedEntry = await updateTimeEntry(editingEntry.id, editingEntry);
    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    );
    setEditingEntry(null); // Reset edit form
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (newEntry) {
      setNewEntry({ ...newEntry, [name]: value });
    }
    if (editingEntry) {
      setEditingEntry({ ...editingEntry, [name]: value });
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry({ ...entry });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  };

  return (
    <div className="time-entry-container">
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

      <h3 className="form-heading">{editingEntry ? 'Edit Entry' : 'Add New Entry'}</h3>
      <div className="form-container">
        <label>Date:</label>
        <input
          className="input-field"
          type="date"
          name="date"
          value={editingEntry ? editingEntry.date : newEntry?.date || ''}
          onChange={handleInputChange}
        />
        <label>Task Type:</label>
        <input
          className="input-field"
          type="text"
          name="tasktype"
          value={editingEntry ? editingEntry.tasktype : newEntry?.tasktype || ''}
          onChange={handleInputChange}
        />
        <label>Task ID:</label>
        <input
          className="input-field"
          type="number"
          name="taskid"
          value={editingEntry ? editingEntry.taskid : newEntry?.taskid || ''}
          onChange={handleInputChange}
        />
        <label>Description:</label>
        <textarea
          className="input-field"
          name="description"
          value={editingEntry ? editingEntry.description : newEntry?.description || ''}
          onChange={handleInputChange}
        />
        <label>Hours:</label>
        <input
          className="input-field"
          type="number"
          name="hours"
          step="0.1"
          value={editingEntry ? editingEntry.hours : newEntry?.hours || ''}
          onChange={handleInputChange}
        />

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
