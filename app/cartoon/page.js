import CartoonStudioShellV2 from "../../components/cartoon/CartoonStudioShellV2";
import "../../public/cartoon/quantum.css";
import "../../public/cartoon/quantum-fix.css";
import "../../public/cartoon/quantum-clean-flow.css";

export const metadata = {
  title: "Quantum Cartoon Creator",
  description: "Generate cartoon scripts, storyboard beats, and production-ready animation prompts with NeuroCine.",
  alternates: {
    canonical: "/cartoon",
  },
  openGraph: {
    title: "Quantum Cartoon Creator | NeuroCine",
    description: "Generate cartoon scripts, storyboard beats, and production-ready animation prompts with NeuroCine.",
    url: "/cartoon",
  },
};

export const dynamic = "force-dynamic";

export default function CartoonPage() {
  return <CartoonStudioShellV2 />;
}
