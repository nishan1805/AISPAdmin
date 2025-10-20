"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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

const userSchema = yupLib.object({
  name: yupLib.string().required("Name is required"),
  email: yupLib.string().email("Invalid email").required("Email is required"),
  role: yupLib.string().required("Role is required"),
  department: yupLib.string().required("Section is required"),
  accessLevel: yupLib.string().required("Access permissions are required"),
});

type UserForm = yupLib.InferType<typeof userSchema>;

interface AddUserDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddUserDialog({ open: controlledOpen, onOpenChange, onSuccess }: AddUserDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => {}) : setInternalOpen;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserForm>({ resolver: yupResolver(userSchema) });

  const onSubmit = async (data: UserForm) => {
    try {
      const { error: insertError } = await supabase.from(Tables.UsersRoles).insert([
        {
          name: data.name,
          email: data.email,
          role: data.role,
          department: data.department,
          access_level: data.accessLevel,
          status: "Active",
        },
      ]);

      if (insertError) throw insertError;

      toast.success("User created successfully");
      reset();
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle>Add User Role</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-sm">Name</Label>
            <Input placeholder="Name" {...register("name")} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Email ID</Label>
            <Input placeholder="Email ID" {...register("email")} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Role</Label>
            <Input placeholder="Role" {...register("role")} />
            {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Section</Label>
            <Input placeholder="Section" {...register("department")} />
            {errors.department && <p className="text-red-500 text-sm">{errors.department.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Access Permissions</Label>
            <Input placeholder="Access Permissions" {...register("accessLevel")} />
            {errors.accessLevel && <p className="text-red-500 text-sm">{errors.accessLevel.message}</p>}
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
