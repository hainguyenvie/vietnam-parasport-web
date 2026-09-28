"use client";

import { getApiUrl } from "@/utils/api";

import { useState, useEffect, useRef } from "react";
import { VolumeX, Pause, Play } from "lucide-react";

export default function TextToSpeech({ textToRead }: { textToRead: string }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [useFallback, setUseFallback] = useState(false);
  const [sentences, setSentences] = useState<string[]>([]);
  const [, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSentenceIndexRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("speechSynthesis" in window) {
        setIsSupported(true);

        const checkVoices = () => {
          const currentVoices = window.speechSynthesis.getVoices();
          const hasViVoice = currentVoices.some(voice => 
            voice.lang.toLowerCase().replace('_', '-').startsWith('vi-') || 
            voice.lang.toLowerCase() === 'vi' ||
            voice.name.toLowerCase().includes('vietnam') || 
            voice.name.toLowerCase().includes('việt') ||
            voice.name.toLowerCase().includes('hoaimy') ||
            voice.name.toLowerCase().includes('namminh')
          );
          setUseFallback(!hasViVoice);
          setVoices(currentVoices);
        };

        checkVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = checkVoices;
        }
      } else {
        // Fallback for browsers without SpeechSynthesis support
        setIsSupported(true);
        setUseFallback(true);
      }
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const playFallback = (list: string[], index: number, rateValue: number) => {
    if (index >= list.length) {
      setIsPlaying(false);
      setIsPaused(false);
      currentSentenceIndexRef.current = 0;
      return;
    }

    currentSentenceIndexRef.current = index;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const sentence = list[index];
    // Google Translate TTS limit is 200 characters
    const cleanSentence = sentence.substring(0, 180);
    audioRef.current.src = `/api/tts?text=${encodeURIComponent(cleanSentence)}`;
    audioRef.current.playbackRate = rateValue;

    audioRef.current.onended = () => {
      playFallback(list, index + 1, rateValue);
    };

    audioRef.current.onerror = (e) => {
      console.error("Fallback speech error, skipping to next:", e);
      playFallback(list, index + 1, rateValue);
    };

    audioRef.current.play().catch(err => {
      console.error("Audio play failed:", err);
      setIsPlaying(false);
      setIsPaused(false);
    });
  };

  const playNative = (list: string[], startIndex: number, rateValue: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const currentVoices = window.speechSynthesis.getVoices();
    let viVoice = currentVoices.find(voice => 
      voice.lang.toLowerCase().replace('_', '-').startsWith('vi-') || 
      voice.lang.toLowerCase() === 'vi'
    );

    if (!viVoice) {
      viVoice = currentVoices.find(voice => 
        voice.name.toLowerCase().includes('vietnam') || 
        voice.name.toLowerCase().includes('việt') ||
        voice.name.toLowerCase().includes('hoaimy') || 
        voice.name.toLowerCase().includes('namminh')
      );
    }

    const utterances: SpeechSynthesisUtterance[] = [];

    for (let i = startIndex; i < list.length; i++) {
      const sentence = list[i];
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = "vi-VN";
      utterance.rate = rateValue;

      if (viVoice) {
        utterance.voice = viVoice;
      }

      const idx = i;
      utterance.onstart = () => {
        currentSentenceIndexRef.current = idx;
      };

      if (i === list.length - 1) {
        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
          currentSentenceIndexRef.current = 0;
        };
      }

      utterance.onerror = (e) => {
        console.error("Native speech error on index", idx, e);
      };

      utterances.push(utterance);
      window.speechSynthesis.speak(utterance);
    }

    // Keep reference to prevent GC
    (window as any)._activeUtterances = utterances;
  };

  const handlePlay = () => {
    if (isPaused) {
      setIsPaused(false);
      setIsPlaying(true);
      if (useFallback) {
        audioRef.current?.play().catch(err => console.error("Audio resume failed", err));
      } else {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.resume();
        }
      }
      return;
    }

    if (isPlaying) {
      setIsPaused(true);
      setIsPlaying(false);
      if (useFallback) {
        audioRef.current?.pause();
      } else {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.pause();
        }
      }
      return;
    }

    // Clean HTML tags and parse into sentences
    const getCleanText = (html: string) => {
      if (typeof window === "undefined") return html.replace(/<[^>]+>/g, ' ');
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    };

    const cleanText = getCleanText(textToRead);
    const parsedSentences = cleanText
      .split(/[.?!;\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (parsedSentences.length === 0) return;

    setSentences(parsedSentences);
    setIsPlaying(true);
    setIsPaused(false);

    if (useFallback) {
      playFallback(parsedSentences, 0, speechRate);
    } else {
      playNative(parsedSentences, 0, speechRate);
    }
  };

  const changeRate = (rate: number) => {
    setSpeechRate(rate);

    if (isPlaying || isPaused) {
      if (useFallback) {
        if (audioRef.current) {
          audioRef.current.playbackRate = rate;
        }
      } else {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const currentIndex = currentSentenceIndexRef.current;
          if (isPlaying) {
            playNative(sentences, currentIndex, rate);
          } else {
            playNative(sentences, currentIndex, rate);
            window.speechSynthesis.pause();
          }
        }
      }
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsPaused(false);
    currentSentenceIndexRef.current = 0;

    if (useFallback) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } else {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  if (!isSupported) return null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <button 
          onClick={handlePlay}
          className={`h-10 flex items-center justify-center gap-2 px-4 rounded-full font-medium transition shadow-sm border ${isPlaying ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}
          aria-label="Đọc bài viết"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? "Tạm dừng" : isPaused ? "Tiếp tục đọc" : "Nghe bài viết"}
        </button>
        
        {(isPlaying || isPaused) && (
          <button 
            onClick={handleStop}
            className="w-10 h-10 flex items-center justify-center bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-full dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition shadow-sm"
            aria-label="Dừng đọc"
          >
            <VolumeX size={18} />
          </button>
        )}
      </div>

      <div className="h-10 flex items-center gap-1 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-full px-4 shadow-sm font-semibold">
        <span className="text-slate-500 mr-1.5">Tốc độ:</span>
        <button 
          onClick={() => changeRate(0.75)} 
          className={`px-2 py-0.5 rounded-md transition ${speechRate === 0.75 ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
        >
          0.75x
        </button>
        <button 
          onClick={() => changeRate(0.9)} 
          className={`px-2 py-0.5 rounded-md transition ${speechRate === 0.9 ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
        >
          1.0x
        </button>
        <button 
          onClick={() => changeRate(1.25)} 
          className={`px-2 py-0.5 rounded-md transition ${speechRate === 1.25 ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
        >
          1.25x
        </button>
        <button 
          onClick={() => changeRate(1.5)} 
          className={`px-2 py-0.5 rounded-md transition ${speechRate === 1.5 ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
        >
          1.5x
        </button>
      </div>
    </div>
  );
}
