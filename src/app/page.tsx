import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <main className="w-full max-w-2xl flex flex-col items-center gap-8 py-8 px-4 bg-card rounded-lg shadow-lg">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">我的交易系统</h1>
          <span className="text-muted-foreground text-base">
            高效 · 简洁 · 智能的交易管理平台
          </span>
        </div>
        <Separator />
        <section className="w-full space-y-3">
          <p className="text-lg leading-7">
            专为日常交易记录与查询而设计。系统支持录入、管理和分析各类交易数据，助力你轻松梳理资产流动与投资绩效。
          </p>
          <ul className="list-disc pl-6 space-y-1 text-base">
            <li>强大的交易记录与筛选功能</li>
            <li>数据图表化分析，直观展示盈亏</li>
            <li>安全的用户身份认证机制</li>
            <li>多端自适应界面，随时随地访问</li>
          </ul>
        </section>
        <Separator />
        <div className="w-full flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild className="w-full sm:w-auto">
            <a href="/trade/list">进入交易列表</a>
          </Button>
        </div>
      </main>
      <footer className="mt-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} MMC Trading | 技术栈：Next.js · shadcn/ui ·
        TailwindCSS
      </footer>
    </div>
  );
}
