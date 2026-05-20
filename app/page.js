import PublicLandingOriginalAuth from "../components/PublicLandingOriginalAuth";

export const metadata = {
  title: "NeuroCine Director Studio",
  description: "Create AI scripts, storyboards, video prompts, and production packs in one cinematic studio.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NeuroCine Director Studio",
    description: "Create AI scripts, storyboards, video prompts, and production packs in one cinematic studio.",
    url: "/",
  },
};

export default function Home() {
  return <PublicLandingOriginalAuth />;
}
