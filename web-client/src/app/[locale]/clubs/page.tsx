"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect } from 'react';
import { Users, Filter, PlusCircle, CheckCircle2, AlertCircle, X, MapPin, Calendar, CheckSquare, PhoneCall, Activity, User } from 'lucide-react';
import { useLanguage } from '@/hooks/useTranslation';
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface Club {
  id: string;
  name: string;
  location: string;
  sport: string;
  schedule: string;
  suitableFor: string;
  contactInfo: string;
  description: string;
}

const translations: Record<string, Record<string, string>> = {
  vi: {
    heading: "Câu lạc bộ Thể thao",
    subheading: "Tìm kiếm và gia nhập cộng đồng câu lạc bộ thể thao phù hợp trên toàn quốc.",
    btnRegisterClub: "Đăng ký CLB mới",
    filterHeading: "Bộ lọc tìm kiếm",
    filterRegion: "Khu vực",
    filterSport: "Môn thể thao",
    allRegions: "Tất cả khu vực",
    allSports: "Tất cả môn thể thao",
    clearFilters: "Xóa bộ lọc",
    noClubsFound: "Không tìm thấy câu lạc bộ nào phù hợp với bộ lọc hiện tại.",
    labelLocation: "Địa điểm:",
    labelSchedule: "Lịch tập:",
    labelSuitable: "Đối tượng:",
    labelContact: "Liên hệ:",
    modalTitle: "Đăng Ký Thông Tin CLB Mới",
    successTitle: "Đăng ký thành công!",
    successDesc: "Thông tin CLB đã được ghi nhận. Ban quản trị sẽ kiểm duyệt nội dung trước khi hiển thị công khai.",
    errorTitle: "Lỗi gửi dữ liệu",
    formName: "Tên Câu lạc bộ",
    formLocation: "Địa chỉ sinh hoạt",
    formSport: "Môn thể thao chính",
    formSchedule: "Lịch tập luyện",
    formSuitable: "Đối tượng phù hợp",
    formContact: "Liên hệ / Người phụ trách",
    formDesc: "Mô tả chi tiết CLB & hoạt động",
    placeholderName: "VD: CLB Bắn cung Hà Nội",
    placeholderLocation: "VD: Hà Nội (Miền Bắc)",
    placeholderSport: "VD: Cử tạ, Bơi lội...",
    placeholderSchedule: "VD: Chiều Thứ 2, 4, 6 từ 15h00",
    placeholderSuitable: "VD: Người khuyết tật vận động...",
    placeholderContact: "VD: HLV Nguyễn Văn A - 09xx xxx xxx",
    placeholderDesc: "Mô tả cơ sở vật chất, hoạt động chính, các thành tích tiêu biểu (nếu có)...",
    btnClose: "Đóng lại",
    btnSubmit: "Gửi phê duyệt",
    submitting: "Đang gửi..."
  },
  en: {
    heading: "Sports Clubs",
    subheading: "Find and join a suitable sports club community nationwide.",
    btnRegisterClub: "Register New Club",
    filterHeading: "Search Filters",
    filterRegion: "Region",
    filterSport: "Sport",
    allRegions: "All Regions",
    allSports: "All Sports",
    clearFilters: "Clear Filters",
    noClubsFound: "No clubs found matching the selected filters.",
    labelLocation: "Location:",
    labelSchedule: "Schedule:",
    labelSuitable: "Suitable For:",
    labelContact: "Contact:",
    modalTitle: "Register New Club Information",
    successTitle: "Registration successful!",
    successDesc: "Club information has been recorded. The administration will review it before displaying publicly.",
    errorTitle: "Data submission error",
    formName: "Club Name",
    formLocation: "Activity Location",
    formSport: "Main Sport",
    formSchedule: "Training Schedule",
    formSuitable: "Suitable For",
    formContact: "Contact / Person in Charge",
    formDesc: "Detailed description of club & activities",
    placeholderName: "e.g., Hanoi Archery Club",
    placeholderLocation: "e.g., Hanoi (North Region)",
    placeholderSport: "e.g., Powerlifting, Swimming...",
    placeholderSchedule: "e.g., Mon, Wed, Fri from 3:00 PM",
    placeholderSuitable: "e.g., Motor disabled individuals...",
    placeholderContact: "e.g., Coach John Doe - 09xx xxx xxx",
    placeholderDesc: "Describe facilities, main activities, outstanding achievements (if any)...",
    btnClose: "Close",
    btnSubmit: "Submit for Approval",
    submitting: "Submitting..."
  }
};

