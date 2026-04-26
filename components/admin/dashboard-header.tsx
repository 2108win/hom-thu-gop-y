"use client";

import {
  CheckCircle2,
  FileSpreadsheet,
  Home,
  Inbox,
  LoaderCircle,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import type { IsActionPending } from "@/components/admin/types";
import { unitName } from "@/lib/site-data";

type DashboardHeaderProps = {
  adminDisplayName: string;
  ticketCount: number;
  pendingCount: number;
  doneCount: number;
  openSurveyCount: number;
  surveyCount: number;
  loading: boolean;
  isActionPending: IsActionPending;
  onLogout: () => void;
  onRefresh: () => void;
};

export function DashboardHeader({
  adminDisplayName,
  ticketCount,
  pendingCount,
  doneCount,
  openSurveyCount,
  surveyCount,
  loading,
  isActionPending,
  onLogout,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <header className="command-hero hero-panel mb-4 flex flex-col gap-4 p-4 text-white shadow-xl shadow-green-950/20">
      <button
        type="button"
        onClick={onLogout}
        disabled={isActionPending("logout")}
        className="btn btn-accent btn-sm focus-lift gap-2 px-3 text-xs font-semibold uppercase"
      >
        {isActionPending("logout") ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        {isActionPending("logout") ? "Đang thoát" : "Thoát"}
      </button>
      <div className="mb-4 flex flex-col flex-wrap gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-(--military-medal-soft) uppercase">
            {unitName}
          </p>
          <h1 className="text-xl font-semibold uppercase">
            Bảng điều hành hòm thư góp ý
          </h1>
          <p className="text-xs text-white/70">
            Quản lý góp ý, phản hồi xử lý và danh sách khảo sát.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white/80">
            <UserRound className="size-3.5" />
            {adminDisplayName}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="btn btn-outline btn-sm focus-lift border-white/20 bg-white/10 px-3 text-xs font-semibold text-white uppercase hover:bg-white/20 hover:text-white"
          >
            <Home className="size-4" />
            Trang chính
          </Link>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="btn btn-outline btn-sm focus-lift gap-2 border-white/20 bg-white/10 px-3 text-xs font-semibold uppercase"
          >
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            {loading ? "Đang tải" : "Làm mới"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="metric-tile p-3">
          <Inbox className="mb-2 size-5 text-(--military-medal-soft)" />
          <p className="text-2xl font-semibold">{ticketCount}</p>
          <p className="text-[10px] font-semibold text-white/70 uppercase">
            Phiếu đã nhận
          </p>
        </div>
        <div className="metric-tile p-3">
          <ShieldCheck className="mb-2 size-5 text-(--military-medal-soft)" />
          <p className="text-2xl font-semibold">{pendingCount}</p>
          <p className="text-[10px] font-semibold text-white/70 uppercase">
            Đang chờ
          </p>
        </div>
        <div className="metric-tile p-3">
          <CheckCircle2 className="mb-2 size-5 text-(--military-medal-soft)" />
          <p className="text-2xl font-semibold">{doneCount}</p>
          <p className="text-[10px] font-semibold text-white/70 uppercase">
            Đã xử lý
          </p>
        </div>
        <div className="metric-tile p-3">
          <FileSpreadsheet className="mb-2 size-5 text-(--military-medal-soft)" />
          <p className="text-2xl font-semibold">
            {openSurveyCount}/{surveyCount}
          </p>
          <p className="text-[10px] font-semibold text-white/70 uppercase">
            Khảo sát đang mở
          </p>
        </div>
      </div>
    </header>
  );
}
