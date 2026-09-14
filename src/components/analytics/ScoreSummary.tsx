import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Award, Clock, RotateCcw, Download, 
  CheckCircle2, XCircle, Sparkles, RefreshCw, GraduationCap 
} from 'lucide-react';
import type { QuizResult } from '../../types/quiz';
import { FormattedExplanation } from '../quiz/FormattedExplanation';

interface ScoreSummaryProps {
  result: QuizResult;
  onRetryQuiz: () => void;
  onNewQuiz: () => void;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  result,
  onRetryQuiz,
  onNewQuiz
}) => {
  useEffect(() => {
    if (result.percentage >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [result.percentage]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  const getGradeInfo = (pct: number) => {
    if (pct >= 90) {
      return {
        label: 'Academic Distinction',
        color: 'from-emerald-500 to-teal-400',
        badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
      };
    } else if (pct >= 75) {
      return {
        label: 'Passed - Strong Performance',
        color: 'from-indigo-500 to-purple-400',
        badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
      };
    } else if (pct >= 50) {
      return {
        label: 'Fair - Review Suggested',
        color: 'from-amber-500 to-yellow-400',
        badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      };
    } else {
      return {
        label: 'Needs Intensive Review',
        color: 'from-rose-500 to-red-400',
        badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/30'
      };
    }
  };

  const gradeInfo = getGradeInfo(result.percentage);

  const missedQuestions = result.questions.filter((q) => !q.isCorrect);

  const handlePrintStudyGuide = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Top Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden space-y-6">
        
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${gradeInfo.badgeBg}`}>
          <Award className="w-4 h-4" />
          {gradeInfo.label}
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {result.score} / {result.totalQuestions}
          </h1>
          <p className="text-slate-400 text-sm">
            Overall Score Score Percentage: <span className="text-white font-bold">{result.percentage}%</span>
          </p>
        </div>

        {/* Score Progress Bar */}
        <div className="max-w-md mx-auto bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradeInfo.color} transition-all duration-1000`}
            style={{ width: `${result.percentage}%` }}
          />
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 max-w-2xl mx-auto">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Time</p>
            <p className="text-sm font-bold text-white mt-0.5 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {formatTime(result.timeSpentSeconds)}
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Correct Answers</p>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">
              {result.score} Qs
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Missed Answers</p>
            <p className="text-sm font-bold text-rose-400 mt-0.5">
              {missedQuestions.length} Qs
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Source File</p>
            <p className="text-xs font-bold text-slate-300 truncate mt-0.5">
              {result.sourceFileName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onRetryQuiz}
            className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-indigo-400" /> Retry Quiz
          </button>
          <button
            onClick={handlePrintStudyGuide}
            className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-purple-400" /> Save Study Guide / Print
          </button>
          <button
            onClick={onNewQuiz}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Create New Quiz
          </button>
        </div>

      </div>

      {/* Detailed Question Review & Missed Questions Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Full Review & Explanations</h2>
            <p className="text-xs text-slate-400">
              Review correct answers and detailed AI justifications
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-semibold rounded-full border border-indigo-500/20">
            {result.questions.length} Items Analyzed
          </span>
        </div>

        <div className="space-y-4">
          {result.questions.map((q, idx) => (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border text-xs space-y-3 ${
                q.isCorrect
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-white text-sm whitespace-normal break-words leading-relaxed">
                    {q.question}
                  </span>
                </div>
                <div>
                  {q.isCorrect ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Correct
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <XCircle className="w-3 h-3" /> Incorrect
                    </span>
                  )}
                </div>
              </div>

              {/* Teacher Persona Box */}
              <div className="p-3 bg-slate-900 border border-indigo-500/20 rounded-xl space-y-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Teacher Feedback:
                </p>
                <p className="text-slate-300 text-xs italic whitespace-normal break-words leading-relaxed">
                  "{q.teacherComment || (q.isCorrect ? "Mahusay! Nakuha mo ang paksang ito." : "Opps! Muntik na. Balikan natin ang konseptong ito...")}"
                </p>
              </div>

              {/* Answers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 uppercase text-[9px] font-bold block">Your Answer:</span>
                  <span className={`whitespace-normal break-words block ${q.isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}`}>
                    {q.userAnswer || '(No answer provided)'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 uppercase text-[9px] font-bold block">Target Answer:</span>
                  <span className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded border border-emerald-500/40 inline-block whitespace-normal break-words">
                    {q.correctAnswer}
                  </span>
                </div>
              </div>

              {/* Explanation Reveal with Target Answer Highlight */}
              <div className="pt-2 border-t border-slate-800/80 text-slate-300 font-sans leading-relaxed space-y-1">
                <span className="text-indigo-300 font-semibold flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Explanation Reveal:
                </span>
                <FormattedExplanation
                  explanation={q.explanation}
                  correctAnswer={q.correctAnswer}
                />
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
