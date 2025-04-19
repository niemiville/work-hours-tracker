import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { TimeEntry, fetchTimeEntries, createTimeEntry } from '../api/timeEntryApi';
import '../styles/ImportAndExport.css';

interface ImportAndExportProps {
  onSignOut: () => void;
}

const ImportAndExport: React.FC<ImportAndExportProps> = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingAll, setIsExportingAll] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: number; failed: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Function to fetch and export entries based on optional date parameters
  const fetchAndExportEntries = async (options?: { startDate?: string; endDate?: string }) => {
    setErrorMessage('');
    const isExportingAllEntries = !options;
    
    try {
      // Fetch all entries, potentially filtered by date range
      let allEntries: TimeEntry[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetchTimeEntries(user!.token, page, 100);
        
        // Filter entries by date range if provided
        let filteredEntries = response.entries;
        if (options?.startDate && options?.endDate) {
          filteredEntries = response.entries.filter(entry => {
            const entryDate = new Date(entry.date);
            const start = new Date(options.startDate!);
            const end = new Date(options.endDate!);
            
            // Set time to midnight for accurate date comparison
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            
            return entryDate >= start && entryDate <= end;
          });
        }
        
        allEntries = [...allEntries, ...filteredEntries];
        
        // Check if we need to fetch more pages
        if (response.entries.length === 0 || page * response.limit >= response.totalDates) {
          hasMore = false;
        } else {
          page++;
        }
      }

      if (allEntries.length === 0) {
        setErrorMessage(isExportingAllEntries 
          ? 'No time entries found.' 
          : 'No entries found in the selected date range.');
        return;
      }

      // Sort entries by date in ascending order (oldest first)
      allEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Convert entries to CSV format
      const headers = ['Date', 'TaskType', 'TaskID', 'SubTaskID', 'Hours', 'Description'];
      const csvContent = [
        headers.join('\t'),
        ...allEntries.map(entry => {
          // Format date to ensure it's in YYYY-MM-DD format
          let formattedDate = entry.date;
          if (formattedDate.includes('T')) {
            formattedDate = formattedDate.split('T')[0];
          }
          
          return [
            formattedDate,
            entry.tasktype,
            entry.taskid || '',
            entry.subtaskid || '',
            entry.hours,
            entry.description || ''
          ].join('\t');
        })
      ].join('\n');

      // Create and download the file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `workhours_${user!.name}_${timestamp}.csv`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      // Append the link, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export time entries:', error);
      setErrorMessage('Failed to export time entries. Please try again.');
    }
  };

  const handleExport = async () => {
    if (!user || !startDate || !endDate) {
      setErrorMessage('Please select both start and end dates.');
      return;
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMessage('Start date cannot be after end date.');
      return;
    }

    setIsExporting(true);
    setErrorMessage('');

    try {
      await fetchAndExportEntries({ startDate, endDate });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    if (!user) return;
    
    setIsExportingAll(true);
    setErrorMessage('');
    
    try {
      await fetchAndExportEntries();
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setErrorMessage('');
    }
  };

  const handleImport = async () => {
    if (!user || !importFile) {
      setErrorMessage('Please select a file to import.');
      return;
    }

    setIsImporting(true);
    setErrorMessage('');
    setImportStatus(null);

    try {
      // Read the file content
      const fileContent = await readFileAsText(importFile);
      
      // Parse CSV
      const lines = fileContent.split('\n');
      const headers = lines[0].split('\t');
      
      // Expected headers: Date, TaskType, TaskID, SubTaskID, Hours, Description
      const dateIndex = headers.findIndex(h => h.trim().toLowerCase() === 'date');
      const taskTypeIndex = headers.findIndex(h => h.trim().toLowerCase() === 'tasktype');
      const taskIdIndex = headers.findIndex(h => h.trim().toLowerCase() === 'taskid');
      const subTaskIdIndex = headers.findIndex(h => h.trim().toLowerCase() === 'subtaskid');
      const hoursIndex = headers.findIndex(h => h.trim().toLowerCase() === 'hours');
      const descriptionIndex = headers.findIndex(h => h.trim().toLowerCase() === 'description');
      
      // Validate headers
      if (dateIndex === -1 || taskTypeIndex === -1 || hoursIndex === -1) {
        throw new Error('Invalid CSV format. Required headers: Date, Task Type, Hours');
      }
      
      // Process entries
      const entries = lines.slice(1).filter(line => line.trim() !== '');
      
      let successCount = 0;
      let failedCount = 0;
      
      for (const line of entries) {
        try {
          // Parse CSV line with proper handling of quoted fields
          const values = parseCSVLine(line);
          
          if (!values[dateIndex] || !values[taskTypeIndex] || !values[hoursIndex]) {
            failedCount++;
            continue;
          }
          
          const entry = {
            date: formatDateForAPI(values[dateIndex].trim()),
            tasktype: values[taskTypeIndex].trim(),
            taskid: values[taskIdIndex] ? parseInt(values[taskIdIndex].trim(), 10) || null : null,
            subtaskid: values[subTaskIdIndex] ? parseInt(values[subTaskIdIndex].trim(), 10) || null : null,
            description: values[descriptionIndex] ? values[descriptionIndex].trim() : '',
            hours: parseFloat(values[hoursIndex].trim())
          };
          
          // Validate entry
          if (isNaN(entry.hours) || entry.hours <= 0) {
            failedCount++;
            continue;
          }
          
          // Create the entry
          await createTimeEntry(entry, user.token);
          successCount++;
        } catch (error) {
          failedCount++;
        }
      }
      
      setImportStatus({ success: successCount, failed: failedCount });
      setIsImporting(false);
      
      // Reset file input
      setImportFile(null);
      const fileInput = document.getElementById('csvImport') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Failed to import time entries:', error);
      setErrorMessage(`Failed to import time entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsImporting(false);
    }
  };

  // Helper function to read file content
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Helper function to ensure a date is in YYYY-MM-DD format for the API
  const formatDateForAPI = (dateString: string): string => {
    try {
      // If date is already in YYYY-MM-DD format, return it
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // Try to parse the date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original if can't parse
    }
  };

  // Helper function to parse CSV lines with quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let startIndex = 0;
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === '\t' && !inQuotes) {
        result.push(line.substring(startIndex, i).replace(/^"|"$/g, '').replace(/""/g, '"'));
        startIndex = i + 1;
      }
    }
    
    // Add the last field
    result.push(line.substring(startIndex).replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    return result;
  };

  return (
    <div className="import-export-container">
      <div className="export-section">
        <h2>Export Time Entries</h2>
        <p>Export your time entries to an Excel-compatible CSV file using tab as a separator.</p>
        
        <div className="export-options">
          <div className="export-range">
            <h3 className="export-subheading">Export by Date Range</h3>
            <p>Select a specific time period to export entries:</p>
            
            <div className="date-range-selector">
              <div className="date-input">
                <label htmlFor="startDate">Start Date:</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="date-input">
                <label htmlFor="endDate">End Date:</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              className="export-button"
              onClick={handleExport}
              disabled={isExporting || !startDate || !endDate}
            >
              {isExporting ? 'Exporting...' : 'Export Selected Range'}
            </button>
          </div>
          
          <div className="export-divider">
            <span>OR</span>
          </div>
          
          <div className="export-all">
            <h3 className="export-subheading">Export All Entries</h3>
            <p>Quick export of all your time entries at once:</p>
            
            <button 
              className="export-all-button"
              onClick={handleExportAll}
              disabled={isExportingAll}
            >
              {isExportingAll ? 'Exporting All Entries...' : 'Export All Time Entries'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="import-section">
        <h2>Import Time Entries</h2>
        <p>Import time entries from a tab-separated text file. The file should have the following format:</p>
        <code className="csv-format">Date&#9;TaskType&#9;TaskID&#9;SubTaskID&#9;Hours&#9;Description</code>
        <p className="import-note">Example: 2025-04-20&#9;Development&#9;123&#9;456&#9;2.5&#9;Implemented new feature</p>
        <p className="import-note">For dates, use YYYY-MM-DD format (e.g., 2025-04-20).</p>
        
        <div className="file-input-container">
          <label htmlFor="csvImport" className="file-input-label">
            Select CSV File
          </label>
          <input
            type="file"
            id="csvImport"
            accept=".csv"
            onChange={handleFileChange}
            className="file-input"
          />
          <span className="selected-file">
            {importFile ? importFile.name : 'No file selected'}
          </span>
        </div>
        
        <button 
          className="import-button"
          onClick={handleImport}
          disabled={isImporting || !importFile}
        >
          {isImporting ? 'Importing...' : 'Import from CSV'}
        </button>
        
        {importStatus && (
          <div className="import-status">
            <h3>Import Complete</h3>
            <p>
              Successfully imported: <strong>{importStatus.success}</strong> entries<br />
              Failed to import: <strong>{importStatus.failed}</strong> entries
            </p>
          </div>
        )}
      </div>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default ImportAndExport; 