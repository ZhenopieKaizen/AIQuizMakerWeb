import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParseResult {
  text: string;
  pageCount: number;
  isScannedWarning: boolean;
}

export async function parsePdfFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;

      if (onProgress) {
        onProgress(Math.round((pageNum / pageCount) * 100));
      }
    }

    const trimmedText = fullText.trim();
    const isScannedWarning = pageCount > 0 && trimmedText.replace(/--- Page \d+ ---/g, '').trim().length < 50;

    return {
      text: trimmedText,
      pageCount,
      isScannedWarning
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF document. The file might be corrupted or password protected.');
  }
}
