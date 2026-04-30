export default function Loading() {
  // Bloomberg-style "scanning" skeleton: dotted bars with stagger.
  const bars = Array.from({ length: 18 })
  return (
    <div className="flex flex-col h-full bg-black text-[var(--color-amber)]">
      <div className="flex items-stretch border-b border-[var(--color-amber)] bg-[var(--color-panel)] h-[22px]">
        <div className="flex items-center px-2 bg-[var(--color-amber)] text-black text-[11px] font-bold tracking-widest">
          LOADING
        </div>
        <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)] tracking-widest">
          FETCHING DATA · PLEASE WAIT
        </div>
        <div className="flex-1" />
        <div className="flex items-center px-2 text-[10px] text-[var(--color-amber-bright)]">
          <span className="bb-cursor" />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-[1px] p-[1px] bg-[var(--color-border-strong)]">
        {[0, 1, 2, 3, 4, 5].map((p) => (
          <div key={p} className="bg-[var(--color-panel)] flex flex-col">
            <div className="flex items-stretch h-[20px] bg-black border-b border-[var(--color-amber-dim)]">
              <div className="flex items-center px-2 bg-[var(--color-amber-dim)] text-black text-[10px] font-bold tracking-widest">
                LOADING
              </div>
              <div className="flex-1" />
              <div className="px-2 text-[10px] text-[var(--color-mute)] flex items-center">···</div>
            </div>
            <div className="flex-1 p-2 space-y-[6px] overflow-hidden">
              {bars.map((_, i) => (
                <div
                  key={i}
                  className="h-[8px] bg-[var(--color-border)] relative overflow-hidden"
                  style={{
                    width: `${40 + ((i * 13 + p * 7) % 55)}%`,
                    animation: "bb-shimmer 1.6s linear infinite",
                    animationDelay: `${(i * 80) % 1600}ms`,
                  }}
                >
                  <div
                    className="absolute inset-y-0 w-[40%]"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--color-amber-dim), transparent)",
                      animation: "bb-shimmer-slide 1.6s linear infinite",
                      animationDelay: `${(i * 80) % 1600}ms`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes bb-shimmer-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes bb-shimmer {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
