import Link from "next/link";

export default function TopNav({ active = "home" }) {
  const items = [
    ["home", "/", "Главная"],
    ["chat", "/chat", "Chat"],
    ["storyboard", "/storyboard", "Studio"]
  ];
  return (
    <div className="nav-links">
      {items.map(([id, href, label]) => (
        <Link key={id} href={href} className={`nav-btn${active === id ? " active" : ""}`}>
          {label}
        </Link>
      ))}
    </div>
  );
}
