import React, { useState, useEffect, useRef } from "react";
import { TimeEntry, createTimeEntry, updateTimeEntry, fetchLatestEntriesBeforeDate } from "../api/timeEntryApi";
import "../styles/TimeEntryList.css";

type TimeEntryForm = Omit<TimeEntry, "id">;

interface AddTimeEntryProps {
  user: { id: number; token: string } | null;
  onEntryAdded: () => void;
  currentDate: string;
  editingEntry: TimeEntry | null;
  onCancelEdit?: () => void;
  onUpdateComplete?: () => void;
}

const AddTimeEntry: React.FC<AddTimeEntryProps> = ({ 
  user, 
  onEntryAdded, 
  currentDate, 
  editingEntry, 
  onCancelEdit,
  onUpdateComplete
}) => {
  const [formData, setFormData] = useState<TimeEntryForm>({
    userid: user?.id || 0,
    date: currentDate,
    tasktype: "",
    taskid: null,
    subtaskid: null,
    description: "",
    hours: 0,
  });
  
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [hoursInputValue, setHoursInputValue] = useState<string>('');
  const formRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'text'>('form');
  const [textInput, setTextInput] = useState<string>('');

  // Update form when editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      // First update the data without triggering the edit mode visual change
      setFormData({
        userid: editingEntry.userid,
        date: editingEntry.date,
        tasktype: editingEntry.tasktype,
        taskid: editingEntry.taskid,
        subtaskid: editingEntry.subtaskid,
        description: editingEntry.description,
        hours: editingEntry.hours
      });
      
      // Update hours input value
      setHoursInputValue(String(editingEntry.hours));
      
      // Force a reflow before changing the mode
      if (formRef.current) {
        void formRef.current.offsetHeight;
      }
      
      // Then set edit mode for visual styling
      setIsEditMode(true);
    } else {
      // When exiting edit mode
      setIsEditMode(false);
      
      // Wait for transition to complete before resetting form data
      setTimeout(() => {
        setFormData({
          userid: user?.id || 0,
          date: currentDate,
          tasktype: "",
          taskid: null,
          subtaskid: null,
          description: "",
          hours: 0,
        });
        
        // Clear hours input value
        setHoursInputValue('');
        
        // Reset the task ID input fields if they exist
        const taskIdInput = document.querySelector('input[name="taskid"]') as HTMLInputElement;
        if (taskIdInput) {
          taskIdInput.value = '';
        }
        const subtaskIdInput = document.querySelector('input[name="subtaskid"]') as HTMLInputElement;
        if (subtaskIdInput) {
          subtaskIdInput.value = '';
        }
      }, 50); // Small delay to prevent jarring transition
    }
  }, [editingEntry, user, currentDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for hours
    if (name === 'hours') {
      // Store the raw input value for display
      setHoursInputValue(value);
      
      // Convert to number for form data
      // If empty, set to 0 but keep display value empty
      const numValue = value === '' ? 0 : parseFloat(value.replace(',', '.'));
      
      // Only update if it's a valid number
      if (!isNaN(numValue)) {
        setFormData((prev) => ({ ...prev, hours: numValue }));
      }
      return;
    }
    
    setFormData((prev) => ({ 
      ...prev, 
      [name]: (name === 'taskid' || name === 'subtaskid') ? (value === '' ? null : Number(value)) : value 
    }));
  };
  
  // Focus handler for hours field to highlight all content when focused
  const handleHoursFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const isFormValid = () => {
    return formData.date && 
           formData.tasktype.trim() && 
           formData.hours > 0;
  };

  const handleCreate = async () => {
    if (!formData || !user) return;

    // Validate required fields
    if (!formData.date || !formData.tasktype.trim()) {
      alert("Please fill in both Date and Task Type fields");
      return;
    }

    // Validate hours is not negative or zero
    if (formData.hours <= 0) {
      alert("Hours cannot be negative or zero");
      return;
    }

    try {
      const entryData = {
        date: formData.date,
        tasktype: formData.tasktype,
        taskid: formData.taskid,
        subtaskid: formData.subtaskid,
        description: formData.description,
        // Ensure hours is a number
        hours: typeof formData.hours === 'number' ? formData.hours : parseFloat(String(formData.hours))
      };
      
      // Final check that hours is a valid number
      if (isNaN(entryData.hours)) {
        alert("Invalid hours value. Please enter a valid number.");
        return;
      }
      
      await createTimeEntry(entryData, user.token);
      
      // Notify parent component to refresh entries
      onEntryAdded();
      
      // Reset form but keep the date
      setFormData({ 
        userid: user.id, 
        date: formData.date, 
        tasktype: "", 
        taskid: null,
        subtaskid: null, 
        description: "", 
        hours: 0 
      });
      
      // Clear hours input value
      setHoursInputValue('');
      
      // Reset the task ID input fields
      const taskIdInput = document.querySelector('input[name="taskid"]') as HTMLInputElement;
      if (taskIdInput) {
        taskIdInput.value = '';
      }
      const subtaskIdInput = document.querySelector('input[name="subtaskid"]') as HTMLInputElement;
      if (subtaskIdInput) {
        subtaskIdInput.value = '';
      }
    } catch (error) {
      console.error("Failed to create time entry:", error);
      alert("Failed to create time entry. Please try again.");
    }
  };

  const handleUpdate = async () => {
    if (!editingEntry || !user) return;

    // Perform the same validations as in create
    if (!formData.date || !formData.tasktype.trim()) {
      alert("Please fill in both Date and Task Type fields");
      return;
    }

    if (formData.hours <= 0) {
      alert("Hours cannot be negative or zero");
      return;
    }

    try {
      const entryToUpdate = {
        date: formData.date,
        tasktype: formData.tasktype,
        taskid: formData.taskid,
        subtaskid: formData.subtaskid,
        description: formData.description,
        hours: typeof formData.hours === 'number' ? formData.hours : parseFloat(String(formData.hours))
      };

      // Final check that hours is a valid number
      if (isNaN(entryToUpdate.hours)) {
        alert("Invalid hours value. Please enter a valid number.");
        return;
      }
      
      await updateTimeEntry(editingEntry.id, entryToUpdate, user.token);
      
      // Clear hours input value
      setHoursInputValue('');
      
      // Notify parent component about the update
      if (onUpdateComplete) {
        onUpdateComplete();
      }
    } catch (error) {
      console.error("Failed to update time entry:", error);
      alert("Failed to update time entry. Please try again.");
    }
  };

  const handleDuplicateYesterday = async () => {
    if (!user) return;
    
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Fetch the latest entries before today
      const result = await fetchLatestEntriesBeforeDate(todayStr, user.token);
      
      if (result.entries.length === 0 || !result.latestDate) {
        alert("No previous entries found to duplicate.");
        return;
      }
      
      // Format the date for display
      const latestDate = new Date(result.latestDate);
      const formattedDate = latestDate.toLocaleDateString();
      
      // Confirm duplication
      if (!window.confirm(`Duplicate ${result.entries.length} entries from ${formattedDate} to today?`)) {
        return;
      }
      
      // Create new entries for each of the previous entries
      for (const entry of result.entries) {
        const newEntry = {
          date: todayStr,
          tasktype: entry.tasktype,
          taskid: entry.taskid,
          subtaskid: entry.subtaskid,
          description: entry.description,
          hours: entry.hours
        };
        
        await createTimeEntry(newEntry, user.token);
      }
      
      // Notify parent component to refresh entries
      onEntryAdded();
      
    } catch (error) {
      console.error("Failed to duplicate previous entries:", error);
      alert("Failed to duplicate previous entries. Please try again.");
    }
  };

  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const parseTextInput = (text: string): TimeEntryForm[] => {
    const lines = text.trim().split('\n');
    return lines.map(line => {
      // First try splitting on tabs
      const tabParts = line.split('\t');
      
      if (tabParts.length >= 5) {
        const [date, tasktype, taskid, subtaskid, hours, ...descriptionParts] = tabParts;
        // Validate and format date
        const formattedDate = validateAndFormatDate(date);
        return {
          userid: user?.id || 0,
          date: formattedDate || currentDate,
          tasktype: tasktype || '',
          taskid: taskid ? Number(taskid) : null,
          subtaskid: subtaskid ? Number(subtaskid) : null,
          hours: hours ? parseFloat(hours.replace(',', '.')) : 0,
          description: descriptionParts.join('\t')
        };
      }
      
      // If tab splitting didn't work, try splitting on spaces
      const spaceParts = line.split(/\s+/);
      if (spaceParts.length >= 5) {
        const [date, tasktype, taskid, subtaskid, hours, ...descriptionParts] = spaceParts;
        // Validate and format date
        const formattedDate = validateAndFormatDate(date);
        return {
          userid: user?.id || 0,
          date: formattedDate || currentDate,
          tasktype: tasktype || '',
          taskid: taskid ? Number(taskid) : null,
          subtaskid: subtaskid ? Number(subtaskid) : null,
          hours: hours ? parseFloat(hours.replace(',', '.')) : 0,
          description: descriptionParts.join(' ')
        };
      }
      
      // If we can't parse it properly, return a default entry
      return {
        userid: user?.id || 0,
        date: currentDate,
        tasktype: '',
        taskid: null,
        subtaskid: null,
        hours: 0,
        description: ''
      };
    });
  };

  const validateAndFormatDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    // Check if the date is in YYYY-MM-DD format
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = dateStr.match(dateRegex);
    
    if (match) {
      const [_, year, month, day] = match;
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      
      // Basic validation of date components
      if (yearNum < 1000 || yearNum > 9999) return null;
      if (monthNum < 1 || monthNum > 12) return null;
      if (dayNum < 1 || dayNum > 31) return null;
      
      // Return the original string if it passes basic validation
      return dateStr;
    }
    
    return null;
  };

  const handleTextSubmit = async () => {
    if (!user) return;

    const entries = parseTextInput(textInput);
    const validEntries = entries.filter(entry => 
      entry.date && 
      entry.tasktype.trim() && 
      entry.hours > 0
    );

    if (validEntries.length === 0) {
      alert("No valid entries found. Please check your input format.");
      return;
    }

    try {
      for (const entry of validEntries) {
        await createTimeEntry(entry, user.token);
      }
      onEntryAdded();
      setTextInput('');
    } catch (error) {
      console.error("Failed to create time entries:", error);
      alert("Failed to create time entries. Please try again.");
    }
  };

  return (
    <div 
      ref={formRef}
      className={`form-container ${isEditMode ? 'edit-mode' : 'add-mode'}`}
    >
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          Form View
        </button>
        <button 
          className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          Text Input
        </button>
      </div>

      {activeTab === 'form' ? (
        <>
          <div className="input-row">
            <div>
              <label>Date</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label>Task Type</label>
              <input 
                type="text" 
                name="tasktype" 
                value={formData.tasktype} 
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label>Task ID</label>
              <input 
                type="number" 
                name="taskid" 
                value={formData.taskid || ''} 
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label>Sub Task ID</label>
              <input 
                type="number" 
                name="subtaskid" 
                value={formData.subtaskid || ''} 
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label>Hours</label>
              <input 
                type="text" 
                name="hours" 
                placeholder="0.00"
                value={hoursInputValue} 
                onChange={handleInputChange}
                onFocus={handleHoursFocus}
              />
            </div>
          </div>

          <div className="description-row">
            <label>Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange}
            />
          </div>

          <div className="form-actions">
            {isEditMode ? (
              <>
                <button 
                  className="save-button" 
                  onClick={handleUpdate}
                  disabled={!isFormValid()}
                >
                  Save Changes
                </button>
                <button 
                  className="cancel-button" 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button 
                  className="duplicate-yesterday-button" 
                  onClick={handleDuplicateYesterday}
                >
                  Duplicate previous day
                </button>
                <button 
                  className="add-button" 
                  onClick={handleCreate}
                  disabled={!isFormValid()}
                >
                  Add entry
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="text-input-container">
          <div className="text-input-header">
            <p>Enter entries in tab-separated format (one per line):</p>
            <p>Date TaskType TaskID SubTaskID Hours Description</p>
          </div>
          <textarea
            className="text-input"
            value={textInput}
            onChange={handleTextInputChange}
            placeholder="2024-03-20&#9;Development&#9;123&#9;456&#9;2.5&#9;Implemented new feature"
            rows={10}
          />
          <div className="form-actions">
            <button 
              className="add-button" 
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
            >
              Add Entries
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTimeEntry; 