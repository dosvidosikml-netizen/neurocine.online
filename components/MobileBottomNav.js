"use client";

export default function MobileBottomNav({ onCreate, onNavigate }) {
  return (
    <nav className="nc-bottom-nav" aria-label="NeuroCine mobile navigation">
      <button type="button" onClick={() => onNavigate?.("setup")}><span>⌂</span><b>Главная</b></button>
      <button type="button" onClick={() => onNavigate?.("projects")}><span>☷</span><b>Проекты</b></button>
      <button className="nc-create-plus" type="button" onClick={onCreate} aria-label="Создать">+</button>
      <button type="button" onClick={() => onNavigate?.("production")}><span>▣</span><b>Studio</b></button>
      <button type="button" onClick={() => onNavigate?.("pack")}><span>◉</span><b>Пакет</b></button>
    </nav>
  );
}
