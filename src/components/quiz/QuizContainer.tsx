import React, { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, 
  Grid, BookOpen, Brain 
} from 'lucide-react';
import type { QuizConfig, QuizQuestion, QuizResult } from '../../types/quiz';
import { QuizTimer } from './QuizTimer';
import { QuizCard } from './QuizCard';
import { FlashcardViewer } from './FlashcardViewer';
import { generateMockFlashcards } from '../../services/mockQuiz';
import { playPerfectScoreSound } from '../../services/soundEffects';

interface QuizContainerProps {
  questions: QuizQuestion[];
  config: QuizConfig;
  sourceFileName: string;
  onFinishQuiz: (result: QuizResult) => void;
  onBackToConfig: () => void;
}

export const QuizContainer: React.FC<QuizContainerProps> = ({
  questions,
  config,
  sourceFileName,
  onFinishQuiz,
  onBackToConfig
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [activeMode, setActiveMode] = useState<'quiz' | 'flashcards'>(config.studyMode);
  const [showReviewGrid, setShowReviewGrid] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id]
    }));
  };

  const answeredCount = Object.keys(userAnswers).length;

  const normalizeText = (text: string) =>
    text.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').replace(/\s+/g, ' ');

  const handleSubmitQuiz = (timeSpentOverride?: number) => {
    // Calculate final score
    let score = 0;
    const finalQuestions: QuizQuestion[] = questions.map((q) => {
      const uAnswer = userAnswers[q.id] || '';
      const isCorrect = uAnswer && normalizeText(uAnswer) === normalizeText(q.correctAnswer);
      if (isCorrect) score += 1;
      return {
        ...q,
        userAnswer: uAnswer,
        isCorrect: !!isCorrect,
        userFlagged: !!flaggedQuestions[q.id]
      };
    });

    const percentage = Math.round((score / questions.length) * 100);

    const result: QuizResult = {
      id: 'quiz_' + Date.now(),
      title: config.topicTitle,
      date: new Date().toLocaleDateString(),
      sourceFileName,
      totalQuestions: questions.length,
      score,
      percentage,
      timeSpentSeconds: timeSpentOverride ?? timeSpent,
      config,
      questions: finalQuestions
    };

    if (percentage === 100) {
      playPerfectScoreSound();
    }

    onFinishQuiz(result);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToConfig}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h2 className="text-base font-bold text-white max-w-xs sm:max-w-md truncate">
              {config.topicTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {answeredCount} of {questions.length} Answered
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mode Switcher */}
          <div className="p-0.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center">
            <button
              onClick={() => setActiveMode('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'quiz'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" /> Quiz
            </button>
            <button
              onClick={() => setActiveMode('flashcards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'flashcards'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Flashcards
            </button>
          </div>

          {/* Countdown Timer */}
          <QuizTimer
            totalSeconds={(config.timeLimitMinutes ?? 10) * 60}
            onTimeUpdate={setTimeSpent}
            onTimeExpired={() => handleSubmitQuiz((config.timeLimitMinutes ?? 10) * 60)}
            isPaused={false}
          />

          {/* Review Grid Toggle */}
          {activeMode === 'quiz' && (
            <button
              onClick={() => setShowReviewGrid(!showReviewGrid)}
              className={`p-2 rounded-xl text-xs border font-medium transition-all ${
                showReviewGrid
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700/60 hover:bg-slate-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>

      {/* Review Drawer Grid */}
      {showReviewGrid && activeMode === 'quiz' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Question Navigator</span>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Flagged
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Pending
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((q, idx) => {
              const isAns = !!userAnswers[q.id];
              const isFlag = !!flaggedQuestions[q.id];
              const isCurrent = idx === currentIndex;

              let btnStyle = 'bg-slate-950 border-slate-800 text-slate-400';
              if (isAns) btnStyle = 'bg-emerald-950 border-emerald-500/50 text-emerald-300 font-bold';
              if (isFlag) btnStyle = 'bg-amber-950 border-amber-500/50 text-amber-300 font-bold';
              if (isCurrent) btnStyle += ' ring-2 ring-indigo-500';

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowReviewGrid(false);
                  }}
                  className={`py-2 rounded-xl text-xs border text-center transition-all ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Learning Component */}
      {activeMode === 'quiz' ? (
        <div className="space-y-6">
          
          <QuizCard
            key={currentQuestion.id}
            question={{
              ...currentQuestion,
              userFlagged: !!flaggedQuestions[currentQuestion.id]
            }}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            userAnswer={userAnswers[currentQuestion.id]}
            onSelectAnswer={handleSelectAnswer}
            onToggleFlag={handleToggleFlag}
            instantFeedback={config.instantFeedback}
          />

          {/* Navigation & Submit Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={() => handleSubmitQuiz()}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-xl shadow-emerald-600/30 transition-all"
              >
                Submit Exam & View Score <CheckCircle2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                Next Question <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      ) : (
        /* Flashcards Mode */
        <FlashcardViewer
          cards={generateMockFlashcards(questions)}
          onFinish={() => handleSubmitQuiz()}
        />
      )}

    </div>
  );
};
