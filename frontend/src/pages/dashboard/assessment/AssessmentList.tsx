import { useQuery, useMutation } from "@tanstack/react-query";
import { ClipboardList, Plus, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/shared/Loader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { assessmentApi } from "@/api/assessmentApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axiosClient from "@/api/axiosClient";
import { useState } from "react";

export default function AssessmentList() {
  const navigate = useNavigate();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['shortlisted-candidates'],
    queryFn: assessmentApi.getShortlisted,
  });
  console.log("API Response for shortlisted candidates:", response);
  const shortlisted = response?.shortlisted || [];

  const scheduleInterviewsMutation = useMutation({
    mutationFn: async ({ candidateId, batch }: { candidateId?: string; batch: boolean }) => {
      if (shortlisted.length === 0) {
        throw new Error("No shortlisted candidates available");
      }

      // Get job_id - handle both populated object and direct ID
      const firstCandidate = shortlisted[0];

      // Log for debugging
      console.log("📋 First Candidate Data:", {
        _id: firstCandidate._id,
        candidateId: firstCandidate.candidateId,
        job_id: firstCandidate.job_id,
        fullData: firstCandidate,
      });

      const jobId = firstCandidate?.job_id?._id || firstCandidate?.job_id;

      if (!jobId) {
        console.error("❌ Job ID Error - Full candidate data:", JSON.stringify(firstCandidate, null, 2));
        throw new Error(
          `Job ID not found in candidate data.\n` +
          `Candidate: ${firstCandidate?.candidateId?.name || "Unknown"}\n` +
          `Job ID Field: ${JSON.stringify(firstCandidate?.job_id)}`
        );
      }

      const payload: any = {
        job_id: jobId,
        interviewer_ids: [], // Empty array - will be assigned by HR manager later
        mode: 'online',
      };

      if (batch) {
        payload.batch = true; // Batch mode: schedule for all shortlisted candidates
      } else if (candidateId) {
        payload.candidateId = candidateId; // Single mode: schedule for specific candidate
      } else {
        throw new Error("Invalid scheduling parameters");
      }

      const response = await axiosClient.post('/is/create', payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (variables.batch) {
        toast.success(`✅ ${data.scheduled_count} interview(s) scheduled successfully!`);
      } else {
        toast.success("✅ Interview scheduled successfully!");
      }
      setSelectedCandidateId(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to schedule interviews");
    },
  });

  if (isLoading) return <Loader size="lg" text="Loading assessments..." />;
  if (error) return <ErrorState message="Failed to load assessments" retry={refetch} />;
console.log("Shortlisted Candidates:", shortlisted);
  return (
    <div>
      <PageHeader
        title="Candidate Assessments"
        description="Monitor test performance and shortlist candidates"
        actions={
          shortlisted.length > 0 ? (
            <div className="flex gap-2">
              <Button
                onClick={() => scheduleInterviewsMutation.mutate({ batch: true })}
                disabled={scheduleInterviewsMutation.isPending}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                {scheduleInterviewsMutation.isPending ? "Scheduling..." : "Schedule All Interviews"}
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{shortlisted?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {shortlisted?.filter(c => c.ai_analysis?.final_recommendation === 'yes' || c.ai_analysis?.final_recommendation === 'strong_yes').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Below 70%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {shortlisted?.filter(c => c.percentage && c.percentage < 70).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {!shortlisted || shortlisted.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assessments yet"
          description="Shortlisted candidates will be sent assessment tests automatically"
        />
      ) : (
        <div className="grid gap-4">
          {shortlisted.map((candidate) => (
            <Card key={candidate._id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{candidate.candidateId.name}</h3>
                      <Badge variant={candidate.percentage >= 70 ? 'default' : 'secondary'}>
                        {candidate.ai_analysis?.final_recommendation || 'pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{candidate.candidateId.email}</p>

                    {candidate.percentage !== undefined && (
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Test Score:</span>
                          <span className="ml-2 font-semibold text-lg">{candidate.percentage}%</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Total Score:</span>
                          <span className="ml-2 font-semibold text-lg">{candidate.total_score}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/dashboard/assessment/${candidate._id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => scheduleInterviewsMutation.mutate({ candidateId: candidate.candidateId._id, batch: false })}
                      disabled={scheduleInterviewsMutation.isPending}
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
