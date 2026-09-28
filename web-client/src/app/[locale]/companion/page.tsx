"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState } from 'react';
import { Heart, Send, CheckCircle2, AlertCircle, User, Phone, Mail, Building } from 'lucide-react';
import { useLanguage } from '@/hooks/useTranslation';

const translations: Record<string, Record<string, string>> = {
  vi: {
    tag: "Đồng hành cùng ParaSports",
    heading: "Chung Tay Lan Tỏa Nghị Lực",
    subheading: "Hỗ trợ vận động viên khuyết tật tự kể câu chuyện của mình, tiếp cận trang thiết bị và hòa nhập cộng đồng thông qua các hoạt động đồng hành thiết thực.",
    formsTitle: "Các hình thức tài trợ",
    finance: "Tài chính:",
    financeDesc: "Hỗ trợ trực tiếp quỹ phát triển giải đấu và học liệu.",
    inKind: "Hiện vật:",
    inKindDesc: "Thiết bị hỗ trợ trợ năng, xe lăn tập luyện, dụng cụ thể thao.",
    expert: "Chuyên môn:",
    expertDesc: "Huấn luyện viên, chuyên gia dinh dưỡng, hỗ trợ kỹ thuật số.",
    benefitsTitle: "Quyền lợi đồng hành",
    benefit1: "Vinh danh logo trên Marquee trang chủ & chuyên trang.",
    benefit2: "Ưu tiên đồng hành truyền thông trong các dự án của Creator Lab.",
    benefit3: "Nhận báo cáo tác động xã hội định kỳ từ Ban quản trị.",
    formHeading: "Gửi Đề Xuất Đồng Hành",
    successMsg: "Gửi thông tin thành công!",
    successDesc: "Cảm ơn bạn đã quan tâm đồng hành cùng Vietnam ParaSports. Ban quản trị sẽ liên hệ lại trong thời gian sớm nhất.",
    errorTitle: "Có lỗi xảy ra",
    labelName: "Họ và tên",
    labelUnit: "Đơn vị / Tổ chức",
    labelPhone: "Số điện thoại",
    labelEmail: "Địa chỉ Email",
    labelType: "Hình thức đồng hành mong muốn",
    labelMessage: "Lời nhắn / Nội dung hỗ trợ cụ thể",
    placeholderName: "Nguyễn Văn A",
    placeholderUnit: "Công ty, CLB hoặc trường...",
    placeholderPhone: "09xx xxx xxx",
    placeholderEmail: "name@example.com",
    placeholderMessage: "Vui lòng chia sẻ thêm về mong muốn hoặc kế hoạch hỗ trợ dự án...",
    btnSubmit: "Gửi thông tin liên hệ",
    sending: "Đang gửi..."
  },
  en: {
    tag: "Accompany ParaSports",
    heading: "Join Hands to Spread Resilience",
    subheading: "Support disabled athletes to tell their own stories, access equipment, and integrate into the community through practical accompanying activities.",
    formsTitle: "Sponsorship Forms",
    finance: "Financial:",
    financeDesc: "Direct support for tournament development funds and educational materials.",
    inKind: "In-kind:",
    inKindDesc: "Assistive devices, training wheelchairs, sports equipment.",
    expert: "Professional:",
    expertDesc: "Coaches, nutritionists, digital and media support.",
    benefitsTitle: "Partnership Benefits",
    benefit1: "Logo featured on homepage marquee & portal.",
    benefit2: "Priority in media partnership during Creator Lab projects.",
    benefit3: "Periodic social impact reports from administration.",
    formHeading: "Submit Partnership Proposal",
    successMsg: "Submission successful!",
    successDesc: "Thank you for your interest in partnering with Vietnam ParaSports. The administration will contact you shortly.",
    errorTitle: "An error occurred",
    labelName: "Full name",
    labelUnit: "Organization / Unit",
    labelPhone: "Phone number",
    labelEmail: "Email address",
    labelType: "Desired form of partnership",
    labelMessage: "Message / Specific support details",
    placeholderName: "John Doe",
    placeholderUnit: "Company, club, or school...",
    placeholderPhone: "09xx xxx xxx",
    placeholderEmail: "name@example.com",
    placeholderMessage: "Please share more details about your expectations or plans to support the project...",
    btnSubmit: "Submit Contact Info",
    sending: "Sending..."
  }
};

