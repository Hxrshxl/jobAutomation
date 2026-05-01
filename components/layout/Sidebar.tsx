'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Terminal, Briefcase, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '../ui/sheet';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Logs', href: '/logs', icon: Terminal },
  ];

  const NavLinks = () => (
    <div className="flex flex-col space-y-2 mt-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              isActive ? 'bg-neutral-200 text-neutral-900 font-medium' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] md:w-[60px] lg:w-[240px] border-r border-zinc-200 bg-zinc-50 h-full p-4 overflow-hidden group hover:md:w-[240px] transition-all duration-300">
        <div className="flex items-center space-x-2 mb-6 px-2 min-w-[200px]">
          <Briefcase className="w-6 h-6 text-neutral-900 flex-shrink-0" />
          <span className="text-lg font-semibold tracking-tight text-neutral-900 lg:inline-block md:hidden group-hover:md:inline-block">
            Job Pipeline
          </span>
        </div>
        <div className="lg:block md:hidden group-hover:md:block min-w-[200px]">
          <NavLinks />
        </div>
        <div className="hidden md:flex lg:hidden group-hover:md:hidden flex-col space-y-4 mt-4 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} title={item.name}>
                <div className={`p-2 rounded-md ${isActive ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile Hamburger (will be integrated in top bar layout or here via absolute positioning if needed, but standard is topbar) */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger className="p-2 -ml-2 rounded-md text-neutral-600 hover:bg-neutral-100">
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] p-4 bg-zinc-50">
            <SheetTitle className="flex items-center space-x-2 mb-6 px-2">
              <Briefcase className="w-6 h-6 text-neutral-900" />
              <span className="text-lg font-semibold tracking-tight text-neutral-900">Job Pipeline</span>
            </SheetTitle>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
