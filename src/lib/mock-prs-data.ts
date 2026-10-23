export interface MitigationPR {
  id: string;
  prNumber: number;
  title: string;
  repo: string;
  branch: string;
  author: string;
  avatar: string;
  targetService: string;
  vulnerableCipher: string;
  migratedCipher: string;
  status: "Open" | "Merged" | "Validating" | "Requires Review";
  riskImpact: "Critical" | "High" | "Medium";
  ciStatus: "Passing" | "Running" | "Failed";
  nistCompliance: "FIPS 203" | "FIPS 204" | "FIPS 205" | "SP 800-175B";
  createdAt: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  diffSummary: string;
  unifiedDiff: string;
}

export const INITIAL_PRS: MitigationPR[] = [
  {
    id: "pr-1042",
    prNumber: 1042,
    title: "feat(pqc): Upgrade ingress TLS 1.3 to hybrid X25519 + ML-KEM-768",
    repo: "infra/k8s-mesh",
    branch: "pqc-migration/ingress-mlkem768",
    author: "q-shield-bot[bot]",
    avatar: "QS",
    targetService: "ingress-proxy",
    vulnerableCipher: "ECDHE-RSA-AES128-GCM-SHA256",
    migratedCipher: "X25519_MLKEM768 (NIST FIPS 203)",
    status: "Open",
    riskImpact: "Critical",
    ciStatus: "Passing",
    nistCompliance: "FIPS 203",
    createdAt: "14 mins ago",
    filesChanged: 3,
    additions: 48,
    deletions: 12,
    diffSummary: "Enables NIST FIPS 203 ML-KEM-768 hybrid key exchange on envoy ingress listeners",
    unifiedDiff: `--- a/envoy/tls_certificates.yaml
+++ b/envoy/tls_certificates.yaml
@@ -112,6 +112,12 @@
 tls_certificates:
-  - certificate_chain: { filename: "/etc/ssl/certs/rsa2048.crt" }
-    private_key: { filename: "/etc/ssl/private/rsa2048.key" }
+  - certificate_chain: { filename: "/etc/ssl/certs/oqs_hybrid.crt" }
+    private_key: { filename: "/etc/ssl/private/oqs_hybrid.key" }
+curves:
+  - X25519MLKEM768
+  - SecP256r1MLKEM768
 cipher_suites:
-  - ECDHE-RSA-AES128-GCM-SHA256
+  - TLS_AES_256_GCM_SHA384
+  - TLS_CHACHA20_POLY1305_SHA256`,
  },
  {
    id: "pr-1039",
    prNumber: 1039,
    title: "refactor(crypto): Migrate JWT signing from ECDSA P-256 to ML-DSA-65",
    repo: "services/auth-service",
    branch: "sec/fips204-mldsa-tokens",
    author: "alex.chen (SecOps)",
    avatar: "AC",
    targetService: "auth-identity",
    vulnerableCipher: "ECDSA (secp256r1)",
    migratedCipher: "ML-DSA-65 (NIST FIPS 204)",
    status: "Validating",
    riskImpact: "Critical",
    ciStatus: "Running",
    nistCompliance: "FIPS 204",
    createdAt: "2 hours ago",
    filesChanged: 4,
    additions: 112,
    deletions: 34,
    diffSummary: "Replaces vulnerable EC signature with lattice-based ML-DSA-65 with backward token validation",
    unifiedDiff: `--- a/pkg/jwt/token_issuer.py
+++ b/pkg/jwt/token_issuer.py
@@ -89,7 +89,14 @@
-    encoded_jwt = jwt.encode(payload, private_key_pem, algorithm="ES256")
+    # NIST FIPS 204 Lattice Signature Migration
+    from oqs import Signature
+    sig = Signature("ML-DSA-65")
+    encoded_jwt = pqc_jwt.encode(
+        payload,
+        sig.export_secret_key(),
+        algorithm="ML-DSA-65",
+        headers={"kid": "pqc-v1-mldsa"}
+    )`,
  },
  {
    id: "pr-1035",
    prNumber: 1035,
    title: "sec(ledger): Wrap DB master key using ML-KEM-768 encapsulation",
    repo: "fintech/core-ledger",
    branch: "feat/mlkem-db-envelope",
    author: "sara.miller (Cryptographer)",
    avatar: "SM",
    targetService: "payments-core",
    vulnerableCipher: "RSA-2048 PKCS#1 v1.5",
    migratedCipher: "ML-KEM-768 + AES-256-GCM",
    status: "Merged",
    riskImpact: "Critical",
    ciStatus: "Passing",
    nistCompliance: "FIPS 203",
    createdAt: "Yesterday",
    filesChanged: 6,
    additions: 184,
    deletions: 59,
    diffSummary: "Remediates RSA-2048 wrapping on financial customer account ledger records",
    unifiedDiff: `--- a/src/crypto/db_encryption.go
+++ b/src/crypto/db_encryption.go
@@ -74,4 +74,10 @@
-cipherBlock, err := rsa.EncryptPKCS1v15(rand.Reader, pubKeyRSA, masterKey)
+kemKey, err := mlkem768.NewEncapsulationKey(pqKeyBytes)
+ciphertext, sharedSecret, err := kemKey.Encapsulate(rand.Reader)
+// Encrypt database record keys with quantum-safe shared secret
+aesGcm, err := cipher.NewGCM(sharedSecret[:32])`,
  },
  {
    id: "pr-1031",
    prNumber: 1031,
    title: "infra(ssh): Enforce OpenSSH 9.8+ sntrup761x25519 hybrid KEX",
    repo: "infra/ansible-bastion",
    branch: "chore/pqc-ssh-bastion",
    author: "devops-lead",
    avatar: "DL",
    targetService: "bastion-infra",
    vulnerableCipher: "diffie-hellman-group-exchange-sha256",
    migratedCipher: "sntrup761x25519-sha512@openssh.com",
    status: "Merged",
    riskImpact: "High",
    ciStatus: "Passing",
    nistCompliance: "FIPS 203",
    createdAt: "3 days ago",
    filesChanged: 2,
    additions: 22,
    deletions: 8,
    diffSummary: "Disables weak DH groups on administrative jump hosts",
    unifiedDiff: `--- a/roles/sshd/templates/sshd_config.j2
+++ b/roles/sshd/templates/sshd_config.j2
@@ -63,2 +63,4 @@
-KexAlgorithms diffie-hellman-group-exchange-sha256,ecdh-sha2-nistp256
+KexAlgorithms sntrup761x25519-sha512@openssh.com,mlkem768x25519-sha256@openssh.com,curve25519-sha256`,
  }
];
