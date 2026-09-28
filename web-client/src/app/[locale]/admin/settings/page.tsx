"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from '@/hooks/useTranslation';
import { SettingsTab } from "./SettingsTab";
import { EmailTemplatesTab } from "./EmailTemplatesTab";
import { Settings, Mail } from "lucide-react";

export default function AdminSettingsWrapperPage() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"settings" | "email-templates">("settings");

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(v: string) => setActiveTab(v as "settings" | "email-templates")}
          className="w-full"
        >
          <TabsList className="h-auto p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm inline-flex mb-4">
            <TabsTrigger
              value="settings"
              className="py-2.5 px-6 font-bold text-sm rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/40 dark:data-[state=active]:text-red-400 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              {language === "vi" ? "Cấu hình chung" : "General Settings"}
            </TabsTrigger>
            <TabsTrigger
              value="email-templates"
              className="py-2.5 px-6 font-bold text-sm rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/40 dark:data-[state=active]:text-red-400 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 transition-colors flex items-center gap-2"
            >
              <Mail size={16} />
              {language === "vi" ? "Mẫu Email" : "Email Templates"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0 bg-transparent">
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "email-templates" && <EmailTemplatesTab />}
      </div>
    </div>
  );
}
