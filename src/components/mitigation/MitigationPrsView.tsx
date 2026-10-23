"use client";

import React, { useState } from "react";
import { MitigationPR, INITIAL_PRS } from "@/lib/mock-prs-data";
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  GitMerge,
  Filter,
  Search,
  ExternalLink,
  Code2,
  FileCode,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { PrDiffModal } from "./PrDiffModal";
import { postRemediatePr } from "@/lib/api";

export function MitigationPrsView() {
  const [prs, setPrs] = useState<MitigationPR[]>(INITIAL_PRS);
  const [selectedPr, setSelectedPr] = useState<MitigationPR | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleMergePr = (prId: string) => {
    setPrs((prev) =>
      prev.map((pr) =>
        pr.id === prId ? { ...pr, status: "Merged" as const } : pr
      )
    );
  };

  const handleSynthesizePr = async () => {
    setIsSynthesizing(true);
    const res = await postRemediatePr({
      file_path: "src/crypto/db_encryption.go",
      repo: "fintech/core-ledger",
      target_pqc: "ML-KEM-768",
    });
    setIsSynthesizing(false);

    if (res) {
      const compliance = (
        res.nist_compliance.includes("204")
          ? "FIPS 204"
          : res.nist_compliance.includes("205")
          ? "FIPS 205"
          : "FIPS 203"
      ) as MitigationPR["nistCompliance"];

      const newPr: MitigationPR = {
        id: `pr-${res.pr_number}`,
        prNumber: res.pr_number,
        title: res.title,
        repo: res.repo,
        branch: res.branch,
        author: res.author || "q-shield-bot[bot]",
        avatar: "QS",
        targetService: "payments-core",
        status: "Open",
        riskImpact: "Critical",
        ciStatus: (res.ci_status === "Failed" ? "Failed" : res.ci_status === "Running" ? "Running" : "Passing"),
        createdAt: "Just now",
        vulnerableCipher: res.vulnerable_cipher,
        migratedCipher: res.migrated_cipher,
        nistCompliance: compliance,
        diffSummary: "1 file changed, +24, -8",
        unifiedDiff: res.unified_diff,
        filesChanged: 1,
        additions: 24,
        deletions: 8,
      };
      setPrs((prev) => [newPr, ...prev]);
      setSelectedPr(newPr);
    } else {
      // Local fallback
      const fallbackPr: MitigationPR = {
        id: `pr-${Math.floor(1050 + Math.random() * 50)}`,
        prNumber: Math.floor(1050 + Math.random() * 50),
        title: "feat(pqc): auto-refactor RSA-2048 to ML-KEM-768 hybrid key encapsulation",
        repo: "fintech/core-ledger",
        branch: "pqc-migration/mlkem-auto-patch",
        author: "q-shield-bot[bot]",
        avatar: "QS",
        targetService: "payments-core",
        status: "Open",
        riskImpact: "Critical",
        ciStatus: "Passing",
        createdAt: "Just now",
        vulnerableCipher: "RSA-2048 (PKCS#1 v1.5)",
        migratedCipher: "ML-KEM-768 (Kyber)",
        nistCompliance: "FIPS 203",
        diffSummary: "1 file changed, +28, -6",
        unifiedDiff: `diff --git a/src/crypto/db_encryption.go b/src/crypto/db_encryption.go
@@ -74,7 +74,13 @@ func WrapMasterKey() error {
-	cipherBlock, err := rsa.EncryptPKCS1v15(rand.Reader, pubKeyRSA, masterKey)
-	if err != nil { return nil, err }
+	// NIST FIPS 203 Post-Quantum ML-KEM-768 Envelope
+	encapsulationKey, err := mlkem768.NewEncapsulationKey(pqcPubKey)
+	ciphertext, sharedSecret, err := encapsulationKey.Encapsulate(rand.Reader)
+	cipherBlock := aesGCMWrap(sharedSecret, masterKey)`,
        filesChanged: 1,
        additions: 28,
        deletions: 6,
      };
      setPrs((prev) => [fallbackPr, ...prev]);
      setSelectedPr(fallbackPr);
    }
  };

  const filteredPrs = prs.filter((pr) => {
    const matchesSearch =
      pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.repo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.vulnerableCipher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.migratedCipher.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || pr.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openCount = prs.filter((p) => p.status === "Open" || p.status === "Validating").length;
  const mergedCount = prs.filter((p) => p.status === "Merged").length;

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Zero-Code Mitigation: Cryptographic Pull Requests
            </h2>
            <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 font-semibold">
              AST Auto-Refactor Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated pull requests synthesizing NIST FIPS 203/204/205 quantum-resistant
            ciphers into target application repositories.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            {openCount} Open &bull; {mergedCount} Merged
          </span>
          <button
            onClick={handleSynthesizePr}
            disabled={isSynthesizing}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {isSynthesizing ? "Synthesizing AST Patch..." : "Synthesize New PQC PR"}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pull request, repo, or cipher..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Validating">Validating in CI</option>
            <option value="Merged">Merged</option>
          </select>
        </div>
      </div>

      {/* PRs List */}
      <div className="space-y-2.5">
        {filteredPrs.map((pr) => (
          <div
            key={pr.id}
            onClick={() => setSelectedPr(pr)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition shadow-2xs group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded shrink-0 mt-0.5 ${
                    pr.status === "Merged"
                      ? "bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300"
                      : "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  {pr.status === "Merged" ? (
                    <GitMerge className="w-4 h-4" />
                  ) : (
                    <GitPullRequest className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      #{pr.prNumber}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {pr.repo}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        pr.status === "Merged"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : pr.status === "Validating"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {pr.status}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {pr.nistCompliance}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {pr.title}
                  </h3>

                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
                    <span className="text-red-600 dark:text-red-400">
                      Vulnerable: {pr.vulnerableCipher}
                    </span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Target: {pr.migratedCipher}
                    </span>
                    <span className="text-slate-400">
                      Branch: {pr.branch}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side stats & button */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-emerald-600">+{pr.additions}</span>
                  <span className="text-red-600">-{pr.deletions}</span>
                  <span className="text-slate-400">({pr.filesChanged} files)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPr(pr);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 transition"
                >
                  Review Diff
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PR Diff Modal */}
      <PrDiffModal
        pr={selectedPr}
        onClose={() => setSelectedPr(null)}
        onMerge={handleMergePr}
      />
    </div>
  );
}
