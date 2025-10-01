"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, FileText, MessageSquare, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserService } from "@/lib/userService";
import { ThemeToggleEnhanced } from "@/components/theme-toggle";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount and pathname changes
  useEffect(() => {
    setIsAuthenticated(UserService.isAuthenticated());
  }, [pathname]);

  // Reset loading state if user is no longer authenticated (after logout completes)
  useEffect(() => {
    if (isLoggingOut && !UserService.isAuthenticated()) {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  // Reset loading state when pathname changes (after navigation)
  useEffect(() => {
    if (isLoggingOut) {
      setIsLoggingOut(false);
    }
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      UserService.logout();
      router.replace("/");
    } catch (error) {
      console.error('Logout error:', error);
      // Reset loading state on error
      setIsLoggingOut(false);
    }
  };
  
  const NavItem = ({ href, label, icon: Icon, mobile = false, onClick }: { 
    href: string; 
    label: string; 
    icon?: React.ComponentType<{ className?: string }>;
    mobile?: boolean;
    onClick?: () => void;
  }) => {
    const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
    
    return (
      <Button
        asChild
        variant={active ? "default" : "ghost"}
        size={mobile ? "lg" : "sm"}
        className={cn(
          "transition-colors",
          mobile 
            ? "w-full justify-start rounded-lg h-12 px-4 text-base font-medium gap-3" 
            : "rounded-full",
          active && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        onClick={onClick}
      >
        <Link href={href} className="flex items-center gap-3">
          {mobile && Icon && <Icon className="h-5 w-5" />}
          {label}
        </Link>
      </Button>
    );
  };

  const navigationItems = [
    { href: "/docs", label: "Create Content", icon: FileText },
    { href: "/social-reply-studio", label: "Social Reply Studio", icon: MessageSquare }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-2">
        {isAuthenticated && navigationItems.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
        <div className={cn(
          "flex items-center gap-1",
          isAuthenticated ? "ml-2 pl-2 border-l border-border/50" : ""
        )}>
          <ThemeToggleEnhanced />
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="hidden lg:inline">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </Button>
          )}
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isAuthenticated && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle className="text-left text-lg font-semibold">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex-1 px-6 py-6">
              <nav className="flex flex-col gap-2">
                {navigationItems.map((item) => (
                  <NavItem 
                    key={item.href} 
                    href={item.href} 
                    label={item.label} 
                    icon={item.icon}
                    mobile={true}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </nav>
            </div>
            <div className="px-6 py-4 border-t bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Theme</span>
                <ThemeToggleEnhanced />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                disabled={isLoggingOut}
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Voice Content Platform
              </p>
            </div>
          </div>
        </SheetContent>
        </Sheet>
      )}

      {/* Mobile Theme Toggle (when not authenticated) */}
      {!isAuthenticated && (
        <div className="md:hidden">
          <ThemeToggleEnhanced />
        </div>
      )}
    </>
  );
}


