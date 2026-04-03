import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Tables from '@/lib/tables';

export type UserRole = 'Administrator' | 'Editor';

export interface UserPermissions {
  role: UserRole;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
}

const normalizeRole = (value?: string | null): UserRole => {
  const role = (value || '').toLowerCase();

  if (role === 'admin' || role === 'administrator') return 'Administrator';
  return 'Editor';
};

const rolePermissions: Record<UserRole, UserPermissions> = {
  Administrator: {
    role: 'Administrator',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canAccessSettings: true,
  },
  Editor: {
    role: 'Editor',
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageUsers: true,
    canAccessSettings: false,
  },
};

export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserPermissions = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setPermissions(null);
          return;
        }

        const { data: userData } = await supabase
          .from(Tables.Profiles)
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle();

        if (!userData) {
          setPermissions(null);
          return;
        }

        const role = normalizeRole(userData.role);
        setPermissions(rolePermissions[role]);
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    getUserPermissions();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getUserPermissions();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { permissions, loading };
};
