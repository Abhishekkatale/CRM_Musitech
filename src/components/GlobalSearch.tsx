import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
interface GlobalSearchProps {
  className?: string;
}
const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Detect platform for shortcut hint
  const shortcutLabel = useMemo(() => {
    if (typeof window === "undefined") return "Ctrl K";
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
    return isMac ? "⌘ K" : "Ctrl K";
  }, []);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  const routes = [{
    label: "Dashboard",
    to: "/"
  }, {
    label: "Leads",
    to: "/leads"
  }, {
    label: "Campaigns",
    to: "/campaigns"
  }, {
    label: "Reports",
    to: "/reports"
  }, {
    label: "Attribution",
    to: "/attribution"
  }, {
    label: "Integrations",
    to: "/integrations"
  }];
  const handleSelect = (to: string) => {
    navigate(to);
    setOpen(false);
    setQuery("");
  };
  return <>
      <button type="button" aria-label="Search the application" onClick={() => setOpen(true)} className={cn("group inline-flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring", className)}>
        <Search className="h-4 w-4 text-muted-foreground" />
        
        <kbd className="pointer-events-none inline-flex select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground opacity-100">
          {shortcutLabel}
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Type to search…" autoFocus />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigate">
            {routes.map(r => <CommandItem key={r.to} onSelect={() => handleSelect(r.to)}>
                {r.label}
              </CommandItem>)}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick actions">
            <CommandItem onSelect={() => handleSelect("/leads")}>View Leads</CommandItem>
            <CommandItem onSelect={() => handleSelect("/campaigns")}>View Campaigns</CommandItem>
            <CommandItem onSelect={() => handleSelect("/")}>Open Dashboard</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>;
};
export default GlobalSearch;