import {
  Briefcase,
  ClipboardList,
  FileText,
  Calendar,
  Gift,
  LayoutDashboard,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";

export function AppSidebar() {
  const { state } = useSidebar();
  const { isCandidate } = useAuth();
  const collapsed = state === "collapsed";

  const hrMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Job Descriptions", url: "/dashboard/jd", icon: FileText },
    { title: "Candidates", url: "/dashboard/resume", icon: Users },
    { title: "Assessments", url: "/dashboard/assessment", icon: ClipboardList },
    { title: "Interviews", url: "/dashboard/interview", icon: Calendar },
    { title: "Offers", url: "/dashboard/offer", icon: Gift },
    { title: "Huria", url: "/dashboard/huria", icon: Gift },
  ];

  const candidateMenuItems = [
    { title: "Dashboard", url: "/candidate", icon: LayoutDashboard },
    { title: "My Tests", url: "/candidate/tests", icon: ClipboardList },
    { title: "Interviews", url: "/candidate/interviews", icon: Calendar },
    { title: "Offers", url: "/candidate/offers", icon: Gift },
    { title: "Onboarding", url: "/candidate/onboarding", icon: Briefcase },
  ];

  const menuItems = isCandidate ? candidateMenuItems : hrMenuItems;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent>
        <div className="px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-2">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-sidebar-foreground">
                HR Portal
              </span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