export default function ClubsPage() {
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    sport: '',
    schedule: '',
    suitableFor: '',
    contactInfo: '',
    description: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');

  const [sports, setSports] = useState<{ label: string; value: string }[]>([]);

  const fetchSports = async () => {
    try {
      const res = await apiClient.request("/sports");
      if (res.ok) {
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((sp: any) => ({
          label: language === 'vi' ? sp.nameVi : sp.nameEn,
          value: sp.nameVi
        }));
        setSports(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch sports:", err);
    }
  };

  const regions = [
    { label: language === 'vi' ? 'Miền Bắc' : 'North', value: 'Bắc' },
    { label: language === 'vi' ? 'Miền Trung' : 'Central', value: 'Trung' },
    { label: language === 'vi' ? 'Miền Nam' : 'South', value: 'Nam' }
  ];

  // Fetch approved clubs
  const fetchClubs = async () => {
    setLoading(true);
    try {
      let url = getApiUrl('/organizations');
      const params = new URLSearchParams();
      
      if (selectedSport) params.append('sport', selectedSport);
      if (selectedRegion) params.append('location', selectedRegion);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const envelope = await res.json();
        setClubs(envelope?.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, [language]);

  useEffect(() => {
    fetchClubs();
  }, [selectedRegion, selectedSport]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitStatus('idle');
    setSubmitError('');

    try {
      const res = await apiClient.request('/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error(language === "vi" ? 'Gửi thông tin thất bại. Vui lòng kiểm tra lại.' : 'Submission failed. Please check your data.');
      }

      setSubmitStatus('success');
      setFormData({
        name: '',
        location: '',
        sport: '',
        schedule: '',
        suitableFor: '',
        contactInfo: '',
        description: ''
      });
      // Refresh list in case of changes
      fetchClubs();
    } catch (err: any) {
      console.error(err);
      setSubmitStatus('error');
      setSubmitError(err.message || (language === "vi" ? 'Có lỗi xảy ra.' : 'An error occurred.'));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-16 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* TIÊU ĐỀ & NÚT ĐĂNG KÝ */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-3">
              <Users size={36} className="text-blue-600 dark:text-blue-400" />
              {tStr.heading}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {tStr.subheading}
            </p>
          </div>
          
          <button
            onClick={() => {
              setIsModalOpen(true);
              setSubmitStatus('idle');
            }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition active:scale-95 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-none cursor-pointer"
          >
            <PlusCircle size={20} />
            {tStr.btnRegisterClub}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* BỘ LỌC (FILTERS) */}
          <aside className="w-full lg:w-1/4 flex-shrink-0 lg:sticky lg:top-24">
            <section className="glass-card p-6 rounded-3xl shadow-xl shadow-blue-500/5 space-y-6 border border-slate-200/60 dark:border-slate-800/80 animate-in fade-in duration-300" aria-label="Bộ lọc tìm kiếm">
              <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                <Filter size={18} className="text-blue-600" />
                <span>{tStr.filterHeading}</span>
              </div>
              
              <div className="flex flex-col gap-6">
            {/* Vùng miền */}
            <div className="space-y-2">
              <label htmlFor="filterRegion" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{tStr.filterRegion}</label>
              <select
                id="filterRegion"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold transition-all text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="">{tStr.allRegions}</option>
                {regions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Môn thể thao */}
            <div className="space-y-2">
              <label htmlFor="filterSport" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{tStr.filterSport}</label>
              <select
                id="filterSport"
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold transition-all text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="">{tStr.allSports}</option>
                {sports.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Nút reset */}
            <div className="flex items-end">
              {(selectedRegion || selectedSport) && (
                <button
                  onClick={() => { setSelectedRegion(''); setSelectedSport(''); }}
                  className="px-4 py-3 text-sm font-semibold text-red-600 hover:text-red-755 dark:text-red-400 transition bg-transparent border-none cursor-pointer"
                >
                  {tStr.clearFilters}
                </button>
              )}
              </div>
            </div>
          </section>
        </aside>

          {/* DANH SÁCH CÂU LẠC BỘ */}
          <section className="flex-1 w-full" aria-label="Danh sách câu lạc bộ">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 h-64 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse"></div>
              ))}
            </div>
          ) : clubs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-lg">{tStr.noClubsFound}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clubs.map((club) => (
                <article key={club.id} className="glass-card p-6 md:p-8 rounded-3xl shadow-md hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="text-xl font-extrabold text-slate-800 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {club.name}
                      </h2>
                      <span className="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full uppercase tracking-wide border border-blue-100/50 dark:border-blue-900/30">
                        {club.sport}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-3">
                      {club.description}
                    </p>

                    <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-blue-500 shrink-0" />
                        <span><strong>{tStr.labelLocation}</strong> {club.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-emerald-505 shrink-0" />
                        <span><strong>{tStr.labelSchedule}</strong> {club.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare size={16} className="text-amber-500 shrink-0" />
                        <span><strong>{tStr.labelSuitable}</strong> {club.suitableFor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PhoneCall size={16} className="text-rose-500 shrink-0" />
                        <span><strong>{tStr.labelContact}</strong> {club.contactInfo}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL BIỂU MẪU ĐĂNG KÝ MỚI */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
            <div className="glass-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col max-h-[90vh]">
              
              {/* Header Modal */}
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {tStr.modalTitle}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                
                {submitStatus === 'success' && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-start gap-3 text-emerald-800 dark:text-emerald-350">
                    <CheckCircle2 className="shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-bold">{tStr.successTitle}</p>
                      <p className="text-sm mt-1">{tStr.successDesc}</p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 text-red-800 dark:text-red-355">
                    <AlertCircle className="shrink-0 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-bold">{tStr.errorTitle}</p>
                      <p className="text-sm mt-1">{submitError}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="clubName" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{tStr.formName} <span className="text-red-500">*</span></label>
                    <div className="premium-input-wrapper">
                      <Users className="premium-input-icon text-slate-400 dark:text-slate-500" size={18} />
                      <input
                        type="text"
                        id="clubName"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 text-slate-800 dark:text-slate-100"
                        placeholder={tStr.placeholderName}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="clubLocation" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{tStr.formLocation} <span className="text-red-500">*</span></label>
                    <div className="premium-input-wrapper">
                      <MapPin className="premium-input-icon text-slate-400 dark:text-slate-500" size={18} />
                      <input
                        type="text"
                        id="clubLocation"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 text-slate-800 dark:text-slate-100"
                        placeholder={tStr.placeholderLocation}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="clubSport" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{tStr.formSport} <span className="text-red-500">*</span></label>
                    <div className="premium-input-wrapper">
                      <Activity className="premium-input-icon text-slate-400 dark:text-slate-500" size={18} />
                      <select
                        id="clubSport"
                        required
                        value={formData.sport}
                        onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                        className="premium-input border-slate-205 dark:border-slate-700 text-sm focus:border-blue-500 text-slate-800 dark:text-slate-100 cursor-pointer bg-white dark:bg-slate-900"
                      >
                        <option value="">{language === 'vi' ? '-- Chọn môn thể thao --' : '-- Select Sport --'}</option>
                        {sports.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="clubSchedule" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{tStr.formSchedule} <span className="text-red-500">*</span></label>
                    <div className="premium-input-wrapper">
                      <Calendar className="premium-input-icon text-slate-400 dark:text-slate-500" size={18} />
                      <input
                        type="text"
                        id="clubSchedule"
                        required
                        value={formData.schedule}
                        onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 text-slate-800 dark:text-slate-100"
                        placeholder={tStr.placeholderSchedule}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="clubSuitable" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{tStr.formSuitable} <span className="text-red-500">*</span></label>
                    <div className="premium-input-wrapper">
                      <CheckSquare className="premium-input-icon text-slate-400 dark:text-slate-500" size={18} />
                      <input
                        type="text"
                        id="clubSuitable"
                        required
                        value={formData.suitableFor}
                        onChange={(e) => setFormData({ ...formData, suitableFor: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 text-slate-800 dark:text-slate-100"
                        placeholder={tStr.placeholderSuitable}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="clubContact" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{tStr.formContact} <span className="text-red-500">*</span></label>
                    <div className="premium-input-wrapper">
                      <PhoneCall className="premium-input-icon text-slate-400 dark:text-slate-500" size={18} />
                      <input
                        type="text"
                        id="clubContact"
                        required
                        value={formData.contactInfo}
                        onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                        className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 text-slate-800 dark:text-slate-100"
                        placeholder={tStr.placeholderContact}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="clubDesc" className="text-sm font-bold text-slate-700 dark:text-slate-300 block">{tStr.formDesc} <span className="text-red-500">*</span></label>
                  <textarea
                    id="clubDesc"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all resize-none text-slate-800 dark:text-slate-100 outline-none"
                    placeholder={tStr.placeholderDesc}
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 text-sm cursor-pointer"
                  >
                    {tStr.btnClose}
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-sm border-none shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    {submitLoading ? tStr.submitting : tStr.btnSubmit}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
