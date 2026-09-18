import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  BookOpenCheck,
  FileText,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { chatWithDocument } from '../../services/gemini';
import type { ChatMessage, DocumentSource } from '../../types/quiz';

interface DocumentChatProps {
  documentSource: DocumentSource;
  onBackToQuiz: () => void;
}

const suggestedPrompts = [
  'Create a comprehensive reviewer for a long quiz. Organize the key concepts, terms, and facts by topic.',
  'Summarize this material into clear study notes.',
  'List the most important terms and explain each one.',
  'Create 15 practice questions with an answer key.',
];

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

const InlineText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={index} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
};

const FormattedMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="space-y-2 leading-relaxed">
    {content.split('\n').map((line, index) => {
      const heading = line.match(/^#{1,3}\s+(.+)/);
      const bullet = line.match(/^[-*]\s+(.+)/);
      const numbered = line.match(/^(\d+)\.\s+(.+)/);

      if (heading) {
        return (
          <p key={index} className="pt-2 text-sm font-extrabold text-white">
            <InlineText text={heading[1]} />
          </p>
        );
      }

      if (bullet) {
        return (
          <div key={index} className="flex gap-2 pl-1">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
            <p><InlineText text={bullet[1]} /></p>
          </div>
        );
      }

      if (numbered) {
        return (
          <div key={index} className="flex gap-2 pl-1">
            <span className="min-w-5 font-bold text-indigo-300">{numbered[1]}.</span>
            <p><InlineText text={numbered[2]} /></p>
          </div>
        );
      }

      return line ? <p key={index}><InlineText text={line} /></p> : <div key={index} className="h-1" />;
    })}
  </div>
);

export const DocumentChat: React.FC<DocumentChatProps> = ({ documentSource, onBackToQuiz }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      'assistant',
      `I’m ready to help with **${documentSource.fileName}**. Ask about a topic, request a summary, or have me create a reviewer for your long quiz.`
    ),
  ]);
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isResponding]);

  const sendMessage = async (prompt: string) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isResponding) return;

    const userMessage = createMessage('user', cleanPrompt);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsResponding(true);

    try {
      const answer = await chatWithDocument(documentSource.extractedText, nextMessages);
      setMessages((current) => [...current, createMessage('assistant', answer)]);
    } catch (err: any) {
      setError(err.message || 'The AI could not answer right now. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 animate-fadeIn">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onBackToQuiz}
          className="flex w-fit items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Quiz options
        </button>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
          <MessageSquareText className="h-3.5 w-3.5" />
          Ask AI about your document
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900/90 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-indigo-300">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold text-white">Document Study Chat</h1>
              <p className="truncate text-xs text-slate-400">
                {documentSource.fileName} · {documentSource.characterCount.toLocaleString()} characters
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-300">
            <BookOpenCheck className="h-4 w-4" /> Answers grounded in your file
          </div>
        </div>

        <div className="h-[52vh] min-h-[420px] space-y-5 overflow-y-auto p-4 sm:p-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[78%] ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-indigo-600 text-white'
                    : 'rounded-bl-md border border-slate-700/70 bg-slate-800/80 text-slate-200'
                }`}
              >
                <FormattedMessage content={message.content} />
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-700">
                  <User className="h-4 w-4 text-slate-200" />
                </div>
              )}
            </div>
          ))}

          {isResponding && (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-700/70 bg-slate-800/80 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                Reading your material and preparing an answer...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-5">
          {messages.length === 1 && (
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={isResponding}
                  className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-left text-xs text-slate-300 transition-colors hover:border-indigo-500/50 hover:bg-indigo-950/30 hover:text-white disabled:opacity-50"
                >
                  <Sparkles className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${index === 0 ? 'text-amber-300' : 'text-purple-300'}`} />
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (input.trim()) void sendMessage(input);
                }
              }}
              rows={2}
              maxLength={4000}
              placeholder="Ask a question or say “Create a reviewer for my long quiz”..."
              className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isResponding}
              aria-label="Send message"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 transition-all hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isResponding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-slate-600">
            AI answers can make mistakes. Verify important details against the uploaded material.
          </p>
        </div>
      </div>
    </div>
  );
};
