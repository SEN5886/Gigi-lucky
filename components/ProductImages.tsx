"use client";

import { useState } from "react";
import { deleteJson, postForm } from "@/lib/browser";

export function ProductImages({ images, onChange }: { images: string[]; onChange: (next: string[]) => void }) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const current = next[index];
    next[index] = next[target] ?? current;
    next[target] = current;
    onChange(next);
  }

  async function remove(index: number) {
    const target = images[index];
    if (!target) return;
    const next = images.filter((_, item) => item !== index);
    onChange(next);
    if (target.startsWith("/uploads/products/")) {
      await deleteJson("/api/admin/uploads", { url: target }).catch(() => undefined);
    }
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    if (images.length >= 8) {
      setMessage("最多 8 张图片。");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      const payload = await postForm<{ url: string }>("/api/admin/uploads", body);
      onChange([...images, payload.url]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "图片没有上传。");
    } finally {
      setPending(false);
    }
  }

  function addUrl() {
    const next = url.trim();
    if (!next.startsWith("https://") && !next.startsWith("/")) {
      setMessage("外链必须以 https:// 开头，站内图片以 / 开头。");
      return;
    }
    if (images.length >= 8) {
      setMessage("最多 8 张图片。");
      return;
    }
    onChange([...images, next]);
    setUrl("");
    setMessage("");
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">商品图片</p>
      <p className="text-sm text-[var(--muted)]">第一张会显示在列表和详情顶部。可以上传、填写地址、删除或调整顺序。</p>
      {images.length === 0 ? <p className="lede text-sm">还没有图片，商店会显示色块封面。</p> : null}
      <ol className="grid gap-2">
        {images.map((image, index) => (
          <li key={`${image}-${index}`} className="image-row">
            <img src={image} alt="" />
            <span>{index === 0 ? "封面" : `第 ${index + 1} 张`}</span>
            <div className="actions">
              <button type="button" className="btn-ghost" onClick={() => move(index, -1)} disabled={index === 0}>
                上移
              </button>
              <button type="button" className="btn-ghost" onClick={() => move(index, 1)} disabled={index === images.length - 1}>
                下移
              </button>
              <button type="button" className="btn-ghost" onClick={() => void remove(index)}>
                删除
              </button>
            </div>
          </li>
        ))}
      </ol>
      <label className="btn-ghost w-fit">
        {pending ? "上传中" : "上传图片"}
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void upload(file);
          }}
        />
      </label>
      <div className="actions">
        <input className="field" value={url} placeholder="或粘贴 https 图片地址" onChange={(event) => setUrl(event.target.value)} />
        <button className="btn-ghost" type="button" onClick={addUrl}>
          添加地址
        </button>
      </div>
      {message ? <p className="alert">{message}</p> : null}
    </div>
  );
}
