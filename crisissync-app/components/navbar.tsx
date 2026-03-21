"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  AlertTriangle,
  LayoutDashboard,
  FileWarning,
  MessageSquare,
  BarChart3,
  Moon,
  Sun,
  Languages,
  Menu,
  Settings,
  Type,
  Home,
  Zap,
} from "lucide-react"

const navItems = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/report", labelKey: "nav.report", icon: FileWarning },
  { href: "/communication", labelKey: "nav.communication", icon: MessageSquare },
  { href: "/analytics", labelKey: "nav.analytics", icon: BarChart3 },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const [largeText, setLargeText] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleLargeText = () => {
    setLargeText(!largeText)
    document.documentElement.classList.toggle("text-lg")
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 group-hover:glow-cyan transition-all duration-300">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-lg leading-tight">CrisisSync</span>
            <span className="text-[10px] text-primary font-medium tracking-wider uppercase">Rapid Response</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/50">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            )
          })}
        </div>

        {/* Settings & Mobile Menu */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            {mounted ? (
              theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label={t("common.language")}
                className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <Languages className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-primary/20">
              <DropdownMenuItem onClick={() => setLanguage("en")} className="cursor-pointer">
                <span className={cn(language === "en" && "font-bold text-primary")}>English</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("hi")} className="cursor-pointer">
                <span className={cn(language === "hi" && "font-bold text-primary")}>हिंदी</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Accessibility Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label={t("common.accessibility")}
                className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-primary/20">
              <DropdownMenuItem onClick={toggleLargeText} className="cursor-pointer">
                <Type className="h-4 w-4 mr-2" />
                {t("common.largeText")} {largeText ? "On" : "Off"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 glass border-l-primary/20">
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {t(item.labelKey)}
                    </Link>
                  )
                })}
                <DropdownMenuSeparator className="bg-border/50" />
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  {t("common.language")}
                </div>
                <Button
                  variant={language === "en" ? "secondary" : "ghost"}
                  className={cn(
                    "justify-start rounded-xl",
                    language === "en" && "bg-primary/10 text-primary border border-primary/20"
                  )}
                  onClick={() => setLanguage("en")}
                >
                  English
                </Button>
                <Button
                  variant={language === "hi" ? "secondary" : "ghost"}
                  className={cn(
                    "justify-start rounded-xl",
                    language === "hi" && "bg-primary/10 text-primary border border-primary/20"
                  )}
                  onClick={() => setLanguage("hi")}
                >
                  हिंदी
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
