import React, { useState, useEffect, useMemo } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  StudentStrength, fetchStudentStrength, addStudentStrength, 
  updateStudentStrength, deleteStudentStrength, bulkUploadStudentStrength 
} from "@/services/apiService";
import { Edit, Trash2, Upload, Download, Plus } from "lucide-react";
import * as XLSX from "xlsx";

export const StudentStrengthTab = () => {
  const { toast } = useToast();
  const [data, setData] = useState<StudentStrength[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Form State
  const [formData, setFormData] = useState<StudentStrength>({
    registration_no: "",
    name: "",
    batch: "",
    school: "",
    program: "",
    branch: "",
    passout_year: ""
  });

  // Bulk Upload State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [duplicateErrors, setDuplicateErrors] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchStudentStrength();
    setData(result);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.registration_no || !formData.name) {
      toast({ title: "Error", description: "Registration No and Name are required", variant: "destructive" });
      return;
    }

    try {
      if (editingId) {
        const res = await updateStudentStrength(formData);
        if (res.status === "success") {
          toast({ title: "Success", description: "Record updated successfully" });
          setModalOpen(false);
          loadData();
        } else {
          toast({ title: "Error", description: res.message || "Failed to update", variant: "destructive" });
        }
      } else {
        const res = await addStudentStrength(formData);
        if (res.status === "success") {
          toast({ title: "Success", description: "Record added successfully" });
          setModalOpen(false);
          loadData();
        } else {
          toast({ title: "Error", description: res.message || "Failed to add", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await deleteStudentStrength(id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Record deleted successfully" });
        loadData();
      } else {
        toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const downloadSample = () => {
    const wsData = [
      ["Sl.No", "Registration No.", "Name of the Student", "Batch", "School", "Branch", "Program", "passout"],
      [1, "REG12345", "John Doe", "2020-2024", "SoET", "CSE", "B.Tech", 2024]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "students_strength");
    XLSX.writeFile(wb, "Student_Strength_Sample.xlsx");
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast({ title: "Error", description: "Please select an Excel file", variant: "destructive" });
      return;
    }

    setUploading(true);
    setDuplicateErrors([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rawData.length <= 1) {
          toast({ title: "Error", description: "File is empty or missing data rows", variant: "destructive" });
          setUploading(false);
          return;
        }

        const headers = rawData[0].map((h: string) => h ? String(h).trim().toLowerCase() : "");
        
        // Find indexes
        const regIdx = headers.findIndex(h => h.includes("registration"));
        const nameIdx = headers.findIndex(h => h === "name of the student" || h.includes("name"));
        const batchIdx = headers.findIndex(h => h === "batch");
        const schoolIdx = headers.findIndex(h => h === "school");
        const branchIdx = headers.findIndex(h => h === "branch");
        const programIdx = headers.findIndex(h => h === "program");
        const yearIdx = headers.findIndex(h => h.includes("passout") || h.includes("year"));

        if (regIdx === -1 || nameIdx === -1) {
          toast({ title: "Error", description: "Excel must contain Registration No. and Name of the Student columns", variant: "destructive" });
          setUploading(false);
          return;
        }

        const payload: StudentStrength[] = [];
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || !row[regIdx]) continue;
          
          payload.push({
            registration_no: String(row[regIdx] || ""),
            name: String(row[nameIdx] || ""),
            batch: batchIdx !== -1 ? String(row[batchIdx] || "") : "",
            school: schoolIdx !== -1 ? String(row[schoolIdx] || "") : "",
            program: programIdx !== -1 ? String(row[programIdx] || "") : "",
            branch: branchIdx !== -1 ? String(row[branchIdx] || "") : "",
            passout_year: yearIdx !== -1 ? String(row[yearIdx] || "") : "",
          });
        }

        if (payload.length === 0) {
          toast({ title: "Error", description: "No valid rows found to upload", variant: "destructive" });
          setUploading(false);
          return;
        }

        const res = await bulkUploadStudentStrength(payload);
        
        if (res.status === "success") {
          toast({ title: "Success", description: res.message });
          setBulkModalOpen(false);
          loadData();
        } else {
          toast({ title: "Upload Failed", description: res.message, variant: "destructive" });
          if (res.data && Array.isArray(res.data)) {
            setDuplicateErrors(res.data);
          }
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to parse Excel file", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsBinaryString(bulkFile);
  };
  const filteredData = data.filter(d => {
    const matchesSearch = d.registration_no?.toLowerCase().includes(search.toLowerCase()) || 
                          d.name?.toLowerCase().includes(search.toLowerCase());
    const yearStr = d.passout_year ? String(d.passout_year) : "Unknown";
    const matchesTab = activeTab === "all" || yearStr === activeTab;
    return matchesSearch && matchesTab;
  });

  const yearWiseData = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.forEach(item => {
      const year = item.passout_year ? String(item.passout_year) : "Unknown";
      grouped[year] = (grouped[year] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year.localeCompare(a.year)); // Sort descending by year
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Student Strength Management</h2>
        <div className="flex gap-2">
          <Button onClick={() => setBulkModalOpen(true)} variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" /> Bulk Upload
          </Button>
          <Button onClick={() => {
            setFormData({ registration_no: "", name: "", batch: "", school: "", program: "", branch: "", passout_year: "" });
            setEditingId(null);
            setModalOpen(true);
          }} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 mb-4">
          <TabsList className="inline-flex h-auto p-1 flex-wrap gap-1">
            <TabsTrigger value="all">All ({data.length})</TabsTrigger>
            {yearWiseData.map((item) => (
              <TabsTrigger key={item.year} value={item.year}>
                {item.year === "Unknown" ? "Unknown" : item.year} ({item.count})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {["all", ...yearWiseData.map(y => y.year)].map(tabValue => (
          <TabsContent key={tabValue} value={tabValue} className="m-0">
            <div className="bg-white rounded-lg shadow p-4 border">
              <div className="mb-4">
                <Input 
                  placeholder="Search by Registration No or Name..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sl.No</TableHead>
                      <TableHead>Registration No.</TableHead>
                      <TableHead>Name of the Student</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Passout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4">Loading data...</TableCell>
                      </TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4">No records found.</TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.registration_no}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.batch}</TableCell>
                          <TableCell>{item.school}</TableCell>
                          <TableCell>{item.branch}</TableCell>
                          <TableCell>{item.program}</TableCell>
                          <TableCell>{item.passout_year}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setFormData(item);
                              setEditingId(item.id || null);
                              setModalOpen(true);
                            }}>
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id!)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Student" : "Add Student"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Registration No <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.registration_no} 
                onChange={(e) => setFormData({...formData, registration_no: e.target.value})} 
                disabled={!!editingId}
              />
            </div>
            <div className="space-y-2">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Input 
                value={formData.batch || ""} 
                onChange={(e) => setFormData({...formData, batch: e.target.value})} 
                placeholder="e.g. 2020-2024"
              />
            </div>
            <div className="space-y-2">
              <Label>School</Label>
              <Input 
                value={formData.school || ""} 
                onChange={(e) => setFormData({...formData, school: e.target.value})} 
                placeholder="e.g. SoET"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program</Label>
                <Input 
                  value={formData.program || ""} 
                  onChange={(e) => setFormData({...formData, program: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input 
                  value={formData.branch || ""} 
                  onChange={(e) => setFormData({...formData, branch: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Passout Year</Label>
              <Input 
                type="number"
                value={formData.passout_year || ""} 
                onChange={(e) => setFormData({...formData, passout_year: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Upload Students</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">Need the correct format?</p>
              <Button size="sm" variant="outline" onClick={downloadSample} className="flex items-center gap-1">
                <Download className="w-3 h-3" /> Download Sample
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Select Excel File (.xlsx)</Label>
              <Input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={(e) => setBulkFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>

            {duplicateErrors.length > 0 && (
              <div className="bg-red-50 p-3 rounded-md border border-red-200 mt-4 max-h-40 overflow-y-auto">
                <p className="text-sm font-semibold text-red-800 mb-2">Upload Failed! The following Registration Numbers are duplicates:</p>
                <ul className="list-disc pl-5 text-sm text-red-700">
                  {duplicateErrors.map((reg, idx) => (
                    <li key={idx}>{reg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBulkModalOpen(false);
              setDuplicateErrors([]);
            }}>Cancel</Button>
            <Button onClick={handleBulkUpload} disabled={uploading || !bulkFile}>
              {uploading ? "Uploading..." : "Upload Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
