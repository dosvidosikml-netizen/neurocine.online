import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminSupabase, getServerAccount } from "../../../../lib/serverSupabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "trailer_local_jobs";
const JOB_SELECT_META = "id,part_index,part_label,project_name,provider,status,payload,error,created_at,updated_at,started_at,completed_at,agent_token";
const JOB_SELECT_WITH_IMAGE = "id,part_index,part_label,project_name,provider,status,payload,error,image_data,created_at,updated_at,started_at,completed_at,agent_token";
const ACTIVE_JOB_STATUSES = ["queued", "running"];
const PC_COMMAND_PROVIDER = "pc-command";
const PC_COMMAND_PROMPT = "__pc_command__";
const AGENT_ONLINE_TTL_MS = 45000;
const WORKER_QUEUE_TTL_MS = 30000;
const RUNNING_JOB_STALE_MS = 180000;
const PC_COMMANDS = {
  status: "Проверить ПК",
  production_check: "Проверить production",
  install_production: "Установить production",
  start_comfyui: "Запустить ComfyUI",
  restart_comfyui: "Перезапустить ComfyUI",
  restart_agent: "Перезапустить агента",
  sleep_pc: "Сон ПК",
  reboot_pc: "Перезагрузить ПК",
};
const memoryStore = globalThis.__neurocineTrailerLocalJobs || new Map();
globalThis.__neurocineTrailerLocalJobs = memoryStore;

function nowIso() {
  return new Date().toISOString();
}

function timeMs(value = "") {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : 0;
}

function cleanToken(value) {
  return String(value || "").trim().slice(0, 200);
}

