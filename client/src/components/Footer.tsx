import { Link } from "wouter";
import { Mail, MapPin, Linkedin, Instagram } from "lucide-react";
import afaraLogo from "@assets/AFARA Image 1_1759521116826.png";
import { NewsletterSignup } from "./NewsletterSignup";

export function Footer() {
  return (
    <footer className="bg-card border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <img src={afaraLogo} alt="AFÁRÁ" className="h-16 w-auto mb-4 dark:brightness-0 dark:invert dark:opacity-90" />
            <ul className="space-y-2 text-sm text-muted-foreground mb-5">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Lagos | London</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>hello@afaraaccelerator.org</span>
              </li>
            </ul>
            <div className="flex gap-3">
              <a
                href="https://www.linkedin.com/company/af%C3%A1r%C3%A1/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-md bg-muted flex items-center justify-center hover-elevate"
                aria-label="LinkedIn"
                data-testid="icon-linkedin"
              >
                <Linkedin className="w-5 h-5 text-muted-foreground" />
              </a>
              <a
                href="https://www.instagram.com/afara.accelerator/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-md bg-muted flex items-center justify-center hover-elevate"
                aria-label="Instagram"
                data-testid="icon-instagram"
              >
                <Instagram className="w-5 h-5 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/program" className="text-muted-foreground hover:text-foreground transition-colors">
                  Program
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-muted-foreground hover:text-foreground transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/lms/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Access LMS
                </Link>
              </li>
            </ul>
          </div>

          {/* In the Press */}
          <div>
            <h4 className="font-semibold mb-4">In the Press</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://businessday.ng/energy/article/africa-accelerator-targets-1bn-to-back-women-led-energy-projects/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="press-link-businessday"
                >
                  BusinessDay — Africa accelerator targets $1bn
                </a>
              </li>
              <li>
                <a
                  href="https://platformsafrica.com/2026/05/24/afara-launches-an-africa-wide-accelerator-in-lagos-to-build-bankable-women-led-energy-projects/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="press-link-platforms"
                >
                  Platforms Africa — AFARA Launches Africa-wide Accelerator
                </a>
              </li>
              <li>
                <a
                  href="https://championnews.com.ng/2026/05/21/afara-launches-an-africa-wide-accelerator-in-lagos-to-build-bankable-women-led-energy-projects/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="press-link-champion"
                >
                  Daily Champion — AFARA Launches in Lagos
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Stay updated on programme news, events, and opportunities.
            </p>
            <NewsletterSignup variant="inline" />
          </div>

        </div>

        <div className="border-t mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AFÁRÁ. All rights reserved.</p>
          <p>
            An{" "}
            <a
              href="https://openspacesandbridges.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-opsb"
            >
              OPSB
            </a>
            {" "}Initiative
          </p>
          <p>Built by <a href="https://plmcreative.co" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PLM Creative</a></p>
        </div>
      </div>
    </footer>
  );
}
