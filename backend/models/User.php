<?php
/**
 * User Model
 * Handles user authentication and management
 */

require_once __DIR__ . '/../config/database.php';

class User
{
    private $conn;
    private $table = 'users';

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function authenticate($username, $password)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE username = :username LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            return $user;
        }
        return null;
    }

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table . " SET
            username = :username,
            password_hash = :password_hash,
            role = :role,
            email = :email";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $data['username']);
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt->bindParam(':password_hash', $passwordHash);
        $role = $data['role'] ?? 'student';
        $stmt->bindParam(':role', $role);
        $stmt->bindParam(':email', $data['email']);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function getByUsername($username)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE username = :username LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        $user = $stmt->fetch();

        if ($user) {
            unset($user['password_hash']);
            return $user;
        }
        return null;
    }

    public function updatePassword($username, $newPassword)
    {
        $query = "UPDATE " . $this->table . " SET password_hash = :password_hash WHERE username = :username";
        $stmt = $this->conn->prepare($query);
        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt->bindParam(':password_hash', $passwordHash);
        $stmt->bindParam(':username', $username);
        return $stmt->execute();
    }
}
