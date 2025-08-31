import { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import './App.css'; // Import the CSS file for styling

const App = () => {
  const [file, setFile] = useState(null);
  const [summaryLength, setSummaryLength] = useState('medium');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get the API URL from the environment variable.
  // The key has been changed to VITE_API_BASE_URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Dropzone logic to handle file uploads via drag-and-drop
  const onDrop = useCallback((acceptedFiles) => {
    // We only accept the first file if multiple are dropped
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setSummary('');
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

  // Handles the form submission to send the file to the backend
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
      const response = await axios.post(`${API_BASE_URL}/api/summarize`, formData, {
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center font-sans p-4 transition-colors duration-300">
      <div className="container max-w-4xl mx-auto p-4 md:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            📄 Document Summary Assistant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload a PDF or image to get a smart summary.
          </p>
        </header>

        <main className="space-y-6">
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-inner">
            {/* The Dropzone UI */}
            <div
              {...getRootProps({
                className: `dropzone flex justify-center items-center h-48 border-2 border-dashed rounded-lg transition-colors duration-200 cursor-pointer ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-300 dark:border-gray-500 hover:border-blue-500'
                }`,
              })}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-gray-600 dark:text-gray-300">Drop the file here ...</p>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  Drag & drop a document here, or click to select
                </p>
              )}
            </div>
            {file && (
              <p className="file-name mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                Selected file: {file.name}
              </p>
            )}

            <fieldset className="form-group border border-gray-200 dark:border-gray-600 p-4 rounded-lg mt-6">
              <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-200">
                Summary Length
              </legend>
              <div className="radio-group flex flex-col sm:flex-row gap-4 mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="short"
                    checked={summaryLength === 'short'}
                    onChange={(e) => setSummaryLength(e.target.value)}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-200">Short</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="medium"
                    checked={summaryLength === 'medium'}
                    onChange={(e) => setSummaryLength(e.target.value)}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-200">Medium</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="long"
                    checked={summaryLength === 'long'}
                    onChange={(e) => setSummaryLength(e.target.value)}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-200">Long</span>
                </label>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full mt-6 px-4 py-3 text-white font-bold rounded-lg bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Summary'}
            </button>
          </form>

          <div className="result-area mt-8">
            {loading && (
              <div className="flex justify-center items-center">
                <div className="loader"></div>
              </div>
            )}
            {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
            {summary && (
              <div className="summary-result p-6 bg-white dark:bg-gray-700 rounded-xl shadow-inner">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Summary</h2>
                <p style={{ whiteSpace: 'pre-wrap' }} className="text-gray-800 dark:text-gray-200">
                  {summary}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
