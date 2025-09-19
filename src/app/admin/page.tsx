import AdminDashboard from "@/components/admin-dashboard";

export default function AdminPage() {
  return (
    <div className="bg-background min-h-screen w-full">
      <main className="container mx-auto p-4 sm:p-8 md:p-12">
        <h1 className="text-3xl font-bold text-primary/90 mb-4">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage election candidates and their positions.</p>
        <AdminDashboard />
      </main>
    </div>
  );
}
