"use client";

import { FormEvent, useEffect, useState } from "react";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { OverviewPanel } from "@/components/admin/OverviewPanel";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { ProductImages } from "@/components/ProductImages";
import { getJson, postJson } from "@/lib/browser";
import type { MallProduct } from "@/lib/mall-logic";
import type { SiteContent } from "@/lib/site-content";

const emptyProduct = (): MallProduct => ({
  id: "",
  slug: "",
  title: "",
  category: "other",
  summary: "",
  description: "",
  priceCents: 0,
  stock: 0,
  badge: "in_stock",
  images: [],
  published: true,
});

const NAV = [
  ["overview", "数据总览"],
  ["users", "用户管理"],
  ["products", "商品管理"],
  ["orders", "订单管理"],
  ["content", "页面/内容管理"],
  ["service", "客服配置"],
  ["settings", "系统设置"],
] as const;

const PENDING = ["支付", "退款", "卡密库存", "工单", "操作日志", "发票", "SKU"];

type Panel = (typeof NAV)[number][0];
type SiteContentNav = SiteContent["nav"];

export function AdminConsole() {
  const [ready, setReady] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<MallProduct[]>([]);
  const [draft, setDraft] = useState<MallProduct>(emptyProduct());
  const [previousId, setPreviousId] = useState("");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [panel, setPanel] = useState<Panel>("overview");

  async function load() {
    const session = await getJson<{ ok: boolean }>("/api/admin/session");
    setReady(session.ok);
    if (!session.ok) return;
    const [productPayload, contentPayload] = await Promise.all([
      getJson<{ products: MallProduct[] }>("/api/admin/products"),
      getJson<{ content: SiteContent }>("/api/admin/content"),
    ]);
    setProducts(productPayload.products);
    setContent(contentPayload.content);
  }

  useEffect(() => {
    void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "后台没有打开。"));
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await postJson("/api/admin/login", { token });
      setToken("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "没有进入后台。");
    }
  }

  function edit(product: MallProduct) {
    setDraft(product);
    setPreviousId(product.id);
    setImages(product.images);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    const product = {
      ...draft,
      id: draft.slug,
      priceCents: Math.round(Number(draft.priceCents)),
      stock: Math.round(Number(draft.stock)),
      images,
    };
    try {
      const payload = await postJson<{ products: MallProduct[] }>("/api/admin/products", { product, previousId: previousId || product.id });
      setProducts(payload.products);
      setMessage("商品已保存。刷新商店即可看到。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "商品没有保存。");
    }
  }

  async function saveContent(event: FormEvent) {
    event.preventDefault();
    if (!content) return;
    try {
      const payload = await postJson<{ content: SiteContent }>("/api/admin/content", content);
      setContent(payload.content);
      setMessage("已保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "没有保存。");
    }
  }

  if (ready === null) return <p className="admin-login">正在确认后台权限。</p>;
  if (!ready) {
    return (
      <form className="admin-login" onSubmit={login}>
        <h1 className="text-3xl font-bold">客服后台</h1>
        <p className="lede text-sm">供客服和运营使用。口令来自环境变量 ADMIN_TOKEN，不会出现在页面源码里。</p>
        <label className="grid gap-2 text-sm">
          后台口令
          <input className="field" type="password" autoComplete="current-password" value={token} onChange={(event) => setToken(event.target.value)} />
        </label>
        <button className="btn-primary w-fit" type="submit">进入</button>
        {message ? <p className="alert">{message}</p> : null}
      </form>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <p className="admin-brand">Gigi Ai<small>客服与运营</small></p>
        {NAV.map(([id, label]) => (
          <button key={id} type="button" data-active={panel === id} onClick={() => { setPanel(id); setMessage(""); }}>
            {label}
          </button>
        ))}
        <p className="admin-pending-label">没有接口，不能打开</p>
        {PENDING.map((label) => (
          <button key={label} type="button" disabled>
            <span>{label}</span>
            <span className="admin-tag">待接入</span>
          </button>
        ))}
        <button className="admin-logout" type="button" onClick={() => void postJson("/api/admin/logout").then(() => setReady(false))}>退出</button>
      </aside>
      <div className="admin-work grid gap-4">
        {message ? <p className="alert" role="status">{message}</p> : null}
        {panel === "overview" ? <OverviewPanel /> : null}
        {panel === "users" ? <UsersPanel /> : null}
        {panel === "orders" ? <OrdersPanel /> : null}
        {panel === "settings" ? <SettingsPanel /> : null}
        {panel === "products" ? (
          <section className="grid gap-3">
            <h1 className="text-2xl font-bold">商品管理</h1>
            <div className="grid gap-2">
              {products.map((product) => (
                <button key={product.id} className="row-between text-left" type="button" onClick={() => edit(product)}>
                  <span>{product.published ? product.title : `${product.title}（已下架）`}</span>
                  <span className="text-sm text-[var(--muted)]">{(product.priceCents / 100).toFixed(2)}</span>
                </button>
              ))}
            </div>
            <form className="grid gap-3" onSubmit={saveProduct}>
              <button className="btn-ghost w-fit" type="button" onClick={() => { setDraft(emptyProduct()); setPreviousId(""); setImages([]); }}>
                新建商品
              </button>
              <label className="grid gap-1 text-sm">名称<input className="field" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
              <label className="grid gap-1 text-sm">标识 slug<input className="field" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></label>
              <label className="grid gap-1 text-sm">
                分类
                <select className="field" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as MallProduct["category"] })}>
                  <option value="chatgpt">ChatGPT</option>
                  <option value="grok">Grok</option>
                  <option value="claude">Claude</option>
                  <option value="codex">Codex</option>
                  <option value="other">其他</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">价格（分）<input className="field" inputMode="numeric" value={draft.priceCents} onChange={(event) => setDraft({ ...draft, priceCents: Number(event.target.value) })} /></label>
              <label className="grid gap-1 text-sm">库存<input className="field" inputMode="numeric" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} /></label>
              <label className="grid gap-1 text-sm">
                状态
                <select className="field" value={draft.badge} onChange={(event) => setDraft({ ...draft, badge: event.target.value as MallProduct["badge"] })}>
                  <option value="in_stock">现货</option>
                  <option value="low">库存紧张</option>
                  <option value="restocking">补货中</option>
                  <option value="soon">即将上架</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">简介<textarea className="field" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label>
              <label className="grid gap-1 text-sm">详情<textarea className="field" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
              <ProductImages images={images} onChange={setImages} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />
                在商店展示
              </label>
              <button className="btn-primary w-fit" type="submit">保存商品</button>
            </form>
          </section>
        ) : null}
        {panel === "content" && content ? (
          <form className="grid gap-3" onSubmit={saveContent}>
            <h1 className="text-2xl font-bold">页面/内容管理</h1>
            <label className="grid gap-1 text-sm">顶栏公告<input className="field" value={content.banner} onChange={(event) => setContent({ ...content, banner: event.target.value })} /></label>
            <label className="grid gap-1 text-sm">首页标题<input className="field" value={content.heroTitle} onChange={(event) => setContent({ ...content, heroTitle: event.target.value })} /></label>
            <label className="grid gap-1 text-sm">首页说明<textarea className="field" value={content.heroBody} onChange={(event) => setContent({ ...content, heroBody: event.target.value })} /></label>
            <label className="grid gap-1 text-sm">侧栏介绍<textarea className="field" value={content.brandBlurb} onChange={(event) => setContent({ ...content, brandBlurb: event.target.value })} /></label>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(content.nav) as Array<keyof SiteContentNav>).map((key) => (
                <label key={key} className="grid gap-1 text-sm">
                  导航 {key}
                  <input className="field" value={content.nav[key]} onChange={(event) => setContent({ ...content, nav: { ...content.nav, [key]: event.target.value } })} />
                </label>
              ))}
            </div>
            <label className="grid gap-1 text-sm">页脚版权<input className="field" value={content.footer.copyright} onChange={(event) => setContent({ ...content, footer: { ...content.footer, copyright: event.target.value } })} /></label>
            <label className="grid gap-1 text-sm">页脚说明<input className="field" value={content.footer.line} onChange={(event) => setContent({ ...content, footer: { ...content.footer, line: event.target.value } })} /></label>
            <label className="grid gap-1 text-sm">售后标题<input className="field" value={content.support.title} onChange={(event) => setContent({ ...content, support: { ...content.support, title: event.target.value } })} /></label>
            <label className="grid gap-1 text-sm">售后正文<textarea className="field" value={content.support.body} onChange={(event) => setContent({ ...content, support: { ...content.support, body: event.target.value } })} /></label>
            <label className="grid gap-1 text-sm">售后邮箱<input className="field" value={content.support.email} onChange={(event) => setContent({ ...content, support: { ...content.support, email: event.target.value } })} /></label>
            <label className="grid gap-1 text-sm">售后时间<input className="field" value={content.support.hours} onChange={(event) => setContent({ ...content, support: { ...content.support, hours: event.target.value } })} /></label>
            <button className="btn-primary w-fit" type="submit">保存内容</button>
          </form>
        ) : null}
        {panel === "service" && content ? (
          <form className="grid gap-3" onSubmit={saveContent}>
            <h1 className="text-2xl font-bold">客服配置</h1>
            <p className="lede text-sm">这些字段会显示在顾客端的客服浮窗和售后页邮箱。保存后立即写入文案档案。</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={content.service.enabled} onChange={(event) => setContent({ ...content, service: { ...content.service, enabled: event.target.checked } })} />
              显示客服入口
            </label>
            <label className="grid gap-1 text-sm">客服标题<input className="field" value={content.service.title} onChange={(event) => setContent({ ...content, service: { ...content.service, title: event.target.value } })} /></label>
            <label className="grid gap-1 text-sm">客服说明<textarea className="field" value={content.service.text} onChange={(event) => setContent({ ...content, service: { ...content.service, text: event.target.value } })} /></label>
            <label className="grid gap-1 text-sm">微信二维码 URL<input className="field" value={content.service.wechatQr} onChange={(event) => setContent({ ...content, service: { ...content.service, wechatQr: event.target.value } })} /></label>
            <label className="grid gap-1 text-sm">QQ<input className="field" value={content.service.qq} onChange={(event) => setContent({ ...content, service: { ...content.service, qq: event.target.value } })} /></label>
            <label className="grid gap-1 text-sm">客服链接<input className="field" value={content.service.link} onChange={(event) => setContent({ ...content, service: { ...content.service, link: event.target.value } })} /></label>
            <label className="grid gap-1 text-sm">链接文字<input className="field" value={content.service.linkLabel} onChange={(event) => setContent({ ...content, service: { ...content.service, linkLabel: event.target.value } })} /></label>
            <button className="btn-primary w-fit" type="submit">保存客服配置</button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
