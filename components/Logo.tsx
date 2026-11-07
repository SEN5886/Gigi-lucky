import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="brand" aria-label="Gigi Ai 首页">
      <span className="brand-mark" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1.5l1.7 4.8L15.5 8l-4.8 1.7L9 14.5 7.3 9.7 2.5 8l4.8-1.7L9 1.5z" fill="white" />
        </svg>
      </span>
      <span className="brand-name">
        Gigi<span className="brand-ai">Ai</span>
      </span>
    </Link>
  );
}
