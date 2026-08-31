import { User } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { DashboardTabs } from "@/components/dashboard-tabs";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).id) {
    redirect("/login");
  }

  return (
    <div className="bg-background min-h-[calc(100vh-80px)]">
      <div className="container-edit pt-10 pb-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center font-display text-2xl text-white shadow-md">
            {session?.user?.name?.charAt(0) || <User />}
          </div>
          <div>
            <h1 className="font-display text-3xl text-ink">Welcome back, {session?.user?.name?.split(" ")[0] || "User"}</h1>
            <p className="text-sm text-muted-foreground">Manage your rentals and listings.</p>
          </div>
        </div>

        <DashboardTabs />

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
