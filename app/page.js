"use client";

import { useEffect, useMemo, useState } from "react";
import { SYS_SCENE_ENGINE, buildSceneUserPrompt } from "../engine/sceneEngine";
import { SYS_PROMPT_ENGINE, buildPromptUserPrompt } from "../engine/promptEngine";
import { SYS_REFERENCE_ENGINE, buildReferenceUserPrompt } from "../engine/referenceEngine";
import { SYS_SEO_ENGINE, buildSeoUserPrompt } from "../engine/seoEngine";
import { SYS_TTS_ENGINE, buildTtsUserPrompt } from "../engine/ttsEngine";
import { buildCharacterDNA, injectCharactersIntoScript } from "../engine/characterEngine";

const STORAGE_KEY = "neurocine_projects_v3";

const TEXT = {
  ru: {
    appTitle: "NeuroCine Studio",
    appSub: "AI видео-студия",
    script: "Сценарий",
    scriptPlaceholder: "Вставь сценарий или идею...",
    character: "Персонажи",
    reference: "Reference",
    scenes: "Сцены",
    prompts: "Промпты",
    cover: "Cover Studio",
    export: "Экспорт",
    seo: "SEO + Social",
    tts: "Озвучка",
    projects: "Проекты",
    refImage: "Reference Image",
    noReference: "Reference пока не создан",
    noScenes: "Сцен пока нет",
    noPrompts: "Промптов пока нет",
    noSeo: "SEO пока не сгенерирован",
    noTts: "Озвучка пока не сгенерирована",
    noProjects: "Сохранённых проектов пока нет",
    noRefImage: "Reference image пока не загружен",
    btnScenes: "Сгенерировать сцены",
    btnReference: "Сгенерировать reference",
    btnPrompts: "Сгенерировать промпты",
    btnSeo: "Сгенерировать SEO",
    btnTts: "Сгенерировать озвучку",
    btnSpeak: "Слушать",
    btnStop: "Стоп",
    loading: "Генерация...",
    name: "Имя",
    gender: "Пол",
    age: "Возраст",
    style: "Стиль",
    identityLock: "Identity lock",
    outfitLock: "Outfit lock",
    goal: "Цель",
    voice: "Озвучка",
    visual: "Визуал",
    camera: "Камера",
    motion: "Движение",
    lighting: "Свет",
    environment: "Среда",
    sfx: "SFX",
    mode: "Режим",
    tabStudio: "Студия",
    tabScenes: "Сцены",
    tabPrompts: "Промпты",
    tabReference: "Reference",
    tabRefImage: "Ref Image",
    tabCover: "Обложка",
    tabExport: "Экспорт",
    tabSeo: "SEO",
    tabTts: "Озвучка",
    tabProjects: "Проекты",
    male: "Мужской",
    female: "Женский",
    saveCharacter: "Обновить персонажей",
    addCharacter: "Добавить персонажа",
    removeCharacter: "Удалить",
    coverTitle: "Заголовок",
    coverSubtitle: "Подзаголовок",
    coverCta: "CTA",
    posX: "Позиция X",
    posY: "Позиция Y",
    bgPrompt: "Описание фона",
    preview: "Превью",
    preset: "Пресет",
    copy: "Копировать",
    copied: "Скопировано",
    downloadJson: "Скачать .json",
    importJson: "Импорт .json",
    exportScenes: "Экспорт сцен",
    exportPrompts: "Экспорт промптов",
    exportReference: "Экспорт reference",
    exportRefImage: "Экспорт reference image",
    exportCover: "Экспорт cover",
    exportSeo: "Экспорт SEO",
    exportTts: "Экспорт TTS",
    edit: "Редактировать",
    save: "Сохранить",
    cancel: "Отмена",
    imgPrompt: "Image prompt",
    vidPrompt: "Video prompt",
    negative: "Negative prompt",
    close: "Закрыть",
    seoTitle: "Title",
    seoDescription: "Description",
    seoHashtags: "Hashtags",
    seoTikTok: "TikTok caption",
    seoFacebook: "Facebook post",
    seoYoutube: "YouTube Shorts title",
    projectName: "Название проекта",
    projectNamePlaceholder: "Например: Dark History #1",
    saveProject: "Сохранить проект",
    loadProject: "Загрузить",
    deleteProject: "Удалить",
    projectSaved: "Проект сохранён",
    autoSaved: "Автосохранение черновика включено",
    createdAt: "Создан",
    updatedAt: "Обновлён",
    uploadRef: "Загрузить reference image",
    removeRef: "Удалить reference image",
    refNote: "Этот image anchor сохраняется в проекте и помечает промпты как I2V-ready.",
    refFileName: "Имя файла",
    refImageUsed: "Использовать uploaded reference",
    refImageActive: "Uploaded reference image активен",
    ttsFullScript: "Полный текст озвучки",
    ttsSegments: "Сегменты озвучки",
    importError: "Ошибка загрузки JSON",
  },
  en: {
    appTitle: "NeuroCine Studio",
    appSub: "AI video studio",
    script: "Script",
    scriptPlaceholder: "Paste your script or idea...",
    character: "Characters",
    reference: "Reference",
    scenes: "Scenes",
    prompts: "Prompts",
    cover: "Cover Studio",
    export: "Export",
    seo: "SEO + Social",
    tts: "Voiceover",
    projects: "Projects",
    refImage: "Reference Image",
    noReference: "Reference not created yet",
    noScenes: "No scenes yet",
    noPrompts: "No prompts yet",
    noSeo: "SEO not generated yet",
    noTts: "Voiceover not generated yet",
    noProjects: "No saved projects yet",
    noRefImage: "No reference image uploaded yet",
    btnScenes: "Generate scenes",
    btnReference: "Generate reference",
    btnPrompts: "Generate prompts",
    btnSeo: "Generate SEO",
    btnTts: "Generate voiceover",
    btnSpeak: "Speak",
    btnStop: "Stop",
    loading: "Generating...",
    name: "Name",
    gender: "Gender",
    age: "Age",
    style: "Style",
    identityLock: "Identity lock",
    outfitLock: "Outfit lock",
    goal: "Goal",
    voice: "Voice",
    visual: "Visual",
    camera: "Camera",
    motion: "Motion",
    lighting: "Lighting",
    environment: "Environment",
    sfx: "SFX",
    mode: "Mode",
    tabStudio: "Studio",
    tabScenes: "Scenes",
    tabPrompts: "Prompts",
    tabReference: "Reference",
    tabRefImage: "Ref Image",
    tabCover: "Cover",
    tabExport: "Export",
    tabSeo: "SEO",
    tabTts: "Voiceover",
    tabProjects: "Projects",
    male: "Male",
    female: "Female",
    saveCharacter: "Update characters",
    addCharacter: "Add character",
    removeCharacter: "Remove",
    coverTitle: "Title",
    coverSubtitle: "Subtitle",
    coverCta: "CTA",
    posX: "Position X",
    posY: "Position Y",
    bgPrompt: "Background prompt",
    preview: "Preview",
    preset: "Preset",
    copy: "Copy",
    copied: "Copied",
    downloadJson: "Download .json",
    importJson: "Import .json",
    exportScenes: "Export scenes",
    exportPrompts: "Export prompts",
    exportReference: "Export reference",
    exportRefImage: "Export reference image",
    exportCover: "Export cover",
    exportSeo: "Export SEO",
    exportTts: "Export TTS",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    imgPrompt: "Image prompt",
    vidPrompt: "Video prompt",
    negative: "Negative prompt",
    close: "Close",
    seoTitle: "Title",
    seoDescription: "Description",
    seoHashtags: "Hashtags",
    seoTikTok: "TikTok caption",
    seoFacebook: "Facebook post",
    seoYoutube: "YouTube Shorts title",
    projectName: "Project name",
    projectNamePlaceholder: "For example: Dark History #1",
    saveProject: "Save project",
    loadProject: "Load",
    deleteProject: "Delete",
    projectSaved: "Project saved",
    autoSaved: "Draft autosave enabled",
    createdAt: "Created",
    updatedAt: "Updated",
    uploadRef: "Upload reference image",
    removeRef: "Remove reference image",
    refNote: "This image anchor is stored in the project and marks prompts as I2V-ready.",
    refFileName: "File name",
    refImageUsed: "Use uploaded reference",
    refImageActive: "Uploaded reference image is active",
    ttsFullScript: "Full voiceover script",
    ttsSegments: "Voiceover segments",
    importError: "JSON import error",
  },
};

