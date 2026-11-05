import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { devAuthEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <section className="card card-pad mx-auto max-w-lg">
      <h1 className="text-3xl font-bold">登录</h1>
      <p className="lede mt-2 text-sm">邮箱登录和密码登录都已预留接口。正式环境不会建立真实会话。</p>
      <div className="mt-5">
        <AuthForm mode="login" devMock={devAuthEnabled()} />
      </div>
    </section>
  );
}
