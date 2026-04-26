"use client";

import { LoaderCircle, LogIn } from "lucide-react";
import type { FormEvent } from "react";

import { unitName } from "@/lib/site-data";

type LoginFormProps = {
  loading: boolean;
  loginError: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginForm({ loading, loginError, onSubmit }: LoginFormProps) {
  return (
    <main className="site-canvas flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="shine-card reveal-up border-border w-full max-w-sm border bg-white p-7 text-center shadow-xl"
      >
        <p className="text-primary mb-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
          {unitName}
        </p>
        <h2 className="text-primary mb-2 text-xl font-semibold uppercase">
          Quản trị viên
        </h2>
        <label className="floating-label mb-3 block">
          <span>Tên đăng nhập</span>
          <input
            name="user"
            placeholder="Tên đăng nhập"
            required
            className="input bg-muted focus:border-primary h-10 w-full border p-3 outline-none focus:bg-white"
          />
        </label>
        <label className="floating-label mb-5 block">
          <span>Mật khẩu</span>
          <input
            name="pass"
            type="password"
            placeholder="Mật khẩu"
            required
            className="input bg-muted focus:border-primary h-10 w-full border p-3 outline-none focus:bg-white"
          />
        </label>
        {loginError && (
          <p className="rounded-field mb-4 border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">
            {loginError}
          </p>
        )}
        <button
          disabled={loading}
          className="btn btn-error focus-lift w-full gap-2 font-semibold uppercase shadow-lg disabled:opacity-70"
        >
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <LogIn className="size-4" />
          )}
          {loading ? "Đang đăng nhập" : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
