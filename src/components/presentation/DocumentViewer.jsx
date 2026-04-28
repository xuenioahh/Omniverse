import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * DocumentViewer
 * - PDF: PDF.js canvas rendering (client-side, no upload needed)
 * - PPTX/PPT/DOC/DOCX: local fallback with file metadata and guidance
 */
export default function DocumentViewer({ currentPage, onTotalPages }) {
  const [status, setStatus] = useState("loading");
  const [pageImages, setPageImages] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [documentMeta, setDocumentMeta] = useState(null);
  const fileData = sessionStorage.getItem("presentationFileUrl") || sessionStorage.getItem("presentationFileData");
  const fileName = sessionStorage.getItem("presentationFile") || "";
  const ext = fileName.toLowerCase().split(".").pop();

  useEffect(() => {
    setStatus("loading");
    setPageImages([]);
    setErrorMsg("");
    setDocumentMeta(null);

    if (!fileData) {
      setStatus("error");
      setErrorMsg("No file found. Please go back and upload again.");
      return;
    }

    if (ext === "pdf") {
      renderPDF(fileData);
    } else {
      loadLocalDocument(fileData, fileName, ext);
    }
  }, [ext, fileData, fileName]);

  /* ───── PDF via PDF.js ───── */
  const renderPDF = async (fileData) => {
    try {
      if (!window.pdfjsLib) {
        await Promise.race([
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"),
          waitForTimeout(8000, "Timed out while loading the PDF viewer."),
        ]);
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      const pdfSource = fileData.startsWith("blob:")
        ? fileData
        : { data: base64ToUint8Array(fileData.split(",")[1]) };
      const pdf = await window.pdfjsLib.getDocument(pdfSource).promise;
      const total = pdf.numPages;
      onTotalPages(total);

      const images = [];
      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const scale = 2.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        images.push(canvas.toDataURL("image/jpeg", 0.92));
      }

      setPageImages(images);
      setStatus("pdf");
    } catch (err) {
      console.error("PDF render error:", err);
      const fileName = sessionStorage.getItem("presentationFile") || "";
      const ext = fileName.toLowerCase().split(".").pop() || "pdf";
      setDocumentMeta({
        fileName,
        ext,
        fileData,
      });
      setStatus("local-document");
      setErrorMsg("Preview could not be loaded, but practice can continue.");
    }
  };

  const loadLocalDocument = async (fileData, fileName, ext) => {
    try {
      setDocumentMeta({
        fileName,
        ext,
        fileData,
      });
      onTotalPages(1);
      setStatus("local-document");
    } catch (err) {
      console.error("Local document fallback error:", err);
      setStatus("error");
      setErrorMsg("Failed to load document: " + err.message);
    }
  };

  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

  const waitForTimeout = (ms, message) => new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error(message)), ms);
  });

  const base64ToUint8Array = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  /* ───── Render ───── */
  if (status === "loading") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-[15px] text-muted-foreground">Loading document...</p>
          <p className="text-[14px] text-muted-foreground/60">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-3 px-6">
          <AlertCircle className="w-10 h-10 text-accent mx-auto" />
          <p className="text-[15px] text-foreground font-medium">Could not load document</p>
          <p className="text-[14px] text-muted-foreground">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (status === "pdf") {
    const imgSrc = pageImages[currentPage - 1];
    return (
      <div className="w-full h-full overflow-auto bg-gray-900/20 flex items-start justify-center p-3">
        {imgSrc ? (
          <img
            key={currentPage}
            src={imgSrc}
            alt={`Page ${currentPage}`}
            className="w-full h-auto rounded-lg shadow-xl"
            style={{ display: "block", maxWidth: "100%" }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </div>
    );
  }

  if (status === "local-document" && documentMeta) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="max-w-xl w-full glass rounded-2xl p-8 space-y-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <p className="text-[24px] font-semibold text-foreground">{documentMeta.fileName}</p>
            <p className="text-[20px] text-muted-foreground mt-2">
              Local mode cannot render `{documentMeta.ext.toUpperCase()}` slides directly in-browser.
            </p>
            {errorMsg && (
              <p className="text-[16px] text-amber-200 mt-3">{errorMsg}</p>
            )}
          </div>
          <div className="glass rounded-xl p-4.5 text-left space-y-3">
            <p className="text-[20px] text-muted-foreground">
              Continue practicing with:
            </p>
            <p className="text-[20px] text-muted-foreground">1. Keep the document open in your desktop app</p>
            <p className="text-[20px] text-muted-foreground">2. Use this app for timing and local feedback</p>
            <p className="text-[20px] text-muted-foreground">3. Use PDF files when you want in-browser preview</p>
          </div>
          <a
            href={documentMeta.fileData}
            download={documentMeta.fileName}
            className="inline-flex items-center justify-center w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[22px] font-semibold"
          >
            Download Local Copy
          </a>
        </div>
      </div>
    );
  }

  return null;
}
