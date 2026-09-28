import { X, Calendar, MapPin, Trophy, ShieldAlert, Award, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { DatePicker } from "@/components/ui/date-picker";
import type { Matcher } from "react-day-picker";
import { format as formatDate } from "date-fns";

interface FilterSidebarProps {
  activeTab: "matches" | "tournaments";
  language: string;
  sports: any[];
  tournaments?: any[];
  classifications?: any[];
  locations?: string[];

  selectedSports: string[];
  setSelectedSports: (ids: string[]) => void;
  selectedTournaments: string[];
  setSelectedTournaments: (ids: string[]) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedWeightClasses: string[];
  setSelectedWeightClasses: (ids: string[]) => void;
  selectedClassification: string[];
  setSelectedClassification: (ids: string[]) => void;
  selectedStatuses: string[];
  setSelectedStatuses: (ids: string[]) => void;
  searchLocation: string;
  setSearchLocation: (loc: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;

  disabledMatchDates?: (date: Date) => boolean;
  disabledTournamentDates?: (date: Date) => boolean;

  onClearFilters: () => void;
  isMobileDrawer?: boolean;
  onCloseDrawer?: () => void;
}

const weightClasses = [
  { id: "49", nameVi: "Dưới 49 kg", nameEn: "Under 49 kg" },
  { id: "54", nameVi: "49 kg - 54 kg", nameEn: "49 kg - 54 kg" },
  { id: "59", nameVi: "55 kg - 59 kg", nameEn: "55 kg - 59 kg" },
  { id: "65", nameVi: "60 kg - 65 kg", nameEn: "60 kg - 65 kg" },
  { id: "72", nameVi: "66 kg - 72 kg", nameEn: "66 kg - 72 kg" },
  { id: "over_72", nameVi: "Trên 72 kg", nameEn: "Over 72 kg" }
];

const statusOptions = [
  { id: "SCHEDULED", nameVi: "Sắp diễn ra", nameEn: "Scheduled" },
  { id: "ONGOING", nameVi: "Đang diễn ra", nameEn: "Ongoing" },
  { id: "COMPLETED", nameVi: "Đã kết thúc", nameEn: "Completed" },
  { id: "CANCELLED", nameVi: "Đã hủy", nameEn: "Cancelled" }
];

const selectBaseClasses = "w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/30 dark:bg-slate-900/40 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-sm font-medium";

export function FilterSidebar({
  activeTab,
  language,
  sports,
  tournaments = [],
  classifications = [],
  locations = [],
  selectedSports,
  setSelectedSports,
  selectedTournaments,
  setSelectedTournaments,
  selectedDate,
  setSelectedDate,
  selectedWeightClasses,
  setSelectedWeightClasses,
  selectedClassification,
  setSelectedClassification,
  selectedStatuses,
  setSelectedStatuses,
  searchLocation,
  setSearchLocation,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  disabledMatchDates,
  disabledTournamentDates,
  onClearFilters,
  isMobileDrawer = false,
  onCloseDrawer
}: FilterSidebarProps) {
  const isVi = language === "vi";

  const hasActiveFilters =
    selectedSports.length > 0 ||
    selectedTournaments.length > 0 ||
    !!selectedDate ||
    selectedWeightClasses.length > 0 ||
    selectedClassification.length > 0 ||
    selectedStatuses.length > 0 ||
    !!searchLocation ||
    !!startDate ||
    !!endDate;

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${isMobileDrawer ? 'p-0' : 'p-6 rounded-2xl shadow-sm'}`}>
      {/* Header */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2 text-base">
          <Trophy size={18} className="text-blue-600 dark:text-blue-400" />
          {isVi ? "Bộ lọc tìm kiếm" : "Search Filters"}
        </h3>
        {isMobileDrawer && onCloseDrawer && (
          <button
            onClick={onCloseDrawer}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar">

        {/* 1. Sports */}
        <div className="space-y-3">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isVi ? "Bộ môn thi đấu" : "Sports"}
          </label>
          <MultiSelect
            options={sports.map((s: any) => ({ label: isVi ? s.nameVi : s.nameEn, value: s.id }))}
            selectedValues={selectedSports}
            onChange={setSelectedSports}
            placeholder={isVi ? "Chọn bộ môn..." : "Select sports..."}
            className="text-sm"
          />
        </div>

        {/* 2. Tournament */}
        <div className="space-y-3">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Trophy size={12} />
            {isVi ? "Giải đấu" : "Tournament"}
          </label>
          <MultiSelect
            options={tournaments.map((t: any) => ({ label: t.name, value: t.id }))}
            selectedValues={selectedTournaments}
            onChange={setSelectedTournaments}
            placeholder={isVi ? "Chọn giải đấu..." : "Select tournament..."}
            className="text-sm"
          />
        </div>

        {/* 3. Weight Class */}
        <div className="space-y-3">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Award size={12} />
            {isVi ? "Phân khúc / Hạng cân" : "Weight Class"}
          </label>
          <MultiSelect
            options={weightClasses.map(wc => ({ label: isVi ? wc.nameVi : wc.nameEn, value: wc.id }))}
            selectedValues={selectedWeightClasses}
            onChange={setSelectedWeightClasses}
            placeholder={isVi ? "Chọn hạng cân..." : "Select weight class..."}
            className="text-sm"
          />
        </div>

        {/* 4. Disability Classification */}
        <div className="space-y-3">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <ShieldAlert size={12} />
            {isVi ? "Hạng thương tật" : "Disability Class"}
          </label>
          {classifications.length > 0 ? (
            <MultiSelect
              options={classifications.map(cls => ({ label: cls.code, value: cls.id }))}
              selectedValues={selectedClassification}
              onChange={setSelectedClassification}
              placeholder={isVi ? "Chọn hạng thương tật..." : "Select classification..."}
              className="text-sm"
            />
          ) : (
            <p className="text-xs text-slate-400 italic px-1">
              {isVi ? "Chọn bộ môn để tải hạng thương tật" : "Select a sport to load classifications"}
            </p>
          )}
        </div>

        {/* 5. Status */}
        <div className="space-y-3">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Activity size={12} />
            {isVi ? "Trạng thái" : "Status"}
          </label>
          <MultiSelect
            options={statusOptions.map(s => ({ label: isVi ? s.nameVi : s.nameEn, value: s.id }))}
            selectedValues={selectedStatuses}
            onChange={setSelectedStatuses}
            placeholder={isVi ? "Chọn trạng thái..." : "Select status..."}
            className="text-sm"
          />
        </div>

        {/* 6. Location */}
        <div className="space-y-3">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <MapPin size={12} />
            {isVi ? "Địa điểm tổ chức" : "Location"}
          </label>
          {locations.length > 0 ? (
            <MultiSelect
              options={locations.map(loc => ({ label: loc, value: loc }))}
              selectedValues={searchLocation ? [searchLocation] : []}
              onChange={(vals) => setSearchLocation(vals.length > 0 ? vals[0] : "")}
              placeholder={isVi ? "Chọn địa điểm..." : "Select location..."}
              hideCheckbox
              mode="single"
              className="text-sm"
            />
          ) : (
            <input
              type="text"
              value={searchLocation}
              onChange={e => setSearchLocation(e.target.value)}
              placeholder={isVi ? "Hà Nội, TP.HCM, Bangkok..." : "Search location..."}
              className={`${selectBaseClasses}`}
            />
          )}
        </div>

        {/* 7. Date */}
        <div className="space-y-3">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Calendar size={12} />
            {isVi ? "Ngày diễn ra" : "Event Date"}
          </label>
          {activeTab === "matches" ? (
            <DatePicker
              value={selectedDate ? new Date(selectedDate) : undefined}
              onChange={(date) => setSelectedDate(date ? formatDate(date, "yyyy-MM-dd") : "")}
              placeholder={isVi ? "Chọn ngày..." : "Select date..."}
              locale={language as "vi" | "en"}
              disabledDays={disabledMatchDates}
            />
          ) : (
            <div className="space-y-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">{isVi ? "Từ ngày:" : "From:"}</span>
                <DatePicker
                  value={startDate ? new Date(startDate) : undefined}
                  onChange={(date) => setStartDate(date ? formatDate(date, "yyyy-MM-dd") : "")}
                  placeholder={isVi ? "Từ..." : "From..."}
                  locale={language as "vi" | "en"}
                  disabledDays={disabledTournamentDates}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">{isVi ? "Đến ngày:" : "To:"}</span>
                <DatePicker
                  value={endDate ? new Date(endDate) : undefined}
                  onChange={(date) => setEndDate(date ? formatDate(date, "yyyy-MM-dd") : "")}
                  placeholder={isVi ? "Đến..." : "To..."}
                  locale={language as "vi" | "en"}
                  disabledDays={disabledTournamentDates}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer / Reset Button */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            className="w-full text-xs font-bold text-red-655 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/40 rounded-xl py-2 flex items-center justify-center gap-1.5"
            onClick={onClearFilters}
          >
            {isVi ? "Xóa bộ lọc" : "Reset Filters"}
          </Button>
        </div>
      )}
    </div>
  );
}
