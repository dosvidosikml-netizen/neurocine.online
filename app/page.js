"use client";

import { useEffect, useMemo, useState } from "react";

const NAV_ITEMS = [
  { id: "studio", label: "Студия", icon: SparklesIcon },
  { id: "scenes", label: "Сцены", icon: ClapperboardIcon },
  { id: "prompts", label: "Промпты", icon: WandIcon },
  { id: "references", label: "DNA персонажей", icon: UsersIcon },
  { id: "tts", label: "TTS Studio", icon: MicIcon },
  { id: "cover", label: "Обложки", icon: ImageIcon },
  { id: "projects", label: "Проекты", icon: FolderIcon },
  { id: "data", label: "Экспорт / Импорт", icon: FileJsonIcon },
];

const STUDIO_TABS = [
  { id: "overview", label: "Обзор" },
  { id: "visual", label: "Визуал" },
  { id: "mobile", label: "Mobile UX" },
];

const METRICS = [
  { label: "Сцены", value: "12", meta: "активный набор" },
  { label: "Промпты", value: "28", meta: "сохранённые пресеты" },
  { label: "Персонажи", value: "3", meta: "DNA зафиксирован" },
  { label: "Черновик", value: "Live", meta: "автосохранение" },
];

const SCENES = [
  {
    title: "Хук / Открытие",
    time: "0–3 сек",
    status: "Готово",
    text: "Крупный визуальный акцент, мягкое движение камеры, ощущение дорогого короткого тизера.",
  },
  {
    title: "Основной блок",
    time: "3–6 сек",
    status: "Черновик",
    text: "Показываем механику продукта через более чистую композицию и спокойную иерархию интерфейса.",
  },
  {
    title: "Финальный CTA",
    time: "6–9 сек",
    status: "Правка",
    text: "Финальная сцена с брендингом, чистой типографикой и сильной точкой фокуса.",
  },
];

const PROJECTS = [
  { name: "NeuroCine Studio", updated: "2 минуты назад", state: "Активный" },
  { name: "Shorts Trailer Batch", updated: "Вчера", state: "Черновик" },
  { name: "Promo Reel System", updated: "3 дня назад", state: "Ревью" },
];

