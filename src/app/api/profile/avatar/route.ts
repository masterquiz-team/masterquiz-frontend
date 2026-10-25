import { getSessionState } from "@/features/auth/server/session";
import { getSessionToken } from "@/lib/backend/token";
import { backendFetch } from "@/lib/backend/transport";

const missing = () =>
  new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const n = params.get("n");
  if (!n || !/^(?:[1-9]|1[0-9]|20)$/.test(n) || params.getAll("n").length !== 1)
    return missing();
  try {
    if ((await getSessionState()).status !== "authenticated") return missing();
    const token = await getSessionToken();
    if (!token) return missing();
    const response = await backendFetch(
      `/avatars/avatar-${n}.jpg`,
      {},
      token,
      "image/*",
    );
    const type = response.headers
      .get("Content-Type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase();
    if (
      !response.ok ||
      !type ||
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type)
    )
      return missing();
    // Buffer inside the try block so interrupted upstream bodies also become 404.
    const body = await response.arrayBuffer();
    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        Vary: "Cookie",
      },
    });
  } catch {
    return missing();
  }
}
