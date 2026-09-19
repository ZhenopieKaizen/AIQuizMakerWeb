import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, XCircle, Flag, Sparkles, GraduationCap 
} from 'lucide-react';
import type { QuizQuestion } from '../../types/quiz';
import { FormattedExplanation } from './FormattedExplanation';

interface QuizCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  userAnswer?: string;
  onSelectAnswer: (answer: string) => void;
  onToggleFlag: () => void;
  instantFeedback: boolean;
}

type AnswerEffect = {
  id: number;
  kind: 'correct' | 'incorrect';
};

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  userAnswer,
  onSelectAnswer,
  onToggleFlag,
  instantFeedback
}) => {
  const [identInput, setIdentInput] = useState(userAnswer || '');
  const [answerEffect, setAnswerEffect] = useState<AnswerEffect | null>(null);
  const effectSequence = useRef(0);
  const effectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const hasAnswered = !!userAnswer;
  const isCorrect = hasAnswered && userAnswer?.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
  const showFeedback = hasAnswered && instantFeedback;
  const feedbackState = showFeedback ? (isCorrect ? 'correct' : 'incorrect') : null;

  useEffect(() => () => {
    if (effectTimer.current) clearTimeout(effectTimer.current);
    if (audioContext.current) void audioContext.current.close();
  }, []);

  const playCorrectChime = () => {
    const context = audioContext.current ?? new AudioContext();
    audioContext.current = context;

    if (context.state === 'suspended') void context.resume();

    const startAt = context.currentTime;
    const notes = [659.25, 783.99];

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteStart = startAt + index * 0.075;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.075, noteStart + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.17);
    });
  };

  const triggerAnswerEffect = (answer: string) => {
    if (!instantFeedback) return;

    const kind = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
      ? 'correct'
      : 'incorrect';

    effectSequence.current += 1;
    setAnswerEffect({ id: effectSequence.current, kind });

    if (effectTimer.current) clearTimeout(effectTimer.current);
    effectTimer.current = setTimeout(() => setAnswerEffect(null), 760);

    if (kind === 'correct') {
      playCorrectChime();
      void confetti({
        particleCount: 24,
        spread: 48,
        startVelocity: 20,
        gravity: 0.9,
        scalar: 0.68,
        ticks: 85,
        origin: { x: 0.5, y: 0.55 },
        colors: ['#34d399', '#2dd4bf', '#818cf8', '#f8fafc'],
        disableForReducedMotion: true,
        zIndex: 60,
      });
    }
  };

  const handleAnswerSelect = (answer: string) => {
    triggerAnswerEffect(answer);
    onSelectAnswer(answer);
  };

  const handleIdentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identInput.trim()) {
      handleAnswerSelect(identInput.trim());
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'Multiple Choice';
      case 'true_false': return 'True / False';
      case 'identification': return 'Identification';
      default: return 'Question';
    }
  };

  const getTeacherPraise = () => {
    if (isCorrect) {
      return question.teacherComment || "Mahusay! Nakuha mo ang paksang ito. Great job! You clearly reviewed this concept.";
    } else {
      return "Oops! Muntik na. Balikan natin ang konseptong ito... Don't worry, review the highlighted answer below!";
    }
  };

  return (
    <div className={`quiz-card bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden transition-all ${
      feedbackState ? `quiz-card--${feedbackState}` : ''
    }`}>
      {answerEffect && (
        <div
          key={answerEffect.id}
          className={`answer-impact answer-impact--${answerEffect.kind}`}
          aria-hidden="true"
        >
          {answerEffect.kind === 'correct' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{answerEffect.kind === 'correct' ? 'Correct!' : 'Try again'}</span>
        </div>
      )}
      
      {/* Top Bar: Type, Question Count & Flag */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
            {getQuestionTypeLabel(question.type)}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>

        <button
          onClick={onToggleFlag}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            question.userFlagged
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Flag className={`w-3.5 h-3.5 ${question.userFlagged ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>{question.userFlagged ? 'Flagged' : 'Flag'}</span>
        </button>
      </div>

      {/* Question Statement */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed whitespace-normal break-words">
          {question.question}
        </h3>
      </div>

      {/* Options Rendering */}
      {question.type === 'mcq' || question.type === 'true_false' ? (
        <div className="space-y-3">
          {question.options?.map((option, idx) => {
            const isSelected = userAnswer === option;
            const isTargetCorrect = option.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

            let optionStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800/60';
            let feedbackAnimation = '';

            if (showFeedback) {
              if (isTargetCorrect) {
                optionStyle = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 font-bold';
                feedbackAnimation = 'quiz-option--correct';
              } else if (isSelected && !isTargetCorrect) {
                optionStyle = 'bg-rose-950/60 border-rose-500/80 text-rose-200 font-bold';
                feedbackAnimation = 'quiz-option--incorrect';
              } else {
                optionStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
              }
            } else if (isSelected) {
              optionStyle = 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnswerSelect(option)}
                aria-pressed={isSelected}
                className={`quiz-option w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between h-auto min-h-[3.25rem] ${optionStyle} ${feedbackAnimation}`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-800/80 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="whitespace-normal break-words leading-normal">{option}</span>
                </div>

                {showFeedback && (
                  <div className="shrink-0 ml-2">
                    {isTargetCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    {isSelected && !isTargetCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Identification Short Answer Input */
        <form onSubmit={handleIdentSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Type your answer below:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={identInput}
              onChange={(e) => setIdentInput(e.target.value)}
              placeholder="Enter answer..."
              disabled={hasAnswered && instantFeedback}
              aria-invalid={showFeedback ? !isCorrect : undefined}
              className={`quiz-identification-input flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-medium focus:outline-none focus:border-indigo-500 ${
                feedbackState ? `quiz-identification-input--${feedbackState}` : ''
              }`}
            />
            <button
              type="submit"
              disabled={!identInput.trim() || (hasAnswered && instantFeedback)}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
            >
              Submit Answer
            </button>
          </div>
        </form>
      )}

      {/* Instant Feedback & Teacher Persona Explanation Block */}
      {showFeedback && (
        <div
          key={`${question.id}-${userAnswer}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`quiz-feedback-panel quiz-feedback-panel--${feedbackState} p-5 rounded-2xl border text-xs leading-relaxed space-y-4 ${
          isCorrect 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
            : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
          }`}
        >
          {/* Result Status Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2 font-bold text-sm">
              {isCorrect ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="quiz-result-icon quiz-result-icon--correct">
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  </span>
                  Correct Answer!
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="quiz-result-icon quiz-result-icon--incorrect">
                    <XCircle className="w-5 h-5" aria-hidden="true" />
                  </span>
                  Incorrect Answer
                </span>
              )}
            </div>

            {/* Teacher Persona Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full text-[11px] font-semibold">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> AI Quizmaster Teacher
            </div>
          </div>

          {/* Teacher Comment Box */}
          <div className="p-3.5 bg-slate-950/80 border border-indigo-500/20 rounded-xl space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1">
              👩‍🏫 Teacher Comment:
            </p>
            <p className="text-slate-200 text-xs italic font-medium whitespace-normal break-words leading-relaxed">
              "{getTeacherPraise()}"
            </p>
          </div>

          {/* Target Answer Reveal */}
          <div className="pt-1 text-slate-300">
            <p className="flex flex-wrap items-center gap-2">
              <strong className="text-white shrink-0">Target Answer:</strong> 
              <span className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-lg border border-emerald-500/40 whitespace-normal break-words">
                {question.correctAnswer}
              </span>
            </p>
          </div>

          {/* Detailed Explanation with Highlighted Target Answer */}
          <div className="pt-2 border-t border-slate-800/60 text-slate-300 space-y-1">
            <p className="font-semibold text-indigo-300 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Explanation Reveal:
            </p>
            <FormattedExplanation 
              explanation={question.explanation}
              correctAnswer={question.correctAnswer}
            />
          </div>
        </div>
      )}

    </div>
  );
};
