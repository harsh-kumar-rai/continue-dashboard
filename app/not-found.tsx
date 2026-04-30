import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col h-full bg-black text-[var(--color-amber)]">
      <div className="flex items-stretch border-b border-[var(--color-amber)] bg-[var(--color-panel)] h-[22px]">
        <div className="flex items-center px-2 bg-[var(--color-amber)] text-black text-[11px] font-bold tracking-widest">
          NOT FOUND
        </div>
        <div className="flex items-center px-2 text-[10px] text-[var(--color-mute)]">404</div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-[640px] px-6">
          <pre className="text-[var(--color-amber-bright)] text-[10px] leading-[1.1] tracking-tight mb-6 select-none">{`
 ███████╗  ██████╗  ██╗  ██╗
 ██╔════╝ ██╔═══██╗ ██║  ██║
 █████╗   ██║   ██║ ███████║
 ██╔══╝   ██║   ██║ ╚════██║
 ██║      ╚██████╔╝      ██║
 ╚═╝       ╚═════╝       ╚═╝
`}</pre>
          <div className="text-[12px] tracking-widest text-[var(--color-amber-bright)] font-bold mb-2">
            NO DATA // INVALID ROUTE
          </div>
          <div className="text-[11px] text-[var(--color-mute)] mb-6">
            THE TICKER, MNEMONIC OR PAGE YOU REQUESTED IS NOT IN THE BETAGEN UNIVERSE.
          </div>
          <div className="border border-[var(--color-amber-dim)] bg-[var(--color-panel)] p-4 text-left">
            <div className="text-[9px] tracking-widest text-[var(--color-mute)] mb-2">SUGGESTIONS</div>
            <ul className="space-y-1 text-[11px]">
              <li>
                <span className="text-[var(--color-amber-bright)] font-bold w-[80px] inline-block">F1</span>
                <Link href="/help" className="text-[var(--color-cyan)] hover:underline">
                  HELP — COMMAND DIRECTORY
                </Link>
              </li>
              <li>
                <span className="text-[var(--color-amber-bright)] font-bold w-[80px] inline-block">TOP</span>
                <Link href="/" className="text-[var(--color-cyan)] hover:underline">
                  RETURN TO DASHBOARD
                </Link>
              </li>
              <li>
                <span className="text-[var(--color-amber-bright)] font-bold w-[80px] inline-block">/</span>
                <span className="text-white">FOCUS COMMAND LINE AND TYPE A SYMBOL</span>
              </li>
              <li>
                <span className="text-[var(--color-amber-bright)] font-bold w-[80px] inline-block">EQS</span>
                <Link href="/screener" className="text-[var(--color-cyan)] hover:underline">
                  EQUITY SCREENER
                </Link>
              </li>
            </ul>
          </div>
          <div className="mt-6 text-[10px] text-[var(--color-mute-2)] tracking-widest">
            ERROR CODE 404 · BETAGEN TERMINAL
          </div>
        </div>
      </div>
    </div>
  )
}