export default function Page() {
  const [activeNav, setActiveNav] = useState("studio");
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [projectName, setProjectName] = useState("NeuroCine Studio");
  const [searchValue, setSearchValue] = useState("");
  const [script, setScript] = useState(
    `Создать более премиальный cinematic-интерфейс для NeuroCine Studio.
Нужны мягкие световые поверхности, ощущение дорогого продукта, меньше визуального шума и сильный центральный фокус.
Интерфейс должен выглядеть как продукт, который хочется показывать и использовать каждый день.`
  );
  const [notes, setNotes] = useState(
    `Арт-направление:
- cinematic premium
- мягкие градиенты
- крупные hero-блоки
- меньше ощущения dashboard
- mobile-first без перегруза`
  );

  useEffect(() => {
    const saved = localStorage.getItem("neurocine-cinematic-v3");
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      if (data.projectName) setProjectName(data.projectName);
      if (data.script) setScript(data.script);
      if (data.notes) setNotes(data.notes);
      if (data.activeNav) setActiveNav(data.activeNav);
      if (data.activeTab) setActiveTab(data.activeTab);
    } catch (error) {
      console.error("Failed to load cinematic draft:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "neurocine-cinematic-v3",
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
    return NAV_ITEMS.find((item) => item.id === activeNav)?.label || "Студия";
  }, [activeNav]);

  function exportProjectJson() {
    const data = {
      name: projectName,
      activeNav,
      activeTab,
      script,
      notes,
      exportedAt: new Date().toISOString(),
      version: "cinematic-v3-ru",
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
        setProjectName(data.name || "Импортированный проект");
        setActiveNav(data.activeNav || "studio");
        setActiveTab(data.activeTab || "overview");
        setScript(data.script || "");
        setNotes(data.notes || "");
      } catch (error) {
        console.error("Import error:", error);
        alert("Некорректный JSON проекта");
      }
    };

    reader.readAsText(file);
  }

  function renderStudio() {
    return (
      <div className="space-y-5 md:space-y-6">
        <CinematicHero
          title="NeuroCine Studio — более дорогой и кинематографичный слой интерфейса"
          description="Этот вариант делает продукт визуально сильнее: крупные световые поверхности, чище композиция, меньше ощущения тяжёлой панели и больше ощущения премиального AI-инструмента."
          badge="Cinematic UI v3"
        />

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {METRICS.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              meta={item.meta}
            />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_340px]">
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
          title="Сцены"
          subtitle="Более эффектная, но всё ещё удобная подача сцен и структуры ролика."
          actionLabel="Новая сцена"
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
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <GlowPanel
          title="Библиотека"
          subtitle="Премиальные модульные пресеты"
          bodyClassName="space-y-2"
        >
          {[
            "Consistency system",
            "Negative prompt library",
            "Camera motion preset",
            "Lighting mood pack",
            "Short-form pacing",
            "Cinematic CTA",
          ].map((item) => (
            <button
              key={item}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left text-sm text-white/80 transition hover:bg-white/[0.07]"
            >
              <span>{item}</span>
              <ChevronRightIcon size={15} className="text-white/35" />
            </button>
          ))}
        </GlowPanel>

        <GlowPanel
          title="Редактор промпта"
          subtitle="Основная поверхность под генерацию"
          action={
            <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-medium text-black transition hover:opacity-90">
              <PlayIcon size={15} />
              Генерировать
            </button>
          }
        >
          <textarea
            rows={18}
            defaultValue={`Создать премиальную cinematic-сцену с мягким светом, сильной глубиной, дорогой визуальной подачей, чистой композицией и ощущением современного AI-продукта.`}
            className="w-full resize-none rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-white/20"
          />
        </GlowPanel>
      </div>
    );
  }

  function renderReferences() {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <GlowPanel title="DNA персонажей" subtitle="Фиксация идентичности">
          <p className="text-sm leading-6 text-white/68">
            Закрепляй лицо, стиль, одежду, визуальный характер и поведение камеры
            без хаоса из повторяющихся промптов.
          </p>
        </GlowPanel>

        <GlowPanel title="Reference Image" subtitle="Якорь для I2V">
          <p className="text-sm leading-6 text-white/68">
            Держи стабильный визуальный anchor для лучшей согласованности между
            сценами, движением и регенерацией кадров.
          </p>
        </GlowPanel>

        <GlowPanel title="Style System" subtitle="Повторяемый визуальный язык">
          <p className="text-sm leading-6 text-white/68">
            Сохраняй визуальные сигнатуры один раз и применяй их к сценам,
            обложкам, персонажам и motion-пайплайну.
          </p>
        </GlowPanel>
      </div>
    );
  }

  function renderTts() {
    return (
      <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <GlowPanel title="Voice Package" subtitle="Настройки озвучки">
          <div className="space-y-2">
            <InfoLine label="Голос" value="Narrator / Deep Calm" />
            <InfoLine label="Язык" value="RU / EN" />
            <InfoLine label="Скорость" value="1.0x" />
            <InfoLine label="Эмоция" value="Контролируемая cinematic" />
          </div>
        </GlowPanel>

        <GlowPanel
          title="Script Editor"
          subtitle="Главная TTS-поверхность"
          action={
            <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-medium text-black transition hover:opacity-90">
              <PlayIcon size={15} />
              Preview
            </button>
          }
        >
          <textarea
            rows={16}
            defaultValue={`NeuroCine Studio помогает собирать cinematic short-form контент из более чистого workflow, фиксированного визуального языка и сильной production-логики.`}
            className="w-full resize-none rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-white/20"
          />
        </GlowPanel>
      </div>
    );
  }

  function renderCover() {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {["Cinematic Glow", "Apple-style Promo", "Premium Contrast"].map(
          (item) => (
            <div
              key={item}
              className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_25px_80px_rgba(0,0,0,0.45)]"
            >
              <div className="aspect-[16/10] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_20%),radial-gradient(circle_at_80%_25%,rgba(105,138,255,0.22),transparent_24%),radial-gradient(circle_at_50%_80%,rgba(173,255,223,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]" />
              <div className="p-4">
                <div className="text-sm font-medium text-white">{item}</div>
                <div className="mt-1 text-sm text-white/52">
                  Более выразительный и дорогой пресет обложки
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
        <GlowPanel title="Экспорт" subtitle="Снимок проекта">
          <button
            onClick={exportProjectJson}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90"
          >
            <DownloadIcon size={16} />
            Экспорт .json
          </button>
        </GlowPanel>

        <GlowPanel title="Импорт" subtitle="Восстановить из файла">
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/86 transition hover:bg-white/[0.07]">
            <UploadIcon size={16} />
            Импорт .json
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => importProjectJson(e.target.files?.[0])}
            />
          </label>
        </GlowPanel>
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
    <div className="min-h-screen bg-[#050816] text-white antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(120,139,255,0.18),transparent_24%),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_22%),radial-gradient(circle_at_80%_30%,rgba(104,255,210,0.10),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_30%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-60 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,transparent_80%,rgba(255,255,255,0.02))]" />

      <div className="relative flex min-h-screen">
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={[
            "fixed left-0 top-0 z-50 h-full border-r border-white/10 bg-[rgba(6,10,24,0.78)] backdrop-blur-2xl transition-all duration-300 lg:sticky lg:z-20",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            sidebarCollapsed ? "w-[86px]" : "w-[260px]",
          ].join(" ")}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white text-black shadow-[0_10px_40px_rgba(255,255,255,0.18)]">
                    <SparklesIcon size={18} />
                  </div>

                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        NeuroCine
                      </div>
                      <div className="text-xs text-white/45">Cinematic Studio</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/75 lg:hidden"
                >
                  <XIcon size={16} />
                </button>
              </div>

              {!sidebarCollapsed && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
                  <SearchIcon size={15} className="text-white/35" />
                  <input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Поиск"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/26"
                  />
                </div>
              )}
            </div>

            <nav className="px-2 py-3">
              <div className="space-y-1.5">
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
                          ? "bg-white text-black shadow-[0_10px_35px_rgba(255,255,255,0.14)]"
                          : "text-white/68 hover:bg-white/[0.06] hover:text-white",
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

            <div className="mt-auto border-t border-white/10 p-3">
              <button
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white/76 transition hover:bg-white/[0.08]"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpenIcon size={16} />
                ) : (
                  <PanelLeftCloseIcon size={16} />
                )}
                {!sidebarCollapsed && <span>Свернуть</span>}
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-[rgba(5,8,22,0.74)] backdrop-blur-2xl">
            <div className="flex flex-col gap-3 px-4 py-3 md:px-6 md:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.06] text-white/78 lg:hidden"
                  >
                    <MenuIcon size={18} />
                  </button>

                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold tracking-tight text-white md:text-lg">
                      {activeNavLabel}
                    </div>
                    <div className="text-xs text-white/44">
                      Premium cinematic workspace
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/74 transition hover:bg-white/[0.08] md:flex">
                    <BellIcon size={16} />
                  </button>
                  <button className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/74 transition hover:bg-white/[0.08] md:flex">
                    <SettingsIcon size={16} />
                  </button>
                  <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-medium text-black shadow-[0_10px_35px_rgba(255,255,255,0.16)] transition hover:opacity-90">
                    <CheckIcon size={16} />
                    Сохранить
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
                          "rounded-full px-4 py-2 text-sm transition",
                          active
                            ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.14)]"
                            : "bg-white/[0.05] text-white/68 hover:bg-white/[0.08] hover:text-white",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    );
                  })}

                  <div className="ml-auto hidden items-center gap-2 lg:flex">
                    <TopMeta icon={ClockIcon} text="Автосохранение" />
                    <TopMeta icon={LayersIcon} text="Cinematic shell" />
                  </div>
                </div>
              )}
            </div>
          </header>

          <div className="px-4 py-5 md:px-6 md:py-6">
            {activeNav === "studio" && activeTab === "visual" && (
              <div className="mb-5 grid gap-3 md:grid-cols-3">
                <MiniNotice
                  title="Больше вау-эффекта"
                  text="Крупнее hero-поверхности, мягче свет, дороже подача."
                />
                <MiniNotice
                  title="Меньше dashboard-чувства"
                  text="Интерфейс ближе к продукту-витрине, а не к панели администрирования."
                />
                <MiniNotice
                  title="Премиальный акцент"
                  text="Свет, глубина и типографика стали сильнее работать на бренд."
                />
              </div>
            )}

            {activeNav === "studio" && activeTab === "mobile" && (
              <div className="mb-5 grid gap-3 md:grid-cols-3">
                <MiniNotice
                  title="Mobile-first"
                  text="Большие зоны касания, спокойный скролл и меньше визуальной каши."
                />
                <MiniNotice
                  title="Крупные акценты"
                  text="На телефоне интерфейс выглядит богаче за счёт hero-композиции."
                />
                <MiniNotice
                  title="Чище сценарий"
                  text="Важные действия видны сразу, вторичное уходит на второй план."
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

function CinematicHero({ title, description, badge }) {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_120px_rgba(0,0,0,0.55)] md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.16),transparent_20%),radial-gradient(circle_at_85%_20%,rgba(115,135,255,0.22),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(109,255,215,0.10),transparent_25%)]" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/66">
            {badge}
          </div>
          <h1 className="mt-4 text-[34px] font-semibold tracking-tight text-white md:max-w-4xl md:text-[54px] md:leading-[1.02]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 md:text-[15px]">
            {description}
          </p>
        </div>

        <button className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/12 bg-white/[0.07] px-4 py-2.5 text-sm text-white transition hover:bg-white/[0.10]">
          Открыть roadmap
          <ArrowUpRightIcon size={15} />
        </button>
      </div>
    </section>
  );
}

