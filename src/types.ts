export interface Article {
  id: string;
  title: string;
  body: string;
  author: string;
  editor: string;
  date: string;
  time: string;
  category: string;
  region: string;
  imageUrl: string;
  imageCaption: string;
  bullets?: string[];
  
  // Editorial and visual tuning parameters
  cropZoom: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  
  // Custom draft context
  rawDraft?: string;
  evaluationNote?: string;
  isCustomEdited?: boolean;

  // New features for Beranda Dinamis, SEO, and Multimedia
  slug?: string;
  videoUrl?: string; // e.g. local loop, youtube clip, or live simulator flag
  audioUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export interface PhotoAsset {
  id: string;
  name: string;
  url: string;
  description: string;
  defaultCaption: string;
  defaultDraft: string;
}
