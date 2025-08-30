// server/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables. In a production environment like Render,
// these are provided via the dashboard and this line is primarily for local development.
dotenv.config({ path: path.join(__dirname, '.env') });

// Ensure the API key is available before proceeding. This is critical for deployment.
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

// --- Initialize AI Model ---
// The API key is fetched from the environment variables.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins, allowing your client to connect from a different domain.
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Hello! The server is running. 🚀');
});

// Main API endpoint for document summarization
app.post('/api/summarize', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { summaryLength = 'medium' } = req.body;
    let extractedText = '';
    const fileBuffer = req.file.buffer;

    // Handle PDF and image text extraction
    if (req.file.mimetype === 'application/pdf') {
      const data = await pdf(fileBuffer);
      extractedText = data.text;
    } else if (['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
      const { data: { text } } = await Tesseract.recognize(fileBuffer, 'eng');
      extractedText = text;
    } else {
      return res.status(400).json({ error: 'Unsupported file type.' });
    }

    // AI Summary Generation
    const prompt = `Generate a ${summaryLength} summary of the following document. Focus on key points and main ideas. Document content: "${extractedText}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    res.json({
      message: "Summary generated successfully!",
      summary: summary
    });

  } catch (error) {
    console.error('Error during summarization:', error);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