function MetricCard({ label, value, meta }) {
  return (
    <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.30)]">
      <div className="text-[11px] uppercase tracking-[0.20em] text-white/42">
        {label}
      </div>
      <div className="mt-3 text-[32px] font-semibold tracking-tight text-white">
        {value}
      </div>
      <div className="mt-1 text-sm text-white/52">{meta}</div>
    </div>
  );
}

function MainWorkspace({ projectName, setProjectName, script, setScript }) {
  return (
    <section className="rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_100px_rgba(0,0,0,0.45)] md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white md:text-base">
            Main Workspace
          </h2>
          <p className="mt-1 text-sm text-white/48">
            Основная cinematic-поверхность проекта
          </p>
        </div>

        <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/72 transition hover:bg-white/[0.08]">
          <MoreHorizontalIcon size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-3">
          <label className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-white/40">
            Проект
          </label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Название проекта"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/24 focus:border-white/20"
          />
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-[11px] uppercase tracking-[0.16em] text-white/40">
              Master Script
            </label>
            <div className="text-xs text-white/36">Primary surface</div>
          </div>

          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={15}
            placeholder="Напиши главный сценарий..."
            className="w-full resize-none rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/24 focus:border-white/20"
          />
        </div>
      </div>
    </section>
  );
}

function RightRail({ notes, setNotes }) {
  return (
    <div className="space-y-4">
      <GlowPanel title="Art Direction" subtitle="Зафиксированные цели UI">
        <div className="space-y-2">
          {[
            "Усилить ощущение premium",
            "Уменьшить шум и дробность",
            "Сделать интерфейс визуально богаче",
            "Сохранить удобство на мобильном",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                <CheckIcon size={12} />
              </div>
              <span className="text-sm text-white/82">{item}</span>
            </div>
          ))}
        </div>
      </GlowPanel>

      <GlowPanel title="Заметки" subtitle="Вторичная рабочая зона">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
          placeholder="Напиши заметки..."
          className="w-full resize-none rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/24 focus:border-white/20"
        />
      </GlowPanel>
    </div>
  );
}

