import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Presentation, FileCode, 
  AlertTriangle, Loader2, File, ArrowRight, RefreshCw, X 
} from 'lucide-react';
import { parsePdfFile } from '../../services/pdfParser';
import { parsePptxFile } from '../../services/pptxParser';
import type { DocumentSource } from '../../types/quiz';

interface FileUploaderProps {
  onDocumentParsed: (doc: DocumentSource) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onDocumentParsed }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedWarning, setScannedWarning] = useState<boolean>(false);
  const [parsedDoc, setParsedDoc] = useState<DocumentSource | null>(null);

  const [rawText, setRawText] = useState('');
  const [rawTitle, setRawTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE_MB = 15;

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setScannedWarning(false);
    setParsedDoc(null);

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File exceeds maximum size limit of ${MAX_SIZE_MB}MB.`);
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf' && extension !== 'pptx' && extension !== 'txt') {
      setErrorMessage('Unsupported file format. Please upload a .pdf, .pptx, or .txt file.');
      return;
    }

    setParsing(true);
    setProgress(10);

    try {
      let extractedText = '';
      let itemCount = 1;
      let isWarning = false;
      let docType: 'pdf' | 'pptx' | 'txt' = 'pdf';

      if (extension === 'pdf') {
        docType = 'pdf';
        const res = await parsePdfFile(file, (p) => setProgress(p));
        extractedText = res.text;
        itemCount = res.pageCount;
        isWarning = res.isScannedWarning;
      } else if (extension === 'pptx') {
        docType = 'pptx';
        const res = await parsePptxFile(file, (p) => setProgress(p));
        extractedText = res.text;
        itemCount = res.pageCount;
        isWarning = res.isScannedWarning;
      } else {
        docType = 'txt';
        extractedText = await file.text();
        itemCount = Math.max(1, Math.ceil(extractedText.length / 1500));
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No readable text could be extracted from this document.');
      }

      const doc: DocumentSource = {
        fileName: file.name,
        fileSize: file.size,
        fileType: docType,
        extractedText,
        itemCount,
        characterCount: extractedText.length,
        uploadDate: new Date().toLocaleDateString()
      };

      setParsedDoc(doc);
      setScannedWarning(isWarning);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while parsing the document.');
    } finally {
      setParsing(false);
      setProgress(100);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRawTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    const doc: DocumentSource = {
      fileName: rawTitle.trim() || 'Custom Text Material.txt',
      fileSize: new Blob([rawText]).size,
      fileType: 'txt',
      extractedText: rawText.trim(),
      itemCount: Math.max(1, Math.ceil(rawText.length / 1500)),
      characterCount: rawText.length,
      uploadDate: new Date().toLocaleDateString()
    };

    onDocumentParsed(doc);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          Step 1: Upload Study Material
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Turn Your Notes into Smart Quizzes
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Upload any PDF or PPTX study file. Our client-side parser extracts text and prepares personalized practice questions instantly.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'file'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          File Upload (.pdf, .pptx)
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'text'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Paste Text / Notes
        </button>
      </div>

      {/* Main Upload Box */}
      {activeTab === 'file' ? (
        <div className="space-y-4">
          
          {!parsedDoc && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : 'border-slate-800 bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-900/90'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                {parsing ? (
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>

              {parsing ? (
                <div className="space-y-3 max-w-xs mx-auto">
                  <p className="text-sm font-semibold text-white">Extracting Document Text...</p>
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
                    Drag and drop your file here, or <span className="text-indigo-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports <strong>PDF (.pdf)</strong> and <strong>PowerPoint (.pptx)</strong> up to 15MB
                  </p>
                  <div className="pt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-rose-400" /> Multi-page PDF
                    </span>
                    <span className="flex items-center gap-1">
                      <Presentation className="w-3.5 h-3.5 text-amber-400" /> PPTX Slides
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-white">Parsing Error</p>
                <p className="text-xs text-rose-300 mt-0.5">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Parsed File Preview Card */}
          {parsedDoc && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-fadeIn">
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    parsedDoc.fileType === 'pdf'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : parsedDoc.fileType === 'pptx'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {parsedDoc.fileType === 'pdf' ? (
                      <FileText className="w-6 h-6" />
                    ) : parsedDoc.fileType === 'pptx' ? (
                      <Presentation className="w-6 h-6" />
                    ) : (
                      <File className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white truncate max-w-sm sm:max-w-md">
                      {parsedDoc.fileName}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatBytes(parsedDoc.fileSize)}</span>
                      <span>•</span>
                      <span>
                        {parsedDoc.itemCount} {parsedDoc.fileType === 'pptx' ? 'Slides' : 'Pages'}
                      </span>
                      <span>•</span>
                      <span>{parsedDoc.characterCount.toLocaleString()} Characters</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setParsedDoc(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Change
                </button>
              </div>

              {/* Scanned Image Warning */}
              {scannedWarning && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-200">Scanned Document Notice</span>
                    <p className="mt-0.5">
                      Very little text was extracted. This file may contain scanned image pages without embedded text layers.
                    </p>
                  </div>
                </div>
              )}

              {/* Extracted Text Snippet Preview */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Extracted Text Preview
                </label>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 text-xs font-mono max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
                  {parsedDoc.extractedText.slice(0, 700)}
                  {parsedDoc.extractedText.length > 700 && '...'}
                </div>
              </div>

              {/* Proceed Action Button */}
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
      ) : (
        /* Manual Text Paste Tab */
        <form onSubmit={handleRawTextSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Material Title (Optional)
            </label>
            <input
              type="text"
              value={rawTitle}
              onChange={(e) => setRawTitle(e.target.value)}
              placeholder="e.g. Philippine History Chapter 4"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Paste Notes or Study Content
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste lecture notes, articles, or summary text here..."
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono resize-none"
              required
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {rawText.length.toLocaleString()} characters
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!rawText.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              Configure Quiz Options
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
