"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Menu,
  X,
  Search,
  Sparkles,
  FolderKanban,
  Clapperboard,
  Wand2,
  Mic2,
  ImageIcon,
  Users,
  FileJson,
  Save,
  Download,
  Upload,
  ChevronRight,
  Play,
  LayoutGrid,
  Settings2,
  Bell,
  MoreHorizontal,
  PanelLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Layers3,
  Bookmark,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "studio", label: "Studio", icon: Sparkles },
  { id: "scenes", label: "Scenes", icon: Clapperboard },
  { id: "prompts", label: "Prompts", icon: Wand2 },
  { id: "references", label: "Character DNA", icon: Users },
  { id: "tts", label: "TTS Studio", icon: Mic2 },
  { id: "cover", label: "Cover Studio", icon: ImageIcon },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "export", label: "Export / Import", icon: FileJson },
];

const QUICK_STATS = [
  { label: "Scenes", value: "12", hint: "ready to refine" },
  { label: "Prompts", value: "28", hint: "system + scene prompts" },
  { label: "Voices", value: "4", hint: "TTS packages saved" },
  { label: "Draft", value: "Live", hint: "autosave enabled" },
];

const PROJECTS = [
  { name: "NeuroCine Studio v2", updated: "2 min ago", status: "Active" },
  { name: "Product Teaser Pipeline", updated: "Yesterday", status: "Draft" },
  { name: "Trailer Shorts Batch", updated: "3 days ago", status: "Review" },
];

const SCENES = [
  {
    title: "Hook Scene",
    subtitle: "Cold open / 0–3 sec",
    status: "Ready",
    prompt: "Dark cinematic opener with subtle motion, strong focal subject, premium SaaS visual language.",
  },
  {
    title: "Explainer Mid",
    subtitle: "Workflow showcase",
    status: "Draft",
    prompt: "Minimal UI motion, soft contrast, layered panels, product-first composition.",
  },
  {
    title: "CTA End Card",
    subtitle: "Final scene / branding",
    status: "Refine",
    prompt: "Clean typography, high contrast CTA, minimal clutter, calm premium tech aesthetic.",
  },
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "workspace", label: "Workspace" },
  { id: "mobile", label: "Mobile UX" },
];

