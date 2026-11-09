"use client";

import { useEffect, useState } from "react";
import { getJson } from "@/lib/browser";

type Settings = {
  paymentMode: string;
  paymentLabel: string;
  authMode: string;
  authLabel: string;
  otpLabel: string;
  cookieSecure: boolean;
  adminConfigured: boolean;
};

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getJson<{ settings: Settings }>("/api/admin/settings")
      .then((payload) => setSettings(payload.settings))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "设置没有打开。"));
  }, []);

  if (message) return <p className="alert">{message}</p>;
  if (!settings) return <p className="lede">正在读取系统设置。</p>;

  const rows = [
    ["后台口令", settings.adminConfigured ? "已配置，页面不显示口令" : "未配置"],
    ["顾客登录", `${settings.authMode} · ${settings.authLabel}`],
    ["验证码发送", settings.otpLabel],
    ["支付", `${settings.paymentMode} · ${settings.paymentLabel}`],
    ["Cookie", settings.cookieSecure ? "仅通过 HTTPS 发送" : "当前允许 HTTP，正式环境应开启 COOKIE_SECURE"],
  ];

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">系统设置</h1>
      <p className="lede text-sm">这里只展示当前运行方式。支付、退款和卡密库存没有可保存的开关，侧栏对应入口已停用。</p>
      <dl className="admin-settings">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
