"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from '@/hooks/useTranslation';
import { SportsTab } from "./SportsTab";
import { DisabilityClassesTab } from "./DisabilityClassesTab";
import { Trophy, CheckCircle2 } from "lucide-react";

export default function AdminSportsPage() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"sports" | "disability-classes">("sports");

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(v: string) => setActiveTab(v as "sports" | "disability-classes")}
          className="w-full"
        >
          <TabsList className="h-auto p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm inline-flex mb-4">
            <TabsTrigger
              value="sports"
              className="py-2.5 px-6 font-bold text-sm rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/40 dark:data-[state=active]:text-red-400 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 transition-colors flex items-center gap-2"
            >
              <Trophy size={16} />
              {language === "vi" ? "Quản lý Bộ môn" : "Sports"}
            </TabsTrigger>
            <TabsTrigger
              value="disability-classes"
              className="py-2.5 px-6 font-bold text-sm rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/40 dark:data-[state=active]:text-red-400 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              {language === "vi" ? "Hạng thương tật" : "Disability Classes"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0 bg-transparent">
        {activeTab === "sports" && <SportsTab />}
        {activeTab === "disability-classes" && <DisabilityClassesTab />}
      </div>
    </div>
  );
}
