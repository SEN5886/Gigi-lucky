"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/site-content";

export function ServiceWidget({ service }: { service: SiteContent["service"] }) {
  const [open, setOpen] = useState(false);
  if (!service.enabled) return null;
  const hasChannel = Boolean(service.wechatQr || service.qq || service.link);
  return (
    <div>
      {open ? (
        <aside className="cs-panel card card-pad" role="dialog" aria-label={service.title}>
          <h2 className="text-lg font-semibold">{service.title}</h2>
          <p className="lede mt-2 text-sm">{hasChannel ? service.text : "客服方式尚未填写。后台保存微信二维码、QQ 或链接后会显示在这里。"}</p>
          {service.wechatQr ? <img className="mt-3 max-h-40 rounded-xl" src={service.wechatQr} alt="微信二维码" /> : null}
          {service.qq ? <p className="mt-2 text-sm">QQ {service.qq}</p> : null}
          {service.link ? (
            <a className="btn-primary mt-3" href={service.link} rel="noreferrer">
              {service.linkLabel || "打开客服"}
            </a>
          ) : null}
        </aside>
      ) : null}
      <button className="cs-button" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        客服
      </button>
    </div>
  );
}
