"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import FilterBar from "./components/FilterBar";
import { getJobColumns, Job } from "./components/columns";
import AddJobDialog from "./components/AddJobDialog";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";

type ActionType = "delete" | "visibility" | null;

export default function JobsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [data, setData] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ActionType>(null);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);

  // -------------------- Fetch Data --------------------
  const fetchData = async () => {
    setLoading(true);

    let query = supabase
      .from(Tables.Jobs)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply search filter
    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`);
    }

    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;
    const { data: rows, error, count } = await query.range(from, to);

    if (error) {
      console.error("Failed to fetch jobs:", error);
      toast.error("Failed to fetch jobs");
      setData([]);
    } else {
      // Fetch applicants count for each job
      const jobsWithCounts = await Promise.all(
        (rows || []).map(async (job: any) => {
          const { count: applicantsCount } = await supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id);

          return {
            id: String(job.id ?? 0),
            jobId: job.job_id ?? job.id ?? "",
            title: job.title ?? "",
            subject: job.subject ?? "",
            department: job.department ?? "",
            lastDateToApply: job.last_date_to_apply ?? "",
            jobType: job.job_type ?? "",
            status: job.status ?? "Open",
            visibility: !!job.visibility,
            applicantsCount: applicantsCount || 0,
          };
        })
      );

      setData(jobsWithCounts);
    }

    if (count !== null && count !== undefined) setTotalCount(count);
    setLoading(false);
  };

  // -------------------- Table Row Selection --------------------
  const handleRowSelect = (id: string | number, selected: boolean) => {
    setSelectedRows((prev) =>
      selected ? [...prev, id] : prev.filter((r) => r !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? data.map((row) => row.id) : []);
  };

  // -------------------- Action Handlers --------------------
  const handleToggleVisibility = (id: string, value: boolean) => {
    setConfirmTarget({ id, value });
    setConfirmActionType("visibility");
    setConfirmDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmTarget({ id });
    setConfirmActionType("delete");
    setConfirmDialogOpen(true);
  };

  // -------------------- Confirm Action --------------------
  const handleConfirmAction = async () => {
    if (!confirmActionType || !confirmTarget) return;

    try {
      if (confirmActionType === "visibility") {
        const { id, value } = confirmTarget;

        const { error } = await supabase
          .from(Tables.Jobs)
          .update({ visibility: value })
          .eq("id", id);

        if (error) throw error;

        toast.success(value ? "Job made visible" : "Job hidden");
      }

      if (confirmActionType === "delete") {
        const { id } = confirmTarget;

        // First, get all applications for this job to clean up their files
        const { data: applications, error: fetchError } = await supabase
          .from("job_applications")
          .select("attachment_url")
          .eq("job_id", id);

        if (fetchError) {
          console.warn("Could not fetch applications for file cleanup:", fetchError);
        }

        // Delete the job (this will cascade delete applications due to foreign key constraint)
        const { error } = await supabase
          .from(Tables.Jobs)
          .delete()
          .eq("id", id);

        if (error) throw error;

        // Clean up application files from storage
        if (applications && applications.length > 0) {
          const filesToDelete: string[] = [];

          applications.forEach((app) => {
            if (app.attachment_url) {
              try {
                const fileUrl = app.attachment_url;
                const urlParts = fileUrl.split("/");
                const bucketIndex = urlParts.findIndex((part: string) => part === "AISPPUR");

                if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                  const filePath = urlParts.slice(bucketIndex + 1).join("/");
                  const decodedPath = decodeURIComponent(filePath);
                  filesToDelete.push(decodedPath);
                }
              } catch (e) {
                console.warn("Could not parse file URL:", app.attachment_url);
              }
            }
          });

          if (filesToDelete.length > 0) {
            try {
              const { error: storageError } = await supabase.storage
                .from("AISPPUR")
                .remove(filesToDelete);

              if (storageError) {
                console.warn("Some application files could not be deleted from storage:", storageError);
              }
            } catch (storageErr) {
              console.warn("Could not delete application files from storage:", storageErr);
            }
          }
        }

        toast.success("Job and all applications deleted successfully");
      }

      // Refresh data after action
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    } finally {
      setConfirmDialogOpen(false);
      setConfirmActionType(null);
      setConfirmTarget(null);
    }
  };

  // -------------------- Delete Multiple --------------------
  const deleteSelected = async () => {
    if (!selectedRows.length) {
      toast.error("No rows selected");
      return;
    }

    try {
      const ids = selectedRows.map((id) => String(id));

      // First, get all applications for these jobs to clean up their files
      const { data: applications, error: fetchError } = await supabase
        .from("job_applications")
        .select("attachment_url")
        .in("job_id", ids);

      if (fetchError) {
        console.warn("Could not fetch applications for file cleanup:", fetchError);
      }

      // Delete the jobs (this will cascade delete applications due to foreign key constraint)
      const { error } = await supabase
        .from(Tables.Jobs)
        .delete()
        .in("id", ids);

      if (error) {
        console.error("Failed to delete selected jobs:", error);
        toast.error("Failed to delete selected items");
        return;
      }

      // Clean up application files from storage
      if (applications && applications.length > 0) {
        const filesToDelete: string[] = [];

        applications.forEach((app) => {
          if (app.attachment_url) {
            try {
              const fileUrl = app.attachment_url;
              const urlParts = fileUrl.split("/");
              const bucketIndex = urlParts.findIndex((part: string) => part === "AISPPUR");

              if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                const filePath = urlParts.slice(bucketIndex + 1).join("/");
                const decodedPath = decodeURIComponent(filePath);
                filesToDelete.push(decodedPath);
              }
            } catch (e) {
              console.warn("Could not parse file URL:", app.attachment_url);
            }
          }
        });

        if (filesToDelete.length > 0) {
          try {
            const { error: storageError } = await supabase.storage
              .from("AISPPUR")
              .remove(filesToDelete);

            if (storageError) {
              console.warn("Some application files could not be deleted from storage:", storageError);
            }
          } catch (storageErr) {
            console.warn("Could not delete application files from storage:", storageErr);
          }
        }
      }

      toast.success("Selected jobs and all applications deleted successfully");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    } finally {
      setSelectedRows([]);
    }
  };

  // -------------------- Edit Handler --------------------
  const handleEdit = async (row: Job) => {
    try {
      const { data: full, error } = await supabase
        .from(Tables.Jobs)
        .select("*")
        .eq("id", row.id)
        .single();

      if (error) {
        console.error("Failed to fetch record for edit:", error);
        setEditTarget(row);
        setIsDialogOpen(true);
        return;
      }

      const initial = {
        id: full.id,
        title: full.title ?? row.title,
        subject: full.subject ?? row.subject,
        department: full.department ?? "",
        description: full.description ?? "",
        jobType: full.job_type ?? row.jobType,
        lastDateToApply: full.last_date_to_apply ?? row.lastDateToApply,
      };

      setEditTarget(initial);
      setIsDialogOpen(true);
    } catch (err) {
      console.error(err);
      setEditTarget(row);
      setIsDialogOpen(true);
    }
  };

  // -------------------- View Applications Handler --------------------
  const handleViewApplications = (row: Job) => {
    router.push(`/dashboard/jobs/${row.id}/applications`);
  };

  // -------------------- Lifecycle --------------------
  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, searchQuery]);

  // -------------------- JSX --------------------
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Jobs</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <FilterBar
          onSearch={setSearchQuery}
          onAdd={() => setIsDialogOpen(true)}
          onDeleteSelected={deleteSelected}
        />

        <AddJobDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditTarget(null);
          }}
          onSuccess={fetchData}
          initialData={editTarget}
        />

        <ConfirmActionDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          title={
            confirmActionType === "delete"
              ? "Do you want to delete this job?"
              : confirmTarget?.value
                ? "Show this job on the website?"
                : "Hide this job from the website?"
          }
          description={
            confirmActionType === "delete"
              ? "This cannot be undone"
              : confirmTarget?.value
                ? "Users will see it on the website"
                : "Users will no longer see it"
          }
          confirmLabel={
            confirmActionType === "delete"
              ? "Delete"
              : confirmTarget?.value
                ? "Show"
                : "Hide"
          }
          variant={
            confirmActionType === "delete"
              ? "danger"
              : confirmTarget?.value
                ? "success"
                : "danger"
          }
          onConfirm={handleConfirmAction}
        />

        <DataTable
          columns={getJobColumns(handleToggleVisibility, handleDelete, handleEdit, handleViewApplications)}
          data={data}
          totalRecords={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          isLoading={loading}
          selectedRows={selectedRows}
          onRowSelect={handleRowSelect}
          onSelectAll={handleSelectAll}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}