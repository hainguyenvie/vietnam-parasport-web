"use client";

import { useState } from "react";
import { Eye, Type, Contrast, Monitor, RotateCcw, X, Ear } from "lucide-react";
import { useAccessibility } from "./AccessibilityProvider";
import { useLanguage } from "@/hooks/useTranslation";

export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, toggleSetting, resetSettings } = useAccessibility();
  const { language } = useLanguage();

  const labels = {
    vi: {
      title: "Công cụ Tiếp cận",
      highContrast: "Tương phản cao",
      monochrome: "Màu xám (Monochrome)",
      dyslexia: "Phông chữ Dyslexia",
      largeText: "Phóng to văn bản",
      reset: "Khôi phục gốc",
    },
    en: {
      title: "Accessibility Tools",
      highContrast: "High Contrast",
      monochrome: "Monochrome",
      dyslexia: "Dyslexia Font",
      largeText: "Large Text",
      reset: "Reset Settings",
    }
  };

  const t = labels[language as keyof typeof labels] || labels.vi;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-5 z-10 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105"
        aria-label={t.title}
      >
        <Eye size={20} />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-8">
          <div className="p-4 bg-blue-600 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2">
              <Eye size={18} />
              {t.title}
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded-lg transition" aria-label="Đóng">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4 space-y-3">
            <button
              role="switch"
              aria-checked={settings.highContrast}
              onClick={() => toggleSetting('highContrast')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                settings.highContrast 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Contrast size={18} />
                <span className="text-sm font-medium">{t.highContrast}</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.highContrast ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`} aria-hidden="true">
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.highContrast ? 'left-6' : 'left-1'}`} aria-hidden="true"></div>
              </div>
            </button>

            <button
              role="switch" aria-checked={settings.monochrome} onClick={() => toggleSetting('monochrome')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                settings.monochrome 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Monitor size={18} />
                <span className="text-sm font-medium">{t.monochrome}</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.monochrome ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.monochrome ? 'left-6' : 'left-1'}`}></div>
              </div>
            </button>

            <button
              role="switch" aria-checked={settings.dyslexiaFont} onClick={() => toggleSetting('dyslexiaFont')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                settings.dyslexiaFont 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Type size={18} />
                <span className="text-sm font-medium">{t.dyslexia}</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.dyslexiaFont ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.dyslexiaFont ? 'left-6' : 'left-1'}`}></div>
              </div>
            </button>

            <button
              role="switch" aria-checked={settings.largeText} onClick={() => toggleSetting('largeText')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                settings.largeText 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg leading-none">A</span>
                <span className="text-sm font-medium">{t.largeText}</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.largeText ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.largeText ? 'left-6' : 'left-1'}`}></div>
              </div>
            </button>

            <button
              onClick={resetSettings}
              className="w-full flex items-center justify-center gap-2 p-3 mt-4 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
            >
              <RotateCcw size={16} />
              {t.reset}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
