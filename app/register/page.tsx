import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { devAuthEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "注册" };

export default function RegisterPage() {
  return (
    <section className="card card-pad mx-auto max-w-lg">
      <h1 className="text-3xl font-bold">注册</h1>
      <p className="lede mt-2 text-sm">注册接口只校验格式。密码不会写入磁盘，也不会发给第三方。</p>
      <div className="mt-5">
        <AuthForm mode="register" devMock={devAuthEnabled()} />
      </div>
    </section>
  );
}
