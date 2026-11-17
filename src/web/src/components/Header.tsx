import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router';
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
import { User, LogOut, Menu, X } from 'lucide-react';

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
    const { user, isLoggedIn, hasPermission, signOut, login } = useApp();
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
                    <img src="/logo.webp?v=202606282208" alt="iWiki" className="h-6" />
                </Link>

                {/* 桌面导航 */}
                <nav className="hidden md:flex items-center gap-1">
                    <NavLink to="/" active={location.pathname === '/'}>
                        首页
                    </NavLink>
                    <NavLink
                        to="/docs"
                        active={location.pathname.startsWith('/docs') && !location.pathname.includes('/edit') && !location.pathname.includes('/new')}
                    >
                        文章
                    </NavLink>
                    {canCreateDoc && (
                        <NavLink to="/docs/new" active={location.pathname === '/docs/new'}>
                            写文章
                        </NavLink>
                    )}
                </nav>

                {/* 桌面用户菜单 */}
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
                                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    退出登录
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button onClick={login} size="sm">
                            登录
                        </Button>
                    )}
                </div>

                {/* 移动端菜单 */}
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
                                首页
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
                                文章
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
                                    写文章
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
                                            signOut();
                                            closeMobileMenu();
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        退出登录
                                    </button>
                                </>
                            ) : (
                                <Button onClick={() => {
                                    login(); closeMobileMenu();
                                }} className="mx-3">
                                    登录
                                </Button>
                            )}
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
};

export default Header;
