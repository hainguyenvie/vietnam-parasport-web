"use client";

import Link from "next/link";
import { BookOpen, Save } from "lucide-react";

interface Course {
  id: string;
  course?: {
    id: string;
    slug: string;
    title: string;
    thumbnailUrl?: string;
  };
  progressPercent?: number;
}

interface Props {
  profile: any;
  profileForm: {
    fullName: string;
    phoneNumber: string;
    dob: string;
    gender: string;
    address: string;
    bio: string;
  };
  setProfileForm: (form: any) => void;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
  courses: Course[];
  coursesLoading: boolean;
  tStr: Record<string, string>;
  language: string;
}

export default function ProfileTab({ profile, profileForm, setProfileForm, saving, onSave, courses, coursesLoading, tStr, language }: Props) {
  const completedCourses = courses.filter((c) => c.progressPercent && c.progressPercent >= 100).length;
  const inProgressCourses = courses.filter((c) => c.progressPercent && c.progressPercent < 100).length;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
          <span className="block text-2xl font-extrabold text-blue-600 dark:text-blue-400">{courses.length}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            {language === "vi" ? "Khóa học" : "Courses"}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
          <span className="block text-2xl font-extrabold text-green-600 dark:text-green-400">{completedCourses}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            {language === "vi" ? "Hoàn thành" : "Completed"}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
          <span className="block text-2xl font-extrabold text-amber-600 dark:text-amber-400">{inProgressCourses}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            {language === "vi" ? "Đang học" : "In Progress"}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
          <span className="block text-2xl font-extrabold text-purple-600 dark:text-purple-400">{profile?.role || "-"}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            {language === "vi" ? "Vai trò" : "Role"}
          </span>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={onSave} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          {tStr.updatePersonalInfo}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{tStr.fullName} *</label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{tStr.phoneNumber}</label>
            <input
              type="tel"
              value={profileForm.phoneNumber}
              onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{tStr.dob}</label>
            <input
              type="date"
              value={profileForm.dob}
              onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{tStr.gender}</label>
            <select
              value={profileForm.gender}
              onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">--</option>
              <option value="male">{tStr.genderMale}</option>
              <option value="female">{tStr.genderFemale}</option>
              <option value="other">{tStr.genderOther}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{tStr.address}</label>
          <input
            type="text"
            value={profileForm.address}
            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{tStr.bio}</label>
          <textarea
            value={profileForm.bio}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {tStr.updateAccountBtn}
        </button>
      </form>

      {/* Course Progress Preview */}
      {!coursesLoading && courses.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen size={16} className="text-blue-600" />
            {tStr.trainingOverview}
          </h3>
          <div className="space-y-3">
            {courses.slice(0, 3).map((course) => {
              const c = course.course;
              if (!c) return null;
              return (
                <Link
                  key={course.id}
                  href={`/creator-lab/courses/${c.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
                    {c.thumbnailUrl ? (
                      <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={16} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                      {c.title}
                    </h4>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${course.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">{course.progressPercent || 0}%</span>
                </Link>
              );
            })}
          </div>
          {courses.length > 3 && (
            <Link
              href="/profile?tab=courses"
              className="block text-center text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              {language === "vi" ? `Xem tất cả ${courses.length} khóa học →` : `View all ${courses.length} courses →`}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
