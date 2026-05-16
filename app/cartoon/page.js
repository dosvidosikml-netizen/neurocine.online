import CartoonStudioShell from "../../components/cartoon/CartoonStudioShell";
import "../../public/cartoon/quantum.css";
import "../../public/cartoon/quantum-fix.css";
import "../../public/cartoon/quantum-clean-flow.css";
import "../../public/cartoon/quantum-topboard-v2.css";

export const metadata = {
  title: "Quantum Cartoon Creator · NeuroCine",
  description: "AI cartoon generator with quantum mind pipeline",
};

export const dynamic = "force-dynamic";

export default function CartoonPage() {
  return <CartoonStudioShell />;
}