function clampProgress(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function isMissingTableError(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("relation");
}

function publicJob(row = {}) {
  const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
  return {
    id: row.id,
    part_index: Number(row.part_index || 0),
    part_label: row.part_label || `PART ${Number(row.part_index || 0) + 1}`,
    project_name: row.project_name || "",
    provider: row.provider || "comfyui",
    status: row.status || "queued",
    error: row.error || "",
    image_data: row.image_data || "",
    updated_at: row.updated_at || row.created_at || "",
    created_at: row.created_at || "",
    started_at: row.started_at || "",
    completed_at: row.completed_at || "",
    progress: Number.isFinite(Number(payload.progress)) ? clampProgress(payload.progress) : null,
    progress_message: String(payload.progress_message || "").slice(0, 300),
    progress_stage: String(payload.progress_stage || "").slice(0, 120),
    completion_message: String(payload.completion_message || "").slice(0, 800),
    output_meta: payload.output_meta && typeof payload.output_meta === "object" ? {
      bytes: Math.max(0, Number(payload.output_meta.bytes || 0) || 0),
      width: Math.max(0, Number(payload.output_meta.width || 0) || 0),
      height: Math.max(0, Number(payload.output_meta.height || 0) || 0),
      mime: cleanQueueText(payload.output_meta.mime, 80),
    } : null,
    project_session_id: String(payload.project_session_id || "").slice(0, 120),
    command: String(payload.command || "").slice(0, 80),
    command_label: String(payload.command_label || "").slice(0, 120),
    has_image: Boolean(row.image_data),
  };
}

function publicAgent(row = {}) {
  const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
  const lastSeenAt = row.updated_at || row.created_at || "";
  const lastSeenMs = timeMs(lastSeenAt);
  const heartbeatAgeMs = lastSeenMs ? Math.max(0, Date.now() - lastSeenMs) : Infinity;
  const online = Boolean(lastSeenMs && heartbeatAgeMs <= AGENT_ONLINE_TTL_MS);
  const workerOk = online && payload.worker_ok === true;
  const rawQueue = payload.worker_queue && typeof payload.worker_queue === "object" ? payload.worker_queue : null;
  const queueUpdatedMs = timeMs(rawQueue?.updated_at || lastSeenAt);
  const queueAgeMs = queueUpdatedMs ? Math.max(0, Date.now() - queueUpdatedMs) : Infinity;
  const queueFresh = online && Boolean(rawQueue) && queueAgeMs <= WORKER_QUEUE_TTL_MS;
  const workerQueue = queueFresh
    ? rawQueue
    : rawQueue
      ? {
          ...rawQueue,
          active: false,
          running_count: 0,
          pending_count: 0,
          status: online ? "stale" : "offline",
          current: {},
          stale: true,
          stale_reason: online ? "worker queue heartbeat is stale" : "agent heartbeat is offline",
        }
      : null;
  return {
    online,
    provider: payload.provider || row.provider || "comfyui",
    worker_url: payload.worker_url || "",
    worker_ok: workerOk,
    worker_error: online ? (payload.worker_error || row.error || "") : "agent heartbeat is stale",
    worker_queue: workerQueue,
    production_readiness: payload.production_readiness || rawQueue?.production_readiness || null,
    last_seen_at: lastSeenAt,
    updated_at: row.updated_at || "",
    heartbeat_age_ms: Number.isFinite(heartbeatAgeMs) ? heartbeatAgeMs : null,
    worker_queue_age_ms: Number.isFinite(queueAgeMs) ? queueAgeMs : null,
  };
}

function cleanQueueText(value = "", max = 220) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeReadinessItem(item = {}) {
  return {
    key: cleanQueueText(item.key, 80),
    label: cleanQueueText(item.label, 220),
    file: cleanQueueText(item.file, 220),
    ok: item.ok === true,
    required: item.required !== false,
  };
}

function normalizeProductionReadiness(value = null) {
  if (!value || typeof value !== "object") return null;
  const missing = Array.isArray(value.missing) ? value.missing.map((x) => cleanQueueText(x, 220)).filter(Boolean).slice(0, 20) : [];
  const warnings = Array.isArray(value.warnings) ? value.warnings.map((x) => cleanQueueText(x, 220)).filter(Boolean).slice(0, 20) : [];
  return {
    status: cleanQueueText(value.status, 60),
    ready: value.ready === true,
    checked_at: cleanQueueText(value.checked_at || value.checkedAt, 80),
    comfyui_dir: cleanQueueText(value.comfyui_dir || value.comfyuiDir, 260),
    worker_online: value.worker_online === true || value.workerOnline === true,
    missing,
    warnings,
    models: Array.isArray(value.models) ? value.models.map(normalizeReadinessItem).slice(0, 20) : [],
    nodes: Array.isArray(value.nodes) ? value.nodes.map(normalizeReadinessItem).slice(0, 20) : [],
  };
}

function normalizeWorkerQueue(value = null) {
  if (!value || typeof value !== "object") return null;
  const current = value.current && typeof value.current === "object" ? value.current : {};
  return {
    active: value.active === true,
    running_count: Math.max(0, Math.min(20, Number(value.running_count || value.runningCount || 0) || 0)),
    pending_count: Math.max(0, Math.min(200, Number(value.pending_count || value.pendingCount || 0) || 0)),
    status: cleanQueueText(value.status, 80),
    updated_at: cleanQueueText(value.updated_at || value.updatedAt, 60),
    error: cleanQueueText(value.error, 300),
    production_readiness: normalizeProductionReadiness(value.production_readiness || value.productionReadiness),
    current: {
      prompt_id: cleanQueueText(current.prompt_id || current.promptId, 120),
      part: cleanQueueText(current.part, 80),
      frame: cleanQueueText(current.frame, 80),
      label: cleanQueueText(current.label, 160),
      filename_prefix: cleanQueueText(current.filename_prefix || current.filenamePrefix, 160),
      checkpoint: cleanQueueText(current.checkpoint, 160),
      size: cleanQueueText(current.size, 80),
      steps: Math.max(0, Math.min(200, Number(current.steps || 0) || 0)),
      cfg: Math.max(0, Math.min(30, Number(current.cfg || 0) || 0)),
      sampler: cleanQueueText(current.sampler, 120),
      scheduler: cleanQueueText(current.scheduler, 120),
      visual_beat: cleanQueueText(current.visual_beat || current.visualBeat, 260),
    },
  };
}

function insertMemory(rows = []) {
  const saved = rows.map((row) => {
    const next = {
      ...row,
      id: row.id || randomUUID(),
      status: row.status || "queued",
      created_at: row.created_at || nowIso(),
      updated_at: nowIso(),
    };
    memoryStore.set(next.id, next);
    return next;
  });
  return saved;
}

function memoryHeartbeat(agentToken, patch = null) {
  const existing = Array.from(memoryStore.values()).find((row) => row.agent_token === agentToken && row.status === "agent_heartbeat");
  if (!patch) return existing ? publicAgent(existing) : null;
  const next = existing
    ? { ...existing, ...patch, updated_at: nowIso() }
    : {
        id: randomUUID(),
        user_id: null,
        agent_token: agentToken,
        project_name: "NeuroCine Local Agent",
        part_index: -1,
        part_label: "AGENT HEARTBEAT",
        status: "agent_heartbeat",
        prompt: "__heartbeat__",
        negative_prompt: "",
        image_data: "",
        created_at: nowIso(),
        updated_at: nowIso(),
        ...patch,
      };
  memoryStore.set(next.id, next);
  return publicAgent(next);
}

function listMemory({ agentToken, ids = [], limit = 10, pendingOnly = false }) {
  let rows = Array.from(memoryStore.values()).filter((row) => row.agent_token === agentToken);
  if (ids.length) rows = rows.filter((row) => ids.includes(row.id));
  if (pendingOnly) rows = rows.filter((row) => row.status === "queued");
  rows.sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
  return rows.slice(0, limit);
}

function updateMemory(id, agentToken, patch = {}) {
  const row = memoryStore.get(id);
  if (!row || row.agent_token !== agentToken) return null;
  const next = { ...row, ...patch, updated_at: nowIso() };
  memoryStore.set(id, next);
  return next;
}

function projectSessionIdOf(row = {}) {
  const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
  return String(payload.project_session_id || "").trim();
}

function jobDedupeKey(row = {}) {
  return [
    cleanToken(row.agent_token),
    projectSessionIdOf(row),
    String(row.project_name || "").trim().toLowerCase(),
    String(row.provider || "comfyui").trim().toLowerCase(),
    Number(row.part_index || 0),
  ].join("|");
}

function uniqueRowsByPart(rows = []) {
  const seen = new Set();
  const unique = [];
  for (const row of rows) {
    const key = jobDedupeKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

function mergeRowsById(rows = []) {
  const merged = new Map();
  rows.forEach((row) => {
    if (!row?.id) return;
    const prev = merged.get(row.id) || {};
    merged.set(row.id, { ...prev, ...row });
  });
  return Array.from(merged.values());
}

function activeMemoryDuplicates(agentToken, rows = []) {
  const wanted = new Set(rows.map(jobDedupeKey));
  return Array.from(memoryStore.values())
    .filter((row) => row.agent_token === agentToken && ACTIVE_JOB_STATUSES.includes(row.status) && wanted.has(jobDedupeKey(row)));
}

async function createJobs(req, body) {
  const account = await getServerAccount(req);

  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const projectSessionId = String(body.project_session_id || body.projectSessionId || "").trim().slice(0, 120);
  const jobs = Array.isArray(body.jobs) ? body.jobs : [];
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });
  if (!jobs.length) return NextResponse.json({ ok: false, error: "Нет заданий для очереди." }, { status: 400 });

  const rows = uniqueRowsByPart(jobs.map((job, index) => ({
    user_id: account.ok ? (account.user?.id || null) : null,
    agent_token: agentToken,
    project_name: String(body.project_name || job.project_name || "NeuroCine Trailer").slice(0, 200),
    part_index: Number.isFinite(Number(job.part_index)) ? Number(job.part_index) : index,
    part_label: String(job.part_label || `PART ${index + 1}`).slice(0, 80),
    provider: String(job.provider || body.provider || "comfyui").slice(0, 40),
    status: "queued",
    prompt: String(job.prompt || "").slice(0, 120000),
    negative_prompt: String(job.negative_prompt || body.negative_prompt || "").slice(0, 20000),
    payload: {
      ...(job.payload && typeof job.payload === "object" ? job.payload : {}),
      ...(projectSessionId ? { project_session_id: projectSessionId } : {}),
    },
    error: "",
    image_data: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  })).filter((row) => row.prompt));

  if (!rows.length) return NextResponse.json({ ok: false, error: "В заданиях нет prompt." }, { status: 400 });

  const admin = createAdminSupabase();
  if (admin) {
    const partIndexes = [...new Set(rows.map((row) => row.part_index))];
    const { data: existing, error: existingError } = await admin
      .from(TABLE)
      .select(JOB_SELECT_META)
      .eq("agent_token", agentToken)
      .in("status", ACTIVE_JOB_STATUSES)
      .in("part_index", partIndexes);
    if (existingError && !isMissingTableError(existingError)) return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });

    if (!existingError) {
      const existingByKey = new Map((existing || []).map((row) => [jobDedupeKey(row), row]));
      const rowsToInsert = rows.filter((row) => !existingByKey.has(jobDedupeKey(row)));
      const skipped = rows.length - rowsToInsert.length;
      if (!rowsToInsert.length) {
        const jobsOut = rows.map((row) => existingByKey.get(jobDedupeKey(row))).filter(Boolean).map(publicJob);
        return NextResponse.json({
          ok: true,
          mode: "supabase",
          jobs: jobsOut,
          inserted_count: 0,
          skipped_duplicate_count: skipped,
          auth_required: false,
          auth_mode: account.ok ? "user" : "agent_token",
          auth_warning: account.ok ? "" : (account.message || "Очередь проверена по agent_token без активной Google-сессии."),
        });
      }

      const { data, error } = await admin
        .from(TABLE)
        .insert(rowsToInsert)
        .select(JOB_SELECT_META);
      if (!error) {
        const inserted = data || [];
        const allByKey = new Map([...existingByKey, ...inserted.map((row) => [jobDedupeKey(row), row])]);
        const jobsOut = rows.map((row) => allByKey.get(jobDedupeKey(row))).filter(Boolean).map(publicJob);
        return NextResponse.json({
          ok: true,
          mode: "supabase",
          jobs: jobsOut,
          inserted_count: inserted.length,
          skipped_duplicate_count: skipped,
          auth_required: false,
          auth_mode: account.ok ? "user" : "agent_token",
          auth_warning: account.ok ? "" : (account.message || "Очередь создана по agent_token без активной Google-сессии."),
        });
      }
      if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  const existing = activeMemoryDuplicates(agentToken, rows);
  const existingByKey = new Map(existing.map((row) => [jobDedupeKey(row), row]));
  const rowsToInsert = rows.filter((row) => !existingByKey.has(jobDedupeKey(row)));
  const saved = insertMemory(rowsToInsert);
  const allByKey = new Map([...existingByKey, ...saved.map((row) => [jobDedupeKey(row), row])]);
  return NextResponse.json({
    ok: true,
    mode: "memory",
    jobs: rows.map((row) => allByKey.get(jobDedupeKey(row))).filter(Boolean).map(publicJob),
    inserted_count: saved.length,
    skipped_duplicate_count: rows.length - rowsToInsert.length,
    auth_required: false,
    auth_mode: account.ok ? "user" : "agent_token",
    auth_warning: account.ok ? "" : (account.message || "Очередь создана по agent_token без активной Google-сессии."),
  });
}

async function pollJobs(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const limit = Math.max(1, Math.min(8, Number(body.limit || 1)));
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });

  const admin = createAdminSupabase();
  if (admin) {
    const staleBefore = new Date(Date.now() - RUNNING_JOB_STALE_MS).toISOString();
    await admin
      .from(TABLE)
      .update({
        status: "queued",
        updated_at: nowIso(),
        started_at: null,
        error: "",
      })
      .eq("agent_token", agentToken)
      .eq("status", "running")
      .neq("provider", PC_COMMAND_PROVIDER)
      .lt("updated_at", staleBefore);

    const { data, error } = await admin
      .from(TABLE)
      .select("id,part_index,part_label,project_name,provider,status,prompt,negative_prompt,payload,created_at,updated_at,started_at,completed_at")
      .eq("agent_token", agentToken)
      .eq("status", "queued")
      .neq("provider", PC_COMMAND_PROVIDER)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (!error) {
      const ids = (data || []).map((row) => row.id);
      if (ids.length) {
        await admin.from(TABLE).update({ status: "running", updated_at: nowIso(), started_at: nowIso() }).in("id", ids).eq("agent_token", agentToken);
      }
      return NextResponse.json({ ok: true, mode: "supabase", jobs: data || [] });
    }
    if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const staleBeforeMs = Date.now() - RUNNING_JOB_STALE_MS;
  Array.from(memoryStore.values())
    .filter((row) => row.agent_token === agentToken && row.status === "running" && row.provider !== PC_COMMAND_PROVIDER && timeMs(row.updated_at) && timeMs(row.updated_at) < staleBeforeMs)
    .forEach((row) => updateMemory(row.id, agentToken, { status: "queued", started_at: null, error: "" }));

  const rows = Array.from(memoryStore.values())
    .filter((row) => row.agent_token === agentToken && row.status === "queued" && row.provider !== PC_COMMAND_PROVIDER)
    .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")))
    .slice(0, limit);
  rows.forEach((row) => updateMemory(row.id, agentToken, { status: "running", started_at: nowIso() }));
  return NextResponse.json({ ok: true, mode: "memory", jobs: rows.map((row) => ({ ...row, status: "running" })) });
}

