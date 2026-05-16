import Script from "next/script";
import QuantumCartoonCreator from "../../components/cartoon/QuantumCartoonCreator";
import "../../public/cartoon/quantum.css";
import "../../public/cartoon/quantum-fix.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quantum Cartoon Creator — NeuroCine",
  description: "Standalone cartoon creator module with RU/EN interface and project JSON export",
};

export default function CartoonPage() {
  return (
    <>
      <QuantumCartoonCreator />
      <Script src="/cartoon/quantum-anim.js?v=2" strategy="afterInteractive" />
    </>
  );
}
