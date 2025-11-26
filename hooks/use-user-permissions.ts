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

export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user);

        if (!user) {
          console.log('No user found');
          setPermissions(null);
          setLoading(false);
          return;
        }

        // Get user role from users_roles table
        const { data: userData, error } = await supabase
          .from(Tables.UsersRoles)
          .select('access_level')
          .eq('user_id', user.id)
          .single();

        if (error || !userData) {
          console.warn('Could not fetch user permissions:', error);
          setPermissions(null);
          setLoading(false);
          return;
        }

        const role = userData.access_level as UserRole;

        // Define permissions based on role
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

        setPermissions(rolePermissions[role] || null);
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    getUserPermissions();
  }, []);

  return { permissions, loading };
};