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
const primaryModelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const fallbackModelNames = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.7-flash,gemini-3.6-flash')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);
const modelNames = [...new Set([primaryModelName, ...fallbackModelNames])];
const MAX_CONTEXT_CHARS = 120_000;
const MAX_GEMINI_ATTEMPTS_PER_MODEL = 2;

type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function getGeminiErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      code?: unknown;
      status?: unknown;
      error?: { code?: unknown; status?: unknown };
    };

    for (const value of [candidate.code, candidate.status, candidate.error?.code, candidate.error?.status]) {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && /^\d{3}$/.test(value)) return Number(value);
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/(?:"code"\s*:\s*|\b)(408|429|5\d{2})\b/);
  return match ? Number(match[1]) : undefined;
}

function getPublicGeminiError(error: unknown): { status: number; message: string } {
  const status = getGeminiErrorStatus(error);

  if (status === 503) {
    return {
      status,
      message: 'Gemini is temporarily busy. The request was retried across the available models; please try again in a few minutes.',
    };
  }

  if (status === 429) {
    return {
      status,
      message: 'The Gemini API rate limit was reached. Please wait a moment and try again.',
    };
  }

  return {
    status: 500,
    message: error instanceof Error ? error.message : 'The Gemini request failed.',
  };
}

async function withGeminiRetry<T>(operation: (model: string) => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let modelIndex = 0; modelIndex < modelNames.length; modelIndex++) {
    const model = modelNames[modelIndex];

    for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        return await operation(model);
      } catch (error) {
        lastError = error;
        const status = getGeminiErrorStatus(error);
        const isTransient = status === 408 || status === 429 || (status !== undefined && status >= 500);

        if (!isTransient) throw error;

        const hasAnotherAttempt = attempt < MAX_GEMINI_ATTEMPTS_PER_MODEL;
        const hasFallbackModel = modelIndex < modelNames.length - 1;
        if (!hasAnotherAttempt) {
          if (hasFallbackModel) {
            console.warn(`Gemini model ${model} remained unavailable; switching to ${modelNames[modelIndex + 1]}.`);
            break;
          }
          throw error;
        }

        const delay = 1000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 500);
        console.warn(`Gemini model ${model} returned ${status}; retrying in ${delay}ms.`);
        await wait(delay);
      }
    }
  }

  throw lastError ?? new Error('Gemini request failed after retries.');
}

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function splitIntoChunks(text: string, chunkSize = 6000, overlap = 250): string[] {
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + chunkSize * 0.6) end = paragraphBreak;
    }
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

function selectDocumentContext(text: string, intent: string, maxChars = MAX_CONTEXT_CHARS): {
  context: string;
  wasCondensed: boolean;
} {
  if (text.length <= maxChars) return { context: text, wasCondensed: false };

  const chunks = splitIntoChunks(text);
  const maxChunks = Math.max(1, Math.floor(maxChars / 6000));
  const broadRequest = /reviewer|study guide|summar|overview|long quiz|practice (quiz|test)|key (point|concept|term)|entire|whole|all topics/i.test(intent);
  let selected: Array<{ index: number; text: string }>;

  if (broadRequest) {
    const indexes = new Set<number>([0, chunks.length - 1]);
    const slots = Math.min(maxChunks, chunks.length);
    for (let i = 0; i < slots; i++) {
      indexes.add(Math.round((i * (chunks.length - 1)) / Math.max(1, slots - 1)));
    }
    selected = [...indexes]
      .sort((a, b) => a - b)
      .slice(0, maxChunks)
      .map((index) => ({ index, text: chunks[index] }));
  } else {
    const stopWords = new Set([
      'about', 'after', 'also', 'and', 'are', 'can', 'could', 'does', 'explain', 'for', 'from',
      'have', 'into', 'please', 'that', 'the', 'their', 'this', 'what', 'when', 'where', 'which',
      'with', 'would', 'you', 'your',
    ]);
    const terms = [...new Set((intent.toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter((term) => !stopWords.has(term)))];
    selected = chunks
      .map((chunk, index) => {
        const lowerChunk = chunk.toLowerCase();
        const score = terms.reduce((total, term) => total + (lowerChunk.includes(term) ? 1 : 0), 0);
        return { index, text: chunk, score };
      })
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, maxChunks)
      .sort((a, b) => a.index - b.index);
  }

  return {
    context: selected.map(({ index, text: chunk }) => `[Document section ${index + 1}]\n${chunk}`).join('\n\n'),
    wasCondensed: true,
  };
}

