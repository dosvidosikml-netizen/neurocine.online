"use client";

export default function CartoonTopBrand() {
  return (
    <div className="ctb" aria-label="NeuroCine Quantum Cartoon">
      <style jsx>{`
        .ctb{width:100%;min-width:0;height:64px;display:grid;grid-template-columns:48px minmax(0,1fr);align-items:center;gap:10px;border:0;border-radius:0;padding:0;overflow:hidden;background:transparent;box-shadow:none}
        .ctb-orbit{position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.ctb-core{position:absolute;width:14px;height:14px;border-radius:50%;background:#25d9ff;box-shadow:0 0 10px rgba(0,212,255,.8),0 0 24px rgba(180,40,200,.2);animation:pulse 2.5s ease-in-out infinite}.ctb-ring{position:absolute;inset:4px;border:1px solid rgba(0,212,255,.45);border-radius:50%;box-shadow:0 0 10px rgba(0,212,255,.12)}.ctb-r1{transform:rotate(-20deg) scaleX(1.35);animation:o1 4.5s linear infinite}.ctb-r2{border-color:rgba(180,40,200,.35);transform:rotate(60deg) scaleX(1.22);animation:o2 5.8s linear infinite reverse}.ctb-copy{min-width:0;overflow:hidden;text-align:left;line-height:1}.ctb-title{display:block;font-family:Orbitron,'Exo 2',system-ui,sans-serif;font-size:clamp(13px,3.4vw,22px);font-weight:900;letter-spacing:.24em;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:linear-gradient(92deg,#2dd4ff 0%,#8b5cf6 50%,#ff38d1 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}.ctb-sub{display:block;margin-top:5px;font-family:'Share Tech Mono',ui-monospace,monospace;font-size:clamp(7.5px,2vw,11px);line-height:1;letter-spacing:.18em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:rgba(45,212,255,.7)}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}@keyframes o1{from{transform:rotate(-20deg) scaleX(1.35)}to{transform:rotate(340deg) scaleX(1.35)}}@keyframes o2{from{transform:rotate(60deg) scaleX(1.22)}to{transform:rotate(420deg) scaleX(1.22)}}
        @media(max-width:430px){.ctb{height:58px;grid-template-columns:42px minmax(0,1fr);gap:8px}.ctb-orbit{width:42px;height:42px}.ctb-title{font-size:13px;letter-spacing:.20em}.ctb-sub{font-size:8px;letter-spacing:.14em;margin-top:4px}}@media(max-width:370px){.ctb{grid-template-columns:36px minmax(0,1fr)}.ctb-orbit{width:36px;height:36px}.ctb-title{font-size:11px;letter-spacing:.16em}.ctb-sub{font-size:7px;letter-spacing:.10em}}
      `}</style>
      <div className="ctb-orbit" aria-hidden="true">
        <span className="ctb-ring ctb-r1" />
        <span className="ctb-ring ctb-r2" />
        <span className="ctb-core" />
      </div>
      <div className="ctb-copy">
        <strong className="ctb-title">NEUROCINE</strong>
        <span className="ctb-sub">QUANTUM CARTOON INTELLIGENCE</span>
      </div>
    </div>
  );
}
