import Script from "next/script";
import CartoonStudioShell from "../../components/cartoon/CartoonStudioShell";
import "../../public/cartoon/quantum.css";
import "../../public/cartoon/quantum-fix.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quantum Cartoon Creator — NeuroCine",
  description: "Cartoon creator module inside the NeuroCine Studio shell with RU/EN interface and project JSON export",
};

export default function CartoonPage() {
  return (
    <>
      <CartoonStudioShell />
      <Script src="/cartoon/quantum-anim.js?v=3" strategy="afterInteractive" />
    </>
  );
}
