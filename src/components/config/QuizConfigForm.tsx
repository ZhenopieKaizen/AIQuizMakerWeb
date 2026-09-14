import React, { useState } from 'react';
import { 
  SlidersHorizontal, Languages, 
  Sparkles, ArrowLeft, ToggleLeft, ToggleRight,
  BookOpen, Brain, Check, ListFilter, Gauge
} from 'lucide-react';
import type { 
  QuizConfig, QuestionType, DifficultyLevel, 
  QuizLanguage, StudyMode, DocumentSource 
} from '../../types/quiz';

interface QuizConfigFormProps {
  documentSource: DocumentSource;
  onBack: () => void;
  onGenerateQuiz: (config: QuizConfig) => void;
  isGenerating: boolean;
}

export const QuizConfigForm: React.FC<QuizConfigFormProps> = ({
  documentSource,
  onBack,
  onGenerateQuiz,
  isGenerating
}) => {
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['mcq', 'true_false', 'identification']);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('mixed');
  const [language, setLanguage] = useState<QuizLanguage>('taglish');
  const [studyMode, setStudyMode] = useState<StudyMode>('quiz');
  const [instantFeedback, setInstantFeedback] = useState<boolean>(true);
  const [topicTitle, setTopicTitle] = useState<string>(
    documentSource.fileName.replace(/\.(pdf|pptx|txt)$/i, '')
  );

  const toggleQuestionType = (type: QuestionType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateQuiz({
      questionCount,
      questionTypes: selectedTypes,
      difficulty,
      language,
      studyMode,
      instantFeedback,
      topicTitle: topicTitle.trim() || documentSource.fileName
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Upload
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Step 2: Quiz Configuration
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Customize Your Quiz</h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          Extracted material from <span className="text-indigo-400 font-medium">{documentSource.fileName}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Quiz Topic Title Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Quiz & Reviewer Title
          </label>
          <input
            type="text"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            placeholder="Title of this study module"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        {/* Question Count Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Number of Questions</span>
            <span className="text-indigo-400 font-bold text-sm">{questionCount} Questions</span>
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[5, 10, 15, 20].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setQuestionCount(count)}
                className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                  questionCount === count
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {count} Qs
              </button>
            ))}
          </div>
        </div>

        {/* Question Types Multi-Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-indigo-400" />
            Question Formats (Select one or more)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'mcq', label: 'Multiple Choice', desc: '4 options per question' },
              { id: 'true_false', label: 'True / False', desc: 'Binary logic validation' },
              { id: 'identification', label: 'Identification', desc: 'Short answer & key terms' }
            ].map((item) => {
              const isSelected = selectedTypes.includes(item.id as QuestionType);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleQuestionType(item.id as QuestionType)}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Level & Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Difficulty */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="easy">Easy (Fundamentals & Core Facts)</option>
              <option value="medium">Medium (Standard Academic Level)</option>
              <option value="hard">Hard (Advanced Analysis & Reasoning)</option>
              <option value="mixed">Mixed (Balanced Spread)</option>
            </select>
          </div>

          {/* Language Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              Language / Dialect
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as QuizLanguage)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="taglish">Taglish (Filipino + English Hybrid)</option>
              <option value="english">English (Standard Academic)</option>
              <option value="tagalog">Tagalog (Wikang Filipino)</option>
            </select>
          </div>

        </div>

        {/* Study Mode Selector (Interactive Quiz vs Flashcards) */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Target Learning Mode
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setStudyMode('quiz')}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                studyMode === 'quiz'
                  ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Interactive Test Mode</p>
                <p className="text-[11px] text-slate-400">Real-time timer & score analytics</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStudyMode('flashcards')}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                studyMode === 'flashcards'
                  ? 'bg-gradient-to-r from-purple-950/60 to-pink-950/60 border-purple-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Flashcard Review Mode</p>
                <p className="text-[11px] text-slate-400">Flip cards for rapid recall</p>
              </div>
            </button>
          </div>
        </div>

        {/* Instant Feedback Toggle */}
        {studyMode === 'quiz' && (
          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-white">Instant Explanation Reveal</p>
              <p className="text-[11px] text-slate-400">
                Show detailed explanation immediately after picking an answer.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInstantFeedback(!instantFeedback)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {instantFeedback ? (
                <ToggleRight className="w-8 h-8 text-indigo-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-600" />
              )}
            </button>
          </div>
        )}

        {/* Generate Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            {isGenerating ? 'AI Generating Quiz Questions...' : 'Generate Quiz with Gemini AI'}
          </button>
        </div>

      </form>

    </div>
  );
};
