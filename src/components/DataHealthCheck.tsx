import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Edit, Wand2, Shield } from "lucide-react";
import { Box, Typography } from "@mui/material";
import ColumnMappingModal from "./ColumnMappingModal";
import ManualDataFixModal from "./ManualDataFixModal";
import _ from "lodash";

interface DataHealthCheckProps {
  businessData: any;
  setBusinessData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  canGoNext?: boolean;
}

interface DataIssue {
  type: string;
  severity: "low" | "medium" | "high";
  count: number;
  description: string;
  rowIdxs?: number[];
  colId?: string;
}

// Robust date normalization helper
function normalizeDate(row: any, mappedColumns: Record<string, string>): string {
  let dateStr = "";
  // Combine date+time if both exist
  if (mappedColumns.date && row[mappedColumns.date]) {
    dateStr = String(row[mappedColumns.date]).trim();
    if (mappedColumns.time && row[mappedColumns.time]) {
      dateStr += " " + String(row[mappedColumns.time]).trim();
    }
  } else if (mappedColumns.datetime && row[mappedColumns.datetime]) {
    dateStr = String(row[mappedColumns.datetime]).trim();
  } else if (mappedColumns.timestamp && row[mappedColumns.timestamp]) {
    dateStr = String(row[mappedColumns.timestamp]).trim();
  }

  let d: Date | null = null;
  if (dateStr) {
    // Unix timestamp (10 or 13 digits)
    if (/^\d{10}$/.test(dateStr)) {
      d = new Date(Number(dateStr) * 1000);
    } else if (/^\d{13}$/.test(dateStr)) {
      d = new Date(Number(dateStr));
    } else {
      d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const dateOnly = dateStr.split(" ")[0];
        d = new Date(dateOnly);
      }
    }
  }
  if (!d || isNaN(d.getTime())) return "1970-01-01";
  return d.toISOString().split("T")[0];
}

const requiredFields = [
  { key: "product", label: "Product", example: "Latte", description: "The product or menu item sold" },
  { key: "revenue", label: "Revenue", example: "3.50", description: "Sales amount for the transaction" },
  { key: "date", label: "Date", example: "2024-03-01", description: "Date of sale (YYYY-MM-DD)" }
];

// Add this for optional mapping fields (shown as "optional" in UI)
const optionalFields = [
  { key: "size", label: "Size", example: "M", description: "Size of product, e.g. S, M, L, XL" },
  { key: "datetime", label: "Datetime", example: "2024-03-01 10:15:50", description: "Datetime (YYYY-MM-DD HH:mm:ss)" },
  { key: "timestamp", label: "Timestamp", example: "1720032950", description: "Unix timestamp (seconds or ms)" },
  { key: "time", label: "Time", example: "10:15:50", description: "Time of sale (if separate column)" }
];

const sampleCsv = `Product,Revenue,Date
Latte,3.50,2024-03-01
Americano,2.50,2024-03-01
`;
const sampleCsvUrl = URL.createObjectURL(new Blob([sampleCsv], { type: "text/csv" }));

