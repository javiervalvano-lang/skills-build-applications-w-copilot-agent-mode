import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  empty?: boolean;
  children?: ReactNode;
};

export function CapabilityCard({
  title,
  description,
  loading = false,
  error = null,
  empty = false,
  emptyText,
  children,
}: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading && <p role="status">Loading...</p>}
        {!loading && error && <div role="alert">Unable to load {title.toLowerCase()}. Please try again.</div>}
        {!loading && !error && empty && <p>{emptyText ?? `No ${title.toLowerCase()} available.`}</p>}
        {!loading && !error && !empty && children}
      </div>
    </section>
  );
}
