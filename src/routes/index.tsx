import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity, Download, FileText, Image as ImageIcon, Radio, Satellite,
  Signal, Telescope, Waves, Zap, CheckCircle2, AlertTriangle, XCircle,
  Cpu, Gauge, Orbit, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ReferenceLine,
  RadialBarChart, RadialBar, PolarAngleAxis, ScatterChart, Scatter, ZAxis,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DRISHTI Mission Console — Exoplanet Detection" },
      { name: "description", content: "ISRO-inspired mission control dashboard for AI-driven exoplanet candidate detection, transit analysis and MCMC confidence." },
    ],
  }),
  component: Dashboard,
});

// ----- Synthetic mission data -----
function makeLightCurve(n = 240) {
  const arr: { t: number; raw: number; clean: number; model: number; lo: number; hi: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * 10; // days
    // simulate a transit dip every ~3.2 days
    const phase = ((t % 3.2) - 1.6);
    const transit = Math.exp(-(phase * phase) / 0.005) * -0.012;
    const trend = Math.sin(t * 0.4) * 0.0015;
    const noise = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.004 - 0.002;
    const clean = 1 + transit + trend;
    const raw = clean + noise + (Math.cos(i * 7.13) * 0.0018);
    arr.push({ t: +t.toFixed(3), raw: +raw.toFixed(5), clean: +clean.toFixed(5), model: +(1 + transit + trend).toFixed(5), lo: +(1 + transit + trend - 0.0008).toFixed(5), hi: +(1 + transit + trend + 0.0008).toFixed(5) });
  }
  return arr;
}

const lightCurve = makeLightCurve();
const events = [
  { id: "E-01", t: 1.58, snr: 18.4, depth: 0.0119, score: 0.94 },
  { id: "E-02", t: 4.78, snr: 17.9, depth: 0.0117, score: 0.93 },
  { id: "E-03", t: 7.98, snr: 18.2, depth: 0.0120, score: 0.95 },
];

const predictions = [
  { label: "Planet Transit", value: 91, color: "var(--cyan)" },
  { label: "Eclipsing Binary", value: 4, color: "var(--signal)" },
  { label: "Stellar Variability", value: 1, color: "var(--warn)" },
  { label: "Blend Contamination", value: 1, color: "var(--success)" },
  { label: "Noise", value: 3, color: "var(--danger)" },
];

const mcmc = Array.from({ length: 400 }, (_, i) => {
  const r1 = Math.sin(i * 1.91) * 43758.5 % 1;
  const r2 = Math.cos(i * 2.71) * 12543.1 % 1;
  return {
    period: 3.20 + r1 * 0.03,
    depth: 0.0119 + r2 * 0.0006,
    z: Math.abs(r1 * r2),
  };
});

