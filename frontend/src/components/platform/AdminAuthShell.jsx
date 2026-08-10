import AdminLoginBackdrop from "./AdminLoginBackdrop";

export default function AdminAuthShell({ children, maxWidthClass = "max-w-[440px]" }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <AdminLoginBackdrop />
      <div
        className={`relative z-10 w-full ${maxWidthClass} rounded-[28px] bg-white px-8 py-10 shadow-[0_24px_60px_rgba(16,45,85,0.18)] sm:px-10`}
      >
        {children}
      </div>
    </div>
  );
}