function normalizePcCommand(value) {
  const command = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
  return PC_COMMANDS[command] ? command : "";
}

async function createPcCommand(req, body) {
  const account = await getServerAccount(req);
  if (!account.ok) {
    return NextResponse.json({ ok: false, error: account.message || "Нужно войти через Google." }, { status: account.status || 401 });
  }

  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const command = normalizePcCommand(body.command);
  const projectSessionId = String(body.project_session_id || body.projectSessionId || "").trim().slice(0, 120);
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });
  if (!command) return NextResponse.json({ ok: false, error: "Команда ПК не разрешена." }, { status: 400 });

  const row = {
    user_id: account.user?.id || null,
    agent_token: agentToken,
    project_name: "NeuroCine PC Command",
    part_index: -100,
    part_label: PC_COMMANDS[command],
    provider: PC_COMMAND_PROVIDER,
    status: "queued",
    prompt: PC_COMMAND_PROMPT,
    negative_prompt: "",
    payload: {
      command,
      command_label: PC_COMMANDS[command],
      ...(projectSessionId ? { project_session_id: projectSessionId } : {}),
    },
    error: "",
    image_data: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .insert(row)
      .select(JOB_SELECT_META)
      .maybeSingle();
    if (!error) return NextResponse.json({ ok: true, mode: "supabase", command: publicJob(data || {}) });
    if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const saved = insertMemory([row])[0];
  return NextResponse.json({ ok: true, mode: "memory", command: publicJob(saved) });
}

