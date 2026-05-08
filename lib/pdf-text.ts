import { Buffer } from "node:buffer";

type PdfParserInstance = {
  on: (event: "pdfParser_dataError" | "pdfParser_dataReady", callback: (data: unknown) => void) => void;
  parseBuffer: (buffer: Buffer) => void;
  getRawTextContent: () => string;
  destroy?: () => void;
};

type PdfParserConstructor = new () => PdfParserInstance;

type PdfTextRun = { T?: string };
type PdfTextBlock = { x?: number; y?: number; R?: PdfTextRun[] };
type PdfPage = { Texts?: PdfTextBlock[] };
type PdfData = { Pages?: PdfPage[] };

function decodePdfText(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractStructuredText(data: unknown) {
  const pdfData = data as PdfData;

  return (pdfData.Pages || [])
    .map((page) =>
      (page.Texts || [])
        .slice()
        .sort((a, b) => (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0))
        .map((block) => (block.R || []).map((run) => decodePdfText(run.T || "")).join(""))
        .filter(Boolean)
        .join("\n")
    )
    .filter(Boolean)
    .join("\n\n");
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const PDFParser = (await import("pdf2json")).default as unknown as PdfParserConstructor;

  return new Promise((resolve, reject) => {
    const parser = new PDFParser();

    parser.on("pdfParser_dataError", (error) => {
      parser.destroy?.();
      reject(error);
    });

    parser.on("pdfParser_dataReady", (data) => {
      try {
        const rawText = parser.getRawTextContent();
        const text = rawText.trim() ? rawText : extractStructuredText(data);
        parser.destroy?.();
        resolve(text);
      } catch (error) {
        parser.destroy?.();
        reject(error);
      }
    });

    parser.parseBuffer(buffer);
  });
}
