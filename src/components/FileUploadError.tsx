import React from "react";
import { Box, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const FileUploadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Box
    sx={{
      p: 4,
      bgcolor: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: 2,
      mb: 3,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      maxWidth: 480,
      mx: "auto",
    }}
  >
    <ErrorOutlineIcon sx={{ color: "#ef4444", fontSize: 48, mb: 2 }} />
    <Typography fontWeight="bold" color="#ef4444" mb={1} variant="h6">
      File Not Supported
    </Typography>
    <Typography mb={2} color="text.secondary" textAlign="center">
      Oops! We couldn’t read your file. Please upload a CSV file exported from Excel, Google Sheets, or your POS system.
    </Typography>
    <Button variant="contained" color="primary" onClick={onRetry}>
      Try Again
    </Button>
    <a
      href="/sample_sales_data.csv"
      download="sample_sales_data.csv"
      style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 500, marginTop: 16 }}
    >
      Download Example CSV
    </a>
  </Box>
);

export default FileUploadError;