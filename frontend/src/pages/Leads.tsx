import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LeadComments from "@/components/LeadComments";

export type Lead = { id: string; name: string; email: string; status: "New" | "Qualified" | "Won" };

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([
    { id: "l1", name: "Alex Rivera", email: "alex@music.com", status: "New" },
    { id: "l2", name: "Jamie Lee", email: "jamie@music.com", status: "Qualified" },
  ]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({ status: "New" });
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const addLead = () => {
    if (!form.name || !form.email) return;
    setLeads((prev) => [...prev, { id: Math.random().toString(36).slice(2), name: form.name!, email: form.email!, status: (form.status as any) || "New" }]);
    setOpen(false);
    setForm({ status: "New" });
  };

  const removeLead = (id: string) => setLeads((prev) => prev.filter((l) => l.id !== id));

  return (
    <section aria-labelledby="leads-title" className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 id="leads-title" className="text-2xl font-semibold">Leads</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">Add Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Lead</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <Input placeholder="Name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <DialogFooter>
              <Button onClick={addLead}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="rounded-lg border bg-card p-2 shadow-elevated">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.name}</TableCell>
                <TableCell>{l.email}</TableCell>
                <TableCell>{l.status}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setActiveLead(l)} className="mr-2">Comments</Button>
                  <Button variant="ghost" size="sm" onClick={() => removeLead(l.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <LeadComments
        open={!!activeLead}
        onOpenChange={(o) => !o && setActiveLead(null)}
        leadId={activeLead?.id ?? ""}
        leadName={activeLead?.name ?? ""}
      />
    </section>
  );
};

export default Leads;
