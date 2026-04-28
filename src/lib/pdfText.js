function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    const existing = document.querySelector('script[data-pdfjs="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.pdfjsLib), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.dataset.pdfjs = "true";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function buildPdfSource(source) {
  if (!source) {
    throw new Error("Missing PDF source");
  }

  if (source.startsWith("blob:") || source.startsWith("http://") || source.startsWith("https://")) {
    return source;
  }

  const base64 = source.split(",")[1];
  const bytes = base64ToUint8Array(base64);
  return { data: bytes };
}

export async function extractPdfPageTexts(source) {
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument(buildPdfSource(source)).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => item.str || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push(text);
  }

  return pages;
}
