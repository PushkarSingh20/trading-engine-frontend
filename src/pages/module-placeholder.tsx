import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/layout/page-header";
import { ALL_NAV } from "@/components/layout/nav-items";
import { EmptyState } from "@/components/ui/states";

export function ModulePlaceholder() {
  const { pathname } = useLocation();
  const item = ALL_NAV.find((n) => n.to === pathname);
  const concept = ALL_NAV.filter((n) => n.inConcept);

  return (
    <>
      <PageHeader
        code={item?.code ?? "404"}
        title={item?.label ?? "Not found"}
        description={item ? "This module is part of the planned workstation but is not included in the current design concept." : "There is no module at this address."}
      />
      <div className="border-b border-line bg-surface">
        <EmptyState
          className="min-h-[50vh]"
          title={item ? `${item.label} is not in this concept build` : "Page not found"}
          description="The concept covers Overview, Strategy monitoring, Backtesting analytics and Paper trading."
          action={
            <ul className="flex flex-wrap justify-center gap-2">
              {concept.map((c) => (
                <li key={c.to}>
                  <Link to={c.to} className="inline-flex h-7 items-center gap-1.5 border border-line-strong bg-raised px-2.5 text-xs text-fg hover:border-dim">
                    <c.icon className="size-3.5 text-dim" aria-hidden="true" />
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          }
        />
      </div>
    </>
  );
}
