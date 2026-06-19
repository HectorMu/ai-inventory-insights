import { Nav } from "@/components/dashboard/nav";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
