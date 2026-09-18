import { useState } from 'react';
import type { 
  DocumentSource, QuizConfig, QuizQuestion, 
  QuizResult 
} from './types/quiz';
import { generateQuizWithGemini } from './services/gemini';
import { Navbar } from './components/layout/Navbar';
import { FileUploader } from './components/upload/FileUploader';
import { QuizConfigForm } from './components/config/QuizConfigForm';
import { QuizContainer } from './components/quiz/QuizContainer';
import { ScoreSummary } from './components/analytics/ScoreSummary';
import { HistoryList } from './components/analytics/HistoryList';
import { DocumentChat } from './components/chat/DocumentChat';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [activeStep, setActiveStep] = useState<'upload' | 'config' | 'chat' | 'quiz' | 'results' | 'history'>('upload');
  
  // Data States
  const [documentSource, setDocumentSource] = useState<DocumentSource | null>(null);
  const [currentConfig, setCurrentConfig] = useState<QuizConfig | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);
  const [activeResult, setActiveResult] = useState<QuizResult | null>(null);

  // Status States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Saved History State
  const [history, setHistory] = useState<QuizResult[]>(() => {
    try {
      const saved = localStorage.getItem('quiz_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const updateHistory = (newHistory: QuizResult[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('quiz_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save history to localStorage:', e);
    }
  };

  const handleDocumentParsed = (doc: DocumentSource, destination: 'quiz' | 'chat' = 'quiz') => {
    setDocumentSource(doc);
    setGlobalError(null);
    setActiveStep(destination === 'chat' ? 'chat' : 'config');
  };

  const handleGenerateQuiz = async (config: QuizConfig) => {
    if (!documentSource) return;
    setCurrentConfig(config);
    setIsGenerating(true);
    setGlobalError(null);

    try {
      const questions = await generateQuizWithGemini(documentSource.extractedText, config);
      setGeneratedQuestions(questions);
      setActiveStep('quiz');
    } catch (err: any) {
      console.error('Generation error:', err);
      setGlobalError(err.message || 'Failed to generate quiz. Please check your API key or input text.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinishQuiz = (result: QuizResult) => {
    setActiveResult(result);
    // Add to history
    const updatedHistory = [result, ...history.filter((h) => h.id !== result.id)];
    updateHistory(updatedHistory);
    setActiveStep('results');
  };

  const handleSelectHistoryQuiz = (quiz: QuizResult) => {
    setActiveResult(quiz);
    setActiveStep('results');
  };

  const handleDeleteHistoryQuiz = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    updateHistory(updated);
  };

  const handleNewQuiz = () => {
    setDocumentSource(null);
    setCurrentConfig(null);
    setGeneratedQuestions([]);
    setActiveResult(null);
    setGlobalError(null);
    setActiveStep('upload');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        onOpenHistory={() => setActiveStep('history')}
        onOpenChat={() => documentSource && setActiveStep('chat')}
        onNewQuiz={handleNewQuiz}
        historyCount={history.length}
        hasDocument={Boolean(documentSource)}
        activeStep={activeStep}
      />

      {/* Main Page Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Global Error Banner */}
        {globalError && (
          <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-sm flex items-start gap-3 shadow-xl animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-white">Quiz Generation Error</p>
              <p className="text-xs text-rose-300 mt-0.5">{globalError}</p>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="text-rose-400 hover:text-white text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Upload */}
        {activeStep === 'upload' && (
          <FileUploader onDocumentParsed={handleDocumentParsed} />
        )}

        {/* Step 2: Configuration */}
        {activeStep === 'config' && documentSource && (
          <QuizConfigForm
            documentSource={documentSource}
            onBack={() => setActiveStep('upload')}
            onGenerateQuiz={handleGenerateQuiz}
            isGenerating={isGenerating}
          />
        )}

        {/* Document-grounded AI Chat */}
        {activeStep === 'chat' && documentSource && (
          <DocumentChat
            documentSource={documentSource}
            onBackToQuiz={() => setActiveStep('config')}
          />
        )}

        {/* Step 3: Interactive Quiz / Test */}
        {activeStep === 'quiz' && currentConfig && documentSource && (
          <QuizContainer
            questions={generatedQuestions}
            config={currentConfig}
            sourceFileName={documentSource.fileName}
            onFinishQuiz={handleFinishQuiz}
            onBackToConfig={() => setActiveStep('config')}
          />
        )}

        {/* Step 4: Results & Score Analytics */}
        {activeStep === 'results' && activeResult && (
          <ScoreSummary
            result={activeResult}
            onRetryQuiz={() => setActiveStep('quiz')}
            onNewQuiz={handleNewQuiz}
          />
        )}

        {/* Step 5: History List */}
        {activeStep === 'history' && (
          <HistoryList
            history={history}
            onSelectQuiz={handleSelectHistoryQuiz}
            onDeleteQuiz={handleDeleteHistoryQuiz}
            onBack={handleNewQuiz}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 AI-Powered Reviewer & Quiz Generator.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>PDF & PPTX Extractor</span>
            <span>•</span>
            <span>Tagalog & Taglish Ready</span>
            <span>•</span>
            <span>Client-Side Privacy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
