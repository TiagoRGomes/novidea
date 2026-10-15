import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { isSupabaseConfigured } from "@/lib/config";
import { handleImageFallback, premiumImages } from "@/lib/visuals";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Falta configurar Supabase. Copia .env.example para .env.local, preenche as variáveis e reinicia o servidor local.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await supabase.auth.signInWithPassword(email.trim(), password);
      navigate("/admin", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo iniciar sesión. Revisa tus credenciales.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--brand-ink)] px-5 py-8 text-[var(--brand-on-ink)] sm:px-8 sm:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-[var(--brand-paper)] shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-[var(--brand-ink)] p-10 text-[var(--brand-on-ink)] lg:flex lg:flex-col lg:justify-between">
          <img src={premiumImages.printing} alt="" aria-hidden="true" onError={handleImageFallback} className="absolute inset-0 h-full w-full object-cover opacity-35" /><div className="absolute inset-0 novidea-photo-shade-login" /><div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border-[46px] border-[var(--brand-primary)]/25" />
          <div className="relative flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)] font-black text-[var(--brand-primary-foreground)]">N</span><span className="text-xl font-black tracking-[-0.08em]">NOVIDEA</span></div>
          <div className="relative"><Sparkles size={28} className="mb-8 text-[var(--brand-primary-highlight)]" aria-hidden="true" /><h1 className="font-display text-6xl leading-[0.95] tracking-[-0.06em]">Tu estudio.<br />Tu universo<br /><span className="text-[var(--brand-primary-highlight)]">editable.</span></h1><p className="mt-8 max-w-sm text-sm leading-6 text-[var(--brand-on-ink)]">Gestiona el contenido, los servicios, los productos y los proyectos de NOVIDEA desde un único lugar.</p></div>
          <p className="relative text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-on-ink)]">Panel privado · NOVIDEA Studio</p>
        </div>

        <div className="flex items-center justify-center p-7 sm:p-12 lg:p-16">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-12 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-muted)] transition-colors hover:text-[var(--brand-accent-text)]"><ArrowLeft size={15} /> Volver al sitio</Link>
            <div className="mb-9"><p className="mb-4 text-[0.65rem] font-black uppercase tracking-[0.2em] text-[var(--brand-accent-text)]">Área privada</p><h2 className="font-display text-5xl tracking-[-0.06em]">Acceso al CMS.</h2><p className="mt-4 text-sm leading-6 text-[var(--brand-muted)]">Inicia sesión con la cuenta que te haya asignado la administración del sitio.</p></div>
            {!isSupabaseConfigured && <div className="novidea-login-notice novidea-login-notice--warning mb-5 rounded-2xl px-4 py-3 text-sm leading-6">Supabase aún no está configurado en este entorno local. Consulta el archivo <code>.env.example</code> y el README.</div>}
            <form onSubmit={submit} className="space-y-5">
              <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)]">Email</span><input required autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-13 w-full rounded-2xl border border-[var(--brand-line)]/15 bg-[var(--brand-surface)] px-4 text-sm outline-none transition focus:border-[var(--brand-accent-bg)] focus:ring-4 focus:ring-[var(--brand-accent-bg)]/10" placeholder="tu@email.com" /></label>
              <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)]">Contraseña</span><input required autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-13 w-full rounded-2xl border border-[var(--brand-line)]/15 bg-[var(--brand-surface)] px-4 text-sm outline-none transition focus:border-[var(--brand-accent-bg)] focus:ring-4 focus:ring-[var(--brand-accent-bg)]/10" placeholder="Tu contraseña" /></label>
              {error && <p className="novidea-login-notice novidea-login-notice--error rounded-2xl px-4 py-3 text-sm leading-5" role="alert">{error}</p>}
              <button disabled={submitting || !isSupabaseConfigured} className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--brand-primary)] text-sm font-black text-[var(--brand-primary-foreground)] transition hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Conectando…" : "Entrar en el CMS"}<ArrowRight size={17} aria-hidden="true" /></button>
            </form>
            <div className="mt-8 flex items-start gap-2 text-sm leading-6 text-[var(--brand-muted)]"><LockKeyhole size={16} className="mt-1 shrink-0 text-[var(--brand-accent-text)]" aria-hidden="true" /><span>El registro público está desactivado para evitar altas no autorizadas. Para crear o habilitar una cuenta, usa el panel de Supabase y asigna el rol adecuado.</span></div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
