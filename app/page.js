"use client";

import { useEffect, useMemo, useState } from "react";

const NAV_ITEMS = [
  { id: "studio", label: "Studio", icon: SparklesIcon },
  { id: "scenes", label: "Scenes", icon: ClapperboardIcon },
  { id: "prompts", label: "Prompts", icon: WandIcon },
  { id: "references", label: "Character DNA", icon: UsersIcon },
  { id: "tts", label: "TTS Studio", icon: MicIcon },
  { id: "cover", label: "Cover Studio", icon: ImageIcon },
  { id: "projects", label: "Projects", icon: FolderIcon },
  { id: "data", label: "Export / Import", icon: FileJsonIcon },
];

const STUDIO_TABS = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "mobile", label: "Mobile UX" },
];

const RECENT_ITEMS = [
  { label: "Scenes", value: "12", meta: "active set" },
  { label: "Prompts", value: "28", meta: "saved presets" },
  { label: "Characters", value: "3", meta: "DNA locked" },
  { label: "Draft", value: "Live", meta: "autosave" },
];

const SCENES = [
  {
    title: "Cold Open",
    time: "0–3 sec",
    status: "Ready",
    text: "Minimal cinematic opener with strong focal object and soft ambient movement.",
  },
  {
    title: "Workflow Shot",
    time: "3–6 sec",
    status: "Draft",
    text: "Clean product explanation block with reduced UI clutter and clear hierarchy.",
  },
  {
    title: "CTA End Card",
    time: "6–9 sec",
    status: "Refine",
    text: "Simple brand close with elegant spacing, concise message and premium finish.",
  },
];

const PROJECTS = [
  { name: "NeuroCine Studio", updated: "2 min ago", state: "Active" },
  { name: "Trailer Batch System", updated: "Yesterday", state: "Draft" },
  { name: "AI Ad Shorts", updated: "3 days ago", state: "Review" },
];

