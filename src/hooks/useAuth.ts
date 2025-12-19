import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const recordLogin = async (userId: string, userEmail: string | undefined) => {
    try {
      await supabase.functions.invoke("record-login", {
        body: {
          userId,
          userEmail: userEmail || null,
          userAgent: navigator.userAgent,
          ipAddress: null, // Would need server-side detection
          success: true,
        },
      });
    } catch (error) {
      console.error("Error recording login:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Record login on sign in (only once per session to avoid duplicates)
        if (event === "SIGNED_IN" && session?.user) {
          const loginKey = `login_recorded_${session.user.id}`;
          if (!sessionStorage.getItem(loginKey)) {
            sessionStorage.setItem(loginKey, "true");
            setTimeout(() => {
              recordLogin(session.user.id, session.user.email);
            }, 0);
          }
        }
        
        // Clear login flag on sign out
        if (event === "SIGNED_OUT") {
          // Clear all login_recorded flags
          Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith("login_recorded_")) {
              sessionStorage.removeItem(key);
            }
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
