import type { QuizConfig, QuizQuestion } from '../types/quiz';

export async function generateQuiz(
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

    return await response.json();
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    throw new Error(
      error.message || 'Failed to generate the quiz. Please check if the backend server is running.'
    );
  }
}
