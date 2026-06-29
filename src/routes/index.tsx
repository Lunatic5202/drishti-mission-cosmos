import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity, Download, FileText, Image as ImageIcon, Radio, Satellite,
  Signal, Telescope, Waves, Zap, CheckCircle2, AlertTriangle, XCircle,
  Cpu, Gauge, Orbit, Sparkles, LayoutDashboard, LineChart as LineIcon,
  ScatterChart as ScatterIcon, Brain, ClipboardCheck, FileDown,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ReferenceLine,
  RadialBarChart, RadialBar, PolarAngleAxis, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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
    const t = i / n * 10;
    const phase = ((t % 3.2) - 1.6);
    const transit = Math.exp(-(phase * phase) / 0.005) * -0.012;
    const trend = Math.sin(t * 0.4) * 0.0015;
    const noise = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.004 - 0.002;
    const clean = 1 + transit + trend;
    const raw = clean + noise + (Math.cos(i * 7.13) * 0.0018);
    arr.push({
      t: +t.toFixed(3),
      raw: +raw.toFixed(5),
      clean: +clean.toFixed(5),
      model: +(1 + transit + trend).toFixed(5),
      lo: +(1 + transit + trend - 0.0008).toFixed(5),
      hi: +(1 + transit + trend + 0.0008).toFixed(5),
    });
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

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function Dashboard() {
  const [showRaw, setShowRaw] = useState(true);
  const [showProcessed, setShowProcessed] = useState(true);
  const [tab, setTab] = useState("overview");
  const [ts, setTs] = useState("—");

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTs(d.toUTCString().slice(5, 25));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleExportCSV = () => {
    const rows = ["t,raw_flux,processed_flux,model_flux"];
    lightCurve.forEach((p) => rows.push(`${p.t},${p.raw},${p.clean},${p.model}`));
    downloadFile("drishti_lightcurve.csv", rows.join("\n"), "text/csv");
    toast.success("Light curve results downloaded", { description: "drishti_lightcurve.csv" });
  };

  const handleExportPDF = () => {
    const report = `DRISHTI Mission Report\n=======================\nTarget: KIC 8462852\nPipeline: DRISHTI-Net 2.4\nClassification: Planet Transit (91%)\nConfidence: 92.4%\nPeriod: 3.204 d  Depth: 1190 ppm  SNR: 18.2σ\nVerdict: Strong Candidate\n\nGenerated: ${new Date().toISOString()}\n`;
    downloadFile("drishti_report.txt", report, "text/plain");
    toast.success("Mission report generated", { description: "drishti_report.txt" });
  };

  const handleExportFigures = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200"><rect width="100%" height="100%" fill="#0a1428"/><text x="20" y="40" fill="#7be3ff" font-family="monospace">DRISHTI Light Curve Snapshot</text><polyline fill="none" stroke="#7be3ff" stroke-width="1.5" points="${lightCurve.map((p, i) => `${20 + i * 3.2},${120 - (p.clean - 1) * 4000}`).join(" ")}"/></svg>`;
    downloadFile("drishti_figure.svg", svg, "image/svg+xml");
    toast.success("Figure exported", { description: "drishti_figure.svg" });
  };

  const handleRerun = () => toast.info("Re-running DRISHTI-Net pipeline", { description: "Estimated 12s · using cached photometry" });

  return (
    <div className="min-h-screen text-foreground">
      <Toaster theme="dark" position="bottom-right" />
      <Header ts={ts} onRerun={handleRerun} />

      <main className="mx-auto max-w-[1600px] px-6 pb-16 pt-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-md border border-border bg-[var(--panel)]/60 p-1">
            <TabTrigger value="overview" icon={<LayoutDashboard className="size-3.5" />}>Overview</TabTrigger>
            <TabTrigger value="raw" icon={<LineIcon className="size-3.5" />}>Raw Signal</TabTrigger>
            <TabTrigger value="processed" icon={<Waves className="size-3.5" />}>Processed</TabTrigger>
            <TabTrigger value="events" icon={<Zap className="size-3.5" />}>Events</TabTrigger>
            <TabTrigger value="ai" icon={<Brain className="size-3.5" />}>AI Classification</TabTrigger>
            <TabTrigger value="fit" icon={<Radio className="size-3.5" />}>Model Fit</TabTrigger>
            <TabTrigger value="mcmc" icon={<ScatterIcon className="size-3.5" />}>MCMC</TabTrigger>
            <TabTrigger value="verdict" icon={<ClipboardCheck className="size-3.5" />}>Verdict</TabTrigger>
            <TabTrigger value="export" icon={<FileDown className="size-3.5" />}>Export</TabTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-0">
            <KPIGrid />
            <div className="grid gap-6 lg:grid-cols-3">
              <PanelCard className="lg:col-span-2" icon={<Telescope className="size-4" />} title="Light Curve · Snapshot" subtitle="Processed flux preview">
                <LightCurveChart showRaw={false} showProcessed compact />
              </PanelCard>
              <PanelCard icon={<Sparkles className="size-4" />} title="AI Classification" subtitle="DRISHTI-Net v2.4">
                <PredictionPanel />
              </PanelCard>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <PanelCard icon={<Gauge className="size-4" />} title="Confidence Gauge" subtitle="Aggregate likelihood">
                <ConfidenceGauge />
              </PanelCard>
              <VerdictCard className="lg:col-span-2" />
            </div>
          </TabsContent>

          <TabsContent value="raw" className="mt-0">
            <PanelCard icon={<Telescope className="size-4" />} title="Raw Signal" subtitle="KIC 8462852 · Quarter Q14 · 30-min cadence" scan
              right={<Legend label="RAW FLUX" color="var(--muted-foreground)" />}>
              <LightCurveChart showRaw showProcessed={false} />
              <HelpRow text="Original photometric signal prior to detrending. Noise, systematics and stellar trends are visible." />
            </PanelCard>
          </TabsContent>

          <TabsContent value="processed" className="mt-0">
            <PanelCard icon={<Waves className="size-4" />} title="Processed Signal" subtitle="GP detrended · outliers σ-clipped" scan
              right={
                <div className="flex items-center gap-2">
                  <Toggle active={showRaw} onClick={() => setShowRaw((v) => !v)} dotColor="var(--muted-foreground)">RAW</Toggle>
                  <Toggle active={showProcessed} onClick={() => setShowProcessed((v) => !v)} dotColor="var(--cyan)">PROCESSED</Toggle>
                </div>
              }>
              <LightCurveChart showRaw={showRaw} showProcessed={showProcessed} />
              <HelpRow text="Toggle overlays to compare noise reduction. Detected transits highlighted in cyan bands." />
            </PanelCard>
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            <PanelCard icon={<Zap className="size-4" />} title="Transit Event Detection" subtitle="Box Least Squares · 3 events flagged">
              <EventsTable />
            </PanelCard>
          </TabsContent>

          <TabsContent value="ai" className="mt-0 space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <PanelCard className="lg:col-span-2" icon={<Brain className="size-4" />} title="DRISHTI-Net Classification" subtitle="Ensemble of 7 CNN+Transformer heads">
                <PredictionPanel detailed />
              </PanelCard>
              <PanelCard icon={<Cpu className="size-4" />} title="Inference Metadata" subtitle="Latest forward pass">
                <dl className="px-4 pb-4 space-y-2.5 font-mono text-xs">
                  <Meta k="Model" v="DRISHTI-Net 2.4.1" />
                  <Meta k="Params" v="84.2 M" />
                  <Meta k="Latency" v="312 ms" />
                  <Meta k="Input window" v="2048 cadences" />
                  <Meta k="Heads" v="7 ensemble" />
                  <Meta k="Calibration" v="Platt-scaled" />
                  <Meta k="Drift" v="0.4σ — nominal" />
                </dl>
              </PanelCard>
            </div>
          </TabsContent>

          <TabsContent value="fit" className="mt-0">
            <PanelCard icon={<Radio className="size-4" />} title="Model Fit · Observed vs Predicted" subtitle="Mandel-Agol transit + GP detrending">
              <ModelFitChart />
              <div className="grid grid-cols-3 gap-3 px-4 pb-4 text-xs font-mono">
                <Metric label="χ² / dof" value="1.04" />
                <Metric label="RMS residual" value="218 ppm" />
                <Metric label="BIC" value="−3421.8" />
              </div>
            </PanelCard>
          </TabsContent>

          <TabsContent value="mcmc" className="mt-0 space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <PanelCard className="lg:col-span-2" icon={<Activity className="size-4" />} title="MCMC Posterior · Period × Depth" subtitle="40 000 samples · 4 chains · R̂ < 1.01">
                <MCMCChart />
              </PanelCard>
              <PanelCard icon={<Gauge className="size-4" />} title="Confidence Gauge" subtitle="Aggregate likelihood">
                <ConfidenceGauge />
              </PanelCard>
            </div>
          </TabsContent>

          <TabsContent value="verdict" className="mt-0">
            <VerdictCard expanded />
          </TabsContent>

          <TabsContent value="export" className="mt-0">
            <PanelCard icon={<FileDown className="size-4" />} title="Mission Report Export" subtitle="DRISHTI-2026-Q3-014">
              <div className="grid gap-4 p-4 md:grid-cols-3">
                <ExportCard
                  icon={<FileText className="size-5" />}
                  title="PDF Report"
                  desc="Full scientific summary, plots and verdict."
                  cta="Download PDF"
                  onClick={handleExportPDF}
                />
                <ExportCard
                  icon={<Download className="size-5" />}
                  title="Results CSV"
                  desc="Time-series flux + model values per cadence."
                  cta="Download Results"
                  onClick={handleExportCSV}
                />
                <ExportCard
                  icon={<ImageIcon className="size-5" />}
                  title="Figures (SVG)"
                  desc="Vector exports of plots for publication."
                  cta="Export Figures"
                  onClick={handleExportFigures}
                />
              </div>
            </PanelCard>
          </TabsContent>
        </Tabs>

        <footer className="pt-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground/70">
          DRISHTI · Detection of Repeating Inter-Stellar Habitable Transit Indicators · Mission Console v2.4
        </footer>
      </main>
    </div>
  );
}

