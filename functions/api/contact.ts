import { sendContactEmail, type ContactMailEnvironment } from "../../server/contact-mail";

type CloudflarePagesContext = {
  request: Request;
  env: ContactMailEnvironment;
};

export async function onRequestPost({ request, env }: CloudflarePagesContext): Promise<Response> {
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return Response.json({ ok: false, message: "No hemos podido leer el formulario. Inténtalo de nuevo." }, { status: 400 });
  }

  if (new TextEncoder().encode(rawBody).byteLength > 16_384) {
    return Response.json({ ok: false, message: "El mensaje es demasiado grande. Resume tu consulta e inténtalo de nuevo." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ ok: false, message: "No hemos podido leer el formulario. Inténtalo de nuevo." }, { status: 400 });
  }

  const result = await sendContactEmail(payload, env);
  return Response.json(result.body, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
