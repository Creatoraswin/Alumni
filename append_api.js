
const fs = require("fs");
const file = "src/services/apiService.ts";
let content = fs.readFileSync(file, "utf8");

const appendStr = `
// ==========================================
// Student Strength API Methods
// ==========================================

export interface StudentStrength {
  id?: string;
  registration_no: string;
  name: string;
  batch?: string;
  program?: string;
  branch?: string;
  passout_year?: string | number;
}

export const fetchStudentStrength = async (): Promise<StudentStrength[]> => {
  try {
    const response = await fetch(\`\${API_BASE_URL}/api/student_strength/\`);
    if (!response.ok) throw new Error("Network response was not ok");
    const result = await response.json();
    return result.status === "success" ? result.data : [];
  } catch (error) {
    console.error("Error fetching student strength:", error);
    return [];
  }
};

export const addStudentStrength = async (data: StudentStrength): Promise<{ status: string; message: string; data?: any }> => {
  try {
    const response = await fetch(\`\${API_BASE_URL}/api/student_strength/\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding student strength:", error);
    throw error;
  }
};

export const updateStudentStrength = async (data: StudentStrength): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(\`\${API_BASE_URL}/api/student_strength/\`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating student strength:", error);
    throw error;
  }
};

export const deleteStudentStrength = async (id: string): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(\`\${API_BASE_URL}/api/student_strength/?id=\${id}\`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting student strength:", error);
    throw error;
  }
};

export const bulkUploadStudentStrength = async (data: StudentStrength[]): Promise<{ status: string; message: string; data?: any }> => {
  try {
    const response = await fetch(\`\${API_BASE_URL}/api/student_strength/?action=bulk\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error bulk uploading student strength:", error);
    throw error;
  }
};
`;

fs.appendFileSync(file, appendStr);
console.log("Appended to apiService.ts successfully!");

