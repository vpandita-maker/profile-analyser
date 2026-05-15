export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[#0f172a]">
      {children}
    </div>
  );
}