export default function Page() {
  const [activeNav, setActiveNav] = useState("studio");
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [projectName, setProjectName] = useState("NeuroCine Studio");
  const [searchValue, setSearchValue] = useState("");
  const [script, setScript] = useState(
    `Design a lighter premium studio shell for NeuroCine Studio.
Focus on calm hierarchy, cleaner spacing, one clear primary workspace, and mobile-first usability.
The interface should feel closer to AI Studio, Linear, and Notion than to a heavy dashboard.`
  );
  const [notes, setNotes] = useState(
    `Direction:
- reduce density
- fewer equal-weight blocks
- cleaner navigation
- premium typography rhythm
- better mobile reachability`
  );

  useEffect(() => {
    const saved = localStorage.getItem("neurocine-page-v2-draft");
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      if (data.projectName) setProjectName(data.projectName);
      if (data.script) setScript(data.script);
      if (data.notes) setNotes(data.notes);
      if (data.activeNav) setActiveNav(data.activeNav);
      if (data.activeTab) setActiveTab(data.activeTab);
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "neurocine-page-v2-draft",
      JSON.stringify({
        projectName,
        script,
        notes,
        activeNav,
        activeTab,
      })
    );
  }, [projectName, script, notes, activeNav, activeTab]);

  const activeNavLabel = useMemo(() => {
    return NAV_ITEMS.find((item) => item.id === activeNav)?.label || "Studio";
  }, [activeNav]);

  function exportProjectJson() {
    const data = {
      name: projectName,
      activeNav,
      activeTab,
      script,
      notes,
      exportedAt: new Date().toISOString(),
      version: "page-v2-ultra-clean-no-lucide",
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
        setActiveTab(data.activeTab || "overview");
        setScript(data.script || "");
        setNotes(data.notes || "");
      } catch (error) {
        console.error("Import error:", error);
        alert("Invalid project JSON");
      }
    };

    reader.readAsText(file);
  }

  function renderStudio() {
    return (
      <div className="space-y-5 md:space-y-6">
        <HeroBlock
          title="A cleaner production shell for modern AI video workflow"
          description="This layout removes dashboard heaviness, reduces equal-weight cards, and gives the workspace a calmer premium rhythm. The main task gets priority. Secondary modules stay quieter."
          badge="UI Refresh v2"
        />

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {RECENT_ITEMS.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              meta={item.meta}
            />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
          <MainWorkspace
            projectName={projectName}
            setProjectName={setProjectName}
            script={script}
            setScript={setScript}
          />

          <RightRail notes={notes} setNotes={setNotes} />
        </section>
      </div>
    );
  }

  function renderScenes() {
    return (
      <div className="space-y-4">
        <SimpleHeader
          title="Scenes"
          subtitle="Single-column priority, easier scan, less visual competition."
          actionLabel="New Scene"
        />

        <div className="space-y-3">
          {SCENES.map((scene) => (
            <SceneRow key={scene.title} scene={scene} />
          ))}
        </div>
      </div>
    );
  }

  function renderPrompts() {
    return (
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <CleanPanel
          title="Library"
          subtitle="Smaller reusable prompt modules"
          bodyClassName="space-y-2"
        >
          {[
            "Character consistency",
            "Negative prompt system",
            "Camera movement preset",
            "Lighting preset",
            "Short-form pacing",
            "Editorial CTA",
          ].map((item) => (
            <button
              key={item}
              className="flex w-full items-center justify-between rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-3 text-left text-sm text-white/76 transition hover:bg-white/[0.05] hover:text-white"
            >
              <span>{item}</span>
              <ChevronRightIcon size={15} className="text-white/28" />
            </button>
          ))}
        </CleanPanel>

        <CleanPanel
          title="Prompt Editor"
          subtitle="The main writing surface should dominate"
          bodyClassName="space-y-3"
          action={
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white/76 transition hover:bg-white/[0.07]">
              <PlayIcon size={15} />
              Generate
            </button>
          }
        >
          <textarea
            rows={18}
            defaultValue={`Create a premium cinematic short-form scene with reduced interface clutter, elegant layout logic, strong negative space, soft ambient motion, and a refined AI-native product aesthetic.`}
            className="w-full resize-none rounded-2xl border border-white/6 bg-white/[0.025] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-white/12"
          />
        </CleanPanel>
      </div>
    );
  }

  function renderReferences() {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CleanPanel title="Character DNA" subtitle="Identity lock">
          <p className="text-sm leading-6 text-white/62">
            Store appearance rules, consistency logic, wardrobe, face details and
            shot behavior without duplicating prompt noise.
          </p>
        </CleanPanel>

        <CleanPanel title="Reference Image" subtitle="I2V anchor">
          <p className="text-sm leading-6 text-white/62">
            Keep one stable visual anchor for stronger continuity across scenes,
            motion tests and regenerated outputs.
          </p>
        </CleanPanel>

        <CleanPanel title="Style Rules" subtitle="Reusable look system">
          <p className="text-sm leading-6 text-white/62">
            Save visual signatures once and apply them across cover, scenes,
            prompts and motion pipelines.
          </p>
        </CleanPanel>
      </div>
    );
  }

  function renderTts() {
    return (
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <CleanPanel title="Voice Package" subtitle="Clear, compact settings">
          <div className="space-y-2">
            <InfoLine label="Voice" value="Narrator / Deep Calm" />
            <InfoLine label="Language" value="RU / EN" />
            <InfoLine label="Speed" value="1.0x" />
            <InfoLine label="Tone" value="Controlled cinematic" />
          </div>
        </CleanPanel>

        <CleanPanel
          title="Script Editor"
          subtitle="Primary TTS surface"
          action={
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white/76 transition hover:bg-white/[0.07]">
              <PlayIcon size={15} />
              Preview
            </button>
          }
        >
          <textarea
            rows={16}
            defaultValue={`NeuroCine Studio helps you create cinematic short-form content with a cleaner workflow, stronger consistency, and premium visual direction from one focused workspace.`}
            className="w-full resize-none rounded-2xl border border-white/6 bg-white/[0.025] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-white/12"
          />
        </CleanPanel>
      </div>
    );
  }

  function renderCover() {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {["Minimal Editorial", "AI Studio Clean", "High Contrast CTA"].map(
          (item) => (
            <div
              key={item}
              className="overflow-hidden rounded-3xl border border-white/6 bg-white/[0.02]"
            >
              <div className="aspect-[16/10] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
              <div className="p-4">
                <div className="text-sm font-medium text-white">{item}</div>
                <div className="mt-1 text-sm text-white/48">
                  Cleaner cover preset with less decorative noise
                </div>
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  function renderProjects() {
    return (
      <div className="space-y-3">
        {PROJECTS.map((project) => (
          <ProjectRow key={project.name} project={project} />
        ))}
      </div>
    );
  }

  function renderData() {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CleanPanel title="Export" subtitle="Save project snapshot">
          <button
            onClick={exportProjectJson}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.07]"
          >
            <DownloadIcon size={16} />
            Export .json
          </button>
        </CleanPanel>

        <CleanPanel title="Import" subtitle="Restore from file">
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white/82 transition hover:bg-white/[0.05]">
            <UploadIcon size={16} />
            Import .json
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => importProjectJson(e.target.files?.[0])}
            />
          </label>
        </CleanPanel>
      </div>
    );
  }

  function renderContent() {
    switch (activeNav) {
      case "studio":
        return renderStudio();
      case "scenes":
        return renderScenes();
      case "prompts":
        return renderPrompts();
      case "references":
        return renderReferences();
      case "tts":
        return renderTts();
      case "cover":
        return renderCover();
      case "projects":
        return renderProjects();
      case "data":
        return renderData();
      default:
        return renderStudio();
    }
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-white antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_28%)]" />

      <div className="relative flex min-h-screen">
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={[
            "fixed left-0 top-0 z-50 h-full border-r border-white/6 bg-[#0b0d12]/96 backdrop-blur-xl transition-all duration-300 lg:sticky lg:z-20",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            sidebarCollapsed ? "w-[84px]" : "w-[248px]",
          ].join(" ")}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/6 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                    <SparklesIcon size={18} />
                  </div>

                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        NeuroCine
                      </div>
                      <div className="text-xs text-white/40">Studio</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-white/70 lg:hidden"
                >
                  <XIcon size={16} />
                </button>
              </div>

              {!sidebarCollapsed && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.025] px-3 py-2.5">
                  <SearchIcon size={15} className="text-white/28" />
                  <input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/22"
                  />
                </div>
              )}
            </div>

            <nav className="px-2 py-3">
              <div className="space-y-1">
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
                          ? "bg-white text-black"
                          : "text-white/62 hover:bg-white/[0.04] hover:text-white",
                        sidebarCollapsed ? "justify-center px-0" : "",
                      ].join(" ")}
                    >
                      <Icon size={17} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="mt-auto border-t border-white/6 p-3">
              <button
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-white/70 transition hover:bg-white/[0.06]"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpenIcon size={16} />
                ) : (
                  <PanelLeftCloseIcon size={16} />
                )}
                {!sidebarCollapsed && <span>Collapse</span>}
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-white/6 bg-[#090b10]/82 backdrop-blur-xl">
            <div className="flex flex-col gap-3 px-4 py-3 md:px-6 md:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-white/72 lg:hidden"
                  >
                    <MenuIcon size={18} />
                  </button>

                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold tracking-tight text-white md:text-lg">
                      {activeNavLabel}
                    </div>
                    <div className="text-xs text-white/40">
                      Clean production workspace
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.07] md:flex">
                    <BellIcon size={16} />
                  </button>
                  <button className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.07] md:flex">
                    <SettingsIcon size={16} />
                  </button>
                  <button className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-medium text-black transition hover:opacity-90">
                    <CheckIcon size={16} />
                    Save
                  </button>
                </div>
              </div>

              {activeNav === "studio" && (
                <div className="flex flex-wrap items-center gap-2">
                  {STUDIO_TABS.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={[
                          "rounded-full px-3 py-1.5 text-sm transition",
                          active
                            ? "bg-white text-black"
                            : "bg-white/[0.035] text-white/62 hover:bg-white/[0.07] hover:text-white",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    );
                  })}

                  <div className="ml-auto hidden items-center gap-2 lg:flex">
                    <TopMeta icon={ClockIcon} text="Autosave on" />
                    <TopMeta icon={LayersIcon} text="Compact shell" />
                  </div>
                </div>
              )}
            </div>
          </header>

          <div className="px-4 py-5 md:px-6 md:py-6">
            {activeNav === "studio" && activeTab === "pipeline" && (
              <div className="mb-5 grid gap-3 md:grid-cols-3">
                <MiniNotice
                  title="Primary workspace"
                  text="One dominant task area instead of many equal panels."
                />
                <MiniNotice
                  title="Reduced density"
                  text="Less chrome, less blur, fewer competing containers."
                />
                <MiniNotice
                  title="Better rhythm"
                  text="Typography and spacing now carry more hierarchy."
                />
              </div>
            )}

            {activeNav === "studio" && activeTab === "mobile" && (
              <div className="mb-5 grid gap-3 md:grid-cols-3">
                <MiniNotice
                  title="Thumb-first zones"
                  text="Important actions stay reachable on narrow screens."
                />
                <MiniNotice
                  title="Single-column logic"
                  text="The screen flows top-to-bottom without clutter jumps."
                />
                <MiniNotice
                  title="Cleaner scan"
                  text="Lower noise makes each section easier to parse quickly."
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

function HeroBlock({ title, description, badge }) {
  return (
    <section className="rounded-[28px] border border-white/6 bg-white/[0.025] p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/48">
            {badge}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-[32px] md:leading-[1.1]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 md:text-[15px]">
            {description}
          </p>
        </div>

        <button className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm text-white/78 transition hover:bg-white/[0.07]">
          Open roadmap
          <ArrowUpRightIcon size={15} />
        </button>
      </div>
    </section>
  );
}

function MetricCard({ label, value, meta }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/36">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white md:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-white/42">{meta}</div>
    </div>
  );
}

function MainWorkspace({ projectName, setProjectName, script, setScript }) {
  return (
    <section className="rounded-[28px] border border-white/6 bg-white/[0.022] p-4 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white md:text-base">
            Main Workspace
          </h2>
          <p className="mt-1 text-sm text-white/45">
            The core task surface gets most of the screen
          </p>
        </div>

        <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-white/62 transition hover:bg-white/[0.06]">
          <MoreHorizontalIcon size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/6 bg-black/20 p-3">
          <label className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-white/38">
            Project
          </label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            className="w-full rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-white/22 focus:border-white/12"
          />
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-[11px] uppercase tracking-[0.16em] text-white/38">
              Master Script
            </label>
            <div className="text-xs text-white/34">Primary editor</div>
          </div>

          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={15}
            placeholder="Write your main script..."
            className="w-full resize-none rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/22 focus:border-white/12"
          />
        </div>
      </div>
    </section>
  );
}

function RightRail({ notes, setNotes }) {
  return (
    <div className="space-y-4">
      <CleanPanel title="Direction" subtitle="Locked product goals">
        <div className="space-y-2">
          {[
            "Reduce visual density",
            "Make mobile flow simpler",
            "Use fewer heavy panels",
            "Push premium SaaS feeling",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-3"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                <CheckIcon size={12} />
              </div>
              <span className="text-sm text-white/78">{item}</span>
            </div>
          ))}
        </div>
      </CleanPanel>

      <CleanPanel title="Notes" subtitle="Secondary thinking area">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
          placeholder="Write notes..."
          className="w-full resize-none rounded-2xl border border-white/6 bg-white/[0.025] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/22 focus:border-white/12"
        />
      </CleanPanel>
    </div>
  );
}