function GlowPanel({
  title,
  subtitle,
  children,
  action,
  bodyClassName = "",
}) {
  return (
    <section className="rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_24px_90px_rgba(0,0,0,0.42)] md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white md:text-base">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-white/48">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function SceneRow({ scene }) {
  return (
    <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.32)] transition hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white md:text-base">
              {scene.title}
            </h3>
            <span className="rounded-full border border-white/12 bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/58">
              {scene.status}
            </span>
            <span className="text-xs text-white/36">{scene.time}</span>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/66">
            {scene.text}
          </p>
        </div>

        <button className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.10]">
          Открыть
          <ChevronRightIcon size={15} />
        </button>
      </div>
    </div>
  );
}

function ProjectRow({ project }) {
  return (
    <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.32)] transition hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-white md:text-base">
            {project.name}
          </div>
          <div className="mt-1 text-sm text-white/46">
            Обновлён {project.updated}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/56">
            {project.state}
          </span>
          <button className="rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.10]">
            Открыть
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
        <p className="mt-1 text-sm text-white/48">{subtitle}</p>
      </div>

      <button className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm text-white/82 transition hover:bg-white/[0.10]">
        {actionLabel}
      </button>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/36">
        {label}
      </div>
      <div className="mt-1.5 text-sm text-white/86">{value}</div>
    </div>
  );
}

