"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/site-content";

export function ServiceWidget({ service, support }: { service: SiteContent["service"]; support?: SiteContent["support"] }) {
  const [open, setOpen] = useState(false);
  if (!service.enabled) return null;
  const email = support?.email?.includes("@") ? support.email : "";
  const configured = Boolean(service.wechatQr || service.qq || service.link);
  const body = configured
    ? service.text
    : email
      ? "可以通过邮箱联系客服。后台保存微信二维码、QQ 或链接后，也会显示在这里。"
      : "客服方式尚未填写。后台保存微信二维码、QQ 或链接后会显示在这里。";
  return (
    <div className="cs-root">
      {open ? (
        <aside className="cs-panel card card-pad" role="dialog" aria-label={service.title}>
          <h2 className="text-lg font-semibold">{service.title}</h2>
          <p className="lede mt-2 text-sm">{body}</p>
          {email ? (
            <a className="btn-primary mt-3" href={`mailto:${email}`}>
              {email}
            </a>
          ) : null}
          {support?.hours ? <p className="mt-2 text-sm">服务时间 {support.hours}</p> : null}
          {service.wechatQr ? <img className="mt-3 max-h-40 rounded-xl" src={service.wechatQr} alt="微信二维码" /> : null}
          {service.qq ? <p className="mt-2 text-sm">QQ {service.qq}</p> : null}
          {service.link ? (
            <a className="btn-ghost mt-3" href={service.link} rel="noreferrer">
              {service.linkLabel || "打开客服"}
            </a>
          ) : null}
        </aside>
      ) : null}
      <button className="cs-button" type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((value) => !value)}>
        {open ? "关闭" : "客服"}
      </button>
    </div>
  );
}
