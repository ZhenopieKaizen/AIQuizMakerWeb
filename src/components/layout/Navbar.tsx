import React from 'react';
import { Sparkles, History, PlusCircle } from 'lucide-react';

interface NavbarProps {
  onOpenHistory: () => void;
  onNewQuiz: () => void;
  historyCount: number;
  activeStep: 'upload' | 'config' | 'quiz' | 'results' | 'history';
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  onNewQuiz,
  historyCount,
  activeStep
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80 shadow-lg shadow-indigo-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={onNewQuiz} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                QuizMaster AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                created by: roldan
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Word Reviewer & Quiz Generator
            </p>
          </div>
        </div>

        {/* Action Buttons & Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* New Quiz Reset Button */}
          {activeStep !== 'upload' && (
            <button
              onClick={onNewQuiz}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700/60 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">New Quiz</span>
            </button>
          )}

          {/* Saved History Button */}
          <button
            onClick={onOpenHistory}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border shadow-sm relative ${
              activeStep === 'history'
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border-slate-700/60'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-purple-500 text-white rounded-full">
                {historyCount}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
};
