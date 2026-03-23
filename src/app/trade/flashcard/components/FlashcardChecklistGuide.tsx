type FlashcardChecklistGuideProps = {
  className?: string;
};

const NOTE_TEMPLATE = [
  "1. 当前属于什么剧本：",
  "2. 这个剧本为什么成立：",
  "3. 标准入场方式：",
  "4. 止损应该放哪里：",
  "5. 哪个点最容易误判：",
].join("\n");

export function FlashcardChecklistGuide({ className }: FlashcardChecklistGuideProps) {
  return (
    <div className={["space-y-4 rounded-lg border border-[#27272a] bg-[#18181b] p-4", className]
      .filter(Boolean)
      .join(" ")}>
      <div>
        <div className="text-sm font-medium text-[#e5e7eb]">录卡 checklist</div>
        <div className="mt-1 text-xs text-[#9ca3af]">先判断这张图值不值得进题库，再按下面模板写备注，后面复盘会省很多事。</div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-[#9ca3af]">录入标准</div>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#d4d4d8]">
            <li><span className="font-medium text-[#e5e7eb]">典型剧本</span>：非常标准，适合以后重复训练</li>
            <li><span className="font-medium text-[#e5e7eb]">容易误判</span>：你差点做错，或过去经常做错</li>
            <li><span className="font-medium text-[#e5e7eb]">混乱环境</span>：典型“不能做”的图，必须保留用于训练 NO_TRADE</li>
            <li><span className="font-medium text-[#e5e7eb]">执行有代表性</span>：适合练挂单、回踩、时间止损、不追单</li>
          </ol>
        </div>

        <div>
          <div className="text-xs font-medium text-[#9ca3af]">题目备注建议模板</div>
          <pre className="mt-2 whitespace-pre-wrap rounded-md border border-[#27272a] bg-[#121212] p-3 text-sm leading-6 text-[#d4d4d8]">{NOTE_TEMPLATE}</pre>
        </div>
      </div>
    </div>
  );
}
