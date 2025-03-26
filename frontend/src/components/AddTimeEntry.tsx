import React, { useState, useEffect, useRef } from "react";
import { TimeEntry, CreateTimeEntryRequest, createTimeEntry, updateTimeEntry } from "../api/timeEntryApi";
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
    description: "",
    hours: 0,
  });
  
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Update form when editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      // First update the data without triggering the edit mode visual change
      setFormData({
        userid: editingEntry.userid,
        date: editingEntry.date,
        tasktype: editingEntry.tasktype,
        taskid: editingEntry.taskid,
        description: editingEntry.description,
        hours: editingEntry.hours
      });
      
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
          description: "",
          hours: 0,
        });
        
        // Reset the task ID input field if it exists
        const taskIdInput = document.querySelector('input[name="taskid"]') as HTMLInputElement;
        if (taskIdInput) {
          taskIdInput.value = '';
        }
      }, 50); // Small delay to prevent jarring transition
    }
  }, [editingEntry, user, currentDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for hours to ensure it's always a number
    if (name === 'hours') {
      const numValue = value === '' ? 0 : Number(value);
      setFormData((prev) => ({ ...prev, hours: numValue }));
      return;
    }
    
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'taskid' ? (value === '' ? null : Number(value)) : value 
    }));
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
        description: formData.description,
        hours: typeof formData.hours === 'number' ? formData.hours : parseFloat(String(formData.hours))
      };

      // Final check that hours is a valid number
      if (isNaN(entryToUpdate.hours)) {
        alert("Invalid hours value. Please enter a valid number.");
        return;
      }
      
      await updateTimeEntry(editingEntry.id, entryToUpdate, user.token);
      
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
    // This functionality would duplicate yesterday's entries
    // Implemented in the future
  };

  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div 
      ref={formRef}
      className={`form-container ${isEditMode ? 'edit-mode' : 'add-mode'}`}
    >
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
          <label>Hours</label>
          <input 
            type="number" 
            name="hours" 
            step="0.25" 
            value={formData.hours} 
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div>
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
              Duplicate yesterday
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
    </div>
  );
};

export default AddTimeEntry; 