import React, { useState } from 'react';
import { 
  RotateCw, ArrowLeft, ArrowRight, CheckCircle2, 
  Sparkles, BookOpen, ThumbsUp, Flame 
} from 'lucide-react';
import type { Flashcard } from '../../types/quiz';

interface FlashcardViewerProps {
  cards: Flashcard[];
  onFinish: () => void;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ cards, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastery, setMastery] = useState<Record<number, 'easy' | 'medium' | 'hard'>>({});

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const rateConfidence = (level: 'easy' | 'medium' | 'hard') => {
    setMastery({ ...mastery, [currentCard.id]: level });
    handleNext();
  };

  const easyCount = Object.values(mastery).filter((v) => v === 'easy').length;
  const hardCount = Object.values(mastery).filter((v) => v === 'hard').length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Flashcard Deck
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Card {currentIndex + 1} of {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="text-emerald-400 flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" /> Mastered: {easyCount}
          </span>
          <span className="text-rose-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> Review Needed: {hardCount}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[320px] bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col justify-between cursor-pointer hover:border-purple-500/50 transition-all select-none relative group"
      >
        
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>{isFlipped ? 'ANSWER / CONCEPT' : 'QUESTION'}</span>
          <span className="flex items-center gap-1 text-purple-400 group-hover:underline">
            <RotateCw className="w-3.5 h-3.5" /> Click card to flip
          </span>
        </div>

        {/* Content */}
        <div className="my-auto text-center py-6">
          {!isFlipped ? (
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed whitespace-pre-line">
              {currentCard?.front}
            </h3>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-400 leading-relaxed">
                {currentCard?.back}
              </h3>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed max-w-lg mx-auto text-left">
                <p className="font-semibold text-purple-300 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Explanation:
                </p>
                {currentCard?.explanation}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Rating Options when Flipped */}
        {isFlipped ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-4 border-t border-slate-800 flex items-center justify-center gap-3 animate-fadeIn"
          >
            <button
              onClick={() => rateConfidence('hard')}
              className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 text-xs font-bold transition-all"
            >
              Hard (Review Soon)
            </button>
            <button
              onClick={() => rateConfidence('medium')}
              className="px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:bg-amber-900/60 text-xs font-bold transition-all"
            >
              Good (Fair)
            </button>
            <button
              onClick={() => rateConfidence('easy')}
              className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 text-xs font-bold transition-all"
            >
              Easy (Mastered)
            </button>
          </div>
        ) : (
          <div className="text-center text-xs text-slate-500 font-medium">
            Tap to reveal correct answer & explanation
          </div>
        )}

      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        {currentIndex === cards.length - 1 ? (
          <button
            onClick={onFinish}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
          >
            Finish Flashcard Session <CheckCircle2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Next Card <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
};
