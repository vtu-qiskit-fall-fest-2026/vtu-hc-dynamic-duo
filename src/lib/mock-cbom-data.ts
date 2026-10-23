export interface CbomItem {
  id: string;
  assetName: string;
  service: string;
  repo: string;
  filePath: string;
  lineNumber: number;
  currentAlgorithm: string;
  algorithmType: "Asymmetric" | "Symmetric" | "Hash / Signature" | "Key Exchange";
  keyLength: string;
  riskCategory: "Shor's Vulnerable" | "Grover's Vulnerable" | "Deprecated" | "PQC Compliant";
  recommendedPqc: string;
  pqcStandard: string;
  impactScore: number; // 1-10
  exploitEase: number; // 1-10
  locationType: "TLS Termination" | "JWT Signing" | "Database Encryption" | "SSH Bastion" | "API Authentication" | "Code Signing";
  status: "Exposed" | "Remediation Staged" | "Migrated";
  codeSnippet: string;
  remediationSnippet: string;
  dataShelfLifeYears: number;
}

export const MOCK_CBOM_DATA: CbomItem[] = [
  {
    id: "CBOM-001",
    assetName: "Customer PII Database Column Encryption",
    service: "payments-core",
    repo: "fintech/core-ledger",
    filePath: "src/crypto/db_encryption.go",
    lineNumber: 74,
    currentAlgorithm: "RSA-2048 (PKCS#1 v1.5)",
    algorithmType: "Asymmetric",
    keyLength: "2048-bit",
    riskCategory: "Shor's Vulnerable",
    recommendedPqc: "ML-KEM-768 (Kyber)",
    pqcStandard: "NIST FIPS 203",
    impactScore: 9.8,
    exploitEase: 9.2,
    locationType: "Database Encryption",
    status: "Exposed",
    dataShelfLifeYears: 15,
    codeSnippet: `// Vulnerable RSA-2048 key wrapping
cipherBlock, err := rsa.EncryptPKCS1v15(rand.Reader, pubKeyRSA, masterKey)
if err != nil {
    return nil, fmt.Errorf("failed to wrap master key: %w", err)
}`,
    remediationSnippet: `// Remediated: Hybrid X25519 + ML-KEM-768 (NIST FIPS 203)
encapsulationKey, err := mlkem768.NewEncapsulationKey(pqKeyBytes)
ciphertext, sharedSecret, err := encapsulationKey.Encapsulate(rand.Reader)
// Master key wrapped using AES-256-GCM with sharedSecret`,
  },
  {
    id: "CBOM-002",
    assetName: "API Gateway Edge TLS Termination",
    service: "ingress-proxy",
    repo: "infra/k8s-mesh",
    filePath: "envoy/tls_certificates.yaml",
    lineNumber: 112,
    currentAlgorithm: "ECDHE-RSA-AES128-GCM-SHA256",
    algorithmType: "Key Exchange",
    keyLength: "ECDH P-256 + RSA-2048",
    riskCategory: "Shor's Vulnerable",
    recommendedPqc: "X25519_MLKEM768 Hybrid",
    pqcStandard: "IETF draft-ietf-tls-hybrid-design",
    impactScore: 9.4,
    exploitEase: 9.5,
    locationType: "TLS Termination",
    status: "Exposed",
    dataShelfLifeYears: 10,
    codeSnippet: `tls_certificates:
  - certificate_chain: { filename: "/etc/ssl/certs/rsa2048.crt" }
    private_key: { filename: "/etc/ssl/private/rsa2048.key" }
cipher_suites:
  - ECDHE-RSA-AES128-GCM-SHA256
  - ECDHE-RSA-AES256-GCM-SHA384`,
    remediationSnippet: `tls_certificates:
  - certificate_chain: { filename: "/etc/ssl/certs/hybrid_pqc.crt" }
    private_key: { filename: "/etc/ssl/private/hybrid_pqc.key" }
curves:
  - X25519MLKEM768
  - SecP256r1MLKEM768`,
  },
  {
    id: "CBOM-003",
    assetName: "OAuth 2.0 Access Token Signer",
    service: "auth-identity",
    repo: "services/auth-service",
    filePath: "pkg/jwt/token_issuer.py",
    lineNumber: 89,
    currentAlgorithm: "ECDSA (secp256r1 / SHA-256)",
    algorithmType: "Hash / Signature",
    keyLength: "256-bit EC",
    riskCategory: "Shor's Vulnerable",
    recommendedPqc: "ML-DSA-65 (Dilithium)",
    pqcStandard: "NIST FIPS 204",
    impactScore: 8.9,
    exploitEase: 8.8,
    locationType: "JWT Signing",
    status: "Remediation Staged",
    dataShelfLifeYears: 5,
    codeSnippet: `encoded_jwt = jwt.encode(
    payload,
    private_key_pem,
    algorithm="ES256",
    headers={"kid": "auth-k1-ecdsa"}
)`,
    remediationSnippet: `encoded_jwt = pqc_jwt.encode(
    payload,
    ml_dsa_private_key,
    algorithm="ML-DSA-65",
    headers={"kid": "auth-k2-fips204"}
)`,
  },
  {
    id: "CBOM-004",
    assetName: "Inter-Service mTLS Mesh",
    service: "service-mesh",
    repo: "infra/istio-configs",
    filePath: "istio/peer-authentication.yaml",
    lineNumber: 38,
    currentAlgorithm: "ECDHE-ECDSA-AES256-GCM-SHA384",
    algorithmType: "Key Exchange",
    keyLength: "ECDH P-256",
    riskCategory: "Shor's Vulnerable",
    recommendedPqc: "ML-KEM-1024 Hybrid",
    pqcStandard: "NIST FIPS 203",
    impactScore: 8.2,
    exploitEase: 8.0,
    locationType: "TLS Termination",
    status: "Exposed",
    dataShelfLifeYears: 8,
    codeSnippet: `apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT`,
    remediationSnippet: `apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT
    hybridPqcMode: ENFORCE_MLKEM_768`,
  },
  {
    id: "CBOM-005",
    assetName: "Audit Log Event Signature Verifier",
    service: "compliance-audit",
    repo: "security/audit-logger",
    filePath: "src/verifier/sig_check.rs",
    lineNumber: 142,
    currentAlgorithm: "RSA-4096 / SHA-512",
    algorithmType: "Hash / Signature",
    keyLength: "4096-bit",
    riskCategory: "Shor's Vulnerable",
    recommendedPqc: "SLH-DSA-128 (SPHINCS+)",
    pqcStandard: "NIST FIPS 205",
    impactScore: 7.9,
    exploitEase: 7.4,
    locationType: "Code Signing",
    status: "Exposed",
    dataShelfLifeYears: 20,
    codeSnippet: `let mut verifier = Verifier::new(MessageDigest::sha512(), &rsa_pub_key)?;
verifier.update(&audit_event_bytes)?;
assert!(verifier.verify(&signature)?);`,
    remediationSnippet: `let mut verifier = SlhDsa128Verifier::new(&slh_pub_key)?;
assert!(verifier.verify(&audit_event_bytes, &signature)?);`,
  },
  {
    id: "CBOM-006",
    assetName: "Object Storage S3 Server-Side Key",
    service: "blob-storage",
    repo: "infra/terraform-aws",
    filePath: "modules/s3/kms_keys.tf",
    lineNumber: 55,
    currentAlgorithm: "AES-128-GCM",
    algorithmType: "Symmetric",
    keyLength: "128-bit",
    riskCategory: "Grover's Vulnerable",
    recommendedPqc: "AES-256-GCM (Quantum Double Key)",
    pqcStandard: "NIST SP 800-175B",
    impactScore: 6.2,
    exploitEase: 4.8,
    locationType: "Database Encryption",
    status: "Exposed",
    dataShelfLifeYears: 12,
    codeSnippet: `resource "aws_kms_key" "s3_sse" {
  description             = "AES-128 default encryption key"
  key_usage               = "ENCRYPT_DECRYPT"
  customer_master_key_spec = "SYMMETRIC_DEFAULT"
}`,
    remediationSnippet: `resource "aws_kms_key" "s3_sse" {
  description             = "AES-256 Grover-resistant key"
  key_usage               = "ENCRYPT_DECRYPT"
  customer_master_key_spec = "SYMMETRIC_DEFAULT"
  enable_key_rotation     = true
}`,
  },
  {
    id: "CBOM-007",
    assetName: "Legacy Session Cookie Encryption",
    service: "web-session-mgr",
    repo: "apps/portal-backend",
    filePath: "config/session.php",
    lineNumber: 29,
    currentAlgorithm: "3DES-CBC / SHA-1",
    algorithmType: "Symmetric",
    keyLength: "168-bit",
    riskCategory: "Deprecated",
    recommendedPqc: "AES-256-GCM",
    pqcStandard: "NIST SP 800-131A Rev 2",
    impactScore: 5.5,
    exploitEase: 7.9,
    locationType: "API Authentication",
    status: "Exposed",
    dataShelfLifeYears: 1,
    codeSnippet: `$cipher = "des-ede3-cbc";
$iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));
$ciphertext = openssl_encrypt($session_data, $cipher, $secret_key, 0, $iv);`,
    remediationSnippet: `$cipher = "aes-256-gcm";
$iv = random_bytes(12);
$ciphertext = openssl_encrypt($session_data, $cipher, $pqc_aes256_key, 0, $iv, $tag);`,
  },
  {
    id: "CBOM-008",
    assetName: "SSH Bastion Administrative Keys",
    service: "bastion-infra",
    repo: "infra/ansible-bastion",
    filePath: "roles/sshd/templates/sshd_config.j2",
    lineNumber: 63,
    currentAlgorithm: "ssh-rsa (2048-bit)",
    algorithmType: "Asymmetric",
    keyLength: "2048-bit",
    riskCategory: "Shor's Vulnerable",
    recommendedPqc: "ML-KEM + OpenSSH 9.8s",
    pqcStandard: "OpenSSH sntrup761x25519-sha512 / ML-KEM",
    impactScore: 8.7,
    exploitEase: 8.5,
    locationType: "SSH Bastion",
    status: "Remediation Staged",
    dataShelfLifeYears: 7,
    codeSnippet: `HostKey /etc/ssh/ssh_host_rsa_key
KexAlgorithms diffie-hellman-group-exchange-sha256,ecdh-sha2-nistp256`,
    remediationSnippet: `HostKey /etc/ssh/ssh_host_ed25519_key
KexAlgorithms sntrup761x25519-sha512@openssh.com,mlkem768x25519-sha256@openssh.com`,
  },
  {
    id: "CBOM-009",
    assetName: "SWIFT FinTech Interbank Wire Auth",
    service: "swift-gateway",
    repo: "fintech/swift-connector",
    filePath: "crypto/rma_keys.c",
    lineNumber: 198,
    currentAlgorithm: "RSA-2048 OAEP",
    algorithmType: "Asymmetric",
    keyLength: "2048-bit",
    riskCategory: "Shor's Vulnerable",
    recommendedPqc: "ML-KEM-1024 + Falcon-1024",
    pqcStandard: "NIST FIPS 203 / 204",
    impactScore: 9.9,
    exploitEase: 9.6,
    locationType: "API Authentication",
    status: "Exposed",
    dataShelfLifeYears: 25,
    codeSnippet: `RSA_public_encrypt(payload_len, payload, encrypted_rma, rsa_key, RSA_PKCS1_OAEP_PADDING);`,
    remediationSnippet: `OQS_KEM_ml_kem_1024_encaps(ciphertext, shared_key, pqc_public_key);`,
  },
  {
    id: "CBOM-010",
    assetName: "Zero-Trust Device Certificate Authority",
    service: "pki-core",
    repo: "security/vault-ca",
    filePath: "vault/pki_engine.hcl",
    lineNumber: 41,
    currentAlgorithm: "ECDSA (P-384 / SHA-384)",
    algorithmType: "Hash / Signature",
    keyLength: "384-bit EC",
    riskCategory: "Shor's Vulnerable",
    recommendedPqc: "ML-DSA-87 (Dilithium)",
    pqcStandard: "NIST FIPS 204",
    impactScore: 9.1,
    exploitEase: 8.1,
    locationType: "Code Signing",
    status: "Exposed",
    dataShelfLifeYears: 15,
    codeSnippet: `path "pki_device_ca/root/generate/internal" {
  parameters {
    key_type = "ec"
    key_bits = 384
  }
}`,
    remediationSnippet: `path "pki_device_ca/root/generate/internal" {
  parameters {
    key_type = "pqc-mldsa"
    security_level = 5
  }
}`,
  },
  {
    id: "CBOM-011",
    assetName: "Quantum-Safe Payment Tokenizer",
    service: "payments-core",
    repo: "fintech/core-ledger",
    filePath: "src/pqc/hybrid_kem.go",
    lineNumber: 15,
    currentAlgorithm: "ML-KEM-768 + X25519",
    algorithmType: "Key Exchange",
    keyLength: "Hybrid 768-bit Lattice",
    riskCategory: "PQC Compliant",
    recommendedPqc: "NIST FIPS 203 Certified",
    pqcStandard: "NIST FIPS 203",
    impactScore: 2.1,
    exploitEase: 1.2,
    locationType: "TLS Termination",
    status: "Migrated",
    dataShelfLifeYears: 30,
    codeSnippet: `// Hybrid Post-Quantum Key Encapsulation Mechanism
sharedSecret, err := oqs.HybridKEM(x25519Shared, mlkemShared)`,
    remediationSnippet: `// Already PQC Compliant with NIST FIPS 203`,
  },
  {
    id: "CBOM-012",
    assetName: "Firmware Secure Boot Signature",
    service: "edge-iot",
    repo: "firmware/bootloader",
    filePath: "boot/auth_stage1.c",
    lineNumber: 88,
    currentAlgorithm: "RSA-3072 / SHA-256",
    algorithmType: "Hash / Signature",
    keyLength: "3072-bit",
    riskCategory: "Shor's Vulnerable",
    recommendedPqc: "SLH-DSA-SHA2-128f",
    pqcStandard: "NIST FIPS 205",
    impactScore: 9.0,
    exploitEase: 7.7,
    locationType: "Code Signing",
    status: "Exposed",
    dataShelfLifeYears: 18,
    codeSnippet: `int rc = mbedtls_rsa_pkcs1_verify(&rsa_ctx, MBEDTLS_MD_SHA256, hash, sig);`,
    remediationSnippet: `int rc = oqs_sig_slh_dsa_sha2_128f_verify(hash, hash_len, sig, sig_len, pqc_boot_pubkey);`,
  }
];

export const CBOM_SUMMARY_STATS = {
  totalAssets: 4821,
  shorVulnerable: 142,
  groverVulnerable: 89,
  deprecatedWeak: 24,
  pqcCompliant: 41,
  percentMigrated: 18.4,
  averageShelfLife: 15.2,
  timeToCrqc: 7.0, // Years to Cryptanalytically Relevant Quantum Computer
  exposureYears: 11.2, // (15.2 + 3.0 migration) - 7.0 = 11.2 yrs danger
};