const COVER_PRESETS = {
  netflix: { label: "Netflix", hookColor: "#e50914", titleColor: "#ffffff", ctaBg: "rgba(229,9,20,0.95)", titleSize: 34, hookSize: 13, align: "center", transform: "translate(-50%, -50%)", titleWeight: 900, titleFont: "Inter, sans-serif", titleStroke: "none", titleShadow: "0 6px 20px rgba(0,0,0,0.9)" },
  mrbeast: { label: "MrBeast", hookColor: "#ffdd00", titleColor: "#ffffff", ctaBg: "rgba(236,72,153,0.95)", titleSize: 42, hookSize: 16, align: "center", transform: "translate(-50%, -50%) rotate(-3deg)", titleWeight: 900, titleFont: "Impact, sans-serif", titleStroke: "2px #000", titleShadow: "5px 5px 0 #000, 0 0 20px rgba(0,0,0,0.7)" },
  tiktok: { label: "TikTok", hookColor: "#00f2ea", titleColor: "#ffffff", ctaBg: "rgba(255,0,80,0.95)", titleSize: 32, hookSize: 14, align: "center", transform: "translate(-50%, -50%)", titleWeight: 900, titleFont: "Inter, sans-serif", titleStroke: "none", titleShadow: "0 0 20px rgba(0,242,234,0.35), 0 6px 20px rgba(0,0,0,0.8)" },
  truecrime: { label: "True Crime", hookColor: "#facc15", titleColor: "#ffffff", ctaBg: "rgba(0,0,0,0.9)", titleSize: 30, hookSize: 12, align: "left", transform: "translate(-50%, -50%)", titleWeight: 900, titleFont: "Inter, sans-serif", titleStroke: "none", titleShadow: "0 4px 18px rgba(0,0,0,0.9)" },
  history: { label: "History", hookColor: "#d4af37", titleColor: "#f8fafc", ctaBg: "rgba(180,83,9,0.9)", titleSize: 36, hookSize: 12, align: "center", transform: "translate(-50%, -50%)", titleWeight: 900, titleFont: "Georgia, serif", titleStroke: "none", titleShadow: "0 6px 20px rgba(0,0,0,0.9)" },
  minimal: { label: "Minimal", hookColor: "#cbd5e1", titleColor: "#ffffff", ctaBg: "rgba(51,65,85,0.9)", titleSize: 26, hookSize: 11, align: "center", transform: "translate(-50%, -50%)", titleWeight: 400, titleFont: "Inter, sans-serif", titleStroke: "none", titleShadow: "0 4px 10px rgba(0,0,0,0.7)" },
};

function makeFormCharacter(index = 1) {
  return { id: `char_${index}`, name: `Character ${index}`, gender: "male", age: 28, style: "black tactical jacket, cinematic look" };
}

function SceneEditorModal({ scene, t, onClose, onSave }) {
  const [form, setForm] = useState(scene);
  if (!scene) return null;
  function setField(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }
  return (
    <div style={modal.backdrop}>
      <div style={modal.panel}>
        <div style={modal.header}>
          <div style={modal.title}>{scene.id}</div>
          <button onClick={onClose} style={modal.closeBtn}>{t.close}</button>
        </div>
        <div style={modal.grid}>
          {["scene_goal", "voice", "visual", "camera", "motion", "lighting", "environment", "sfx", "generation_mode"].map((field) => (
            <label key={field} style={modal.label}>
              <span>{field}</span>
              <textarea
                value={form[field] ?? ""}
                onChange={(e) => setField(field, e.target.value)}
                style={modal.textarea}
              />
            </label>
          ))}
        </div>
        <div style={modal.actions}>
          <button onClick={onClose} style={modal.secondary}>{t.cancel}</button>
          <button onClick={() => onSave(form)} style={modal.primary}>{t.save}</button>
        </div>
      </div>
    </div>
  );
}

