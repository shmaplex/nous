// src/types/types.d.ts
export interface Article {
  id: string;
  title: string;
  url: string;
  content: string;
  bias?: "left" | "center" | "right";
  source?: string;
  publishedAt?: string;
}