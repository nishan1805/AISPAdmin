"use client";

import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import * as yupLib from "yup";

const jobSchema = yupLib.object({
  title: yupLib.string().required("Title is required"),
  department: yupLib.string().required("Department is required"),
  subject: yupLib.string().required("Subject is required"),
  description: yupLib.string().optional(),
  lastDateToApply: yupLib.string().required("Last date to apply is required"),
  jobType: yupLib.string().oneOf(["Regular", "Part-Time", "Guest", "Contract"], "Please select a valid job type").required("Job type is required"),
});

type JobForm = yupLib.InferType<typeof jobSchema>;

interface AddJobDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string | number;
    title?: string;
    department?: string;
    subject?: string;
    description?: string;
    jobType?: string;
    lastDateToApply?: string;
  } | null;
}

export default function AddJobDialog({ open: controlledOpen, onOpenChange, onSuccess, initialData = null }: AddJobDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => { }) : setInternalOpen;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<JobForm>({ resolver: yupResolver(jobSchema) });

  const selectedJobType = watch("jobType");

  // Prefill form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      if (initialData.title) setValue("title", initialData.title);
      if (initialData.department) setValue("department", initialData.department);
      if (initialData.subject) setValue("subject", initialData.subject);
      if (initialData.description) setValue("description", initialData.description);
      if (initialData.jobType) setValue("jobType", initialData.jobType as any);
      if (initialData.lastDateToApply) setValue("lastDateToApply", initialData.lastDateToApply);
    } else {
      reset();
    }
  }, [initialData]);

  const onSubmit = async (data: JobForm) => {
    try {
      if (initialData && initialData.id) {
        // Edit flow
        const { error: updateError } = await supabase
          .from(Tables.Jobs)
          .update({
            title: data.title,
            department: data.department,
            subject: data.subject,
            description: data.description,
            last_date_to_apply: data.lastDateToApply,
            job_type: data.jobType,
          })
          .eq("id", initialData.id);

        if (updateError) throw updateError;
        toast.success("Job updated successfully");
      } else {
        // Create flow
        const { error: insertError } = await supabase.from(Tables.Jobs).insert([
          {
            title: data.title,
            department: data.department,
            subject: data.subject,
            description: data.description,
            last_date_to_apply: data.lastDateToApply,
            job_type: data.jobType,
            status: "Open",
            visibility: true,
          },
        ]);

        if (insertError) throw insertError;
        toast.success("Job created successfully");
      }

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
          <DialogTitle>{initialData && initialData.id ? "Edit Job" : "Create Job"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-sm">Job Title</Label>
            <Input placeholder="Job title" {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Subject</Label>
            <Input placeholder="Subject" {...register("subject")} />
            {errors.subject && <p className="text-red-500 text-sm">{errors.subject.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Department</Label>
            <Input placeholder="Department" {...register("department")} />
            {errors.department && <p className="text-red-500 text-sm">{errors.department.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Description (Optional)</Label>
            <Textarea placeholder="Job description..." {...register("description")} className="min-h-[80px]" />
          </div>

          <div>
            <Label className="text-sm">Last Date to Apply</Label>
            <Input type="date" {...register("lastDateToApply")} />
            {errors.lastDateToApply && <p className="text-red-500 text-sm">{errors.lastDateToApply.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Job Type</Label>
            <Select
              value={selectedJobType || ""}
              onValueChange={(value) => setValue("jobType", value as any, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Part-Time">Part-Time</SelectItem>
                <SelectItem value="Guest">Guest</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            {errors.jobType && <p className="text-red-500 text-sm">{errors.jobType.message}</p>}
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={() => { reset(); setOpen(false); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? initialData && initialData.id
                  ? "Updating..."
                  : "Creating..."
                : initialData && initialData.id
                  ? "Update Job"
                  : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
