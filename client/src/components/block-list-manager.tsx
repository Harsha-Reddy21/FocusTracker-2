import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BlockedSite, insertBlockedSiteSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Globe, Trash2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";

export function BlockListManager() {
  const { toast } = useToast();
  const [domain, setDomain] = useState("");
  const [warnBeforeAccess, setWarnBeforeAccess] = useState(true);

  // Get blocked sites
  const { data: blockedSites, isLoading } = useQuery<BlockedSite[]>({
    queryKey: ["/api/blocked-sites"],
  });

  // Add a blocked site
  const addBlockedSiteMutation = useMutation({
    mutationFn: async (domain: string) => {
      const data = { domain };
      const validatedData = insertBlockedSiteSchema.omit({ userId: true }).parse(data);
      const res = await apiRequest("POST", "/api/blocked-sites", validatedData);
      return await res.json();
    },
    onSuccess: () => {
      setDomain("");
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-sites"] });
      toast({
        title: "Site blocked",
        description: `${domain} has been added to your blocklist.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add site: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Remove a blocked site
  const removeBlockedSiteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/blocked-sites/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-sites"] });
      toast({
        title: "Site removed",
        description: "The site has been removed from your blocklist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove site: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domain.trim()) return;
    
    try {
      // Simple validation to ensure it's a domain
      const domainSchema = z.string().min(1).refine(
        (val) => /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(val),
        { message: "Please enter a valid domain (e.g., facebook.com)" }
      );
      
      const validatedDomain = domainSchema.parse(domain);
      addBlockedSiteMutation.mutate(validatedDomain);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid domain",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveSite = (id: number) => {
    removeBlockedSiteMutation.mutate(id);
  };

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Manage Blocked Sites</h3>
        <div className="inline-flex items-center">
          <span className="mr-2 text-sm font-medium text-muted-foreground">Status:</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
            <span className="h-2 w-2 mr-1 rounded-full bg-emerald-500"></span>
            Active during sessions
          </span>
        </div>
      </div>

      <form onSubmit={handleAddSite} className="mb-6">
        <div className="flex">
          <Input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter website URL to block (e.g., facebook.com)"
            className="rounded-r-none"
          />
          <Button 
            type="submit" 
            className="rounded-l-none"
            disabled={addBlockedSiteMutation.isPending}
          >
            {addBlockedSiteMutation.isPending ? (
              <span className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Add domains you want to block during work sessions.</p>
      </form>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Blocked Sites</span>
          {!isLoading && (
            <span className="text-xs text-muted-foreground">
              {blockedSites?.length || 0} {blockedSites?.length === 1 ? 'site' : 'sites'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center">
                  <Skeleton className="h-5 w-5 mr-3 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {blockedSites && blockedSites.length > 0 ? (
              blockedSites.map((site) => (
                <li key={site.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg group">
                  <div className="flex items-center">
                    <Globe className="text-muted-foreground mr-3 h-5 w-5" />
                    <span>{site.domain}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSite(site.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </li>
              ))
            ) : (
              <li className="p-3 bg-muted/30 rounded-lg text-center text-muted-foreground">
                No sites in your blocklist yet. Add a domain above to get started.
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="flex items-start mb-3">
          <AlertCircle className="text-amber-500 mr-2 h-5 w-5" />
          <div>
            <h4 className="text-sm font-medium">How website blocking works</h4>
            <p className="text-xs text-muted-foreground mt-1">
              During active work sessions, FocusFlow will prevent access to these sites. 
              The block is lifted automatically during breaks or when your session ends.
            </p>
          </div>
        </div>
        <div className="border-t dark:border-neutral-600 pt-3 mt-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="warn-before-access" 
              checked={warnBeforeAccess}
              onCheckedChange={(checked) => setWarnBeforeAccess(checked as boolean)}
            />
            <Label 
              htmlFor="warn-before-access"
              className="text-sm text-foreground"
            >
              Warn before accessing blocked sites
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
