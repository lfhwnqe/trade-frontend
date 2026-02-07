import Link from "next/link";

export type DocsNavItem = {
  title: string;
  href: string;
};

export type DocsTocItem = {
  title: string;
  href: string; // should be an in-page anchor like #create
  level?: 2 | 3;
};

export function DocsShell({
  title,
  description,
  nav,
  toc,
  children,
}: {
  title: string;
  description?: string;
  nav: DocsNavItem[];
  toc?: DocsTocItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight hover:text-[#00c2b2]"
            >
              MMCTradeJournal
            </Link>
            <span className="text-xs text-gray-600">/</span>
            <Link
              href="/docs"
              className="text-sm text-gray-300 hover:text-[#00c2b2]"
            >
              文档
            </Link>
          </div>

          {/* Search placeholder (future) */}
          <div className="hidden w-[340px] md:block">
            <div className="rounded-lg border border-white/10 bg-[#121212]/70 px-3 py-1.5 text-xs text-gray-500">
              搜索文档（即将上线）
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/trade/home"
              className="text-xs text-gray-300 hover:text-[#00c2b2]"
            >
              进入系统
            </Link>
          </div>
        </div>
      </div>

      {/* 3-column */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 md:px-6 lg:grid-cols-[240px_minmax(0,1fr)_220px]">
        {/* Left nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="text-xs font-semibold text-gray-400">目录</div>
            <nav className="mt-3 space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-[#00c2b2]"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">
          <div className="rounded-2xl border border-white/10 bg-[#121212]/50 p-6 md:p-8">
            <div className="text-xs font-medium text-[#00c2b2]">Docs</div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-sm text-gray-400 md:text-base">
                {description}
              </p>
            ) : null}

            <div className="prose prose-invert mt-8 max-w-none prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10">
              {children}
            </div>
          </div>
        </main>

        {/* Right toc */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="text-xs font-semibold text-gray-400">本页导航</div>
            {toc && toc.length > 0 ? (
              <nav className="mt-3 space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-1.5 text-sm text-gray-300 hover:text-[#00c2b2] ${
                      item.level === 3 ? "pl-6 text-[13px] text-gray-400" : ""
                    }`}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            ) : (
              <div className="mt-3 text-sm text-gray-500">—</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
