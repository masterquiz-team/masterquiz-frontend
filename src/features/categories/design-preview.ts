// Design-only names have no backend IDs and cannot be selected as API records.
// Set illustration after adding the supplied export to public/images/categories/.
export const categoryArtwork: {
  name: string;
  filename: string;
  illustration: string | null;
}[] = [
  { name: "Geography", filename: "geography.svg", illustration: null },
  { name: "History", filename: "history.svg", illustration: null },
  { name: "Science", filename: "science.svg", illustration: null },
  { name: "Sports", filename: "sports.svg", illustration: null },
  { name: "Entertainment", filename: "entertainment.svg", illustration: null },
  { name: "Technology", filename: "technology.svg", illustration: null },
  { name: "Art & Culture", filename: "art-culture.svg", illustration: null },
  {
    name: "General Knowledge",
    filename: "general-knowledge.svg",
    illustration: null,
  },
  { name: "Animals", filename: "animals.svg", illustration: null },
  { name: "Music", filename: "music.svg", illustration: null },
  { name: "Food & Drinks", filename: "food-drinks.svg", illustration: null },
  { name: "Astronomy", filename: "astronomy.svg", illustration: null },
];
