import type { Metadata } from "next";
import { CdkQuery } from "@/components/CdkQuery";
import { RedeemStation } from "@/components/RedeemStation";

export const metadata: Metadata = { title: "兑换" };

export default function RedeemPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="panel">
        <div className="panel-body">
          <p className="kicker">Redeem</p>
          <h1 className="display mt-3 text-4xl">兑换礼品卡</h1>
          <p className="lede mt-3 max-w-2xl">
            先核验，再提交账号。ChatGPT、Grok、Codex 可以在这里办理。Claude 与 Team 只做识别，不会提交。
          </p>
          <div className="mt-8">
            <RedeemStation />
          </div>
        </div>
      </section>
      <aside className="panel h-fit">
        <div className="panel-body">
          <CdkQuery />
        </div>
      </aside>
    </div>
  );
}
