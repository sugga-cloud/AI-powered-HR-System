import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Plus, Video, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader } from "@/components/shared/Loader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { interviewApi } from "@/api/interviewApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function InterviewList() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['interviews', selectedStatus],
    queryFn: () => interviewApi.list({ role: 'candidate', ...(selectedStatus ? { status: selectedStatus } : {}) }),
  });

  const interviews = data?.interviews ?? [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      interviewApi.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success("Interview status updated");
      refetch();
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      scheduled: { className: "bg-info text-info-foreground", label: "Scheduled" },
      in_progress: { className: "bg-warning text-warning-foreground", label: "In Progress" },
      completed: { className: "bg-success text-success-foreground", label: "Completed" },
      cancelled: { className: "bg-destructive text-destructive-foreground", label: "Cancelled" },
      rescheduled: { className: "bg-secondary text-secondary-foreground", label: "Rescheduled" },
    };
    const config = variants[status] || variants.scheduled;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) return <Loader size="lg" text="Loading interviews..." />;
  if (error) return <ErrorState message="Failed to load interviews" retry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Interview Schedule"
        description="Manage and track candidate interviews"
        actions={
          <Button onClick={() => navigate('/dashboard/interview/schedule')}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        }
      />

      {!interviews || interviews.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No interviews scheduled"
          description="Schedule interviews with shortlisted candidates"
          action={{
            label: "Schedule Interview",
            onClick: () => navigate('/dashboard/interview/schedule'),
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job Position</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Interviewer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviews.map((interview) => (
                  <TableRow key={interview._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{interview.name}</p>
                        <p className="text-sm text-muted-foreground">{interview.candidateEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{interview.jobTitle}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {new Date(interview.scheduledAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(interview.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{interview.interviewerName || 'Not assigned'}</TableCell>
                    <TableCell>
                      {interview.meetingLink ? (
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1"
                        >
                          <Video className="h-3 w-3" />
                          Join Meeting
                        </a>
                      ) : (
                        <span className="text-sm">{interview.location}</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(interview.status)}</TableCell>
                    <TableCell className="text-right">
                      {interview.status === 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: interview.id,
                              status: 'completed',
                            })
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                      {interview.status === 'completed' && interview.rating && (
                        <span className="text-sm">
                          Rating: {interview.rating}/5
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
