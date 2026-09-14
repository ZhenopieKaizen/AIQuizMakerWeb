import JSZip from 'jszip';
import type { ParseResult } from './pdfParser';

export async function parsePptxFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ParseResult> {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);

    // Find all slide XML files in ppt/slides/
    const slideFiles = Object.keys(contents.files)
      .filter((filename) => /^ppt\/slides\/slide\d+\.xml$/i.test(filename))
      .sort((a, b) => {
        const matchA = a.match(/\d+/);
        const matchB = b.match(/\d+/);
        const numA = parseInt(matchA ? matchA[0] : '0', 10);
        const numB = parseInt(matchB ? matchB[0] : '0', 10);
        return numA - numB;
      });

    if (slideFiles.length === 0) {
      throw new Error('No slides found in PPTX file.');
    }

    let fullText = '';
    const slideCount = slideFiles.length;
    const parser = new DOMParser();

    for (let i = 0; i < slideCount; i++) {
      const slidePath = slideFiles[i];
      const xmlText = await contents.files[slidePath].async('text');
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

      // Extract all text inside <a:t> elements
      const textNodes = xmlDoc.getElementsByTagName('a:t');
      const slideTexts: string[] = [];

      for (let j = 0; j < textNodes.length; j++) {
        const t = textNodes[j].textContent;
        if (t && t.trim()) {
          slideTexts.push(t.trim());
        }
      }

      fullText += `--- Slide ${i + 1} ---\n${slideTexts.join(' ')}\n\n`;

      if (onProgress) {
        onProgress(Math.round(((i + 1) / slideCount) * 100));
      }
    }

    const trimmedText = fullText.trim();
    const isScannedWarning = slideCount > 0 && trimmedText.replace(/--- Slide \d+ ---/g, '').trim().length < 30;

    return {
      text: trimmedText,
      pageCount: slideCount,
      isScannedWarning
    };
  } catch (error) {
    console.error('PPTX parsing error:', error);
    throw new Error('Failed to parse PPTX file. Ensure it is a valid PowerPoint presentation.');
  }
}