function TopMeta({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs text-white/56">
      <Icon size={13} />
      <span>{text}</span>
    </div>
  );
}

function MiniNotice({ title, text }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.28)]">
      <div className="text-sm font-medium text-white">{title}</div>
      <div className="mt-1.5 text-sm leading-6 text-white/60">{text}</div>
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
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </IconBase>
  );
}

function XIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </IconBase>
  );
}

function SearchIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </IconBase>
  );
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
  return (
    <IconBase {...props}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M7 8l3-5" />
      <path d="M13 8l3-5" />
      <path d="M3 12h18" />
    </IconBase>
  );
}

function WandIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 20L20 4" />
      <path d="M14 4l1 2" />
      <path d="M18 8l2 1" />
      <path d="M4 14l2 1" />
      <path d="M8 18l1 2" />
    </IconBase>
  );
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
  return (
    <IconBase {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0012 0" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </IconBase>
  );
}

function ImageIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 16l-5-5-6 6-2-2-5 5" />
    </IconBase>
  );
}

function FolderIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </IconBase>
  );
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
  return (
    <IconBase {...props}>
      <path d="M6 17h12" />
      <path d="M8 17V11a4 4 0 118 0v6" />
      <path d="M10 20a2 2 0 004 0" />
    </IconBase>
  );
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
  return (
    <IconBase {...props}>
      <path d="M8 6l10 6-10 6V6z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function DownloadIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 4v10" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 20h14" />
    </IconBase>
  );
}

function UploadIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 20V10" />
      <path d="M8 14l4-4 4 4" />
      <path d="M5 4h14" />
    </IconBase>
  );
}

function ChevronRightIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M9 6l6 6-6 6" />
    </IconBase>
  );
}

function CheckIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5 12l4 4L19 6" />
    </IconBase>
  );
}

function PanelLeftCloseIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="M15 9l-3 3 3 3" />
    </IconBase>
  );
}

function PanelLeftOpenIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="M12 9l3 3-3 3" />
    </IconBase>
  );
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
  return (
    <IconBase {...props}>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </IconBase>
  );
}

function ClockIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </IconBase>
  );
}

function LayersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 4l8 4-8 4-8-4 8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </IconBase>
  );
}
