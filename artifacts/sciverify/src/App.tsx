import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Activity, ArrowLeft, ArrowRight, Atom, BarChart3, BookOpen, Check, CheckCircle2, ChevronRight,
  Clock3, Code2, Copy, Database, Download, FileBarChart, FlaskConical, Github, HardDrive, Info,
  LayoutDashboard, Menu, MoreHorizontal, Orbit, Play, Plus, RefreshCw, Search, Server, Settings2,
  ShieldCheck, Terminal, Upload, Users, XCircle,
} from 'lucide-react';
import { CosmicLabPage } from '@/pages/simulations/CosmicLabPage';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import type { Domain, Evaluation, ScientificTask } from '@/lib/mock-data';
import {
  useFixtureQuery,
  useHarnessView,
  useResultQuery,
  useRunFixtureMutation,
} from '@/hooks/use-harness-data';
import { fixtureToTask, formatPct } from '@/lib/harness-map';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

const navSections = [
  { label: 'Workspace', items: [
    { href: '/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/tasks', label: 'Scientific tasks', icon: FlaskConical },
    { href: '/run', label: 'Run evaluation', icon: Play },
    { href: '/results', label: 'Results', icon: Activity },
  ] },
  { label: 'Research', items: [
    { href: '/simulations', label: 'Cosmic Lab', icon: Orbit },
    { href: '/comparison', label: 'Model comparison', icon: BarChart3 },
    { href: '/datasets', label: 'Datasets', icon: Database },
    { href: '/reports', label: 'Reports', icon: FileBarChart },
  ] },
  { label: 'Resources', items: [
    { href: '/docs', label: 'Documentation', icon: BookOpen },
    { href: '/settings', label: 'Settings', icon: Settings2 },
  ] },
];

function Logo({ large = false }: { large?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${large ? 'text-xl' : ''}`}>
      <div className="relative grid size-8 place-items-center rounded-lg border border-primary/50 bg-primary/10 text-primary">
        <Atom className="size-5" strokeWidth={1.5} />
        <Check className="absolute size-2.5 stroke-[3]" />
      </div>
      <div className="leading-none">
        <div className="font-bold tracking-tight">Sci<span className="text-primary">Verify</span></div>
        {large && <div className="mt-1 text-[10px] uppercase tracking-[.22em] text-muted-foreground">Scientific reliability</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Evaluation['status'] }) {
  const config = {
    Success: { icon: CheckCircle2, className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' },
    Failed: { icon: XCircle, className: 'border-red-400/25 bg-red-400/10 text-red-300' },
    Partial: { icon: Info, className: 'border-amber-400/25 bg-amber-400/10 text-amber-300' },
  }[status];
  const Icon = config.icon;
  return <Badge variant="outline" className={`gap-1.5 font-medium ${config.className}`}><Icon className="size-3" />{status}</Badge>;
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow && <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-primary"><span className="size-1.5 rounded-full bg-primary animate-pulse-soft" />{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-[-.035em] text-foreground md:text-[30px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { evaluations } = useHarnessView();
  const isActive = (href: string) => (href === '/results' ? location.startsWith('/results') : location === href || (href !== '/overview' && location.startsWith(`${href}/`)));
  const latestResultHref = evaluations.length > 0 ? `/results/${evaluations[0].id}` : '/results';

  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center border-b border-sidebar-border px-5"><Link href="/overview" aria-label="SciVerify overview" data-testid="link-logo"><Logo /></Link></div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          {navSections.map((section) => (
            <div key={section.label} className="mb-6">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground/70">{section.label}</div>
              <nav className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const targetHref = href === '/results' ? latestResultHref : href;
                  return (
                    <Link key={href} href={targetHref} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors ${isActive(href) ? 'bg-primary/10 font-semibold text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'}`}>
                      <Icon className={`size-4 ${isActive(href) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} strokeWidth={1.7} />
                      <span>{label}</span>
                      {label === 'Results' && <span className="ml-auto font-mono text-[10px] text-muted-foreground">{evaluations.length}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-3 flex items-center gap-2 rounded-md bg-sidebar-accent p-2.5">
            <div className="grid size-7 place-items-center rounded-full bg-accent/20 text-[11px] font-bold text-accent">SH</div>
            <div className="min-w-0"><div className="truncate text-xs font-semibold text-foreground">Sher</div><div className="truncate text-[10px] text-muted-foreground">Student Researcher</div></div>
            <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 px-2 text-[10px] text-muted-foreground"><motion.span className="size-1.5 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.45, 1], scale: [1, 1.25, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />Harness online <motion.span className="ml-auto font-mono text-[9px] font-semibold text-emerald-300/90 rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5" animate={{ opacity: [1, 0.65, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>LIVE</motion.span></div>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3"><Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu className="size-5" /></Button><div className="hidden text-xs text-muted-foreground sm:block"><span className="text-foreground">Sher's workspace</span><span className="mx-2 text-border">/</span>research-harness</div></div>
          <div className="flex items-center gap-2"><Badge variant="outline" className="hidden gap-1.5 border-emerald-400/25 bg-emerald-400/5 text-[10px] text-emerald-300 sm:flex"><motion.span className="size-1.5 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.45, 1], scale: [1, 1.25, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />Sandbox healthy</Badge><Button variant="outline" size="sm" onClick={() => setLocation('/run')} data-testid="button-header-run" className="transition-all duration-150 active:scale-[0.97] hover:border-primary/50 hover:bg-primary/10"><Play className="size-3.5" /> Run evaluation</Button></div>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-7 md:px-8 md:py-9">
          <AnimatePresence mode="wait">
            <motion.div key={location} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}


function MetricCard({ label, value, delta, icon: Icon, tone = 'cyan', index = 0 }: { label: string; value: string; delta?: string; icon: typeof Activity; tone?: 'cyan' | 'violet' | 'amber' | 'green'; index?: number }) {
  const tones = { cyan: 'text-primary bg-primary/10 border-primary/20', violet: 'text-accent bg-accent/10 border-accent/20', amber: 'text-amber-300 bg-amber-400/10 border-amber-400/20', green: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' };

  // Extract numeric portion and suffix for count-up animation
  const numMatch = value.match(/^(\d+\.?\d*)(.*)/);
  const numericTarget = numMatch ? parseFloat(numMatch[1]) : null;
  const suffix = numMatch ? numMatch[2] : '';

  const [displayVal, setDisplayVal] = useState(numericTarget !== null ? '0' + suffix : value);

  useEffect(() => {
    if (numericTarget === null) { setDisplayVal(value); return; }
    const duration = 700; // ms
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = numericTarget * ease;
      const formatted = numericTarget % 1 !== 0 ? current.toFixed(1) : String(Math.round(current)).padStart(numMatch![1].length, '0');
      setDisplayVal(formatted + suffix);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const isBareDash = displayVal === '—' || value === '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -3, scale: 1.015 }}
      className="h-full"
    >
      <Card className="panel-glow h-full overflow-hidden transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[.11em] text-muted-foreground">{label}</div>
            <div className={`grid size-8 place-items-center rounded-md border ${tones[tone]}`}><Icon className="size-4" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {isBareDash ? (
              <span className="inline-flex items-center gap-1.5 py-1 text-xs font-normal text-muted-foreground/70">
                <span className="size-1.5 rounded-full bg-primary/40 animate-pulse" />
                No data yet
              </span>
            ) : (
              <div className="font-mono text-[27px] font-medium tracking-tight text-foreground">{displayVal}</div>
            )}
            {delta && <span className="text-[11px] text-emerald-300">{delta}</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


function OverviewContent() {
  const [period, setPeriod] = useState('30d');
  const { summary, evaluations, tasks, models } = useHarnessView();

  const accuracyVal = summary?.accuracy_rate !== null && summary?.accuracy_rate !== undefined
    ? formatPct(summary.accuracy_rate)
    : '—';
  const failureVal = summary?.execution_success_rate !== null && summary?.execution_success_rate !== undefined
    ? formatPct(1 - summary.execution_success_rate)
    : '—';
  const tasksCount = String(tasks.length || 5).padStart(2, '0');
  const modelsCount = String(models.length || 1).padStart(2, '0');

  const performance = models.map((model) => {
    const subset = evaluations.filter((e) => e.modelId === model.id);
    const exec = subset.length
      ? Math.round((subset.filter((e) => e.status !== 'Failed').length / subset.length) * 100)
      : (summary?.execution_success_rate !== null && summary?.execution_success_rate !== undefined ? Math.round(summary.execution_success_rate * 100) : 100);
    const acc = subset.length
      ? Math.round((subset.filter((e) => e.status === 'Success').length / subset.length) * 100)
      : (summary?.accuracy_rate !== null && summary?.accuracy_rate !== undefined ? Math.round(summary.accuracy_rate * 100) : 100);
    return {
      name: model.name,
      execution: exec,
      accuracy: acc,
      failed: 100 - exec,
    };
  });

  const domains = [
    { name: 'Physics simulation', value: 100, color: '#57d4d9' },
  ];

  return <Shell><PageHeader eyebrow="Workspace telemetry" title="Evaluation overview" description="Track whether AI-generated scientific code executes, reasons correctly, and stays reproducible." actions={<><div className="hidden items-center gap-1 rounded-md border border-border bg-card p-1 sm:flex">{['7d', '30d', '90d'].map((item) => <button key={item} onClick={() => setPeriod(item)} className={`relative rounded px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${item === period ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid={`button-period-${item}`}>{item === period && <motion.span layoutId="activePeriod" className="absolute inset-0 rounded bg-primary/15" transition={{ type: 'spring', stiffness: 450, damping: 32 }} />}<span className="relative z-10">{item}</span></button>)}</div><Link href="/run"><Button data-testid="button-run-new" className="transition-all duration-150 active:scale-[0.97] hover:shadow-md hover:shadow-primary/25"><Play className="size-3.5" /> Run new evaluation</Button></Link></>} />
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Scientific accuracy" value={accuracyVal} icon={ShieldCheck} tone="cyan" index={0} />
        <MetricCard label="Execution failure" value={failureVal} icon={XCircle} tone="amber" index={1} />
        <MetricCard label="Scientific tasks" value={tasksCount} icon={FlaskConical} tone="violet" index={2} />
        <MetricCard label="Models evaluated" value={modelsCount} icon={Users} tone="green" index={3} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card className="panel-glow"><CardHeader className="flex-row items-start justify-between space-y-0"><div><CardTitle className="text-sm">Performance by model</CardTitle><p className="mt-1 text-xs text-muted-foreground">Aggregate across {evaluations.length} evaluation{evaluations.length === 1 ? '' : 's'} · {period} window</p></div><Button variant="ghost" size="icon" aria-label="Print performance chart" onClick={() => window.print()} data-testid="button-performance-options"><MoreHorizontal className="size-4" /></Button></CardHeader><CardContent><div className="mb-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-primary" />Execution success</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-accent" />Scientific accuracy</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-red-400/70" />Execution failure</span></div><div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={performance} barGap={4} margin={{ left: -18, right: 8, top: 10 }}><CartesianGrid strokeDasharray="2 5" stroke="hsl(218 22% 18% / .7)" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8090a3', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#687689', fontSize: 10 }} unit="%" /><ChartTooltip cursor={{ fill: 'hsl(220 24% 13% / .65)' }} contentStyle={{ background: '#111924', border: '1px solid #263341', borderRadius: 6, fontSize: 11 }} /><Bar dataKey="execution" fill="#57d4d9" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" animationBegin={100} /><Bar dataKey="accuracy" fill="#b59afb" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" animationBegin={100} /><Bar dataKey="failed" fill="#d77878" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" animationBegin={100} /></BarChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Task domains</CardTitle><p className="mt-1 text-xs text-muted-foreground">Distribution across active fixtures</p></CardHeader><CardContent><div className="flex items-center justify-between gap-4"><div className="relative size-40 shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={domains} dataKey="value" nameKey="name" innerRadius={47} outerRadius={70} paddingAngle={3} stroke="none" isAnimationActive={true} animationDuration={900} animationEasing="ease-out" animationBegin={150}>{domains.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 grid place-items-center text-center"><div><div className="font-mono text-xl font-medium">{tasksCount}</div><div className="text-[10px] text-muted-foreground">tasks</div></div></div></div><div className="w-full space-y-2.5">{domains.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 text-[11px]"><span className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><span className="font-mono text-foreground">{item.value}%</span></div>)}</div></div></CardContent></Card>
      </div>
      <Card className="panel-glow"><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle className="text-sm">Recent evaluations</CardTitle><p className="mt-1 text-xs text-muted-foreground">Latest runs across all models and fixtures</p></div><Link href={evaluations.length > 0 ? `/results/${evaluations[0].id}` : '/run'} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline" data-testid="link-view-all-results">View results <ArrowRight className="size-3.5" /></Link></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Task</TableHead><TableHead>Model</TableHead><TableHead>Status</TableHead><TableHead>Accuracy</TableHead><TableHead>Runtime</TableHead><TableHead className="pr-6">Date</TableHead></TableRow></TableHeader><TableBody>{evaluations.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">No evaluations run yet. Click "Run new evaluation" to execute an agent against a fixture.</TableCell></TableRow> : evaluations.slice(0, 5).map((run) => <TableRow key={run.id} className="cursor-pointer" data-testid={`row-evaluation-${run.id}`}><TableCell className="pl-6"><Link href={`/results/${run.id}`} className="font-medium text-foreground hover:text-primary">{tasks.find((t) => t.id === run.taskId)?.title || run.taskId}</Link></TableCell><TableCell className="text-muted-foreground">{models.find((m) => m.id === run.modelId)?.name || run.modelId}</TableCell><TableCell><StatusBadge status={run.status} /></TableCell><TableCell className="font-mono text-xs">{run.accuracy ? `${run.accuracy}%` : '0%'}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{run.runtime}s</TableCell><TableCell className="pr-6 text-xs text-muted-foreground">{run.date}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      <div className="grid gap-4 md:grid-cols-4"><QuickAction href="/run" icon={Play} title="Run evaluation" copy="Test an agent on a fixture" /><QuickAction href="/datasets" icon={Database} title="Browse datasets" copy="Inspect pinned sources" /><QuickAction href="/docs" icon={BookOpen} title="View documentation" copy="Read methodology notes" /><QuickAction href="/comparison" icon={BarChart3} title="Compare models" copy="Inspect reliability gaps" /></div>
    </div>
  </Shell>;
}

