"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="panel mx-auto max-w-2xl">
      <div className="panel-body">
        <h1 className="display text-3xl">页面没有载入完成</h1>
        <p className="lede mt-3">请再试一次。不必因此重复提交卡密。</p>
        <button className="gold-button mt-6" type="button" onClick={reset}>
          再试一次
        </button>
      </div>
    </section>
  );
}
