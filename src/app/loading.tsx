export default function Loading() {
  return (
    <main className="space-y-6" aria-label="Loading financial workspace" aria-busy="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-5" style={{ borderColor: "var(--border)" }}>
        <div className="space-y-2 w-full">
          <div className="skeleton-block h-9 w-56 max-w-[78%]" />
          <div className="skeleton-block h-4 w-80 max-w-[92%]" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="skeleton-block h-11 flex-1 sm:w-28" />
          <div className="skeleton-block h-11 flex-1 sm:w-40" />
        </div>
      </div>

      <div className="skeleton-block h-14 w-full rounded-2xl" />
      <div className="skeleton-block h-20 w-full rounded-2xl" />

      <section className="rounded-3xl border p-5 sm:p-7" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            <div className="skeleton-block h-5 w-56" />
            <div className="skeleton-block h-14 w-72 max-w-full" />
            <div className="grid grid-cols-2 gap-4 border-t pt-5" style={{ borderColor: "var(--border)" }}>
              <div className="skeleton-block h-16" />
              <div className="skeleton-block h-16" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="skeleton-block h-20 rounded-2xl" />
            <div className="skeleton-block h-20 rounded-2xl" />
            <div className="skeleton-block h-20 rounded-2xl" />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="skeleton-block h-72 rounded-3xl" />
        <div className="skeleton-block h-72 rounded-3xl" />
      </div>
    </main>
  );
}
