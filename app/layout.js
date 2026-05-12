import "./globals.css";
import "./public-landing.css";
import "./public-landing-v3.css";
import "./style-engine-patch.css";
import AuthSignOutPatch from "../components/AuthSignOutPatch";

export const metadata = {
  title: "NeuroCine Director Studio",
  description: "AI production pipeline: script → storyboard → frames → video prompts"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AuthSignOutPatch />
        {children}
      </body>
    </html>
  );
}
