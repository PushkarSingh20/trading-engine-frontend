import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "./nav-items";

function Wordmark() {
  return (
    <div className="flex h-11 items-center gap-2.5 border-b border-line px-4">
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.25" />
        <circle cx="12" cy="12" r="5.5" fill="none" stroke="var(--color-accent)" strokeWidth="1.25" />
        <circle cx="12" cy="12" r="1.8" fill="var(--color-accent)" />
        <circle cx="22" cy="12" r="1.6" fill="var(--color-info)" />
      </svg>
      <div className="leading-none">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-fg">TRADING ENGINE</p>
        <p className="num mt-1 text-[10px] text-dim">research workstation</p>
      </div>
    </div>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-surface">
      <Wordmark />
      <nav aria-label="Primary" className="flex-1 overflow-y-auto py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="label-caps px-4 pb-1.5 text-dim">{group.label}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex h-8 items-center gap-2.5 px-4 text-[13px] transition-colors",
                        isActive ? "bg-raised text-fg" : "text-muted hover:bg-raised/50 hover:text-fg",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute inset-y-1.5 left-0 w-0.5 bg-accent" aria-hidden="true" />}
                        <item.icon className={cn("size-3.5 shrink-0", isActive ? "text-accent" : "text-dim group-hover:text-muted")} aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                        <span className="num ml-auto text-[10px] text-dim">{item.code}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line px-4 py-3">
        <p className="num text-[10px] leading-4 text-dim">
          build 0.1.0-concept
          <br />
          broker: <span className="text-muted">not connected</span>
          <br />
          execution: <span className="text-muted">simulated only</span>
        </p>
      </div>
    </div>
  );
}
