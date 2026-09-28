"use client";

import { useState, useEffect } from "react";
import { useLanguage } from '@/hooks/useTranslation';

const MatchCard = ({ match }: { match: any }) => {
  if (!match) return (
    <div className="w-56 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-sm">
      Chưa có dữ liệu
    </div>
  );
  let pts = [];
  try { pts = typeof match.participants === 'string' ? JSON.parse(match.participants) : match.participants; } catch (e) { console.error('Failed to parse participants:', e); }
  pts = Array.isArray(pts) ? pts : [];

  return (
    <button 
      tabIndex={0}
      aria-label={`${match.title}, ${match.status === 'COMPLETED' ? 'Đã xong' : 'Sắp diễn ra'}`}
      className="w-56 text-left focus:outline-none focus:ring-4 focus:ring-blue-500 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden z-10 transition-transform hover:scale-[1.02]"
    >
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <span className="text-xs font-semibold truncate">{match.title}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${match.status === 'COMPLETED' || match.status === 'FINISHED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {match.status === 'COMPLETED' || match.status === 'FINISHED' ? 'Đã xong' : 'Sắp diễn ra'}
        </span>
      </div>
      <div className="p-0">
        {[0, 1].map(i => {
          const p = pts[i];
          return (
            <div key={i} className={`flex justify-between items-center px-3 py-1.5 ${i === 0 ? 'border-b border-slate-100 dark:border-slate-800' : ''} ${p?.isWinner ? 'bg-green-50/50 dark:bg-green-900/20' : ''}`}>
              <span className={`text-sm font-medium truncate pr-2 ${p?.isWinner ? 'text-green-700 dark:text-green-400 font-bold' : ''}`}>{p?.name || (match.result === 'BYE' ? 'Trống (Miễn đấu)' : 'Chưa xác định')}</span>
              <span className={`text-sm w-6 text-center ${p?.isWinner ? 'text-green-700 dark:text-green-400 font-bold' : 'font-bold'}`}>{p?.score ?? '-'}</span>
            </div>
          );
        })}
      </div>
    </button>
  );
};

const RenderNode = ({ match, matches }: { match: any, matches: any[] }) => {
  if (!match || !match.id) return null;

  // Find children (previous matches) that point to this match
  const children = matches.filter(m => m.nextMatchId === match.id);
  children.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  const topChild = children[0] ? <RenderNode match={children[0]} matches={matches} /> : null;
  const bottomChild = children[1] ? <RenderNode match={children[1]} matches={matches} /> : null;
  
  const hasChildren = topChild || bottomChild;

  return (
    <div className="flex items-center relative">
      {hasChildren && topChild && bottomChild && (
        <div className="flex flex-col justify-center relative pr-6">
          <div className="pb-4 h-full flex items-end">
             <div className="flex items-center w-full justify-end">
               {topChild}
               <div className="w-6 border-b-2 border-slate-300 dark:border-slate-600"></div>
             </div>
          </div>
          <div className="pt-4 h-full flex items-start">
             <div className="flex items-center w-full justify-end">
               {bottomChild}
               <div className="w-6 border-b-2 border-slate-300 dark:border-slate-600"></div>
             </div>
          </div>
          {/* Vertical Line */}
          <div className="absolute right-0 top-[25%] bottom-[25%] border-r-2 border-slate-300 dark:border-slate-600"></div>
        </div>
      )}
      {hasChildren && topChild && !bottomChild && (
        <div className="flex items-center pr-6">
          {topChild}
          <div className="w-6 border-b-2 border-slate-300 dark:border-slate-600"></div>
        </div>
      )}
      {hasChildren && !topChild && bottomChild && (
        <div className="flex items-center pr-6">
          {bottomChild}
          <div className="w-6 border-b-2 border-slate-300 dark:border-slate-600"></div>
        </div>
      )}
      
      {hasChildren && (
        <div className="w-6 border-b-2 border-slate-300 dark:border-slate-600"></div>
      )}
      
      <MatchCard match={match} />
    </div>
  );
};

export default function PublicBracketTab({ tournament }: { tournament: any }) {
  const { language } = useLanguage();
  const matches = tournament?.matches || [];
  
  // Lấy danh sách các môn thi đấu có trong giải đấu
  const sports = Array.from(new Map(matches.map((m: any) => [m.sportId, m.sport])).values()) as any[];
  const [selectedSport, setSelectedSport] = useState(sports[0]?.id || "");
  
  if (matches.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-slate-500">
        {language === "vi" ? "Chưa có sơ đồ thi đấu nào." : "No brackets available yet."}
      </div>
    );
  }

  const sportMatches = matches.filter((m: any) => m.sportId === selectedSport);
  const rootMatches = sportMatches.filter((m: any) => !m.nextMatchId || !sportMatches.find((sm: any) => sm.id === m.nextMatchId));

  return (
    <div className="space-y-6">
      {sports.length > 1 && (
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
          {sports.map((s: any) => (
            <button
              key={s.id}
              onClick={() => setSelectedSport(s.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedSport === s.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              {s.nameVi}
            </button>
          ))}
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-900/30 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
        <div className="overflow-x-auto overflow-y-hidden pb-8 whitespace-nowrap custom-scrollbar">
          <div className="inline-flex min-w-full justify-center">
            {rootMatches.length === 0 ? (
              <div className="py-20 text-center text-slate-500 w-full">Chưa có dữ liệu sơ đồ cho môn thể thao này.</div>
            ) : (
              <div className="flex flex-col gap-16 py-4">
                {rootMatches.map((m: any) => (
                  <RenderNode key={m.id} match={m} matches={sportMatches} />
                ))}
                {/* Third-place match */}
                {sportMatches.filter((m: any) => m.round === "Tranh hạng 3").map((m: any) => (
                  <div key={m.id} className="flex justify-center mt-4 pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-600">
                    <div className="bg-white dark:bg-slate-800 border-2 border-amber-400 rounded-xl p-3 min-w-[200px]">
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 text-center mb-1">Tranh hạng 3</div>
                      <div className="text-xs font-bold text-center">{m.participants?.map((p: any) => p.name).join(" vs ") || "Chưa xác định"}</div>
                      {m.result && <div className="text-xs text-center text-slate-500 mt-1">{m.result}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
