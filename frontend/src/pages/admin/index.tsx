import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { UserRoleTable } from './_components/UserRoleTable';

export const AdminDashboardPage = () => {
  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Bảng điều khiển Quản trị viên</h1>
        <p className="text-muted-foreground mt-1">Hệ thống phân quyền và quản lý nền tảng.</p>
      </div>

      <section>
        <SectionHeader
          title="Quản lý Người dùng"
          description="Kiểm soát và phân quyền người dùng trong hệ thống."
        />
        <UserRoleTable />
      </section>
    </PageShell>
  );
};
