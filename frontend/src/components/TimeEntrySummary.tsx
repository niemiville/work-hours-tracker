import React, { useState, useEffect } from 'react';
import { fetchEntriesByDate } from '../api/timeEntryApi';
import { useAuth } from './AuthContext';
import '../styles/TimeEntrySummary.css';

// Daily target hours constant
const DAILY_TARGET_HOURS = 7.5;

interface TaskSummary {
  taskType: string;
  taskId: number | string;
  totalHours: number;
}

interface DailySummary {
  date: string;
  weekNumber: number;
  totalHours: number;
  taskSummaries: TaskSummary[];
}

const TimeEntrySummary: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchSummary();
    }
  }, [selectedDate, user]);

  const fetchSummary = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const entries = await fetchEntriesByDate(selectedDate, user.token);
      
      // Create a map to group entries by task ID and type
      const taskSummariesMap = new Map();
      let totalHours = 0;
      
      // Process entries if they exist
      if (entries && Array.isArray(entries)) {
        entries.forEach(entry => {
          // Ensure entry.hours is a number
          const hours = typeof entry.hours === 'number' ? entry.hours : Number(entry.hours) || 0;
          
          // Add to total hours
          totalHours += hours;
          
          // Create a unique key for task type + id combination
          const key = entry.taskid !== null && entry.taskid !== undefined
            ? `${entry.tasktype}-${entry.taskid}`
            : `${entry.tasktype}-null-${Math.random()}`; // For entries without taskid, create unique keys
          
          // If this is a task without ID or we want to display each entry separately,
          // we'll create a unique key for it
          if (taskSummariesMap.has(key)) {
            // Task already exists, add hours
            const existingTask = taskSummariesMap.get(key);
            existingTask.totalHours += hours;
            taskSummariesMap.set(key, existingTask);
          } else {
            // Create new task summary
            taskSummariesMap.set(key, {
              taskType: entry.tasktype,
              taskId: entry.taskid !== null ? entry.taskid : '', // Use empty for null taskid
              totalHours: hours
            });
          }
        });
      }
      
      // Convert map to array
      const taskSummaries = Array.from(taskSummariesMap.values());
      
      // Calculate week number
      const date = new Date(selectedDate);
      const weekNumber = getWeekNumber(date);
      
      setSummary({
        date: selectedDate,
        weekNumber,
        totalHours: Number(totalHours) || 0,
        taskSummaries
      });
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getMissingHours = (totalHours: number): number => {
    return Math.max(0, DAILY_TARGET_HOURS - totalHours);
  };

  const getExceedingHours = (totalHours: number): number => {
    return Math.max(0, totalHours - DAILY_TARGET_HOURS);
  };

  // Check if total hours exceeds the daily target
  const isExceeding = (totalHours: number): boolean => {
    return totalHours > DAILY_TARGET_HOURS;
  };

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>Daily Summary</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-selector"
        />
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : summary ? (
        <div className="summary-content">
          <div className="summary-meta">
            <div className="meta-item">
              <span className="meta-label">Week:</span>
              <span className="meta-value">{summary.weekNumber}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Total Hours:</span>
              <span className="meta-value">{typeof summary.totalHours === 'number' ? summary.totalHours.toFixed(1) : '0.0'}</span>
            </div>
            
            {typeof summary.totalHours === 'number' && (
              isExceeding(summary.totalHours) ? (
                <div className="meta-item exceeding">
                  <span className="meta-label">Exceeding Hours:</span>
                  <span className="meta-value">{getExceedingHours(summary.totalHours).toFixed(1)}</span>
                </div>
              ) : (
                <div className="meta-item missing">
                  <span className="meta-label">Missing Hours:</span>
                  <span className="meta-value">{getMissingHours(summary.totalHours).toFixed(1)}</span>
                </div>
              )
            )}
          </div>

          <div className="task-summary-table">
            <table>
              <thead>
                <tr>
                  <th>Task Type</th>
                  <th>Task ID</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {summary.taskSummaries.map((task, index) => (
                  <tr key={`${task.taskType}-${task.taskId}-${index}`}>
                    <td>{task.taskType}</td>
                    <td>{String(task.taskId)}</td>
                    <td>{typeof task.totalHours === 'number' ? task.totalHours.toFixed(1) : '0.0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-data">No data available for the selected date</div>
      )}
    </div>
  );
};

export default TimeEntrySummary; 