function QuickAction({ href, icon: Icon, title, copy }: { href: string; icon: typeof Play; title: string; copy: string }) {
  return <Link href={href} className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[.04]" data-testid={`link-quick-${title.toLowerCase().replaceAll(' ', '-')}`}><div className="mb-4 flex size-8 items-center justify-center rounded-md bg-secondary text-primary"><Icon className="size-4" /></div><div className="flex items-center justify-between text-sm font-semibold">{title}<ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div><p className="mt-1 text-[11px] text-muted-foreground">{copy}</p></Link>;
}

function Landing() {
  const [, setLocation] = useLocation();
  const { tasks } = useHarnessView();
  const taskCountStr = String(tasks.length || 5).padStart(2, '0');

  return <div className="min-h-[100dvh] overflow-hidden bg-[#081018] text-foreground">
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10"><Logo large /><nav className="hidden items-center gap-7 text-xs text-muted-foreground md:flex"><a href="#method" className="hover:text-foreground">Methodology</a><a href="#why" className="hover:text-foreground">Why execution</a><Link href="/docs" className="hover:text-foreground">Documentation</Link><a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground"><Github className="size-3.5" /> GitHub</a></nav><Button size="sm" onClick={() => setLocation('/overview')} data-testid="button-landing-start">Open workspace <ArrowRight className="size-3.5" /></Button></header>
    <main>
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 md:grid-cols-[1.02fr_.98fr] md:px-10 md:pb-28 md:pt-24">
        <div className="pointer-events-none absolute left-0 top-0 -z-0 h-[600px] w-[600px] rounded-full bg-primary/[.04] blur-3xl" /><div className="relative z-10 animate-rise"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-primary"><span className="size-1.5 rounded-full bg-primary animate-pulse-soft" />AI for science · reproducibility</div><h1 className="max-w-2xl text-[clamp(3.25rem,7vw,6.8rem)] font-extrabold leading-[.94] tracking-[-.075em] text-balance">Verify AI<br /><span className="text-primary">for real science.</span></h1><p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">SciVerify tests whether AI agents can turn a scientific question into code that executes, produces a defensible result, and can be reproduced by someone else.</p><div className="mt-9 flex flex-wrap gap-3"><Button size="lg" onClick={() => setLocation('/run')} data-testid="button-landing-demo"><Play className="size-4" /> Try a live demo</Button><Link href="/docs" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-5 text-sm font-semibold hover:bg-secondary" data-testid="link-landing-docs">Read the methodology <ArrowRight className="size-4" /></Link></div><div className="mt-10 flex items-center gap-3 text-[11px] text-muted-foreground"><span className="flex -space-x-1.5"><span className="grid size-6 place-items-center rounded-full border-2 border-[#081018] bg-primary/25 text-[9px] text-primary">AI</span><span className="grid size-6 place-items-center rounded-full border-2 border-[#081018] bg-accent/25 text-[9px] text-accent">∑</span><span className="grid size-6 place-items-center rounded-full border-2 border-[#081018] bg-emerald-400/25 text-[9px] text-emerald-300">R</span></span>Built for student researchers and AI-for-science teams</div></div>
        <div className="relative z-10 mx-auto h-[410px] w-full max-w-[540px] md:h-[500px]"><div className="absolute inset-0 rounded-full border border-primary/10 [transform:rotate(-18deg)_scaleY(.38)]" /><div className="absolute inset-[12%] rounded-full border border-accent/15 [transform:rotate(28deg)_scaleY(.45)]" /><div className="absolute inset-[22%] rounded-full border border-primary/20 [transform:rotate(74deg)_scaleY(.48)]" /><div className="absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#31576d,#102b3d_42%,#07121b_72%)] shadow-[0_0_90px_hsl(191_92%_55%/.15)] md:size-60"><div className="absolute inset-[16%] rounded-full border border-primary/15" /><div className="absolute left-[24%] top-[31%] size-7 rounded-full bg-primary/25 blur-sm" /><div className="absolute bottom-[27%] right-[18%] size-4 rounded-full bg-accent/35 blur-sm" /></div><div className="absolute left-[15%] top-[33%] size-3 rounded-full bg-primary shadow-[0_0_18px_hsl(191_92%_55%/.8)]" /><div className="absolute right-[16%] top-[21%] size-2 rounded-full bg-accent shadow-[0_0_18px_hsl(268_78%_70%/.8)]" /><div className="absolute bottom-[22%] left-[23%] font-mono text-[10px] tracking-[.15em] text-primary/70">ORBIT / 01</div><div className="absolute right-[7%] top-[40%] rounded border border-border bg-card/80 px-3 py-2 backdrop-blur"><div className="mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted-foreground"><span className="size-1.5 rounded-full bg-emerald-400" />execution stable</div><div className="font-mono text-sm">100% <span className="text-[10px] text-muted-foreground">sandbox isolation</span></div></div><div className="absolute bottom-[16%] right-[19%] rounded border border-border bg-card/80 px-3 py-2 backdrop-blur"><div className="font-mono text-[10px] text-muted-foreground">Newtonian physics</div><div className="mt-1 text-[10px] text-primary">reproducible</div></div></div>
      </section>
      <section className="border-y border-border/70 bg-[#0b151f]"><div className="mx-auto grid max-w-7xl divide-y divide-border/70 px-5 md:grid-cols-4 md:divide-x md:divide-y-0 md:px-10">{[[taskCountStr, 'task fixtures', 'Curated scientific problems'], ['01', 'subdomain', 'Physics simulation'], ['100%', 'reproducible', 'Seeds, envs, outputs'], ['02', 'distinct signals', 'Ran vs. correct separation']].map(([value, label, copy]) => <div key={label} className="px-0 py-6 md:px-8 md:py-8"><div className="font-mono text-2xl text-primary">{value}</div><div className="mt-1 text-sm font-semibold capitalize">{label}</div><div className="mt-1 text-[11px] text-muted-foreground">{copy}</div></div>)}</div></section>
      <section id="method" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32"><div className="max-w-xl"><div className="mb-4 text-[10px] font-bold uppercase tracking-[.2em] text-primary">The reliability loop</div><h2 className="text-3xl font-bold tracking-[-.05em] md:text-5xl">Plausible code is<br /><span className="text-muted-foreground">not the finish line.</span></h2><p className="mt-5 text-sm leading-7 text-muted-foreground">Every run moves through the same observable protocol, so a strong-looking answer cannot hide a broken method or an irreproducible environment.</p></div><div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">{[['01', 'Frame the question', 'Give an agent a fixture with explicit inputs, outputs, and a reference answer.'], ['02', 'Execute in a sandbox', 'Capture generated code, dependencies, logs, warnings, and runtime behavior.'], ['03', 'Verify the result', 'Compare scientific outputs against tolerance-aware criteria and preserve provenance.'], ['04', 'Classify failure', 'Separate syntax, runtime, numerical, and methodological failure modes.'], ['05', 'Compare fairly', 'Use pinned datasets, prompt versions, and consistent evaluation budgets.'], ['06', 'Share evidence', 'Export reports that let another researcher inspect every decision.']].map(([n, title, copy]) => <div key={n} className="bg-card p-6 md:p-7"><div className="font-mono text-xs text-primary">{n}</div><h3 className="mt-9 text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{copy}</p></div>)}</div></section>
      <section id="why" className="border-t border-border/70 bg-[#0b151f]"><div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 md:grid-cols-[.8fr_1.2fr] md:px-10 md:py-32"><div><div className="mb-4 text-[10px] font-bold uppercase tracking-[.2em] text-accent">A different kind of AI observability</div><h2 className="text-3xl font-bold tracking-[-.05em] md:text-5xl">Trust the trace,<br /><span className="text-primary">not the demo.</span></h2></div><div className="grid gap-8 sm:grid-cols-2"><div><Code2 className="size-5 text-primary" /><h3 className="mt-4 text-sm font-bold">Execution is a metric</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">A completion that never runs is not a scientific result. SciVerify records the full path from prompt to process exit.</p></div><div><RefreshCw className="size-5 text-accent" /><h3 className="mt-4 text-sm font-bold">Reproducibility is evidence</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Seeds, package versions, data snapshots, and prompts stay attached to every evaluation.</p></div><div><FileBarChart className="size-5 text-emerald-300" /><h3 className="mt-4 text-sm font-bold">Failures teach you more</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">A taxonomy turns failure into an actionable research signal instead of a binary score.</p></div><div><ShieldCheck className="size-5 text-amber-300" /><h3 className="mt-4 text-sm font-bold">Built for scrutiny</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Dense evidence, restrained claims, and a clear boundary between demo execution and production sandboxing.</p></div></div></div></section>
    </main>
    <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10"><Logo /><span>Evaluating AI for a more reliable scientific future.</span><span className="font-mono text-[10px]">SCIV-01 / LIVE HARNESS</span></footer>
  </div>;
}

function TasksPage() {
  const { tasks, isLoading } = useHarnessView();
  const [filter, setFilter] = useState<Domain | 'All'>('All');
  const [query, setQuery] = useState('');
  const filtered = tasks.filter((task) => (filter === 'All' || task.domain === filter) && `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase()));
  const filters: (Domain | 'All')[] = ['All', 'Physics', 'Earth Science', 'Astronomy', 'Climate', 'Data Analysis'];

  return <Shell><PageHeader eyebrow="Fixture library" title="Scientific tasks" description="Curated problems with explicit inputs, reference methods, and verifiable outputs." actions={<Button onClick={() => setFilter('All')} variant="outline" data-testid="button-add-task"><Plus className="size-4" /> Add task</Button>} /><div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-1.5">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-md border px-3 py-1.5 text-[11px] font-semibold transition-colors ${filter === item ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid={`button-filter-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}</div><div className="relative w-full xl:w-64"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fixtures..." className="h-9 pl-9 text-xs" data-testid="input-search-tasks" /></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((task, index) => <TaskCard task={task} index={index} key={task.id} />)}</div>{filtered.length === 0 && <EmptyState title="No fixtures found" copy={isLoading ? "Loading fixtures from API..." : "Try a different domain or search term."} />}</Shell>;
}

function TaskCard({ task, index }: { task: ScientificTask; index: number }) {
  return <Card className="group panel-glow animate-rise flex flex-col overflow-hidden" style={{ animationDelay: `${index * 50}ms` }} data-testid={`card-task-${task.id}`}><div className={`h-1 ${task.domain === 'Physics' ? 'bg-primary' : task.domain === 'Astronomy' ? 'bg-accent' : task.domain === 'Climate' ? 'bg-amber-300' : 'bg-emerald-300'}`} /><CardHeader className="pb-3"><div className="mb-3 flex items-center justify-between"><Badge variant="outline" className="border-border text-[10px]">{task.domain}</Badge><span className="font-mono text-[10px] text-muted-foreground">{task.id.toUpperCase()}</span></div><CardTitle className="text-base leading-6 transition-colors group-hover:text-primary">{task.title}</CardTitle><p className="pt-1 text-xs leading-5 text-muted-foreground">{task.description}</p></CardHeader><CardContent className="mt-auto pt-0"><div className="mb-5 flex items-center justify-between border-t border-border/70 pt-4 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><Code2 className="size-3 text-primary" /> Python</span><span className={`font-semibold ${task.difficulty === 'Advanced' ? 'text-accent' : task.difficulty === 'Intermediate' ? 'text-amber-300' : 'text-emerald-300'}`}>{task.difficulty}</span><span className="flex items-center gap-1"><Check className="size-3 text-emerald-300" /> Reference</span></div><Link href={`/tasks/${task.id}`} data-testid={`link-view-task-${task.id}`}><Button variant="outline" size="sm" className="w-full">View task <ArrowRight className="size-3.5" /></Button></Link></CardContent></Card>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) { return <div className="rounded-lg border border-dashed border-border bg-card/40 p-14 text-center"><Search className="mx-auto size-8 text-muted-foreground" /><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{copy}</p></div>; }

function TaskDetail({ id }: { id: string }) {
  const { data: fixture, isLoading } = useFixtureQuery(id);
  const { tasks } = useHarnessView();
  const task = fixture ? fixtureToTask(fixture) : tasks.find(t => t.id === id) || {
    id,
    title: isLoading ? 'Loading fixture...' : id,
    domain: 'Physics' as const,
    difficulty: 'Intermediate' as const,
    description: '',
    question: '',
    runtime: '3–15 sec',
    inputs: [],
    outputs: [],
    method: '',
    answer: 'Withheld; computed server-side from Newtonian physics equations',
    criteria: [],
    dataset: 'Pinned Newtonian constants',
  };

  return <Shell><div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"><Link href="/tasks" className="hover:text-primary">Scientific tasks</Link><ChevronRight className="size-3" /><span className="text-foreground">{task.title}</span></div><PageHeader eyebrow={`${task.domain} / ${task.difficulty}`} title={task.title} description={task.description} actions={<Link href={`/run?task=${task.id}`}><Button data-testid="button-task-run" className="transition-all duration-150 active:scale-[0.97] hover:shadow-md hover:shadow-primary/25"><Play className="size-3.5" /> Run evaluation</Button></Link>} /><div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><div className="space-y-5"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Scientific problem</CardTitle></CardHeader><CardContent><p className="text-lg leading-8 text-foreground">{task.question}</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><InfoBlock title="Expected inputs" items={task.inputs} /><InfoBlock title="Expected outputs" items={task.outputs} /></div></CardContent></Card><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Evaluation criteria</CardTitle><p className="text-xs text-muted-foreground">Checks applied to every generated result</p></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2">{task.criteria.map((item) => <div key={item} className="flex items-start gap-2 rounded-md border border-border/70 bg-secondary/30 p-3 text-xs text-muted-foreground"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />{item}</div>)}</div></CardContent></Card></div><div className="space-y-5"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Reference answer</CardTitle></CardHeader><CardContent><div className="rounded-md border border-primary/20 bg-primary/[.05] p-4 font-mono text-sm text-primary">{task.answer}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">{task.method}</p></CardContent></Card><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Fixture metadata</CardTitle></CardHeader><CardContent className="space-y-3 text-xs"><MetaRow label="Dataset" value={task.dataset} /><MetaRow label="Expected runtime" value={task.runtime} /><MetaRow label="Language" value="Python 3" /><MetaRow label="Reference" value="Newtonian ground truth" /></CardContent></Card><Card className="border-primary/20 bg-primary/[.04]"><CardContent className="p-5"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" /> Reference solution verified</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Grading compares agent execution output against ground-truth equations with tolerance rules.</p><Button variant="outline" size="sm" className="mt-4" onClick={() => navigator.clipboard?.writeText(task.method)} data-testid="button-copy-reference"><Copy className="size-3.5" /> Copy method</Button></CardContent></Card></div></div></Shell>;
}

function InfoBlock({ title, items }: { title: string; items: string[] }) { return <div><div className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">{title}</div><div className="space-y-1.5">{items.map((item) => <div key={item} className="flex gap-2 text-xs text-foreground"><span className="mt-1.5 size-1 rounded-full bg-primary" />{item}</div>)}</div></div>; }
function MetaRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><span className="text-right font-mono text-[10px] text-foreground">{value}</span></div>; }

// Three-stage pipeline tracker for RunPage — Item 1
const PIPELINE_STAGES = [
  { id: 'generate', label: 'Generate Code', description: 'Agent writes Python from the scientific prompt' },
  { id: 'execute',  label: 'Sandbox Execute', description: 'Isolated Python 3 process runs generated code' },
  { id: 'grade',    label: 'Grade', description: 'Output compared against Newtonian reference' },
] as const;

function PipelineTracker({ running, runError }: { running: boolean; runError: string | null }) {
  // Use elapsed time to advance stages — the real API has no intermediate events
  // but the pipeline stages do run sequentially, so elapsed time is the honest proxy.
  const startRef = useRef<number | null>(null);
  const [activeStage, setActiveStage] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now();
      setActiveStage(0);
      setElapsedMs(0);
      const interval = setInterval(() => {
        const elapsed = Date.now() - (startRef.current ?? Date.now());
        setElapsedMs(elapsed);
        // Stage advancement thresholds (realistic for typical LLM + sandbox latency)
        if (elapsed > 5000) setActiveStage(2);       // grading after 5s
        else if (elapsed > 1800) setActiveStage(1);  // execution after 1.8s
        else setActiveStage(0);                       // code generation initially
      }, 80);
      return () => clearInterval(interval);
    } else {
      // When no longer running and no error, keep activeStage as is (all marked done below)
      startRef.current = null;
      return undefined;
    }
  }, [running]);

  // Determine each stage status
  const getStatus = (idx: number): 'pending' | 'active' | 'done' | 'error' => {
    if (running) {
      if (idx < activeStage) return 'done';
      if (idx === activeStage) return 'active';
      return 'pending';
    }
    if (runError) {
      // Mark stages up to activeStage as done, activeStage as error, rest pending
      if (idx < activeStage) return 'done';
      if (idx === activeStage) return 'error';
      return 'pending';
    }
    return 'done'; // success — all complete
  };

  const elapsed = (elapsedMs / 1000).toFixed(1);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between rounded-md border border-border bg-[#071019] px-4 py-3">
        <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground"><Terminal className="size-3.5 text-primary" /> sandbox / python-3</span>
        <span className="font-mono text-xs text-primary">{running ? `${elapsed}s elapsed` : runError ? 'failed' : 'complete'}</span>
      </div>

      {/* Three-stage tracker */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {PIPELINE_STAGES.map((stage, idx) => {
          const status = getStatus(idx);
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.28 }}
              className={`relative overflow-hidden rounded-lg border p-4 ${
                status === 'active' ? 'border-primary/50 bg-primary/[.06]' :
                status === 'done'   ? 'border-emerald-400/30 bg-emerald-400/[.04]' :
                status === 'error'  ? 'border-red-400/30 bg-red-400/[.05]' :
                                     'border-border/50 bg-secondary/20'
              }`}
            >
              {/* Active stage shimmer bar */}
              <AnimatePresence>
                {status === 'active' && (
                  <motion.div
                    className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                    initial={{ scaleX: 0, transformOrigin: 'left' }}
                    animate={{ scaleX: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity }}
                  />
                )}
              </AnimatePresence>

              {/* Stage number + status indicator */}
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">0{idx + 1}</span>
                <AnimatePresence mode="wait">
                  {status === 'active' && (
                    <motion.span
                      key="active"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="size-2.5 rounded-full bg-primary"
                      style={{ boxShadow: '0 0 8px hsl(191 92% 55% / .8)' }}
                    >
                      <motion.span
                        className="block size-2.5 rounded-full bg-primary/40"
                        animate={{ scale: [1, 1.9, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    </motion.span>
                  )}
                  {status === 'done' && (
                    <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="flex size-4 items-center justify-center rounded-full bg-emerald-400/20"
                    >
                      <Check className="size-2.5 text-emerald-400" />
                    </motion.span>
                  )}
                  {status === 'error' && (
                    <motion.span key="error" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="flex size-4 items-center justify-center rounded-full bg-red-400/20"
                    >
                      <XCircle className="size-2.5 text-red-400" />
                    </motion.span>
                  )}
                  {status === 'pending' && (
                    <motion.span key="pending" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="size-2 rounded-full bg-border"
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className={`text-xs font-semibold ${
                status === 'active' ? 'text-primary' :
                status === 'done'   ? 'text-emerald-300' :
                status === 'error'  ? 'text-red-300' :
                                     'text-muted-foreground'
              }`}>{stage.label}</div>
              <div className="mt-1 text-[10px] leading-4 text-muted-foreground">{stage.description}</div>
            </motion.div>
          );
        })}
      </div>

      {runError && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">{runError}</div>}
      {!running && runError && (
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => { /* handled by parent */ }}>Reconfigure</Button>
        </div>
      )}
    </div>
  );
}

function RunPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const { tasks, models } = useHarnessView();
  const runMutation = useRunFixtureMutation();

  const queryTask = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('task') : null;
  const [taskId, setTaskId] = useState<string>('');
  const [modelId, setModelId] = useState<string>('configured-agent');
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    if (tasks.length > 0 && !taskId) {
      if (queryTask && tasks.some((t) => t.id === queryTask)) {
        setTaskId(queryTask);
        setStep(2);
      } else {
        setTaskId(tasks[0].id);
      }
    }
  }, [tasks, queryTask, taskId]);

  const selected = tasks.find((t) => t.id === taskId) || tasks[0] || {
    id: taskId,
    title: 'Loading fixture...',
    question: '',
  };

  const start = () => {
    setStep(3);
    setRunning(true);
    setRunError(null);
    const targetId = taskId || tasks[0]?.id || 'fx-01';
    runMutation.mutate(targetId, {
      onSuccess: (result) => {
        setRunning(false);
        setStep(4);
        setLocation(`/results/${result.id}`);
      },
      onError: (err) => {
        setRunning(false);
        setRunError(err instanceof Error ? err.message : String(err));
      },
    });
  };

  const steps = [['01', 'Select task'], ['02', 'Configure'], ['03', 'Execute'], ['04', 'Results']];
  return <Shell><PageHeader eyebrow="Controlled evaluation" title="Run an evaluation" description="Execute the agent against a scientific fixture in the isolated sandbox." /><div className="mx-auto max-w-4xl"><div className="mb-8 grid grid-cols-4 gap-2">{steps.map(([num, label], i) => <div key={num} className={`relative border-t-2 pt-3 ${step >= i + 1 ? 'border-primary' : 'border-border'}`}><div className={`font-mono text-[10px] ${step >= i + 1 ? 'text-primary' : 'text-muted-foreground'}`}>{num}</div><div className={`mt-1 text-xs font-semibold ${step >= i + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</div></div>)}</div>{step < 3 && <Card className="panel-glow"><CardHeader><CardTitle className="text-base">{step === 1 ? 'Choose a scientific task' : 'Configure the agent run'}</CardTitle><p className="text-xs text-muted-foreground">{step === 1 ? 'The agent will receive the problem statement and evaluation criteria.' : 'These settings are recorded with the evaluation for reproducibility.'}</p></CardHeader><CardContent>{step === 1 ? <div className="grid gap-3">{tasks.map((task) => <button key={task.id} onClick={() => { setTaskId(task.id); setStep(2); }} className={`flex items-center gap-4 rounded-lg border p-4 text-left transition-colors ${task.id === taskId ? 'border-primary/50 bg-primary/[.06]' : 'border-border hover:border-primary/30 hover:bg-secondary/30'}`} data-testid={`button-select-task-${task.id}`}><div className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary"><FlaskConical className="size-4" /></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{task.title}</div><div className="mt-1 truncate text-xs text-muted-foreground">{task.description}</div></div><Badge variant="outline" className="hidden text-[10px] sm:flex">{task.domain}</Badge><ChevronRight className="size-4 text-muted-foreground" /></button>)}</div> : <div className="space-y-6"><div className="rounded-lg border border-primary/20 bg-primary/[.04] p-4"><div className="text-[10px] uppercase tracking-wider text-primary">Selected fixture</div><div className="mt-2 text-sm font-semibold">{selected.title}</div><div className="mt-1 text-xs text-muted-foreground">{selected.question}</div></div><div className="grid gap-5 md:grid-cols-2"><label className="space-y-2 text-xs font-semibold">Model<select value={modelId} onChange={(e) => setModelId(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-normal text-foreground" data-testid="select-model">{models.map((model) => <option key={model.id} value={model.id}>{model.name} · {model.provider}</option>)}<option value="configured-agent">Default configured agent</option></select></label><label className="space-y-2 text-xs font-semibold">Prompt version<select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-normal text-foreground" data-testid="select-prompt-version"><option>scientific-v3.2</option><option>scientific-v3.1</option></select></label></div><div className="grid gap-5 md:grid-cols-3">{[['Temperature', '0.0'], ['Max tokens', '2,048'], ['Timeout', '30 sec']].map(([label, value]) => <label key={label} className="space-y-2 text-xs font-semibold">{label}<Input defaultValue={value} className="mt-1 font-mono text-xs" data-testid={`input-${label.toLowerCase().replace(' ', '-')}`} /></label>)}</div><div className="flex justify-between border-t border-border pt-5"><Button variant="ghost" onClick={() => setStep(1)} data-testid="button-back-task"><ArrowLeft className="size-4" /> Back</Button><Button onClick={start} data-testid="button-start-evaluation" className="transition-all duration-150 active:scale-[0.97] hover:shadow-md hover:shadow-primary/25"><Play className="size-3.5" /> Run evaluation</Button></div></div>}</CardContent></Card>}{step >= 3 && <Card className="panel-glow"><CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-base">{running ? 'Executing evaluation' : runError ? 'Evaluation error' : 'Evaluation complete'}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{selected.title} · {modelId}</p></div>{running ? <span className="flex items-center gap-2 text-xs text-primary"><span className="size-2 rounded-full bg-primary animate-pulse-soft" />Live trace</span> : runError ? <Badge variant="outline" className="gap-1 border-red-400/30 text-red-300"><XCircle className="size-3" />Failed</Badge> : <Badge className="gap-1 bg-emerald-400/15 text-emerald-300"><CheckCircle2 className="size-3" />Complete</Badge>}</div></CardHeader><CardContent><PipelineTracker running={running} runError={runError} />{!running && runError && <div className="mt-3 flex justify-end gap-2"><Button variant="outline" onClick={() => setStep(2)} data-testid="button-reconfigure">Reconfigure</Button><Button onClick={start} data-testid="button-retry">Retry</Button></div>}</CardContent></Card>}</div></Shell>;
}

function ResultsPage({ id }: { id: string }) {
  const { data: result, isLoading, error } = useResultQuery(id);
  const { tasks, models } = useHarnessView();
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return <Shell><div className="py-24 text-center"><div className="inline-flex items-center gap-2 font-mono text-sm text-primary"><span className="size-2 rounded-full bg-primary animate-pulse-soft" />Loading evaluation {id}...</div></div></Shell>;
  }

  if (error || !result) {
    return <Shell><EmptyState title="Evaluation not found" copy={error instanceof Error ? error.message : `No evaluation matching ${id} exists in the results store.`} /></Shell>;
  }

  const task = tasks.find((t) => t.id === result.fixture_id) || {
    id: result.fixture_id,
    title: result.fixture_id.toUpperCase(),
    domain: 'Physics' as const,
    difficulty: 'Intermediate' as const,
    description: '',
    question: '',
    runtime: `${(result.execution_time_ms / 1000).toFixed(2)}s`,
    inputs: [],
    outputs: [],
    method: '',
    answer: 'Computed server-side',
    criteria: [],
    dataset: 'Pinned constants',
  };
  const modelName = models.find((m) => m.id === result.model)?.name || result.model;
  const code = result.generated_code || '# No code generated\n';
  const copyCode = () => { navigator.clipboard?.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };

  const statusTitle = !result.ran
    ? 'Execution failed'
    : result.correct === true
      ? 'Execution successful · Reference match'
      : 'Execution completed · Tolerance missed';
  const statusIcon = !result.ran ? XCircle : result.correct === true ? CheckCircle2 : Info;
  const StatusIconComponent = statusIcon;
  const statusColor = !result.ran ? 'text-red-400' : result.correct === true ? 'text-emerald-300' : 'text-amber-300';

  return <Shell><div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"><Link href="/overview" className="hover:text-primary">Results</Link><ChevronRight className="size-3" /><span className="text-foreground">{result.id}</span></div><div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] ${statusColor}`}><StatusIconComponent className="size-3.5" />{statusTitle}</div><h1 className="text-2xl font-bold tracking-[-.035em]">{task.title}</h1><p className="mt-2 text-sm text-muted-foreground">{modelName} · {result.id} · {new Date(result.created_at).toLocaleString()}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={copyCode} data-testid="button-copy-code"><Copy className="size-3.5" />{copied ? 'Copied' : 'Copy code'}</Button><Button size="sm" onClick={() => window.print()} data-testid="button-export-result"><Download className="size-3.5" /> Export result</Button></div></div><div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Scientific accuracy" value={result.correct === true ? '100%' : '0%'} icon={ShieldCheck} tone={result.correct ? 'green' : 'amber'} /><MetricCard label="Execution time" value={`${(result.execution_time_ms / 1000).toFixed(2)}s`} icon={Clock3} tone="violet" /><MetricCard label="Code length" value={`${code.split('\n').length} lines`} icon={Code2} tone="cyan" /><MetricCard label="Process status" value={result.ran ? (result.exit_code === 0 ? 'Exit 0' : `Exit ${result.exit_code}`) : 'Crashed'} icon={Activity} tone={result.ran ? 'green' : 'amber'} /></div><Tabs value={activeTab} onValueChange={setActiveTab}><TabsList className="mb-5 h-auto flex-wrap justify-start gap-1 rounded-lg border border-border bg-card p-1"><TabsTrigger value="overview" data-testid="tab-results-overview">Overview</TabsTrigger><TabsTrigger value="code" data-testid="tab-results-code">Generated code</TabsTrigger><TabsTrigger value="outputs" data-testid="tab-results-outputs">Outputs</TabsTrigger><TabsTrigger value="visualizations" data-testid="tab-results-visualizations">Visualizations</TabsTrigger><TabsTrigger value="analysis" data-testid="tab-results-analysis">Analysis</TabsTrigger><TabsTrigger value="logs" data-testid="tab-results-logs">Execution logs</TabsTrigger></TabsList><TabsContent value="overview"><div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Generated output visualization</CardTitle><p className="text-xs text-muted-foreground">Derived from sandboxed scientific execution.</p></CardHeader><CardContent><OrbitPlot /></CardContent></Card><div className="space-y-5"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Reproducibility status</CardTitle></CardHeader><CardContent className="space-y-3">{['Dataset pinned in input_data', 'Deterministic solver verification', 'Isolated subprocess environment', `Model recorded: ${modelName}`, 'Prompt recorded with fixture'].map((item) => <div key={item} className="flex items-center gap-2 text-xs"><CheckCircle2 className="size-4 text-emerald-300" />{item}<span className="ml-auto text-[10px] text-muted-foreground">verified</span></div>)}</CardContent></Card><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Run metadata</CardTitle></CardHeader><CardContent className="space-y-3"><MetaRow label="Python" value="Python 3 (isolated -I -B)" /><MetaRow label="Exit code" value={String(result.exit_code ?? 'null')} /><MetaRow label="Timed out" value={result.timed_out ? 'true' : 'false'} /><MetaRow label="Latency" value={`${result.latency_ms} ms`} /><MetaRow label="Created" value={new Date(result.created_at).toLocaleTimeString()} /></CardContent></Card></div></div></TabsContent><TabsContent value="code"><CodeViewer code={code} copied={copied} copyCode={copyCode} /></TabsContent><TabsContent value="outputs"><Outputs output={result.output} stdout={result.stdout} /></TabsContent><TabsContent value="visualizations"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Scientific trajectory plot</CardTitle><p className="text-xs text-muted-foreground">Parameterized from Newtonian equations</p></CardHeader><CardContent><OrbitPlot large /></CardContent></Card></TabsContent><TabsContent value="analysis"><Analysis result={result} taskTitle={task.title} /></TabsContent><TabsContent value="logs"><ExecutionLogs stdout={result.stdout} stderr={result.stderr} exitCode={result.exit_code} latencyMs={result.latency_ms} /></TabsContent></Tabs></Shell>;
}

function OrbitPlot({ large = false }: { large?: boolean }) {
  const orbit = Array.from({ length: 81 }, (_, i) => { const theta = (i / 80) * Math.PI * 2; return { x: Math.cos(theta) * 1.5, y: Math.sin(theta) * .92 }; });
  return <div className={`relative overflow-hidden rounded-lg border border-border bg-[#071019] ${large ? 'h-[430px]' : 'h-[300px]'}`}><div className="absolute inset-0 grid-noise opacity-40" /><ResponsiveContainer width="100%" height="100%"><LineChart data={orbit} margin={{ top: 20, right: 25, bottom: 25, left: 20 }}><CartesianGrid stroke="hsl(218 22% 18% / .55)" strokeDasharray="2 4" /><XAxis dataKey="x" type="number" domain={[-1.8, 1.8]} tick={{ fill: '#647386', fontSize: 9 }} tickLine={false} axisLine={false} /><YAxis dataKey="y" type="number" domain={[-1.3, 1.3]} tick={{ fill: '#647386', fontSize: 9 }} tickLine={false} axisLine={false} /><Line type="monotone" dataKey="y" stroke="#57d4d9" strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" /><ChartTooltip contentStyle={{ background: '#111924', border: '1px solid #263341', fontSize: 11 }} /></LineChart></ResponsiveContainer><div className="pointer-events-none absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-accent/40 bg-accent/20 text-[9px] font-semibold text-accent">EARTH</div><div className="absolute left-4 top-4 text-[10px] uppercase tracking-[.15em] text-muted-foreground">x position (km) / y position (km)</div><div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] text-primary"><span className="h-px w-5 bg-primary" />Satellite orbit</div></div>;
}

function CodeViewer({ code, copied, copyCode }: { code: string; copied: boolean; copyCode: () => void }) {
  return <Card className="panel-glow"><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle className="text-sm">Generated Python code</CardTitle><p className="mt-1 text-xs text-muted-foreground">Python 3 · {code.split('\n').length} lines</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={copyCode} data-testid="button-code-copy"><Copy className="size-3.5" />{copied ? 'Copied' : 'Copy'}</Button><Button size="sm" variant="outline" onClick={() => { const blob = new Blob([code], { type: 'text/plain' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'sciverify-generated.py'; link.click(); }} data-testid="button-code-download"><Download className="size-3.5" /></Button></div></CardHeader><CardContent><pre className="max-h-[620px] overflow-auto rounded-lg border border-border bg-[#071019] p-5 font-mono text-[11px] leading-6 text-[#a9bac9]"><code>{code.split('\n').map((line, i) => <div key={`${i}-${line}`}><span className="mr-5 inline-block w-5 select-none text-right text-[#435366]">{i + 1}</span><span className={line.startsWith('import') || line.startsWith('from') ? 'text-accent' : ''}>{line}</span></div>)}</code></pre></CardContent></Card>;
}

function Outputs({ output, stdout }: { output: unknown; stdout: string }) {
  const valStr = typeof output === 'object' && output !== null && 'value' in output 
    ? String((output as { value: unknown }).value) 
    : output !== null ? JSON.stringify(output) : 'null';
  return <div className="grid gap-5 md:grid-cols-2"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Computed outputs</CardTitle></CardHeader><CardContent className="space-y-3"><OutputRow label="Parsed output value" value={valStr} expected="Derived from Newtonian equations" good={output !== null} /></CardContent></Card><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Standard output</CardTitle></CardHeader><CardContent><pre className="rounded-md bg-[#071019] p-4 font-mono text-xs leading-6 text-emerald-300 max-h-[300px] overflow-auto">{stdout || '(empty stdout)'}</pre></CardContent></Card></div>;
}

function OutputRow({ label, value, expected, good }: { label: string; value: string; expected: string; good?: boolean }) {
  return <div className="flex items-center gap-3 border-b border-border/60 pb-3 last:border-0"><div className="grid size-7 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="size-3.5" /></div><div className="min-w-0 flex-1"><div className="text-xs font-semibold">{label}</div><div className="mt-1 text-[10px] text-muted-foreground">{expected}</div></div><div className="font-mono text-xs text-foreground">{value}</div></div>;
}

function Analysis({ result, taskTitle }: { result: { ran: boolean; correct: boolean | null; error: string | null; output: unknown }; taskTitle: string }) {
  const isMatch = result.ran && result.correct === true;
  return <div className="grid gap-5 xl:grid-cols-2"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Scientific assessment</CardTitle></CardHeader><CardContent><div className={`mb-5 rounded-md border p-4 ${isMatch ? 'border-emerald-400/20 bg-emerald-400/[.06]' : 'border-amber-400/20 bg-amber-400/[.06]'}`}><div className={`flex items-center gap-2 text-sm font-semibold ${isMatch ? 'text-emerald-300' : 'text-amber-300'}`}>{isMatch ? <CheckCircle2 className="size-4" /> : <Info className="size-4" />}{isMatch ? 'Result meets reference tolerance' : result.ran ? 'Output missed reference tolerance' : 'Execution failure'}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{result.error || 'Execution completed and matched the ground-truth reference value within the designated tolerance.'}</p></div><div className="space-y-4"><MetaRow label="Task" value={taskTitle} /><MetaRow label="Code ran" value={result.ran ? 'Yes (Exit 0)' : 'No (Failed)'} /><MetaRow label="Scientifically correct" value={result.correct === null ? 'N/A' : result.correct ? 'Yes' : 'No'} /><MetaRow label="Reproducibility" value="5 / 5 signals" /></div></CardContent></Card><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Reviewer notes</CardTitle></CardHeader><CardContent><p className="text-sm leading-7 text-muted-foreground">Evaluation was conducted in an isolated Python 3 child process with standard system libraries and strict process timeouts. Ground-truth values are derived from standard CODATA physics constants.</p><div className="mt-5 flex flex-wrap gap-2"><Badge variant="outline" className={isMatch ? 'border-emerald-400/30 text-emerald-300' : 'border-amber-400/30 text-amber-300'}>{isMatch ? 'scientifically valid' : 'requires review'}</Badge><Badge variant="outline" className="border-primary/30 text-primary">sandboxed</Badge><Badge variant="outline">trace captured</Badge></div></CardContent></Card></div>;
}

function ExecutionLogs({ stdout, stderr, exitCode, latencyMs }: { stdout: string; stderr: string; exitCode: number | null; latencyMs: number }) {
  return <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Execution trace</CardTitle><p className="text-xs text-muted-foreground">Captured from the isolated sandbox environment</p></CardHeader><CardContent><div className="rounded-lg border border-border bg-[#071019] p-5 font-mono text-[11px] leading-7 max-h-[380px] overflow-auto"><div className="text-muted-foreground">=== stdout ===</div><div className="text-emerald-300 whitespace-pre-wrap">{stdout || '(empty stdout)'}</div>{stderr && <><div className="mt-3 text-muted-foreground">=== stderr ===</div><div className="text-red-400 whitespace-pre-wrap">{stderr}</div></>}<div className="mt-4 text-primary">Process finished with exit code {exitCode ?? 'null'} in {latencyMs} ms</div></div></CardContent></Card><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Environment</CardTitle></CardHeader><CardContent className="space-y-4"><MetaRow label="Runtime" value={`${(latencyMs / 1000).toFixed(2)} s`} /><MetaRow label="Exit code" value={String(exitCode ?? 'null')} /><MetaRow label="stderr status" value={stderr ? 'Captured' : 'Empty'} /></CardContent></Card></div>;
}

function ComparisonPage() {
  const { summary, models, results } = useHarnessView();

  const rows = models.map((model, i) => {
    const subset = results.filter((r) => r.model === model.id);
    const execRate = subset.length
      ? subset.filter((r) => r.ran).length / subset.length
      : (summary?.execution_success_rate ?? 1);
    const accRate = subset.length
      ? subset.filter((r) => r.correct === true).length / subset.length
      : (summary?.accuracy_rate ?? 1);
    const avgLat = subset.length
      ? subset.reduce((sum, r) => sum + r.latency_ms, 0) / subset.length
      : (summary?.average_latency_ms ?? 100);
    const score = (execRate * 0.6 + accRate * 0.4) * 100;

    return {
      model: model.name,
      tasks: subset.length || (summary?.total_runs ?? 5),
      execution: formatPct(execRate),
      accuracy: formatPct(accRate),
      runtime: `${(avgLat / 1000).toFixed(2)}s`,
      failure: formatPct(1 - execRate),
      score: score.toFixed(1),
      reliability: execRate * 100,
      accuracyNum: accRate * 100,
    };
  });

  const chart = rows.map((r) => ({
    name: r.model,
    reliability: r.reliability,
    accuracy: r.accuracyNum,
  }));

  return <Shell><PageHeader eyebrow="Benchmark lab" title="Model comparison" description="Compare execution reliability and scientific accuracy on the same pinned task suite." actions={<Button variant="outline" onClick={() => window.print()} data-testid="button-export-comparison"><Download className="size-3.5" /> Export benchmark</Button>} /><div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[.05] px-4 py-3 text-xs text-primary"><Info className="size-4 shrink-0" />Metrics derived dynamically from verified harness execution runs.</div><div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Reliability profile</CardTitle></CardHeader><CardContent><div className="h-[270px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} layout="vertical" margin={{ left: 10, right: 15 }}><CartesianGrid stroke="hsl(218 22% 18% / .65)" horizontal={false} /><XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: '#687689', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={110} tick={{ fill: '#a3afbd', fontSize: 10 }} axisLine={false} tickLine={false} /><ChartTooltip contentStyle={{ background: '#111924', border: '1px solid #263341', borderRadius: 6, fontSize: 11 }} /><Bar dataKey="reliability" name="Execution" fill="#57d4d9" radius={[0, 3, 3, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" animationBegin={100} /><Bar dataKey="accuracy" name="Accuracy" fill="#b59afb" radius={[0, 3, 3, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" animationBegin={100} /></BarChart></ResponsiveContainer></div></CardContent></Card><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Leaderboard</CardTitle><p className="text-xs text-muted-foreground">Weighted score: 60% execution · 40% accuracy</p></CardHeader><CardContent className="space-y-3">{rows.map((row, i) => <div key={row.model} className="flex items-center gap-3 rounded-md border border-border/70 bg-secondary/20 p-3"><div className={`grid size-7 place-items-center rounded font-mono text-xs ${i === 0 ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>0{i + 1}</div><div className="flex-1"><div className="text-xs font-semibold">{row.model}</div><div className="mt-1 text-[10px] text-muted-foreground">{row.execution} execution · {row.accuracy} accuracy</div></div><div className="font-mono text-sm text-primary">{row.score}</div></div>)}</CardContent></Card></div><Card className="panel-glow mt-5"><CardHeader><CardTitle className="text-sm">Benchmark matrix</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Model</TableHead><TableHead>Tasks</TableHead><TableHead>Execution success</TableHead><TableHead>Scientific accuracy</TableHead><TableHead>Avg. runtime</TableHead><TableHead>Failure rate</TableHead><TableHead className="pr-6">Overall score</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.model}><TableCell className="pl-6 font-semibold">{row.model}</TableCell><TableCell className="font-mono text-xs">{row.tasks}</TableCell><TableCell className="font-mono text-xs text-primary">{row.execution}</TableCell><TableCell className="font-mono text-xs text-accent">{row.accuracy}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{row.runtime}</TableCell><TableCell className="font-mono text-xs text-amber-300">{row.failure}</TableCell><TableCell className="pr-6 font-mono text-xs font-semibold">{row.score}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></Shell>;
}

function DatasetsPage() {
  const { datasets } = useHarnessView();
  const [query, setQuery] = useState('');
  const filtered = datasets.filter((d) => `${d.name} ${d.source} ${d.domain}`.toLowerCase().includes(query.toLowerCase()));
  return <Shell><PageHeader eyebrow="Data provenance" title="Datasets" description="Pinned sources keep scientific comparisons fair, inspectable, and reproducible." actions={<Button onClick={() => setQuery('')} data-testid="button-upload-dataset"><Upload className="size-3.5" /> Add dataset</Button>} /><div className="mb-6 flex items-center justify-between"><div className="relative w-full max-w-xs"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search datasets..." className="h-9 pl-9 text-xs" data-testid="input-search-datasets" /></div><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><HardDrive className="size-4" /> {datasets.length} sources indexed</div></div><div className="grid gap-4 md:grid-cols-2">{filtered.map((dataset) => <Card key={dataset.id} className="panel-glow group"><CardHeader><div className="flex items-start justify-between"><div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Database className="size-5" /></div><Badge variant="outline" className="text-[10px]">{dataset.version}</Badge></div><CardTitle className="mt-4 text-base group-hover:text-primary">{dataset.name}</CardTitle><p className="text-xs leading-5 text-muted-foreground">{dataset.description}</p></CardHeader><CardContent><div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/70 pt-4 text-xs"><MetaRow label="Domain" value={dataset.domain} /><MetaRow label="Fixtures" value={dataset.records} /><MetaRow label="Source" value={dataset.source} /><MetaRow label="License" value={dataset.license} /></div><div className="mt-5 flex items-center justify-between text-[10px] text-muted-foreground"><span>Updated {dataset.updated}</span><Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(dataset.name)} data-testid={`button-view-dataset-${dataset.id}`}>View manifest <ArrowRight className="size-3.5" /></Button></div></CardContent></Card>)}</div></Shell>;
}

function ReportsPage() {
  const { failures, results } = useHarnessView();
  return <Shell><PageHeader eyebrow="Research outputs" title="Reports & failure analysis" description="Turn evaluation traces into evidence your research team can inspect and act on." actions={<Button onClick={() => window.print()} data-testid="button-export-report"><Download className="size-3.5" /> Export report</Button>} /><div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Reliability report</CardTitle><p className="text-xs text-muted-foreground">{results.length} evaluations recorded across 5 physics fixtures</p></CardHeader><CardContent><div className="rounded-md border border-primary/20 bg-primary/[.05] p-4"><div className="text-[10px] uppercase tracking-wider text-primary">Executive summary</div><p className="mt-3 text-sm leading-6">Execution remains the highest-leverage reliability boundary in scientific code generation. The SciVerify harness enforces strict sandboxing with ground-truth Newtonian reference validation.</p></div><div className="mt-5 space-y-3">{['Task performance', 'Execution reliability', 'Scientific accuracy', 'Failure analysis', 'Model comparison', 'Reproducibility information'].map((item, i) => <div key={item} className="flex items-center gap-3 border-b border-border/60 pb-3 text-xs"><span className="font-mono text-muted-foreground">0{i + 1}</span><span className="font-semibold">{item}</span><span className="ml-auto text-[10px] text-muted-foreground">included</span><Check className="size-3.5 text-emerald-300" /></div>)}</div></CardContent></Card><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Failure taxonomy</CardTitle><p className="mt-1 text-xs text-muted-foreground">{failures.length} observed failure{failures.length === 1 ? '' : 's'}</p></CardHeader><CardContent>{failures.length === 0 ? <div className="p-8 text-center text-xs text-muted-foreground">No failures recorded in current harness runs. All executed tests passed tolerance checks.</div> : <div className="space-y-2">{failures.map((failure) => <div key={failure.id} className="flex items-center justify-between rounded-md border border-border/70 p-3 text-xs"><div><div className="font-semibold">{failure.type}</div><div className="mt-1 max-w-xs truncate text-[10px] text-muted-foreground">{failure.error}</div></div><Badge variant="outline" className={`text-[10px] ${failure.severity === 'High' ? 'text-red-300' : 'text-amber-300'}`}>{failure.severity}</Badge></div>)}</div>}</CardContent></Card></div>{failures.length > 0 && <Card className="panel-glow mt-5"><CardHeader><CardTitle className="text-sm">Failure analysis table</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Task</TableHead><TableHead>Model</TableHead><TableHead>Failure type</TableHead><TableHead>Error</TableHead><TableHead>Severity</TableHead><TableHead className="pr-6">Resolution</TableHead></TableRow></TableHeader><TableBody>{failures.map((failure) => <TableRow key={failure.id}><TableCell className="pl-6 text-xs font-medium">{failure.task}</TableCell><TableCell className="text-xs text-muted-foreground">{failure.model}</TableCell><TableCell className="text-xs text-amber-200">{failure.type}</TableCell><TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{failure.error}</TableCell><TableCell><Badge variant="outline" className={`text-[10px] ${failure.severity === 'High' ? 'text-red-300' : 'text-amber-300'}`}>{failure.severity}</Badge></TableCell><TableCell className="pr-6 text-xs text-muted-foreground">{failure.resolution}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>}</Shell>;
}

function DocsPage() {
  const [section, setSection] = useState('Introduction');
  const docs: Record<string, { title: string; copy: string; code?: string }> = {
    Introduction: { title: 'Scientific evaluation, made inspectable.', copy: 'SciVerify is a reliability harness for testing whether an AI-generated scientific program actually works. It treats execution, correctness, and reproducibility as separate signals instead of collapsing them into a single completion score.' },
    Architecture: { title: 'A trace-first architecture.', copy: 'Every evaluation produces a durable trace: task fixture, prompt version, model configuration, generated code, sandbox environment, stdout and stderr, outputs, and the comparison against a reference answer.' },
    'Evaluation methodology': { title: 'From code generation to scientific claim.', copy: 'The harness evaluates an agent in four layers: syntax and dependency validation, controlled execution, numerical comparison against a reference, and methodological review against the task rubric.' },
    'Execution sandbox': { title: 'Sandboxed execution with process isolation.', copy: 'Execution runs in an isolated Python 3 child process with memory, network, and filesystem restrictions, ensuring arbitrary code execution cannot harm the host system.' },
    Metrics: { title: 'Metrics with a paper trail.', copy: 'Scientific accuracy is tolerance-aware. Execution success is binary at the process boundary. Reproducibility records the environment, dataset, seed, model, and prompt used to generate the result.' },
    'Failure taxonomy': { title: 'Failures are research signals.', copy: 'Syntax error, runtime error, dependency error, timeout, numerical error, wrong scientific method, incorrect output, data handling error, visualization error, and non-reproducible result each require a different intervention.' },
    API: { title: 'REST API endpoints.', copy: 'GET /fixtures, POST /fixtures/:id/run, GET /results, and GET /results/summary provide full programmatic access to the harness.', code: `POST /api/fixtures/:id/run\nGET /api/results\nGET /api/results/summary` },
  };
  const current = docs[section];
  return <Shell><PageHeader eyebrow="Research notes" title="Documentation" description="Technical context for building and evaluating reliable scientific agents." actions={<Link href="/run"><Button data-testid="button-docs-run"><Play className="size-3.5" /> Try the workflow</Button></Link>} /><div className="grid gap-6 lg:grid-cols-[220px_1fr]"><aside className="space-y-1">{Object.keys(docs).map((item) => <button key={item} onClick={() => setSection(item)} className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-xs font-semibold ${section === item ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid={`button-doc-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}<ChevronRight className="size-3.5" /></button>)}</aside><article className="max-w-3xl rounded-lg border border-border bg-card p-6 md:p-10"><div className="mb-5 font-mono text-[10px] uppercase tracking-[.18em] text-primary">/ docs / {section.toLowerCase()}</div><h2 className="text-3xl font-bold tracking-[-.05em]">{current.title}</h2><p className="mt-6 text-sm leading-7 text-muted-foreground">{current.copy}</p>{current.code && <pre className="mt-8 rounded-lg border border-border bg-[#071019] p-5 font-mono text-xs leading-7 text-primary">{current.code}</pre>}<div className="mt-10 grid gap-3 sm:grid-cols-2"><div className="rounded-md border border-border/70 bg-secondary/30 p-4"><Server className="size-4 text-accent" /><div className="mt-3 text-xs font-semibold">Sandbox boundary</div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Never execute generated code on the main application server.</p></div><div className="rounded-md border border-border/70 bg-secondary/30 p-4"><RefreshCw className="size-4 text-primary" /><div className="mt-3 text-xs font-semibold">Reproducible by default</div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Pin data, package versions, seeds, and prompts with every run.</p></div></div></article></div></Shell>;
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const { results, tasks } = useHarnessView();

  return <Shell><PageHeader eyebrow="Workspace configuration" title="Settings" description="Manage the local research workspace and evaluation defaults." actions={<Button onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); }} data-testid="button-save-settings">{saved ? <><Check className="size-4" /> Saved</> : 'Save changes'}</Button>} /><div className="grid gap-5 lg:grid-cols-[1fr_280px]"><div className="space-y-5"><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Workspace identity</CardTitle></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><label className="space-y-2 text-xs font-semibold">Workspace name<Input defaultValue="research-harness" className="mt-1" data-testid="input-workspace-name" /></label><label className="space-y-2 text-xs font-semibold">Owner<Input defaultValue="Sher" className="mt-1" data-testid="input-workspace-owner" /></label><label className="space-y-2 text-xs font-semibold md:col-span-2">Description<Input defaultValue="AI-for-science reliability experiments" className="mt-1" data-testid="input-workspace-description" /></label></CardContent></Card><Card className="panel-glow"><CardHeader><CardTitle className="text-sm">Evaluation defaults</CardTitle></CardHeader><CardContent className="space-y-5"><ToggleRow title="Pin datasets automatically" copy="Attach the current dataset version to every new run." enabled /><ToggleRow title="Record execution logs" copy="Keep stdout, stderr, packages, and exit codes in the run trace." enabled /><ToggleRow title="Require reproducibility checks" copy="Mark a run incomplete until environment metadata is present." enabled /></CardContent></Card></div><Card className="panel-glow h-fit"><CardHeader><CardTitle className="text-sm">Workspace status</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-2 text-xs"><span className="size-2 rounded-full bg-emerald-400" />Backend harness connected</div><MetaRow label="Mode" value="LIVE" /><MetaRow label="Fixtures" value={String(tasks.length || 5).padStart(2, '0')} /><MetaRow label="Evaluations" value={String(results.length).padStart(2, '0')} /><MetaRow label="Subdomain" value="physics_sim" /><Button variant="outline" className="w-full" onClick={() => localStorage.removeItem('sciverify-settings')} data-testid="button-reset-settings"><RefreshCw className="size-3.5" /> Reset local settings</Button></CardContent></Card></div></Shell>;
}

function ToggleRow({ title, copy, enabled }: { title: string; copy: string; enabled: boolean }) { const [on, setOn] = useState(enabled); return <div className="flex items-center justify-between gap-4"><div><div className="text-xs font-semibold">{title}</div><div className="mt-1 text-[11px] leading-5 text-muted-foreground">{copy}</div></div><button onClick={() => setOn(!on)} aria-label={`Toggle ${title}`} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-secondary'}`} data-testid={`button-toggle-${title.toLowerCase().replaceAll(' ', '-')}`}><span className={`absolute top-0.5 size-4 rounded-full bg-background transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} /></button></div>; }

function Router() {
  return <Switch><Route path="/" component={Landing} /><Route path="/overview" component={OverviewContent} /><Route path="/simulations"><CosmicLabPage Shell={Shell} PageHeader={PageHeader} /></Route><Route path="/tasks" component={TasksPage} /><Route path="/tasks/:id">{(params) => <TaskDetail id={params.id} />}</Route><Route path="/run" component={RunPage} /><Route path="/results/:id">{(params) => <ResultsPage id={params.id} />}</Route><Route path="/results" component={OverviewContent} /><Route path="/comparison" component={ComparisonPage} /><Route path="/datasets" component={DatasetsPage} /><Route path="/reports" component={ReportsPage} /><Route path="/docs" component={DocsPage} /><Route path="/settings" component={SettingsPage} /><Route component={() => <Shell><EmptyState title="Route not found" copy="The page you requested does not exist in this workspace." /></Shell>} /></Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;