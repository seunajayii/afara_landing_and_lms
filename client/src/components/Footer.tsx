import { Link } from "wouter";
import { Mail, MapPin, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-display font-bold text-xl mb-4">OPSB</h3>
            <p className="text-sm text-muted-foreground">
              Leading advisory catalyst for transformative infrastructure projects across Africa.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">About Us</a>
                </Link>
              </li>
              <li>
                <Link href="/services">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">Services</a>
                </Link>
              </li>
              <li>
                <Link href="/track-record">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">Track Record</a>
                </Link>
              </li>
              <li>
                <Link href="/afara">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">Afara</a>
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
                <span>info@opsb.africa</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-md bg-muted hover-elevate flex items-center justify-center transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Open Spaces & Bridges Advisory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
