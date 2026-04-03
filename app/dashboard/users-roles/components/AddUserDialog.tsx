"use client";

import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const userSchema = yupLib.object({
  name: yupLib.string().required("Name is required"),
  email: yupLib.string().email("Invalid email").optional(),
  accessLevel: yupLib
    .string()
    .oneOf(["Administrator", "Editor"], "Invalid role")
    .required("Role is required"),
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

  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = useForm<UserForm>({
    resolver: yupResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      accessLevel: "Editor",
    },
  });

  useEffect(() => {
    if (initialData?.id) {
      setValue("name", initialData.name || "");
      setValue("email", initialData.email || "");
      setValue("accessLevel", (initialData.accessLevel as "Administrator" | "Editor") || "Editor");
    } else {
      reset({ name: "", email: "", accessLevel: "Editor" });
    }
  }, [initialData, setValue, reset]);

  const onSubmit = async (data: UserForm) => {
    try {
      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from(Tables.Profiles)
          .update({
            full_name: data.name,
            role: data.accessLevel,
          })
          .eq("id", initialData.id);

        if (updateError) throw updateError;

        toast.success("User updated successfully");
      } else {
        if (!data.email) {
          throw new Error("Email is required for invite");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;
        if (!token) {
          throw new Error("Session expired. Please login again.");
        }

        const response = await fetch("/api/admin/invite-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            accessLevel: data.accessLevel,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to invite user");
        }

        toast.success(payload?.message || "Invite sent successfully");
      }

      reset({ name: "", email: "", accessLevel: "Editor" });
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error creating/updating user:", err);
      toast.error(err.message || "Failed to create/update user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit User Role" : "Invite User"}</DialogTitle>
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
              disabled={!!initialData?.id}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            {initialData?.id && (
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed after invite</p>
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
                    <SelectItem value="Administrator">Administrator - Full access</SelectItem>
                    <SelectItem value="Editor">Editor - Content management</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.accessLevel && <p className="text-red-500 text-sm">{errors.accessLevel.message}</p>}
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={() => { reset({ name: "", email: "", accessLevel: "Editor" }); setOpen(false); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? initialData?.id
                  ? "Updating..."
                  : "Inviting..."
                : initialData?.id
                  ? "Update User"
                  : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
