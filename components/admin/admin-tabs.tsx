"use client";

import type { AdminTab } from "@/components/admin/types";

type AdminTabsProps = {
  activeTab: AdminTab;
  role?: "admin" | "listener";
  onChange: (tab: AdminTab) => void;
};

const tabs: Array<[AdminTab, string]> = [
  ["tickets", "Góp ý"],
  ["surveys", "Khảo sát"],
  ["listeners", "Tiếp nhận"],
  ["account", "Tài khoản"],
];

export function AdminTabs({ activeTab, role = "admin", onChange }: AdminTabsProps) {
  const visibleTabs = role === "listener" ? tabs.filter(([value]) => value === "tickets" || value === "account") : tabs;

  return (
    <div className={`tabs tabs-box mb-4 grid w-full shadow-sm ${visibleTabs.length === 2 ? "grid-cols-2" : "grid-cols-4"}`}>
      {visibleTabs.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={`tab text-foreground ${activeTab === value ? "tab-active bg-primary text-primary-foreground" : ""}`}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