function PromptEditorModal({ prompt, t, onClose, onSave }) {
  const [form, setForm] = useState(prompt);
  if (!prompt) return null;
  function setField(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }
  return (
    <div style={modal.backdrop}>
      <div style={modal.panel}>
        <div style={modal.header}>
          <div style={modal.title}>{prompt.scene_id}</div>
          <button onClick={onClose} style={modal.closeBtn}>{t.close}</button>
        </div>
        <div style={modal.grid}>
          <label style={modal.label}>
            <span>imgPrompt_EN</span>
            <textarea value={form.imgPrompt_EN ?? ""} onChange={(e) => setField("imgPrompt_EN", e.target.value)} style={modal.textareaLg} />
          </label>
          <label style={modal.label}>
            <span>vidPrompt_EN</span>
            <textarea value={form.vidPrompt_EN ?? ""} onChange={(e) => setField("vidPrompt_EN", e.target.value)} style={modal.textareaLg} />
          </label>
          <label style={modal.label}>
            <span>negative_prompt</span>
            <textarea value={form.negative_prompt ?? ""} onChange={(e) => setField("negative_prompt", e.target.value)} style={modal.textarea} />
          </label>
          <label style={modal.label}>
            <span>generation_mode_final</span>
            <input value={form.generation_mode_final ?? ""} onChange={(e) => setField("generation_mode_final", e.target.value)} style={modal.input} />
          </label>
        </div>
        <div style={modal.actions}>
          <button onClick={onClose} style={modal.secondary}>{t.cancel}</button>
          <button onClick={() => onSave(form)} style={modal.primary}>{t.save}</button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [lang, setLang] = useState("ru");
  const [activeTab, setActiveTab] = useState("studio");
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [reference, setReference] = useState(null);
  const [seo, setSeo] = useState(null);
  const [tts, setTts] = useState(null);
  const [loadingScenes, setLoadingScenes] = useState(false);
  const [loadingReference, setLoadingReference] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [loadingTts, setLoadingTts] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [editingScene, setEditingScene] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [projectName, setProjectName] = useState("NeuroCine Project");
  const [savedProjects, setSavedProjects] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [refImage, setRefImage] = useState({
    dataUrl: "",
    fileName: "",
    mimeType: "",
    useAsAnchor: true,
  });

  const [cover, setCover] = useState({
    preset: "netflix",
    title: "ТВОЯ ИСТОРИЯ",
    subtitle: "КИНОШНЫЙ AI-РОЛИК",
    cta: "СМОТРИ ДО КОНЦА",
    posX: 50,
    posY: 58,
    backgroundPrompt: "dark cinematic background, dramatic contrast, volumetric light, high tension",
  });

  const [characterForms, setCharacterForms] = useState([{ ...makeFormCharacter(1), name: "Alex" }]);
  const [characters, setCharacters] = useState([
    buildCharacterDNA({ name: "Alex", gender: "male", age: 28, style: "black tactical jacket, cinematic look" }),
  ]);

  const t = useMemo(() => TEXT[lang], [lang]);
  const preset = COVER_PRESETS[cover.preset] || COVER_PRESETS.netflix;

  function readProjects() {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeProjects(projects) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    setSavedProjects(projects);
  }

  function buildProjectPayload() {
    return {
      id: Date.now().toString(),
      name: projectName.trim() || "NeuroCine Project",
      lang,
      script,
      scenes,
      prompts,
      reference,
      seo,
      tts,
      cover,
      refImage,
      characterForms,
      characters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function saveProject() {
    const existing = readProjects();
    const existingIndex = existing.findIndex((p) => p.name === (projectName.trim() || "NeuroCine Project"));

    if (existingIndex >= 0) {
      const updated = {
        ...existing[existingIndex],
        lang,
        script,
        scenes,
        prompts,
        reference,
        seo,
        tts,
        cover,
        refImage,
        characterForms,
        characters,
        updatedAt: new Date().toISOString(),
      };
      existing[existingIndex] = updated;
      writeProjects(existing);
    } else {
      const payload = buildProjectPayload();
      writeProjects([payload, ...existing]);
    }

    setSaveStatus(t.projectSaved);
    setTimeout(() => setSaveStatus(""), 1200);
  }

  function loadProject(project) {
    setProjectName(project.name || "NeuroCine Project");
    setLang(project.lang || "ru");
    setScript(project.script || "");
    setScenes(project.scenes || []);
    setPrompts(project.prompts || []);
    setReference(project.reference || null);
    setSeo(project.seo || null);
    setTts(project.tts || null);
    setCover(project.cover || cover);
    setRefImage(project.refImage || { dataUrl: "", fileName: "", mimeType: "", useAsAnchor: true });
    setCharacterForms(project.characterForms || [{ ...makeFormCharacter(1), name: "Alex" }]);
    setCharacters(project.characters || [
      buildCharacterDNA({ name: "Alex", gender: "male", age: 28, style: "black tactical jacket, cinematic look" }),
    ]);
    setActiveTab("studio");
  }

  function deleteProject(id) {
    const next = readProjects().filter((p) => p.id !== id);
    writeProjects(next);
  }

  useEffect(() => {
    setSavedProjects(readProjects());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const draft = {
      projectName,
      lang,
      script,
      scenes,
      prompts,
      reference,
      seo,
      tts,
      cover,
      refImage,
      characterForms,
      characters,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("neurocine_draft_v3", JSON.stringify(draft));
  }, [projectName, lang, script, scenes, prompts, reference, seo, tts, cover, refImage, characterForms, characters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const draft = JSON.parse(localStorage.getItem("neurocine_draft_v3") || "null");
      if (draft) {
        setProjectName(draft.projectName || "NeuroCine Project");
        setLang(draft.lang || "ru");
        setScript(draft.script || "");
        setScenes(draft.scenes || []);
        setPrompts(draft.prompts || []);
        setReference(draft.reference || null);
        setSeo(draft.seo || null);
        setTts(draft.tts || null);
        setCover(draft.cover || {
          preset: "netflix",
          title: "ТВОЯ ИСТОРИЯ",
          subtitle: "КИНОШНЫЙ AI-РОЛИК",
          cta: "СМОТРИ ДО КОНЦА",
          posX: 50,
          posY: 58,
          backgroundPrompt: "dark cinematic background, dramatic contrast, volumetric light, high tension",
        });
        setRefImage(draft.refImage || { dataUrl: "", fileName: "", mimeType: "", useAsAnchor: true });
        setCharacterForms(draft.characterForms || [{ ...makeFormCharacter(1), name: "Alex" }]);
        setCharacters(draft.characters || [
          buildCharacterDNA({ name: "Alex", gender: "male", age: 28, style: "black tactical jacket, cinematic look" }),
        ]);
      }
    } catch {}
  }, []);

  async function callAPI(content, system) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "API error");
    return data?.text || "";
  }

  function cleanJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      const match = String(str).match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return {};
    }
  }

  function addCharacter() {
    setCharacterForms((prev) => [...prev, makeFormCharacter(prev.length + 1)]);
  }

  function removeCharacter(id) {
    setCharacterForms((prev) => prev.filter((c) => c.id !== id));
  }

  function updateCharacterField(id, field, value) {
    setCharacterForms((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function updateCharacters() {
    const next = characterForms.map((c) =>
      buildCharacterDNA({ name: c.name, gender: c.gender, age: Number(c.age), style: c.style })
    );
    setCharacters(next);
    setReference(null);
    setScenes([]);
    setPrompts([]);
    setSeo(null);
    setTts(null);
  }

  function handleRefImageUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRefImage({
        dataUrl: String(reader.result || ""),
        fileName: file.name || "",
        mimeType: file.type || "",
        useAsAnchor: true,
      });
      setPrompts([]);
    };
    reader.readAsDataURL(file);
  }

  function removeRefImage() {
    setRefImage({
      dataUrl: "",
      fileName: "",
      mimeType: "",
      useAsAnchor: true,
    });
  }

  async function generateScenes() {
    try {
      setLoadingScenes(true);
      setError("");
      setScenes([]);
      setPrompts([]);
      setSeo(null);
      setTts(null);
      const extraRefText =
        refImage.dataUrl && refImage.useAsAnchor
          ? `\n\nUploaded reference image is available and should be treated as the identity anchor for recurring characters.`
          : "";
      const scriptWithChars = injectCharactersIntoScript(script, characters) + extraRefText;
      const prompt = buildSceneUserPrompt({ script: scriptWithChars, mode: "shorts", total: 60, characters });
      const raw = await callAPI(prompt, SYS_SCENE_ENGINE);
      const data = cleanJSON(raw);
      setScenes(data.scenes || []);
      setActiveTab("scenes");
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoadingScenes(false);
    }
  }

  async function generateReference() {
    try {
      setLoadingReference(true);
      setError("");
      const extra =
        refImage.dataUrl && refImage.useAsAnchor
          ? `\n\nAn uploaded reference image exists and must be considered the strongest identity anchor. File name: ${refImage.fileName}`
          : "";
      const prompt = buildReferenceUserPrompt({ characters }) + extra;
      const raw = await callAPI(prompt, SYS_REFERENCE_ENGINE);
      const data = cleanJSON(raw);
      setReference(data.reference || null);
      setActiveTab("reference");
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoadingReference(false);
    }
  }

  async function generatePrompts() {
    try {
      setLoadingPrompts(true);
      setError("");
      setPrompts([]);
      const refAnchorText =
        refImage.dataUrl && refImage.useAsAnchor
          ? `\n\nIMPORTANT: Uploaded reference image is present and must be used as the I2V anchor. Prefer I2V for recurring characters. File name: ${refImage.fileName}`
          : "";
      const prompt = buildPromptUserPrompt({ scenes, reference }) + refAnchorText;
      const raw = await callAPI(prompt, SYS_PROMPT_ENGINE);
      const data = cleanJSON(raw);

      let nextPrompts = data.prompts || [];
      if (refImage.dataUrl && refImage.useAsAnchor) {
        nextPrompts = nextPrompts.map((p) => ({
          ...p,
          generation_mode_final: "I2V",
          vidPrompt_EN: `${p.vidPrompt_EN || ""}\n\nUse uploaded reference image as identity anchor for character consistency.`,
        }));
      }

      setPrompts(nextPrompts);
      setActiveTab("prompts");
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoadingPrompts(false);
    }
  }

  async function generateSeo() {
    try {
      setLoadingSeo(true);
      setError("");
      const prompt = buildSeoUserPrompt({ script, scenes, cover });
      const raw = await callAPI(prompt, SYS_SEO_ENGINE);
      const data = cleanJSON(raw);
      setSeo(data.seo || null);
      setActiveTab("seo");
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoadingSeo(false);
    }
  }

  async function generateTts() {
    try {
      setLoadingTts(true);
      setError("");
      const prompt = buildTtsUserPrompt({ scenes, language: lang });
      const raw = await callAPI(prompt, SYS_TTS_ENGINE);
      const data = cleanJSON(raw);
      setTts(data.tts || null);
      setActiveTab("tts");
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoadingTts(false);
    }
  }

  function speakText(text) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "ru" ? "ru-RU" : "en-US";
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  }

  function updateCoverField(field, value) {
    setCover((prev) => ({ ...prev, [field]: value }));
  }

  async function copyText(key, value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 1200);
    } catch {}
  }

  function downloadProjectJson() {
    if (typeof window === "undefined") return;

    const payload = {
      name: projectName.trim() || "NeuroCine Project",
      lang,
      script,
      scenes,
      prompts,
      reference,
      refImage,
      cover,
      seo,
      tts,
      characterForms,
      characters,
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const safeName = (projectName.trim() || "neurocine-project")
      .toLowerCase()
      .replace(/[^a-z0-9а-яіїєґ_-]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName || "neurocine-project"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function importProjectJson(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));

        setProjectName(data.name || "Imported Project");
        setLang(data.lang || "ru");
        setScript(data.script || "");
        setScenes(data.scenes || []);
        setPrompts(data.prompts || []);
        setReference(data.reference || null);
        setRefImage(data.refImage || { dataUrl: "", fileName: "", mimeType: "", useAsAnchor: true });
        setCover(data.cover || {
          preset: "netflix",
          title: "ТВОЯ ИСТОРИЯ",
          subtitle: "КИНОШНЫЙ AI-РОЛИК",
          cta: "СМОТРИ ДО КОНЦА",
          posX: 50,
          posY: 58,
          backgroundPrompt: "dark cinematic background, dramatic contrast, volumetric light, high tension",
        });
        setSeo(data.seo || null);
        setTts(data.tts || null);
        setCharacterForms(data.characterForms || [{ ...makeFormCharacter(1), name: "Alex" }]);
        setCharacters(
          data.characters || [
            buildCharacterDNA({ name: "Alex", gender: "male", age: 28, style: "black tactical jacket, cinematic look" }),
          ]
        );

        setActiveTab("studio");
      } catch (e) {
        alert(t.importError);
      }
    };

    reader.readAsText(file);
  }

  function saveSceneEdits(updated) {
    setScenes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingScene(null);
  }

  function savePromptEdits(updated) {
    setPrompts((prev) => prev.map((p) => (p.scene_id === updated.scene_id ? updated : p)));
    setEditingPrompt(null);
  }

  const exportScenes = JSON.stringify(scenes, null, 2);
  const exportPrompts = JSON.stringify(prompts, null, 2);
  const exportReference = JSON.stringify(reference || {}, null, 2);
  const exportCover = JSON.stringify(cover, null, 2);
  const exportSeo = JSON.stringify(seo || {}, null, 2);
  const exportTts = JSON.stringify(tts || {}, null, 2);
  const exportRefImage = JSON.stringify(
    {
      fileName: refImage.fileName,
      mimeType: refImage.mimeType,
      useAsAnchor: refImage.useAsAnchor,
      hasData: Boolean(refImage.dataUrl),
      dataUrl: refImage.dataUrl,
    },
    null,
    2
  );

  return (
    <main style={styles.page}>
      <div style={styles.bgGlowTop} />
      <div style={styles.bgGlowBottom} />

      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <div style={styles.title}>🎬 {t.appTitle}</div>
            <div style={styles.subtitle}>{t.appSub}</div>
          </div>

          <div style={styles.langWrap}>
            <button onClick={() => setLang("ru")} style={{ ...styles.langBtn, ...(lang === "ru" ? styles.langBtnActive : {}) }}>RU</button>
            <button onClick={() => setLang("en")} style={{ ...styles.langBtn, ...(lang === "en" ? styles.langBtnActive : {}) }}>EN</button>
          </div>
        </header>

        <nav style={styles.tabs}>
          <button onClick={() => setActiveTab("studio")} style={{ ...styles.tabBtn, ...(activeTab === "studio" ? styles.tabBtnActive : {}) }}>{t.tabStudio}</button>
          <button onClick={() => setActiveTab("reference")} style={{ ...styles.tabBtn, ...(activeTab === "reference" ? styles.tabBtnActive : {}) }}>{t.tabReference}</button>
          <button onClick={() => setActiveTab("refimage")} style={{ ...styles.tabBtn, ...(activeTab === "refimage" ? styles.tabBtnActive : {}) }}>{t.tabRefImage}</button>
          <button onClick={() => setActiveTab("scenes")} style={{ ...styles.tabBtn, ...(activeTab === "scenes" ? styles.tabBtnActive : {}) }}>{t.tabScenes}</button>
          <button onClick={() => setActiveTab("prompts")} style={{ ...styles.tabBtn, ...(activeTab === "prompts" ? styles.tabBtnActive : {}) }}>{t.tabPrompts}</button>
          <button onClick={() => setActiveTab("tts")} style={{ ...styles.tabBtn, ...(activeTab === "tts" ? styles.tabBtnActive : {}) }}>{t.tabTts}</button>
          <button onClick={() => setActiveTab("cover")} style={{ ...styles.tabBtn, ...(activeTab === "cover" ? styles.tabBtnActive : {}) }}>{t.tabCover}</button>
          <button onClick={() => setActiveTab("seo")} style={{ ...styles.tabBtn, ...(activeTab === "seo" ? styles.tabBtnActive : {}) }}>{t.tabSeo}</button>
          <button onClick={() => setActiveTab("projects")} style={{ ...styles.tabBtn, ...(activeTab === "projects" ? styles.tabBtnActive : {}) }}>{t.tabProjects}</button>
          <button onClick={() => setActiveTab("export")} style={{ ...styles.tabBtn, ...(activeTab === "export" ? styles.tabBtnActive : {}) }}>{t.tabExport}</button>
        </nav>

        {error ? <div style={styles.errorBox}><b>Error:</b> {error}</div> : null}

        {activeTab === "studio" && (
          <section style={styles.grid}>
            <div style={styles.cardLarge}>
              <div style={styles.cardTitle}>{t.script}</div>

              <label style={styles.label}>
                <span>{t.projectName}</span>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t.projectNamePlaceholder}
                  style={styles.input}
                />
              </label>

              <div style={styles.actions}>
                <button onClick={saveProject} style={styles.secondaryGreenBtn}>💾 {t.saveProject}</button>
                {saveStatus ? <div style={styles.statusPill}>{saveStatus}</div> : <div style={styles.statusGhost}>{t.autoSaved}</div>}
              </div>

              <textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder={t.scriptPlaceholder} style={styles.textarea} />

              <div style={styles.actions}>
                <button onClick={generateScenes} style={styles.primaryBtn}>{loadingScenes ? `⏳ ${t.loading}` : `🚀 ${t.btnScenes}`}</button>
                <button onClick={generateReference} style={styles.secondaryBtn}>{loadingReference ? `⏳ ${t.loading}` : `🖼 ${t.btnReference}`}</button>
                <button onClick={generatePrompts} style={styles.secondaryBlueBtn}>{loadingPrompts ? `⏳ ${t.loading}` : `🎥 ${t.btnPrompts}`}</button>
                <button onClick={generateTts} style={styles.secondaryOrangeBtn}>{loadingTts ? `⏳ ${t.loading}` : `🔊 ${t.btnTts}`}</button>
                <button onClick={generateSeo} style={styles.secondaryGreenBtn}>{loadingSeo ? `⏳ ${t.loading}` : `📈 ${t.btnSeo}`}</button>
              </div>
            </div>

            <div style={styles.cardSide}>
              <div style={styles.cardTitle}>{t.character}</div>
              <div style={styles.actions}>
                <button onClick={addCharacter} style={styles.secondaryBtn}>➕ {t.addCharacter}</button>
                <button onClick={updateCharacters} style={styles.secondaryBlueBtn}>🧬 {t.saveCharacter}</button>
              </div>
              <div style={styles.formGrid}>
                {characterForms.map((c) => (
                  <div key={c.id} style={styles.characterCard}>
                    <div style={styles.sceneHead}>
                      <div style={styles.sceneId}>{c.name || "Character"}</div>
                      {characterForms.length > 1 ? <button onClick={() => removeCharacter(c.id)} style={styles.removeBtn}>{t.removeCharacter}</button> : null}
                    </div>
                    <label style={styles.label}><span>{t.name}</span><input value={c.name} onChange={(e) => updateCharacterField(c.id, "name", e.target.value)} style={styles.input} /></label>
                    <label style={styles.label}><span>{t.gender}</span><select value={c.gender} onChange={(e) => updateCharacterField(c.id, "gender", e.target.value)} style={styles.input}><option value="male">{t.male}</option><option value="female">{t.female}</option></select></label>
                    <label style={styles.label}><span>{t.age}</span><input type="number" value={c.age} onChange={(e) => updateCharacterField(c.id, "age", e.target.value)} style={styles.input} /></label>
                    <label style={styles.label}><span>{t.style}</span><textarea value={c.style} onChange={(e) => updateCharacterField(c.id, "style", e.target.value)} style={{ ...styles.input, minHeight: 90, resize: "vertical" }} /></label>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "refimage" && (
          <section style={styles.grid}>
            <div style={styles.cardLarge}>
              <div style={styles.cardTitle}>{t.refImage}</div>

              <div style={styles.actions}>
                <label style={styles.secondaryBlueBtnLabel}>
                  📤 {t.uploadRef}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleRefImageUpload(e.target.files?.[0])}
                  />
                </label>

                {refImage.dataUrl ? (
                  <button onClick={removeRefImage} style={styles.removeBtn}>
                    {t.removeRef}
                  </button>
                ) : null}
              </div>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={refImage.useAsAnchor}
                  onChange={(e) =>
                    setRefImage((prev) => ({ ...prev, useAsAnchor: e.target.checked }))
                  }
                />
                <span>{t.refImageUsed}</span>
              </label>

              <div style={styles.noteBox}>{t.refNote}</div>

              {refImage.fileName ? (
                <div style={styles.metaText}>
                  <b>{t.refFileName}:</b> {refImage.fileName}
                </div>
              ) : null}

              {refImage.useAsAnchor && refImage.dataUrl ? (
                <div style={styles.statusPill}>{t.refImageActive}</div>
              ) : null}
            </div>

            <div style={styles.cardSide}>
              <div style={styles.cardTitle}>{t.preview}</div>
              {!refImage.dataUrl ? (
                <div style={styles.empty}>{t.noRefImage}</div>
              ) : (
                <div style={styles.refImageWrap}>
                  <img src={refImage.dataUrl} alt="reference" style={styles.refImagePreview} />
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "tts" && (
          <section style={styles.cardFull}>
            <div style={styles.cardTitle}>{t.tts}</div>
            {!tts ? (
              <div style={styles.empty}>{t.noTts}</div>
            ) : (
              <div style={styles.stack}>
                <div style={styles.actions}>
                  <button onClick={() => speakText(tts.full_script || "")} style={styles.secondaryOrangeBtn}>{t.btnSpeak}</button>
                  <button onClick={stopSpeech} style={styles.secondaryBtn}>{t.btnStop}</button>
                </div>

                <div style={styles.sceneBox}>
                  <div><b>{t.ttsFullScript}:</b></div>
                  <div style={styles.codeBlock}>{tts.full_script || ""}</div>
                </div>

                <div style={styles.sceneBox}>
                  <div><b>{t.ttsSegments}:</b></div>
                  <div style={styles.stack}>
                    {(tts.segments || []).map((seg, idx) => (
                      <div key={idx} style={styles.segmentBox}>
                        <div style={styles.sceneHead}>
                          <div style={styles.sceneId}>{seg.scene_id || `segment_${idx + 1}`}</div>
                          <button onClick={() => speakText(seg.text || "")} style={styles.secondaryBtnSmall}>{t.btnSpeak}</button>
                        </div>
                        <div style={styles.codeBlock}>{seg.text || ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "projects" && (
          <section style={styles.cardFull}>
            <div style={styles.cardTitle}>{t.projects}</div>
            {!savedProjects.length ? (
              <div style={styles.empty}>{t.noProjects}</div>
            ) : (
              <div style={styles.stack}>
                {savedProjects.map((project) => (
                  <div key={project.id} style={styles.sceneBox}>
                    <div style={styles.sceneHead}>
                      <div>
                        <div style={styles.sceneId}>{project.name}</div>
                        <div style={styles.metaText}>{t.updatedAt}: {new Date(project.updatedAt || project.createdAt).toLocaleString()}</div>
                        <div style={styles.metaText}>{t.createdAt}: {new Date(project.createdAt).toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => loadProject(project)} style={styles.secondaryBlueBtn}>{t.loadProject}</button>
                        <button onClick={() => deleteProject(project.id)} style={styles.removeBtn}>{t.deleteProject}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "reference" && (
          <section style={styles.cardFull}>
            <div style={styles.cardTitle}>{t.reference}</div>
            {!reference ? <div style={styles.empty}>{t.noReference}</div> : (
              <div style={styles.stack}>
                <div><b>Character:</b> {reference.character_name}</div>
                <div><b>{t.identityLock}:</b> {reference.identity_lock}</div>
                <div><b>{t.outfitLock}:</b> {reference.outfit_lock}</div>
                <div style={styles.codeBlock}>{reference.reference_prompt_EN}</div>
              </div>
            )}
          </section>
        )}

        {activeTab === "scenes" && (
          <section style={styles.cardFull}>
            <div style={styles.cardTitle}>{t.scenes}</div>
            {!scenes.length ? <div style={styles.empty}>{t.noScenes}</div> : (
              <div style={styles.stack}>
                {scenes.map((s, i) => (
                  <div key={i} style={styles.sceneBox}>
                    <div style={styles.sceneHead}>
                      <div style={styles.sceneId}>{s.id}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <div style={styles.badge}>{t.mode}: {s.generation_mode}</div>
                        <button onClick={() => setEditingScene(s)} style={styles.secondaryBtnSmall}>{t.edit}</button>
                      </div>
                    </div>
                    <div><b>{t.goal}:</b> {s.scene_goal}</div>
                    <div><b>{t.voice}:</b> {s.voice}</div>
                    <div><b>{t.visual}:</b> {s.visual}</div>
                    <div><b>{t.camera}:</b> {s.camera}</div>
                    <div><b>{t.motion}:</b> {s.motion}</div>
                    <div><b>{t.lighting}:</b> {s.lighting}</div>
                    <div><b>{t.environment}:</b> {s.environment}</div>
                    <div><b>{t.sfx}:</b> {s.sfx}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "prompts" && (
          <section style={styles.cardFull}>
            <div style={styles.cardTitle}>{t.prompts}</div>
            {!prompts.length ? <div style={styles.empty}>{t.noPrompts}</div> : (
              <div style={styles.stack}>
                {prompts.map((p, i) => (
                  <div key={i} style={styles.sceneBox}>
                    <div style={styles.sceneHead}>
                      <div style={styles.sceneId}>{p.scene_id}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <div style={styles.badge}>{t.mode}: {p.generation_mode_final}</div>
                        <button onClick={() => setEditingPrompt(p)} style={styles.secondaryBtnSmall}>{t.edit}</button>
                      </div>
                    </div>
                    <div><b>{t.imgPrompt}:</b></div>
                    <div style={styles.codeBlock}>{p.imgPrompt_EN}</div>
                    <div><b>{t.vidPrompt}:</b></div>
                    <div style={styles.codeBlock}>{p.vidPrompt_EN}</div>
                    <div><b>{t.negative}:</b></div>
                    <div style={styles.codeBlock}>{p.negative_prompt}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "cover" && (
          <section style={styles.grid}>
            <div style={styles.cardLarge}>
              <div style={styles.cardTitle}>{t.cover}</div>
              <div style={styles.formGrid}>
                <label style={styles.label}>
                  <span>{t.preset}</span>
                  <select value={cover.preset} onChange={(e) => updateCoverField("preset", e.target.value)} style={styles.input}>
                    {Object.entries(COVER_PRESETS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                  </select>
                </label>
                <label style={styles.label}><span>{t.coverTitle}</span><input value={cover.title} onChange={(e) => updateCoverField("title", e.target.value)} style={styles.input} /></label>
                <label style={styles.label}><span>{t.coverSubtitle}</span><input value={cover.subtitle} onChange={(e) => updateCoverField("subtitle", e.target.value)} style={styles.input} /></label>
                <label style={styles.label}><span>{t.coverCta}</span><input value={cover.cta} onChange={(e) => updateCoverField("cta", e.target.value)} style={styles.input} /></label>
                <label style={styles.label}><span>{t.bgPrompt}</span><textarea value={cover.backgroundPrompt} onChange={(e) => updateCoverField("backgroundPrompt", e.target.value)} style={{ ...styles.input, minHeight: 90, resize: "vertical" }} /></label>
                <label style={styles.label}><span>{t.posX}: {cover.posX}</span><input type="range" min="0" max="100" value={cover.posX} onChange={(e) => updateCoverField("posX", Number(e.target.value))} /></label>
                <label style={styles.label}><span>{t.posY}: {cover.posY}</span><input type="range" min="0" max="100" value={cover.posY} onChange={(e) => updateCoverField("posY", Number(e.target.value))} /></label>
              </div>
            </div>

            <div style={styles.cardSide}>
              <div style={styles.cardTitle}>{t.preview}</div>
              <div style={styles.coverPreview}>
                <div style={styles.coverBg} />
                <div
                  style={{
                    ...styles.coverTextWrap,
                    textAlign: preset.align,
                    left: `${cover.posX}%`,
                    top: `${cover.posY}%`,
                    transform: preset.transform,
                  }}
                >
                  <div style={{ ...styles.coverHook, color: preset.hookColor, fontSize: preset.hookSize }}>{cover.subtitle}</div>
                  <div
                    style={{
                      ...styles.coverTitle,
                      color: preset.titleColor,
                      fontSize: preset.titleSize,
                      fontWeight: preset.titleWeight,
                      fontFamily: preset.titleFont,
                      WebkitTextStroke: preset.titleStroke,
                      textShadow: preset.titleShadow,
                    }}
                  >
                    {cover.title}
                  </div>
                  <div style={{ ...styles.coverCta, background: preset.ctaBg }}>{cover.cta}</div>
                </div>
              </div>
              <div style={styles.codeBlock}>{cover.backgroundPrompt}</div>
            </div>
          </section>
        )}

        {activeTab === "seo" && (
          <section style={styles.cardFull}>
            <div style={styles.cardTitle}>{t.seo}</div>
            {!seo ? (
              <div style={styles.empty}>{t.noSeo}</div>
            ) : (
              <div style={styles.stack}>
                <div style={styles.sceneBox}>
                  <div><b>{t.seoTitle}:</b></div>
                  <div style={styles.codeBlock}>{seo.title || ""}</div>
                </div>
                <div style={styles.sceneBox}>
                  <div><b>{t.seoYoutube}:</b></div>
                  <div style={styles.codeBlock}>{seo.youtube_shorts_title || ""}</div>
                </div>
                <div style={styles.sceneBox}>
                  <div><b>{t.seoDescription}:</b></div>
                  <div style={styles.codeBlock}>{seo.description || ""}</div>
                </div>
                <div style={styles.sceneBox}>
                  <div><b>{t.seoHashtags}:</b></div>
                  <div style={styles.codeBlock}>
                    {Array.isArray(seo.hashtags) ? seo.hashtags.join(" ") : ""}
                  </div>
                </div>
                <div style={styles.sceneBox}>
                  <div><b>{t.seoTikTok}:</b></div>
                  <div style={styles.codeBlock}>{seo.tiktok_caption || ""}</div>
                </div>
                <div style={styles.sceneBox}>
                  <div><b>{t.seoFacebook}:</b></div>
                  <div style={styles.codeBlock}>{seo.facebook_post || ""}</div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "export" && (
          <section style={styles.cardFull}>
            <div style={styles.cardTitle}>{t.export}</div>

            <div style={styles.actions}>
              <button onClick={downloadProjectJson} style={styles.secondaryBlueBtn}>
                ⬇️ {t.downloadJson}
              </button>

              <label style={styles.secondaryBtn}>
                📂 {t.importJson}
                <input
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={(e) => importProjectJson(e.target.files?.[0])}
                />
              </label>
            </div>

            <div style={styles.stack}>
              <div style={styles.exportBlock}>
                <div style={styles.sceneHead}>
                  <div style={styles.sceneId}>{t.exportScenes}</div>
                  <button onClick={() => copyText("scenes", exportScenes)} style={styles.secondaryBtn}>
                    {copiedKey === "scenes" ? t.copied : t.copy}
                  </button>
                </div>
                <div style={styles.codeBlock}>{exportScenes}</div>
              </div>

              <div style={styles.exportBlock}>
                <div style={styles.sceneHead}>
                  <div style={styles.sceneId}>{t.exportPrompts}</div>
                  <button onClick={() => copyText("prompts", exportPrompts)} style={styles.secondaryBtn}>
                    {copiedKey === "prompts" ? t.copied : t.copy}
                  </button>
                </div>
                <div style={styles.codeBlock}>{exportPrompts}</div>
              </div>

              <div style={styles.exportBlock}>
                <div style={styles.sceneHead}>
                  <div style={styles.sceneId}>{t.exportReference}</div>
                  <button onClick={() => copyText("reference", exportReference)} style={styles.secondaryBtn}>
                    {copiedKey === "reference" ? t.copied : t.copy}
                  </button>
                </div>
                <div style={styles.codeBlock}>{exportReference}</div>
              </div>

              <div style={styles.exportBlock}>
                <div style={styles.sceneHead}>
                  <div style={styles.sceneId}>{t.exportRefImage}</div>
                  <button onClick={() => copyText("refimage", exportRefImage)} style={styles.secondaryBtn}>
                    {copiedKey === "refimage" ? t.copied : t.copy}
                  </button>
                </div>
                <div style={styles.codeBlock}>{exportRefImage}</div>
              </div>

              <div style={styles.exportBlock}>
                <div style={styles.sceneHead}>
                  <div style={styles.sceneId}>{t.exportCover}</div>
                  <button onClick={() => copyText("cover", exportCover)} style={styles.secondaryBtn}>
                    {copiedKey === "cover" ? t.copied : t.copy}
                  </button>
                </div>
                <div style={styles.codeBlock}>{exportCover}</div>
              </div>

              <div style={styles.exportBlock}>
                <div style={styles.sceneHead}>
                  <div style={styles.sceneId}>{t.exportSeo}</div>
                  <button onClick={() => copyText("seo", exportSeo)} style={styles.secondaryBtn}>
                    {copiedKey === "seo" ? t.copied : t.copy}
                  </button>
                </div>
                <div style={styles.codeBlock}>{exportSeo}</div>
              </div>

              <div style={styles.exportBlock}>
                <div style={styles.sceneHead}>
                  <div style={styles.sceneId}>{t.exportTts}</div>
                  <button onClick={() => copyText("tts", exportTts)} style={styles.secondaryBtn}>
                    {copiedKey === "tts" ? t.copied : t.copy}
                  </button>
                </div>
                <div style={styles.codeBlock}>{exportTts}</div>
              </div>
            </div>
          </section>
        )}
      </div>

      <SceneEditorModal scene={editingScene} t={t} onClose={() => setEditingScene(null)} onSave={saveSceneEdits} />
      <PromptEditorModal prompt={editingPrompt} t={t} onClose={() => setEditingPrompt(null)} onSave={savePromptEdits} />
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#06070d", color: "#fff", position: "relative", overflow: "hidden", fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: "20px 14px 50px" },
  bgGlowTop: { position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 500, height: 500, background: "radial-gradient(circle, rgba(124,58,237,0.22), transparent 65%)", pointerEvents: "none" },
  bgGlowBottom: { position: "absolute", bottom: -180, right: -80, width: 420, height: 420, background: "radial-gradient(circle, rgba(59,130,246,0.16), transparent 65%)", pointerEvents: "none" },
  shell: { maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 2 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 },
  title: { fontSize: 40, fontWeight: 900, letterSpacing: "-0.05em" },
  subtitle: { color: "#a1a1aa", marginTop: 4 },
  langWrap: { display: "flex", gap: 8 },
  langBtn: { padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontWeight: 700 },
  langBtnActive: { background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "1px solid rgba(168,85,247,0.7)" },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 },
  tabBtn: { padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontWeight: 700 },
  tabBtnActive: { background: "rgba(124,58,237,0.18)", border: "1px solid rgba(168,85,247,0.45)" },
  errorBox: { marginBottom: 14, padding: 12, borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" },
  grid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 },
  cardLarge: { background: "rgba(14,14,24,0.92)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: 18, padding: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.25)" },
  cardSide: { background: "rgba(14,14,24,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.25)" },
  cardFull: { background: "rgba(14,14,24,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.25)" },
  cardTitle: { fontSize: 22, fontWeight: 900, marginBottom: 14 },
  textarea: { width: "100%", minHeight: 180, resize: "vertical", borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", padding: 16, fontSize: 16, outline: "none", boxSizing: "border-box" },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, marginBottom: 14 },
  primaryBtn: { padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(168,85,247,0.45)", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontWeight: 800, fontSize: 15 },
  secondaryBtn: { padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" },
  secondaryBlueBtn: { padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(59,130,246,0.45)", background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#fff", fontWeight: 800, fontSize: 15 },
  secondaryGreenBtn: { padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(16,185,129,0.45)", background: "linear-gradient(135deg, #059669, #10b981)", color: "#fff", fontWeight: 800, fontSize: 15 },
  secondaryOrangeBtn: { padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(249,115,22,0.45)", background: "linear-gradient(135deg, #ea580c, #f97316)", color: "#fff", fontWeight: 800, fontSize: 15 },
  secondaryBlueBtnLabel: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(59,130,246,0.45)", background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" },
  secondaryBtnSmall: { padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 700, fontSize: 12 },
  formGrid: { display: "grid", gap: 12 },
  exportBlock: { display: "grid", gap: 8 },
  characterCard: { padding: 12, borderRadius: 14, background: "#0f172a", border: "1px solid #334155", display: "grid", gap: 10 },
  label: { display: "grid", gap: 6, fontSize: 14, color: "#d4d4d8" },
  input: { width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", boxSizing: "border-box" },
  empty: { padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.03)", color: "#a1a1aa" },
  stack: { display: "grid", gap: 14 },
  sceneBox: { padding: 14, borderRadius: 14, background: "#0f172a", border: "1px solid #334155", display: "grid", gap: 8 },
  segmentBox: { padding: 12, borderRadius: 12, background: "#111827", border: "1px solid #334155" },
  sceneHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 2 },
  sceneId: { fontSize: 18, fontWeight: 900 },
  badge: { fontSize: 12, color: "#c4b5fd", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)", padding: "6px 10px", borderRadius: 999 },
  codeBlock: { marginTop: 6, padding: 12, borderRadius: 10, background: "#020617", border: "1px solid #334155", whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#e4e4e7", overflowX: "auto" },
  removeBtn: { padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.1)", color: "#fca5a5", fontWeight: 700 },
  coverPreview: { position: "relative", width: "100%", aspectRatio: "9 / 16", overflow: "hidden", borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", background: "#0b1120", marginBottom: 14 },
  coverBg: { position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 20%, rgba(168,85,247,0.35), transparent 30%), radial-gradient(circle at 70% 80%, rgba(59,130,246,0.22), transparent 30%), linear-gradient(180deg, #0f172a 0%, #020617 100%)" },
  coverTextWrap: { position: "absolute", width: "82%" },
  coverHook: { fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, textShadow: "0 2px 10px rgba(0,0,0,0.8)" },
  coverTitle: { lineHeight: 1.05, textTransform: "uppercase", marginBottom: 10 },
  coverCta: { display: "inline-block", fontSize: 12, fontWeight: 900, color: "#fff", padding: "8px 14px", borderRadius: 999, boxShadow: "0 6px 16px rgba(0,0,0,0.35)", letterSpacing: 1 },
  statusPill: { display: "inline-flex", alignItems: "center", padding: "10px 12px", borderRadius: 999, background: "rgba(16,185,129,0.16)", color: "#86efac", border: "1px solid rgba(16,185,129,0.35)", fontWeight: 700 },
  statusGhost: { display: "inline-flex", alignItems: "center", padding: "10px 12px", borderRadius: 999, background: "rgba(255,255,255,0.04)", color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.08)", fontWeight: 700 },
  metaText: { color: "#a1a1aa", fontSize: 13, marginTop: 4 },
  noteBox: { padding: 12, borderRadius: 12, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#bfdbfe", lineHeight: 1.5 },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12, color: "#e4e4e7" },
  refImageWrap: { borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#020617" },
  refImagePreview: { display: "block", width: "100%", height: "auto", objectFit: "cover" },
};

const modal = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 },
  panel: { width: "min(900px, 100%)", maxHeight: "90vh", overflow: "auto", background: "#0b1120", border: "1px solid #334155", borderRadius: 18, padding: 16, color: "#fff" },
  header: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 900 },
  closeBtn: { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 700 },
  grid: { display: "grid", gap: 12 },
  label: { display: "grid", gap: 6, fontSize: 14, color: "#d4d4d8" },
  input: { width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", boxSizing: "border-box" },
  textarea: { width: "100%", minHeight: 80, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", resize: "vertical", boxSizing: "border-box" },
  textareaLg: { width: "100%", minHeight: 160, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", resize: "vertical", boxSizing: "border-box" },
  actions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  primary: { padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(59,130,246,0.45)", background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#fff", fontWeight: 800 },
  secondary: { padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 800 },
};
