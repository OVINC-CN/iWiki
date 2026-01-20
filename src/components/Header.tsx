import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/useApp';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { User, LogOut, Globe, Menu, X } from 'lucide-react';

const NavLink = ({ to, children, active }: { to: string; children: React.ReactNode; active: boolean }) => (
    <Link
        to={to}
        className={cn(
            'px-3 py-2 text-sm font-medium rounded-md transition-colors',
            active
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        )}
    >
        {children}
    </Link>
);

export const Header: React.FC = () => {
    const { user, isLoggedIn, hasPermission, signOut, login, language, changeLanguage, t } = useApp();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const canCreateDoc = hasPermission('create_doc');

    const closeMobileMenu = useCallback(() => {
        setMobileMenuOpen(false);
    }, []);

    useEffect(() => {
        closeMobileMenu();
    }, [location.pathname, closeMobileMenu]);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center justify-between px-4">
                <Link to="/" className="flex items-center">
                    <img src="/logo.webp" alt="iWiki" className="h-6" />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    <NavLink to="/" active={location.pathname === '/'}>
                        {t.common.home}
                    </NavLink>
                    <NavLink
                        to="/docs"
                        active={location.pathname.startsWith('/docs') && !location.pathname.includes('/edit') && !location.pathname.includes('/new')}
                    >
                        {t.common.articles}
                    </NavLink>
                    {canCreateDoc && (
                        <NavLink to="/docs/new" active={location.pathname === '/docs/new'}>
                            {t.common.write}
                        </NavLink>
                    )}
                </nav>

                {/* Desktop User Menu */}
                <div className="hidden md:flex items-center gap-2">
                    {isLoggedIn ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <User className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem disabled className="font-medium">
                                    {user?.nick_name || user?.username}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => changeLanguage(language === 'zh-hans' ? 'en' : 'zh-hans')}>
                                    <Globe className="mr-2 h-4 w-4" />
                                    {language === 'zh-hans' ? t.common.switchToEn : t.common.switchToZh}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {t.common.logout}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button onClick={login} size="sm">
                            {t.common.login}
                        </Button>
                    )}
                </div>

                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild className="md:hidden">
                        <Button variant="ghost" size="icon">
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                        <nav className="flex flex-col gap-4 mt-8">
                            <Link
                                to="/"
                                onClick={closeMobileMenu}
                                className={cn(
                                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                    location.pathname === '/'
                                        ? 'text-primary bg-primary/10'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                                )}
                            >
                                {t.common.home}
                            </Link>
                            <Link
                                to="/docs"
                                onClick={closeMobileMenu}
                                className={cn(
                                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                    location.pathname.startsWith('/docs') && !location.pathname.includes('/edit') && !location.pathname.includes('/new')
                                        ? 'text-primary bg-primary/10'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                                )}
                            >
                                {t.common.articles}
                            </Link>
                            {canCreateDoc && (
                                <Link
                                    to="/docs/new"
                                    onClick={closeMobileMenu}
                                    className={cn(
                                        'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                        location.pathname === '/docs/new'
                                            ? 'text-primary bg-primary/10'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                                    )}
                                >
                                    {t.common.write}
                                </Link>
                            )}

                            <Separator className="my-2" />

                            {isLoggedIn ? (
                                <>
                                    <div className="px-3 py-2 text-sm font-medium text-foreground">
                                        {user?.nick_name || user?.username}
                                    </div>
                                    <button
                                        onClick={() => {
                                            changeLanguage(language === 'zh-hans' ? 'en' : 'zh-hans');
                                            closeMobileMenu();
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                                    >
                                        <Globe className="h-4 w-4" />
                                        {language === 'zh-hans' ? t.common.switchToEn : t.common.switchToZh}
                                    </button>
                                    <button
                                        onClick={() => {
                                            signOut();
                                            closeMobileMenu();
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {t.common.logout}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            changeLanguage(language === 'zh-hans' ? 'en' : 'zh-hans');
                                            closeMobileMenu();
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                                    >
                                        <Globe className="h-4 w-4" />
                                        {language === 'zh-hans' ? t.common.switchToEn : t.common.switchToZh}
                                    </button>
                                    <Button onClick={() => {
                                        login(); closeMobileMenu();
                                    }} className="mx-3">
                                        {t.common.login}
                                    </Button>
                                </>
                            )}
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
};

export default Header;
