import { Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import AuthSection from "./AuthSection";
// Left navigation moved to the sidebar. Top nav items removed.

const NavBar = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger aria-label="Toggle navigation" />
          <Link to="/" className="flex items-center gap-2" aria-label="MusiTech Home">
            <span className="text-lg font-extrabold tracking-tight text-gradient-primary">MusiTech</span>
          </Link>
        </div>
        <div className="flex-1 px-4 max-w-xl">
          <GlobalSearch />
        </div>
        
       

        
         <div>
          <AuthSection />
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
