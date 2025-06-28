import React from "react";
import { Box, Typography, Button } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const sampleCsvUrl =
  "https://raw.githubusercontent.com/your-repo/sample_sales_data.csv"; // Replace with your real example file if you want

const DashboardEmptyState: React.FC<{
  missingFields?: string[];
  goBackToUpload?: () => void;
  openHelp?: () => void;
  healthScore?: number;
}> = ({
  missingFields = ["Product", "Revenue", "Date"],
  goBackToUpload,
  openHelp,
  healthScore,
}) => (
  <Box
    sx={{
      p: 4,
      bgcolor: "#fffbe6",
      border: "1px solid #fde68a",
      borderRadius: 2,
      mb: 3,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      maxWidth: 520,
      mx: "auto",
    }}
    data-testid="dashboard-empty-state"
  >
    <InfoOutlinedIcon sx={{ color: "#d97706", fontSize: 48, mb: 2 }} />
    <Typography fontWeight="bold" color="#d97706" mb={1} textAlign="center" variant="h6">
      No Data to Display
    </Typography>
    <Typography mb={2} color="text.secondary" textAlign="center">
      {healthScore !== undefined && healthScore < 85
        ? `Your data score is ${healthScore}%. Some important information is missing, so we can't display charts or insights yet.`
        : "We couldn't generate charts or insights because your data is missing key information."
      }
    </Typography>
    <Typography mb={2} textAlign="center">
      To unlock your dashboard, please make sure your file includes all of these columns:
      <ul>
        {missingFields.map((m) => (
          <li key={m}><strong>{m}</strong></li>
        ))}
      </ul>
    </Typography>
    <Box mb={2}>
      <a
        href={sampleCsvUrl}
        download="sample_sales_data.csv"
        style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 500 }}
      >
        Download Example CSV
      </a>
    </Box>
    <Box display="flex" gap={2} mb={2}>
      {goBackToUpload && (
        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={goBackToUpload}
        >
          Re-Upload Data
        </Button>
      )}
      {openHelp && (
        <Button
          variant="text"
          onClick={openHelp}
        >
          How to Fix My Data
        </Button>
      )}
    </Box>
    <Typography variant="body2" color="text.secondary" textAlign="center">
      Need help? Our support team is just a click away.
    </Typography>
  </Box>
);

export default DashboardEmptyState;