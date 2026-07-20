import { getCategories, getAllTags } from "../../actions-posts";
import PostEditor from "../post-editor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const categories = await getCategories();
  const tags = await getAllTags();

  return <PostEditor categories={categories as any} tags={tags as any} />;
}
