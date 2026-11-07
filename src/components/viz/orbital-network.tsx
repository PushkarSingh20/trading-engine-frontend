import { useEffect, useRef, useState } from "react";
import { NET_EDGES, NET_NODES, type NetEdgeKind, type NetNode } from "@/data/network";
import { CHART_COLORS as C } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";

const RING_FRACTION = [0, 0.3, 0.6, 0.86];
const RING_SPEED = [0, 0.03, -0.014, 0.006];
const EDGE_COLOR: Record<NetEdgeKind, string> = { data: C.info, signal: C.accent, order: C.pos, control: C.muted };
const NODE_INDEX = new Map(NET_NODES.map((n) => [n.id, n]));

interface Particle {
  edge: number;
  t: number;
  speed: number;
}

interface OrbitalNetworkProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function alpha(hex: string, a: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function isLive(node: NetNode | undefined) {
  return node?.status === "active";
}

export function OrbitalNetwork({ selectedId, onSelect }: OrbitalNetworkProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const hoverRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(selectedId);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const reduced = usePrefersReducedMotion();

  selectedRef.current = selectedId;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let clock = 0;
    let spawnAcc = 0;
    const particles: Particle[] = [];
    const liveEdges = NET_EDGES.map((e, i) => ({ e, i })).filter(({ e }) => isLive(NODE_INDEX.get(e.from)) && isLive(NODE_INDEX.get(e.to)));

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(wrap);

    const control = (a: { x: number; y: number }, b: { x: number; y: number }, cx: number, cy: number) => {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      return { x: mx + (cx - mx) * 0.32, y: my + (cy - my) * 0.32 };
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduced) clock += dt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const R = Math.max(60, Math.min(width, height) / 2 - 30);
      const focus = hoverRef.current ?? selectedRef.current;

      // Bezel: degree ticks around the outer frame
      ctx.lineWidth = 1;
      for (let d = 0; d < 360; d += 5) {
        const a = (d * Math.PI) / 180 - Math.PI / 2;
        const major = d % 30 === 0;
        const r1 = R + 6;
        const r2 = R + (major ? 13 : 9);
        ctx.strokeStyle = major ? C.dim : alpha(C.dim, 0.45);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
        if (major && width > 420) {
          ctx.fillStyle = C.dim;
          ctx.font = "9px 'IBM Plex Mono', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(d).padStart(3, "0"), cx + Math.cos(a) * (R + 22), cy + Math.sin(a) * (R + 22));
        }
      }

      // Crosshair
      ctx.strokeStyle = alpha(C.lineStrong, 0.5);
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbits
      RING_FRACTION.slice(1).forEach((f, i) => {
        ctx.strokeStyle = i === 2 ? C.lineStrong : C.line;
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Sweep: the engine clock hand
      if (!reduced && "createConicGradient" in ctx) {
        const sweep = (clock * 0.35) % (Math.PI * 2);
        const grad = ctx.createConicGradient(sweep - Math.PI / 2, cx, cy);
        grad.addColorStop(0, alpha(C.accent, 0));
        grad.addColorStop(0.9, alpha(C.accent, 0));
        grad.addColorStop(1, alpha(C.accent, 0.07));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, R * RING_FRACTION[3], 0, Math.PI * 2);
        ctx.fill();
      }

      // Node positions
      for (const n of NET_NODES) {
        const a = n.angle + RING_SPEED[n.ring] * clock;
        const r = R * RING_FRACTION[n.ring];
        positions.current.set(n.id, { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }

      // Edges
      NET_EDGES.forEach((e) => {
        const a = positions.current.get(e.from)!;
        const b = positions.current.get(e.to)!;
        const cp = control(a, b, cx, cy);
        const live = isLive(NODE_INDEX.get(e.from)) && isLive(NODE_INDEX.get(e.to));
        const highlighted = focus !== null && (e.from === focus || e.to === focus);
        ctx.strokeStyle = highlighted ? alpha(EDGE_COLOR[e.kind], 0.85) : alpha(EDGE_COLOR[e.kind], live ? 0.22 : 0.12);
        ctx.lineWidth = highlighted ? 1.25 : 1;
        if (!live) ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cp.x, cp.y, b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Event particles travelling along active edges
      if (!reduced && liveEdges.length) {
        spawnAcc += dt;
        while (spawnAcc > 0.16 && particles.length < 70) {
          spawnAcc -= 0.16;
          const pick = liveEdges[Math.floor(Math.random() * liveEdges.length)];
          particles.push({ edge: pick.i, t: 0, speed: 0.35 + Math.random() * 0.3 });
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.t += dt * p.speed;
          if (p.t >= 1) {
            particles.splice(i, 1);
            continue;
          }
          const e = NET_EDGES[p.edge];
          const a = positions.current.get(e.from)!;
          const b = positions.current.get(e.to)!;
          const cp = control(a, b, cx, cy);
          const u = 1 - p.t;
          const x = u * u * a.x + 2 * u * p.t * cp.x + p.t * p.t * b.x;
          const y = u * u * a.y + 2 * u * p.t * cp.y + p.t * p.t * b.y;
          const col = EDGE_COLOR[e.kind];
          ctx.fillStyle = alpha(col, 0.18);
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Nodes
      ctx.font = "10px 'IBM Plex Mono', monospace";
      for (const n of NET_NODES) {
        const p = positions.current.get(n.id)!;
        const isFocus = n.id === focus;
        const isSel = n.id === selectedRef.current;

        if (n.kind === "core") {
          const spin = clock * 0.6;
          ctx.strokeStyle = alpha(C.accent, 0.55);
          ctx.lineWidth = 1.5;
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 22, spin + (k * Math.PI * 2) / 3, spin + (k * Math.PI * 2) / 3 + 1.2);
            ctx.stroke();
          }
          ctx.strokeStyle = alpha(C.muted, 0.35);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 30, -spin * 0.5, -spin * 0.5 + Math.PI * 1.4);
          ctx.stroke();
          ctx.fillStyle = C.bg;
          ctx.strokeStyle = C.accent;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = C.accent;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (n.kind === "strategy") {
          const paused = n.status === "paused";
          const s = 7;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = paused ? C.bg : n.id === "V1" ? C.accent : C.info;
          ctx.strokeStyle = paused ? C.accent : C.bg;
          ctx.lineWidth = 1.5;
          if (paused) ctx.setLineDash([2, 2]);
          ctx.fillRect(-s, -s, s * 2, s * 2);
          ctx.strokeRect(-s, -s, s * 2, s * 2);
          ctx.restore();
          ctx.setLineDash([]);
        } else if (n.kind === "module") {
          ctx.fillStyle = C.surface;
          ctx.strokeStyle = C.info;
          ctx.lineWidth = 1;
          ctx.fillRect(p.x - 4.5, p.y - 4.5, 9, 9);
          ctx.strokeRect(p.x - 4.5, p.y - 4.5, 9, 9);
        } else {
          ctx.fillStyle = n.status === "active" ? C.muted : C.bg;
          ctx.strokeStyle = n.status === "active" ? C.muted : C.dim;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        if (isFocus || isSel) {
          ctx.strokeStyle = isSel ? C.fg : alpha(C.fg, 0.6);
          ctx.lineWidth = 1;
          const rr = n.kind === "core" ? 38 : 14;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (n.kind !== "core") {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const len = Math.hypot(dx, dy) || 1;
          const off = n.kind === "strategy" ? 16 : 11;
          const lx = p.x + (dx / len) * off;
          const ly = p.y + (dy / len) * off;
          ctx.textAlign = Math.abs(dx / len) < 0.25 ? "center" : dx > 0 ? "left" : "right";
          ctx.textBaseline = Math.abs(dy / len) < 0.25 ? "middle" : dy > 0 ? "top" : "bottom";
          ctx.fillStyle = isFocus || isSel ? C.fg : n.kind === "strategy" ? C.fg : n.status === "idle" ? C.dim : C.muted;
          ctx.fillText(n.label, lx, ly);
          if (n.status === "paused") {
            ctx.fillStyle = C.accent;
            ctx.fillText("PAUSED", lx, ly + (ctx.textBaseline === "bottom" ? -12 : 12));
          }
        } else {
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = C.fg;
          ctx.fillText("ENGINE", p.x, p.y + 40);
        }
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [reduced]);

  const hitTest = (clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: { id: string; d: number; x: number; y: number } | null = null;
    for (const [id, p] of positions.current) {
      const d = Math.hypot(p.x - x, p.y - y);
      const radius = id === "core" ? 28 : 16;
      if (d < radius && (!best || d < best.d)) best = { id, d, x: p.x, y: p.y };
    }
    return best;
  };

  const hovered = hover ? NODE_INDEX.get(hover.id) : undefined;

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Orbital map of the trading engine: strategies on the inner orbit, processing modules on the middle orbit, data feeds and research jobs on the outer orbit. Moving dots represent event flow."
        className={hover ? "cursor-pointer" : "cursor-default"}
        onPointerMove={(e) => {
          const hit = hitTest(e.clientX, e.clientY);
          hoverRef.current = hit?.id ?? null;
          setHover((prev) => (hit ? (prev?.id === hit.id ? prev : { id: hit.id, x: hit.x, y: hit.y }) : null));
        }}
        onPointerLeave={() => {
          hoverRef.current = null;
          setHover(null);
        }}
        onClick={(e) => {
          const hit = hitTest(e.clientX, e.clientY);
          onSelect(hit ? (hit.id === selectedId ? null : hit.id) : null);
        }}
      />
      {hovered && hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 border border-line-strong bg-bg/95 px-2 py-1"
          style={{ left: hover.x, top: hover.y + 20 }}
        >
          <p className="num text-2xs font-medium text-fg">{hovered.label}</p>
          <p className="num text-[10px] text-muted">{hovered.kind.toUpperCase()} · {hovered.status.toUpperCase()}</p>
        </div>
      )}
    </div>
  );
}
