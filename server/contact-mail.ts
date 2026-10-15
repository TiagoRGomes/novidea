export interface ContactMailEnvironment {
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_TO_EMAIL?: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  website?: string;
}

export interface ContactApiResult {
  status: number;
  body: { ok: boolean; message: string };
}

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 4000;
const DEFAULT_RECIPIENT = "hola@novidea.es";
const DEFAULT_FROM = "NOVIDEA <hola@novidea.es>";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanSingleLine(value: unknown, maxLength: number): string {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, maxLength);
}

export async function sendContactEmail(payloadValue: unknown, env: ContactMailEnvironment): Promise<ContactApiResult> {
  if (!isRecord(payloadValue)) {
    return { status: 400, body: { ok: false, message: "No hemos podido leer el formulario. Comprueba los campos e inténtalo de nuevo." } };
  }

  // Honeypot: return a generic success to automated spam submissions without sending email.
  if (String(payloadValue.website ?? "").trim()) {
    return { status: 200, body: { ok: true, message: "Gracias. Hemos recibido tu mensaje." } };
  }

  const name = cleanSingleLine(payloadValue.name, MAX_NAME_LENGTH);
  const email = cleanSingleLine(payloadValue.email, MAX_EMAIL_LENGTH);
  const message = String(payloadValue.message ?? "").trim();

  if (name.length < 2) {
    return { status: 400, body: { ok: false, message: "Introduce tu nombre para que sepamos cómo responderte." } };
  }
  if (email.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 400, body: { ok: false, message: "Introduce una dirección de email válida." } };
  }
  if (message.length < 10) {
    return { status: 400, body: { ok: false, message: "Cuéntanos un poco más sobre tu idea (mínimo 10 caracteres)." } };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { status: 400, body: { ok: false, message: "El mensaje es demasiado largo. Resume tu consulta e inténtalo de nuevo." } };
  }
  if (!env.RESEND_API_KEY?.trim()) {
    return { status: 503, body: { ok: false, message: "El envío de email todavía no está configurado. Escríbenos a hola@novidea.es o por WhatsApp." } };
  }

  const to = (env.CONTACT_TO_EMAIL?.trim() || DEFAULT_RECIPIENT).split(",").map((item) => item.trim()).filter(Boolean);
  const from = env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const emailText = [
    "Nueva consulta desde la web de NOVIDEA",
    "",
    `Nombre: ${name}`,
    `Email: ${email}`,
    "",
    "Proyecto / consulta:",
    message,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `Nueva consulta web de ${name}`,
        text: emailText,
      }),
    });

    if (!response.ok) {
      // Keep provider details in server logs only; never expose keys or provider responses to the browser.
      console.error("NOVIDEA contact email provider returned status", response.status);
      return { status: 502, body: { ok: false, message: "No hemos podido enviar el mensaje ahora mismo. Inténtalo de nuevo o escríbenos a hola@novidea.es." } };
    }

    return { status: 200, body: { ok: true, message: "¡Mensaje enviado! Gracias por escribir a NOVIDEA. Te responderemos por email." } };
  } catch (error) {
    console.error("NOVIDEA contact email request failed", error instanceof Error ? error.message : "Unknown error");
    return { status: 502, body: { ok: false, message: "No hemos podido conectar con el servicio de email. Inténtalo de nuevo en unos minutos." } };
  }
}