// ---------- sections ----------

function KPIGrid() {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <KPI icon={<Orbit className="size-4" />} label="Orbital Period" value="3.204" unit="days" trend="±0.012" />
      <KPI icon={<Activity className="size-4" />} label="Transit Duration" value="2.81" unit="hrs" trend="±0.09" />
      <KPI icon={<Waves className="size-4" />} label="Transit Depth" value="1190" unit="ppm" trend="±42" />
      <KPI icon={<Signal className="size-4" />} label="SNR" value="18.2" unit="σ" trend="strong" trendTone="success" />
      <KPI icon={<Gauge className="size-4" />} label="Confidence" value="92.4" unit="%" trend="+1.8" trendTone="success" />
      <KPI icon={<Cpu className="size-4" />} label="BLS Power" value="0.084" unit="" trend="peaked" />
    </section>
  );
}

function LightCurveChart({ showRaw, showProcessed, compact = false }: { showRaw: boolean; showProcessed: boolean; compact?: boolean }) {
  return (
    <div className="px-4 pb-4">
      <div className={`${compact ? "h-[260px]" : "h-[420px]"} hud-grid rounded-md`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lightCurve} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--grid-line)" strokeDasharray="2 4" />
            <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--border)" }} domain={["auto", "auto"]} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--cyan)" }} />
            {events.map((e) => (
              <ReferenceArea key={e.id} x1={e.t - 0.06} x2={e.t + 0.06} fill="var(--cyan)" fillOpacity={0.08} stroke="var(--cyan)" strokeOpacity={0.4} strokeDasharray="3 3" />
            ))}
            {showRaw && <Line type="monotone" dataKey="raw" stroke="var(--muted-foreground)" strokeWidth={1} dot={false} name="Raw" />}
            {showProcessed && <Line type="monotone" dataKey="clean" stroke="var(--cyan)" strokeWidth={1.8} dot={false} name="Processed" />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EventsTable() {
  return (
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
            <th className="text-left py-2 px-2">Action</th>
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
              <td className="py-3 px-2">
                <button
                  onClick={() => toast.info(`Inspecting ${e.id}`, { description: `Epoch ${e.t.toFixed(3)} d · SNR ${e.snr.toFixed(1)}σ` })}
                  className="rounded border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:border-[var(--cyan)]/60 hover:text-cyan transition-colors"
                >Inspect</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PredictionPanel({ detailed = false }: { detailed?: boolean }) {
  return (
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
      {detailed && (
        <div className="mt-3 rounded border border-border/60 bg-[var(--panel)]/60 p-3 text-xs leading-relaxed text-muted-foreground">
          Ensemble agreement: <span className="text-foreground">6 / 7 heads</span> · Saliency peaks align with three independent transit windows.
          Recommend RV follow-up and AO imaging to confirm.
        </div>
      )}
    </div>
  );
}

function ConfidenceGauge() {
  return (
    <div className="px-4 pb-4">
      <div className="relative h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "conf", value: 92.4, fill: "var(--cyan)" }]} startAngle={210} endAngle={-30}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: "var(--muted)" }} dataKey="value" cornerRadius={4} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
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
  );
}

function ModelFitChart() {
  return (
    <div className="px-4 pb-4">
      <div className="h-[360px] hud-grid rounded-md">
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
    </div>
  );
}

function MCMCChart() {
  return (
    <div className="px-4 pb-4">
      <div className="h-[360px] hud-grid rounded-md">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="var(--grid-line)" strokeDasharray="2 4" />
            <XAxis type="number" dataKey="period" name="Period" stroke="var(--muted-foreground)" fontSize={11} domain={["auto", "auto"]} />
            <YAxis type="number" dataKey="depth" name="Depth" stroke="var(--muted-foreground)" fontSize={11} domain={["auto", "auto"]} tickFormatter={(v) => `${(v * 1000).toFixed(2)}‰`} />
            <ZAxis type="number" dataKey="z" range={[20, 120]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3", stroke: "var(--cyan)" }} />
            <Scatter data={mcmc} fill="var(--cyan)" fillOpacity={0.35} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function VerdictCard({ className = "", expanded = false }: { className?: string; expanded?: boolean }) {
  return (
    <div className={`panel relative overflow-hidden ${className}`}>
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
            <div className="ml-auto font-mono text-3xl text-foreground">92.4<span className="text-base text-muted-foreground"> / 100</span></div>
          </div>
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

        {expanded && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 text-xs">
            <div className="rounded border border-border/60 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Recommendation</div>
              Schedule ground-based radial-velocity confirmation. Acquire AO imaging for nearby companion ruling.
            </div>
            <div className="rounded border border-border/60 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Risk factors</div>
              Low. Marginal FPP from background EBs (0.011). No centroid offset detected.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- atoms ----------

function Header({ ts, onRerun }: { ts: string; onRerun: () => void }) {
  return (
    <header className="border-b border-border bg-[var(--panel)]/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-md bg-gradient-to-br from-[var(--cyan)]/30 to-[var(--signal)]/20 border border-[var(--cyan)]/40">
            <Satellite className="size-5 text-cyan" />
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
          <HeaderStat label="UTC" value={ts} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-sm border border-[var(--success)]/40 bg-[var(--success)]/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-[var(--success)]">
            <span className="size-1.5 rounded-full bg-[var(--success)] animate-pulse" /> Nominal
          </span>
          <button
            onClick={onRerun}
            className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--cyan)]/50 bg-[var(--cyan)]/15 px-3 py-1 text-[11px] uppercase tracking-widest text-cyan transition-colors hover:bg-[var(--cyan)]/25"
          >
            <Cpu className="size-3.5" /> Re-run Pipeline
          </button>
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

function TabTrigger({ value, icon, children }: { value: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="gap-1.5 rounded-sm border border-transparent px-3 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground data-[state=active]:border-[var(--cyan)]/50 data-[state=active]:bg-[var(--cyan)]/10 data-[state=active]:text-cyan data-[state=active]:shadow-none"
    >
      {icon}{children}
    </TabsTrigger>
  );
}

function PanelCard({
  children, icon, title, subtitle, right, className = "", scan = false,
}: { children: React.ReactNode; icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode; className?: string; scan?: boolean }) {
  return (
    <div className={`panel ${scan ? "scan-line" : ""} ${className}`}>
      <PanelHeader icon={icon} title={title} subtitle={subtitle} right={right} />
      {children}
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
    <div className="flex items-center justify-between border-b border-border px-4 py-3 gap-3 flex-wrap">
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

function Legend({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} />{label}
    </div>
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

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
      <dd className="text-foreground">{v}</dd>
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

function ExportCard({ icon, title, desc, cta, onClick }: { icon: React.ReactNode; title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <div className="rounded-md border border-border bg-[var(--panel)]/60 p-4 flex flex-col">
      <div className="flex items-center gap-2 text-cyan">{icon}<span className="text-sm font-semibold text-foreground">{title}</span></div>
      <p className="mt-2 flex-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
      <button
        onClick={onClick}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-[var(--cyan)]/40 bg-[var(--cyan)]/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-cyan transition-all hover:bg-[var(--cyan)]/20 hover:shadow-[0_0_16px_-2px_var(--cyan)]"
      >{cta}</button>
    </div>
  );
}

function HelpRow({ text }: { text: string }) {
  return <div className="mx-4 mb-4 rounded border border-border/40 bg-[var(--panel)]/40 px-3 py-2 text-[11px] text-muted-foreground">{text}</div>;
}

const tooltipStyle = {
  background: "oklch(0.15 0.03 250 / 0.95)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 11,
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  color: "var(--foreground)",
} as const;
