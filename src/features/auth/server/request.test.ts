import { expect, it } from "vitest";
import { checkAuthRequest } from "./request";
import { assertSameOrigin, readMutation } from "@/lib/api/server";

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
])("accepts same-origin JSON %s", (headers) => {
  expect(checkAuthRequest(request(headers))).toBeNull();
  expect(() => assertSameOrigin(request(headers))).not.toThrow();
});
it.each([
  { origin: "https://evil.test" },
  { origin: "null" },
  { "sec-fetch-site": "cross-site" },
  { "sec-fetch-site": "same-site" },
])("rejects foreign mutations %s", (headers) => {
  expect(checkAuthRequest(request(headers))?.status).toBe(403);
  expect(() => assertSameOrigin(request(headers))).toThrow(/same origin/);
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
it("only reads JSON objects", async () => {
  await expect(readMutation(request({}, '{"id":1}'))).resolves.toEqual({
    id: 1,
  });
  for (const body of ["[]", "null", "invalid"])
    await expect(readMutation(request({}, body))).rejects.toMatchObject({
      status: 400,
    });
});
