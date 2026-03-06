import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Eye, CheckCircle, Filter, ExternalLink, Mail, Phone, Briefcase, Book, Code, Send } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/shared/Loader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { resumeApi } from "@/api/resumeApi";
import { jdApi } from "@/api/jdApi";
import { assessmentApi } from "@/api/assessmentApi";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Candidate, ShortlistedCandidate } from "@/types/candidate";

type CandidateData = Candidate | ShortlistedCandidate;

export default function CandidateList() {
  const [selectedJD, setSelectedJD] = useState<string>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [candidateType, setCandidateType] = useState<"applied" | "shortlisted">("applied");
  const [evaluationThreshold, setEvaluationThreshold] = useState<number>(70); // Threshold for showing shortlisted candidates
  const { data: jds } = useQuery({
    queryKey: ['jds'],
    queryFn: jdApi.getAll,
  });

  const { data: candidates, isLoading, error, refetch } = useQuery<CandidateData[]>({
    queryKey: ['candidates', selectedJD, candidateType],
    queryFn: async () => {
      const jdIdParam = selectedJD === "all" ? "all" : selectedJD;
      if (candidateType === "applied") {
        return resumeApi.getAllCandidates(jdIdParam);
      } else {
        return resumeApi.getShortlistedCandidates(jdIdParam);
      }
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: resumeApi.shortlist,
    onSuccess: () => {
      toast.success("Candidates shortlisting started");
      refetch();
    },
    onError: () => {
      toast.error("Failed to shortlist candidates");
    },
  });

  const initAssessmentMutation = useMutation({
    mutationFn: async (candidates: ShortlistedCandidate[]) => {
      const selectedJdData = jds?.find((jd) => jd._id === selectedJD);
      if (!selectedJdData) {
        throw new Error("Job description not found");
      }

      const results = await Promise.allSettled(
        candidates.map((candidate) =>
          assessmentApi.init({
            candidate_id: candidate.candidateId._id,
            job_id: selectedJD,
            role: selectedJdData.aiResponse.jobTitle,
            skills: selectedJdData.aiResponse.skills,
            test_type: "MCQ",
          })
        )
      );

      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      
      toast.success(
        `Assessment initialized for ${successful} candidate${successful !== 1 ? "s" : ""}${
          failed > 0 ? ` (${failed} failed)` : ""
        }`
      );
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to initialize assessments");
      console.error("Assessment init error:", error);
    },
  });

  const handleShortlist = () => {
    if (selectedJD && selectedJD !== "all") {
      shortlistMutation.mutate({ jdId: selectedJD });
    } else {
      toast.error("Please select a job description");
    }
  };

  const handleSendAssessments = () => {
    if (candidateType !== "shortlisted") {
      toast.error("Switch to Shortlisted Candidates tab first");
      return;
    }

    if (processedCandidates.length === 0) {
      toast.error("No candidates to send assessments to");
      return;
    }

    if (selectedJD === "all") {
      toast.error("Please select a specific job description");
      return;
    }

    initAssessmentMutation.mutate(processedCandidates as ShortlistedCandidate[]);
  };

  const handleViewProfile = (candidate: CandidateData | Candidate) => {
    let candidateToView: Candidate | null = null;

    if ('resume' in candidate) {
      // It's an applied candidate
      candidateToView = candidate as Candidate;
    } else {
      // It's a shortlisted candidate with nested candidateId
      const shortlisted = candidate as ShortlistedCandidate;
      if (shortlisted.candidateId && 'resume' in shortlisted.candidateId) {
        candidateToView = shortlisted.candidateId;
      }
    }

    if (candidateToView) {
      setSelectedCandidate(candidateToView);
      setIsProfileOpen(true);
    } else {
      toast.error("Could not load candidate profile");
    }
  };

  // Filter and sort candidates
  const processedCandidates = candidates
    ? candidateType === "shortlisted"
      ? (candidates as ShortlistedCandidate[])
        .filter((c) => c.aiEvaluation?.score && c.aiEvaluation.score >= evaluationThreshold)
        .sort((a, b) => (b.aiEvaluation?.score || 0) - (a.aiEvaluation?.score || 0))
      : candidates
    : []; const getStatusBadge = (status: string) => {
      const variants: Record<string, { className: string; label: string }> = {
        new: { className: "bg-info text-info-foreground", label: "New" },
        screening: { className: "bg-warning text-warning-foreground", label: "Screening" },
        shortlisted: { className: "bg-success text-success-foreground", label: "Shortlisted" },
        assessment: { className: "bg-blue-600 text-white", label: "Assessment" },
        interview: { className: "bg-purple-600 text-white", label: "Interview" },
        offer: { className: "bg-green-600 text-white", label: "Offer" },
        rejected: { className: "bg-destructive text-destructive-foreground", label: "Rejected" },
        hired: { className: "bg-emerald-600 text-white", label: "Hired" },
      };
      const config = variants[status] || variants.new;
      return <Badge className={config.className}>{config.label}</Badge>;
    };

  if (isLoading) return <Loader size="lg" text="Loading candidates..." />;
  if (error) return <ErrorState message="Failed to load candidates" retry={refetch} />;
console.log(candidates)
  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Screen and manage candidate applications"
        actions={
          <div className="flex gap-2">
            <Select value={selectedJD} onValueChange={setSelectedJD}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filter by JD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Candidates</SelectItem>
                {jds?.map((jd) => (!jd.aiResponse ? null : (
                  <SelectItem key={jd._id} value={jd._id}>
                    {jd.aiResponse.jobTitle}
                  </SelectItem>
                )))}
              </SelectContent>
            </Select>
             <Select value={evaluationThreshold.toString()} onValueChange={(value) => {
              setEvaluationThreshold(Number(value));
            }}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filter by Evaluation Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Evaluation Score Threshold</SelectItem>
                <SelectItem value="40">40%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="60">60%</SelectItem>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleShortlist} disabled={selectedJD === "all" || shortlistMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {shortlistMutation.isPending ? "Processing..." : "Run AI Shortlist"}
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 mb-6">
        <Button
          variant={candidateType === "applied" ? "default" : "outline"}
          onClick={() => setCandidateType("applied")}
        >
          Applied Candidates
        </Button>
        <Button
          variant={candidateType === "shortlisted" ? "default" : "outline"}
          onClick={() => setCandidateType("shortlisted")}
        >
          Shortlisted Candidates
        </Button>
        {candidateType === "shortlisted" && processedCandidates.length > 0 && (
          <Button
            onClick={handleSendAssessments}
            disabled={initAssessmentMutation.isPending || selectedJD === "all"}
            className="ml-auto bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {initAssessmentMutation.isPending
              ? "Sending Assessments..."
              : `Send Assessments (${processedCandidates.length})`}
          </Button>
        )}
      </div>

      {!processedCandidates || processedCandidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            candidateType === "applied"
              ? "No candidates yet"
              : "No high-scoring candidates"
          }
          description={
            candidateType === "applied"
              ? "Candidates who apply to your job postings will appear here"
              : "Candidates with AI evaluation score ≥ 70% will appear here"
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>{candidateType === "applied" ? "Skills" : "Match Score"}</TableHead>
                  <TableHead>{candidateType === "applied" ? "Experience" : "Matched Skills"}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedCandidates?.map((candidate) => {
                  const isApplied = 'resume' in candidate;
                  const shortlistedCandidate = isApplied ? null : (candidate as ShortlistedCandidate);
                  const candidateData = isApplied ? (candidate as Candidate) : (candidate as ShortlistedCandidate).candidateId;

                  return (
                    <TableRow key={candidate._id}>
                      <TableCell className="font-medium">{candidateData.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a href={`mailto:${candidateData.email}`} className="text-blue-600 hover:underline">
                              {candidateData.email}
                            </a>
                          </div>
                          {candidateData.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a href={`tel:${candidateData.phone}`} className="text-muted-foreground">
                                {candidateData.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isApplied ? (
                          <>
                            {candidateData.skills && candidateData.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {candidateData.skills.slice(0, 3).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {candidateData.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs bg-muted">
                                    +{candidateData.skills.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </>
                        ) : (
                          <>
                            {shortlistedCandidate?.aiEvaluation?.score !== undefined ? (
                              <div className="flex items-center gap-2">
                                <Progress value={shortlistedCandidate.aiEvaluation.score} className="w-16 h-2" />
                                <span className="text-sm font-medium">{shortlistedCandidate.aiEvaluation.score}%</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not scored</span>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {isApplied ? (
                          <>
                            {candidateData.experience && candidateData.experience.length > 0 ? (
                              <div className="text-sm">
                                <div className="font-medium">{candidateData.experience[0].role}</div>
                                <div className="text-xs text-muted-foreground">{candidateData.experience[0].company}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Fresher</span>
                            )}
                          </>
                        ) : (
                          <>
                            {shortlistedCandidate?.aiEvaluation?.recommendation && (
                              <Badge variant="outline" className="text-xs">
                                {shortlistedCandidate.aiEvaluation.recommendation}
                              </Badge>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(candidateData.status || "new")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(candidateData.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProfile(candidateData)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Candidate Profile Dialog */}
      {selectedCandidate && (
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCandidate.name}</DialogTitle>
              <DialogDescription>
                Applied on {new Date(selectedCandidate.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email</div>
                  <a href={`mailto:${selectedCandidate.email}`} className="text-blue-600 hover:underline">
                    {selectedCandidate.email}
                  </a>
                </div>
                {selectedCandidate.phone && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Phone</div>
                    <a href={`tel:${selectedCandidate.phone}`} className="text-blue-600 hover:underline">
                      {selectedCandidate.phone}
                    </a>
                  </div>
                )}
                {selectedCandidate.resume && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Resume</div>
                    <a
                      href={selectedCandidate.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View Resume
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Skills */}
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="h-4 w-4" />
                    <h3 className="font-semibold">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {selectedCandidate.experience && selectedCandidate.experience.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4" />
                    <h3 className="font-semibold">Experience</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedCandidate.experience.map((exp, idx) => (
                      <div key={idx} className="border-l-2 border-primary pl-4">
                        <div className="font-medium">{exp.role}</div>
                        <div className="text-sm text-muted-foreground">{exp.company}</div>
                        {exp.duration && <div className="text-xs text-muted-foreground mt-1">{exp.duration}</div>}
                        {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedCandidate.education && selectedCandidate.education.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Book className="h-4 w-4" />
                    <h3 className="font-semibold">Education</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedCandidate.education.map((edu, idx) => (
                      <div key={idx} className="border-l-2 border-blue-500 pl-4">
                        <div className="font-medium">{edu.degree} in {edu.fieldOfStudy}</div>
                        <div className="text-sm text-muted-foreground">{edu.institution}</div>
                        {edu.endDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Graduation: {new Date(edu.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {selectedCandidate.projects && selectedCandidate.projects.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Projects</h3>
                  <div className="space-y-3">
                    {selectedCandidate.projects.map((project, idx) => (
                      <div key={idx} className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{project.name}</div>
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.technologies.map((tech, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {selectedCandidate.interests && selectedCandidate.interests.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.interests.map((interest, idx) => (
                      <Badge key={idx} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {selectedCandidate.summary && (
                <div>
                  <h3 className="font-semibold mb-2">Professional Summary</h3>
                  <p className="text-sm text-muted-foreground">{selectedCandidate.summary}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
