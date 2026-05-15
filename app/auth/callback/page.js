import AuthCallback from "../../../components/auth/AuthCallback";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Вход — NeuroCine",
  description: "Завершение входа в NeuroCine",
};

export default function AuthCallbackPage({ searchParams }) {
  const next = typeof searchParams?.next === "string" ? searchParams.next : "/storyboard";
  return <AuthCallback next={next} />;
}
