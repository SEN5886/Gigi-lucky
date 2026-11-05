"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="card card-pad mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">页面没有载入完成</h1>
      <p className="lede mt-2">请再试一次。这一次失败不必重复提交卡密。</p>
      <button className="btn-primary mt-5" type="button" onClick={reset}>
        再试一次
      </button>
    </section>
  );
}
