import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { 
  fetchStatsByTaskId, 
  fetchStatsByTaskType, 
  fetchStatsSummary,
  fetchLast30DaysStats,
  TaskTypeStatsResponse,
  StatsSummary,
  Last30DaysStats,
  TaskIdStatsResponse
} from "../api/statsApi";
import { fetchTimeEntries, TimeEntry } from "../api/timeEntryApi";
import "../styles/Stats.css";

interface StatsProps {
  onSignOut: () => void;
}

const Stats: React.FC<StatsProps> = ({}) => {
  const { user } = useAuth();
  const [taskIdStats, setTaskIdStats] = useState<TaskIdStatsResponse | null>(null);
  const [taskTypeStats, setTaskTypeStats] = useState<TaskTypeStatsResponse | null>(null);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [last30DaysStats, setLast30DaysStats] = useState<Last30DaysStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTaskId, setSearchTaskId] = useState<string>("");
  const [searchSubTaskId, setSearchSubTaskId] = useState<string>("");
  const [searchResults, setSearchResults] = useState<TimeEntry[]>([]);
  const [searchTotalHours, setSearchTotalHours] = useState<number>(0);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !user.token) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch all stats in parallel
        const [taskIdData, taskTypeData, summaryData, last30DaysData] = await Promise.all([
          fetchStatsByTaskId(user.token),
          fetchStatsByTaskType(user.token),
          fetchStatsSummary(user.token),
          fetchLast30DaysStats(user.token)
        ]);

        setTaskIdStats(taskIdData);
        setTaskTypeStats(taskTypeData);
        setSummary(summaryData);
        setLast30DaysStats(last30DaysData);
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError("Failed to fetch statistics. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const handleSearch = async () => {
    if (!user || !user.token) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      // Fetch all entries (up to 1000, adjust if needed)
      let allEntries: TimeEntry[] = [];
      let page = 1;
      const limit = 100;
      let keepFetching = true;
      while (keepFetching && allEntries.length < 1000) {
        const res = await fetchTimeEntries(user.token, page, limit);
        if (res.entries.length === 0) break;
        allEntries = allEntries.concat(res.entries);
        if (res.entries.length < limit) keepFetching = false;
        page++;
      }
      // Filter by Task ID or Sub Task ID
      const filtered = allEntries.filter(e =>
        (searchTaskId && e.taskid?.toString() === searchTaskId) ||
        (searchSubTaskId && e.subtaskid?.toString() === searchSubTaskId)
      );
      const limited = filtered.slice(0, 100);
      setSearchResults(limited);
      setSearchTotalHours(limited.reduce((sum, e) => sum + Number(e.hours), 0));
    } catch (err) {
      setSearchError("Failed to search entries.");
    } finally {
      setSearchLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="stats-container">
        <div className="loading-indicator">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      {/* Summary Section */}
      <div className="stats-section summary-section">
        <h2>Summary</h2>
        {summary && (
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Hours</h3>
              <div className="summary-value">{summary.totalHours.toFixed(2)}</div>
            </div>
            <div className="summary-card">
              <h3>Work Days</h3>
              <div className="summary-value">{summary.totalDays}</div>
            </div>
            <div className="summary-card">
              <h3>Avg Hours/Day</h3>
              <div className="summary-value">{summary.avgHoursPerDay.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

            {/* Search by Task ID or Sub Task ID */}
      <div className="stats-section">
        <h2>Search by Task ID or Sub Task ID</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Task ID"
            value={searchTaskId}
            onChange={e => setSearchTaskId(e.target.value)}
            style={{ width: 100 }}
          />
          <span>or</span>
          <input
            type="text"
            placeholder="Sub Task ID"
            value={searchSubTaskId}
            onChange={e => setSearchSubTaskId(e.target.value)}
            style={{ width: 100 }}
          />
          <button onClick={handleSearch} disabled={searchLoading || (!searchTaskId && !searchSubTaskId)}>
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>
        {searchError && <div className="error-message">{searchError}</div>}
        {searchResults.length > 0 ? (
          <>
            <div className="period-summary">
              Total hours for this task: <strong>{Number(searchTotalHours).toFixed(2)}</strong>
            </div>
            <div className="stats-table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Task Type</th>
                    <th>Task ID</th>
                    <th>Sub Task ID</th>
                    <th>Description</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(entry => (
                    <tr key={entry.id}>
                      <td>{entry.date ? new Date(entry.date).toLocaleDateString("fi-FI") : ""}</td>
                      <td>{entry.tasktype}</td>
                      <td>{entry.taskid}</td>
                      <td>{entry.subtaskid}</td>
                      <td>{entry.description}</td>
                      <td>{Number(entry.hours).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          (searchTaskId || searchSubTaskId) && !searchLoading && <p className="no-data-message">No entries found for this Task ID or Sub Task ID.</p>
        )}
      </div>

      {/* Task Type Statistics */}
      <div className="stats-section">
        <h2>Hours by Task Type</h2>
        {taskTypeStats && taskTypeStats.taskTypes.length > 0 ? (
          <div className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Task Type</th>
                  <th>Hours</th>
                  <th>Percentage</th>
                  <th>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {taskTypeStats.taskTypes.map((stat, index) => (
                  <tr key={index}>
                    <td>{stat.tasktype}</td>
                    <td>{parseFloat(stat.hours.toString()).toFixed(2)}</td>
                    <td>{parseFloat(stat.percentage.toString()).toFixed(2)}%</td>
                    <td className="bar-cell">
                      <div className="table-bar-wrapper">
                        <div 
                          className="percentage-bar"
                          style={{ width: `${parseFloat(stat.percentage.toString())}%` }}
                          title={`${parseFloat(stat.hours.toString()).toFixed(2)} hours (${parseFloat(stat.percentage.toString()).toFixed(2)}%)`}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data-message">No task type data available.</p>
        )}
      </div>

      {/* Last 30 Days Task ID Statistics */}
      <div className="stats-section">
        <h2>Last 30 Days Task ID Statistics</h2>
        {last30DaysStats && last30DaysStats.taskStats.length > 0 ? (
          <>
            <div className="period-summary">
              Total hours in the last 30 days: <strong>{last30DaysStats.totalHours.toFixed(2)}</strong>
            </div>
            
            <div className="stats-table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Hours</th>
                    <th>Percentage</th>
                    <th>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {last30DaysStats.taskStats.map((stat, index) => (
                    <tr key={index}>
                      <td>{stat.taskid}</td>
                      <td>{parseFloat(stat.hours.toString()).toFixed(2)}</td>
                      <td>{parseFloat(stat.percentage.toString()).toFixed(2)}%</td>
                      <td className="bar-cell">
                        <div className="table-bar-wrapper">
                          <div 
                            className="percentage-bar recent-bar"
                            style={{ width: `${parseFloat(stat.percentage.toString())}%` }}
                            title={`${parseFloat(stat.hours.toString()).toFixed(2)} hours (${parseFloat(stat.percentage.toString()).toFixed(2)}%)`}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="no-data-message">No recent task data available for the last 30 days.</p>
        )}
      </div>

      {/* Task ID Statistics (All Time) */}
      <div className="stats-section">
        <h2>Hours by Task ID (All Time) - Top 100</h2>
        {taskIdStats && taskIdStats.taskStats && taskIdStats.taskStats.length > 0 ? (
          <>
            <div className="period-summary">
              Total hours across all time: <strong>{taskIdStats.totalHours.toFixed(2)}</strong>
            </div>
            
            <div className="stats-table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Hours</th>
                    <th>Percentage</th>
                    <th>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {taskIdStats.taskStats.map((stat, index) => (
                    <tr key={index}>
                      <td>{stat.taskid}</td>
                      <td>{parseFloat(stat.hours.toString()).toFixed(2)}</td>
                      <td>{parseFloat(stat.percentage.toString()).toFixed(2)}%</td>
                      <td className="bar-cell">
                        <div className="table-bar-wrapper">
                          <div 
                            className="percentage-bar all-time-bar"
                            style={{ width: `${parseFloat(stat.percentage.toString())}%` }}
                            title={`${parseFloat(stat.hours.toString()).toFixed(2)} hours (${parseFloat(stat.percentage.toString()).toFixed(2)}%)`}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="no-data-message">No task ID data available.</p>
        )}
      </div>
    </div>
  );
};

export default Stats;