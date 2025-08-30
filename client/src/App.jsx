// src/App.jsx

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone'; // Import the hook
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [summaryLength, setSummaryLength] = useState('medium');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- New Dropzone Logic ---
  const onDrop = useCallback((acceptedFiles) => {
    // We only accept the first file if multiple are dropped
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setSummary(''); // Clear previous results
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    multiple: false, // Ensure only one file is accepted
  });
  // --- End of New Dropzone Logic ---

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setSummary('');
    setError('');

    const formData = new FormData();
    formData.append('document', file);
    formData.append('summaryLength', summaryLength);

    try {
      const response = await axios.post('http://localhost:5000/api/summarize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSummary(response.data.summary);
    } catch (err) {
      setError('An error occurred while generating the summary. Please try again.');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>📄 Document Summary Assistant</h1>
        <p>Upload a PDF or image to get a smart summary.</p>
      </header>

      <main>
        <form onSubmit={handleSubmit}>
          {/* --- This is the new Dropzone UI --- */}
          <div {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the file here ...</p>
            ) : (
              <p>Drag & drop a document here, or click to select</p>
            )}
          </div>
          {file && <p className="file-name">Selected file: {file.name}</p>}
          {/* --- End of Dropzone UI --- */}
          
          <fieldset className="form-group">
            {/* ... (The radio buttons for summary length remain the same) ... */}
            <legend>Summary Length</legend>
            <div className="radio-group">
              <label>
                <input type="radio" value="short" checked={summaryLength === 'short'} onChange={(e) => setSummaryLength(e.target.value)} />
                Short
              </label>
              <label>
                <input type="radio" value="medium" checked={summaryLength === 'medium'} onChange={(e) => setSummaryLength(e.target.value)} />
                Medium
              </label>
              <label>
                <input type="radio" value="long" checked={summaryLength === 'long'} onChange={(e) => setSummaryLength(e.target.value)} />
                Long
              </label>
            </div>
          </fieldset>
          
          <button type="submit" disabled={!file || loading}>
            {loading ? 'Generating...' : 'Generate Summary'}
          </button>
        </form>

        <div className="result-area">
          {/* ... (The display area remains the same) ... */}
          {loading && <div className="loader"></div>}
          {error && <div className="error-message">{error}</div>}
          {summary && (
            <div className="summary-result">
              <h2>Summary</h2>
              <p style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;