import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, FormControl, InputLabel, Select, Typography, Box
} from "@mui/material";

const NONE_OPTION = "__none__";

const ColumnMappingModal = ({
  open, onClose, headers,
  requiredFields, optionalFields = [],
  mappedColumns, onSave
}) => {
  const allFields = [
    ...requiredFields.map(f => ({ ...f, required: true })),
    ...optionalFields.map(f => ({ ...f, required: false })),
  ];

  const [mapping, setMapping] = useState({});

  useEffect(() => {
    setMapping(() => {
      const initial = {};
      for (const field of allFields) {
        if (mappedColumns[field.key]) initial[field.key] = mappedColumns[field.key];
        else if (!field.required) initial[field.key] = NONE_OPTION;
        else initial[field.key] = "";
      }
      return initial;
    });
  }, [open]);

  const getAvailableHeaders = currentKey => {
    const used = Object.entries(mapping)
      .filter(([k, v]) => k !== currentKey && v && v !== NONE_OPTION)
      .map(([, v]) => v);
    return headers.filter(h => !used.includes(h));
  };

  const isValid = allFields.every(f =>
    f.required ? mapping[f.key] && mapping[f.key] !== NONE_OPTION : true
  );

  const handleChange = (fieldKey, value) => {
    setMapping(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleSave = () => {
    const cleanMapping = {};
    for (const field of allFields) {
      if (mapping[field.key] && mapping[field.key] !== NONE_OPTION) {
        cleanMapping[field.key] = mapping[field.key];
      }
    }
    onSave(cleanMapping);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Map Your Columns</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Please match your data columns to the fields below.<br/>
          <b>Required fields</b> must be mapped to continue.<br/>
          Optional fields can be left as "None".
        </Typography>
        {allFields.map(field => (
          <Box key={field.key} mb={2}>
            <FormControl fullWidth required={field.required}>
              <InputLabel>
                {field.label}
                {field.required ? " *" : " (optional)"}
              </InputLabel>
              <Select
                value={mapping[field.key] ?? (!field.required ? NONE_OPTION : "")}
                label={field.label + (field.required ? " *" : " (optional)")}
                onChange={e => handleChange(field.key, e.target.value)}
              >
                {!field.required && (
                  <MenuItem value={NONE_OPTION}>None</MenuItem>
                )}
                {getAvailableHeaders(field.key).map(header => (
                  <MenuItem key={header} value={header}>{header}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              {field.example && <>Example: <b>{field.example}</b> — </>}
              {field.description}
            </Typography>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={!isValid}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnMappingModal;