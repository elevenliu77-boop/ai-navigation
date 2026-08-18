// ─────────── 文章系统 ───────────

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  metadata?: DiscoveryMetadata | null;
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

export interface DiscoveryMetadata {
  recommended?: boolean;
  intro?: string;
  why?: string;
  audience?: string[];
  scenarios?: string[];
  relatedTools?: string[];
  relatedWorkflows?: string[];
  relatedCases?: string[];
}

// ─────────── 导航站遗留类型 ───────────

export interface Website {
  id: number;
  title: string;
  url: string;
  description: string;
  category_id: number;
  category?: Category;
  thumbnail: string | null;
  thumbnail_base64: string | null;
  active: number;
  status: string;
  visits: number;
  likes: number;
  metadata?: ToolMetadata | null;
}

export interface ToolMetadata {
  audience?: string[];
  scenarios?: string[];
  tags?: string[];
  tutorial?: string;
  promptSlugs?: string[];
  workflowSlugs?: string[];
  caseSlugs?: string[];
  rating?: string;
  difficulty?: string;
  pricing?: string;
  pros?: string[];
  cons?: string[];
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
  id: number;
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

// ──────── 提示词库 ────────

export interface Prompt {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category_id: number;
  category?: Category;
  tags?: Tag[];
  status: "draft" | "published" | "archived";
  featured: boolean;
  view_count: number;
  like_count: number;
  copy_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  metadata?: PromptMetadata | null;
}

export interface PromptMetadata {
  scenarios?: string[];
  recommendedModel?: string;
  exampleInput?: string;
  exampleOutput?: string;
  // Task Contract（提示词 → 任务契约 → Eval 方向）
  taskGoal?: string;
  inputRequirements?: string;
  prohibited?: string;
  outputFormat?: string;
  acceptanceCriteria?: string;
  lastVerifiedAt?: string;
}

// ──────── 工作流库 ────────

export interface WorkflowStep {
  title: string;
  description: string;
  tools?: string[];
}

export interface WorkflowTool {
  name: string;
  url?: string;
}

export interface Workflow {
  id: number;
  title: string;
  slug: string;
  description: string;
  steps: WorkflowStep[] | string;
  tools: WorkflowTool[] | string | null;
  category_id: number;
  category?: Category;
  tags?: Tag[];
  status: "draft" | "published" | "archived";
  featured: boolean;
  view_count: number;
  like_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  metadata?: WorkflowMetadata | null;
}

export interface WorkflowMetadata {
  audience?: string[];
  effect?: string;
}

// ──────── 案例库 ────────

export interface CaseResultItem {
  label: string;
  value: string;
}

export interface CaseStudy {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover: string | null;
  result: CaseResultItem[] | string | null;
  metadata?: CaseMetadata | null;
  category_id: number;
  category?: Category;
  tags?: Tag[];
  status: "draft" | "published" | "archived";
  featured: boolean;
  view_count: number;
  like_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseMetadata {
  revenueModel?: string;
  cost?: string;
  audience?: string[];
  tools?: string[];
  difficulty?: string;
  cycle?: string;
  evidenceLevel?: string;
}

// ──────── 资料库 ────────

export interface Resource {
  id: number;
  title: string;
  slug: string;
  type: string;
  description: string | null;
  url: string;
  category_id: number | null;
  category?: Category | null;
  permission: string;
  downloads: number;
  status: string;
  created_at: string;
  updated_at: string;
}
