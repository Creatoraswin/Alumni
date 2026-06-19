"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Edit, Save, Trash2, Plus, Loader2 } from "lucide-react";
import { fetchAcademicInfo, addAcademicInfo, updateAcademicInfo, deleteAcademicInfo, AcademicInfo } from "@/services/apiService";

const AcademicManagementTab = () => {
  const [academicData, setAcademicData] = useState<AcademicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicInfo | null>(null);
  const [formData, setFormData] = useState<AcademicInfo>({ school: "", department: "", programme: "" });

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAcademicInfo();
    setAcademicData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ school: "", department: "", programme: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AcademicInfo) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;
    
    setSaving(true);
    const result = await deleteAcademicInfo(id);
    setSaving(false);
    
    if (result.success !== false) {
      toast({ title: "Success", description: "Mapping deleted." });
      loadData();
    } else {
      toast({ title: "Error", description: "Failed to delete mapping.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!formData.school || !formData.department || !formData.programme) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    let result;
    if (editingItem && editingItem.id) {
      result = await updateAcademicInfo(formData);
    } else {
      result = await addAcademicInfo(formData);
    }
    setSaving(false);

    if (result.success !== false) {
      toast({ title: "Success", description: "Academic info saved successfully." });
      setIsModalOpen(false);
      loadData();
    } else {
      toast({ title: "Error", description: "Failed to save academic info.", variant: "destructive" });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Academic Information</CardTitle>
          <CardDescription>Manage School, Department, and Programme mappings.</CardDescription>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Mapping
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3">School</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Programme</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {academicData.map((item) => (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.school}</td>
                    <td className="px-6 py-4">{item.department}</td>
                    <td className="px-6 py-4">{item.programme}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => item.id && handleDelete(item.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {academicData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No academic mappings found. Click "Add Mapping" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add"} Academic Mapping</DialogTitle>
              <DialogDescription>
                Define a valid combination of School, Department, and Programme.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">School</label>
                <Input 
                  placeholder="e.g. SoET" 
                  value={formData.school} 
                  onChange={(e) => setFormData({...formData, school: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input 
                  placeholder="e.g. CSE" 
                  value={formData.department} 
                  onChange={(e) => setFormData({...formData, department: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Programme</label>
                <Input 
                  placeholder="e.g. B.Tech" 
                  value={formData.programme} 
                  onChange={(e) => setFormData({...formData, programme: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AcademicManagementTab;
