import { useState } from "react";
import { X } from "lucide-react";
import { Button, Segmented, Select } from "@/components/ui/controls";
import { Panel } from "@/components/ui/panel";
import { ErrorState } from "@/components/ui/states";
import { MarketChart } from "@/components/viz/market-chart";
import { OrbitalNetwork } from "@/components/viz/orbital-network";
import { INSTRUMENTS } from "@/data/backtest";
import { getReplayBars } from "@/data/market";
import { NET_NODES } from "@/data/network";
import { useWorkspace } from "@/state/workspace";

type View = "map" | "chart";
type Source = "demo" | "live";

const LEGEND = [
  { label: "Strategy", swatch: "size-2 rotate-45 bg-accent" },
  { label: "Module", swatch: "size-2 border border-info" },
  { label: "Feed / job", swatch: "size-2 rounded-full bg-muted" },
  { label: "Data", swatch: "h-px w-3 bg-info" },
  { label: "Signal", swatch: "h-px w-3 bg-accent" },
  { label: "Order", swatch: "h-px w-3 bg-pos" },
];

export function SystemMapPanel({ loading, className }: { loading?: boolean; className?: string }) {
  const [view, setView] = useState<View>("map");
  const [source, setSource] = useState<Source>("demo");
  const [selected, setSelected] = useState<string | null>("risk");
  const { instrument, timeframe, strategy } = useWorkspace();
  const node = NET_NODES.find((n) => n.id === selected);
  const { bars, signals } = getReplayBars(instrument, timeframe);

  return (
    <Panel
      title={view === "map" ? "System map" : `${instrument} · ${timeframe}`}
      subtitle={view === "map" ? "strategy activity · event flow" : INSTRUMENTS[instrument].name}
      demo
      loading={loading}
      className={className}
      actions={
        <>
          {view === "chart" && (
            <Segmented<Source>
              label="Chart data source"
              value={source}
              onChange={setSource}
              options={[
                { value: "demo", label: "Replay" },
                { value: "live", label: "Live" },
              ]}
            />
          )}
          <Segmented<View>
            label="Visualization"
            value={view}
            onChange={setView}
            options={[
              { value: "map", label: "Orbital" },
              { value: "chart", label: "Chart" },
            ]}
          />
        </>
      }
    >
      {view === "map" ? (
        <div className="relative h-full min-h-[420px]">
          <OrbitalNetwork selectedId={selected} onSelect={setSelected} />

          <div className="absolute left-3 top-3 w-60 max-w-[calc(100%-1.5rem)] border border-line bg-bg/90 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 border-b border-line px-2.5 py-1.5">
              <label htmlFor="node-inspect" className="label-caps text-dim">
                Inspect
              </label>
              <Select id="node-inspect" value={selected ?? ""} onChange={(e) => setSelected(e.target.value || null)} className="max-w-36">
                <option value="">— none —</option>
                {NET_NODES.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </Select>
              {node && (
                <button type="button" onClick={() => setSelected(null)} className="ml-auto p-0.5 text-dim hover:text-fg" aria-label="Clear selection">
                  <X className="size-3" />
                </button>
              )}
            </div>
            {node ? (
              <div className="px-2.5 py-2" aria-live="polite">
                <p className="num text-xs font-medium text-fg">
                  {node.label}
                  <span className={node.status === "paused" ? "ml-2 text-accent" : node.status === "idle" ? "ml-2 text-dim" : "ml-2 text-pos"}>
                    {node.status.toUpperCase()}
                  </span>
                </p>
                <p className="mt-1 text-2xs leading-4 text-muted">{node.description}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  {node.facts.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-2xs text-dim">{k}</dt>
                      <dd className="num text-right text-2xs text-fg">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="px-2.5 py-2 text-2xs text-muted">Click a node or pick one above to inspect it.</p>
            )}
          </div>

          <ul className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1" aria-label="Legend">
            {LEGEND.map((l) => (
              <li key={l.label} className="num flex items-center gap-1.5 text-[10px] text-muted">
                <span className={l.swatch} aria-hidden="true" />
                {l.label}
              </li>
            ))}
          </ul>
          <p className="num absolute bottom-3 right-3 text-right text-[10px] text-dim">
            topology: static config
            <br />
            flow: replay event rate
          </p>
        </div>
      ) : source === "live" ? (
        <div className="h-full min-h-[420px]">
          <ErrorState
            title="No live data provider configured"
            description="This workstation runs on the bundled DEMO replay dataset only. Connecting a market data vendor is outside the scope of this concept."
            action={
              <Button variant="accent" onClick={() => setSource("demo")}>
                Back to replay data
              </Button>
            }
          />
        </div>
      ) : (
        <div className="h-full min-h-[420px]">
          <MarketChart bars={bars} signals={signals} strategy={strategy} />
        </div>
      )}
    </Panel>
  );
}
