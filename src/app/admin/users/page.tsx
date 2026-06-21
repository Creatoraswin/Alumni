import UsersManagementTab from "@/components/UsersManagementTab";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage system users, credentials, and roles for the dashboard.
          </p>
        </div>
      </div>
      <UsersManagementTab />
    </div>
  );
}
