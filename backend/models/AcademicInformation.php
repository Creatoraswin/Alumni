<?php

class AcademicInformation {
    private $conn;
    private $table_name = "academic_information";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT id, school, department, programme FROM " . $this->table_name . " ORDER BY school, department, programme";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($school, $department, $programme) {
        $query = "INSERT INTO " . $this->table_name . " (school, department, programme) VALUES (:school, :department, :programme)";
        $stmt = $this->conn->prepare($query);
        
        $school = htmlspecialchars(strip_tags($school));
        $department = htmlspecialchars(strip_tags($department));
        $programme = htmlspecialchars(strip_tags($programme));

        $stmt->bindParam(":school", $school);
        $stmt->bindParam(":department", $department);
        $stmt->bindParam(":programme", $programme);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function update($id, $school, $department, $programme) {
        $query = "UPDATE " . $this->table_name . " SET school = :school, department = :department, programme = :programme WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $school = htmlspecialchars(strip_tags($school));
        $department = htmlspecialchars(strip_tags($department));
        $programme = htmlspecialchars(strip_tags($programme));
        $id = htmlspecialchars(strip_tags($id));

        $stmt->bindParam(":school", $school);
        $stmt->bindParam(":department", $department);
        $stmt->bindParam(":programme", $programme);
        $stmt->bindParam(":id", $id);

        return $stmt->execute();
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        $id = htmlspecialchars(strip_tags($id));
        $stmt->bindParam(":id", $id);
        
        return $stmt->execute();
    }
}
