import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import { useTheme } from "@/contexts/ThemeContext"

export function Footer() {
  const { theme } = useTheme()
  
  return (
    <footer className={`border-t py-20 ${theme === "dark" ? "border-white/5 bg-[#050505]" : "border-slate-200 bg-gradient-to-br from-orange-50 via-white to-slate-50"}`}>
      {/* Newsletter Section */}
      <div className="container mx-auto px-4 mb-16 text-center">
        <h3 className={`mb-4 text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Stay Updated</h3>
        <p className={`mb-6 ${theme === "dark" ? "text-white/70" : "text-slate-600"}`}>Get the latest property listings and market insights delivered to your inbox</p>
        <div className="mx-auto flex max-w-md gap-2">
          <Input 
            type="email" 
            placeholder="Enter your email" 
            className={`flex-1 ${theme === "dark" ? "border-white/10 bg-black text-white placeholder:text-white/30 focus:border-orange-500 focus:ring-orange-500/20" : "border-slate-300 focus:border-orange-500 focus:ring-orange-500/20"}`}
          />
          <Button className="bg-orange-600 text-white hover:bg-orange-700">
            <Mail className="mr-2 h-4 w-4" />
            Subscribe
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <div>
            <div className="mb-4">
              <Logo size={80} variant={theme === "dark" ? "light" : "default"} />
            </div>
            <p className={`mb-4 text-sm leading-relaxed ${theme === "dark" ? "text-white/50" : "text-slate-600"}`}>
              Your trusted partner in finding the perfect home across Africa.
            </p>

            <div className="flex gap-3">
              <Link
                href="https://www.facebook.com/share/1Dui43e6nk/"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 hover:scale-110 ${theme === "dark" ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white" : "bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white"}`}
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 hover:scale-110 ${theme === "dark" ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white" : "bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white"}`}
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="https://www.instagram.com/nuloafrica"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 hover:scale-110 ${theme === "dark" ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white" : "bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white"}`}
              >
                <Instagram className="h-4 w-4" />
              </Link>
              <Link
                href="https://www.linkedin.com/in/nulo-africa-924136399/"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 hover:scale-110 ${theme === "dark" ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white" : "bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white"}`}
              >
                <Linkedin className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className={`mb-4 text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Rent</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/properties" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  Apartments for Rent
                </Link>
              </li>
              <li>
                <Link href="/properties" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  Houses for Rent
                </Link>
              </li>
              <li>
                <Link href="/properties" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  All Cities
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={`mb-4 text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Resources</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/blog" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/help" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/about" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={`mb-4 text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Useful Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/properties" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  Browse Properties
                </Link>
              </li>
              <li>
                <Link href="/landlord" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  Landlord Dashboard
                </Link>
              </li>
              <li>
                <Link href="https://nest-by-nulo.vercel.app/" target="_blank" rel="noopener noreferrer" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  NEST Waitlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={`mb-4 text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contact" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={`transition-colors duration-300 ${theme === "dark" ? "text-white/50 hover:text-orange-400" : "text-slate-600 hover:text-orange-600"}`}>
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={`mt-12 border-t pt-8 text-center text-sm ${theme === "dark" ? "border-white/5 text-white/30" : "border-slate-200 text-slate-500"}`}>
          <p>&copy; {new Date().getFullYear()} Nulo Africa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
