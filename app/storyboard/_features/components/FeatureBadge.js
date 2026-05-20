"use client";

export default function FeatureBadge({ label, enabled }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "999px",
        background: enabled ? "#16351f" : "#351616",
        border: enabled
          ? "1px solid #2ecc71"
          : "1px solid #ff4d4f",
        color: "white",
        fontSize: "12px",
        fontWeight: 600,
      }}
    >
      <span>
        {enabled ? "●" : "○"}
      </span>

      <span>{label}</span>
    </div>
  );
}
