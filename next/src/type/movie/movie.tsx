export type Movie = {
  id: string;
  title: string;
  releaseDate: string;
  duration: number;
  genre: string;
  description?: string;
  director: string;
  casts: string;
  imageUrl?: string;
  trailerUrl?: string;
  showings: any[];
  showingCount: number;
};
