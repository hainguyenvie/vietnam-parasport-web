"use client";

import { getApiUrl } from "@/utils/api";

import Link from "next/link";
import { PlayCircle, MapPin, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";

interface MatchCardProps {
  match: any;
  language: string;
}

export function MatchCard({ match, language }: MatchCardProps) {
  const getStatusDisplay = (status: string) => {
    if (status === "SCHEDULED") return language === "vi" ? "Sắp diễn ra" : "Scheduled";
    if (status === "ONGOING") return language === "vi" ? "Đang diễn ra" : "Ongoing";
    if (status === "COMPLETED") return language === "vi" ? "Đã kết thúc" : "Completed";
    if (status === "CANCELLED") return language === "vi" ? "Đã hủy" : "Cancelled";
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === "SCHEDULED") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (status === "ONGOING") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse";
    if (status === "COMPLETED") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
  };

  return (
    <Link href={`/matches/${match.id}`} className="block group">
      <Card className="p-6 flex flex-col md:flex-row gap-6 items-center transition-all duration-200 hover:shadow-md hover:border-primary/30">
        <div className="flex-shrink-0 text-center w-32 border-r border-border pr-6 hidden md:block">
          <div className="text-3xl font-black text-foreground">
            {match.startTime ? new Date(match.startTime).getDate().toString().padStart(2, '0') : '--'}
          </div>
          <div className="text-sm font-bold text-muted-foreground uppercase">
            Tháng {match.startTime ? new Date(match.startTime).getMonth() + 1 : '--'}
          </div>
          <div className="mt-2 text-sm font-semibold text-primary bg-accent rounded-lg py-1">
            {match.startTime ? new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBA'}
          </div>
        </div>

        <div className="flex-1 w-full text-center md:text-left">
          <div className="md:hidden text-sm font-bold text-primary bg-accent rounded-lg py-1 px-3 mb-3 inline-block">
            {match.startTime ? new Date(match.startTime).toLocaleString() : 'TBA'}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2 justify-center md:justify-start">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1 ${getStatusColor(match.status)}`}>
              {match.status === 'ONGOING' && <PlayCircle size={12} className="animate-pulse" />}
              {getStatusDisplay(match.status)}
            </span>
            <span className="text-xs font-bold bg-muted text-muted-foreground px-3 py-1 rounded-full">
              {match.round || "Vòng loại"}
            </span>
            {match.tournament && (
              <span className="text-xs font-bold text-primary px-2 line-clamp-1">
                {match.tournament.name}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{match.title}</h3>

          <div className="flex items-center gap-1.5 text-muted-foreground text-sm justify-center md:justify-start">
            <MapPin size={16} />
            <span>{match.location || (language === "vi" ? "Đang cập nhật" : "TBD")}</span>
          </div>

          {match.participants && match.participants.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 justify-center md:justify-start flex-wrap">
              {match.participants.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  {p.flag && <span className="text-xl">{p.flag}</span>}
                  <span className="font-bold text-foreground">{p.name || p}</span>
                  {p.score !== undefined && <span className="bg-muted px-2 py-0.5 rounded font-mono font-bold text-primary">{p.score}</span>}
                  {i < match.participants.length - 1 && <span className="text-muted-foreground font-bold italic mx-2">vs</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-32 flex flex-col justify-center shrink-0 items-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 pl-0 md:pl-6">
          {match.result ? (
            <>
              <div className="text-xs font-bold text-muted-foreground uppercase mb-1">{language === "vi" ? "Kết quả" : "Result"}</div>
              <div className="text-lg font-black text-primary text-center mb-4">{match.result}</div>
            </>
          ) : (
            <div className="flex items-center gap-1 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform mb-4">
              {language === "vi" ? "Chi tiết" : "Details"} <ArrowRight size={16} />
            </div>
          )}

          <div className="flex flex-col gap-2 w-full max-w-[120px]">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.preventDefault(); window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(match.title)}&dates=20260621T200000Z/20260621T220000Z`, '_blank'); }}
              className="text-[10px] h-auto py-1"
              aria-label="Thêm vào Google Calendar"
            >
              + Google Calendar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.preventDefault(); window.location.href = getApiUrl(`/calendar/tournaments/${match.tournamentId}/ics`); }}
              className="text-[10px] h-auto py-1"
              aria-label="Tải file ICS"
            >
              Download .ics
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
