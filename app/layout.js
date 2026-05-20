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

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://neurocine.online"),
  applicationName: "NeuroCine",
  title: {
    default: "NeuroCine Director Studio",
    template: "%s | NeuroCine",
  },
  description: "AI production studio for scripts, storyboards, video prompts, and production packs.",
  keywords: [
    "AI video studio",
    "AI storyboard generator",
    "video prompt generator",
    "NeuroCine",
    "AI filmmaking",
  ],
  authors: [{ name: "NeuroCine" }],
  creator: "NeuroCine",
  publisher: "NeuroCine",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "NeuroCine",
    title: "NeuroCine Director Studio",
    description: "AI production studio for scripts, storyboards, video prompts, and production packs.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroCine Director Studio",
    description: "AI production studio for scripts, storyboards, video prompts, and production packs.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <GenerationCinematicOverlay />
        {children}
      </body>
    </html>
  );
}
