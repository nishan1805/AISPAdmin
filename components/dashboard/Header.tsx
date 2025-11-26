"use client";

import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Tables from '@/lib/tables';

interface UserData {
  email: string;
  access_level: string;
}

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from(Tables.UsersRoles)
        .select('email, access_level')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }
      setUserData(data);
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-slate-800">Admin Portal</h1>
      </div>

      <div className="flex items-center space-x-6">

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-3 hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors">
            <Avatar className="w-9 h-9">
              <AvatarImage src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" />
              <AvatarFallback className="bg-blue-600 text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-800">{userData?.email || 'User'}</p>
              <p className="text-xs text-slate-500">{userData?.access_level || 'Viewer'}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
