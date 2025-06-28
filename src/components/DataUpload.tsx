import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BusinessData } from '../pages/Dashboard';

interface DataUploadProps {
  businessData: BusinessData;
  setBusinessData: (data: BusinessData) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
}

const DataUpload: React.FC<DataUploadProps> = ({
  businessData,
  setBusinessData,
  onNext,
  onBack,
  canGoBack,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error' | 'mapping'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [manualMapping, setManualMapping] = useState<Record<string, string>>({});

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidType && !hasValidExtension) {
      setErrorMessage('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      setUploadStatus('error');
      return;
    }

    // File size limit to 26MB
    if (file.size > 26 * 1024 * 1024) {
      setErrorMessage('File too large. Please upload a file smaller than 26MB or split it into smaller chunks.');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      const data = await parseFile(file);

      if (!data || data.length === 0) {
        throw new Error('File appears to be empty or invalid');
      }

      // Validate data structure
      const validationResult = validateData(data);
      if (!validationResult.isValid) {
        setErrorMessage(validationResult.message);
        setUploadStatus('error');
        return;
      }

      // Auto-detect business type if not selected or "other"
      let detectedType = businessData.type;
      if (businessData.type === 'other' || !businessData.type) {
        detectedType = detectBusinessType(file.name, data);
      }

      const mappedColumns = mapColumns(data[0] || {}, detectedType);
      const mappingConfidence = calculateMappingConfidence(mappedColumns, data[0]);

      // If mapping confidence is low, show manual mapping
      if (mappingConfidence < 0.7) {
        setAvailableColumns(Object.keys(data[0] || {}));
        setManualMapping(mappedColumns);
        setShowColumnMapping(true);
        setUploadStatus('mapping');

        setBusinessData({
          ...businessData,
          file,
          data,
          type: detectedType,
          mappedColumns: {},
          healthScore: 0,
          isClean: false
        });
        return;
      }

      setBusinessData({
        ...businessData,
        file,
        data,
        type: detectedType,
        mappedColumns,
        healthScore: calculateHealthScore(data, mappedColumns),
        isClean: false
      });

      setUploadStatus('success');
    } catch (error) {
      console.error('File parsing error:', error);
      setErrorMessage('Failed to parse file. Please check the format and try again.');
      setUploadStatus('error');
    }
  };

  // Supports both CSV and Excel files! Cleans empty rows.
  const parseFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
      const isCSV = file.name.toLowerCase().endsWith('.csv');

      if (isExcel) {
        // Read Excel file as ArrayBuffer (binary)
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // Filter out empty rows
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
            const cleanJson = json.filter(row =>
              Object.values(row).some(value => value && value.toString().trim())
            );
            resolve(cleanJson);
          } catch (err) {
            reject(new Error('Failed to parse Excel file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } else if (isCSV) {
        // Read CSV file as text
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            if (!text || text.trim().length === 0) {
              reject(new Error('File is empty'));
              return;
            }
            // Your existing CSV parsing logic
            const lines = text.split(/\r?\n/).filter(line => line.trim());
            if (lines.length < 2) {
              reject(new Error('File must contain at least a header row and one data row'));
              return;
            }
            const parseCSVLine = (line: string): string[] => {
              const result = [];
              let current = '';
              let inQuotes = false;
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  result.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              result.push(current.trim());
              return result;
            };
            const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim()).filter(h => h);
            if (headers.length === 0) {
              reject(new Error('No valid headers found'));
              return;
            }
            const data = lines.slice(1).map(line => {
              const values = parseCSVLine(line).map(v => v.replace(/"/g, '').trim());
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              return row;
            }).filter(row => {
              return Object.values(row).some(value => value && value.toString().trim());
            });
            resolve(data);
          } catch (err) {
            reject(new Error('Failed to parse CSV file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      } else {
        reject(new Error('Unsupported file type'));
      }
    });
  };

  const validateData = (data: any[]): { isValid: boolean; message: string } => {
    if (!data || data.length === 0) {
      return { isValid: false, message: 'File contains no data' };
    }

    const firstRow = data[0];
    const headers = Object.keys(firstRow);

    // Check for blank headers
    const blankHeaders = headers.filter(h => !h || h.trim() === '');
    if (blankHeaders.length > 0) {
      return { isValid: false, message: 'File contains blank column headers. Please fix and re-upload.' };
    }

    // Check for merged cells (duplicate headers)
    const uniqueHeaders = new Set(headers);
    if (uniqueHeaders.size !== headers.length) {
      return { isValid: false, message: 'File contains duplicate column headers. Please fix and re-upload.' };
    }

    return { isValid: true, message: '' };
  };

  const detectBusinessType = (filename: string, data: any[]): string => {
    const lowerFilename = filename.toLowerCase();
    const headers = Object.keys(data[0] || {}).map(h => h.toLowerCase());

    // Check filename patterns
    if (lowerFilename.includes('pizza') || lowerFilename.includes('restaurant') || lowerFilename.includes('cafe') || lowerFilename.includes('menu')) {
      return 'restaurant';
    }
    if (lowerFilename.includes('shop') || lowerFilename.includes('fashion') || lowerFilename.includes('store') || lowerFilename.includes('online')) {
      return 'online_seller';
    }
    if (lowerFilename.includes('construction') || lowerFilename.includes('building') || lowerFilename.includes('contractor')) {
      return 'construction';
    }
    if (lowerFilename.includes('retail')) {
      return 'retail';
    }

    // Check column headers
    if (headers.some(h => h.includes('pizza') || h.includes('menu') || h.includes('dish') || h.includes('order'))) {
      return 'restaurant';
    }
    if (headers.some(h => h.includes('shipping') || h.includes('category') || h.includes('sku') || h.includes('variant') || h.includes('shopify') || h.includes('shopee'))) {
      return 'online_seller';
    }
    if (headers.some(h => h.includes('construction') || h.includes('material') || h.includes('contractor') || h.includes('project'))) {
      return 'construction';
    }

    return 'retail'; // Default fallback
  };

  // --- SMART COLUMN DETECTION ---
  const mapColumns = (sampleRow: any, businessType: string): Record<string, string> => {
    const headers = Object.keys(sampleRow).map(h => h.toLowerCase());
    const mapping: Record<string, string> = {};

    // PRODUCT DETAIL & CATEGORY DETECTION
    const productDetailKeys = [
      'product detail', 'product_detail', 'menu item', 'item detail', 'item_description', 'product name', 'item name', 'dish', 'drink', 'coffee', 'tea', 'bakery'
    ];
    const productCategoryKeys = [
      'product category', 'product_category', 'category', 'type', 'classification', 'group'
    ];

    const productDetailHeader = headers.find(h =>
      productDetailKeys.some(key => h.replace(/[_\s]+/g, ' ').includes(key))
    );
    if (productDetailHeader) {
      const originalHeader = Object.keys(sampleRow).find(k => k.toLowerCase() === productDetailHeader);
      if (originalHeader) mapping.product_detail = originalHeader;
    }
    const productCategoryHeader = headers.find(h =>
      productCategoryKeys.some(key => h.replace(/[_\s]+/g, ' ').includes(key))
    );
    if (productCategoryHeader) {
      const originalHeader = Object.keys(sampleRow).find(k => k.toLowerCase() === productCategoryHeader);
      if (originalHeader) mapping.product = originalHeader;
    }
    // Fallback: pick a generic product/item if neither found
    if (!mapping.product_detail && !mapping.product) {
      const productKeys = [
        'item', 'menu item', 'pizza name', 'product', 'dish', 'type', 'description',
        'name', 'pizza', 'menu', 'product name', 'item name', 'product_name',
        'item_name', 'title', 'service', 'material', 'sku'
      ];
      let bestProductHeader = null;
      let bestProductScore = 0;
      for (const header of headers) {
        for (const key of productKeys) {
          if (header.includes(key)) {
            const originalHeader = Object.keys(sampleRow).find(k => k.toLowerCase() === header);
            if (originalHeader) {
              const sampleValue = sampleRow[originalHeader];
              let score = 1;
              if (sampleValue && isNaN(Number(sampleValue)) && sampleValue.length > 2) {
                score += 2;
              }
              if (
                sampleValue &&
                isNaN(Number(sampleValue)) &&
                sampleValue.length > 2 &&
                !/(_?id|code|sku|number)$/i.test(header)
              ) {
                score += 3;
              }
              if (header === key) {
                score += 1;
              }
              if (score > bestProductScore) {
                bestProductScore = score;
                bestProductHeader = originalHeader;
              }
            }
          }
        }
      }
      if (bestProductHeader) {
        mapping.product = bestProductHeader;
      }
    }
    // REVENUE DETECTION
    const revenueKeys = [
      'revenue', 'amount', 'total_price', 'price', 'sales', 'total', 'cost',
      'total_amount', 'grand_total', 'net_amount', 'gross_amount', 'value',
      'total price', 'unit price', 'line total'
    ];
    const revenueHeader = headers.find(h => revenueKeys.some(key => h.includes(key)));
    if (revenueHeader) {
      const originalHeader = Object.keys(sampleRow).find(k => k.toLowerCase() === revenueHeader);
      if (originalHeader) mapping.revenue = originalHeader;
    }
    // QUANTITY DETECTION
    const quantityKeys = [
      'qty', 'quantity', 'units_sold', 'count', 'items', 'units', 'pieces',
      'amount', 'number', 'sold', 'ordered'
    ];
    const quantityHeader = headers.find(h => quantityKeys.some(key => h.includes(key)));
    if (quantityHeader) {
      const originalHeader = Object.keys(sampleRow).find(k => k.toLowerCase() === quantityHeader);
      if (originalHeader) mapping.quantity = originalHeader;
    }
    // DATE DETECTION
    const dateKeys = [
      'date', 'time', 'invoice_date', 'order_date', 'transaction_date', 'invoicedate',
      'created', 'timestamp', 'when', 'order date', 'transaction date'
    ];
    let dateHeader = headers.find(h => dateKeys.some(key => h.includes(key)));
    if (!dateHeader) {
      const possibleDateHeader = Object.keys(sampleRow).find(key => {
        const sample = new Date(sampleRow[key]);
        return !isNaN(sample.getTime()) && sampleRow[key].toString().includes(':');
      });
      if (possibleDateHeader) {
        dateHeader = possibleDateHeader.toLowerCase();
      }
    }
    if (dateHeader) {
      const originalHeader = Object.keys(sampleRow).find(k => k.toLowerCase() === dateHeader);
      if (originalHeader) mapping.date = originalHeader;
    }
    // TIME DETECTION
    let timeCol = Object.keys(sampleRow).find(col =>
      /time/i.test(col) &&
      sampleRow[col] &&
      /^(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(sampleRow[col].trim())
    );
    if (!timeCol) {
      timeCol = Object.keys(sampleRow).find(col =>
        sampleRow[col] && /^(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(sampleRow[col].trim())
      );
    }
    if (timeCol) {
      mapping.time = timeCol;
    }
    // BUSINESS-SPECIFIC MAPPINGS
    if (businessType === 'online_seller') {
      const regionKeys = ['region', 'country', 'state', 'location', 'city'];
      const regionHeader = headers.find(h => regionKeys.some(key => h.includes(key)));
      if (regionHeader) {
        const originalHeader = Object.keys(sampleRow).find(k => k.toLowerCase() === regionHeader);
        if (originalHeader) mapping.region = originalHeader;
      }
    }
    return mapping;
  };

  const calculateMappingConfidence = (mappedColumns: Record<string, string>, sampleRow: any): number => {
    const requiredFields = ['product', 'revenue'];
    const mappedRequired = requiredFields.filter(field => mappedColumns[field] || mappedColumns['product_detail']);
    let confidence = mappedRequired.length / requiredFields.length;
    if (mappedColumns.quantity) confidence += 0.2;
    if (mappedColumns.date) confidence += 0.1;
    if (mappedColumns.product || mappedColumns.product_detail) {
      const col = mappedColumns.product_detail || mappedColumns.product;
      const productValue = sampleRow[col];
      if (productValue && isNaN(Number(productValue)) && productValue.length > 2) {
        confidence += 0.2;
      }
    }
    return Math.min(confidence, 1);
  };

  const calculateHealthScore = (data: any[], mappedColumns: Record<string, string>): number => {
    if (!data.length) return 0;
    let score = 0;
    const totalChecks = 5;
    if (mappedColumns.revenue) score += 1;
    if (mappedColumns.quantity) score += 1;
    if (mappedColumns.product || mappedColumns.product_detail) score += 1;
    if (mappedColumns.date) score += 1;
    const sampleSize = Math.min(100, data.length);
    const sampleData = data.slice(0, sampleSize);
    const completeness = sampleData.reduce((acc, row) => {
      const nonEmptyFields = Object.values(row).filter(v => v && v.toString().trim()).length;
      return acc + (nonEmptyFields / Object.keys(row).length);
    }, 0) / sampleSize;
    score += completeness;
    return Math.round((score / totalChecks) * 100);
  };

  const handleManualMapping = () => {
    const finalMapping = { ...manualMapping };
    setBusinessData({
      ...businessData,
      mappedColumns: finalMapping,
      healthScore: calculateHealthScore(businessData.data, finalMapping),
    });
    setShowColumnMapping(false);
    setUploadStatus('success');
  };

  const removeFile = () => {
    setBusinessData({
      ...businessData,
      file: null,
      data: [],
      mappedColumns: {},
      healthScore: 0,
      isClean: false
    });
    setUploadStatus('idle');
    setErrorMessage('');
    setShowColumnMapping(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your Sales Data
        </h2>
        <p className="text-lg text-gray-600">
          Drop your CSV or Excel file and let our AI do the magic
        </p>
      </div>

      {!businessData.file ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-25'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
              dragActive ? 'bg-primary-200' : 'bg-gray-200'
            }`}>
              <Upload className={`w-8 h-8 ${dragActive ? 'text-primary-600' : 'text-gray-500'}`} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {dragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </h3>
            <p className="text-gray-600 mb-6">
              or click to browse your files
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer font-medium"
            >
              Choose File
            </label>
            <div className="mt-6 text-sm text-gray-500">
              <p>Supported formats: CSV, Excel (.xlsx, .xls)</p>
              <p>Maximum file size: 26MB</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{businessData.file.name}</h3>
                <p className="text-sm text-gray-500">
                  {(businessData.file.size / 1024 / 1024).toFixed(2)} MB • {businessData.data.length} rows
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {uploadStatus === 'uploading' && (
                <div className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full" />
              )}
              {uploadStatus === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {uploadStatus === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              {uploadStatus === 'mapping' && (
                <Settings className="w-5 h-5 text-blue-500" />
              )}
              <button
                onClick={removeFile}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          {uploadStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-50 border border-grey-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-900">File uploaded successfully!</p>
                  <p className="text-sm text-green-700">
                    Business type: {businessData.type.replace('_', ' ')} • Health score: {businessData.healthScore}%
                  </p>
                </div>
              </div>
            </div>
          )}
          {uploadStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-900">Upload failed</p>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* --- MANUAL COLUMN MAPPING UI BLOCK --- */}
      {showColumnMapping && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Map Your Columns</h3>
          </div>
          <p className="text-blue-700 mb-6">
            We need help identifying your data columns. Please map the following fields:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { field: 'product_detail', label: 'Menu Item / Product Detail' },
              { field: 'product', label: 'Product Category / Type' },
              { field: 'revenue', label: 'Revenue / Sales Amount' },
              { field: 'quantity', label: 'Quantity / Units Sold' },
              { field: 'date', label: 'Date' }
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                  {['product', 'product_detail', 'revenue', 'date'].includes(field) ? ' *' : ''}
                </label>
                <select
                  value={manualMapping[field] || ''}
                  onChange={(e) => setManualMapping({ ...manualMapping, [field]: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a column...</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleManualMapping}
              disabled={
                !manualMapping.revenue ||
                (!manualMapping.product && !manualMapping.product_detail)
              }
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                manualMapping.revenue &&
                (manualMapping.product || manualMapping.product_detail)
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue with Mapping
            </button>
            <button
              onClick={removeFile}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Upload Different File
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            canGoBack
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={uploadStatus !== 'success'}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${
            uploadStatus === 'success'
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Data Check
        </button>
      </div>
    </div>
  );
};

export default DataUpload;