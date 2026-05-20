import AccountCenter from "../../components/account/AccountCenter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Центр аккаунта — NeuroCine",
  description: "Профиль, тариф и AI-ключи NeuroCine",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPage() {
  return <AccountCenter />;
}
