import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Presentation as PresentationIcon, Camera, CameraOff, Play, AlertCircle, X, FileType, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { extractPdfPageTexts } from "@/lib/pdfText";

export default function Presentation() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("idle"); // idle | requesting | active | denied
  const [cameraStream, setCameraStream] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach(t => t.stop());
    };
  }, [cameraStream]);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const requestCamera = async () => {
    setCameraStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop tracks immediately — we just need permission, preview is shown during practice
      stream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      setCameraStatus("granted");
    } catch (err) {
      console.error("Camera error:", err);
      setCameraStatus("denied");
    }
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setCameraStatus("idle");
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const previousUrl = sessionStorage.getItem("presentationFileUrl");
    if (previousUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previousUrl);
      sessionStorage.removeItem("presentationFileUrl");
    }
    const allowed = ["application/pdf"];
    const isAllowed = allowed.includes(selectedFile.type) ||
      selectedFile.name.toLowerCase().endsWith(".pdf");
    
    if (!isAllowed) {
      alert("Please upload a PDF file only.");
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const canStart = Boolean(file);

  const handleStart = () => {
    if (!file || isStarting) return;

    setIsStarting(true);
    sessionStorage.setItem("presentationFile", file.name);
    sessionStorage.setItem("presentationFileType", file.type || "");
    const previousUrl = sessionStorage.getItem("presentationFileUrl");
    if (previousUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previousUrl);
    }
    const fileUrl = URL.createObjectURL(file);
    sessionStorage.setItem("presentationFileUrl", fileUrl);
    sessionStorage.removeItem("presentationPdfPageTexts");
    sessionStorage.removeItem("presentationFileData");
    sessionStorage.removeItem("presentationTranscriptCombined");
    sessionStorage.removeItem("presentationTranscriptHistory");
    sessionStorage.removeItem("presentationLiveTranscript");
    sessionStorage.removeItem("presentationPauseHistory");
    sessionStorage.removeItem("presentationPauseFeedbackPayload");
    sessionStorage.removeItem("presentationAnalysisSnapshot");
    if (file.name.toLowerCase().endsWith(".pdf")) {
      sessionStorage.setItem("presentationPdfTextStatus", "pending");
      sessionStorage.setItem("presentationPdfPageTexts", JSON.stringify([]));
      void extractPdfPageTexts(fileUrl)
        .then((pageTexts) => {
          sessionStorage.setItem("presentationPdfPageTexts", JSON.stringify(pageTexts));
          sessionStorage.setItem("presentationPdfTextStatus", "ready");
        })
        .catch((error) => {
          console.error("Failed to extract PDF text:", error);
          sessionStorage.setItem("presentationPdfPageTexts", JSON.stringify([]));
          sessionStorage.setItem("presentationPdfTextStatus", "error");
        });
    } else {
      sessionStorage.setItem("presentationPdfPageTexts", JSON.stringify([]));
      sessionStorage.setItem("presentationPdfTextStatus", "ready");
    }

    navigate("/presentation/analysis");
  };

  const getFileIcon = (f) => {
    if (!f) return FileText;
    const name = f.name.toLowerCase();
    if (name.endsWith(".pdf")) return FileType;
    if (name.endsWith(".ppt") || name.endsWith(".pptx")) return PresentationIcon;
    return FileText;
  };

  const FileIcon = getFileIcon(file);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <PresentationIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-space text-foreground">Presentation</h1>
                <p className="text-[11px] text-muted-foreground">Practice your speaking & delivery</p>
              </div>
            </div>
            <Link
              to="/presentation/history"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors glass rounded-xl px-3 py-1.5"
            >
              <History className="w-3.5 h-3.5" />
              History
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-4">
        {/* File Upload */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-sm font-semibold text-foreground mb-2">📄 Upload Your PDF</h2>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`glass rounded-2xl p-6 text-center transition-all cursor-pointer ${
              dragOver ? "border-primary/50 bg-primary/5" : "hover:bg-white/5"
            } ${file ? "cursor-default" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            
            {file ? (
              <div className="flex items-center gap-3 justify-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <FileIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const previousUrl = sessionStorage.getItem("presentationFileUrl");
                    if (previousUrl?.startsWith("blob:")) {
                      URL.revokeObjectURL(previousUrl);
                      sessionStorage.removeItem("presentationFileUrl");
                    }
                    setFile(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Drop your PDF here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">PDF only</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Camera Setup */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold text-foreground mb-2">Video feedback</h2>
          <div className="glass rounded-2xl p-4">
            <AnimatePresence mode="wait">
              {(cameraStatus === "active" || cameraStatus === "granted") ? (
                <motion.div key="granted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-success">Ready ✓</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Optional. You can start now and still get posture and eye-contact feedback.</p>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="text-xs text-muted-foreground hover:text-accent"
                  >
                    <CameraOff className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : cameraStatus === "denied" ? (
                <motion.div key="denied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4 space-y-2">
                  <AlertCircle className="w-8 h-8 text-accent mx-auto" />
                    <p className="text-sm text-foreground font-medium">Video access denied</p>
                    <p className="text-xs text-muted-foreground">You can ignore this and start practice now, or allow access in browser settings later.</p>
                  <Button onClick={requestCamera} size="sm" variant="outline" className="mt-2 border-white/10">
                    Try Again
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Optional</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Turn this on only if you want posture and eye-contact feedback.</p>
                  </div>
                  <Button
                    onClick={requestCamera}
                    size="sm"
                    className="bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl"
                    disabled={cameraStatus === "requesting"}
                  >
                    {cameraStatus === "requesting" ? "Requesting..." : "Enable"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {file && (
            <p className="text-center text-xs text-muted-foreground mb-2">
              Next: review the brief intro, then begin slide-by-slide practice.
            </p>
          )}
          {!canStart && (
            <p className="text-center text-xs text-muted-foreground mb-2">
              {!file ? "Upload a PDF to continue" : "You can start now. Video is optional."}
            </p>
          )}
          <Button
            onClick={handleStart}
            disabled={!canStart || isStarting}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-base disabled:opacity-40"
          >
            <Play className="w-5 h-5 mr-2" />
            {isStarting ? "Opening..." : "Start Practice"}
          </Button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
