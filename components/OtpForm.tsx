"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/browser";

export function OtpForm() {
  const router = useRouter();
  const [channel, setChannel] = useState<"phone" | "email">("phone");
  const [target, setTarget] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("使用手机或邮箱验证码登录。第一次验证通过即完成注册。");
  const [pending, setPending] = useState(false);

  async function send(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const payload = await postJson<{ message: string; devCode?: string; ok?: boolean }>("/api/auth/otp/send", { channel, target });
      setSent(Boolean(payload.ok));
      setMessage(payload.devCode ? `${payload.message} 开发环境验证码：${payload.devCode}` : payload.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "验证码没有发出。");
    } finally {
      setPending(false);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const payload = await postJson<{ message: string }>("/api/auth/otp/verify", { channel, target, code });
      setMessage(payload.message);
      router.push("/account/orders");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "没有登录成功。");
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="filters" role="tablist" aria-label="登录方式">
        <button className="pill" type="button" data-active={channel === "phone"} onClick={() => setChannel("phone")}>
          手机
        </button>
        <button className="pill" type="button" data-active={channel === "email"} onClick={() => setChannel("email")}>
          邮箱
        </button>
      </div>
      <form className="grid gap-3" onSubmit={send}>
        <label className="grid gap-2 text-sm">
          {channel === "phone" ? "手机号" : "邮箱"}
          <input
            className="field"
            required
            autoComplete={channel === "phone" ? "tel" : "email"}
            inputMode={channel === "phone" ? "tel" : "email"}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          />
        </label>
        <button className="btn-primary w-fit" type="submit" disabled={pending}>
          {pending ? "发送中" : "获取验证码"}
        </button>
      </form>
      <form className="grid gap-3" onSubmit={verify}>
        <label className="grid gap-2 text-sm">
          6 位验证码
          <input className="field" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" value={code} onChange={(event) => setCode(event.target.value)} />
        </label>
        <button className="btn-ghost w-fit" type="submit" disabled={pending || !sent}>
          登录 / 注册
        </button>
      </form>
      <p className="alert" role="status">
        {message}
      </p>
    </div>
  );
}
