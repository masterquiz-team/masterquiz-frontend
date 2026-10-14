import "server-only";

// Compatibility entry point; cookie-independent transport lives in src/lib.
export { backendFetch } from "@/lib/backend/transport";