async function pollPcCommands(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const limit = Math.max(1, Math.min(4, Number(body.limit || 2)));
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });

  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .select("id,part_index,part_label,project_name,provider,status,prompt,negative_prompt,payload,created_at,updated_at,started_at,completed_at")
      .eq("agent_token", agentToken)
      .eq("provider", PC_COMMAND_PROVIDER)
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(limit);
    if (!error) {
      const ids = (data || []).map((row) => row.id);
      if (ids.length) {
        await admin.from(TABLE).update({ status: "running", updated_at: nowIso(), started_at: nowIso() }).in("id", ids).eq("agent_token", agentToken);
      }
      return NextResponse.json({ ok: true, mode: "supabase", commands: data || [] });
    }
    if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = Array.from(memoryStore.values())
    .filter((row) => row.agent_token === agentToken && row.provider === PC_COMMAND_PROVIDER && row.status === "queued")
    .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")))
    .slice(0, limit);
  rows.forEach((row) => updateMemory(row.id, agentToken, { status: "running", started_at: nowIso() }));
  return NextResponse.json({ ok: true, mode: "memory", commands: rows.map((row) => ({ ...row, status: "running" })) });
}

async function completeJob(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const id = String(body.id || body.job_id || "").trim();
  if (!agentToken || !id) return NextResponse.json({ ok: false, error: "Нужен token и job_id." }, { status: 400 });

  const status = body.status === "failed" || (body.error && body.status !== "done") ? "failed" : "done";
  const completionMessage = String(body.message || body.result_message || "").slice(0, 800);
  const outputMeta = body.output_meta && typeof body.output_meta === "object" ? {
    bytes: Math.max(0, Number(body.output_meta.bytes || 0) || 0),
    width: Math.max(0, Number(body.output_meta.width || 0) || 0),
    height: Math.max(0, Number(body.output_meta.height || 0) || 0),
    mime: cleanQueueText(body.output_meta.mime, 80),
  } : null;
  const patch = {
    status,
    image_data: status === "done" ? String(body.image || body.image_data || "").trim() : "",
    error: status === "failed" ? String(body.error || "Local render failed").slice(0, 4000) : "",
    completed_at: nowIso(),
    updated_at: nowIso(),
  };

  const admin = createAdminSupabase();
  if (admin) {
    const { data: existing, error: existingError } = await admin
      .from(TABLE)
      .select(JOB_SELECT_META)
      .eq("id", id)
      .eq("agent_token", agentToken)
      .maybeSingle();
    if (!existingError && existing?.status === "cancelled") {
      return NextResponse.json({ ok: true, mode: "supabase", job: publicJob(existing), ignored: true });
    }
    if (existingError && !isMissingTableError(existingError)) return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
    const existingPayload = existing?.payload && typeof existing.payload === "object" ? existing.payload : {};
    const updatePatch = completionMessage || outputMeta
      ? {
          ...patch,
          payload: {
            ...existingPayload,
            ...(outputMeta ? { output_meta: outputMeta } : {}),
            completion_message: completionMessage,
            progress_message: completionMessage || existingPayload.progress_message || "",
            progress_stage: status === "done" ? "done" : "failed",
            progress: 100,
          },
        }
      : patch;

    const { data, error } = await admin
      .from(TABLE)
      .update(updatePatch)
      .eq("id", id)
      .eq("agent_token", agentToken)
      .select(JOB_SELECT_META)
      .maybeSingle();
    if (!error) return NextResponse.json({ ok: true, mode: "supabase", job: publicJob(data || {}) });
    if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const current = memoryStore.get(id);
  if (current?.status === "cancelled") {
    return NextResponse.json({ ok: true, mode: "memory", job: publicJob(current), ignored: true });
  }
  const currentPayload = current?.payload && typeof current.payload === "object" ? current.payload : {};
  const row = updateMemory(id, agentToken, completionMessage || outputMeta
    ? {
        ...patch,
        payload: {
          ...currentPayload,
          ...(outputMeta ? { output_meta: outputMeta } : {}),
          completion_message: completionMessage,
          progress_message: completionMessage || currentPayload.progress_message || "",
          progress_stage: status === "done" ? "done" : "failed",
          progress: 100,
        },
      }
    : patch);
  if (!row) return NextResponse.json({ ok: false, error: "Задание не найдено." }, { status: 404 });
  return NextResponse.json({ ok: true, mode: "memory", job: publicJob(row) });
}

async function progressJob(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const id = String(body.id || body.job_id || "").trim();
  if (!agentToken || !id) return NextResponse.json({ ok: false, error: "Нужен token и job_id." }, { status: 400 });

  const progress = clampProgress(body.progress);
  const progressMessage = String(body.message || body.progress_message || "").slice(0, 300);
  const progressStage = String(body.stage || body.progress_stage || "").slice(0, 120);

  const admin = createAdminSupabase();
  if (admin) {
    const { data: existing, error: selectError } = await admin
      .from(TABLE)
      .select("id,status,payload")
      .eq("id", id)
      .eq("agent_token", agentToken)
      .maybeSingle();
    if (!selectError && existing?.id) {
      if (existing.status === "cancelled") {
        return NextResponse.json({ ok: true, mode: "supabase", ignored: true });
      }
      const payload = existing.payload && typeof existing.payload === "object" ? existing.payload : {};
      const patch = {
        payload: {
          ...payload,
          progress,
          progress_message: progressMessage,
          progress_stage: progressStage,
        },
        updated_at: nowIso(),
      };
      const { data, error } = await admin
        .from(TABLE)
        .update(patch)
        .eq("id", id)
        .eq("agent_token", agentToken)
        .select("id,part_index,part_label,project_name,provider,status,payload,error,image_data,created_at,updated_at,started_at,completed_at")
        .maybeSingle();
      if (!error) return NextResponse.json({ ok: true, mode: "supabase", job: publicJob(data || {}) });
      if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (selectError && !isMissingTableError(selectError)) return NextResponse.json({ ok: false, error: selectError.message }, { status: 500 });
  }

  const current = memoryStore.get(id);
  if (current?.status === "cancelled") {
    return NextResponse.json({ ok: true, mode: "memory", ignored: true });
  }
  const currentPayload = current?.payload && typeof current.payload === "object" ? current.payload : {};
  const row = updateMemory(id, agentToken, {
    payload: {
      ...currentPayload,
      progress,
      progress_message: progressMessage,
      progress_stage: progressStage,
    },
  });
  if (!row) return NextResponse.json({ ok: false, error: "Задание не найдено." }, { status: 404 });
  return NextResponse.json({ ok: true, mode: "memory", job: publicJob(row) });
}

async function getAgentStatus(agentToken) {
  if (!agentToken) return null;
  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .select("id,agent_token,project_name,part_index,part_label,provider,status,payload,error,created_at,updated_at")
      .eq("agent_token", agentToken)
      .eq("status", "agent_heartbeat")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) return publicAgent(data);
    if (error && !isMissingTableError(error)) throw error;
  }
  return memoryHeartbeat(agentToken);
}

