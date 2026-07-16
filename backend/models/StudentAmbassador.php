<?php

class StudentAmbassador {
    private $conn;
    private $table = 'student_ambassadors';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll(): array {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} ORDER BY sort_order ASC, id ASC"
        );
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $id): ?array {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = :id LIMIT 1");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function create(array $data): int|false {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table}
             (photo_url, name, school, department, phone, linkedin_id, instagram_id, sort_order)
             VALUES
             (:photo_url, :name, :school, :department, :phone, :linkedin_id, :instagram_id, :sort_order)"
        );
        $stmt->bindParam(':photo_url',    $data['photo_url']);
        $stmt->bindParam(':name',         $data['name']);
        $stmt->bindParam(':school',       $data['school']);
        $stmt->bindParam(':department',   $data['department']);
        $stmt->bindParam(':phone',        $data['phone']);
        $stmt->bindParam(':linkedin_id',  $data['linkedin_id']);
        $stmt->bindParam(':instagram_id', $data['instagram_id']);
        $stmt->bindParam(':sort_order',   $data['sort_order'], PDO::PARAM_INT);

        if ($stmt->execute()) {
            return (int)$this->conn->lastInsertId();
        }
        return false;
    }

    public function update(int $id, array $data): bool {
        $allowed = ['photo_url','name','school','department','phone','linkedin_id','instagram_id','sort_order'];
        $sets = [];
        foreach ($data as $key => $val) {
            if (in_array($key, $allowed)) {
                $sets[] = "`{$key}` = :{$key}";
            }
        }
        if (empty($sets)) return false;

        $sql = "UPDATE {$this->table} SET " . implode(', ', $sets) . " WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        foreach ($data as $key => $val) {
            if (in_array($key, $allowed)) {
                $stmt->bindValue(":{$key}", $val);
            }
        }
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete(int $id): bool {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
