import { afterEach, expect, it, vi } from "vitest";
import { checkAuthRequest, authJson } from "./request";
import { readMutation, apiResponse } from "@/lib/api/server";

const request = (
  headers: Record<string, string | undefined> = {},
  body = "{}",
) =>
  new Request("https://masterquiz.test/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...Object.fromEntries(
        Object.entries(headers).filter(
          (entry): entry is [string, string] => entry[1] !== undefined,
        ),
      ),
    },
    body,
  });
it.each([
  {},
  { origin: "https://masterquiz.test" },
  { "sec-fetch-site": "same-origin" },
  { "content-type": "Application/JSON; charset=utf-8" },
])("accepts same-origin JSON %s", async (headers) => {
  expect(checkAuthRequest(request(headers))).toBeNull();
  await expect(readMutation(request(headers))).resolves.toEqual({});
});
it.each([
  { origin: "https://evil.test" },
  { origin: "null" },
  { "sec-fetch-site": "cross-site" },
  { "sec-fetch-site": "same-site" },
])("rejects foreign mutations %s", async (headers) => {
  expect(checkAuthRequest(request(headers))?.status).toBe(403);
  await expect(readMutation(request(headers))).rejects.toMatchObject({
    status: 403,
    message: expect.stringMatching(/same origin/),
  });
});
afterEach(() => vi.unstubAllEnvs());

it("checks the Origin against APP_ORIGIN behind a proxy", () => {
  vi.stubEnv("APP_ORIGIN", "https://masterquiz.onrender.com/");
  const internal = (origin: string) =>
    new Request("http://localhost:10000/api/auth/guest", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
    });
  expect(
    checkAuthRequest(internal("https://masterquiz.onrender.com")),
  ).toBeNull();
  expect(checkAuthRequest(internal("http://localhost:10000"))?.status).toBe(
    403,
  );
  expect(checkAuthRequest(internal("https://evil.test"))?.status).toBe(403);
});

it("rejects non-JSON and gives origin rejection precedence", () => {
  expect(
    checkAuthRequest(request({ "content-type": "text/plain" }))?.status,
  ).toBe(415);
  expect(
    checkAuthRequest(
      request({ "content-type": "text/plain", origin: "https://evil.test" }),
    )?.status,
  ).toBe(403);
});
it("rejects non-JSON mutations with 415", async () => {
  await expect(
    readMutation(request({ "content-type": "text/plain" })),
  ).rejects.toMatchObject({
    status: 415,
    message: "Content-Type must be application/json.",
  });
});
it("only reads JSON objects", async () => {
  await expect(readMutation(request({}, '{"id":1}'))).resolves.toEqual({
    id: 1,
  });
  for (const body of ["[]", "null", "invalid"])
    await expect(readMutation(request({}, body))).rejects.toMatchObject({
      status: 400,
    });
});

it("shares no-store JSON responses with auth and preserves cookie support", async () => {
  const response = await apiResponse(async () => ({ ok: true }), 201);
  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const auth = authJson({ ok: true }, 201);
  expect(auth.headers.get("cache-control")).toBe(
    response.headers.get("cache-control"),
  );
  auth.cookies.set("test", "value");
  expect(auth.headers.get("set-cookie")).toContain("test=value");
});
