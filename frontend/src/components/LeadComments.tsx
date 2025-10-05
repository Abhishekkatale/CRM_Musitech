import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";

export type LeadComment = {
  id: string;
  lead_ref: string;
  content: string;
  created_at: string;
};

interface LeadCommentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
}

const LeadComments = ({ open, onOpenChange, leadId, leadName }: LeadCommentsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const title = useMemo(() => `Comments • ${leadName || "Lead"}`, [leadName]);

  const loadComments = async () => {
    if (!leadId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("lead_comments")
      .select("id, lead_ref, content, created_at")
      .eq("lead_ref", leadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load comments", error);
      toast({ title: "Could not load comments", variant: "destructive" });
    } else {
      setComments(data as LeadComment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!open || !leadId) return;
    loadComments();

    const channel = supabase
      .channel(`lead-comments-${leadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lead_comments", filter: `lead_ref=eq.${leadId}` },
        (payload: any) => {
          setComments((prev) => [...prev, payload.new as LeadComment]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "lead_comments", filter: `lead_ref=eq.${leadId}` },
        (payload: any) => {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId]);

  const addComment = async () => {
    if (!text.trim() || !leadId) return;
    setSending(true);
    const content = text.trim();

    const { error } = await (supabase as any).from("lead_comments").insert({ lead_ref: leadId, content });
    if (error) {
      console.error("Failed to add comment", error);
      toast({ title: "Failed to add comment", description: error.message, variant: "destructive" });
    } else {
      setText("");
      toast({ title: "Comment added" });
    }
    setSending(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Discuss context, updates, and next steps for this lead.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex h-[60vh] flex-col">
          <ScrollArea className="flex-1 rounded-md border bg-card p-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading comments…</div>
            ) : comments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No comments yet. Be the first to add one.</div>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-md border p-3 shadow-sm">
                    <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                    <time className="mt-2 block text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>

          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Add a comment"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setText("")}>Clear</Button>
              <Button onClick={addComment} disabled={sending || !text.trim()}>
                {sending ? "Adding…" : "Add Comment"}
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter />
      </SheetContent>
    </Sheet>
  );
};

export default LeadComments;