const DataHealthCheck: React.FC<DataHealthCheckProps> = ({
  businessData,
  setBusinessData,
  onNext,
  onBack,
  canGoBack,
}) => {
  console.log("Mapped columns:", businessData.mappedColumns);
  const [issues, setIssues] = useState<DataIssue[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditTable, setShowEditTable] = useState(false);
  const [showMapping, setShowMapping] = useState(false);

  const headers = businessData.data[0] ? Object.keys(businessData.data[0]) : [];

  // --- HEALTH SCORE LOGIC ---
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 85) return "Good";
    if (score >= 70) return "Fair";
    return "Needs Attention";
  };

  useEffect(() => {
    analyzeData();
    // eslint-disable-next-line
  }, [businessData.data, businessData.mappedColumns]);

  const analyzeData = () => {
    const foundIssues: DataIssue[] = [];
    const { data, mappedColumns } = businessData;

    if (!data.length) return;

    // Only require main fields (product, revenue, date)
    const missingHeaders = requiredFields
      .filter(f => !["datetime", "timestamp", "time"].includes(f.key))
      .map((f) => f.key)
      .filter((col) => !mappedColumns[col]);
    if (missingHeaders.length > 0) {
      foundIssues.push({
        type: "missing_headers",
        severity: "high",
        count: missingHeaders.length,
        description: `Missing important columns: ${missingHeaders.join(", ")}`,
      });
    }

    // Check for missing values & invalid numbers
    let missingValueCount = 0;
    let invalidNumberCount = 0;
    let missingValueRows: number[] = [];
    let invalidNumberRows: number[] = [];
    data.forEach((row: any, idx: number) => {
      Object.entries(mappedColumns).forEach(([key, columnName]) => {
        if (!row[columnName] || row[columnName].toString().trim() === "") {
          missingValueCount++;
          missingValueRows.push(idx);
        }
        // For revenue, check invalid numbers
        if (key === "revenue" && row[columnName]) {
          const clean = row[columnName].toString().replace(/[^0-9.\-]/g, "");
          if (clean === "" || isNaN(Number(clean))) {
            invalidNumberCount++;
            invalidNumberRows.push(idx);
          }
        }
      });
    });

    if (missingValueCount > 0) {
      foundIssues.push({
        type: "missing_values",
        severity: missingValueCount > data.length * 0.1 ? "medium" : "low",
        count: missingValueCount,
        description: `${missingValueCount} missing values found in important columns`,
        rowIdxs: missingValueRows,
      });
    }

    if (invalidNumberCount > 0) {
      foundIssues.push({
        type: "invalid_numbers",
        severity: "medium",
        count: invalidNumberCount,
        description: `${invalidNumberCount} rows with invalid revenue numbers`,
        rowIdxs: invalidNumberRows,
        colId: mappedColumns.revenue,
      });
    }

    // Check for duplicate rows
    const uniqueRows = new Set(data.map((row: any) => JSON.stringify(row)));
    const duplicateCount = data.length - uniqueRows.size;
    if (duplicateCount > 0) {
      foundIssues.push({
        type: "duplicate_rows",
        severity: "low",
        count: duplicateCount,
        description: `${duplicateCount} duplicate rows found`,
      });
    }

    setIssues(foundIssues);
  };

  const cleanDataAdvanced = (
    data: any[],
    mappedColumns: Record<string, string>
  ): any[] => {
    if (!data || data.length === 0) return [];

    // Remove duplicates
    let cleaned = Array.from(new Set(data.map((row) => JSON.stringify(row)))).map(
      (str) => JSON.parse(str)
    );

    // Standardize categorical values (example: "fat content", "payment type")
    const standardizations: Record<string, Record<string, string>> = {
      fat_content: {
        lf: "Low Fat",
        "low fat": "Low Fat",
        lowfat: "Low Fat",
        reg: "Regular",
        regular: "Regular",
        "full fat": "Regular",
        ff: "Regular",
      },
    };
    Object.entries(standardizations).forEach(([colKey, mapping]) => {
      const col = Object.values(mappedColumns).find((c) =>
        new RegExp(colKey, "i").test(c)
      );
      if (col) {
        cleaned = cleaned.map((row) => {
          if (row[col]) {
            const val = String(row[col]).toLowerCase().replace(/\s+/g, "");
            row[col] = mapping[val] || _.startCase(val);
          }
          return row;
        });
      }
    });

    // Clean and parse numeric fields, fill missing with median
    const numericCols = ["revenue", "quantity"];
    numericCols.forEach((key) => {
      const col = mappedColumns[key];
      if (col) {
        const nums = cleaned
          .map((r) => {
            const v = String(r[col] ?? "").replace(/[^0-9.\-]/g, "");
            return v === "" ? null : Number(v);
          })
          .filter((v) => typeof v === "number" && !isNaN(v));
        const median =
          nums.length > 0
            ? nums.sort((a, b) => a - b)[Math.floor(nums.length / 2)]
            : 1;
        cleaned = cleaned.map((row) => {
          let val = row[col];
          let cleanVal = String(val ?? "").replace(/[^0-9.\-]/g, "");
          let num = cleanVal === "" ? null : Number(cleanVal);
          if (num === null || isNaN(num)) num = median || 1;
          row[col] = num;
          return row;
        });
        // Remove numeric outliers using z-score (optional)
        const mean = _.mean(nums);
        const std = Math.sqrt(_.mean(nums.map((n) => Math.pow(n - mean, 2))));
        cleaned = cleaned.filter((row) => {
          const x = row[col];
          if (typeof x !== "number" || isNaN(x)) return false;
          return Math.abs((x - mean) / (std || 1)) < 3;
        });
      }
    });

    // Fill missing product/category with mode or "Unnamed"
    const fillColMode = (col: string, fallback = "Unnamed") => {
      const vals = cleaned.map((r) => r[col]).filter(Boolean);
      const mode =
        vals.length > 0
          ? _.chain(vals).countBy().toPairs().maxBy(1).value()?.[0]
          : fallback;
      cleaned = cleaned.map((row) => {
        if (!row[col] || row[col].toString().trim() === "") {
          row[col] = mode || fallback;
        }
        return row;
      });
    };
    if (mappedColumns.product) fillColMode(mappedColumns.product);
    if (mappedColumns.product_detail) fillColMode(mappedColumns.product_detail);

    // --- Drop-in robust date normalization ---
    if (mappedColumns.date || mappedColumns.datetime || mappedColumns.timestamp) {
      cleaned = cleaned.map((row) => {
        row[mappedColumns.date || mappedColumns.datetime || mappedColumns.timestamp] = normalizeDate(row, mappedColumns);
        return row;
      });
    }

    // Trim and fix case for all string columns
    cleaned = cleaned.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [
          k,
          typeof v === "string" ? v.trim() : v,
        ])
      )
    );

    // Remove rows with critical missing data
    cleaned = cleaned.filter((row) => {
      if (mappedColumns.revenue) {
        const rev = row[mappedColumns.revenue];
        if (rev === null || isNaN(rev) || Number(rev) <= 0) return false;
      }
      if (
        mappedColumns.product &&
        (!row[mappedColumns.product] ||
          row[mappedColumns.product].toString().trim() === "")
      ) {
        return false;
      }
      return true;
    });

    console.log("Cleaned Data", cleaned.slice(0, 5));

    return cleaned;
  };

  const getHealthScore = () => {
    const maxScore = 100;
    let deductions = 0;
    issues.forEach((issue) => {
      switch (issue.severity) {
        case "high":
          deductions += 30;
          break;
        case "medium":
          deductions += 15;
          break;
        case "low":
          deductions += 5;
          break;
      }
    });
    return Math.max(0, maxScore - deductions);
  };

    // --- MAPPING CHECK LOGIC ---
