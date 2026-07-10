<?php
/**
 * JWT Handler Utility Class
 * 
 * Simple JSON Web Token encode/decode implementation
 */

class JwtHandler {
    private $secret;

    public function __construct($secret) {
        $this->secret = $secret;
    }

    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64url_decode($data) {
        $b64 = strtr($data, '-_', '+/');
        $pad = strlen($b64) % 4;
        if ($pad) {
            $b64 .= str_repeat('=', 4 - $pad);
        }
        return base64_decode($b64);
    }

    public function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payloadEncoded = json_encode($payload);
        
        $base64UrlHeader = $this->base64url_encode($header);
        $base64UrlPayload = $this->base64url_encode($payloadEncoded);
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret, true);
        $base64UrlSignature = $this->base64url_encode($signature);
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public function decode($jwt) {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return false;
        }

        list($header64, $payload64, $signature64) = $parts;
        
        $signature = $this->base64url_decode($signature64);
        $expectedSignature = hash_hmac('sha256', $header64 . "." . $payload64, $this->secret, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }
        
        $payload = json_decode($this->base64url_decode($payload64), true);
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }
}
