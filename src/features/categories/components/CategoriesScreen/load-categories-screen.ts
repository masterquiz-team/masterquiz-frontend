import "server-only";

import { getPageSession } from "@/features/auth/server/page-session";
import { ApiError, parseId, parsePage } from "@/lib/api/server";
import { getHttpStatusMessage } from "@/lib/http-status-messages";
import { GuestAccessError } from "@/lib/api/errors";
import { getCategories, getCategory } from "../../server/api";
import {
  getCategoriesHref,
  getCategoriesReturnHref,
  type CategoriesQuery,
  type CategoriesScreenState,
} from "./categories-screen-model";

function single(query: CategoriesQuery, key: string): string | undefined {
  const value = query[key];
  if (Array.isArray(value))
    throw new ApiError(400, "Please use one value per query parameter.");
  return value;
}

export async function loadCategoriesScreen(
  searchParams: Promise<CategoriesQuery>,
): Promise<CategoriesScreenState> {
  const query = await searchParams;
  const currentHref = getCategoriesReturnHref(query);
  const session = await getPageSession(currentHref);
  if (session.status === "anonymous")
    return {
      kind: "preview",
      loginHref: session.loginHref,
      playHref: currentHref,
    };
  if (session.status === "unavailable")
    return {
      kind: "error",
      message:
        "Your session could not be verified. Please try again. Your session has been kept.",
      loginHref: session.loginHref,
      retryHref: currentHref,
    };

  let page = 0;
  let requestedCategory: string | undefined;
  try {
    page = parsePage(single(query, "page"));
    requestedCategory = single(query, "category");
    const data = await getCategories(page);
    let selected = null;
    let selectionError = null;
    if (requestedCategory !== undefined) {
      try {
        selected = await getCategory(parseId(requestedCategory));
      } catch (cause) {
        if (cause instanceof GuestAccessError) throw cause;
        const unavailable =
          "This category is unavailable. Please choose another category.";
        selectionError = getHttpStatusMessage(
          cause instanceof ApiError ? cause.status : undefined,
          {
            fallback:
              "The selected category could not be loaded. Please try again.",
            statuses: { 400: unavailable, 404: unavailable },
          },
        );
      }
    }
    return {
      kind: "ready",
      data,
      selected,
      selectionError,
      page,
      retryHref: getCategoriesHref(page, requestedCategory),
    };
  } catch (cause) {
    if (cause instanceof GuestAccessError)
      return {
        kind: "error",
        message: cause.message,
        guestRestricted: true,
        loginHref: session.loginHref,
        retryHref: currentHref,
      };
    return {
      kind: "error",
      message: getHttpStatusMessage(
        cause instanceof ApiError ? cause.status : undefined,
        {
          fallback: "Categories could not be loaded. Please try again.",
          statuses: {
            400: "This page address is invalid. Please return to the category list.",
            401: "Your category list could not be accessed. Please log in again.",
            403: "Access to your category list was denied. Your session has been kept.",
          },
        },
      ),
      loginHref: session.loginHref,
      retryHref: getCategoriesHref(page, requestedCategory),
    };
  }
}
