// filepath: /home/abhishek/Desktop/Musitech_CRM/musitech-launchpad/src/components/AuthSection.tsx

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { LogOut } from "lucide-react";

export const AuthSection = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // After login → profile + name + logout in a responsive row
  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Profile Circle */}
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Profile"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm">
            {user.email?.charAt(0).toUpperCase()}
          </div>
        )}

        {/* User Name */}
        <span className="hidden sm:inline text-sm font-medium text-black truncate max-w-[100px]">
          {user.user_metadata?.full_name || "User"}
        </span>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-3 py-1 sm:px-4 sm:py-2 rounded-md bg-green-600 text-white text-xs sm:text-sm font-medium hover:bg-green-700 transition"
        >
          Logout
        </button>
      </div>
    );
  }

  // Before login → simple sign-in button
  return (
    <button
      onClick={handleGoogleLogin}
      className="px-3 py-1 sm:px-4 sm:py-2 rounded-md bg-green-600 text-white text-xs sm:text-sm font-medium hover:bg-green-700 transition"
    >
      Sign in
    </button>
  );
};

export default AuthSection;
