import { PageHeader, Panel, StatCard } from "@/components/page-header";
import { getAdminData } from "@/lib/app-data";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminPage() {
  await requireAdmin();
  const data = await getAdminData();

  return (
    <>
      <PageHeader
        title="Admin"
        description="Neil-only overview for the private household data layer. Cleanup tools arrive after the core logging flow settles."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Users" value={String(data.userCount)} />
        <StatCard label="Foods" value={String(data.foodCount)} />
        <StatCard label="Data sources" value={String(data.sourceCount)} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Manual Source">
          {data.manualSource ? (
            <div>
              <p className="font-bold text-[var(--brand-ink)]">{data.manualSource.name}</p>
              <p className="mt-1 text-sm text-[var(--brand-muted)]">
                {data.manualSource.attribution}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--brand-muted)]">
              Manual source will be created when foods are seeded or added.
            </p>
          )}
        </Panel>

        <Panel title="Provisional Products">
          {data.provisionalFoods.length === 0 ? (
            <p className="text-sm text-[var(--brand-muted)]">
              No provisional barcode products yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.provisionalFoods.map((food) => (
                <li key={food.id} className="rounded-2xl border border-[var(--brand-line)] p-3">
                  <p className="font-bold text-[var(--brand-ink)]">{food.name}</p>
                  <p className="text-sm text-[var(--brand-muted)]">{food.barcode}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
