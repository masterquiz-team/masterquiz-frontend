import { authenticate } from "@/features/auth/server/auth";
import { authJson, checkAuthRequest } from "@/features/auth/server/request";
import {
  parseAuthPayload,
  validateAuthValues,
} from "@/features/auth/validators/auth";
import { isRecord } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  if (action !== "login" && action !== "register") {
    return authJson({ message: "Unknown authentication endpoint." }, 404);
  }
  const rejected = checkAuthRequest(request);
  if (rejected) return rejected;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authJson({ message: "A JSON object is required." }, 400);
  }
  if (!isRecord(body)) {
    return authJson({ message: "A JSON object is required." }, 400);
  }
  const payload = parseAuthPayload(action, body);
  if (!payload) {
    return authJson({ message: "Please complete all required fields." }, 400);
  }
  const fieldErrors = validateAuthValues(action, payload);
  if (Object.keys(fieldErrors).length) {
    return authJson(
      { message: "Please check your details.", fieldErrors },
      400,
    );
  }
  return authenticate(action, payload);
}
