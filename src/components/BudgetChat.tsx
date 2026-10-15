import { getWhatsAppNumber } from "@/lib/config";

interface BudgetChatProps {
  className?: string;
  whatsappNumber?: string;
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
      <path
        d="M16 3.1c-7.12 0-12.9 5.77-12.9 12.88 0 2.28.6 4.52 1.75 6.49L3.1 28.9l6.6-1.72A12.83 12.83 0 0 0 16 28.82h.01c7.11 0 12.89-5.78 12.89-12.89 0-3.45-1.34-6.7-3.78-9.14A12.81 12.81 0 0 0 16 3.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M11.05 9.2c-.3-.66-.62-.67-.91-.68h-.78c-.27 0-.72.1-1.1.52-.38.42-1.44 1.4-1.44 3.41s1.47 3.96 1.68 4.23c.2.27 2.82 4.52 6.96 6.16 3.44 1.36 4.14 1.09 4.88 1.02.74-.07 2.4-.98 2.74-1.93.34-.95.34-1.76.24-1.93-.1-.17-.38-.27-.79-.48-.41-.2-2.4-1.18-2.78-1.31-.37-.14-.64-.2-.92.2-.27.41-1.06 1.31-1.3 1.58-.24.27-.48.3-.89.1-.41-.21-1.73-.64-3.3-2.03-1.22-1.09-2.04-2.44-2.28-2.85-.24-.41-.03-.63.18-.83.18-.18.41-.48.62-.72.2-.24.27-.41.41-.68.14-.27.07-.51-.03-.72-.1-.2-.91-2.2-1.19-3.06Z"
        fill="currentColor"
        transform="translate(2.2 0) scale(.88)"
      />
    </svg>
  );
}

const BudgetChat = ({ className, whatsappNumber = "" }: BudgetChatProps) => {
  const normalizedNumber = getWhatsAppNumber(whatsappNumber);
  // A real destination number must be configured in the CMS or .env.local before showing the direct-chat button.
  if (!normalizedNumber) return null;

  const defaultMessage = "Hola NOVIDEA, quiero hablar sobre un proyecto personalizado.";
  const url = `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 sm:bottom-7 sm:right-7 ${className ?? ""}`}
      aria-label="Abrir WhatsApp para hablar con NOVIDEA"
      title="Escríbenos por WhatsApp"
    >
      <WhatsAppGlyph />
      <span className="pointer-events-none absolute right-[calc(100%+0.7rem)] whitespace-nowrap rounded-full bg-[#12372A] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Escríbenos por WhatsApp
      </span>
    </a>
  );
};

export default BudgetChat;
