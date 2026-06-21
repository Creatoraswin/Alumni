"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { SystemUser, fetchSystemUsers, addSystemUser, updateSystemUser, deleteSystemUser } from "@/services/apiService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UsersManagementTab() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Delete states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Partial<SystemUser>>({
    username: "",
    password: "",
    role: "department",
    name: "",
    department: "",
    email: ""
  });

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchSystemUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenModal = (user?: SystemUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name || "",
        department: user.department || "",
        email: user.email || "",
        password: "" // Keep empty to not change
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        role: "department",
        name: "",
        department: "",
        email: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!formData.username || !formData.role) {
      toast({ title: "Error", description: "Username and Role are required.", variant: "destructive" });
      return;
    }
    if (!editingUser && !formData.password) {
      toast({ title: "Error", description: "Password is required for new users.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let result;
      if (editingUser) {
        result = await updateSystemUser(formData as SystemUser);
      } else {
        result = await addSystemUser(formData as SystemUser);
      }

      if (result.success !== false) { // Assuming response format
        toast({ title: "Success", description: `User successfully ${editingUser ? 'updated' : 'added'}.` });
        setIsModalOpen(false);
        loadUsers();
      } else {
        toast({ title: "Error", description: result.message || "Failed to save user.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An error occurred while saving the user.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteSystemUser(userToDelete);
      if (result.success !== false) {
        toast({ title: "Deleted", description: "User has been removed." });
        setIsDeleteDialogOpen(false);
        loadUsers();
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete user.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An error occurred while deleting.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
        <CardTitle className="text-2xl font-bold">System Users</CardTitle>
        <Button onClick={() => handleOpenModal()} className="bg-primary text-white">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="flex justify-between mb-4">
          <Input 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <TableRow key={user.username}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{user.department || "-"}</TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(user)} title="Edit">
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setUserToDelete(user.username); setIsDeleteDialogOpen(true); }} title="Delete">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update the details for this user." : "Create a new system user for the dashboard."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Username <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.username} 
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                disabled={!!editingUser} // Usually username shouldn't change
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Password {editingUser ? "(Leave blank to keep unchanged)" : <span className="text-red-500">*</span>}</Label>
              <Input 
                type="password"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.role} 
                onValueChange={(val: any) => setFormData({...formData, role: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cadmin">Central Admin</SelectItem>
                  <SelectItem value="alumni-manager">Alumni Manager</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label>Department / School Name</Label>
              <Input 
                value={formData.department} 
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                placeholder="e.g., CSE or SoET"
              />
            </div>

            <div className="grid gap-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !open && setIsDeleteDialogOpen(false)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{userToDelete}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