async function listOnlineAgents() {
  const byToken = new Map();
  const warnings = [];
  const addAgentRows = (rows = [], mode = "memory") => {
    for (const row of rows || []) {
      try {
        const token = cleanToken(row.agent_token);
        if (!token) continue;
        const agent = publicAgent(row);
        if (!agent?.online) continue;
        const prev = byToken.get(token);
        const prevMs = timeMs(prev?.agent?.updated_at || prev?.agent?.last_seen_at || "");
        const nextMs = timeMs(agent.updated_at || agent.last_seen_at || "");
        if (!prev || nextMs >= prevMs) byToken.set(token, { token, agent, mode });
      } catch (e) {
        warnings.push(`heartbeat row skipped: ${e.message || "unknown error"}`);
      }
    }
  };

  const admin = createAdminSupabase();
  let mode = "memory";
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .select("id,agent_token,project_name,part_index,part_label,provider,status,payload,error,created_at,updated_at")
      .eq("status", "agent_heartbeat")
      .order("updated_at", { ascending: false })
      .limit(20);
    if (!error) {
      mode = "supabase";
      addAgentRows(data || [], "supabase");
    }
    if (error && !isMissingTableError(error)) {
      warnings.push(`supabase heartbeat list skipped: ${error.message || "unknown error"}`);
    }
  }

  addAgentRows(Array.from(memoryStore.values()).filter((row) => row.status === "agent_heartbeat"), "memory");

  const agents = Array.from(byToken.values())
    .sort((a, b) => timeMs(b.agent?.updated_at || b.agent?.last_seen_at || "") - timeMs(a.agent?.updated_at || a.agent?.last_seen_at || ""))
    .slice(0, 5);
  return { mode, agents, warnings };
}

