import React from 'react';
import { History, Play, Trash2, ArrowLeft, Calendar, FileText } from 'lucide-react';
import type { QuizResult } from '../../types/quiz';

interface HistoryListProps {
  history: QuizResult[];
  onSelectQuiz: (quiz: QuizResult) => void;
  onDeleteQuiz: (id: string) => void;
  onBack: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onSelectQuiz,
  onDeleteQuiz,
  onBack
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Generator
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
          <History className="w-3.5 h-3.5" />
          Saved Quiz History ({history.length})
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Your Past Quiz Sessions</h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          Review previous study results, retake quizzes, or inspect weak areas anytime.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Saved Quizzes Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your first study document to generate an AI quiz. Your results will automatically appear here.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            Create First Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-purple-500/40 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    item.percentage >= 75
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : item.percentage >= 50
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}>
                    {item.percentage}% Score
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{item.sourceFileName}</span>
                  <span>•</span>
                  <span>{item.totalQuestions} Qs</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={() => onDeleteQuiz(item.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>

                <button
                  onClick={() => onSelectQuiz(item)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Open Results
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
