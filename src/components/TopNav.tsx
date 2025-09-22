"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const NavItem = ({ href, label, icon: Icon, mobile = false, onClick }: { 
    href: string; 
    label: string; 
    icon?: React.ComponentType<any>;
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
        {navigationItems.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>

      {/* Mobile Navigation */}
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
            <div className="px-6 py-4 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                Voice Content Platform
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}


