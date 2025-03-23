import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { TimeEntry, CreateTimeEntryRequest, UpdateTimeEntryRequest, fetchTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry } from "../api/timeEntryApi";
import "../styles/TimeEntryList.css";

type TimeEntryForm = Omit<TimeEntry, "id">;

// Daily hours target constant
const DAILY_HOURS_TARGET = 7.5;

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/signin");
      return;
    }

    const loadEntries = async () => {
      try {
        const data = await fetchTimeEntries(user.token);
        
        // Process entries to ensure hours is always a number
        const processedData = data.map((entry: any) => ({
          ...entry,
          hours: typeof entry.hours === 'number' ? entry.hours : Number(entry.hours) || 0
        }));
        
        // Sort entries by date (descending order)
        const sortedEntries = processedData.sort((a: TimeEntry, b: TimeEntry) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setEntries(sortedEntries);
      } catch (error) {
        console.error("Failed to fetch time entries:", error);
      }
    };

    loadEntries();
  }, [navigate, user]);

  // Debug effect to check styles on date separators
  useEffect(() => {
    if (tableRef.current) {
      const separators = tableRef.current.querySelectorAll('tr.date-separator');
      console.log(`Found ${separators.length} date separators`);
      
      separators.forEach((separator, index) => {
        const computedStyle = window.getComputedStyle(separator);
        console.log(`Separator ${index} background color:`, computedStyle.backgroundColor);
      });
    }
  }, [entries]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for hours to ensure it's always a number
    if (name === 'hours') {
      const numValue = value === '' ? 0 : Number(value);
      
      if (editingEntry) {
        setEditingEntry({ 
          ...editingEntry, 
          hours: numValue
        });
      } else {
        setNewEntry((prev) => ({ 
          ...prev, 
          hours: numValue
        }));
      }
      return;
    }
    
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
        // Ensure hours is a number
        hours: typeof newEntry.hours === 'number' ? newEntry.hours : parseFloat(String(newEntry.hours))
      };
      
      // Final check that hours is a valid number
      if (isNaN(entryToCreate.hours)) {
        alert("Invalid hours value. Please enter a valid number.");
        return;
      }
      
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
        // Ensure hours is a number
        hours: typeof editingEntry.hours === 'number' ? editingEntry.hours : parseFloat(String(editingEntry.hours))
      };
      
      // Final check that hours is a valid number
      if (isNaN(entryToUpdate.hours)) {
        alert("Invalid hours value. Please enter a valid number.");
        return;
      }
      
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

  const handleSignOut = () => {
    logout();
    navigate("/signin");
  };

  return (
    <div className="time-entry-container">
      <div className="header-container">
        <a href="#" className="sign-out-link" onClick={(e) => {
          e.preventDefault();
          handleSignOut();
        }}>
          Sign out
        </a>
      </div>
      
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

      <table className="time-entry-table" ref={tableRef}>
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
          {(() => {
            const tableRows: React.ReactElement[] = [];
            
            // First pass: Group entries by date for calculations
            const entriesByDate: { [key: string]: TimeEntry[] } = {};
            for (const entry of entries) {
              if (!entriesByDate[entry.date]) {
                entriesByDate[entry.date] = [];
              }
              // Ensure hours is a number
              const entryWithNumberHours = {
                ...entry,
                hours: typeof entry.hours === 'number' ? entry.hours : Number(entry.hours)
              };
              entriesByDate[entry.date].push(entryWithNumberHours);
            }

            console.log('Entries grouped by date:', entriesByDate);
            
            // Second pass: Process each date group
            const dates = Object.keys(entriesByDate).sort((a, b) => 
              new Date(b).getTime() - new Date(a).getTime()
            );
            
            for (const date of dates) {
              const entriesForDate = entriesByDate[date];
              
              console.log(`Processing date: ${date} with ${entriesForDate.length} entries`);
              
              // Calculate total hours for this date
              let totalHours = 0;
              for (const timeEntry of entriesForDate) {
                const hours = typeof timeEntry.hours === 'number' ? timeEntry.hours : Number(timeEntry.hours);
                if (!isNaN(hours)) {
                  totalHours += hours;
                  console.log(`  Entry ${timeEntry.id}: ${hours}h, running total: ${totalHours}h`);
                }
              }
              
              const remainingHours = Math.max(0, DAILY_HOURS_TARGET - totalHours);
              
              // Format hours with proper decimal places
              const totalHoursFormatted = totalHours.toFixed(2);
              const remainingHoursFormatted = remainingHours.toFixed(2);
              const exceededHoursFormatted = (totalHours - DAILY_HOURS_TARGET).toFixed(2);
              
              // Check if the target is exactly matched (within a small epsilon to handle floating point errors)
              const isTargetMatched = Math.abs(totalHours - DAILY_HOURS_TARGET) < 0.001;
              
              // Add a date header for each date group
              tableRows.push(
                <tr 
                  key={`date-separator-${date}`} 
                  className="date-separator" 
                  data-row-type="date-separator"
                >
                  <td colSpan={2}>{formatDate(date)}</td>
                  <td colSpan={4} className="hours-summary">
                    Total: {totalHoursFormatted} hours | 
                    {remainingHours > 0 
                      ? ` Need ${remainingHoursFormatted} more to reach ${DAILY_HOURS_TARGET} hours`
                      : isTargetMatched
                        ? <span className="target-matched"> Target matched!</span>
                        : ` Exceeded target by ${exceededHoursFormatted} hours`
                    }
                  </td>
                </tr>
              );
              
              // Add all entries for this date
              for (const entry of entriesForDate) {
                // Explicitly set the row class to ensure consistency
                tableRows.push(
                  <tr key={entry.id} className="date-group-even">
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
                );
              }
            }
            
            return tableRows;
          })()}
        </tbody>
      </table>
    </div>
  );
};

export default TimeEntryList;
