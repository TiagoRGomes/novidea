import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProfile, supabase, type CmsProfile, type CmsSession } from "@/lib/supabaseClient";

export type SessionContextValue = {
  session: CmsSession | null;
  profile: CmsProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CmsSession | null>(null);
  const [profile, setProfile] = useState<CmsProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!session?.user.id) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await getProfile(session.user.id));
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const syncSession = async (nextSession: CmsSession | null) => {
      if (!mounted) return;
      setLoading(true);
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const nextProfile = await getProfile(nextSession.user.id);
        if (mounted) setProfile(nextProfile);
      } catch {
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });
    supabase.auth.getSession().then(({ data }) => syncSession(data.session)).catch(() => {
      if (!mounted) return;
      setSession(null);
      setProfile(null);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(() => ({
    session,
    profile,
    loading,
    refreshProfile,
    signOut: async () => {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    },
  }), [loading, profile, session]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSessionContext must be used inside SessionProvider");
  return context;
}
