import { defineConfig, loadEnv, type Plugin } from "vite";
import { sendContactEmail } from "./server/contact-mail";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function contactApiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: "novidea-contact-api-dev",
    configureServer(server) {
      server.middlewares.use("/api/contact", async (req, res) => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Allow", "POST");
          res.end(JSON.stringify({ ok: false, message: "Método no permitido." }));
          return;
        }

        const contentLength = Number(req.headers["content-length"] ?? "0");
        if (contentLength > 16_384) {
          res.statusCode = 413;
          res.end(JSON.stringify({ ok: false, message: "El mensaje es demasiado grande. Resume tu consulta e inténtalo de nuevo." }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          let totalBytes = 0;
          for await (const chunk of req) {
            const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            totalBytes += part.byteLength;
            if (totalBytes > 16_384) {
              res.statusCode = 413;
              res.end(JSON.stringify({ ok: false, message: "El mensaje es demasiado grande. Resume tu consulta e inténtalo de nuevo." }));
              return;
            }
            chunks.push(part);
          }
          const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
          const result = await sendContactEmail(payload, env);
          res.statusCode = result.status;
          res.end(JSON.stringify(result.body));
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, message: "No hemos podido leer el formulario. Inténtalo de nuevo." }));
        }
      });
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const serverEnv = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [dyadComponentTagger(), react(), ...(command === "serve" ? [contactApiDevPlugin(serverEnv)] : [])],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
