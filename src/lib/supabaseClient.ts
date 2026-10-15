import type { CmsContent } from "@/lib/cms";
import { isSupabaseConfigured, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/config";

const SESSION_KEY = "novidea_supabase_session";
type AuthEvent = "SIGNED_IN" | "SIGNED_OUT";
type AuthChangeCallback = (event: AuthEvent, session: CmsSession | null) => void;
const authListeners = new Set<AuthChangeCallback>();

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  user?: SupabaseUser;
};

export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string };
};

export type CmsProfile = {
  id: string;
  full_name: string | null;
  role: "admin" | "editor" | "viewer";
};

export type CmsBlock = {
  id: string;
  section: string;
  block_type: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
};

export type CmsPage = { id: string; slug: string; title: string; path: string; template: string; content: Record<string, unknown>; status: "draft" | "published"; sort_order: number };
export type CmsCategory = { id: string; name: string; slug: string; description: string | null; image_url: string | null; sort_order: number; is_active: boolean };
export type CmsProduct = { id: string; category_id: string | null; name: string; slug: string; description: string | null; price: number | null; image_url: string | null; gallery: string[]; specs: Record<string, unknown>; is_featured: boolean; is_published: boolean };
export type CmsMedia = { id: string; file_name: string; url: string; alt_text: string | null; mime_type: string | null; size_bytes: number | null; created_at: string };
export type CmsCarousel = { id: string; name: string; slug: string; autoplay_ms: number; is_active: boolean };
export type CmsCarouselItem = { id: string; carousel_id: string; title: string | null; subtitle: string | null; image_url: string | null; href: string | null; sort_order: number; is_active: boolean };
export type CmsText = { id: string; text_key: string; locale: string; value: string; context: string | null };
export type CmsSetting = { setting_key: string; value: Record<string, unknown> };

export type CmsSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: SupabaseUser;
};

function configurationError(): Error {
  return new Error("Supabase não está configurado. Copia .env.example para .env.local e preenche VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.");
}

const authHeaders = (accessToken?: string) => ({
  apikey: SUPABASE_PUBLISHABLE_KEY,
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

function readSession(): CmsSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CmsSession;
    if (!parsed?.access_token || !parsed?.refresh_token || !parsed?.user?.id) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSession(session: CmsSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

function notifyAuthStateChange(event: AuthEvent, session: CmsSession | null) {
  authListeners.forEach((callback) => callback(event, session));
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as T;
  }
}

function responseMessage(data: { error_description?: string; msg?: string; message?: string; error?: string }, fallback: string) {
  return data.error_description || data.msg || data.message || data.error || fallback;
}

function sessionFromAuth(data: AuthResponse, previousUser?: SupabaseUser): CmsSession {
  const expiresAt = data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    user: data.user ?? previousUser ?? { id: "" },
  };
}

async function authRequest(path: string, body: Record<string, string>) {
  if (!isSupabaseConfigured) throw configurationError();
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseResponse<AuthResponse & { error_description?: string; msg?: string; message?: string; error?: string }>(response);
  if (!response.ok) throw new Error(responseMessage(data, "Não foi possível completar a autenticação."));
  return data;
}

/** Refreshes and persists a session. Kept shared so CMS requests can recover after expiry. */
export async function refreshAccessToken(force = false): Promise<string | undefined> {
  if (!isSupabaseConfigured) return undefined;
  const session = readSession();
  if (!session) return undefined;
  const now = Math.floor(Date.now() / 1000);
  if (!force && session.expires_at && session.expires_at > now + 60) return session.access_token;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const data = await parseResponse<AuthResponse & { error_description?: string; msg?: string; message?: string; error?: string }>(response);
  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403) saveSession(null);
    throw new Error(responseMessage(data, "A sessão expirou. Inicia sessão novamente."));
  }

  const refreshed = sessionFromAuth(data, session.user);
  saveSession(refreshed);
  return refreshed.access_token;
}

export async function requestSupabaseRest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!isSupabaseConfigured) throw configurationError();
  const requestWithToken = async (token?: string) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  let token = await refreshAccessToken(false);
  let response = await requestWithToken(token);
  if (response.status === 401 && token) {
    token = await refreshAccessToken(true);
    response = await requestWithToken(token);
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `A operação falhou (${response.status}).`);
  }
  const body = await response.text();
  return body.trim() ? (JSON.parse(body) as T) : (null as T);
}