function CleanPanel({
  title,
  subtitle,
  children,
  action,
  bodyClassName = "",
}) {
  return (
    <section className="rounded-[28px] border border-white/6 bg-white/[0.022] p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white md:text-base">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-white/45">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function SceneRow({ scene }) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-white/[0.022] p-4 transition hover:bg-white/[0.04]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white md:text-base">
              {scene.title}
            </h3>
            <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/50">
              {scene.status}
            </span>
            <span className="text-xs text-white/34">{scene.time}</span>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">
            {scene.text}
          </p>
        </div>

        <button className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white/76 transition hover:bg-white/[0.07]">
          Open
          <ChevronRightIcon size={15} />
        </button>
      </div>
    </div>
  );
}

function ProjectRow({ project }) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-white/[0.022] p-4 transition hover:bg-white/[0.04]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-white md:text-base">
            {project.name}
          </div>
          <div className="mt-1 text-sm text-white/44">
            Updated {project.updated}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/50">
            {project.state}
          </span>
          <button className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white/76 transition hover:bg-white/[0.07]">
            Open
          </button>
        </div>
      </div>
    </div>
  );
}

function SimpleHeader({ title, subtitle, actionLabel }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/46">{subtitle}</p>
      </div>

      <button className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm text-white/76 transition hover:bg-white/[0.07]">
        {actionLabel}
      </button>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/34">
        {label}
      </div>
      <div className="mt-1.5 text-sm text-white/82">{value}</div>
    </div>
  );
}

