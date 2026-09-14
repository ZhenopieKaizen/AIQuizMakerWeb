import type { QuizConfig, QuizQuestion, Flashcard } from '../types/quiz';

export function generateMockQuiz(extractedText: string, config: QuizConfig): QuizQuestion[] {
  const lines = extractedText
    .split(/\n|\./)
    .map((l) => l.trim())
    .filter((l) => l.length > 15);

  const total = config.questionCount;
  const questions: QuizQuestion[] = [];

  const typesToUse = config.questionTypes.length > 0
    ? config.questionTypes
    : ['mcq', 'true_false', 'identification'];

  for (let i = 1; i <= total; i++) {
    const type = typesToUse[(i - 1) % typesToUse.length] as 'mcq' | 'true_false' | 'identification';
    const sampleContext = lines[(i * 2) % lines.length] || `Core concept #${i} discussed in the study material.`;
    const taglishPrefix = config.language === 'taglish' ? 'Ano ang ibig sabihin ng ' : config.language === 'tagalog' ? 'Tukuyin ang kahulugan ng ' : 'Select the primary function of ';

    if (type === 'mcq') {
      const conceptTerm = sampleContext.split(' ').slice(0, 4).join(' ') || 'Primary Concept';
      const correctAns = `Primary Principle of ${conceptTerm}`;
      questions.push({
        id: i,
        type: 'mcq',
        question: `${taglishPrefix}concept related to "${sampleContext}"?`,
        options: [
          correctAns,
          `Secondary Mechanism of System Flow`,
          `Deprecated Methodology (Legacy)`,
          `Inverse Variance Algorithm`
        ],
        correctAnswer: correctAns,
        teacherComment: config.language === 'tagalog' || config.language === 'taglish' 
          ? 'Mahusay! Nakuha mo ang paksang ito batay sa ating aralin.' 
          : 'Great job! You clearly reviewed this concept from the document.',
        explanation: `Based directly on the material provided: "${sampleContext}". The final answer **${correctAns}** governs this primary operation.`
      });
    } else if (type === 'true_false') {
      const isTrue = i % 2 === 1;
      const statementPrefix = config.language === 'taglish' ? 'Tama o Mali: ' : config.language === 'tagalog' ? 'Wasto o Di-Wasto: ' : 'True or False: ';
      const correctAns = isTrue ? 'True' : 'False';
      questions.push({
        id: i,
        type: 'true_false',
        question: `${statementPrefix}${sampleContext} is a critical component outlined in the study notes.`,
        options: ['True', 'False'],
        correctAnswer: correctAns,
        teacherComment: config.language === 'tagalog' || config.language === 'taglish' 
          ? 'Magaling! Tiyaking nasusuri nang mabuti ang bawat pahayag.' 
          : 'Good analysis! Keep reviewing the statements carefully.',
        explanation: `According to the source text, the statement is verified to be **${correctAns}** because "${sampleContext}".`
      });
    } else {
      const questionPrefix = config.language === 'taglish' ? 'Ano ang tawag sa ' : config.language === 'tagalog' ? 'Ano ang itinatawag sa ' : 'Identify the term for ';
      const term = sampleContext.split(' ')[0] || 'Core Concept';
      questions.push({
        id: i,
        type: 'identification',
        question: `${questionPrefix}the concept that states: "${sampleContext}"?`,
        correctAnswer: term,
        teacherComment: config.language === 'tagalog' || config.language === 'taglish' 
          ? 'Tumpak! Ang eksaktong terminolohiya ay napakahalaga.' 
          : 'Spot on! Memorizing precise terminology is key for exam success.',
        explanation: `Identified directly from the study text: "${sampleContext}". The target term is **${term}**.`
      });
    }
  }

  return questions;
}

export function generateMockFlashcards(questions: QuizQuestion[]): Flashcard[] {
  return questions.map((q) => {
    let frontText = q.question;
    if (q.type === 'mcq' && q.options && q.options.length > 0) {
      frontText += '\n\nOptions:\n' + q.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}) ${opt}`).join('\n');
    }
    return {
      id: q.id,
      front: frontText,
      back: q.correctAnswer,
      explanation: q.explanation
    };
  });
}
