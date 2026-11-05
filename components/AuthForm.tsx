"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { postJson } from "@/lib/browser";

export function AuthForm({ mode, devMock }: { mode: "login" | "register"; devMock: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(devMock ? "开发环境可以建立模拟会话，密码不会被保存。" : "账户系统即将接入。提交后不会创建真实账号。");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const payload = await postJson<{ message: string; user: { email: string } | null }>(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        email,
        password,
      });
      setMessage(payload.user ? `${payload.message} 当前邮箱 ${payload.user.email}。` : payload.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "请求没有完成。");
    } finally {
      setPending(false);
    }
  }

  async function magic() {
    setPending(true);
    try {
      const payload = await postJson<{ message: string }>("/api/auth/magic-link", { email });
      setMessage(payload.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "请求没有完成。");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm">
        邮箱
        <input className="field" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm">
        密码
        <input
          className="field"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <div className="actions">
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? "提交中" : mode === "login" ? "登录" : "注册"}
        </button>
        <button className="btn-ghost" type="button" disabled={pending || !email} onClick={() => void magic()}>
          邮件登录
        </button>
      </div>
      <p className="alert" role="status">
        {message}
      </p>
      <p className="text-sm">
        {mode === "login" ? (
          <Link className="text-primary" href="/register">
            没有账号，去注册
          </Link>
        ) : (
          <Link className="text-primary" href="/login">
            已有账号，去登录
          </Link>
        )}
      </p>
    </form>
  );
}
