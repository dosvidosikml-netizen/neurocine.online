import QuantumCartoonCreator from "../../components/cartoon/QuantumCartoonCreator";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quantum Cartoon Creator — NeuroCine",
  description: "Standalone cartoon creator module with RU/EN interface and project JSON export",
};

export default function CartoonPage() {
  return <QuantumCartoonCreator />;
}
