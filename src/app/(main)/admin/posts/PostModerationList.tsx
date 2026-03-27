"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime, formatSalary } from "@/lib/utils";
import { JOB_TYPE_LABELS } from "@/constants";
import type { Post } from "@/types";
import toast from "react-hot-toast";
import { MapPin, Briefcase, Mail } from "lucide-react";

interface Props {
  initialPosts: Post[];
}

export function PostModerationList({ initialPosts }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState<Record<string, "approved" | "rejected">>({});

  async function moderate(postId: string, status: "approved" | "rejected") {
    setLoading((l) => ({ ...l, [postId]: status }));
    const res = await fetch(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading((l) => { const n = { ...l }; delete n[postId]; return n; });

    if (!res.ok) { toast.error("Thao tác thất bại"); return; }
    setPosts((p) => p.filter((post) => post.id !== postId));
    toast.success(status === "approved" ? "Đã duyệt bài" : "Đã từ chối bài");
  }

  if (!posts.length) {
    return <p className="text-center text-muted py-12">Không có bài nào chờ duyệt</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div key={post.id} className="card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar src={post.author?.avatar_url} name={post.author?.name} size="sm" frameColor={post.author?.frame_color} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-dark">{post.author?.name}</div>
              <div className="text-xs text-muted">{formatRelativeTime(post.created_at)}</div>
            </div>
            <Badge variant="pending">Chờ duyệt</Badge>
          </div>

          <h3 className="font-semibold text-dark">{post.title}</h3>
          <p className="text-sm text-muted line-clamp-3">{post.content}</p>

          <div className="flex flex-wrap gap-2 text-xs text-muted">
            {post.location_name && <span className="flex items-center gap-1"><MapPin size={11} />{post.location_name}</span>}
            {(post.salary_min || post.salary_max) && <span className="flex items-center gap-1"><Briefcase size={11} />{formatSalary(post.salary_min, post.salary_max)}</span>}
            {post.email && <span className="flex items-center gap-1"><Mail size={11} />{post.email}</span>}
            {post.job_type && <Badge variant="gray">{JOB_TYPE_LABELS[post.job_type]}</Badge>}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              loading={loading[post.id] === "approved"}
              onClick={() => moderate(post.id, "approved")}
            >
              Duyệt
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={loading[post.id] === "rejected"}
              onClick={() => moderate(post.id, "rejected")}
            >
              Từ chối
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