export default function Page() {
  const [activeNav, setActiveNav] = useState("studio");
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projectName, setProjectName] = useState("NeuroCine Studio");
  const [searchValue, setSearchValue] = useState("");
  const [script, setScript] = useState(
    `Create a lightweight premium interface for NeuroCine Studio.
Focus on clarity, spacing, mobile-first hierarchy, and reduced visual noise.
Make the product feel closer to Linear / Notion / AI Studio.`
  );
  const [notes, setNotes] = useState(
    `UI goals:
- lighter shell
- fewer heavy cards
- cleaner hierarchy
- easier thumb navigation on mobile
- premium SaaS feel`
  );

  useEffect(() => {
    const saved = localStorage.getItem("neurocine-ui-lite-draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projectName) setProjectName(parsed.projectName);
        if (parsed.script) setScript(parsed.script);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.activeNav) setActiveNav(parsed.activeNav);
      } catch (e) {
        console.error("Draft parse error:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "neurocine-ui-lite-draft",
      JSON.stringify({
        projectName,
        script,
        notes,
        activeNav,
      })
    );
  }, [projectName, script, notes, activeNav]);

  const activeTitle = useMemo(() => {
    return NAV_ITEMS.find((item) => item.id === activeNav)?.label || "Studio";
  }, [activeNav]);

  function exportProjectJson() {
    const data = {
      name: projectName,
      activeNav,
      script,
      notes,
      exportedAt: new Date().toISOString(),
      version: "ui-lite-layout-v1",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "-").toLowerCase() || "project"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importProjectJson(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        setProjectName(data.name || "Imported Project");
        setActiveNav(data.activeNav || "studio");
        setScript(data.script || "");
        setNotes(data.notes || "");
      } catch (error) {
        console.error("Import error:", error);
        alert("Invalid project JSON");
      }
    };

    reader.readAsText(file);
  }

  const renderContent = () => {
    switch (activeNav) {
      case "studio":
        return (
          <div className="space-y-4 md:space-y-5">
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {QUICK_STATS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur-sm"
                >
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                    {item.label}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white md:text-2xl">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-white/45">{item.hint}</div>
                </div>
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <PanelCard
                title="Creative Direction"
                subtitle="A lighter, calmer workspace with clearer hierarchy"
                rightSlot={
                  <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.07]">
                    <Play size={15} />
                    Run Pipeline
                  </button>
                }
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-white/45">
                      Project
                    </label>
                    <input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full rounded-xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/15"
                      placeholder="Project name"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-white/45">
                      Script / Master Prompt
                    </label>
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      rows={9}
                      className="w-full resize-none rounded-xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-white/15"
                      placeholder="Write your master script here..."
                    />
                  </div>
                </div>
              </PanelCard>

              <div className="space-y-4">
                <PanelCard
                  title="Product Goals"
                  subtitle="UI direction locked for the next iteration"
                >
                  <div className="grid gap-2">
                    {[
                      "Reduce visual density",
                      "Strengthen mobile usability",
                      "Remove unnecessary glass effects",
                      "Make typography and spacing do the work",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3"
                      >
                        <CheckCircle2 size={16} className="text-white/70" />
                        <span className="text-sm text-white/82">{item}</span>
                      </div>
                    ))}
                  </div>
                </PanelCard>

                <PanelCard title="Notes" subtitle="Compact product thinking area">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={7}
                    className="w-full resize-none rounded-xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-white/15"
                    placeholder="Add product notes..."
                  />
                </PanelCard>
              </div>
            </section>
          </div>
        );

      case "scenes":
        return (
          <div className="space-y-4">
            <SectionHeader
              title="Scenes"
              subtitle="Fewer blocks, stronger hierarchy, easier scanning"
              actionLabel="New Scene"
            />
            <div className="grid gap-3">
              {SCENES.map((scene) => (
                <div
                  key={scene.title}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-white md:text-base">
                          {scene.title}
                        </h3>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/55">
                          {scene.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/45">{scene.subtitle}</p>
                    </div>

                    <button className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.07]">
                      Open
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-white/72">{scene.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "prompts":
        return (
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <PanelCard
              title="Prompt Library"
              subtitle="Small, readable units instead of heavy cards"
            >
              <div className="space-y-2">
                {[
                  "Character consistency",
                  "Camera motion style",
                  "Lighting system prompt",
                  "Short-form pacing preset",
                  "Negative prompt library",
                ].map((item) => (
                  <button
                    key={item}
                    className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left text-sm text-white/80 transition hover:bg-white/[0.06]"
                  >
                    <span>{item}</span>
                    <ChevronRight size={15} className="text-white/35" />
                  </button>
                ))}
              </div>
            </PanelCard>

            <PanelCard
              title="Editor"
              subtitle="Cleaner writing surface with less distraction"
            >
              <textarea
                defaultValue={`Create a premium cinematic UI sequence with minimal clutter.
Focus on breathing room, elegant spacing, crisp typography, and high-end product feeling.
Avoid overcrowded compositions and excessive visual effects.`}
                rows={16}
                className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-white outline-none focus:border-white/15"
              />
            </PanelCard>
          </div>
        );

      case "references":
        return (
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Character DNA",
                text: "Lock identity, style behavior, face logic, wardrobe and consistency rules.",
              },
              {
                title: "Reference Image",
                text: "Use anchor image for I2V stability and visual continuity across scenes.",
              },
              {
                title: "Style System",
                text: "Store reusable visual signatures with less duplicate prompt noise.",
              },
            ].map((item) => (
              <PanelCard key={item.title} title={item.title} subtitle="Compact module">
                <p className="text-sm leading-6 text-white/70">{item.text}</p>
              </PanelCard>
            ))}
          </div>
        );

      case "tts":
        return (
          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <PanelCard
              title="Voice Package"
              subtitle="Simplified controls with better mobile readability"
            >
              <div className="space-y-3">
                <MiniField label="Voice" value="Narrator / Deep Calm" />
                <MiniField label="Language" value="RU / EN" />
                <MiniField label="Pacing" value="Balanced / 1.0x" />
                <MiniField label="Emotion" value="Controlled cinematic" />
              </div>
            </PanelCard>

            <PanelCard
              title="Script Editor"
              subtitle="Primary task gets the most space"
              rightSlot={
                <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.07]">
                  <Play size={15} />
                  Preview
                </button>
              }
            >
              <textarea
                defaultValue={`This is NeuroCine Studio.
A faster way to build cinematic short-form content with cleaner workflow, stronger consistency, and premium output control.`}
                rows={14}
                className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-white outline-none focus:border-white/15"
              />
            </PanelCard>
          </div>
        );

      case "cover":
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {["Minimal Tech", "High Contrast Promo", "Clean Editorial"].map((preset) => (
              <div
                key={preset}
                className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]"
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
                <div className="p-4">
                  <div className="text-sm font-medium text-white">{preset}</div>
                  <div className="mt-1 text-xs text-white/45">
                    Cover preset with reduced clutter and stronger focus
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "projects":
        return (
          <div className="space-y-3">
            {PROJECTS.map((project) => (
              <div
                key={project.name}
                className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:bg-white/[0.05] md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{project.name}</div>
                  <div className="mt-1 text-xs text-white/45">
                    Updated {project.updated}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/55">
                    {project.status}
                  </span>
                  <button className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.07]">
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case "export":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <PanelCard title="Export Project" subtitle="Clean utility actions">
              <button
                onClick={exportProjectJson}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                <Download size={16} />
                Export .json
              </button>
            </PanelCard>

            <PanelCard title="Import Project" subtitle="Replace draft instantly">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.05]">
                <Upload size={16} />
                Import .json
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => importProjectJson(e.target.files?.[0])}
                />
              </label>
            </PanelCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_28%)] pointer-events-none" />

      <div className="relative flex min-h-screen">
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={[
            "fixed left-0 top-0 z-50 h-full border-r border-white/8 bg-[#0b0d11]/95 backdrop-blur-xl transition-all duration-300 lg:sticky lg:z-20",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            sidebarCollapsed ? "w-[84px]" : "w-[272px]",
          ].join(" ")}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                  <Sparkles size={18} />
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      NeuroCine
                    </div>
                    <div className="text-xs text-white/45">Studio Shell</div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 lg:hidden"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-3 py-3">
              {!sidebarCollapsed && (
                <div className="mb-3 rounded-2xl border border-white/8 bg-white/[0.03] p-2">
                  <div className="flex items-center gap-2 rounded-xl px-2 py-2">
                    <Search size={15} className="text-white/35" />
                    <input
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Search"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </div>
              )}

              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = activeNav === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveNav(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={[
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition",
                        active
                          ? "border border-white/10 bg-white text-black"
                          : "border border-transparent text-white/68 hover:bg-white/[0.04] hover:text-white",
                        sidebarCollapsed ? "justify-center px-0" : "",
                      ].join(" ")}
                    >
                      <Icon size={17} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto border-t border-white/8 p-3">
              <button
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white/75 transition hover:bg-white/[0.07]"
              >
                <PanelLeft size={16} />
                {!sidebarCollapsed && <span>Collapse</span>}
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-white/8 bg-[#0a0c10]/80 backdrop-blur-xl">
            <div className="flex flex-col gap-3 px-4 py-3 md:px-6 md:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/75 lg:hidden"
                  >
                    <Menu size={18} />
                  </button>

                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold tracking-tight text-white md:text-lg">
                      {activeTitle}
                    </div>
                    <div className="text-xs text-white/42">
                      Lightweight production workspace
                    </div>
                  </div>
                </div>

                <div className="hidden items-center gap-2 md:flex">
                  <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.07]">
                    <Bell size={16} />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.07]">
                    <Settings2 size={16} />
                  </button>
                  <button className="flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white text-black px-4 text-sm font-medium">
                    <Save size={16} />
                    Save
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {TABS.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={[
                        "rounded-full px-3 py-1.5 text-sm transition",
                        active
                          ? "bg-white text-black"
                          : "bg-white/[0.04] text-white/65 hover:bg-white/[0.07] hover:text-white",
                      ].join(" ")}
                    >
                      {tab.label}
                    </button>
                  );
                })}

                <div className="ml-auto hidden items-center gap-2 md:flex">
                  <InlineMeta icon={Clock3} text="Autosave on" />
                  <InlineMeta icon={Layers3} text="Compact mode" />
                  <InlineMeta icon={Bookmark} text="UI refresh" />
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-4 md:px-6 md:py-6">
            {activeTab === "overview" && (
              <div className="mb-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:mb-5 md:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                      Design direction
                    </div>
                    <h2 className="mt-2 text-lg font-semibold tracking-tight text-white md:text-2xl">
                      Clean production shell with less weight and more focus
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/62 md:text-[15px]">
                      This layout reduces heavy glass panels, makes primary actions
                      clearer, improves spacing rhythm, and prioritizes mobile
                      usability without losing the premium dark SaaS feel.
                    </p>
                  </div>

                  <button className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07]">
                    Open roadmap
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "workspace" && (
              <div className="mb-4 grid gap-3 md:mb-5 md:grid-cols-3">
                <SmallInfoCard
                  title="Primary surface"
                  text="One dominant work area, fewer equal-weight panels."
                />
                <SmallInfoCard
                  title="Reduced chrome"
                  text="Borders and blur kept subtle, typography does the hierarchy."
                />
                <SmallInfoCard
                  title="Calmer rhythm"
                  text="More spacing, lower contrast noise, cleaner interaction zones."
                />
              </div>
            )}

            {activeTab === "mobile" && (
              <div className="mb-4 grid gap-3 md:mb-5 md:grid-cols-3">
                <SmallInfoCard
                  title="Thumb-first"
                  text="Core actions stay reachable and readable on narrow screens."
                />
                <SmallInfoCard
                  title="Single-column priority"
                  text="Important tasks stack naturally before secondary controls."
                />
                <SmallInfoCard
                  title="Cleaner scan paths"
                  text="Less card clutter, stronger sections, easier focus."
                />
              </div>
            )}

            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

function PanelCard({ title, subtitle, children, rightSlot }) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white md:text-base">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-white/45 md:text-sm">{subtitle}</p>}
        </div>
        {rightSlot}
      </div>
      {children}
    </section>
  );
}

function SectionHeader({ title, subtitle, actionLabel }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/50">{subtitle}</p>
      </div>
      <button className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07]">
        <LayoutGrid size={15} />
        {actionLabel}
      </button>
    </div>
  );
}

function SmallInfoCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="text-sm font-medium text-white">{title}</div>
      <div className="mt-1.5 text-sm leading-6 text-white/58">{text}</div>
    </div>
  );
}

function InlineMeta({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/55">
      <Icon size={13} />
      <span>{text}</span>
    </div>
  );
}

function MiniField({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/38">
        {label}
      </div>
      <div className="mt-2 text-sm text-white/84">{value}</div>
    </div>
  );
}
