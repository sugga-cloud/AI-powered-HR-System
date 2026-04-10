import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, TrendingUp, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_MAIN_API_URL || "http://localhost:5000/api";

const statusColor: Record<string, string> = {
  Active: "bg-green-500/20 text-green-400 border-green-500/30",
  "On Hold": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const priorityColor: Record<string, string> = {
  Low: "text-gray-400",
  Medium: "text-yellow-400",
  High: "text-orange-400",
  Critical: "text-red-400",
};

const healthColor = (score: number) => {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
};

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", priority: "Medium", endDate: "" });
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/projects`);
      const data = await res.json();
      setProjects(data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    setCreating(true);
    try {
      await fetch(`${API}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ name: "", description: "", priority: "Medium", endDate: "" });
      fetchProjects();
    } catch {} finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader title="Project Workspace" description="Manage company projects, milestones, team members and track health" />
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border border-primary/30 bg-card/80">
          <CardHeader><CardTitle className="text-base">Create Project</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input
              placeholder="Project name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {["Low", "Medium", "High", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                type="date" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating} className="flex-1">
                {creating ? "Creating..." : "Create Project"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Projects", value: projects.length, icon: <Briefcase className="w-4 h-4" /> },
          { label: "Active", value: projects.filter(p => p.status === "Active").length, icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
          { label: "Team Members", value: projects.reduce((s, p) => s + (p.members?.length || 0), 0), icon: <Users className="w-4 h-4 text-purple-400" /> },
        ].map(s => (
          <Card key={s.label} className="border border-border/50">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Grid */}
      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-10">Loading projects...</p>
      ) : projects.length === 0 ? (
        <Card className="border border-dashed border-border/50">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No projects yet. Create your first project above or ask Aurion.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <Card
              key={project._id}
              className="border border-border/50 bg-card/80 hover:border-primary/40 hover:bg-card transition-all cursor-pointer group"
              onClick={() => navigate(`/dashboard/projects/${project._id}`)}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 ml-2 group-hover:text-primary transition-colors" />
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge className={`text-xs border ${statusColor[project.status] || ""}`}>{project.status}</Badge>
                  <span className={`text-xs font-medium ${priorityColor[project.priority] || ""}`}>{project.priority}</span>
                </div>

                {/* Completion Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{project.completionPercent ?? 0}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.completionPercent ?? 0}%` }} />
                  </div>
                </div>

                {/* Health Score */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${healthColor(project.healthScore ?? 50)}`} />
                  <span className="text-xs text-muted-foreground">Health: {project.healthScore ?? 50}/100</span>
                  {project.endDate && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Due {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