async function discoverAgents() {
  const { mode, agents, warnings } = await listOnlineAgents();
  return NextResponse.json({ ok: true, mode, agents, warnings });
}

async function activeAgent() {
  const { mode, agents, warnings } = await listOnlineAgents();
  const match = agents.find((item) => item?.agent?.worker_ok === true) || agents.find((item) => item?.agent?.online === true) || null;
  return NextResponse.json({
    ok: true,
    mode,
    warnings,
    token: cleanToken(match?.token || ""),
    agent: match?.agent || null,
    agents_count: agents.length,
  });
}

async function heartbeatAgent(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });

  const payload = {
    provider: String(body.provider || "comfyui").slice(0, 40),
    worker_url: String(body.worker_url || body.workerUrl || "").slice(0, 400),
    worker_ok: body.worker_ok === true || body.workerOk === true,
    worker_error: String(body.worker_error || body.workerError || "").slice(0, 800),
    worker_queue: normalizeWorkerQueue(body.worker_queue || body.workerQueue),
    agent_version: String(body.agent_version || body.agentVersion || "local-agent").slice(0, 80),
  };
  const patch = {
    provider: payload.provider,
    payload,
    error: payload.worker_ok ? "" : payload.worker_error,
    completed_at: null,
    started_at: nowIso(),
  };

  const admin = createAdminSupabase();
  if (admin) {
    const { data: existing, error: selectError } = await admin
      .from(TABLE)
      .select("id")
      .eq("agent_token", agentToken)
      .eq("status", "agent_heartbeat")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (selectError && !isMissingTableError(selectError)) return NextResponse.json({ ok: false, error: selectError.message }, { status: 500 });

    if (existing?.id) {
      const { data, error } = await admin
        .from(TABLE)
        .update({ ...patch, updated_at: nowIso() })
        .eq("id", existing.id)
        .eq("agent_token", agentToken)
        .select("id,agent_token,project_name,part_index,part_label,provider,status,payload,error,created_at,updated_at")
        .maybeSingle();
      if (!error) return NextResponse.json({ ok: true, mode: "supabase", agent: publicAgent(data || {}) });
      if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    } else {
      const { data, error } = await admin
        .from(TABLE)
        .insert({
          user_id: null,
          agent_token: agentToken,
          project_name: "NeuroCine Local Agent",
          part_index: -1,
          part_label: "AGENT HEARTBEAT",
          provider: payload.provider,
          status: "agent_heartbeat",
          prompt: "__heartbeat__",
          negative_prompt: "",
          payload,
          image_data: "",
          error: payload.worker_ok ? "" : payload.worker_error,
          started_at: nowIso(),
          created_at: nowIso(),
          updated_at: nowIso(),
        })
        .select("id,agent_token,project_name,part_index,part_label,provider,status,payload,error,created_at,updated_at")
        .maybeSingle();
      if (!error) return NextResponse.json({ ok: true, mode: "supabase", agent: publicAgent(data || {}) });
      if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  const agent = memoryHeartbeat(agentToken, patch);
  return NextResponse.json({ ok: true, mode: "memory", agent });
}

async function clearJobs(req, body) {
  const account = await getServerAccount(req);
  if (!account.ok) {
    return NextResponse.json({ ok: false, error: account.message || "Нужно войти через Google." }, { status: account.status || 401 });
  }

  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const projectSessionId = String(body.project_session_id || body.projectSessionId || "").trim().slice(0, 120);
  const clearAll = body.all === true || String(body.scope || "").toLowerCase() === "all";
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });
  if (!clearAll && !projectSessionId) return NextResponse.json({ ok: false, error: "Нужен project_session_id или all=true." }, { status: 400 });

  const patch = {
    status: "cancelled",
    image_data: "",
    error: "cancelled by user",
    completed_at: nowIso(),
    updated_at: nowIso(),
  };

  const admin = createAdminSupabase();
  if (admin) {
    const { data: existing, error: selectError } = await admin
      .from(TABLE)
      .select("id,part_index,part_label,project_name,provider,status,payload,error,image_data,created_at,updated_at,started_at,completed_at,user_id")
      .eq("agent_token", agentToken)
      .eq("user_id", account.user?.id || "")
      .in("status", ACTIVE_JOB_STATUSES)
      .limit(300);
    if (!selectError) {
      const rows = (existing || []).filter((row) => clearAll || projectSessionIdOf(row) === projectSessionId);
      const ids = rows.map((row) => row.id).filter(Boolean);
      if (!ids.length) return NextResponse.json({ ok: true, mode: "supabase", jobs: [], cleared_count: 0 });
      const { data, error } = await admin
        .from(TABLE)
        .update(patch)
        .in("id", ids)
        .eq("agent_token", agentToken)
        .select("id,part_index,part_label,project_name,provider,status,payload,error,image_data,created_at,updated_at,started_at,completed_at");
      if (!error) return NextResponse.json({ ok: true, mode: "supabase", jobs: (data || []).map(publicJob), cleared_count: (data || []).length });
      if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (selectError && !isMissingTableError(selectError)) return NextResponse.json({ ok: false, error: selectError.message }, { status: 500 });
  }

  const rows = Array.from(memoryStore.values())
    .filter((row) => row.agent_token === agentToken && ACTIVE_JOB_STATUSES.includes(row.status) && (clearAll || projectSessionIdOf(row) === projectSessionId));
  const jobs = rows.map((row) => updateMemory(row.id, agentToken, patch)).filter(Boolean).map(publicJob);
  return NextResponse.json({ ok: true, mode: "memory", jobs, cleared_count: jobs.length });
}

