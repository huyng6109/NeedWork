import { notFound, redirect } from "next/navigation";
import { PostEditorForm } from "@/components/post/PostEditorForm";
import { DEMO_POSTS } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface Props {
  params: { id: string };
}

export default async function EditPostPage({ params }: Props) {
  if (DEMO_MODE) {
    const post = DEMO_POSTS.find((item) => item.id === params.id) ?? null;

    if (!post) {
      notFound();
    }

    return <PostEditorForm mode="edit" initialPost={post} postId={params.id} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/post/${params.id}/edit`);
  }

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!post) {
    notFound();
  }

  if (post.author_id !== user.id) {
    redirect(`/post/${params.id}`);
  }

  return <PostEditorForm mode="edit" initialPost={post} postId={params.id} />;
}
