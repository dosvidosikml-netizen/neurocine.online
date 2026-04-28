import Link from "next/link";

export default function TopNav({ active = "home" }) {
  const items = [
    ["home", "/", "Главная"],
    ["chat", "/chat", "Chat"],
    ["storyboard", "/storyboard", "Storyboard"]
  ];

  return (
    <div className="nav">
      {items.map(([id, href, label]) => (
        <Link key={id} href={href} className={`btn ${active === id ? "active" : ""}`}>
          {label}
        </Link>
      ))}
    </div>
  );
}
