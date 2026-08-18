
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPosts, getCategories } from "../actions-posts";
import { AdminPostsClient } from "./admin-posts-client";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const { posts, total } = await getPosts();
  const categories = await getCategories();

  return (
    <AdminPostsClient
      initialPosts={posts as any}
      total={total}
      categories={categories as any}
    />
  );
}
