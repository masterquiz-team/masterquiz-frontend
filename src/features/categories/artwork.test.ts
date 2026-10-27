import { describe, expect, it } from "vitest";
import { getCategoryArtwork } from "./artwork";

describe("getCategoryArtwork", () => {
  it("normalises category names", () => {
    expect(getCategoryArtwork(" ART &  Culture")?.name).toBe("Art & Culture");
    expect(getCategoryArtwork("geography")?.name).toBe("Geography");
    expect(getCategoryArtwork("Unknown")).toBeUndefined();
  });
});
