import { PageHeader, Panel } from "@/components/page-header";
import { requireUser } from "@/lib/auth/session";

export default async function ExportPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        title="Export"
        description="Structured household export is planned for Phase 4. The database model is already shaped so food, body, water, movement, and health logs can be exported cleanly."
      />
      <Panel title="Phase 1 Placeholder">
        <p className="text-sm leading-6 text-slate-600">
          No export file is generated yet. Until this page is completed, local
          PostgreSQL backups can be created with standard `pg_dump` tooling.
        </p>
      </Panel>
    </>
  );
}
