import React, { useEffect, useState, useRef } from "react";
import { TimeEntry, fetchTimeEntries, deleteTimeEntry, createTimeEntry } from "../api/timeEntryApi";
import "../styles/TimeEntryList.css";

// Daily hours target constant
const DAILY_HOURS_TARGET = 7.5;

interface TimeEntryListProps {
  user: { id: number; token: string } | null;
  onSignOut: () => void;
  onEditEntry: (entry: TimeEntry | null) => void;
}

const TimeEntryList: React.FC<TimeEntryListProps> = ({ user, onEditEntry }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreDates, setHasMoreDates] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadedEntryIds, setLoadedEntryIds] = useState<Set<number>>(new Set());
  const tableRef = useRef<HTMLTableElement>(null);
  const loadingRef = useRef<boolean>(false);

  const loadEntries = async (page: number = 1, append: boolean = false) => {
    if (!user || isLoading || loadingRef.current) return;
    
    // Set a ref to prevent concurrent loading requests
    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      const data = await fetchTimeEntries(user.token, page);
      
      // Process entries to ensure hours is always a number
      const processedData = data.entries.map((entry: any) => ({
        ...entry,
        hours: typeof entry.hours === 'number' ? entry.hours : Number(entry.hours) || 0
      }));
      
      // If no entries were returned, we've reached the end
      if (processedData.length === 0) {
        setHasMoreDates(false);
        loadingRef.current = false;
        setIsLoading(false);
        return;
      }
      
      if (append) {
        // Filter out entries we already have by ID (most reliable way)
        const newEntries = processedData.filter(entry => !loadedEntryIds.has(entry.id));
        
        // If we didn't get any new entries, we've reached the end
        if (newEntries.length === 0) {
          setHasMoreDates(false);
          loadingRef.current = false;
          setIsLoading(false);
          return;
        }
        
        // Add new entries to our list
        setEntries(prev => [...prev, ...newEntries]);
        
        // Update the set of loaded entry IDs
        const updatedEntryIds = new Set(loadedEntryIds);
        newEntries.forEach(entry => updatedEntryIds.add(entry.id));
        setLoadedEntryIds(updatedEntryIds);
      } else {
        // For a fresh load, reset everything
        setEntries(processedData);
        
        // Reset loaded entry IDs tracking
        const newEntryIds = new Set(processedData.map(entry => entry.id));
        setLoadedEntryIds(newEntryIds);
      }
      
      setCurrentPage(data.page);
      
      // Check if we've loaded all dates based on backend info
      setHasMoreDates(data.page * data.limit < data.totalDates);
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMoreDates) {
      loadEntries(currentPage + 1, true);
    }
  };

  useEffect(() => {
    if (user) {
      loadEntries(1, false);
    }
  }, [user]);

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

  const handleEdit = (entry: TimeEntry) => {
    // Pass the entry to the parent component for editing
    onEditEntry(entry);
    
    // Scroll to the top of the page to show the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Enhanced date formatter to include weekday in English and week number
  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    
    // Get weekday name in English
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekday = weekdays[dateObj.getDay()];
    
    // Get date in Finnish format
    const formattedDate = dateObj.toLocaleDateString("fi-FI");
    
    // Calculate ISO week number (week with 4 or more days in January is week 1)
    const getWeekNumber = (d: Date): number => {
      // Copy date so don't modify original
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      // Set to nearest Thursday: current date + 4 - current day number
      // Make Sunday's day number 7
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      // Get first day of year
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      // Calculate full weeks to nearest Thursday
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return weekNo;
    };
    
    const weekNumber = getWeekNumber(dateObj);
    
    return `${weekday} ${formattedDate} | Week ${weekNumber}`;
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }
    
    try {
      await deleteTimeEntry(id, user.token);
      
      // Remove the entry ID from our loaded set
      const updatedIds = new Set(loadedEntryIds);
      updatedIds.delete(id);
      setLoadedEntryIds(updatedIds);
      
      // Remove the entry from local state
      setEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id));
      
      // If this empties a date group completely, we should reload
      // to ensure our view is complete and consistent
      const remainingDates = new Set(entries.filter(entry => entry.id !== id).map(entry => entry.date));
      if (remainingDates.size < new Set(entries.map(entry => entry.date)).size) {
        setLoadedEntryIds(new Set());
        loadEntries(1, false);
      }
    } catch (error) {
      console.error("Failed to delete time entry:", error);
      alert("Failed to delete time entry. Please try again.");
    }
  };

  const handleDuplicate = async (entry: TimeEntry) => {
    if (!user) return;
    
    try {
      const duplicateEntry = {
        date: new Date().toISOString().split('T')[0], // Use today's date
        tasktype: entry.tasktype,
        taskid: entry.taskid,
        description: entry.description,
        hours: entry.hours
      };
      
      await createTimeEntry(duplicateEntry, user.token);
      
      // Reset and reload everything to ensure consistent state
      setLoadedEntryIds(new Set());
      loadEntries(1, false);
    } catch (error) {
      console.error("Failed to duplicate time entry:", error);
      alert("Failed to duplicate time entry. Please try again.");
    }
  };

  return (
    <div>
      {entries.length === 0 && !isLoading ? (
        <div className="no-entries">No time entries found. Add your first entry above.</div>
      ) : (
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
              
              // Second pass: Process each date group
              const dates = Object.keys(entriesByDate).sort((a, b) => 
                new Date(b).getTime() - new Date(a).getTime()
              );
              
              for (const date of dates) {
                const entriesForDate = entriesByDate[date];
                
                // Calculate total hours for this date
                let totalHours = 0;
                for (const timeEntry of entriesForDate) {
                  const hours = typeof timeEntry.hours === 'number' ? timeEntry.hours : Number(timeEntry.hours);
                  if (!isNaN(hours)) {
                    totalHours += hours;
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
                      <td>{new Date(entry.date).toLocaleDateString("fi-FI")}</td>
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
      )}

      {/* Load more button */}
      {hasMoreDates && (
        <div className="load-more-container">
          <button 
            className="load-more-button" 
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load more dates'}
          </button>
        </div>
      )}
      
      {!hasMoreDates && entries.length > 0 && (
        <div className="end-of-content">No more entries to load</div>
      )}
    </div>
  );
};

export default TimeEntryList;
