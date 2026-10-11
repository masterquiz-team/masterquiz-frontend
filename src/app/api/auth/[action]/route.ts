import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  if (action !== "login" && action !== "register") {
    return NextResponse.json(
      { message: "Unknown authentication endpoint." },
      { status: 404 },
    );
  }
  let body: Record<string, unknown>;
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Invalid body");
    body = value;
  } catch {
    return NextResponse.json(
      { message: "A JSON object is required." },
      { status: 400 },
    );
  }
  const fields =
    action === "register"
      ? ["email", "password", "nickname", "repeatPassword"]
      : ["email", "password"];
  if (fields.some((field) => typeof body[field] !== "string" || !body[field])) {
    return NextResponse.json(
      { message: "Please complete all required fields." },
      { status: 400 },
    );
  }
  const payload = Object.fromEntries(
    fields.map((field) => [field, body[field]]),
  );
  const baseUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const fallback =
        action === "login" && response.status === 401
          ? "The email or password was not accepted."
          : action === "register" && response.status === 409
            ? "An account with this email already exists."
            : "The API rejected the request. Please check your details and try again.";
      return NextResponse.json(
        {
          message:
            typeof result?.message === "string" ? result.message : fallback,
        },
        { status: response.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!result || typeof result !== "object") {
      return NextResponse.json(
        { message: "The API returned an unexpected response." },
        { status: 502 },
      );
    }
    return NextResponse.json(result, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "The backend is unavailable or took too long to respond. Please try again later.",
      },
      { status: 502 },
    );
  }
}