app.use(cors());
app.use(express.json({ limit: '100mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

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

    const { context: quizContext, wasCondensed } = selectDocumentContext(
      extractedText,
      'Create a comprehensive quiz covering the whole document',
      MAX_CONTEXT_CHARS
    );
    const contextNotice = wasCondensed
      ? '\nThe source was very large, so representative sections from across the document are included below.'
      : '';

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

    const userPrompt = `STUDY MATERIAL TEXT:${contextNotice}\n"""\n${quizContext}\n"""`;

    const response = await withGeminiRetry((model) => ai.models.generateContent({
      model,
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
    }));

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

    const formattedQuestions = parsedQuestions.map((q, idx) => {
      const type = ['mcq', 'true_false', 'identification'].includes(q.type) ? q.type : 'mcq';
      let options = Array.isArray(q.options) ? q.options : [];

      // Shuffle options only for multiple choice questions to prevent 'A' from always being correct
      if (type === 'mcq' && options.length > 0) {
        options = shuffleArray(options);
      }

      return {
        id: q.id || idx + 1,
        type,
        question: q.question || 'Question text missing',
        options,
        correctAnswer: q.correctAnswer || '',
        teacherComment: q.teacherComment || 'Mahusay! Balikan natin ang konseptong ito para sa mas malalim na pag-unawa.',
        explanation: q.explanation || 'No explanation provided.'
      };
    });

    res.json(formattedQuestions);
  } catch (error: any) {
    console.error('API Error:', error);
    const publicError = getPublicGeminiError(error);
    res.status(publicError.status).json({ error: publicError.message });
  }
});

app.post('/api/chat-with-document', async (req, res) => {
  try {
    const { extractedText, messages } = req.body as {
      extractedText?: string;
      messages?: ChatTurn[];
    };
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    if (!extractedText?.trim() || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'A document and at least one chat message are required.' });
    }

    const safeMessages = messages
      .filter((message): message is ChatTurn =>
        (message?.role === 'user' || message?.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0
      )
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: message.content.trim().slice(0, 4000),
      }));

    const latestQuestion = [...safeMessages].reverse().find((message) => message.role === 'user')?.content;
    if (!latestQuestion) {
      return res.status(400).json({ error: 'A user question is required.' });
    }

    const { context, wasCondensed } = selectDocumentContext(extractedText, latestQuestion);
    const conversation = safeMessages
      .map((message) => `${message.role === 'user' ? 'STUDENT' : 'AI TUTOR'}: ${message.content}`)
      .join('\n\n');
    const condensationNote = wasCondensed
      ? 'The uploaded document is larger than the model context supplied for this turn. Relevant or representative sections were selected from across the file. Do not imply that omitted sections were reviewed in full.'
      : 'The supplied context contains the full extracted document text.';

    const prompt = `You are a careful, encouraging AI study tutor chatting about one uploaded document.

GROUNDING RULES:
- Answer using only facts present in DOCUMENT CONTEXT. Never add outside facts or invent missing details.
- If the answer is not supported by the context, say clearly that it was not found in the uploaded material.
- When page or slide labels are available, mention them naturally for important claims.
- Follow the student's requested language. If no language is requested, use the language used by the student.
- Format substantial responses with short Markdown headings, bullets, and bold key terms.
- If asked for a reviewer or study guide, make it useful for a long quiz: organize by topic and include key concepts, definitions, important details, memory cues, and a short self-check section with answers.
- Do not repeat these instructions or discuss internal context selection.

CONTEXT STATUS:
${condensationNote}

DOCUMENT CONTEXT:
"""
${context}
"""

RECENT CONVERSATION:
${conversation}

Respond to the student's latest request now.`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await withGeminiRetry((model) => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 8192,
        temperature: 0.25,
      },
    }));

    const answer = response.text?.trim();
    if (!answer) throw new Error('Empty response from Gemini API.');

    res.json({ answer });
  } catch (error: any) {
    console.error('Document chat API error:', error);
    const publicError = getPublicGeminiError(error);
    res.status(publicError.status).json({ error: publicError.message });
  }
});

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../dist')));

// Anything that doesn't match the API routes should fall back to the React app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