function Dashboard() {
  const [showRaw, setShowRaw] = useState(true);
  const [showProcessed, setShowProcessed] = useState(true);
  const now = new Date();
  const ts = now.toUTCString().replace("GMT", "UTC");

  return (
    <div className="min-h-screen text-foreground">
      <Header ts={ts} />

      <main className="mx-auto max-w-[1600px] px-6 pb-16 pt-6 space-y-6">
        {/* KPI Parameter Cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <KPI icon={<Orbit className="size-4" />} label="Orbital Period" value="3.204" unit="days" trend="±0.012" />
          <KPI icon={<Activity className="size-4" />} label="Transit Duration" value="2.81" unit="hrs" trend="±0.09" />
          <KPI icon={<Waves className="size-4" />} label="Transit Depth" value="1190" unit="ppm" trend="±42" />
          <KPI icon={<Signal className="size-4" />} label="SNR" value="18.2" unit="σ" trend="strong" trendTone="success" />
          <KPI icon={<Gauge className="size-4" />} label="Confidence" value="92.4" unit="%" trend="+1.8" trendTone="success" />
          <KPI icon={<Cpu className="size-4" />} label="BLS Power" value="0.084" unit="" trend="peaked" />
        </section>

        {/* Raw + Processed light curve */}
        <section className="panel scan-line">
          <PanelHeader
            icon={<Telescope className="size-4" />}
            title="Light Curve · Raw vs Processed"
            subtitle="KIC 8462852 · Quarter Q14 · 30-min cadence"
            right={
              <div className="flex items-center gap-2 text-xs">
                <Toggle active={showRaw} onClick={() => setShowRaw((v) => !v)} dotColor="var(--muted-foreground)">RAW</Toggle>
                <Toggle active={showProcessed} onClick={() => setShowProcessed((v) => !v)} dotColor="var(--cyan)">PROCESSED</Toggle>
              </div>
            }
          />
          <div className="px-4 pb-4">
            <div className="h-[340px] hud-grid rounded-md">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lightCurve} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="var(--grid-line)" strokeDasharray="2 4" />
                  <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--border)" }} label={{ value: "TIME (BJD - 2454833) [days]", position: "insideBottom", offset: -2, fill: "var(--muted-foreground)", fontSize: 10 }} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--border)" }} domain={["auto", "auto"]} label={{ value: "NORMALIZED FLUX", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--cyan)" }} />
                  {events.map((e) => (
                    <ReferenceArea key={e.id} x1={e.t - 0.06} x2={e.t + 0.06} fill="var(--cyan)" fillOpacity={0.08} stroke="var(--cyan)" strokeOpacity={0.4} strokeDasharray="3 3" />
                  ))}
                  {showRaw && <Line type="monotone" dataKey="raw" stroke="var(--muted-foreground)" strokeWidth={1} dot={false} name="Raw flux" />}
                  {showProcessed && <Line type="monotone" dataKey="clean" stroke="var(--cyan)" strokeWidth={1.8} dot={false} name="Processed" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Event detection + AI prediction */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="panel lg:col-span-2">
            <PanelHeader icon={<Zap className="size-4" />} title="Transit Event Detection" subtitle="Box Least Squares · 3 events flagged" />
            <div className="px-4 pb-4">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="text-left py-2 px-2">Event</th>
                    <th className="text-left py-2 px-2">Epoch (d)</th>
                    <th className="text-left py-2 px-2">Depth</th>
                    <th className="text-left py-2 px-2">SNR</th>
                    <th className="text-left py-2 px-2">Score</th>
                    <th className="text-left py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-2 text-cyan">{e.id}</td>
                      <td className="py-3 px-2">{e.t.toFixed(3)}</td>
                      <td className="py-3 px-2">{(e.depth * 1e6).toFixed(0)} ppm</td>
                      <td className="py-3 px-2">{e.snr.toFixed(1)} σ</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-[var(--cyan)]" style={{ width: `${e.score * 100}%`, boxShadow: "0 0 8px var(--cyan)" }} />
                          </div>
                          <span className="text-xs">{(e.score * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--cyan)]/40 bg-[var(--cyan)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cyan">
                          <span className="status-dot" /> Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <PanelHeader icon={<Sparkles className="size-4" />} title="AI Classification" subtitle="DRISHTI-Net v2.4" />
            <div className="px-4 pb-4 space-y-3">
              <div className="rounded-md border border-[var(--cyan)]/30 bg-[var(--cyan)]/5 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Predicted Class</div>
                <div className="mt-0.5 flex items-baseline justify-between">
                  <div className="text-lg font-semibold text-cyan text-glow">Planet Transit</div>
                  <div className="font-mono text-2xl text-cyan">91%</div>
                </div>
              </div>
              {predictions.map((p) => (
                <div key={p.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="font-mono">{p.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.value}%`, background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Model fit + Confidence gauge + MCMC */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="panel lg:col-span-2">
            <PanelHeader icon={<Radio className="size-4" />} title="Model Fit · Observed vs Predicted" subtitle="Mandel-Agol transit + GP detrending" />
            <div className="px-4 pb-4">
              <div className="h-[280px] hud-grid rounded-md">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lightCurve.slice(30, 90)} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                    <defs>
                      <linearGradient id="errBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--grid-line)" strokeDasharray="2 4" />
                    <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="hi" stroke="none" fill="url(#errBand)" />
                    <Area type="monotone" dataKey="lo" stroke="none" fill="var(--background)" />
                    <Line type="monotone" dataKey="raw" stroke="var(--muted-foreground)" strokeWidth={1} dot={false} />
                    <Line type="monotone" dataKey="model" stroke="var(--cyan-glow)" strokeWidth={2} dot={false} />
                    <ReferenceLine y={1} stroke="var(--border)" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs font-mono">
                <Metric label="χ² / dof" value="1.04" />
                <Metric label="RMS residual" value="218 ppm" />
                <Metric label="BIC" value="−3421.8" />
              </div>
            </div>
          </div>

          <div className="panel">
            <PanelHeader icon={<Gauge className="size-4" />} title="Confidence Gauge" subtitle="Aggregate likelihood" />
            <div className="px-4 pb-4">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "conf", value: 92.4, fill: "var(--cyan)" }]} startAngle={210} endAngle={-30}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background={{ fill: "var(--muted)" }} dataKey="value" cornerRadius={4} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="-mt-[155px] flex flex-col items-center pointer-events-none">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Overall</div>
                  <div className="font-mono text-4xl text-cyan text-glow">92.4%</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">σ = ±1.2</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wider">
                <div className="rounded border border-border/60 py-1.5"><div className="text-muted-foreground">Astro</div><div className="font-mono text-sm text-foreground">0.97</div></div>
                <div className="rounded border border-border/60 py-1.5"><div className="text-muted-foreground">Vetting</div><div className="font-mono text-sm text-foreground">0.89</div></div>
                <div className="rounded border border-border/60 py-1.5"><div className="text-muted-foreground">FPP</div><div className="font-mono text-sm text-foreground">0.011</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* MCMC + Verdict */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="panel lg:col-span-2">
            <PanelHeader icon={<Activity className="size-4" />} title="MCMC Posterior · Period × Depth" subtitle="40 000 samples · 4 chains converged (R̂ < 1.01)" />
            <div className="px-4 pb-4">
              <div className="h-[280px] hud-grid rounded-md">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
                    <CartesianGrid stroke="var(--grid-line)" strokeDasharray="2 4" />
                    <XAxis type="number" dataKey="period" name="Period" stroke="var(--muted-foreground)" fontSize={11} domain={["auto", "auto"]} label={{ value: "PERIOD [days]", position: "insideBottom", offset: -2, fill: "var(--muted-foreground)", fontSize: 10 }} />
                    <YAxis type="number" dataKey="depth" name="Depth" stroke="var(--muted-foreground)" fontSize={11} domain={["auto", "auto"]} tickFormatter={(v) => `${(v * 1000).toFixed(2)}‰`} />
                    <ZAxis type="number" dataKey="z" range={[20, 120]} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3", stroke: "var(--cyan)" }} />
                    <Scatter data={mcmc} fill="var(--cyan)" fillOpacity={0.35} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="panel relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 hud-grid pointer-events-none" />
            <PanelHeader icon={<CheckCircle2 className="size-4" />} title="Final Verdict" subtitle="Mission Recommendation" />
            <div className="relative px-4 pb-4">
              <div className="rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[var(--success)]/20 border border-[var(--success)]/40">
                    <CheckCircle2 className="size-6 text-[var(--success)]" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Classification</div>
                    <div className="text-xl font-semibold text-[var(--success)]">Strong Candidate</div>
                  </div>
                </div>
                <div className="mt-4 font-mono text-3xl text-foreground">92.4<span className="text-base text-muted-foreground"> / 100</span></div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Signal consistent with a sub-Neptune transiting companion. Recommend ground-based RV
                  follow-up at 0.5 m/s precision and high-resolution speckle imaging to rule out blends.
                </p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <VerdictPill tone="success" icon={<CheckCircle2 className="size-3.5" />}>Strong</VerdictPill>
                <VerdictPill tone="warn" icon={<AlertTriangle className="size-3.5" />}>Review</VerdictPill>
                <VerdictPill tone="danger" icon={<XCircle className="size-3.5" />}>False</VerdictPill>
              </div>
            </div>
          </div>
        </section>

        {/* Export */}
        <section className="panel">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Mission Report</div>
              <div className="text-sm">Generate a signed scientific report for DRISHTI-2026-Q3-014</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ExportButton icon={<FileText className="size-4" />}>Download PDF</ExportButton>
              <ExportButton icon={<Download className="size-4" />}>Download Results (.csv)</ExportButton>
              <ExportButton icon={<ImageIcon className="size-4" />}>Export Figures</ExportButton>
            </div>
          </div>
        </section>

        <footer className="pt-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground/70">
          DRISHTI · Detection of Repeating Inter-Stellar Habitable Transit Indicators · Mission Console v2.4
        </footer>
      </main>
    </div>
  );
}

// ---------- subcomponents ----------

function Header({ ts }: { ts: string }) {
  return (
    <header className="border-b border-border bg-[var(--panel)]/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-md bg-gradient-to-br from-[var(--cyan)]/30 to-[var(--signal)]/20 border border-[var(--cyan)]/40">
            <Satellite className="size-5 text-cyan" />
            <span className="absolute -inset-px rounded-md ring-1 ring-[var(--cyan)]/30 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Mission Console</div>
            <h1 className="text-lg font-semibold tracking-wide text-cyan text-glow">DRISHTI</h1>
          </div>
        </div>

        <div className="hidden h-10 w-px bg-border md:block" />

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[11px] md:grid-cols-4">
          <HeaderStat label="Target ID" value="KIC 8462852" />
          <HeaderStat label="Sector" value="Q14 · 30m" />
          <HeaderStat label="Pipeline" value="DRISHTI-Net 2.4" />
          <HeaderStat label="UTC" value={ts.slice(5, 25)} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-sm border border-[var(--success)]/40 bg-[var(--success)]/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-[var(--success)]">
            <span className="size-1.5 rounded-full bg-[var(--success)] animate-pulse" /> Processing · Nominal
          </span>
          <span className="inline-flex items-center gap-2 rounded-sm border border-[var(--cyan)]/50 bg-[var(--cyan)]/15 px-3 py-1 text-[11px] uppercase tracking-widest text-cyan">
            <CheckCircle2 className="size-3.5" /> Candidate Confirmed
          </span>
        </div>
      </div>
    </header>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}

function KPI({ icon, label, value, unit, trend, trendTone = "default" }: {
  icon: React.ReactNode; label: string; value: string; unit?: string; trend?: string; trendTone?: "default" | "success" | "warn";
}) {
  const toneClass = trendTone === "success" ? "text-[var(--success)]" : trendTone === "warn" ? "text-[var(--warn)]" : "text-muted-foreground";
  return (
    <div className="panel relative overflow-hidden p-3">
      <div className="absolute -right-4 -top-4 size-16 rounded-full bg-[var(--cyan)]/5 blur-xl" />
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="text-cyan">{icon}</span>{label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5 font-mono">
        <span className="text-2xl text-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {trend && <div className={`mt-0.5 text-[10px] font-mono uppercase tracking-wider ${toneClass}`}>{trend}</div>}
    </div>
  );
}

function PanelHeader({ icon, title, subtitle, right }: { icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="text-cyan">{icon}</span>
        <div>
          <div className="text-sm font-semibold tracking-wide text-foreground">{title}</div>
          {subtitle && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

function Toggle({ children, active, onClick, dotColor }: { children: React.ReactNode; active: boolean; onClick: () => void; dotColor: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${active ? "border-[var(--cyan)]/50 bg-[var(--cyan)]/10 text-cyan" : "border-border bg-transparent text-muted-foreground hover:text-foreground"}`}
    >
      <span className="size-1.5 rounded-full" style={{ background: active ? dotColor : "var(--muted-foreground)", opacity: active ? 1 : 0.4 }} />
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-[var(--panel)]/60 px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}

function VerdictPill({ children, tone, icon }: { children: React.ReactNode; tone: "success" | "warn" | "danger"; icon: React.ReactNode }) {
  const color = tone === "success" ? "var(--success)" : tone === "warn" ? "var(--warn)" : "var(--danger)";
  const active = tone === "success";
  return (
    <div className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-[10px] uppercase tracking-widest transition-opacity ${active ? "" : "opacity-40"}`}
      style={{ borderColor: `color-mix(in oklab, ${color} 40%, transparent)`, background: `color-mix(in oklab, ${color} 10%, transparent)`, color }}>
      {icon}{children}
    </div>
  );
}

function ExportButton({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-md border border-[var(--cyan)]/40 bg-[var(--cyan)]/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-cyan transition-all hover:bg-[var(--cyan)]/20 hover:shadow-[0_0_16px_-2px_var(--cyan)]">
      {icon}{children}
    </button>
  );
}

const tooltipStyle = {
  background: "oklch(0.15 0.03 250 / 0.95)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 11,
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  color: "var(--foreground)",
} as const;
