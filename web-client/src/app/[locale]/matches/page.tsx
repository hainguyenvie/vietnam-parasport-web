"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";
import { formatDate } from "@/lib/date-utils";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Calendar as CalendarIcon, MapPin, Trophy, ArrowRight, PlayCircle, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useLanguage } from '@/hooks/useTranslation';
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MatchCard } from "@/components/shared/MatchCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSidebar } from "./FilterSidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Image from 'next/image';

export default function PublicMatchesPage() {
  const { language } = useLanguage();
  const [matches, setMatches] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matches" | "tournaments">("matches");

  const [matchesPage, setMatchesPage] = useState(1);
  const [tournamentsPage, setTournamentsPage] = useState(1);
  const pageSize = 9; // Fit grid perfectly
  const [totalMatchesPages, setTotalMatchesPages] = useState(1);
  const [totalTournamentsPages, setTotalTournamentsPages] = useState(1);

  // Unified Filters (shared across both tabs)
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedWeightClasses, setSelectedWeightClasses] = useState<string[]>([]);
  const [selectedClassification, setSelectedClassification] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchLocation, setSearchLocation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Dropdown data
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableMatchDates, setAvailableMatchDates] = useState<string[]>([]);
  const [availableTournamentDates, setAvailableTournamentDates] = useState<string[]>([]);

  // Mobile Filter Drawer State
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch Sports and Tournaments once on mount
  useEffect(() => {
    apiClient.request("/sports")
      .then(res => res.json())
      .then(data => setSports(data))
      .catch(console.error);
    apiClient.request("/tournaments")
      .then(res => res.json())
      .then(data => setTournaments(data))
      .catch(console.error);
  }, []);

  // Fetch classifications always (filtered by sports when selected, all when empty)
  useEffect(() => {
    const params = selectedSports.length > 0 ? `?sportId=${selectedSports.join(",")}` : "";
    apiClient.request(`/sport-classifications${params}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setClassifications(Array.isArray(data) ? data : data.data || []))
      .catch(console.error);
  }, [selectedSports]);

  // Fetch distinct locations for location select
  useEffect(() => {
    apiClient.request("/matches/locations")
      .then(res => res.json())
      .then(data => setAvailableLocations(Array.isArray(data) ? data : []))
      .catch(() => setAvailableLocations([]));
  }, []);
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSports.length > 0) params.append("sportId", selectedSports.join(","));
    if (selectedTournaments.length > 0) params.append("tournamentId", selectedTournaments.join(","));
    apiClient.request(`/matches/available-dates?${params.toString()}`)
      .then(res => res.json())
      .then(dates => setAvailableMatchDates(Array.isArray(dates) ? dates : []))
      .catch(() => setAvailableMatchDates([]));
  }, [selectedSports, selectedTournaments]);

  // Fetch available tournament dates for date picker disabling
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSports.length > 0) params.append("sportId", selectedSports.join(","));
    apiClient.request(`/tournaments/available-dates?${params.toString()}`)
      .then(res => res.json())
      .then(dates => setAvailableTournamentDates(Array.isArray(dates) ? dates : []))
      .catch(() => setAvailableTournamentDates([]));
  }, [selectedSports]);


  // Fetch Matches dynamically
  useEffect(() => {
    if (activeTab !== "matches") return;
    setLoading(true);
    const queryParams = new URLSearchParams();
    queryParams.append("page", matchesPage.toString());
    queryParams.append("limit", pageSize.toString());
    if (selectedSports.length > 0) {
      queryParams.append("sportId", selectedSports.join(","));
    }
    if (selectedDate) {
      queryParams.append("date", selectedDate);
    }
    if (selectedWeightClasses.length > 0) {
      queryParams.append("weightClass", selectedWeightClasses.join(","));
    }
    if (selectedClassification.length > 0) {
      queryParams.append("classificationId", selectedClassification.join(","));
    }
    if (selectedTournaments.length > 0) {
      queryParams.append("tournamentId", selectedTournaments.join(","));
    }
    if (selectedStatuses.length > 0) {
      queryParams.append("status", selectedStatuses.join(","));
    }
    if (searchLocation) {
      queryParams.append("location", searchLocation);
    }

    apiClient.request(`/matches?${queryParams.toString()}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.data) {
          setMatches(resData.data);
          setTotalMatchesPages(resData.meta?.totalPages || 1);
        } else {
          setMatches(resData || []);
          setTotalMatchesPages(1);
        }
      })
      .catch(e => {
        console.error(e);
        setMatches([]);
        setTotalMatchesPages(1);
      })
      .finally(() => setLoading(false));
  }, [activeTab, matchesPage, selectedSports, selectedDate, selectedWeightClasses, selectedClassification, selectedTournaments, selectedStatuses, searchLocation]);

  // Fetch Tournaments dynamically
  useEffect(() => {
    if (activeTab !== "tournaments") return;
    setLoading(true);
    const queryParams = new URLSearchParams();
    queryParams.append("page", tournamentsPage.toString());
    queryParams.append("limit", pageSize.toString());
    if (selectedSports.length > 0) {
      queryParams.append("sportId", selectedSports.join(","));
    }
    if (selectedStatuses.length > 0) {
      queryParams.append("status", selectedStatuses.join(","));
    }
    if (searchLocation) {
      queryParams.append("location", searchLocation);
    }
    if (startDate) {
      queryParams.append("startDate", startDate);
    }
    if (endDate) {
      queryParams.append("endDate", endDate);
    }
    if (selectedWeightClasses.length > 0) {
      queryParams.append("weightClass", selectedWeightClasses.join(","));
    }
    if (selectedClassification.length > 0) {
      queryParams.append("classificationId", selectedClassification.join(","));
    }

    apiClient.request(`/tournaments?${queryParams.toString()}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.data) {
          setTournaments(resData.data);
          setTotalTournamentsPages(resData.meta?.totalPages || 1);
        } else {
          setTournaments(resData || []);
          setTotalTournamentsPages(1);
        }
      })
      .catch(e => {
        console.error(e);
        setTournaments([]);
        setTotalTournamentsPages(1);
      })
      .finally(() => setLoading(false));
  }, [activeTab, tournamentsPage, selectedSports, selectedStatuses, searchLocation, startDate, endDate, selectedWeightClasses, selectedClassification]);

  const handleClearFilters = () => {
    setSelectedSports([]);
    setSelectedTournaments([]);
    setSelectedDate("");
    setSelectedWeightClasses([]);
    setSelectedClassification([]);
    setSelectedStatuses([]);
    setSearchLocation("");
    setStartDate("");
    setEndDate("");
    setMatchesPage(1);
    setTournamentsPage(1);
  };

  const disabledMatchDates = useCallback((date: Date) => {
    if (availableMatchDates.length === 0) return false;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return !availableMatchDates.includes(`${y}-${m}-${d}`);
  }, [availableMatchDates]);

  const disabledTournamentDates = useCallback((date: Date) => {
    if (availableTournamentDates.length === 0) return false;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return !availableTournamentDates.includes(`${y}-${m}-${d}`);
  }, [availableTournamentDates]);

  const getStatusDisplay = (status: string) => {
    if (status === "SCHEDULED" || status === "UPCOMING") return language === "vi" ? "Sắp diễn ra" : "Scheduled";
    if (status === "ONGOING") return language === "vi" ? "Đang diễn ra" : "Ongoing";
    if (status === "COMPLETED") return language === "vi" ? "Đã kết thúc" : "Completed";
    if (status === "CANCELLED") return language === "vi" ? "Đã hủy" : "Cancelled";
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === "SCHEDULED" || status === "UPCOMING") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (status === "ONGOING") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse";
    if (status === "COMPLETED") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
  };

  const renderPagination = (currentPage: number, totalPages: number, setPage: (p: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <Button 
          variant="outline" 
          disabled={currentPage === 1}
          onClick={() => setPage(Math.max(1, currentPage - 1))}
          className="px-3 rounded-xl"
        >
          <ChevronLeft size={16} />
        </Button>
        <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
          {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setPage(page)}
              className={`w-10 h-10 shrink-0 rounded-xl font-bold transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700'}`}
            >
              {page}
            </button>
          ))}
        </div>
        <Button 
          variant="outline" 
          disabled={currentPage === totalPages}
          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
          className="px-3 rounded-xl"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header Tab & Mobile Filter */}
        <div className="flex justify-between items-center mb-8 border-b border-border pb-0">
          <Tabs
            value={activeTab}
            onValueChange={(v: string) => { setActiveTab(v as "matches" | "tournaments"); }}
            className="w-full"
          >
            <TabsList className="h-auto p-0 bg-transparent gap-0">
              <TabsTrigger
                value="matches"
                className="pb-3 px-4 font-bold text-lg rounded-none border-0 border-b-4 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground transition-colors"
              >
                {language === "vi" ? "Lịch thi đấu" : "Matches"}
              </TabsTrigger>
              <TabsTrigger
                value="tournaments"
                className="pb-3 px-4 font-bold text-lg rounded-none border-0 border-b-4 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground transition-colors"
              >
                {language === "vi" ? "Các giải đấu" : "Tournaments"}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 active:scale-95 transition-all"
          >
            <Filter size={16} />
            {language === "vi" ? "Bộ lọc" : "Filters"}
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Column 1: Sidebar Filter (Desktop) */}
          <div className="hidden lg:block lg:col-span-1 sticky top-6">
            <FilterSidebar
              activeTab={activeTab}
              language={language}
              sports={sports}
              tournaments={tournaments}
              classifications={classifications}
              selectedSports={selectedSports}
              setSelectedSports={(ids) => { setSelectedSports(ids); setMatchesPage(1); setTournamentsPage(1); }}
              selectedTournaments={selectedTournaments}
              setSelectedTournaments={(ids) => { setSelectedTournaments(ids); setMatchesPage(1); }}
              selectedDate={selectedDate}
              setSelectedDate={(d) => { setSelectedDate(d); setMatchesPage(1); }}
              selectedWeightClasses={selectedWeightClasses}
              setSelectedWeightClasses={(ids) => { setSelectedWeightClasses(ids); setMatchesPage(1); }}
              selectedClassification={selectedClassification}
              setSelectedClassification={(ids) => { setSelectedClassification(ids); setMatchesPage(1); }}
              selectedStatuses={selectedStatuses}
              setSelectedStatuses={(ids) => { setSelectedStatuses(ids); setMatchesPage(1); setTournamentsPage(1); }}
              searchLocation={searchLocation}
              setSearchLocation={setSearchLocation}
              startDate={startDate}
              setStartDate={(d) => { setStartDate(d); setTournamentsPage(1); }}
              endDate={endDate}
              setEndDate={(d) => { setEndDate(d); setTournamentsPage(1); }}
              disabledMatchDates={disabledMatchDates}
              disabledTournamentDates={disabledTournamentDates}
              onClearFilters={handleClearFilters}
              locations={availableLocations}
            />
          </div>

          {/* Column 2: Listings Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className={activeTab === 'tournaments' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
                {[1, 2, 3].map(i => (
                  activeTab === 'tournaments' ? (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                      <Skeleton className="h-48 w-full rounded-none" />
                      <div className="p-6 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-12 w-16 md:w-24 rounded-xl" />
                    </div>
                  )
                ))}
              </div>
            ) : activeTab === "tournaments" ? (
              // Tournaments tab list
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tournaments.length === 0 ? (
                    <div className="col-span-full">
                      <EmptyState 
                        icon={<Trophy size={48} className="text-slate-300 dark:text-slate-600" />}
                        title={language === "vi" ? "Chưa có giải đấu nào" : "No tournaments yet"}
                        description={language === "vi" ? "Không tìm thấy giải đấu phù hợp với tiêu chí lọc." : "No tournaments found matching the filter criteria."}
                      />
                    </div>
                  ) : (
                    tournaments.map(t => (
                      <Link href={`/tournaments/${t.id}`} key={t.id} className="glass-card bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 group cursor-pointer hover:-translate-y-1 transition-transform block">
                        <div className="h-48 overflow-hidden relative">
                          <img src={t.bannerUrl || "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=600"} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className={`absolute top-4 right-4 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusColor(t.status)}`}>
                            {getStatusDisplay(t.status)}
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{t.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                            <CalendarIcon size={16} />
                            <span>{formatDate(t.startDate)} - {formatDate(t.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin size={16} />
                            <span>{t.location || "Đang cập nhật"}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                {renderPagination(tournamentsPage, totalTournamentsPages, setTournamentsPage)}
              </div>
            ) : (
              // Matches tab list
              <div>
                {matches.length === 0 ? (
                  <EmptyState 
                    icon={<CalendarIcon size={48} className="text-slate-300 dark:text-slate-600" />}
                    title={language === "vi" ? "Chưa có trận đấu nào" : "No matches yet"}
                    description={language === "vi" ? "Hiện tại không có trận đấu nào phù hợp với bộ lọc." : "No matches found matching your filters."}
                  />
                ) : (
                  <div className="grid gap-4">
                    {matches.map(match => (
                      <MatchCard key={match.id} match={match} language={language} />
                    ))}
                  </div>
                )}
                {renderPagination(matchesPage, totalMatchesPages, setMatchesPage)}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Mobile Drawer/Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity duration-200">
          <div className="w-80 h-full bg-white dark:bg-slate-950 shadow-2xl p-6 flex flex-col justify-between animate-slide-in-right">
            <div className="flex-grow overflow-y-auto no-scrollbar pr-1">
              <FilterSidebar
                activeTab={activeTab}
                language={language}
                sports={sports}
                tournaments={tournaments}
                classifications={classifications}
                selectedSports={selectedSports}
                setSelectedSports={(ids) => { setSelectedSports(ids); setMatchesPage(1); setTournamentsPage(1); }}
                selectedTournaments={selectedTournaments}
                setSelectedTournaments={(ids) => { setSelectedTournaments(ids); setMatchesPage(1); }}
                selectedDate={selectedDate}
                setSelectedDate={(d) => { setSelectedDate(d); setMatchesPage(1); }}
                selectedWeightClasses={selectedWeightClasses}
                setSelectedWeightClasses={(ids) => { setSelectedWeightClasses(ids); setMatchesPage(1); }}
                selectedClassification={selectedClassification}
                setSelectedClassification={(ids) => { setSelectedClassification(ids); setMatchesPage(1); }}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={(ids) => { setSelectedStatuses(ids); setMatchesPage(1); setTournamentsPage(1); }}
                searchLocation={searchLocation}
                setSearchLocation={setSearchLocation}
                startDate={startDate}
                setStartDate={(d) => { setStartDate(d); setTournamentsPage(1); }}
                endDate={endDate}
                setEndDate={(d) => { setEndDate(d); setTournamentsPage(1); }}
                disabledMatchDates={disabledMatchDates}
                disabledTournamentDates={disabledTournamentDates}
                onClearFilters={handleClearFilters}
                locations={availableLocations}
                isMobileDrawer={true}
                onCloseDrawer={() => setIsFilterOpen(false)}
              />
            </div>
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0">
              <Button 
                onClick={() => setIsFilterOpen(false)} 
                className="w-full py-2.5 font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
              >
                {language === "vi" ? "Áp dụng bộ lọc" : "Apply Filters"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