async function statusJobs(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const ids = (Array.isArray(body.ids) ? body.ids : []).map((x) => String(x || "").trim()).filter(Boolean);
  const projectSessionId = String(body.project_session_id || body.projectSessionId || "").trim().slice(0, 120);
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });
  if (!ids.length && !projectSessionId) return NextResponse.json({ ok: true, jobs: [], agent: await getAgentStatus(agentToken) });

  const admin = createAdminSupabase();
  if (admin) {
    const rows = [];
    if (ids.length) {
      const { data, error } = await admin
        .from(TABLE)
        .select(JOB_SELECT_WITH_IMAGE)
        .eq("agent_token", agentToken)
        .in("id", ids);
      if (!error) rows.push(...(data || []));
      else if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (projectSessionId) {
      const { data, error } = await admin
        .from(TABLE)
        .select(JOB_SELECT_WITH_IMAGE)
        .eq("agent_token", agentToken)
        .in("status", [...ACTIVE_JOB_STATUSES, "done", "failed"])
        .order("updated_at", { ascending: false })
        .limit(300);
      if (!error) {
        rows.push(...(data || []).filter((row) => projectSessionIdOf(row) === projectSessionId));
      } else if (!isMissingTableError(error)) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true, mode: "supabase", jobs: mergeRowsById(rows).map(publicJob), agent: await getAgentStatus(agentToken) });
  }

  const rows = Array.from(memoryStore.values())
    .filter((row) => row.agent_token === agentToken)
    .filter((row) => (ids.length ? ids.includes(row.id) : false) || (projectSessionId ? projectSessionIdOf(row) === projectSessionId : false));
  return NextResponse.json({ ok: true, mode: "memory", jobs: mergeRowsById(rows).map(publicJob), agent: await getAgentStatus(agentToken) });
}

