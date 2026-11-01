import { describe, expect, it } from "vitest";
import { getCategoryArtwork } from "./artwork";

describe("getCategoryArtwork", () => {
  it.each([
    ["Geography", "Countries, capitals, landmarks and more."],
    ["History", "Past events, famous people and important moments."],
    ["Science", "Nature, physics, biology and discoveries."],
    ["Sports", "Disciplines, rules, records and famous athletes."],
    ["Entertainment", "Films, series, actors and iconic scenes."],
    ["Technology", "Inventions, computers, internet and modern tech."],
    ["Art & Culture", "Art, literature, music and traditions."],
    ["General Knowledge", "Fun facts, riddles and questions from many fields."],
    ["Animals", "Animals, plants, ecosystems and natural wonders."],
    ["Music", "Genres, artists, instruments and famous songs."],
    [
      "Food & Drinks",
      "World cuisines, ingredients, dishes and culinary facts.",
    ],
    ["Astronomy", "Planets, stars, galaxies and space exploration."],
  ])("provides the exact design description for %s", (name, description) => {
    expect(getCategoryArtwork(name)?.description).toBe(description);
  });

  it("normalises category names", () => {
    expect(getCategoryArtwork(" ART &  Culture")?.name).toBe("Art & Culture");
    expect(getCategoryArtwork("geography")?.name).toBe("Geography");
    expect(getCategoryArtwork(" \tGENERAL \n knowledge  ")?.description).toBe(
      "Fun facts, riddles and questions from many fields.",
    );
  });

  it("has no description for an unknown name", () => {
    expect(getCategoryArtwork("Unknown")).toBeUndefined();
    expect(getCategoryArtwork(" \t ")?.description).toBeUndefined();
  });
});
