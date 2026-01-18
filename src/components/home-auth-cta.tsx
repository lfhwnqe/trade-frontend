"use client";

import Link from "next/link";

export default function HomeAuthCta() {
  return (
    <>
      <Link
        prefetch
        className="group relative flex h-9 items-center justify-center overflow-hidden rounded bg-[#00c2b2] px-4 text-sm font-bold text-black transition-all hover:bg-[#009e91]"
        href="trade/home"
      >
        <span className="relative z-10">开始使用</span>
      </Link>
      <Link
        prefetch
        className="group relative flex h-9 items-center justify-center overflow-hidden rounded border border-white/20 px-4 text-sm font-bold text-white transition-all hover:border-[#00c2b2] hover:text-[#00c2b2]"
        href="/auth/login"
      >
        <span className="relative z-10">登录</span>
      </Link>
    </>
  );
}
