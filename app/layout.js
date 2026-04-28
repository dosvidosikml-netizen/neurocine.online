export const metadata = {
  title: "NeuroCine Director Studio v4",
  description: "AI video production studio with director controlled storyboard pipeline"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
