import type { Metadata } from "next";
import { OtpForm } from "@/components/OtpForm";

export const metadata: Metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <section className="card card-pad mx-auto max-w-lg">
      <h1 className="text-3xl font-bold">登录 / 注册</h1>
      <p className="lede mt-2 text-sm">手机和邮箱共用这一套验证码接口。当前不会调用阿里云或腾讯云，开发环境可以显示模拟验证码。</p>
      <div className="mt-5">
        <OtpForm />
      </div>
    </section>
  );
}
