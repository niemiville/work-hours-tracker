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