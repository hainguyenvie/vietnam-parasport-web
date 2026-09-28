import { Trophy } from "lucide-react";

 
export const BracketMatchCard = ({ match, onSetWinner, onClick }: { match: any, onSetWinner?: (match: any, winnerId: string) => void, onClick?: (match: any) => void }) => {
  if (!match) return (
    <div className="w-64 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 text-sm">
      Chưa có dữ liệu
    </div>
  );
  let pts = [];
  try { pts = typeof match.participants === 'string' ? JSON.parse(match.participants) : match.participants; } catch (e) { console.error('Failed to parse participants:', e); }
  pts = Array.isArray(pts) ? pts : [];

  return (
    <div 
      onClick={() => onClick && onClick(match)}
      className={`w-64 text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden z-10 transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20 transition-colors">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate tracking-wide">{match.title}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${match.status === 'COMPLETED' || match.status === 'FINISHED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
          {match.status === 'COMPLETED' || match.status === 'FINISHED' ? 'Đã xong' : 'Sắp diễn ra'}
        </span>
      </div>
      <div className="p-1">
        {[0, 1].map(i => {
          const p = pts[i];
          const isWinner = p?.isWinner;
          return (
            <div key={i} className={`group/player relative flex justify-between items-center px-3 py-2 rounded-lg m-1 transition-colors ${isWinner ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <span className={`text-sm truncate pr-2 flex flex-col ${isWinner ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
                {p?.name || (match.result === 'BYE' ? 'Trống (Miễn đấu)' : 'Chưa xác định')}
                {p?.noShow && <span className="text-[10px] text-red-500 font-bold uppercase">Vắng mặt</span>}
              </span>
              <div className="flex items-center gap-1">
                {p && p.id && match.result !== 'BYE' && onSetWinner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetWinner(match, p.id);
                    }}
                    className={`opacity-0 group-hover/player:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 ${isWinner ? 'text-amber-500 opacity-100' : 'text-slate-400 hover:text-amber-500'}`}
                    title="Chọn làm người chiến thắng"
                  >
                    <Trophy size={14} className={isWinner ? "fill-current" : ""} />
                  </button>
                )}
                <span className={`text-sm w-6 text-right ${isWinner ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-500 font-semibold'}`}>
                  {p?.score ?? '-'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

 
export const RenderNode = ({ match, matches, selectedSport, onSetWinner, onClick }: { match: any, matches: any[], selectedSport: string, onSetWinner?: (match: any, winnerId: string) => void, onClick?: (match: any) => void }) => {
  if (!match || !match.id) return null;

  // Find children (previous matches) that point to this match
  const children = matches.filter(m => m.sportId === selectedSport && m.nextMatchId === match.id);
  // Sort children so they appear consistently
  children.sort((a, b) => {
    // If both have valid startTimes, sort chronologically
    if (a.startTime && b.startTime) return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    return a.id.localeCompare(b.id);
  });
  
  const topChild = children[0] ? <RenderNode match={children[0]} matches={matches} selectedSport={selectedSport} onSetWinner={onSetWinner} onClick={onClick} /> : null;
  const bottomChild = children[1] ? <RenderNode match={children[1]} matches={matches} selectedSport={selectedSport} onSetWinner={onSetWinner} onClick={onClick} /> : null;
  
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
        <div className="flex flex-col justify-center relative pr-6">
          <div className="h-full flex items-center">
             <div className="flex items-center w-full justify-end">
               {topChild}
               <div className="w-6 border-b-2 border-slate-300 dark:border-slate-600"></div>
             </div>
          </div>
        </div>
      )}
      
      {/* Current node */}
      <div className="flex items-center relative z-10">
        {hasChildren && <div className="w-6 border-b-2 border-slate-300 dark:border-slate-600" />}
        <BracketMatchCard match={match} onSetWinner={onSetWinner} onClick={onClick} />
      </div>
    </div>
  );
};
