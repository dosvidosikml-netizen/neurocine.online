import "./globals.css";
import "./public-landing.css";
import "./public-landing-v3.css";
import "./style-engine-patch.css";
import "./generation-overlay.css";
import "./neurocine-theme.css";
import "./neurocine-bars-theme.css";
import "./neurocine-light-readability.css";
import "./storyboard-style-previews.css";
import AuthSignOutPatch from "../components/AuthSignOutPatch";
import ScriptPolishPatch from "../components/ScriptPolishPatch";
import GenerationCinematicOverlay from "../components/GenerationCinematicOverlay";
import VisualPromptQualityPatch from "../components/VisualPromptQualityPatch";
import StoryboardStatusPatch from "../components/StoryboardStatusPatch";
import StoryboardResetPatch from "../components/StoryboardResetPatch";
import CoverDirectorCachePatch from "../components/CoverDirectorCachePatch";

export const metadata = {
  title: "NeuroCine Director Studio",
  description: "NeuroCine studio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AuthSignOutPatch />
        <ScriptPolishPatch />
        <VisualPromptQualityPatch />
        <StoryboardStatusPatch />
        <StoryboardResetPatch />
        <CoverDirectorCachePatch />
        <GenerationCinematicOverlay />
        {children}
      </body>
    </html>
  );
}
