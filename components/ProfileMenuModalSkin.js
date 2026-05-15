"use client";

export default function ProfileMenuModalSkin() {
  return (
    <style jsx global>{`
      .nc-profile-wrap:has(.nc-profile-menu)::before {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 9000;
        background: radial-gradient(circle at 50% 30%, rgba(168,85,247,.18), transparent 34%), rgba(3,5,10,.68);
        backdrop-filter: blur(12px);
        pointer-events: none;
        animation: nc-profile-backdrop-in-v1 .18s ease both;
      }

      .nc-profile-wrap .nc-profile-menu {
        position: fixed !important;
        left: 50% !important;
        top: 50% !important;
        right: auto !important;
        bottom: auto !important;
        z-index: 9001 !important;
        width: min(430px, calc(100vw - 28px)) !important;
        max-height: min(640px, calc(100vh - 96px)) !important;
        overflow: auto !important;
        transform: translate(-50%, -50%) !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        border-radius: 28px !important;
        padding: 14px !important;
        background:
          radial-gradient(circle at 12% 0%, rgba(168,85,247,.20), transparent 36%),
          radial-gradient(circle at 100% 12%, rgba(250,204,21,.12), transparent 34%),
          linear-gradient(145deg, rgba(15,17,29,.98), rgba(7,9,16,.96)) !important;
        box-shadow: 0 34px 110px rgba(0,0,0,.70), inset 0 1px 0 rgba(255,255,255,.07) !important;
        backdrop-filter: blur(20px);
        animation: nc-profile-modal-in-v1 .22s cubic-bezier(.2,.8,.2,1) both !important;
      }

      .nc-profile-wrap .nc-profile-menu-head {
        position: relative;
        margin-bottom: 12px !important;
        padding: 18px !important;
        border: 1px solid rgba(255,255,255,.10) !important;
        border-radius: 22px !important;
        background: rgba(255,255,255,.055) !important;
        overflow: hidden;
      }

      .nc-profile-wrap .nc-profile-menu-head::before {
        content: "ПРОФИЛЬ NEUROCINE";
        display: block;
        margin-bottom: 10px;
        color: #c4b5fd;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .22em;
      }

      .nc-profile-wrap .nc-profile-menu-plan {
        width: fit-content;
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

      .nc-profile-wrap .nc-profile-menu-name {
        color: #fff !important;
        font-size: clamp(24px, 7vw, 34px) !important;
        font-weight: 950 !important;
        line-height: .98 !important;
        letter-spacing: -.05em !important;
      }

      .nc-profile-wrap .nc-profile-menu-email {
        margin-top: 8px !important;
        color: rgba(238,240,248,.62) !important;
        font-size: 13px !important;
        overflow-wrap: anywhere;
      }

      .nc-profile-wrap .nc-profile-menu-item {
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
        cursor: pointer !important;
        transition: transform .16s ease, border-color .16s ease, background .16s ease !important;
      }

      .nc-profile-wrap .nc-profile-menu-item:hover {
        transform: translateY(-1px);
        border-color: rgba(250,204,21,.24) !important;
        background: rgba(255,255,255,.075) !important;
      }

      .nc-profile-wrap .nc-profile-menu-icon {
        width: 38px !important;
        height: 38px !important;
        display: grid !important;
        place-items: center !important;
        border-radius: 14px !important;
        background: rgba(255,255,255,.07) !important;
        color: #facc15 !important;
      }

      .nc-profile-wrap .nc-profile-menu-arrow {
        color: rgba(238,240,248,.45) !important;
      }

      .nc-profile-wrap .nc-profile-menu-danger {
        border-color: rgba(248,113,113,.22) !important;
        background: rgba(248,113,113,.07) !important;
      }

      .nc-profile-wrap .nc-profile-menu-danger .nc-profile-menu-icon {
        color: #fca5a5 !important;
      }

      @media (max-width: 520px) {
        .nc-profile-wrap .nc-profile-menu {
          width: min(390px, calc(100vw - 20px)) !important;
          max-height: calc(100vh - 112px) !important;
          border-radius: 24px !important;
          padding: 12px !important;
        }
        .nc-profile-wrap .nc-profile-menu-head {
          padding: 15px !important;
          border-radius: 20px !important;
        }
        .nc-profile-wrap .nc-profile-menu-item {
          min-height: 50px !important;
          border-radius: 16px !important;
        }
      }

      @keyframes nc-profile-modal-in-v1 {
        from { opacity: 0; transform: translate(-50%, -46%) scale(.96); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }

      @keyframes nc-profile-backdrop-in-v1 {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `}</style>
  );
}
