import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  File,
  FileText,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { parseWordFile } from '../../services/wordParser';
import type { DocumentSource } from '../../types/quiz';

interface FileUploaderProps {
  onDocumentParsed: (doc: DocumentSource) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onDocumentParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedDoc, setParsedDoc] = useState<DocumentSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE_MB = 100;

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setParsedDoc(null);

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File exceeds maximum size limit of ${MAX_SIZE_MB}MB.`);
      return;
    }

    if (file.name.split('.').pop()?.toLowerCase() !== 'docx') {
      setErrorMessage('Unsupported file format. Please upload a Microsoft Word .docx file.');
      return;
    }

    setParsing(true);
    setProgress(10);

    try {
      const result = await parseWordFile(file, setProgress);
      const doc: DocumentSource = {
        fileName: file.name,
        fileSize: file.size,
        fileType: 'docx',
        extractedText: result.text,
        itemCount: result.sectionCount,
        characterCount: result.text.length,
        uploadDate: new Date().toLocaleDateString(),
      };

      setParsedDoc(doc);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : 'An error occurred while reading the Word document.'
      );
    } finally {
      setParsing(false);
      setProgress(100);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const unit = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(unit));
    return `${parseFloat((bytes / Math.pow(unit, index)).toFixed(2))} ${sizes[index]}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          Step 1: Upload Study Material
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Turn Your Word Notes into Smart Quizzes
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Upload a Microsoft Word document. Text is extracted in your browser before your quiz is generated.
        </p>
      </div>

      <div className="space-y-4">
        {!parsedDoc && (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => !parsing && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 ${
              parsing ? 'cursor-wait' : 'cursor-pointer'
            } ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                : 'border-slate-800 bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-900/90'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />

            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              {parsing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <File className="w-8 h-8" />
              )}
            </div>

            {parsing ? (
              <div className="space-y-3 max-w-xs mx-auto">
                <p className="text-sm font-semibold text-white">Extracting Word Document Text...</p>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{progress}% processed</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-base font-bold text-white">
                  Drag and drop your Word file here, or{' '}
                  <span className="text-indigo-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400">
                  Supports <strong>Microsoft Word (.docx)</strong> only, up to 100MB
                </p>
                <p className="text-xs text-slate-500">
                  Legacy .doc files must first be saved as .docx in Microsoft Word.
                </p>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white">Word File Error</p>
              <p className="text-xs text-rose-300 mt-0.5">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {parsedDoc && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-fadeIn">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{parsedDoc.fileName}</h3>
                  <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                    <span>{formatBytes(parsedDoc.fileSize)}</span>
                    <span>•</span>
                    <span>{parsedDoc.itemCount} extracted sections</span>
                    <span>•</span>
                    <span>{parsedDoc.characterCount.toLocaleString()} characters</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setParsedDoc(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Extracted Text Preview
              </label>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 text-xs font-mono max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
                {parsedDoc.extractedText.slice(0, 700)}
                {parsedDoc.extractedText.length > 700 && '...'}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onDocumentParsed(parsedDoc)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
              >
                Configure Quiz Options
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
