import { Link, useLocation } from "wouter";
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, 
  SidebarProvider, SidebarTrigger 
} from "@/components/ui/sidebar";
import { LayoutDashboard, PlusCircle, PieChart, Archive, Sun, Moon, Package } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Add Item", url: "/add", icon: PlusCircle },
  { title: "Analytics", url: "/analytics", icon: PieChart },
  { title: "Archive", url: "/archive", icon: Archive },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background/50">
        <Sidebar variant="inset" className="border-r border-border/50 bg-card/30 backdrop-blur-xl">
          <SidebarContent>
            <div className="p-6 pb-2">
              <div className="flex items-center gap-3 px-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 text-white">
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-lg leading-tight tracking-tight">Smart</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest -mt-1">Inventory</span>
                </div>
              </div>
            </div>
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title} className="px-2 py-0.5">
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className={`
                            rounded-xl py-5 transition-all duration-200
                            ${isActive 
                              ? 'bg-primary/10 text-primary hover:bg-primary/15 font-semibold' 
                              : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground font-medium'}
                          `}
                        >
                          <Link href={item.url}>
                            <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-primary' : ''}`} />
                            {item.title}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 flex flex-col w-full min-w-0">
          <header className="sticky top-0 z-40 glass-panel h-16 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl font-display font-bold hidden sm:block">
                {NAV_ITEMS.find(i => i.url === location)?.title || "Dashboard"}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
              </Button>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