export default function CompanionPage() {
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  const [formData, setFormData] = useState({
    fullName: '',
    unit: '',
    phone: '',
    email: '',
    type: 'Tài trợ tài chính',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const partnershipTypes = [
    { value: 'Tài trợ tài chính', vi: 'Tài trợ tài chính', en: 'Financial Sponsorship' },
    { value: 'Tài trợ hiện vật', vi: 'Tài trợ hiện vật', en: 'In-kind Sponsorship' },
    { value: 'Hỗ trợ truyền thông', vi: 'Hỗ trợ truyền thông', en: 'Media Support' },
    { value: 'Hỗ trợ chuyên môn', vi: 'Hỗ trợ chuyên môn', en: 'Professional Support' },
    { value: 'Hỗ trợ địa điểm', vi: 'Hỗ trợ địa điểm', en: 'Venue Support' },
    { value: 'Hỗ trợ học liệu / công cụ', vi: 'Hỗ trợ học liệu / công cụ', en: 'Learning Material / Tool Support' },
    { value: 'Đồng hành cùng Creator Lab', vi: 'Đồng hành cùng Creator Lab', en: 'Accompany Creator Lab' },
    { value: 'Đăng ký làm CTV (Cộng tác viên)', vi: 'Đăng ký làm CTV (Cộng tác viên)', en: 'Register as Collaborator' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await apiClient.request('/companion-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(language === "vi" ? 'Không thể gửi yêu cầu. Vui lòng thử lại sau.' : 'Failed to submit request. Please try again later.');
      }

      setStatus('success');
      setFormData({
        fullName: '',
        unit: '',
        phone: '',
        email: '',
        type: 'Tài trợ tài chính',
        message: ''
      });
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || (language === "vi" ? 'Lỗi kết nối máy chủ.' : 'Server connection failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Section ĐÃ BỊ XÓA THEO YÊU CẦU */}

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left info column */}
          <div className="md:col-span-1 space-y-6">
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">{tStr.formsTitle}</h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>{tStr.finance}</strong> {tStr.financeDesc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>{tStr.inKind}</strong> {tStr.inKindDesc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>{tStr.expert}</strong> {tStr.expertDesc}</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{tStr.benefitsTitle}</h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{tStr.benefit1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{tStr.benefit2}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{tStr.benefit3}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form column */}
          <div className="md:col-span-2 glass-card p-8 rounded-3xl shadow-xl shadow-blue-500/5">
            <h3 className="text-xl font-bold mb-6">{tStr.formHeading}</h3>

            {status === 'success' && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-start gap-3 text-emerald-800 dark:text-emerald-355">
                <CheckCircle2 className="shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-bold text-base">{tStr.successMsg}</p>
                  <p className="text-sm mt-1">{tStr.successDesc}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 text-red-800 dark:text-red-355">
                <AlertCircle className="shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold text-base">{tStr.errorTitle}</p>
                  <p className="text-sm mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                    {tStr.labelName} <span className="text-red-500">*</span>
                  </label>
                  <div className="premium-input-wrapper">
                    <User className="premium-input-icon text-slate-400 dark:text-slate-500" size={18} />
                    <input
                      type="text"
                      id="fullName"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 text-slate-800 dark:text-slate-100"
                      placeholder={tStr.placeholderName}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="unit" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                    {tStr.labelUnit}
                  </label>
                  <div className="premium-input-wrapper">
                    <Building className="premium-input-icon text-slate-400 dark:text-slate-500" size={18} />
                    <input
                      type="text"
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 text-slate-800 dark:text-slate-100"
                      placeholder={tStr.placeholderUnit}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                    {tStr.labelPhone}
                  </label>
                  <div className="premium-input-wrapper">
                    <Phone className="premium-input-icon text-slate-400 dark:text-slate-500" size={18} />
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 text-slate-800 dark:text-slate-100"
                      placeholder={tStr.placeholderPhone}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                    {tStr.labelEmail} <span className="text-red-500">*</span>
                  </label>
                  <div className="premium-input-wrapper">
                    <Mail className="premium-input-icon text-slate-400 dark:text-slate-500" size={18} />
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="premium-input border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 text-slate-800 dark:text-slate-100"
                      placeholder={tStr.placeholderEmail}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="type" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  {tStr.labelType} <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {partnershipTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {language === "vi" ? type.vi : type.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  {tStr.labelMessage} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all resize-none text-slate-800 dark:text-slate-100 outline-none"
                  placeholder={tStr.placeholderMessage}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-base border-none shadow-md shadow-blue-500/10 cursor-pointer mt-4"
              >
                {loading ? tStr.sending : tStr.btnSubmit}
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
