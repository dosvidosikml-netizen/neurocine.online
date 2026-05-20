import AdminControlRoom from "../../../components/admin/AdminControlRoom";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Режиссёрская рубка — NeuroCine",
  description: "Закрытая панель управления NeuroCine для главного режиссёра",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DirectorControlRoomPage() {
  return <AdminControlRoom />;
}
