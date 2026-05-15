"use client";

export default function MobileBottomNav({ onCreate, onNavigate }) {
  function goStudioHome() {
    if (typeof window !== "undefined") window.location.href = "/studio";
  }

  function goStoryboard() {
    if (typeof window !== "undefined") window.location.href = "/storyboard#storyboard";
  }

  function goPack() {
    if (typeof window !== "undefined") window.location.href = "/studio#studio-package";
  }

  return (
    <nav className="nc-bottom-nav" aria-label="NeuroCine mobile navigation">
      <button type="button" onClick={goStudioHome}><span>⌂</span><b>Главная</b></button>
      <button type="button" onClick={() => onNavigate?.("projects")}><span>☷</span><b>Проекты</b></button>
      <button className="nc-create-plus" type="button" onClick={onCreate} aria-label="Создать">+</button>
      <button type="button" onClick={goStoryboard}><span>▣</span><b>Studio</b></button>
      <button type="button" onClick={goPack}><span>◉</span><b>Пакет</b></button>
    </nav>
  );
}
