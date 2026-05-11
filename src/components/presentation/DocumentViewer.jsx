import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * DocumentViewer
 * - PDF: PDF.js canvas rendering (client-side, no upload needed)
 */
export default function DocumentViewer({ currentPage, onTotalPages }) {
  const [status, setStatus] = useState("loading");
  const [pageImages, setPageImages] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const fileData = sessionStorage.getItem("presentationFileUrl") || sessionStorage.getItem("presentationFileData");
  const fileName = sessionStorage.getItem("presentationFile") || "";

  useEffect(() => {
    setStatus("loading");
    setPageImages([]);
    setErrorMsg("");

    if (!fileData) {
      setStatus("error");
      setErrorMsg("No PDF found. Please go back and upload again.");
      return;
    }

    renderPDF(fileData);
  }, [fileData, fileName]);

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
      setStatus("error");
      setErrorMsg("The PDF preview could not be loaded. Please upload the PDF again.");
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
          <p className="text-[15px] text-muted-foreground">Loading PDF...</p>
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
          <p className="text-[15px] text-foreground font-medium">Could not load PDF</p>
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

  return null;
}
