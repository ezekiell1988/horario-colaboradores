import CoordinadorNav from "@/components/CoordinadorNav";

export default function CoordinadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <CoordinadorNav />
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
