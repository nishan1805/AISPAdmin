import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Tables from '@/lib/tables';

export type UserRole = 'Admin' | 'Editor' | 'Viewer';

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

  if (role === 'admin' || role === 'administrator') return 'Admin';
  if (role === 'editor') return 'Editor';
  return 'Viewer';
};

const rolePermissions: Record<UserRole, UserPermissions> = {
  Admin: {
    role: 'Admin',
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
    canManageUsers: false,
    canAccessSettings: false,
  },
  Viewer: {
    role: 'Viewer',
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
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

        let userData: any = null;

        // Primary lookup by user_id for established accounts.
        const { data: byUserId } = await supabase
          .from(Tables.UsersRoles)
          .select('id, user_id, email, role, access_level, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (byUserId) {
          userData = byUserId;
        } else if (user.email) {
          // Fallback for invited users where user_id may not yet be linked.
          const { data: byEmail } = await supabase
            .from(Tables.UsersRoles)
            .select('id, user_id, email, role, access_level, status')
            .eq('email', user.email)
            .maybeSingle();

          userData = byEmail;

          // Backfill user_id once user signs in.
          if (byEmail?.id && !byEmail.user_id) {
            await supabase
              .from(Tables.UsersRoles)
              .update({ user_id: user.id, status: byEmail.status || 'Active' })
              .eq('id', byEmail.id);
          }
        }

        if (!userData) {
          setPermissions(null);
          return;
        }

        if ((userData.status || '').toLowerCase() === 'inactive') {
          setPermissions(rolePermissions.Viewer);
          return;
        }

        const role = normalizeRole(userData.access_level || userData.role);
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
