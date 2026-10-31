import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap flow">
      <h1 style={{ fontSize: "var(--step-3)" }}>This page doesn&apos;t exist</h1>
      <p>
        If you&apos;ve lost money, <Link href="/help">start here</Link> and call <a href="tel:1930">1930</a>.
      </p>
    </div>
  );
}
