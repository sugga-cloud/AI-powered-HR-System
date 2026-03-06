import { useQuery, useMutation } from "@tanstack/react-query";
import { Gift, Plus, Send, Eye } from "lucide-react";
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
import { Loader } from "@/components/shared/Loader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { offerApi } from "@/api/offerApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function OfferList() {
  const navigate = useNavigate();
  
  const { data: offers, isLoading, error, refetch } = useQuery({
    queryKey: ['offers'],
    queryFn: offerApi.list,
  });

  const resendMutation = useMutation({
    mutationFn: offerApi.resend,
    onSuccess: () => {
      toast.success("Offer letter resent successfully");
    },
    onError: () => {
      toast.error("Failed to resend offer");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      draft: { className: "bg-secondary text-secondary-foreground", label: "Draft" },
      sent: { className: "bg-info text-info-foreground", label: "Sent" },
      accepted: { className: "bg-success text-success-foreground", label: "Accepted" },
      rejected: { className: "bg-destructive text-destructive-foreground", label: "Rejected" },
      expired: { className: "bg-muted text-muted-foreground", label: "Expired" },
    };
    const config = variants[status] || variants.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) return <Loader size="lg" text="Loading offers..." />;
  if (error) return <ErrorState message="Failed to load offers" retry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Offer Management"
        description="Create and track job offers"
        actions={
          <Button onClick={() => navigate('/dashboard/offer/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        }
      />

      {!offers || offers.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No offers created yet"
          description="Create offer letters for selected candidates"
          action={{
            label: "Create Offer",
            onClick: () => navigate('/dashboard/offer/create'),
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{offer.candidateName}</p>
                        <p className="text-sm text-muted-foreground">{offer.candidateEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{offer.jdTitle}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {offer.salary.currency} {offer.salary.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(offer.joiningDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(offer.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {offer.status === 'sent' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resendMutation.mutate(offer.id)}
                            disabled={resendMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Resend
                          </Button>
                        )}
                      </div>
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
