import "./globals.css";
import "./public-landing.css";
import "./public-landing-v3.css";

export const metadata = {
  title: "NeuroCine Director Studio",
  description: "AI production pipeline: script → storyboard → frames → video prompts"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
