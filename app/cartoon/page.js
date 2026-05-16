import CartoonStudioShell from "../../components/cartoon/CartoonStudioShell";

export const metadata = {
  title: "Quantum Cartoon Creator · NeuroCine",
  description: "AI cartoon generator with quantum mind pipeline",
};

export const dynamic = "force-dynamic";

export default function CartoonPage() {
  return <CartoonStudioShell />;
}
