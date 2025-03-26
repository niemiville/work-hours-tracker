import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AddTimeEntry from "./AddTimeEntry";
import TimeEntryList from "./TimeEntryList";
import { TimeEntry } from "../api/timeEntryApi";
import "../styles/WorkHoursMaintenance.css";

const WorkHoursMaintenance: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  
  // Current date in ISO format for the add entry form
  const currentDate = new Date().toISOString().split("T")[0];

  // Handle signing out
  const handleSignOut = () => {
    logout();
    navigate("/signin");
  };

  // Callback for when a new entry is added or updated
  const handleEntryChange = () => {
    // Increment refresh trigger to force TimeEntryList to reload
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle setting an entry for editing
  const handleSetEditingEntry = (entry: TimeEntry | null) => {
    setEditingEntry(entry);
  };

  // Handle canceling an edit
  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  // Handle completing an update
  const handleUpdateComplete = () => {
    setEditingEntry(null);
    handleEntryChange();
  };

  // If not authenticated, redirect to sign in
  React.useEffect(() => {
    if (!user) {
      navigate("/signin");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="work-hours-container">
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="app-title">Work Hours Tracker</h1>
        </div>
        <div className="topbar-center">
          <nav className="main-nav">
            <ul>
              <li className="active"><a href="#">Time Entries</a></li>
              <li><a href="#">Reports</a></li>
              <li><a href="#">Settings</a></li>
            </ul>
          </nav>
        </div>
        <div className="topbar-right">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <a href="#" className="sign-out-link" onClick={(e) => {
              e.preventDefault();
              handleSignOut();
            }}>
              Sign out
            </a>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="work-hours-content">
          <h2 className="section-title">Time Entries</h2>
          
          <div className="add-entry-section">
            <h3 className="subsection-title">
              {editingEntry ? "Edit Time Entry" : "Add New Entry"}
            </h3>
            <AddTimeEntry 
              user={user} 
              onEntryAdded={handleEntryChange} 
              currentDate={currentDate}
              editingEntry={editingEntry}
              onCancelEdit={handleCancelEdit}
              onUpdateComplete={handleUpdateComplete}
            />
          </div>
          
          <div className="time-entries-section">
            <h3 className="subsection-title">Your Time Entries</h3>
            <TimeEntryList 
              user={user} 
              onSignOut={handleSignOut}
              onEditEntry={handleSetEditingEntry}
              key={refreshTrigger} // Force re-render when entries change
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkHoursMaintenance; 