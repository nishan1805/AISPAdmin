"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import * as yupLib from "yup";
import { Resend } from "resend";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const userSchema = yupLib.object({
  name: yupLib.string().required("Name is required"),
  email: yupLib.string().email("Invalid email").when('$isEditing', {
    is: true,
    then: (schema) => schema.optional(),
    otherwise: (schema) => schema.required("Email is required")
  }),
  accessLevel: yupLib.string().oneOf(["Admin", "Editor", "Viewer"], "Invalid role").required("Role is required"),
});

type UserForm = yupLib.InferType<typeof userSchema>;

interface AddUserDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string | number;
    user_id?: string;
    name?: string;
    accessLevel?: string;
    email?: string;
  } | null;
}

export default function AddUserDialog({ open: controlledOpen, onOpenChange, onSuccess, initialData = null }: AddUserDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => { }) : setInternalOpen;

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<UserForm>({
    resolver: yupResolver(userSchema),
    context: { isEditing: !!(initialData && initialData.id) }
  });

  const onSubmit = async (data: UserForm) => {
    try {
      // Debug: Check current user session
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user creating new user:', currentUser);

      if (initialData && initialData.id) {
        // Edit flow - only update the users_roles table
        const { error: updateError } = await supabase
          .from(Tables.UsersRoles)
          .update({
            name: data.name,
            role: "Administrator", // Always set role to Administrator
            access_level: data.accessLevel,
          })
          .eq("id", initialData.id);

        if (updateError) throw updateError;

        toast.success("User updated successfully");
      } else {
        // Create flow
        if (!data.email) {
          throw new Error("Email is required for new users");
        }

        // Create user in Supabase Auth with a temporary password
        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email!,
          password: tempPassword,
          options: {
            data: {
              name: data.name,
              role: "Administrator", // Always set role to Administrator
              access_level: data.accessLevel,
            }
          }
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error("Failed to create user account");
        }

        // Wait a moment for the user to be fully created in auth.users
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Store additional user info in users_roles table
        console.log('Attempting to insert into users_roles:', {
          user_id: authData.user.id,
          name: data.name,
          email: data.email,
          role: "Administrator",
          department: "",
          access_level: data.accessLevel,
          status: "Active",
        });

        const { error: insertError } = await supabase.from(Tables.UsersRoles).insert([
          {
            user_id: authData.user.id,
            name: data.name,
            email: data.email,
            role: "Administrator", // Always set role to Administrator
            department: "", // Default empty department
            access_level: data.accessLevel,
            status: "Active",
          },
        ]);

        console.log('Insert result:', { data: null, error: insertError });

        if (insertError) {
          console.error('Insert error details:', insertError);
          throw insertError;
        }

        // Send password reset email instead of credentials
        try {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email!, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/set-password`,
          });

          if (resetError) throw resetError;
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
          toast.warning("User created but failed to send password reset email. Please check email configuration.");
        }

        toast.success("User created successfully and password reset email sent");
      }

      reset();
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error creating/updating user:", err);
      toast.error(err.message || "Failed to create/update user");
    }
  }; return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle>{initialData && initialData.id ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-sm">Name</Label>
            <Input placeholder="Name" {...register("name")} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Email ID</Label>
            <Input
              placeholder="Email ID"
              {...register("email")}
              disabled={!!(initialData && initialData.id)}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            {initialData && initialData.id && (
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed after account creation</p>
            )}
          </div>

          <div>
            <Label className="text-sm">Role</Label>
            <Controller
              name="accessLevel"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin - Full access</SelectItem>
                    <SelectItem value="Editor">Editor - Create and edit content</SelectItem>
                    <SelectItem value="Viewer">Viewer - Read-only access</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.accessLevel && <p className="text-red-500 text-sm">{errors.accessLevel.message}</p>}
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={() => { reset(); setOpen(false); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? initialData && initialData.id
                  ? "Updating..."
                  : "Creating..."
                : initialData && initialData.id
                  ? "Update User"
                  : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
