import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminSupabase, getServerAccount } from "../../../../lib/serverSupabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "trailer_local_jobs";
const memoryStore = globalThis.__neurocineTrailerLocalJobs || new Map();
globalThis.__neurocineTrailerLocalJobs = memoryStore;

function nowIso() {
  return new Date().toISOString();
}

function cleanToken(value) {
  return String(value || "").trim().slice(0, 200);
}

function isMissingTableError(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("relation");
}

function publicJob(row = {}) {
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
  };
}

function publicAgent(row = {}) {
  const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
  const lastSeenAt = row.updated_at || row.created_at || "";
  const workerOk = payload.worker_ok === true;
  return {
    online: Boolean(lastSeenAt),
    provider: payload.provider || row.provider || "comfyui",
    worker_url: payload.worker_url || "",
    worker_ok: workerOk,
    worker_error: payload.worker_error || row.error || "",
    last_seen_at: lastSeenAt,
    updated_at: row.updated_at || "",
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

async function createJobs(req, body) {
  const account = await getServerAccount(req);
  if (!account.ok) {
    return NextResponse.json({ ok: false, error: account.message || "Нужно войти через Google." }, { status: account.status || 401 });
  }

  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const jobs = Array.isArray(body.jobs) ? body.jobs : [];
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });
  if (!jobs.length) return NextResponse.json({ ok: false, error: "Нет заданий для очереди." }, { status: 400 });

  const rows = jobs.map((job, index) => ({
    user_id: account.user?.id || null,
    agent_token: agentToken,
    project_name: String(body.project_name || job.project_name || "NeuroCine Trailer").slice(0, 200),
    part_index: Number.isFinite(Number(job.part_index)) ? Number(job.part_index) : index,
    part_label: String(job.part_label || `PART ${index + 1}`).slice(0, 80),
    provider: String(job.provider || body.provider || "comfyui").slice(0, 40),
    status: "queued",
    prompt: String(job.prompt || "").slice(0, 120000),
    negative_prompt: String(job.negative_prompt || body.negative_prompt || "").slice(0, 20000),
    payload: job.payload && typeof job.payload === "object" ? job.payload : {},
    error: "",
    image_data: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  })).filter((row) => row.prompt);

  if (!rows.length) return NextResponse.json({ ok: false, error: "В заданиях нет prompt." }, { status: 400 });

  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .insert(rows)
      .select("id,part_index,part_label,project_name,provider,status,error,image_data,created_at,updated_at,started_at,completed_at");
    if (!error) return NextResponse.json({ ok: true, mode: "supabase", jobs: (data || []).map(publicJob) });
    if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const saved = insertMemory(rows);
  return NextResponse.json({ ok: true, mode: "memory", jobs: saved.map(publicJob) });
}

async function pollJobs(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const limit = Math.max(1, Math.min(8, Number(body.limit || 1)));
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });

  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .select("id,part_index,part_label,project_name,provider,status,prompt,negative_prompt,payload,created_at,updated_at,started_at,completed_at")
      .eq("agent_token", agentToken)
      .eq("status", "queued")
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

  const rows = listMemory({ agentToken, limit, pendingOnly: true });
  rows.forEach((row) => updateMemory(row.id, agentToken, { status: "running", started_at: nowIso() }));
  return NextResponse.json({ ok: true, mode: "memory", jobs: rows.map((row) => ({ ...row, status: "running" })) });
}

async function completeJob(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const id = String(body.id || body.job_id || "").trim();
  if (!agentToken || !id) return NextResponse.json({ ok: false, error: "Нужен token и job_id." }, { status: 400 });

  const status = body.status === "failed" || body.error ? "failed" : "done";
  const patch = {
    status,
    image_data: status === "done" ? String(body.image || body.image_data || "").trim() : "",
    error: status === "failed" ? String(body.error || "Local render failed").slice(0, 4000) : "",
    completed_at: nowIso(),
    updated_at: nowIso(),
  };

  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .update(patch)
      .eq("id", id)
      .eq("agent_token", agentToken)
      .select("id,part_index,part_label,project_name,provider,status,error,image_data,created_at,updated_at,started_at,completed_at")
      .maybeSingle();
    if (!error) return NextResponse.json({ ok: true, mode: "supabase", job: publicJob(data || {}) });
    if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const row = updateMemory(id, agentToken, patch);
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

async function heartbeatAgent(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });

  const payload = {
    provider: String(body.provider || "comfyui").slice(0, 40),
    worker_url: String(body.worker_url || body.workerUrl || "").slice(0, 400),
    worker_ok: body.worker_ok === true || body.workerOk === true,
    worker_error: String(body.worker_error || body.workerError || "").slice(0, 800),
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

async function statusJobs(body) {
  const agentToken = cleanToken(body.agent_token || body.agentToken);
  const ids = (Array.isArray(body.ids) ? body.ids : []).map((x) => String(x || "").trim()).filter(Boolean);
  if (!agentToken) return NextResponse.json({ ok: false, error: "Нужен токен локального агента." }, { status: 400 });
  if (!ids.length) return NextResponse.json({ ok: true, jobs: [], agent: await getAgentStatus(agentToken) });

  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from(TABLE)
      .select("id,part_index,part_label,project_name,provider,status,error,image_data,created_at,updated_at,started_at,completed_at")
      .eq("agent_token", agentToken)
      .in("id", ids);
    if (!error) return NextResponse.json({ ok: true, mode: "supabase", jobs: (data || []).map(publicJob), agent: await getAgentStatus(agentToken) });
    if (!isMissingTableError(error)) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "memory", jobs: listMemory({ agentToken, ids, limit: ids.length }).map(publicJob), agent: await getAgentStatus(agentToken) });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "status").toLowerCase();
    if (action === "create") return createJobs(req, body);
    if (action === "poll") return pollJobs(body);
    if (action === "complete") return completeJob(body);
    if (action === "heartbeat") return heartbeatAgent(body);
    if (action === "agent_status") return NextResponse.json({ ok: true, agent: await getAgentStatus(cleanToken(body.agent_token || body.agentToken)) });
    if (action === "status") return statusJobs(body);
    return NextResponse.json({ ok: false, error: "Неизвестное действие очереди." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Local queue error" }, { status: 500 });
  }
}
