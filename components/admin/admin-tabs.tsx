"use client";

import type { AdminTab } from "@/components/admin/types";

type AdminTabsProps = {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
};

const tabs: Array<[AdminTab, string]> = [
  ["tickets", "Góp ý"],
  ["surveys", "Khảo sát"],
  ["listeners", "Tiếp nhận"],
  ["account", "Tài khoản"],
];

export function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
  return (
    <div className="tabs tabs-box mb-4 grid w-full grid-cols-4 shadow-sm">
      {tabs.map(([value, label]) => (
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
