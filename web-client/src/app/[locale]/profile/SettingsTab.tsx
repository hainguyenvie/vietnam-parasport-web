"use client";

import { useState } from "react";
import { LogOut, KeyRound, Eye, EyeOff, Shield, Sun, Moon, Globe, Loader2, Image } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface Props {
  profile: any;
  pwdForm: { currentPassword: string; newPassword: string; confirmPassword: string };
  setPwdForm: (form: any) => void;
  savingPwd: boolean;
  onUpdatePassword: (e: React.FormEvent) => void;
  showCurPwd: boolean;
  setShowCurPwd: (v: boolean) => void;
  showNewPwd: boolean;
  setShowNewPwd: (v: boolean) => void;
  showConfPwd: boolean;
  setShowConfPwd: (v: boolean) => void;
  isTwoFactorEnabled: boolean;
  show2FASetup: boolean;
  setShow2FASetup: (v: boolean) => void;
  twoFactorSecret: string;
  twoFactorQrCode: string;
  twoFactorCode: string;
  setTwoFactorCode: (v: string) => void;
  verifying2FA: boolean;
  onGenerate2FA: () => void;
  onVerify2FA: (e: React.FormEvent) => void;
  onDisable2FA: () => void;
  onUpgradeToAthlete: () => void;
  upgradingAthlete: boolean;
  onUpgradeToCoach: () => void;
  upgradingCoach: boolean;
  theme: string | undefined;
  onThemeChange: (theme: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  tStr: Record<string, string>;
}

export default function SettingsTab(props: Props) {
  const { tStr, language, profile } = props;
  const hasAthleteProfile = profile?.athleteProfile;
  const hasCoachProfile = profile?.coachProfile;

  return (
    <div className="space-y-6">
      {/* Password */}
      <form onSubmit={props.onUpdatePassword} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <KeyRound size={16} className="text-amber-500" />
          {tStr.changePasswordTitle}
        </h3>
        <div className="space-y-3">
          {[
            { label: tStr.currentPassword, value: props.pwdForm.currentPassword, setter: (v: string) => props.setPwdForm({ ...props.pwdForm, currentPassword: v }), show: props.showCurPwd, setShow: props.setShowCurPwd },
            { label: tStr.newPassword, value: props.pwdForm.newPassword, setter: (v: string) => props.setPwdForm({ ...props.pwdForm, newPassword: v }), show: props.showNewPwd, setShow: props.setShowNewPwd },
            { label: tStr.confirmNewPassword, value: props.pwdForm.confirmPassword, setter: (v: string) => props.setPwdForm({ ...props.pwdForm, confirmPassword: v }), show: props.showConfPwd, setShow: props.setShowConfPwd },
          ].map((field, idx) => (
            <div key={idx}>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{field.label}</label>
              <div className="relative">
                <input
                  type={field.show ? "text" : "password"}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button type="button" onClick={() => field.setShow(!field.show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={props.savingPwd}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-md disabled:opacity-50"
        >
          {props.savingPwd ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          {tStr.updatePasswordBtn}
        </button>
      </form>

      {/* 2FA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <Shield size={16} className="text-green-500" />
          {tStr.twoFactorTitle}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{tStr.twoFactorDesc}</p>

        {props.show2FASetup ? (
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p className="text-xs text-slate-600 dark:text-slate-400">{tStr.setup2FAStep1}</p>
            {props.twoFactorQrCode && <img src={props.twoFactorQrCode} alt="2FA QR Code" className="w-40 h-40 mx-auto rounded-xl bg-white p-2" />}
            <p className="text-xs text-slate-600 dark:text-slate-400">{tStr.setup2FAStep2}</p>
            <code className="block text-xs bg-slate-200 dark:bg-slate-700 p-2 rounded text-slate-800 dark:text-white break-all">{props.twoFactorSecret}</code>
            <form onSubmit={props.onVerify2FA} className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">{tStr.setup2FAStep3}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={props.twoFactorCode}
                  onChange={(e) => props.setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center tracking-[0.5em] text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={props.verifying2FA}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {props.verifying2FA ? <Loader2 size={14} className="animate-spin" /> : tStr.btnVerify2FA}
                </button>
              </div>
              <button
                type="button"
                onClick={() => props.setShow2FASetup(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {tStr.btnCancel2FA}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${props.isTwoFactorEnabled ? "text-green-600" : "text-slate-400"}`}>
              {props.isTwoFactorEnabled ? tStr.twoFactorEnabled : tStr.twoFactorDisabled}
            </span>
            {props.isTwoFactorEnabled ? (
              <button onClick={props.onDisable2FA} className="px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition">
                {tStr.btnDisable2FA}
              </button>
            ) : (
              <button onClick={props.onGenerate2FA} className="px-4 py-2 bg-green-50 dark:bg-green-950/20 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 transition">
                {tStr.btnEnable2FA}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Role Upgrade */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <Shield size={16} className="text-purple-500" />
          {language === "vi" ? "Nâng cấp tài khoản" : "Account Upgrade"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!hasAthleteProfile && (
            <button
              onClick={props.onUpgradeToAthlete}
              disabled={props.upgradingAthlete}
              className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all text-center disabled:opacity-50"
            >
              {props.upgradingAthlete ? (
                <Loader2 size={20} className="mx-auto animate-spin text-purple-500" />
              ) : (
                <>
                  <Shield size={20} className="mx-auto text-purple-500 mb-1" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === "vi" ? "Đăng ký Vận động viên" : "Register as Athlete"}
                  </span>
                </>
              )}
            </button>
          )}
          {!hasCoachProfile && (
            <button
              onClick={props.onUpgradeToCoach}
              disabled={props.upgradingCoach}
              className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all text-center disabled:opacity-50"
            >
              {props.upgradingCoach ? (
                <Loader2 size={20} className="mx-auto animate-spin text-blue-500" />
              ) : (
                <>
                  <Shield size={20} className="mx-auto text-blue-500 mb-1" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === "vi" ? "Đăng ký Huấn luyện viên" : "Register as Coach"}
                  </span>
                </>
              )}
            </button>
          )}
          {hasAthleteProfile && (
            <Link href="/profile?tab=athlete" className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 text-center hover:bg-purple-100 transition-all">
              <Shield size={20} className="mx-auto text-purple-500 mb-1" />
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                {language === "vi" ? "Hồ sơ Vận động viên" : "Athlete Profile"}
              </span>
            </Link>
          )}
          {hasCoachProfile && (
            <Link href="/profile?tab=coach" className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 text-center hover:bg-blue-100 transition-all">
              <Shield size={20} className="mx-auto text-blue-500 mb-1" />
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                {language === "vi" ? "Hồ sơ Huấn luyện viên" : "Coach Profile"}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Theme & Language */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <Globe size={16} className="text-blue-500" />
          {tStr.customizeTitle}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">{tStr.appTheme}</label>
            <div className="flex gap-2">
              <button
                onClick={() => props.onThemeChange("light")}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                  props.theme === "light"
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Sun size={16} /> {tStr.themeLight}
              </button>
              <button
                onClick={() => props.onThemeChange("dark")}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                  props.theme === "dark"
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Moon size={16} /> {tStr.themeDark}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">{tStr.displayLang}</label>
            <div className="flex gap-2">
              <button
                onClick={() => props.onLanguageChange("vi")}
                className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all ${
                  props.language === "vi"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Tiếng Việt
              </button>
              <button
                onClick={() => props.onLanguageChange("en")}
                className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all ${
                  props.language === "en"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200 dark:border-red-800 text-red-600 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
      >
        <LogOut size={16} /> {tStr.signOutBtn}
      </button>
    </div>
  );
}
