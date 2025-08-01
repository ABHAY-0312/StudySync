"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpenCheck, LogOut, Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/ask-doubt', label: 'Ask Doubt' },
  { href: '/upload-notes', label: 'Share Resource' },
  { href: '/doubts', label: 'Community Doubts' },
  { href: '/notes', label: 'Resource Library' },
  { href: '/dashboard', label: 'Dashboard', auth: true },
];

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error logging you out. Please try again.",
      });
    }
  };

  const NavLink = ({ href, children, isMobile = false }: { href: string, children: React.ReactNode, isMobile?: boolean }) => (
    <Link
      href={href}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`transition-colors hover:text-foreground ${isMobile ? 'text-lg' : 'text-sm'} ${pathname === href ? 'text-foreground font-semibold' : 'text-foreground/60'}`}
    >
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <BookOpenCheck className="h-7 w-7 text-primary" />
          <span className="font-headline font-bold text-xl">StudySync</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 font-medium flex-1">
          {navLinks.map((link) => (
            (!link.auth || (link.auth && user)) && (
              <NavLink key={link.href} href={link.href}>{link.label}</NavLink>
            )
          ))}
        </nav>

        {/* Auth Buttons for Desktop */}
        <div className="hidden md:flex items-center justify-end gap-2">
          {loading ? (
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex flex-1 justify-end md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm">
              <SheetHeader className="text-left">
                <SheetTitle>
                   <Link href="/" className="flex items-center gap-2 mb-8" onClick={() => setIsMobileMenuOpen(false)}>
                    <BookOpenCheck className="h-7 w-7 text-primary" />
                    <span className="font-headline font-bold text-xl">StudySync</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-6 font-medium">
                {navLinks.map((link) => (
                    (!link.auth || (link.auth && user)) && (
                        <NavLink key={link.href} href={link.href} isMobile>{link.label}</NavLink>
                    )
                ))}
              </nav>
              <div className="absolute bottom-6 left-6 right-6 border-t pt-6">
                {loading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : user ? (
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                      <LogOut className="mr-2 h-5 w-5" /> Logout
                    </Button>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Button asChild className="w-full">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                    </Button>
                     <Button asChild variant="secondary" className="w-full">
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
