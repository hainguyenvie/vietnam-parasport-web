"use client";

import { Shield, Sparkles, Heart, Users } from 'lucide-react';
import { useLanguage } from '@/hooks/useTranslation';

const translations: Record<string, Record<string, string>> = {
  vi: {
    heading: "Về Chúng Tôi",
    subheading: "Vietnam ParaSports – Thể thao không rào cản",
    whatIsTitle: "Vietnam ParaSports là gì?",
    whatIsDesc1: "Vietnam ParaSports là nền tảng truyền thông và kết nối cộng đồng thể thao người khuyết tật tại Việt Nam. Website được xây dựng nhằm lan tỏa tinh thần “Thể thao không rào cản”, giúp ParaSports đến gần hơn với công chúng, đồng thời tạo thêm không gian để người khuyết tật, vận động viên, huấn luyện viên, câu lạc bộ và cộng đồng có thể kết nối với nhau.",
    whatIsDesc2: "Vietnam ParaSports không chỉ đưa tin về thể thao người khuyết tật, mà còn hướng tới việc xây dựng một hệ sinh thái thông tin dễ tiếp cận: nơi mọi người có thể đọc tin tức, tìm hiểu các CLB, tham gia hoạt động cộng đồng, học cách xây kênh cá nhân và kết nối với các nguồn lực đồng hành.",
    missionTitle: "Sứ mệnh của chúng tôi",
    missionDesc: "Vietnam ParaSports hướng tới việc lan tỏa hình ảnh ParaSports theo hướng tôn trọng, chân thật và không thương hại hóa. Dự án mong muốn người khuyết tật được nhìn nhận như những cá nhân có năng lực, có câu chuyện, có quyền tham gia thể thao và có thể hiện diện chủ động trong cộng đồng.",
    coreValuesTitle: "Giá trị cốt lõi",
    core1Title: "Tôn trọng & Chủ thể",
    core1Desc: "Tôn trọng người khuyết tật như những chủ thể có năng lực, có tiếng nói và câu chuyện riêng biệt thay vì nhìn nhận họ như những đối tượng đáng thương hại.",
    core2Title: "Kết nối hệ sinh thái",
    core2Desc: "Tạo nhịp cầu kết nối người khuyết tật với thể thao, câu lạc bộ, huấn luyện viên, nhà tài trợ và toàn thể cộng đồng xã hội.",
    core3Title: "Truyền thông tích cực",
    core3Desc: "Lan tỏa tinh thần ParaSports qua các thông tin chân thật, đầy đủ, dễ tiếp cận và tránh lối truyền thông giật gân, thương hại hay phi thường hóa.",
    core4Title: "Hỗ trợ VĐV Số hóa",
    core4Desc: "Hỗ trợ đắc lực cho các vận động viên người khuyết tật trong việc học tập kỹ năng, xây dựng hình ảnh cá nhân và làm chủ nội dung số.",
    spiritTitle: "Tinh thần chung",
    spiritDesc: "Vietnam ParaSports tin rằng thể thao không chỉ là thi đấu giành thành tích, mà còn là cơ hội tuyệt vời để mọi người rèn luyện sức khỏe, kết nối cộng đồng, nâng cao sự tự tin và kể câu chuyện của cuộc đời mình theo một cách chủ động nhất."
  },
  en: {
    heading: "About Us",
    subheading: "Vietnam ParaSports – Sports Without Barriers",
    whatIsTitle: "What is Vietnam ParaSports?",
    whatIsDesc1: "Vietnam ParaSports is a communication and community connection platform for disabled sports in Vietnam. The website was built to spread the spirit of \"Sports Without Barriers\", bringing ParaSports closer to the public, while creating a space where disabled people, athletes, coaches, clubs, and the community can connect with each other.",
    whatIsDesc2: "Vietnam ParaSports not only covers disabled sports news, but also aims to build an accessible information ecosystem: a place where everyone can read news, learn about clubs, participate in community activities, learn to build personal channels, and connect with accompanying partners.",
    missionTitle: "Our Mission",
    missionDesc: "Vietnam ParaSports aims to spread the image of ParaSports in a respectful, authentic, and non-pitying way. The project wishes disabled people to be recognized as capable individuals with stories, rights to participate in sports, and active presence in the community.",
    coreValuesTitle: "Core Values",
    core1Title: "Respect & Autonomy",
    core1Desc: "Respecting disabled people as capable subjects with their own voices and stories instead of viewing them as objects of pity.",
    core2Title: "Connecting the Ecosystem",
    core2Desc: "Creating a bridge connecting disabled people with sports, clubs, coaches, sponsors, and the entire society.",
    core3Title: "Positive Media",
    core3Desc: "Spreading the ParaSports spirit through authentic, complete, accessible information and avoiding sensationalist, pity-driven, or over-glorified media.",
    core4Title: "Digital Athlete Support",
    core4Desc: "Supporting disabled athletes in learning digital skills, building personal branding, and mastering digital content.",
    spiritTitle: "Shared Spirit",
    spiritDesc: "Vietnam ParaSports believes that sports is not only about competing for achievements, but also a great opportunity for everyone to exercise, connect with the community, build confidence, and tell their own stories in the most proactive way."
  }
};

export default function AboutPage() {
  const { language } = useLanguage();
  const tStr = translations[language] || translations.vi;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-16 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* PAGE TITLE */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white text-center">{tStr.heading}</h1>

        {/* GIỚI THIỆU CHUNG */}
        <section className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            {tStr.whatIsTitle}
          </h2>
          <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed text-base md:text-lg">
            <p>
              {tStr.whatIsDesc1}
            </p>
            <p>
              {tStr.whatIsDesc2}
            </p>
          </div>
        </section>

        {/* SỨ MỆNH */}
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 p-8 md:p-10 rounded-3xl border border-blue-100/50 dark:border-blue-900/30 shadow-sm space-y-4">
          <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl mb-2">
            <Sparkles size={28} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-indigo-950 dark:text-indigo-200">
            {tStr.missionTitle}
          </h2>
          <p className="text-slate-700 dark:text-indigo-300 leading-relaxed text-base md:text-lg">
            {tStr.missionDesc}
          </p>
        </section>

        {/* GIÁ TRỊ CỐT LÕI */}
        <section className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white text-center">
            {tStr.coreValuesTitle}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{tStr.core1Title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {tStr.core1Desc}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{tStr.core2Title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {tStr.core2Desc}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{tStr.core3Title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {tStr.core3Desc}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{tStr.core4Title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {tStr.core4Desc}
              </p>
            </div>

          </div>
        </section>

        {/* TINH THẦN CHUNG */}
        <section className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="inline-flex p-3 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full">
            <Heart size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {tStr.spiritTitle}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed text-base">
            {tStr.spiritDesc}
          </p>
        </section>

      </div>
    </main>
  );
}
