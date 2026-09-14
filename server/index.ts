import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { extractedText, config } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    if (!extractedText || !config) {
      return res.status(400).json({ error: 'Missing extractedText or config in request body.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const maxChars = 24000;
    const truncatedText = extractedText.length > maxChars 
      ? extractedText.slice(0, maxChars) + "\n\n[... content truncated for optimal context length ...]" 
      : extractedText;

    const languageInstruction = 
      config.language === 'taglish'
        ? 'Write all questions, options, and explanations in Taglish (a natural hybrid of Tagalog and English commonly used in Philippine education).'
        : config.language === 'tagalog'
        ? 'Write all questions, options, and explanations in standard Tagalog (Filipino).'
        : 'Write all questions, options, and explanations in clear English.';

    const questionTypesInstruction = config.questionTypes.length > 0 
      ? `Generate a balanced mix of the following question types: ${config.questionTypes.join(', ')}.`
      : 'Generate a mix of Multiple Choice (mcq), True/False (true_false), and Identification (identification) questions.';

    const systemPrompt = `You are an engaging, supportive, and firm classroom Teacher and Senior Quiz Master AI.
Your task is to generate a structured study quiz based strictly on the user's provided study material text.

STRICT GROUNDING & ANTI-HALLUCINATION INSTRUCTIONS:
- Generate questions ONLY using explicit facts, concepts, and definitions provided in the uploaded text. Do NOT add outside knowledge, assumptions, or unverified claims. Every question and answer option must be 100% traceably accurate to the source document.
- Avoid vague wording or meta-phrasing (e.g., instead of "What did the author say?" or "According to the text...", use exact factual terminology and direct concepts from the file).
- Ensure every question string, option choice, and explanation is fully written out and grammatically complete. Do NOT use ellipses (...) or truncate any answer choices.

CONFIGURATIONS:
- Target Number of Questions: ${config.questionCount}
- Difficulty Level: ${config.difficulty}
- Language Mode: ${languageInstruction}
- Question Types: ${questionTypesInstruction}

TEACHER PERSONA & FORMATTING RULES:
1. Every question and option must be 100% traceably accurate to the source document.
2. For Multiple Choice ("mcq") questions:
   - Provide 4 distinct options.
   - Set "correctAnswer" to match EXACTLY one of the strings in "options".
3. For True/False ("true_false") questions:
   - "options" must be exactly ["True", "False"] (or ["Tama", "Mali"] if Tagalog/Taglish).
   - Set "correctAnswer" to "True" or "False" (or "Tama"/"Mali").
4. For Identification ("identification") questions:
   - Omit "options" or leave as empty array.
   - "correctAnswer" should be the precise term, phrase, or keyword.
5. "teacherComment": Provide a custom, encouraging, and supportive teacher comment for the student written in a conversational classroom tone in the configured language (e.g. "Mahusay! Nakuha mo ang paksang ito." or "Great job! You clearly reviewed this concept.").
6. "explanation": Provide a detailed explanation where the final target answer is explicitly wrapped in bold tags like **[EXACT ANSWER HERE]** or <mark>Target Answer</mark>, explaining directly why it is correct based on the material.
7. IDs must be sequential integers starting from 1 up to ${config.questionCount}.`;

    const userPrompt = `STUDY MATERIAL TEXT:\n"""\n${truncatedText}\n"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `${systemPrompt}\n\n${userPrompt}`,
      config: {
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              type: { 
                type: Type.STRING, 
                description: 'Must be "mcq", "true_false", or "identification"' 
              },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array of option strings for mcq/true_false, or empty for identification'
              },
              correctAnswer: { type: Type.STRING },
              teacherComment: { 
                type: Type.STRING,
                description: 'Supportive teacher persona feedback comment in configured language'
              },
              explanation: { 
                type: Type.STRING,
                description: 'Detailed explanation with the exact final answer wrapped in bold tags like **Target Answer**'
              }
            },
            required: ['id', 'type', 'question', 'correctAnswer', 'teacherComment', 'explanation']
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini API.');
    }

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', parseErr, responseText);
      const lastCloseBrace = responseText.lastIndexOf('}');
      if (lastCloseBrace !== -1) {
        const repairedText = responseText.slice(0, lastCloseBrace + 1) + ']';
        try {
          parsedQuestions = JSON.parse(repairedText);
        } catch {
          throw new Error('The generated quiz output was incomplete or malformed. Please try again or reduce the question count.');
        }
      } else {
        throw new Error('Invalid JSON format received from Gemini API.');
      }
    }

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      throw new Error('No valid quiz questions were generated. Please check your source material and try again.');
    }

    const formattedQuestions = parsedQuestions.map((q, idx) => ({
      id: q.id || idx + 1,
      type: (['mcq', 'true_false', 'identification'].includes(q.type) ? q.type : 'mcq'),
      question: q.question || 'Question text missing',
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer || '',
      teacherComment: q.teacherComment || 'Mahusay! Balikan natin ang konseptong ito para sa mas malalim na pag-unawa.',
      explanation: q.explanation || 'No explanation provided.'
    }));

    res.json(formattedQuestions);
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz using Gemini API.' });
  }
});

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../dist')));

// Anything that doesn't match the API routes should fall back to the React app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
