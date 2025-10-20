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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import * as yupLib from "yup";

const jobSchema = yupLib.object({
  title: yupLib.string().required("Title is required"),
  department: yupLib.string().required("Department is required"),
  postedDate: yupLib.string().required("Posted date is required"),
  lastDateToApply: yupLib.string().required("Last date to apply is required"),
  jobType: yupLib.string().required("Job type is required"),
});

type JobForm = yupLib.InferType<typeof jobSchema>;

interface AddJobDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddJobDialog({ open: controlledOpen, onOpenChange, onSuccess }: AddJobDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => {}) : setInternalOpen;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<JobForm>({ resolver: yupResolver(jobSchema) });

  const onSubmit = async (data: JobForm) => {
    try {
      const { error: insertError } = await supabase.from(Tables.Jobs).insert([
        {
          title: data.title,
          department: data.department,
          posted_date: data.postedDate,
          last_date_to_apply: data.lastDateToApply,
          job_type: data.jobType,
          status: "Open",
        },
      ]);

      if (insertError) throw insertError;

      toast.success("Job created successfully");
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
          <DialogTitle>Create Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-sm">Title / Job Role</Label>
            <Input placeholder="Job title" {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Department</Label>
            <Input placeholder="Department" {...register("department")} />
            {errors.department && <p className="text-red-500 text-sm">{errors.department.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Posted Date</Label>
            <Input type="date" {...register("postedDate")} />
            {errors.postedDate && <p className="text-red-500 text-sm">{errors.postedDate.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Last Date to Apply</Label>
            <Input type="date" {...register("lastDateToApply")} />
            {errors.lastDateToApply && <p className="text-red-500 text-sm">{errors.lastDateToApply.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Job Type</Label>
            <Input placeholder="Job Type" {...register("jobType")} />
            {errors.jobType && <p className="text-red-500 text-sm">{errors.jobType.message}</p>}
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Job"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