async function historyJobs(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const limit = Math.max(1, Math.min(40, Number(body.limit || 12)));
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });

  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .select("id,part_index,part_label,project_name,provider,status,payload,error,created_at,updated_at,started_at,completed_at")
      .eq("agent_token", agentToken)
      .eq("status", "done")
      .gte("part_index", 0)
      .order("completed_at", { ascending: false })
      .limit(limit);
    if (!error) {
      const rows = data || [];
      const ids = rows.map((row) => row.id).filter(Boolean);
      if (!ids.length) return NextResponse.json({ ok: true, mode: "supabase", jobs: [] });
      const { data: imageRows, error: imageError } = await admin
        .from(TABLE)
        .select("id,image_data")
        .in("id", ids)
        .eq("agent_token", agentToken);
      if (imageError && !isMissingTableError(imageError)) return NextResponse.json({ ok: false, error: imageError.message }, { status: 500 });
      const imageById = new Map((imageRows || []).map((row) => [row.id, row.image_data || ""]));
      const jobs = rows
        .map((row) => ({ ...row, image_data: imageById.get(row.id) || "" }))
        .filter((row) => row.image_data)
        .map(publicJob);
      return NextResponse.json({ ok: true, mode: "supabase", jobs });
    }
    if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const jobs = Array.from(memoryStore.values())
    .filter((row) => row.agent_token === agentToken && row.status === "done" && Number(row.part_index || 0) >= 0 && row.image_data)
    .sort((a, b) => String(b.completed_at || b.updated_at || "").localeCompare(String(a.completed_at || a.updated_at || "")))
    .slice(0, limit)
    .map(publicJob);
  return NextResponse.json({ ok: true, mode: "memory", jobs });
}

async function commandHistory(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const limit = Math.max(1, Math.min(12, Number(body.limit || 3)));
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });

  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .select("id,part_index,part_label,project_name,provider,status,payload,error,image_data,created_at,updated_at,started_at,completed_at")
      .eq("agent_token", agentToken)
      .eq("provider", PC_COMMAND_PROVIDER)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error) return NextResponse.json({ ok: true, mode: "supabase", commands: (data || []).map(publicJob) });
    if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const commands = Array.from(memoryStore.values())
    .filter((row) => row.agent_token === agentToken && row.provider === PC_COMMAND_PROVIDER)
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, limit)
    .map(publicJob);
  return NextResponse.json({ ok: true, mode: "memory", commands });
}

async function clearCommandHistory(req, body) {
  const account = await getServerAccount(req);
  if (!account.ok) {
    return NextResponse.json({ ok: false, error: account.message || "Нужно войти через Google." }, { status: account.status || 401 });
  }

  const agentToken = cleanToken(body.agent_token || body.agentToken);
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });

  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .delete()
      .eq("agent_token", agentToken)
      .eq("provider", PC_COMMAND_PROVIDER)
      .eq("user_id", account.user?.id || "")
      .select("id");
    if (!error) return NextResponse.json({ ok: true, mode: "supabase", cleared_count: (data || []).length });
    if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let cleared = 0;
  for (const [id, row] of memoryStore.entries()) {
    if (row.agent_token === agentToken && row.provider === PC_COMMAND_PROVIDER) {
      memoryStore.delete(id);
      cleared += 1;
    }
  }
  return NextResponse.json({ ok: true, mode: "memory", cleared_count: cleared });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "status").toLowerCase();
    if (action === "create") return createJobs(req, body);
    if (action === "poll") return pollJobs(body);
    if (action === "create_command") return createPcCommand(req, body);
    if (action === "poll_command") return pollPcCommands(body);
    if (action === "command_history") return commandHistory(body);
    if (action === "clear_command_history") return clearCommandHistory(req, body);
    if (action === "complete") return completeJob(body);
    if (action === "progress") return progressJob(body);
    if (action === "heartbeat") return heartbeatAgent(body);
    if (action === "clear") return clearJobs(req, body);
    if (action === "agent_status") return NextResponse.json({ ok: true, agent: await getAgentStatus(cleanToken(body.agent_token || body.agentToken)) });
    if (action === "discover_agents") return discoverAgents();
    if (action === "active_agent") return activeAgent();
    if (action === "status") return statusJobs(body);
    if (action === "history") return historyJobs(body);
    return NextResponse.json({ ok: false, error: "Неизвестное действие очереди." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Local queue error" }, { status: 500 });
  }
}
