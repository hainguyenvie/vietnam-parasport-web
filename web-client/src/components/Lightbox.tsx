"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Maximize, Download } from "lucide-react";
import SecureImage from "./SecureImage";

interface LightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function Lightbox({ images, currentIndex, isOpen, onClose }: LightboxProps) {
  const [index, setIndex] = useState(currentIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    // Reset transform when slide changes
    setScale(1);
    setRotation(0);
  }, [index]);

  // Esc key closes, Arrow keys navigate
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, index]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[index];

  const handlePrev = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleToggleFullscreen = () => {
    const element = document.getElementById("lightbox-container");
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error("Error enabling fullscreen", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Extract file name or default
      const filename = currentImage.split("?")[0].split("/").pop() || "download.jpg";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  return (
    <div 
      id="lightbox-container" 
      className="fixed inset-0 bg-black/95 z-[9999] flex flex-col justify-between select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Control Bar */}
      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-b from-black/80 to-transparent text-white z-10">
        <div className="text-sm font-semibold">
          Ảnh {index + 1} / {images.length}
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleZoomIn} title="Phóng to" className="p-2 hover:bg-white/10 rounded-full transition active:scale-90">
            <ZoomIn size={20} />
          </button>
          <button onClick={handleZoomOut} title="Thu nhỏ" className="p-2 hover:bg-white/10 rounded-full transition active:scale-90">
            <ZoomOut size={20} />
          </button>
          <button onClick={handleRotate} title="Xoay 90°" className="p-2 hover:bg-white/10 rounded-full transition active:scale-90">
            <RotateCw size={20} />
          </button>
          <button onClick={handleToggleFullscreen} title="Xem toàn màn hình" className="p-2 hover:bg-white/10 rounded-full transition active:scale-90">
            <Maximize size={20} />
          </button>
          <button onClick={handleDownload} title="Tải xuống trực tiếp" className="p-2 hover:bg-white/10 rounded-full transition active:scale-90">
            <Download size={20} />
          </button>
          <button onClick={onClose} title="Đóng (Esc)" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition ml-2 active:scale-90">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Mid Slider Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4">
        {/* Left Arrow */}
        {images.length > 1 && (
          <button 
            onClick={handlePrev}
            className="absolute left-6 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition z-10 border border-white/5 active:scale-95"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Zoom/Rotate Frame */}
        <div 
          className="transition-transform duration-200 ease-out max-w-full max-h-[80vh] flex items-center justify-center"
          style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
        >
          <SecureImage 
            src={currentImage} 
            alt={`Ảnh xem trước ${index + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl pointer-events-none"
          />
        </div>

        {/* Right Arrow */}
        {images.length > 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-6 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition z-10 border border-white/5 active:scale-95"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Bar */}
      {images.length > 1 && (
        <div className="pb-6 pt-2 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-2 overflow-x-auto px-4 z-10">
          {images.map((img, i) => (
            <div 
              key={i} 
              onClick={() => setIndex(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition shrink-0 ${
                i === index ? "border-blue-500 scale-105 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <SecureImage src={img} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
