import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import { UserRoleTable } from './_components/UserRoleTable';

export const AdminDashboardPage = () => {
  return (
    <PageShell>
      <SectionHeader
        title="Bảng điều khiển Quản trị viên"
        description="Hệ thống phân quyền và quản lý nền tảng."
      />

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