function TopMeta({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-white/[0.03] px-3 py-1.5 text-xs text-white/50">
      <Icon size={13} />
      <span>{text}</span>
    </div>
  );
}

function MiniNotice({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.022] p-4">
      <div className="text-sm font-medium text-white">{title}</div>
      <div className="mt-1.5 text-sm leading-6 text-white/56">{text}</div>
    </div>
  );
}

/* icons */

function IconBase({ size = 18, className = "", children, viewBox = "0 0 24 24" }) {
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function MenuIcon(props) {
  return <IconBase {...props}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></IconBase>;
}
function XIcon(props) {
  return <IconBase {...props}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></IconBase>;
}
function SearchIcon(props) {
  return <IconBase {...props}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></IconBase>;
}
function SparklesIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
      <path d="M5 14l.8 2L8 16.8 5.8 17.6 5 20l-.8-2.4L2 16.8 4.2 16 5 14z" />
    </IconBase>
  );
}
function ClapperboardIcon(props) {
  return <IconBase {...props}><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M7 8l3-5" /><path d="M13 8l3-5" /><path d="M3 12h18" /></IconBase>;
}
function WandIcon(props) {
  return <IconBase {...props}><path d="M4 20L20 4" /><path d="M14 4l1 2" /><path d="M18 8l2 1" /><path d="M4 14l2 1" /><path d="M8 18l1 2" /></IconBase>;
}
function UsersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M16 21v-1.5a4.5 4.5 0 00-4.5-4.5h-1A4.5 4.5 0 006 19.5V21" />
      <circle cx="11" cy="8" r="3.5" />
      <path d="M18 21v-1a3.5 3.5 0 00-2.2-3.2" />
      <path d="M16 5.5a3 3 0 010 5.8" />
    </IconBase>
  );
}
function MicIcon(props) {
  return <IconBase {...props}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0012 0" /><path d="M12 17v4" /><path d="M8 21h8" /></IconBase>;
}
function ImageIcon(props) {
  return <IconBase {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-6 6-2-2-5 5" /></IconBase>;
}
function FolderIcon(props) {
  return <IconBase {...props}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></IconBase>;
}
function FileJsonIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13c-.8 0-1.5.7-1.5 1.5S8.2 16 9 16" />
      <path d="M15 13c.8 0 1.5.7 1.5 1.5S15.8 16 15 16" />
      <path d="M12 12v5" />
    </IconBase>
  );
}
function BellIcon(props) {
  return <IconBase {...props}><path d="M6 17h12" /><path d="M8 17V11a4 4 0 118 0v6" /><path d="M10 20a2 2 0 004 0" /></IconBase>;
}
function SettingsIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="M4.9 4.9l1.8 1.8" />
      <path d="M17.3 17.3l1.8 1.8" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="M4.9 19.1l1.8-1.8" />
      <path d="M17.3 6.7l1.8-1.8" />
    </IconBase>
  );
}
function PlayIcon(props) {
  return <IconBase {...props}><path d="M8 6l10 6-10 6V6z" fill="currentColor" stroke="none" /></IconBase>;
}
function DownloadIcon(props) {
  return <IconBase {...props}><path d="M12 4v10" /><path d="M8 10l4 4 4-4" /><path d="M5 20h14" /></IconBase>;
}
function UploadIcon(props) {
  return <IconBase {...props}><path d="M12 20V10" /><path d="M8 14l4-4 4 4" /><path d="M5 4h14" /></IconBase>;
}
function ChevronRightIcon(props) {
  return <IconBase {...props}><path d="M9 6l6 6-6 6" /></IconBase>;
}
function CheckIcon(props) {
  return <IconBase {...props}><path d="M5 12l4 4L19 6" /></IconBase>;
}
function PanelLeftCloseIcon(props) {
  return <IconBase {...props}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /><path d="M15 9l-3 3 3 3" /></IconBase>;
}
function PanelLeftOpenIcon(props) {
  return <IconBase {...props}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /><path d="M12 9l3 3-3 3" /></IconBase>;
}
function MoreHorizontalIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}
function ArrowUpRightIcon(props) {
  return <IconBase {...props}><path d="M7 17L17 7" /><path d="M9 7h8v8" /></IconBase>;
}
function ClockIcon(props) {
  return <IconBase {...props}><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></IconBase>;
}
function LayersIcon(props) {
  return <IconBase {...props}><path d="M12 4l8 4-8 4-8-4 8-4z" /><path d="M4 12l8 4 8-4" /><path d="M4 16l8 4 8-4" /></IconBase>;
}
