export function CallSlab({ note = "National Cyber Crime Helpline, open 24×7" }: { note?: string }) {
  return (
    <a className="call-slab" href="tel:1930" aria-label="Call 1930, the National Cyber Crime Helpline">
      <span className="num" aria-hidden="true">
        1930
      </span>
      <span className="what">
        <strong>Call now if money has left your account</strong>
        <span>{note}</span>
      </span>
    </a>
  );
}
