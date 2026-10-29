// Design-only names have no backend IDs and cannot be selected as API records.
// Artwork is composed from the original layers of Figma frame 63:479.
export const categoryArtwork: {
  name: string;
  filename: string;
  description: string;
  illustration: string | null;
}[] = [
  {
    name: "Geography",
    description: "Countries, capitals, landmarks and more.",
    filename: "geography.svg",
    illustration: "/images/categories/geography.svg",
  },
  {
    name: "History",
    description: "Past events, famous people and important moments.",
    filename: "history.svg",
    illustration: "/images/categories/history.svg",
  },
  {
    name: "Science",
    description: "Nature, physics, biology and discoveries.",
    filename: "science.svg",
    illustration: "/images/categories/science.svg",
  },
  {
    name: "Sports",
    description: "Disciplines, rules, records and famous athletes.",
    filename: "sports.svg",
    illustration: "/images/categories/sports.svg",
  },
  {
    name: "Entertainment",
    description: "Films, series, actors and iconic scenes.",
    filename: "entertainment.svg",
    illustration: "/images/categories/entertainment.svg",
  },
  {
    name: "Technology",
    description: "Inventions, computers, internet and modern tech.",
    filename: "technology.svg",
    illustration: "/images/categories/technology.svg",
  },
  {
    name: "Art & Culture",
    description: "Art, literature, music and traditions.",
    filename: "art-culture.svg",
    illustration: "/images/categories/art-culture.svg",
  },
  {
    name: "General Knowledge",
    description: "Fun facts, riddles and questions from many fields.",
    filename: "general-knowledge.svg",
    illustration: "/images/categories/general-knowledge.svg",
  },
  {
    name: "Animals",
    description: "Animals, plants, ecosystems and natural wonders.",
    filename: "animals.svg",
    illustration: "/images/categories/animals.svg",
  },
  {
    name: "Music",
    description: "Genres, artists, instruments and famous songs.",
    filename: "music.svg",
    illustration: "/images/categories/music.svg",
  },
  {
    name: "Food & Drinks",
    description: "World cuisines, ingredients, dishes and culinary facts.",
    filename: "food-drinks.svg",
    illustration: "/images/categories/food-drinks.svg",
  },
  {
    name: "Astronomy",
    description: "Planets, stars, galaxies and space exploration.",
    filename: "astronomy.svg",
    illustration: "/images/categories/astronomy.svg",
  },
];

export function getCategoryArtwork(name: string) {
  const normalizedName = name.trim().replace(/\s+/g, " ").toLowerCase();
  return categoryArtwork.find(
    (artwork) => artwork.name.toLowerCase() === normalizedName,
  );
}
