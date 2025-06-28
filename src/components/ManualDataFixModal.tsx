import React from "react";
import { Modal, Box, Typography, Button } from "@mui/material";
import { DataGrid, GridColDef, GridCellParams } from "@mui/x-data-grid";

interface ManualDataFixModalProps {
  open: boolean;
  onClose: () => void;
  data: any[];
  columns: GridColDef[];
  onSave: (newData: any[]) => void;
  issues: { rowIdx: number; colId: string; type: string }[];
}

const ManualDataFixModal: React.FC<ManualDataFixModalProps> = ({
  open,
  onClose,
  data,
  columns,
  onSave,
  issues,
}) => {
  const [rows, setRows] = React.useState<any[]>(data);

  React.useEffect(() => {
    setRows(data);
  }, [data]);

  const getCellClassName = (params: GridCellParams) => {
    const hasIssue = issues.find(
      (iss) => iss.rowIdx === params.id && iss.colId === params.field
    );
    return hasIssue ? "problem-cell" : "";
  };

  const editableColumns = columns.map((col) => ({
    ...col,
    editable: true,
    cellClassName: getCellClassName,
  }));

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80vw",
          maxWidth: 900,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography variant="h6" mb={2}>
          Edit Your Data for Best Results
        </Typography>
        <Typography variant="body2" mb={2} color="text.secondary">
          To ensure accurate insights, please review and fix data issues below.
          <br />
          Problem cells are highlighted. Click to edit, then save when ready.
        </Typography>
        <div style={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={editableColumns}
            onCellEditCommit={(params) => {
              const idx = rows.findIndex((r) => r.id === params.id);
              const updated = [...rows];
              updated[idx][params.field] = params.value;
              setRows(updated);
            }}
            getRowId={(row) => row.id}
            disableSelectionOnClick
          />
        </div>
        <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={() => onSave(rows)}
            variant="contained"
            color="primary"
          >
            Save & Continue
          </Button>
        </Box>
        {/* Add custom styling for problem cells */}
        <style>
          {`
            .problem-cell {
              background: #fffbe6 !important;
              color: #d97706 !important;
            }
          `}
        </style>
      </Box>
    </Modal>
  );
};

export default ManualDataFixModal;