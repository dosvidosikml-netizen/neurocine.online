import "./globals.css";
import "./public-landing.css";
import "./public-landing-v3.css";
import "./style-engine-patch.css";
import "./generation-overlay.css";
import AuthSignOutPatch from "../components/AuthSignOutPatch";
import ScriptPolishPatch from "../components/ScriptPolishPatch";
import GenerationCinematicOverlay from "../components/GenerationCinematicOverlay";

export const metadata = {
  title: "NeuroCine Director Studio",
  description: "AI production pipeline"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AuthSignOutPatch />
        <ScriptPolishPatch />
        <GenerationCinematicOverlay />
        {children}
      </body>
    </html>
  );
}
