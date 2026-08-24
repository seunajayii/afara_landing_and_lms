import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import afaraLogo from "@assets/AFARA Image 1_1759521116826.png";

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) =>
    location === path ||
    (path === "/programs" && (location === "/program" || location.startsWith("/dorewa")));

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/programs", label: "Programs" },
    { path: "/faq", label: "FAQ" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={afaraLogo} alt="AFÁRÁ" className="h-16 w-auto dark:brightness-0 dark:invert dark:opacity-90" />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                asChild
                variant="ghost"
                className={isActive(link.path) ? "bg-accent" : ""}
                data-testid={`link-${link.label.toLowerCase()}`}
              >
                <Link href={link.path}>
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="default" size="sm" data-testid="button-access-lms">
              <Link href="/lms/dashboard">
                Access LMS
              </Link>
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-navigation" className="md:hidden pb-4 pt-2 border-t">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  asChild
                  variant="ghost"
                  className={`w-full justify-start ${isActive(link.path) ? "bg-accent" : ""}`}
                >
                  <Link href={link.path} onClick={() => setMobileMenuOpen(false)}>
                    {link.label}
                  </Link>
                </Button>
              ))}
              <Button asChild variant="default" className="w-full mt-2">
                <Link href="/lms/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  Access LMS
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
