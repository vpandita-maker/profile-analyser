import { Buffer } from "node:buffer";

type PdfParserInstance = {
  on: (event: "pdfParser_dataError" | "pdfParser_dataReady", callback: (data: unknown) => void) => void;
  parseBuffer: (buffer: Buffer) => void;
  getRawTextContent: () => string;
  destroy?: () => void;
};

type PdfParserConstructor = new () => PdfParserInstance;

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const PDFParser = (await import("pdf2json")).default as unknown as PdfParserConstructor;

  return new Promise((resolve, reject) => {
    const parser = new PDFParser();

    parser.on("pdfParser_dataError", (error) => {
      parser.destroy?.();
      reject(error);
    });

    parser.on("pdfParser_dataReady", () => {
      try {
        const text = parser.getRawTextContent();
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
