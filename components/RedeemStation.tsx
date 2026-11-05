"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { postJson, saveLocalBinding } from "@/lib/browser";
import { maskEmail, parseChatSession, parseGrokLogin } from "@/lib/credentials";
import { classifyCdk } from "@/lib/products";
import type { RedeemView, VerifyView } from "@/lib/types";

const INSTRUCTIONS: Record<string, string[]> = {
  chatgpt: [
    "在浏览器登录 chatgpt.com。",
    "打开 chatgpt.com/api/auth/session，全选并复制 JSON。",
    "粘贴到下方。需要包含 sessionToken，不要只粘贴 Access Token。",
  ],
  codex: [
    "Codex 点数记入您的 ChatGPT 账号。",
    "打开 chatgpt.com/api/auth/session，复制完整 JSON。",
    "确认账号无误后再提交，点数不会更换账号。",
  ],
  grok: [
    "在浏览器登录 grok.com。",
    "导出 Cookie JSON，或对 grok.com 的请求选择 Copy as cURL。",
    "粘贴后，本店只提取这一单需要的登录 cookie。",
  ],
};

export function RedeemStation() {
  const router = useRouter();
  const [cdk, setCdk] = useState("");
  const [credential, setCredential] = useState("");
  const [consent, setConsent] = useState(false);
  const [verify, setVerify] = useState<VerifyView | null>(null);
  const [message, setMessage] = useState("先核验卡密。登录信息只在提交时转发，不会写入订单档案。");
  const [tone, setTone] = useState<"neutral" | "ok" | "bad">("neutral");
  const [pending, setPending] = useState<"verify" | "redeem" | null>(null);

  const preview = useMemo(() => classifyCdk(cdk), [cdk]);
  const parsed = useMemo(() => {
    if (!credential.trim() || !verify?.ready) return null;
    return verify.product === "grok" ? parseGrokLogin(credential) : parseChatSession(credential);
  }, [credential, verify]);

  async function onVerify(event: FormEvent) {
    event.preventDefault();
    setPending("verify");
    setVerify(null);
    setCredential("");
    setConsent(false);
    setTone("neutral");
    setMessage("正在核验卡密。");
    try {
      const payload = await postJson<{ verify: VerifyView }>("/api/station/verify", { cdk });
      setVerify(payload.verify);
      setTone(payload.verify.ready ? "ok" : payload.verify.status === "valid" ? "neutral" : "bad");
      setMessage(payload.verify.message);
    } catch (error) {
      setTone("bad");
      setMessage(error instanceof Error ? error.message : "核验没有完成。");
    } finally {
      setPending(null);
    }
  }

  async function onRedeem(event: FormEvent) {
    event.preventDefault();
    if (!verify?.ready || !parsed?.ok) {
      setTone("bad");
      setMessage(parsed && !parsed.ok ? parsed.message : "请先完成核验，并填写有效的登录信息。");
      return;
    }
    setPending("redeem");
    setTone("neutral");
    setMessage("正在提交兑换，请停留在此页。");
    try {
      const payload = await postJson<{ redeem: RedeemView }>("/api/station/redeem", {
        cdk: cdk.trim(),
        sessionJson: parsed.sessionJson,
      });
      setCredential("");
      if (payload.redeem.orderId) {
        saveLocalBinding(cdk, payload.redeem.orderId);
        router.push(`/order/${payload.redeem.orderId}`);
        return;
      }
      setTone("ok");
      setMessage(payload.redeem.message);
    } catch (error) {
      setTone("bad");
      setMessage(error instanceof Error ? error.message : "兑换没有提交成功。");
    } finally {
      setPending(null);
    }
  }

  const steps = INSTRUCTIONS[verify?.product ?? ""] ?? [];
  const email = parsed?.ok ? maskEmail(parsed.email) : "";

  return (
    <div className="grid gap-6">
      <form className="grid gap-4" onSubmit={onVerify}>
        <label className="grid gap-2 text-sm" htmlFor="cdk">
          卡密
          <input
            id="cdk"
            className="field"
            value={cdk}
            autoComplete="off"
            spellCheck={false}
            placeholder="粘贴 xiaojiu 开头的卡密"
            onChange={(event) => {
              setCdk(event.target.value);
              setVerify(null);
            }}
          />
        </label>
        {cdk.trim().length >= 8 ? (
          <p className="text-sm text-[var(--muted)]">
            识别为 {preview.tierLabel}
            {preview.ready ? "，本店可以办理。" : "。这个通道尚未开放，核验后不会进入提交。"}
          </p>
        ) : null}
        <button className="gold-button w-fit" type="submit" disabled={pending !== null || cdk.trim().length < 8}>
          {pending === "verify" ? "核验中" : "核验卡密"}
        </button>
      </form>

      <p className={tone === "neutral" ? "alert" : `alert ${tone}`} role="status">
        {message}
      </p>

      {verify?.status === "valid" && !verify.ready ? (
        <div className="alert">
          <p className="serif text-lg">{verify.tierLabel}</p>
          <p className="mt-2 text-sm">
            这张卡可以识别，但 Claude 与 Team 还没有在本店开放。请不要在这里重复提交，需要办理时联系店主。
          </p>
        </div>
      ) : null}

      {verify?.ready ? (
        <form className="grid gap-4" onSubmit={onRedeem}>
          <div>
            <p className="kicker">Account</p>
            <h2 className="display mt-2 text-2xl">填写{verify.product === "grok" ? "Grok" : "ChatGPT"}登录信息</h2>
            <ol className="lede mt-3 list-decimal space-y-1 pl-5 text-sm">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <label className="grid gap-2 text-sm" htmlFor="credential">
            登录信息
            <textarea
              id="credential"
              className="field"
              value={credential}
              autoComplete="off"
              spellCheck={false}
              placeholder={verify.product === "grok" ? "粘贴 Cookie JSON 或 cURL" : "粘贴 session JSON"}
              onChange={(event) => setCredential(event.target.value)}
            />
          </label>
          {parsed && !parsed.ok ? <p className="text-sm text-[#6d2e24]">{parsed.message}</p> : null}
          {parsed?.ok ? (
            <p className="text-sm text-[#245238]">
              {parsed.detail}
              {email ? ` · 账号 ${email}` : ""}
            </p>
          ) : null}
          <label className="flex items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            我确认这是我本人的账号，并同意用这张卡为它兑换。
          </label>
          <button
            className="gold-button w-fit"
            type="submit"
            disabled={pending !== null || !consent || !parsed?.ok}
          >
            {pending === "redeem" ? "提交中" : "确认兑换"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
