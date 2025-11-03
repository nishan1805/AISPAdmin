"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getApplicationColumns, JobApplication } from "./components/columns";
import ApplicationStatusDialog from "./components/ApplicationStatusDialog";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";


export default function JobApplicationsPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.jobId as string;

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
    const [data, setData] = useState<JobApplication[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [jobDetails, setJobDetails] = useState<any>(null);

    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<any | null>(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    // -------------------- Fetch Job Details --------------------
    const fetchJobDetails = async () => {
        try {
            const { data: job, error } = await supabase
                .from(Tables.Jobs)
                .select("*")
                .eq("id", jobId)
                .single();

            if (error) {
                console.error("Failed to fetch job details:", error);
                toast.error("Failed to fetch job details");
                return;
            }

            setJobDetails(job);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch job details");
        }
    };

    // -------------------- Fetch Applications Data --------------------
    const fetchData = async () => {
        setLoading(true);

        let query = supabase
            .from("job_applications")
            .select("*", { count: "exact" })
            .eq("job_id", jobId)
            .order("created_at", { ascending: false });

        // Apply search filter
        if (searchQuery.trim()) {
            query = query.or(`full_name.ilike.%${searchQuery}%,email_id.ilike.%${searchQuery}%,phone_no.ilike.%${searchQuery}%`);
        }

        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;
        const { data: rows, error, count } = await query.range(from, to);

        if (error) {
            console.error("Failed to fetch applications:", error);
            toast.error("Failed to fetch applications");
            setData([]);
        } else {
            setData(
                (rows || []).map((r: any, idx: number) => ({
                    id: String(r.id ?? idx),
                    applicantSno: r.applicant_sno ?? "",
                    fullName: r.full_name ?? "",
                    phoneNo: r.phone_no ?? "",
                    emailId: r.email_id ?? "",
                    appliedOn: r.applied_on ?? "",
                    attachment: r.attachment_url ?? "",
                    status: r.status ?? "New",
                    notes: r.notes ?? "",
                }))
            );
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

    // -------------------- Status Update Handler --------------------
    const handleUpdateStatus = (row: JobApplication) => {
        setEditTarget(row);
        setStatusDialogOpen(true);
    };

    // -------------------- Delete Handler --------------------
    const handleDelete = (id: string) => {
        setDeleteTargetId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        try {
            const { error } = await supabase
                .from("job_applications")
                .delete()
                .eq("id", deleteTargetId);

            if (error) {
                console.error("Failed to delete application:", error);
                toast.error("Failed to delete application");
                return;
            }

            toast.success("Application deleted successfully");
            setDeleteDialogOpen(false);
            setDeleteTargetId(null);
            await fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete application");
        }
    };

    // -------------------- Delete Multiple --------------------
    const deleteSelected = async () => {
        if (!selectedRows.length) {
            toast.error("No applications selected");
            return;
        }
        try {
            const ids = selectedRows.map((id) => String(id));
            const { error } = await supabase
                .from("job_applications")
                .delete()
                .in("id", ids);

            if (error) {
                console.error("Failed to delete selected applications:", error);
                toast.error("Failed to delete selected applications");
                return;
            }

            toast.success("Selected applications deleted");
            setSelectedRows([]);
            await fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Action failed");
        }
    };

    // -------------------- Lifecycle --------------------
    useEffect(() => {
        if (jobId) {
            fetchJobDetails();
            fetchData();
        }
    }, [jobId, page, rowsPerPage, searchQuery]);

    // -------------------- JSX --------------------
    return (
        <div className="p-8">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/jobs")}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Jobs
                </Button>

                <div className="mb-4">
                    <h1 className="text-3xl font-bold text-slate-800">Job Applications</h1>
                    {jobDetails && (
                        <div className="mt-2 text-slate-600">
                            <p><strong>Job:</strong> {jobDetails.title}</p>
                            <p><strong>Subject:</strong> {jobDetails.subject}</p>
                            <p><strong>Department:</strong> {jobDetails.department}</p>
                            <p><strong>Job Type:</strong> {jobDetails.job_type}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search applications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        {selectedRows.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={deleteSelected}
                                size="sm"
                            >
                                Delete Selected ({selectedRows.length})
                            </Button>
                        )}
                    </div>
                </div>

                <ApplicationStatusDialog
                    open={statusDialogOpen}
                    onOpenChange={(open: boolean) => {
                        setStatusDialogOpen(open);
                        if (!open) setEditTarget(null);
                    }}
                    onSuccess={fetchData}
                    initialData={editTarget}
                />                <ConfirmActionDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Do you want to delete this application?"
                    description="This action cannot be undone"
                    confirmLabel="Delete"
                    onConfirm={confirmDelete}
                />

                <DataTable
                    columns={getApplicationColumns(handleUpdateStatus, handleDelete)}
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