import AdminNav from "@/components/AdminNav";
import Toast from "@/components/Toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6">{children}</main>
      <Toast />
    </div>
  );
}
