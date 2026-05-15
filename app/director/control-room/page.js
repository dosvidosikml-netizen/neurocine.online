import AdminControlRoom from "../../../components/admin/AdminControlRoom";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Director Control Room — NeuroCine",
  description: "Закрытая панель управления NeuroCine Director",
};

export default function DirectorControlRoomPage() {
  return <AdminControlRoom />;
}
