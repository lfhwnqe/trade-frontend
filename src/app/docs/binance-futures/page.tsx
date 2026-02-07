import Link from "next/link";
import { DocsShell } from "../_components/docs-shell";
import { docsNav } from "../_components/docs-data";

const toc = [
  { title: "你需要什么权限", href: "#permissions", level: 2 as const },
  { title: "在哪里创建 API Key", href: "#create", level: 2 as const },
  { title: "安全建议", href: "#security", level: 2 as const },
  { title: "在系统里如何配置", href: "#in-app", level: 2 as const },
  { title: "手动导入（最近 1 年）", href: "#import", level: 2 as const },
  { title: "常见问题", href: "#faq", level: 2 as const },
] as const;

export default function BinanceFuturesDocPage() {
  return (
    <DocsShell
      title="币安合约同步（只读）"
      description="配置只读 API Key → 手动导入最近 1 年合约成交（fills）。"
      nav={docsNav}
      toc={[...toc]}
    >
      <section id="permissions">
        <h2>你需要什么权限</h2>
        <p>
          只需要<strong>查看/读取</strong>权限即可。不要开启交易权限。
        </p>
        <ul>
          <li>
            需要能读取 Binance Futures（合约）成交历史（fills / userTrades）。
          </li>
          <li>不需要提现权限，不需要现货交易权限。</li>
        </ul>
      </section>

      <section id="create">
        <h2>在哪里创建 API Key</h2>
        <p>
          在 Binance 官网 / App 的 API 管理页面创建 API Key。
        </p>
        <p>
          官方指引：
          <a
            className="text-[#00c2b2] hover:underline"
            href="https://www.binance.com/zh-CN/support/faq/detail/360002502072"
            target="_blank"
            rel="noreferrer"
          >
            如何创建 Binance API Key（官方 FAQ）
          </a>
          。
        </p>
        <p>
          由于 Binance 页面会不定期改版，本页同时给出“方向性指引”：
        </p>
        <ol>
          <li>
            登录 Binance → 进入 <strong>API Management（API 管理）</strong>
          </li>
          <li>
            创建一个新的 API Key（建议命名：
            <code>mmc-trade-journal-readonly</code>）
          </li>
          <li>
            权限只勾选“读取/查看”（Read / Enable Reading）。
            <strong>不要勾选</strong>任何“交易/下单/提现”相关权限。
          </li>
          <li>
            如果 Binance 要求 IP 白名单：你可以先不填（或临时放开），等我们后续支持固定出口 IP 再补。
          </li>
        </ol>
      </section>

      <section id="security">
        <h2>安全建议</h2>
        <ul>
          <li>单独创建一个专用 Key，不要复用日常交易机器人 Key。</li>
          <li>
            只给读取权限（Read-only）。即使泄露，也无法下单/提现。
          </li>
          <li>
            保存好 Secret：Binance 通常只显示一次。丢了只能重新生成。
          </li>
        </ul>
      </section>

      <section id="in-app">
        <h2>在系统里如何配置</h2>
        <p>
          进入 <strong>Trade → 开发者工具 → 集成中心 → 币安合约同步</strong>。
        </p>
        <ul>
          <li>把 Binance 的 API Key 填到“API Key”</li>
          <li>把 Binance 的 API Secret 填到“API Secret”</li>
          <li>点击“保存”</li>
        </ul>
        <p className="text-sm text-gray-400">
          说明：服务端会加密保存 Secret（不会在页面回显明文）。
        </p>
      </section>

      <section id="import">
        <h2>手动导入（最近 1 年）</h2>
        <p>
          保存 Key 后点击“开始导入”。系统会导入最近 1 年的合约成交记录，并自动去重。
        </p>
        <p>
          如果 Binance 接口提示<strong>必须提供 symbol</strong>，请在页面填写 symbols（例如
          <code>BTCUSDT</code>、<code>ETHUSDT</code>）再重试。
        </p>
      </section>

      <section id="faq">
        <h2>常见问题</h2>
        <h3>为什么我导入时报权限错误？</h3>
        <p>
          通常是 API Key 没有开启读取合约数据权限，或账号风控限制导致。请确认创建 Key 时勾选了读取权限，并在 Binance 端完成必要的安全验证。
        </p>

        <h3>我可以只同步某几个币种吗？</h3>
        <p>
          可以。你可以在导入时填写 symbols 列表，只拉取指定标的。
        </p>

        <h3>下一步会自动同步吗？</h3>
        <p>
          目前按你的要求：只做<strong>手动触发</strong>。后续需要的话，我们再加“定时增量同步”。
        </p>
      </section>

      <hr />
      <p>
        Next steps：
        <Link href="/docs/get-started">快速开始</Link> 或
        <Link href="/trade/binance-futures">去配置币安合约同步</Link>
      </p>
    </DocsShell>
  );
}
