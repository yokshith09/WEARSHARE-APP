"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Gem, Heart, LayoutDashboard, Menu, Search, ShoppingCart, User, X } from "lucide-react";

const navLinks = [
  { href: "/browse?collection=men", label: "Men" },
  { href: "/browse?collection=women", label: "Women" },
  { href: "/browse?collection=accessories", label: "Accessories" },
  { href: "/how-it-works", label: "How it works" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { status } = useSession();
  const accountHref = status === "authenticated" ? "/profile" : "/login?callbackUrl=/profile";

  useEffect(() => {
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setCartCount(data.items.length);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 glass shadow-sm transition-all duration-300">
      <div className="container-edit flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-2xl font-semibold tracking-normal text-ink md:text-3xl">
            Wear<span className="italic text-primary">Share</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] font-semibold uppercase tracking-widest md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-ink hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/browse" aria-label="Search" className="hidden h-10 items-center gap-2 rounded-md border border-border px-3 text-[13px] font-medium text-muted-foreground hover:border-ink hover:text-ink sm:flex">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Link>
          
          <Link href="/list-item"
            className="btn-secondary hidden min-h-10 px-4 py-2 text-[13px] font-bold md:inline-flex"
          >
            <Gem className="h-4 w-4" /> List an Outfit
          </Link>
          
          <Link href="/dashboard" aria-label="Dashboard" className="hidden h-10 w-10 items-center justify-center rounded-md bg-secondary/60 hover:bg-secondary md:flex">
            <LayoutDashboard className="h-4 w-4 text-ink" />
          </Link>

          <Link href={accountHref} aria-label="Account" className="hidden h-10 w-10 items-center justify-center rounded-md bg-secondary/60 hover:bg-secondary sm:flex">
            <User className="h-4 w-4 text-ink" />
          </Link>

          <Link href="/cart" aria-label="Cart" className="hidden h-10 w-10 relative items-center justify-center rounded-md bg-secondary/60 hover:bg-secondary sm:flex">
            <ShoppingCart className="h-4 w-4 text-ink" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="h-10 w-10 rounded-md border border-border bg-card flex items-center justify-center md:hidden"
          >
            {open ? <X className="h-4 w-4 text-ink" /> : <Menu className="h-4 w-4 text-ink" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="container-edit grid gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-semibold text-ink hover:bg-secondary"
              >
                {link.label}
                <span className="text-muted-foreground">View</span>
              </Link>
            ))}
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Link href="/list-item" onClick={() => setOpen(false)} className="btn-primary text-sm">
                <Heart className="h-4 w-4" /> List item
              </Link>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-outline text-sm">
                Dashboard
              </Link>
              <Link href={accountHref} onClick={() => setOpen(false)} className="btn-outline text-sm">
                Profile
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