export async function requestSupabaseStorage(path: string, options: RequestInit = {}): Promise<Response> {
  if (!isSupabaseConfigured) throw configurationError();
  const requestWithToken = async (token?: string) => fetch(`${SUPABASE_URL}/storage/v1/${path}`, {
    ...options,
    headers: { ...authHeaders(token), ...(options.headers ?? {}) },
  });
  let token = await refreshAccessToken(false);
  let response = await requestWithToken(token);
  if (response.status === 401 && token) {
    token = await refreshAccessToken(true);
    response = await requestWithToken(token);
  }
  return response;
}

export const supabase = {
  auth: {
    onAuthStateChange(callback: AuthChangeCallback) {
      authListeners.add(callback);
      return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
    },
    async signInWithPassword(email: string, password: string) {
      const data = await authRequest("token?grant_type=password", { email, password });
      const session = sessionFromAuth(data);
      saveSession(session);
      notifyAuthStateChange("SIGNED_IN", session);
      return { data: { session, user: session.user }, error: null };
    },
    async signUp(email: string, password: string, fullName: string) {
      if (!isSupabaseConfigured) throw configurationError();
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, data: { full_name: fullName } }),
      });
      const data = await parseResponse<AuthResponse & { error_description?: string; msg?: string; message?: string; error?: string }>(response);
      if (!response.ok) throw new Error(responseMessage(data, "Não foi possível criar a conta."));
      if (data.access_token && data.refresh_token && data.user) {
        const session = sessionFromAuth(data);
        saveSession(session);
        notifyAuthStateChange("SIGNED_IN", session);
        return { data: { session, user: session.user }, error: null };
      }
      return { data: { session: null, user: data.user ?? null }, error: null };
    },
    async getSession() {
      if (!isSupabaseConfigured) return { data: { session: null } };
      let session = readSession();
      if (!session) return { data: { session: null } };

      // Expiry metadata was not saved in older versions, so validate those tokens too.
      if (session.expires_at && session.expires_at <= Math.floor(Date.now() / 1000) + 60) {
        try {
          await refreshAccessToken(true);
          session = readSession();
          if (!session) return { data: { session: null } };
        } catch {
          return { data: { session: null } };
        }
      }

      let response: Response;
      try {
        response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: authHeaders(session.access_token) });
      } catch {
        // A temporary network issue should not erase a valid saved session.
        return { data: { session } };
      }

      if (response.status === 401 || response.status === 403) {
        try {
          await refreshAccessToken(true);
          session = readSession();
          if (!session) return { data: { session: null } };
          response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: authHeaders(session.access_token) });
        } catch {
          saveSession(null);
          return { data: { session: null } };
        }
      }
      if (!response.ok) return { data: { session } };
      const user = await parseResponse<SupabaseUser>(response);
      const updated = { ...session, user };
      saveSession(updated);
      return { data: { session: updated } };
    },
    async signOut() {
      const session = readSession();
      if (session && isSupabaseConfigured) {
        try {
          await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: authHeaders(session.access_token) });
        } catch {
          // Clear the local session even when the network is unavailable.
        }
      }
      saveSession(null);
      notifyAuthStateChange("SIGNED_OUT", null);
    },
  },
};

export async function getProfile(userId: string) {
  const rows = await requestSupabaseRest<CmsProfile[]>(`profiles?id=eq.${encodeURIComponent(userId)}&select=id,full_name,role`);
  return rows[0] ?? null;
}

export async function getSiteContent() {
  if (!isSupabaseConfigured) return null;
  const rows = await requestSupabaseRest<Array<{ content: Partial<CmsContent> }>>("cms_site?id=eq.main&select=content");
  return rows[0]?.content ?? null;
}

export async function saveSiteContent(content: CmsContent, userId: string) {
  await requestSupabaseRest("cms_site?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ id: "main", content, updated_by: userId, updated_at: new Date().toISOString() }]),
  });
}

export async function getCmsBlocks() {
  if (!isSupabaseConfigured) return [];
  return requestSupabaseRest<CmsBlock[]>("cms_blocks?select=*&order=sort_order.asc");
}

export async function createCmsBlock(block: Omit<CmsBlock, "id">, userId: string) {
  const rows = await requestSupabaseRest<CmsBlock[]>("cms_blocks", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...block, created_by: userId }),
  });
  return rows[0];
}

export async function updateCmsBlock(id: string, block: Partial<CmsBlock>) {
  await requestSupabaseRest(`cms_blocks?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...block, updated_at: new Date().toISOString() }),
  });
}

export async function deleteCmsBlock(id: string) {
  await requestSupabaseRest(`cms_blocks?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}
