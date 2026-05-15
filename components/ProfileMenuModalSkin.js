"use client";

export default function ProfileMenuModalSkin() {
  return (
    <style jsx global>{`
      .nc-profile-modal-layer,
      .nc-profile-modal-layer * {
        box-sizing: border-box;
      }

      .nc-profile-modal-layer {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483000 !important;
        display: grid !important;
        place-items: center !important;
        padding: 18px !important;
        pointer-events: auto !important;
      }

      .nc-profile-modal-backdrop {
        position: absolute !important;
        inset: 0 !important;
        z-index: 0 !important;
        background:
          radial-gradient(circle at 50% 28%, rgba(168,85,247,.20), transparent 34%),
          radial-gradient(circle at 70% 70%, rgba(250,204,21,.10), transparent 30%),
          rgba(3,5,10,.72) !important;
        backdrop-filter: blur(14px) !important;
        animation: nc-profile-backdrop-in-v2 .18s ease both !important;
      }

      .nc-profile-menu-modal {
        position: relative !important;
        z-index: 1 !important;
        width: min(430px, calc(100vw - 28px)) !important;
        max-height: min(650px, calc(100vh - 96px)) !important;
        overflow: auto !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        border-radius: 28px !important;
        padding: 14px !important;
        background:
          radial-gradient(circle at 12% 0%, rgba(168,85,247,.22), transparent 36%),
          radial-gradient(circle at 100% 12%, rgba(250,204,21,.14), transparent 34%),
          linear-gradient(145deg, rgba(15,17,29,.98), rgba(7,9,16,.96)) !important;
        box-shadow: 0 34px 110px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,255,255,.07) !important;
        backdrop-filter: blur(20px) !important;
        animation: nc-profile-modal-in-v2 .22s cubic-bezier(.2,.8,.2,1) both !important;
        color: #eef0f8 !important;
      }

      .nc-profile-modal-close {
        position: absolute !important;
        right: 12px !important;
        top: 12px !important;
        z-index: 2 !important;
        width: 38px !important;
        height: 38px !important;
        display: grid !important;
        place-items: center !important;
        border: 1px solid rgba(255,255,255,.12) !important;
        border-radius: 14px !important;
        background: rgba(255,255,255,.07) !important;
        color: #fff !important;
        font-size: 26px !important;
        line-height: 1 !important;
        cursor: pointer !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-head {
        position: relative !important;
        margin-bottom: 12px !important;
        padding: 18px 56px 18px 18px !important;
        border: 1px solid rgba(255,255,255,.10) !important;
        border-radius: 22px !important;
        background: rgba(255,255,255,.055) !important;
        overflow: hidden !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-head::before {
        content: "ПРОФИЛЬ NEUROCINE" !important;
        display: block !important;
        margin-bottom: 10px !important;
        color: #c4b5fd !important;
        font-size: 10px !important;
        font-weight: 950 !important;
        letter-spacing: .22em !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-plan {
        width: fit-content !important;
        margin-bottom: 10px !important;
        padding: 8px 11px !important;
        border: 1px solid rgba(250,204,21,.28) !important;
        border-radius: 999px !important;
        background: rgba(250,204,21,.08) !important;
        color: #facc15 !important;
        font-size: 11px !important;
        font-weight: 950 !important;
        letter-spacing: .10em !important;
        text-transform: uppercase !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-name {
        color: #fff !important;
        font-size: clamp(24px, 7vw, 34px) !important;
        font-weight: 950 !important;
        line-height: 1.02 !important;
        letter-spacing: -.05em !important;
        overflow-wrap: anywhere !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-email {
        margin-top: 8px !important;
        color: rgba(238,240,248,.62) !important;
        font-size: 13px !important;
        overflow-wrap: anywhere !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-item {
        width: 100% !important;
        min-height: 52px !important;
        display: grid !important;
        grid-template-columns: 38px minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 10px !important;
        margin: 8px 0 0 !important;
        padding: 10px 12px !important;
        border: 1px solid rgba(255,255,255,.09) !important;
        border-radius: 17px !important;
        background: rgba(255,255,255,.045) !important;
        color: #eef0f8 !important;
        text-align: left !important;
        font-weight: 850 !important;
        font-size: 15px !important;
        cursor: pointer !important;
        transition: transform .16s ease, border-color .16s ease, background .16s ease !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-item:hover {
        transform: translateY(-1px) !important;
        border-color: rgba(250,204,21,.24) !important;
        background: rgba(255,255,255,.075) !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-icon {
        width: 38px !important;
        height: 38px !important;
        display: grid !important;
        place-items: center !important;
        border-radius: 14px !important;
        background: rgba(255,255,255,.07) !important;
        color: #facc15 !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-arrow {
        color: rgba(238,240,248,.45) !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-danger {
        border-color: rgba(248,113,113,.22) !important;
        background: rgba(248,113,113,.07) !important;
      }

      .nc-profile-menu-modal .nc-profile-menu-danger .nc-profile-menu-icon {
        color: #fca5a5 !important;
      }

      @media (max-width: 520px) {
        .nc-profile-modal-layer {
          padding: 12px !important;
          place-items: center !important;
        }
        .nc-profile-menu-modal {
          width: min(390px, calc(100vw - 20px)) !important;
          max-height: calc(100vh - 112px) !important;
          border-radius: 24px !important;
          padding: 12px !important;
        }
        .nc-profile-menu-modal .nc-profile-menu-head {
          padding: 15px 52px 15px 15px !important;
          border-radius: 20px !important;
        }
        .nc-profile-menu-modal .nc-profile-menu-item {
          min-height: 50px !important;
          border-radius: 16px !important;
        }
      }

      @keyframes nc-profile-modal-in-v2 {
        from { opacity: 0; transform: translateY(18px) scale(.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes nc-profile-backdrop-in-v2 {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `}</style>
  );
}
