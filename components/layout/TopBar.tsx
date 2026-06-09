'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

function MoonIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" /></svg>;
}

function SunIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>;
}

function NavLink({ href, children, end }: { href: string; children: React.ReactNode; end?: boolean }) {
  const pathname = usePathname();
  const isActive = end ? pathname === href : pathname.startsWith(href);
  return (
    <Link href={href}
      className={['px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'].join(' ')}>
      {children}
    </Link>
  );
}

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-700 dark:bg-gray-900/90">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-6 px-6 py-3">
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold tracking-tight text-indigo-600 dark:text-indigo-400">VGLog</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">Gaming since 2008</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink href="/" end>Home</NavLink>
          <NavLink href="/completed">Completed</NavLink>
          <NavLink href="/upcoming">Upcoming</NavLink>
          <div className="relative">
            <button
              onClick={() => setAdminOpen(o => !o)}
              onBlur={() => setTimeout(() => setAdminOpen(false), 150)}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              Admin
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L1 3h10z" /></svg>
            </button>
            {adminOpen && (
              <div className="absolute left-0 top-full mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <Link href="/admin/platforms"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setAdminOpen(false)}>
                  Platforms
                </Link>
              </div>
            )}
          </div>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
