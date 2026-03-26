import { Link } from "wouter";
import { Mail, MapPin, Linkedin, Instagram } from "lucide-react";
import afaraLogo from "@assets/AFARA Image 1_1759521116826.png";
import { NewsletterSignup } from "./NewsletterSignup";

export function Footer() {
  return (
    <footer className="bg-card border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={afaraLogo} alt="AFÁRÁ" className="h-16 w-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Empowering female entrepreneurs to lead transformative energy and infrastructure projects across Africa.
            </p>
          </div>

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
                <Link href="/lms/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Access LMS
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Lagos | London</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>hello@afaraaccelerator.org</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Subscribe to Our Newsletter</h4>
            <NewsletterSignup variant="inline" className="mb-4" />
            <div className="flex gap-3 mt-4">
              <div
                className="w-10 h-10 rounded-md bg-muted flex items-center justify-center"
                aria-label="LinkedIn"
                data-testid="icon-linkedin"
              >
                <Linkedin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div
                className="w-10 h-10 rounded-md bg-muted flex items-center justify-center"
                aria-label="Instagram"
                data-testid="icon-instagram"
              >
                <Instagram className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AFÁRÁ. All rights reserved.</p>
          <p>
            An{" "}
            <a 
              href="https://opsb.africa" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-opsb"
            >
              OPSB
            </a>
            {" "}Initiative
          </p>
        </div>
      </div>
    </footer>
  );
}
