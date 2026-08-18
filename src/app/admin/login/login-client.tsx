"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/ui/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { Input } from "@/ui/common/input";

export default function AdminLoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const next = params.get("next");
      const destination = next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/admin/content-studio";
      if (response.ok) router.replace(destination);
      else setError("管理员密码错误或未配置");
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>管理员登录</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入管理员密码" autoFocus />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" disabled={loading || !password}>{loading ? "登录中…" : "登录后台"}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