const isMappingMissing = () => {
  const mapped = businessData.mappedColumns || {};
  // Only main required fields
  return requiredFields
    .some((f) => !mapped[f.key] || !headers.includes(mapped[f.key]));
};

  // --- AI CLEAN HANDLER ---
  const handleAiClean = async () => {
    if (isMappingMissing()) {
      setShowMapping(true);
      return;
    }
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const cleanedData = cleanDataAdvanced(
      businessData.data,
      businessData.mappedColumns
    );
    setBusinessData({
      ...businessData,
      data: cleanedData,
      isClean: true,
    });
    setIsProcessing(false);
    // analyzeData will run automatically on next useEffect
  };

  // --- MANUAL FIX HANDLER ---
  const handleManualFix = () => {
    if (isMappingMissing()) {
      setShowMapping(true);
      return;
    }
    setShowEditTable(true);
  };

  // --- CONTINUE HANDLER ---
  const handleContinue = () => {
    const s = getHealthScore();
    setBusinessData({
      ...businessData,
      isClean: true,
      healthScore: s,
    });
    onNext();
  };

  // For the modal: columns and issues
  const dataPreview = businessData.data
    .slice(0, 20)
    .map((row: any, i: number) => ({ ...row, id: i }));
  const mappedColumns = businessData.mappedColumns || {};
  const columns = Object.entries(mappedColumns).map(([key, col]) => ({
    field: col,
    headerName: key.replace(/_/g, " ").toUpperCase(),
    width: 160,
  }));

  // Mark missing/invalid cells as issues in the modal
  const issueCells =
    issues?.flatMap((issue) => {
      if (issue.rowIdxs && issue.colId) {
        return issue.rowIdxs.map((rowIdx) => ({
          rowIdx,
          colId: issue.colId,
          type: issue.type,
        }));
      }
      if (issue.rowIdxs && !issue.colId) {
        return columns.map((col) =>
          issue.rowIdxs?.map((rowIdx) => ({
            rowIdx,
            colId: col.field,
            type: issue.type,
          }))
        ).flat();
      }
      return [];
    }) || [];

  const score = getHealthScore();

  console.log("Mapped columns:", businessData.mappedColumns);
