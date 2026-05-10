export function downloadTextFile(content, filename, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function safeFileName(name = "neurocine-project") {
  return String(name || "neurocine-project")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}


export function downloadJsonFile(data, filename = "neurocine-project.json") {
  downloadTextFile(JSON.stringify(data, null, 2), filename, "application/json;charset=utf-8");
}
