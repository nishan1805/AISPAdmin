"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { menuData, MenuSection, MenuItem } from '@/lib/menu-data';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.FileText;
    return <Icon size={18} />;
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-screen">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10">
            <img
              src="https://images.pexels.com/photos/207662/pexels-photo-207662.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop"
              alt="Logo"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {menuData.map((section: MenuSection, sectionIdx: number) => (
          <div key={sectionIdx} className="mb-6">
            <h3 className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {section.Heading}
            </h3>
            <ul>
              {section.Menus.map((menu: MenuItem, menuIdx: number) => {
                const isActive = pathname === menu.Path;
                return (
                  <li key={menuIdx}>
                    <Link
                      href={menu.Path}
                      className={`flex items-center px-6 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-3 border-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`mr-3 ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                        {getIcon(menu.Icon)}
                      </span>
                      {menu.Name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} className="mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}
