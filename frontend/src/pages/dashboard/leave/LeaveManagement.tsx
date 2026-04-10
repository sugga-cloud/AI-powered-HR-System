import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, AlarmClock, Users, ClipboardList, Bot } from "lucide-react";

const API = import.meta.env.VITE_MAIN_API_URL || "https://backend-1s6m.onrender.com/api";
const HR_ID = "HR001"; // TODO: replace with auth store value

const statusColor: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Approved: "bg-green-500/20 text-green-400 border-green-500/30",
  Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [acting, setActing] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/leave/all`);
      const data = await res.json();
      const all = data.data || [];
      setLeaves(all);
      setStats({
        total: all.length,
        pending: all.filter((l: any) => l.status === "Pending").length,
        approved: all.filter((l: any) => l.status === "Approved").length,
        rejected: all.filter((l: any) => l.status === "Rejected").length,
      });
    } catch {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleDecision = async (decision: "Approved" | "Rejected") => {
    if (!selectedLeave) return;
    setActing(true);
    try {
      await fetch(`${API}/leave/${selectedLeave._id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, hrEmployeeId: HR_ID, comment }),
      });
      setSelectedLeave(null);
      setComment("");
      fetchLeaves();
    } catch {
      alert("Failed to process decision.");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Management" description="Review and respond to employee leave requests — Aurion mediates the flow" />

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: <ClipboardList className="w-4 h-4" />, color: "text-foreground" },
          { label: "Pending", value: stats.pending, icon: <AlarmClock className="w-4 h-4" />, color: "text-yellow-400" },
          { label: "Approved", value: stats.approved, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-400" },
          { label: "Rejected", value: stats.rejected, icon: <XCircle className="w-4 h-4" />, color: "text-red-400" },
        ].map(s => (
          <Card key={s.label} className="border border-border/50 bg-card/80">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className={`${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Leave Table */}
        <div className="col-span-2">
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" /> All Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
              ) : leaves.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No leave requests.</p>
              ) : (
                <div className="space-y-2">
                  {leaves.map((leave: any) => (
                    <div
                      key={leave._id}
                      onClick={() => { setSelectedLeave(leave); setComment(""); }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedLeave?._id === leave._id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/40 bg-muted/20 hover:bg-muted/40"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{leave.leaveType} Leave</span>
                            <Badge className={`text-xs border ${statusColor[leave.status] || ""}`}>{leave.status}</Badge>
                            {leave.mediatedBy === "agent" && (
                              <Badge variant="outline" className="text-xs text-primary border-primary/30 flex items-center gap-1">
                                <Bot className="w-2.5 h-2.5" /> Aurion
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                            <span className="ml-1">· {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}</span>
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(leave.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {leave.reason && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">"{leave.reason}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel */}
        <div>
          {selectedLeave ? (
            <Card className="border border-primary/30 bg-card/80 sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Review Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{selectedLeave.leaveType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{selectedLeave.totalDays} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={`text-xs border ${statusColor[selectedLeave.status]}`}>{selectedLeave.status}</Badge>
                  </div>
                </div>

                {/* Employee reason */}
                {selectedLeave.reason && (
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Employee Reason</p>
                    <p className="text-sm">{selectedLeave.reason}</p>
                  </div>
                )}

                {/* Aurion Agent Note */}
                {selectedLeave.agentNote && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Bot className="w-3 h-3 text-primary" />
                      <p className="text-xs text-primary font-medium">Aurion's Professional Note</p>
                    </div>
                    <p className="text-xs leading-relaxed">{selectedLeave.agentNote}</p>
                  </div>
                )}

                {selectedLeave.status === "Pending" && (
                  <>
                    <Textarea
                      placeholder="Optional HR comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDecision("Approved")}
                        disabled={acting}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                      </Button>
                      <Button
                        onClick={() => handleDecision("Rejected")}
                        disabled={acting}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </>
                )}
                {selectedLeave.hrComment && (
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground mb-1">HR Comment</p>
                    <p className="text-sm">{selectedLeave.hrComment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed border-border/50 bg-muted/10">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">Select a leave request to review</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
