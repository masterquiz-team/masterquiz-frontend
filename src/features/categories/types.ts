export type Category = { id: number; name: string };
export type CategoryPage = {
  content: Category[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};
