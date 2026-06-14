"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { adminAPI } from "@/lib/api/admin"
import {
  Shield,
  Users,
  Settings as SettingsIcon,
  Lock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Plus,
  Eye,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RoleLevel = 1 | 2 | 3  // 1=super_admin, 2=admin, 3=limited_admin

interface AdminUser {
  id: string
  email: string
  full_name: string
  role_level: RoleLevel
  permissions: Record<string, boolean>
  created_at: string
  last_action_at?: string
  avatar_url?: string
}

interface Permission {
  id: string
  name: string
  description: string
  category: "users" | "verification" | "payments" | "settings" | "reports" | "security"
}

// ============================================================================
// ROLE PERMISSIONS MATRIX (1=super_admin, 2=admin, 3=limited_admin)
// ============================================================================

const rolePermissionsMatrix: Record<RoleLevel, Permission[]> = {
  1: [  // Super Admin
    { id: "crud_admins", name: "CRUD Admins", description: "Create, Read, Update, Delete admin users", category: "users" },
    { id: "crud_tenants", name: "CRUD Tenants", description: "Full management of tenant accounts", category: "users" },
    { id: "crud_landlords", name: "CRUD Landlords", description: "Full management of landlord accounts", category: "users" },
    { id: "approve_landlords", name: "Approve/Reject Landlords", description: "Approve or reject landlord 4Ps verification", category: "verification" },
    { id: "approve_payments", name: "Payment Approvals", description: "Approve disputed payments", category: "payments" },
    { id: "edit_system_settings", name: "Edit System Settings", description: "Modify email templates, notifications", category: "settings" },
    { id: "view_audit_logs", name: "View Audit Logs", description: "Access complete audit trail", category: "security" },
    { id: "view_analytics", name: "View Analytics", description: "Access all reports and analytics", category: "reports" },
  ],
  2: [  // Admin
    { id: "read_tenants", name: "View Tenants", description: "View tenant accounts", category: "users" },
    { id: "update_tenants", name: "Update Tenants", description: "Update tenant information", category: "users" },
    { id: "read_landlords", name: "View Landlords", description: "View landlord accounts", category: "users" },
    { id: "update_landlords", name: "Update Landlords", description: "Update landlord information", category: "users" },
    { id: "create_landlords", name: "Create Landlords", description: "Create new landlord accounts", category: "users" },
    { id: "approve_landlords", name: "Approve/Reject Landlords", description: "Approve or reject landlord 4Ps verification", category: "verification" },
    { id: "approve_payments", name: "Payment Approvals", description: "Approve disputed payments", category: "payments" },
    { id: "view_audit_logs", name: "View Audit Logs", description: "View filtered audit logs", category: "security" },
    { id: "view_analytics", name: "View Analytics", description: "View analytics reports", category: "reports" },
  ],
  3: [  // Limited Admin
    { id: "read_tenants", name: "View Tenants", description: "View tenant accounts (read-only)", category: "users" },
    { id: "read_landlords", name: "View Landlords", description: "View landlord accounts (read-only)", category: "users" },
    { id: "approve_landlords", name: "Approve/Reject Landlords", description: "Verify and approve landlord applications", category: "verification" },
    { id: "view_audit_logs", name: "View Audit Logs", description: "View limited audit logs", category: "security" },
  ],
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getRoleLabel = (roleLevel: RoleLevel): string => {
  switch (roleLevel) {
    case 1: return "Super Admin"
    case 2: return "Admin"
    case 3: return "Limited Admin"
  }
}

const getRoleBadgeColor = (roleLevel: RoleLevel) => {
  switch (roleLevel) {
    case 1: return "bg-red-100 text-red-800 border-red-300"
    case 2: return "bg-blue-100 text-blue-800 border-blue-300"
    case 3: return "bg-orange-100 text-orange-800 border-orange-300"
  }
}

const getRoleDescription = (roleLevel: RoleLevel) => {
  switch (roleLevel) {
    case 1: return "Full system access - CRUD operations on all resources"
    case 2: return "Create, Read, Update operations - Cannot delete or manage other admins"
    case 3: return "Limited to verification approvals and view-only access"
  }
}

const canManagePermission = (currentRoleLevel: RoleLevel, targetPermission: string): boolean => {
  if (currentRoleLevel === 1) return true  // Super admin can manage all
  if (currentRoleLevel === 2 && targetPermission !== "crud_admins") return true  // Admin can manage non-admin permissions
  if (currentRoleLevel === 3) return false  // Limited admin can't manage anything
  return false
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface AdminPermissionsProps {
  role: RoleLevel
  currentRoleLevel: RoleLevel
}

const AdminPermissions = ({ role, currentRoleLevel }: AdminPermissionsProps) => {
  const permissions = rolePermissionsMatrix[role]
  const categoryGroups = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(categoryGroups).map(([category, perms]) => (
          <Card key={category} className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm capitalize flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {category === "users" ? "User Management" :
                 category === "verification" ? "Verification" :
                 category === "payments" ? "Payments" :
                 category === "settings" ? "Settings" :
                 category === "reports" ? "Reports" :
                 "Security"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {perms.map((perm) => (
                  <li key={perm.id} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{perm.name}</p>
                      <p className="text-xs text-slate-500">{perm.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface AdminListItemProps {
  admin: AdminUser
  currentRoleLevel: RoleLevel
  onEdit: (admin: AdminUser) => void
  onDelete: (admin: AdminUser) => void
}

const AdminListItem = ({ admin, currentRoleLevel, onEdit, onDelete }: AdminListItemProps) => {
  const canDelete = currentRoleLevel === 1 && admin.role_level !== 1  // Super admin can delete non-super admins
  const canEdit = currentRoleLevel === 1  // Only super admin can edit

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          {admin.avatar_url && (
            <img src={admin.avatar_url} alt={admin.full_name} className="h-8 w-8 rounded-full" />
          )}
          <h3 className="font-semibold text-slate-900">{admin.full_name || "Unknown"}</h3>
          <Badge className={getRoleBadgeColor(admin.role_level)}>
            {getRoleLabel(admin.role_level)}
          </Badge>
        </div>
        <p className="text-sm text-slate-600">{admin.email}</p>
        <p className="text-xs text-slate-500">
          Joined {new Date(admin.created_at).toLocaleDateString()} 
          {admin.last_action_at && ` • Last action: ${new Date(admin.last_action_at).toLocaleDateString()}`}
        </p>
      </div>
      <div className="flex gap-2">
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(admin)}
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        )}
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(admin)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
        {!canEdit && !canDelete && (
          <Button variant="ghost" size="sm" disabled>
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AdminSettingsPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [currentRoleLevel, setCurrentRoleLevel] = useState<RoleLevel>(2)  // Default to admin
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true)
  const [admins, setAdmins] = useState<AdminUser[]>([])

  // Fetch real admin data from API using admin module
  const fetchAdmins = async () => {
    try {
      setIsLoadingAdmins(true)
      const data = await adminAPI.getAdminAccounts(50, 0)
      setAdmins(data.admins || [])
      
      // Extract current user's role_level from the admin list
      if (user && data.admins) {
        const currentAdmin = data.admins.find((admin: AdminUser) => admin.id === user.id)
        if (currentAdmin && currentAdmin.role_level) {
          setCurrentRoleLevel(currentAdmin.role_level as RoleLevel)
          console.log(`🔐 [ADMIN SETTINGS] Set role_level from admin accounts: ${currentAdmin.role_level}`)
        }
      }
    } catch (error: any) {
      console.error('Error fetching admins:', error)
      toast.error('Failed to load admin accounts')
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  // Check if current user is super admin
  const canManageAdmins = currentRoleLevel === 1

  useEffect(() => {
    // Determine current user's role level from userProfile
    if (user && userProfile && 'role_level' in userProfile) {
      const admin = userProfile as any
      const roleLevel = admin.role_level as RoleLevel
      if (roleLevel && [1, 2, 3].includes(roleLevel)) {
        setCurrentRoleLevel(roleLevel)
        console.log(`🔐 [ADMIN SETTINGS] User role level: ${roleLevel}`)
      }
    }
  }, [user, userProfile])

  // Fetch admins on mount
  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleEdit = async (admin: AdminUser) => {
    if (!canManageAdmins) {
      toast.error("Only Super Admins can manage admin roles")
      return
    }

    const newRoleLevel = prompt(
      `Change role for ${admin.full_name}?\n\n1 = Super Admin\n2 = Admin\n3 = Limited Admin\n\nEnter new role level (1-3):`,
      String(admin.role_level)
    )

    if (!newRoleLevel) return

    const roleLevel = parseInt(newRoleLevel) as 1 | 2 | 3
    if (![1, 2, 3].includes(roleLevel)) {
      toast.error("Invalid role level. Must be 1, 2, or 3")
      return
    }

    try {
      await adminAPI.updateAdminRole(admin.id, roleLevel)
      toast.success(`Updated ${admin.full_name} to ${getRoleLabel(roleLevel)}`)
      fetchAdmins() // Refresh the list
    } catch (error: any) {
      console.error('Error updating admin role:', error)
      toast.error(error.response?.data?.detail || 'Failed to update admin role')
    }
  }

  const handleDelete = async (admin: AdminUser) => {
    if (!canManageAdmins) {
      toast.error("Only Super Admins can delete admin accounts")
      return
    }
    if (admin.role_level === 1) {
      toast.error("Cannot delete a Super Admin account")
      return
    }
    if (confirm(`Are you sure you want to delete ${admin.full_name}?`)) {
      try {
        await adminAPI.deleteAdmin(admin.id)
        toast.success(`${admin.full_name} deleted`)
        fetchAdmins() // Refresh the list
      } catch (error: any) {
        console.error('Error deleting admin:', error)
        toast.error(error.response?.data?.detail || 'Failed to delete admin account')
      }
    }
  }

  const handleAddAdmin = () => {
    if (!canManageAdmins) {
      toast.error("Only Super Admins can create new admin accounts")
      return
    }
    // TODO: Open add admin modal
    toast.info("Add new admin modal would open here")
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          🔐 Admin Settings
        </h1>
        <p className="text-slate-600">
          Manage admin accounts, roles, and permissions
        </p>
      </div>

      {/* Current Role Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Your Role:</strong> {getRoleLabel(currentRoleLevel)} — {getRoleDescription(currentRoleLevel)}
        </AlertDescription>
      </Alert>

      {/* Role Permissions Reference */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-orange-600" />
            Admin Role Levels
          </CardTitle>
          <CardDescription>
            Understand permissions for each admin role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1" className="gap-2">
                <Lock className="h-4 w-4" />
                Super Admin
              </TabsTrigger>
              <TabsTrigger value="2" className="gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="3" className="gap-2">
                <Eye className="h-4 w-4" />
                Limited Admin
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="1">
                <AdminPermissions role={1} currentRoleLevel={currentRoleLevel} />
              </TabsContent>
              <TabsContent value="2">
                <AdminPermissions role={2} currentRoleLevel={currentRoleLevel} />
              </TabsContent>
              <TabsContent value="3">
                <AdminPermissions role={3} currentRoleLevel={currentRoleLevel} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Admin Accounts Management */}
      {canManageAdmins && (
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Admin Accounts
                </CardTitle>
                <CardDescription>
                  Manage admin users and their roles
                </CardDescription>
              </div>
              <Button onClick={handleAddAdmin} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Admin
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingAdmins ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No admin accounts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <AdminListItem
                    key={admin.id}
                    admin={admin}
                    currentRoleLevel={currentRoleLevel}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Permission Denied Message */}
      {!canManageAdmins && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Admin Management Restricted:</strong> Only Super Admins can create, edit, or delete admin accounts. Contact your Super Admin for account changes.
          </AlertDescription>
        </Alert>
      )}

      {/* System Logs (available to admin and above) */}
      {currentRoleLevel <= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Security & Audit Logs
            </CardTitle>
            <CardDescription>
              Recent admin actions and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <p>Audit logs functionality coming soon...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
