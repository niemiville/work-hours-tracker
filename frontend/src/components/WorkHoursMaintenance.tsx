import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AddTimeEntry from "./AddTimeEntry";
import TimeEntryList from "./TimeEntryList";
import ImportAndExport from "./ImportAndExport";
import Stats from "./Stats";
import TimeEntrySummary from "./TimeEntrySummary";
import { TimeEntry } from "../api/timeEntryApi";
import "../styles/WorkHoursMaintenance.css";

type ActiveView = 'time-entries' | 'import-export' | 'stats' | 'summary';

const WorkHoursMaintenance: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('time-entries');
  
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

  // Switch between views
  const switchView = (view: ActiveView) => {
    setActiveView(view);
    // If switching away from time entries, clear any editing state
    if (view !== 'time-entries') {
      setEditingEntry(null);
    }
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
              <li className={activeView === 'time-entries' ? 'active' : ''}>
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  switchView('time-entries');
                }}>
                  Time Entries
                </a>
              </li>
              <li className={activeView === 'import-export' ? 'active' : ''}>
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  switchView('import-export');
                }}>
                  Import/Export
                </a>
              </li>
              <li className={activeView === 'stats' ? 'active' : ''}>
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  switchView('stats');
                }}>
                  Statistics
                </a>
              </li>
              <li className={activeView === 'summary' ? 'active' : ''}>
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  switchView('summary');
                }}>
                  Summary
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="topbar-right">
          <div className="user-info">
            <span className="user-name">{user.displayname}</span>
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
          {activeView === 'time-entries' ? (
            <>
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
                <div className="quick-actions">
                  <button 
                    className="quick-export-button"
                    onClick={() => switchView('import-export')}
                  >
                    Export Time Entries
                  </button>
                  <button 
                    className="quick-stats-button"
                    onClick={() => switchView('stats')}
                  >
                    View Statistics
                  </button>
                </div>
              </div>
            </>
          ) : activeView === 'import-export' ? (
            <>
              <h2 className="section-title">Import & Export</h2>
              <ImportAndExport onSignOut={handleSignOut} />
            </>
          ) : activeView === 'stats' ? (
            <>
              <h2 className="section-title">Statistics</h2>
              <Stats onSignOut={handleSignOut} />
            </>
          ) : (
            <>
              <h2 className="section-title">Daily Summary</h2>
              <TimeEntrySummary />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkHoursMaintenance; 