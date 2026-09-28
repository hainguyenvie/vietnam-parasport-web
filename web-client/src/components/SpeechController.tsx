"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Volume2, Settings2 } from "lucide-react";

interface SpeechControllerProps {
  textToRead: string;
}

export default function SpeechController({ textToRead }: SpeechControllerProps) {
  const [status, setStatus] = useState<"stopped" | "playing" | "paused">("stopped");
  const [rate, setRate] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      // Clean up speech synthesis when component unmounts
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanText = (htmlText: string): string => {
    if (typeof document === "undefined") return htmlText;
    const div = document.createElement("div");
    div.innerHTML = htmlText;
    return div.textContent || div.innerText || "";
  };

  const handlePlay = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (status === "paused") {
      window.speechSynthesis.resume();
      setStatus("playing");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const plainText = cleanText(textToRead);
    if (!plainText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utteranceRef.current = utterance;
    
    // Find Vietnamese voice
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(voice => voice.lang.startsWith("vi") || voice.lang.includes("VN"));
    if (viVoice) {
      utterance.voice = viVoice;
    }
    
    utterance.lang = "vi-VN";
    utterance.rate = rate;

    utterance.onend = () => {
      setStatus("stopped");
    };

    utterance.onerror = () => {
      setStatus("stopped");
    };

    window.speechSynthesis.speak(utterance);
    setStatus("playing");
  };

  const handlePause = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (status === "playing") {
      window.speechSynthesis.pause();
      setStatus("paused");
    }
  };

  const handleStop = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setStatus("stopped");
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (status === "playing" && utteranceRef.current && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const plainText = cleanText(textToRead);
        const utterance = new SpeechSynthesisUtterance(plainText);
        utteranceRef.current = utterance;
        
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(voice => voice.lang.startsWith("vi") || voice.lang.includes("VN"));
        if (viVoice) utterance.voice = viVoice;
        
        utterance.lang = "vi-VN";
        utterance.rate = newRate;
        utterance.onend = () => setStatus("stopped");
        utterance.onerror = () => setStatus("stopped");
        
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl mb-8 select-none">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Volume2 size={18} className={status === "playing" ? "animate-pulse" : ""} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Trợ năng giọng nói (TTS)</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {status === "playing" ? "Đang đọc nội dung bài viết..." : status === "paused" ? "Đã tạm dừng đọc" : "Nghe đọc nội dung bài viết"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {status === "playing" ? (
          <button
            onClick={handlePause}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition active:scale-95 shadow-sm"
          >
            <Pause size={14} />
            Tạm dừng
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition active:scale-95 shadow-sm"
          >
            <Play size={14} />
            {status === "paused" ? "Tiếp tục" : "Nghe đọc"}
          </button>
        )}

        {status !== "stopped" && (
          <button
            onClick={handleStop}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition active:scale-90"
            title="Dừng đọc"
          >
            <Square size={14} />
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition active:scale-90"
            title="Điều chỉnh tốc độ"
          >
            <Settings2 size={16} />
          </button>
          {showSettings && (
            <div className="absolute right-0 bottom-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-3 z-30 w-36 animate-in slide-in-from-bottom-2 duration-100">
              <h5 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-2">Tốc độ đọc</h5>
              <div className="flex flex-col gap-1">
                {[0.8, 1.0, 1.2, 1.5].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      handleRateChange(s);
                      setShowSettings(false);
                    }}
                    className={`text-left text-xs px-2 py-1.5 rounded-lg font-semibold transition ${
                      rate === s 
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {s === 1.0 ? "Bình thường" : `${s}x`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
