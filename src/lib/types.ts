// ─────────── 文章系统 ───────────

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  status: "draft" | "published" | "archived";
  view_count: number;
  like_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: number;
  category?: Category;
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

// ─────────── 导航站遗留类型 ───────────

export interface Website {
  id: number;
  title: string;
  url: string;
  description: string;
  category_id: number;
  thumbnail: string | null;
  thumbnail_base64: string | null;
  active: number;
  status: string;
  visits: number;
  likes: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface FormInputs {
  title: string;
  url: string;
  description: string;
  category_id: string;
  thumbnail?: string;
}

// 设置
export interface Setting {
  id: number;
  key: string;
  value: string;
}

export interface FooterLink {
  title: string;
  url: string;
}

// 页脚设置
export interface FooterSettings {
  links: FooterLink[];
  copyright: string;
  icpBeian: string;
  customHtml: string;
}
