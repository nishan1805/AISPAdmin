"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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
import { supabase } from "@/supabase/client"; const statusOptions = [
    { value: "New", label: "New" },
    { value: "Shortlisted", label: "Shortlisted" },
    { value: "Interviewed", label: "Interviewed" },
    { value: "Rejected", label: "Rejected" },
    { value: "Selected", label: "Selected" },
];

const applicationStatusSchema = yup.object({
    fullName: yup.string().required("Full name is required"),
    phoneNo: yup.string().required("Phone number is required"),
    emailId: yup.string().email("Invalid email").required("Email is required"),
    appliedOn: yup.string().required("Applied date is required"),
    status: yup.string().oneOf(["New", "Shortlisted", "Interviewed", "Rejected", "Selected"], "Please select a valid status").required("Status is required"),
    notes: yup.string().optional(),
});

type ApplicationStatusFormData = yup.InferType<typeof applicationStatusSchema>;

interface ApplicationStatusDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
    initialData?: {
        id?: string | number;
        fullName?: string;
        phoneNo?: string;
        emailId?: string;
        appliedOn?: string;
        status?: string;
        notes?: string;
    } | null;
}

export default function ApplicationStatusDialog({
    open: controlledOpen,
    onOpenChange,
    onSuccess,
    initialData = null,
}: ApplicationStatusDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open =
        typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
    const setOpen =
        typeof controlledOpen === "boolean"
            ? onOpenChange ?? (() => { })
            : setInternalOpen;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<ApplicationStatusFormData>({
        resolver: yupResolver(applicationStatusSchema),
    });

    const selectedStatus = watch("status");

    // Prefill form when editing
    useEffect(() => {
        if (initialData) {
            if (initialData.fullName) setValue("fullName", initialData.fullName);
            if (initialData.phoneNo) setValue("phoneNo", initialData.phoneNo);
            if (initialData.emailId) setValue("emailId", initialData.emailId);
            if (initialData.appliedOn) setValue("appliedOn", initialData.appliedOn);
            if (initialData.status) setValue("status", initialData.status as any);
            if (initialData.notes) setValue("notes", initialData.notes);
        } else {
            reset();
        }
    }, [initialData]);

    const onSubmit = async (data: ApplicationStatusFormData) => {
        try {
            if (initialData && initialData.id) {
                // UPDATE mode
                const { error: updateErr } = await supabase
                    .from("job_applications")
                    .update({
                        full_name: data.fullName,
                        phone_no: data.phoneNo,
                        email_id: data.emailId,
                        applied_on: data.appliedOn,
                        status: data.status,
                        notes: data.notes,
                    })
                    .eq("id", initialData.id);

                if (updateErr) throw updateErr;

                toast.success("Application status updated successfully!");
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
                    <DialogTitle className="text-lg font-semibold">
                        Application Details
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
                    {/* Full Name */}
                    <div>
                        <Label htmlFor="fullName" className="text-sm font-medium">
                            Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            placeholder="Enter full name"
                            {...register("fullName")}
                            className={`mt-1 ${errors.fullName ? "border-red-500" : ""}`}
                            disabled={isSubmitting}
                        />
                        {errors.fullName && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.fullName.message}
                            </p>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div>
                        <Label htmlFor="phoneNo" className="text-sm font-medium">
                            Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="phoneNo"
                            placeholder="Enter phone number"
                            {...register("phoneNo")}
                            className={`mt-1 ${errors.phoneNo ? "border-red-500" : ""}`}
                            disabled={isSubmitting}
                        />
                        {errors.phoneNo && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.phoneNo.message}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <Label htmlFor="emailId" className="text-sm font-medium">
                            Email ID <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="emailId"
                            type="email"
                            placeholder="Enter email"
                            {...register("emailId")}
                            className={`mt-1 ${errors.emailId ? "border-red-500" : ""}`}
                            disabled={isSubmitting}
                        />
                        {errors.emailId && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.emailId.message}
                            </p>
                        )}
                    </div>

                    {/* Applied On */}
                    <div>
                        <Label htmlFor="appliedOn" className="text-sm font-medium">
                            Applied On <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="appliedOn"
                            type="date"
                            {...register("appliedOn")}
                            className={`mt-1 ${errors.appliedOn ? "border-red-500" : ""}`}
                            disabled={isSubmitting}
                        />
                        {errors.appliedOn && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.appliedOn.message}
                            </p>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <Label htmlFor="status" className="text-sm font-medium">
                            Status <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={selectedStatus || ""}
                            onValueChange={(value) => setValue("status", value as any, { shouldValidate: true })}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.status.message}
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes" className="text-sm font-medium">
                            Notes (Optional)
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any notes about this application..."
                            {...register("notes")}
                            disabled={isSubmitting}
                            className="mt-1 min-h-[80px]"
                        />
                    </div>

                    {/* Footer */}
                    <DialogFooter className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                reset();
                                setOpen(false);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            onClick={() => handleSubmit(onSubmit)()}
                        >
                            {isSubmitting ? "Updating..." : "Update Application"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}