console.log("Preview row:", businessData.data[0]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Blocker if mapping is missing (only opens when user tries to clean/fix) */}
      {showMapping && (
        <Box
          sx={{
            bgcolor: "#fffbe6",
            border: "1px solid #fde68a",
            borderRadius: 2,
            p: 3,
            mb: 3,
          }}
        >
          <Typography fontWeight="bold" mb={1} color="#d97706">
            We need more info to generate your dashboard!
          </Typography>
          <Typography mb={1}>
            Please map or add the following columns:
            <ul>
              {requiredFields
                .filter(f => !["datetime", "timestamp", "time"].includes(f.key))
                .filter((f) => !businessData.mappedColumns?.[f.key])
                .map((f) => (
                  <li key={f.key}>{f.label}</li>
                ))}
            </ul>
          </Typography>
          <a
            href={sampleCsvUrl}
            download="sample_sales_data.csv"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            Download Sample CSV
          </a>
        </Box>
      )}

      <ColumnMappingModal
        open={showMapping}
        onClose={() => setShowMapping(false)}
        headers={headers}
        requiredFields={requiredFields}
        // Pass optionalFields to modal so it can render "Size" as optional (with None/default selected)
        optionalFields={optionalFields}
        mappedColumns={businessData.mappedColumns || {}}
        onSave={(mapping) => {
          setBusinessData({ ...businessData, mappedColumns: mapping });
          setShowMapping(false);
        }}
      />

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Smart Data Check
        </h2>
        <p className="text-lg text-gray-600">
          Let's make sure your data is ready for insights
        </p>
      </div>

      {/* Data Preview Table */}
      {businessData.data && businessData.data.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Preview</h3>
          <div className="overflow-auto border rounded-xl">
            <table className="min-w-full text-sm text-gray-700">
              <thead>
                <tr>
                  {Object.keys(businessData.data[0]).map((col) => (
                    <th className="px-3 py-2 bg-gray-100 font-semibold" key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {businessData.data.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-gray-50">
                    {Object.keys(businessData.data[0]).map((col) => (
                      <td className="px-3 py-1" key={col}>
                        {row[col] != null ? String(row[col]) : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-gray-400 px-3 py-1">
              Showing first 10 rows. {businessData.data.length} rows total.
            </div>
          </div>
        </div>
      )}

      {/* Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Data Health Score
          </h3>
          <div className="flex items-center gap-2">
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}%
            </div>
            <div className="text-sm text-gray-500">{getScoreLabel(score)}</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <motion.div
            className={`h-3 rounded-full ${
              score >= 90
                ? "bg-green-500"
                : score >= 85
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>

        <p className="text-sm text-gray-600">
          {score >= 90
            ? "Your data looks great! Ready for insights."
            : score >= 85
            ? "Your data is good with minor issues that can be easily fixed."
            : "Your data needs some cleaning for the best insights."}
        </p>
      </motion.div>

      {/* Issues List */}
      {issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Data Issues Found
          </h3>
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 ${
                    issue.severity === "high"
                      ? "text-red-500"
                      : issue.severity === "medium"
                      ? "text-yellow-500"
                      : "text-blue-500"
                  }`}
                />
                <div>
                  <p className="font-medium text-gray-900">{issue.description}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {issue.severity} priority • {issue.count} affected{" "}
                    {issue.count === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      {issues.length > 0 && !businessData.isClean && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Choose Your Fix
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleAiClean}
              disabled={isProcessing}
              className="p-4 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <Wand2 className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">Let AI Clean It</span>
              </div>
              <p className="text-sm text-gray-600">
                Automatically fix issues with smart rules and data cleaning
              </p>
              {isProcessing && (
                <div className="mt-2 text-sm text-primary-600">
                  <div className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full inline-block mr-2" />
                  Cleaning data...
                </div>
              )}
            </button>

            <button
              onClick={handleManualFix}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <Edit className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">
                  Fix Data Manually
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Review and edit your data in an interactive table
              </p>
            </button>
          </div>
          {isMappingMissing() && (
            <div className="text-xs text-yellow-700 mt-3">
              <AlertTriangle className="inline mr-1 w-4 h-4" />
              Before cleaning or fixing, you'll be asked to map key columns.
            </div>
          )}
        </motion.div>
      )}

      {/* Trust Message */}
      {(businessData.isClean || score >= 90) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">
                You're all set for insights!
              </h4>
              <p className="text-sm text-green-700">
                Your data is clean and ready for analysis. Let's create your
                dashboard.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Example Row Above Manual Fix */}
      {showEditTable && (
        <Box
          mb={2}
          p={2}
          bgcolor="#f7fafc"
          borderRadius={1}
          sx={{ border: "1px solid #e5e7eb" }}
        >
          <Typography variant="subtitle2">Example row:</Typography>
          <pre
            style={{
              background: "#fff",
              padding: 8,
              margin: 0,
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            {requiredFields.map((f) => f.label).join(",")}
            {"\n"}
            {requiredFields.map((f) => f.example).join(",")}
          </pre>
          <Typography variant="caption" color="text.secondary">
            Make sure your data matches this format for best results.
          </Typography>
        </Box>
      )}

      {/* Manual Edit Modal */}
      <ManualDataFixModal
        open={showEditTable}
        onClose={() => setShowEditTable(false)}
        data={dataPreview}
        columns={columns}
        issues={issueCells}
        onSave={(newRows) => {
          // Update only the edited preview rows for demo; in production, sync to full data set!
          let newData = [...businessData.data];
          newRows.forEach((row: any) => {
            newData[row.id] = { ...row };
            delete newData[row.id].id;
          });
          setBusinessData({ ...businessData, data: newData });
          setShowEditTable(false);
          analyzeData();
        }}
      />

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            canGoBack
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Back
        </button>

        <button
          onClick={handleContinue}
          disabled={score < 85 && !businessData.isClean}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${
            score >= 85 || businessData.isClean
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
};

export default DataHealthCheck;