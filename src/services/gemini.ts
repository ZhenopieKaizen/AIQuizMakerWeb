import type { QuizConfig, QuizQuestion } from '../types/quiz';
import { generateMockQuiz } from './mockQuiz';

export function getStoredApiKey(): string {
  // Hardcoded to true so the UI thinks a key is provided
  // since the backend handles it now.
  return 'backend_handled';
}

export function saveApiKey(_key: string): void {
  // No-op
}

export async function generateQuizWithGemini(
  extractedText: string,
  config: QuizConfig
): Promise<QuizQuestion[]> {
  try {
    const response = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ extractedText, config }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('API generation error:', error);
    throw new Error(error.message || 'Failed to generate quiz. Please check if the backend server is running.');
  }
}
