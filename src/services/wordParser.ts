export interface WordParseResult {
  text: string;
  sectionCount: number;
}

export async function parseWordFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<WordParseResult> {
  try {
    onProgress?.(20);
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(50);

    // Keep the document parser out of the initial application bundle. It is
    // only downloaded when a user actually selects a Word document.
    const { default: mammoth } = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (!text) {
      throw new Error('No readable text was found in this Word document.');
    }

    const sectionCount = Math.max(
      1,
      text.split(/\n\s*\n/).filter((section) => section.trim().length > 0).length
    );

    onProgress?.(100);
    return { text, sectionCount };
  } catch (error) {
    console.error('Word parsing error:', error);
    if (error instanceof Error && error.message.startsWith('No readable text')) {
      throw error;
    }
    throw new Error('Failed to read the Word document. Make sure it is a valid .docx file.');
  }
}
