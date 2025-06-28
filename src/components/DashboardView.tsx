import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Calendar } from 'lucide-react';
import InsightAssistant from './InsightAssistant';
import DashboardEmptyState from "./DashboardEmptyState";
import { parseDateTime } from './dateUtils';
import { BusinessData } from '../pages/Dashboard';
import CustomerCharts from './CustomerCharts';

import {
  getProductCol,
  getBreakdownCols,
  productCandidates
} from './columnMatching';

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
const periodOptions = [
  { label: "This Year (Monthly)", value: "this-year" },
  { label: "Last 6 Months (Monthly)", value: "last-6-months" },
  { label: "Last 4 Weeks (Weekly)", value: "last-4-weeks" },
  { label: "This Month (Daily)", value: "this-month" },
  { label: "This Week (Daily)", value: "this-week" }
];

const LABEL_CASE = (label: string) => label.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
function groupPieData(data: { name: string, value: number }[]) {
  if (data.length <= 5) return data;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const topN = 4;
  const top = sorted.slice(0, topN);
  const otherValue = sorted.slice(topN).reduce((sum, d) => sum + d.value, 0);
  return [...top, { name: "Other", value: otherValue }];
}

function getMonday(d: Date) {
  d = new Date(d);
  var day = d.getDay(),
    diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}
function formatMonth(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}
function formatMonthLabel(label: string) {
  const [year, month] = label.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'short' });
}

interface DashboardViewProps {
  businessData: BusinessData;
  setBusinessData: (data: BusinessData) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
}

const REQUIRED_FIELDS = ["product", "revenue", "date"];

// Helper: Should this column be filtered out as a product candidate?
function isProductColumn(col: string | null) {
  if (!col) return false;
  const normalized = col.replace(/[\s_]/g, '').toLowerCase();
  return productCandidates.some(c => normalized === c.replace(/[\s_]/g, '').toLowerCase());
}

const DashboardView: React.FC<DashboardViewProps> = ({
  businessData,
  onBack,
  canGoBack,
}) => {
  const missingFields = REQUIRED_FIELDS.filter(field => !businessData.mappedColumns[field]);
  if (!businessData.data.length || missingFields.length) {
    return (
      <DashboardEmptyState
        missingFields={missingFields.map(
          f => f.charAt(0).toUpperCase() + f.slice(1)
        )}
        goBackToUpload={onBack}
        healthScore={businessData.healthScore ?? 0}
      />
    );
  }

  const [selectedPeriod, setSelectedPeriod] = useState(periodOptions[0].value);

  const { mappedColumns } = businessData;

  // Use robust helpers for all key columns
  const productCol = useMemo(
    () => getProductCol(mappedColumns, businessData.data),
    [mappedColumns, businessData.data]
  );
  const { categoryCol, typeCol, sizeCol, storeLocationCol } = useMemo(
    () => getBreakdownCols(mappedColumns, businessData.data),
    [mappedColumns, businessData.data]
  );

  // Dates and filtered data
  const allDates = useMemo(() => businessData.data
    .map(row => parseDateTime(row[mappedColumns.date], mappedColumns.time ? row[mappedColumns.time] : undefined))
    .filter((d): d is Date => !!d && !isNaN(d.getTime())), [businessData, mappedColumns]);
  const allYears = Array.from(new Set(allDates.map(d => d.getFullYear()))).sort((a, b) => a - b);
  const latestYear = allYears[allYears.length - 1];
  const [selectedYear, setSelectedYear] = useState<string | "all">(String(latestYear));

  // Period range
  const periodRange = useMemo(() => {
    let start: Date, end: Date;
    const refYear = selectedYear === "all" ? latestYear : Number(selectedYear);
    const refLatestDate = allDates.filter(d => d.getFullYear() === refYear).sort((a, b) => b.getTime() - a.getTime())[0] || new Date(refYear, 11, 31);
    const refMonth = refLatestDate.getMonth();

    if (selectedPeriod === "this-week") {
      start = getMonday(refLatestDate);
      end = addDays(start, 6);
    } else if (selectedPeriod === "last-4-weeks") {
      end = getMonday(refLatestDate);
      start = addDays(end, -7 * 4);
      end = addDays(end, -1);
    } else if (selectedPeriod === "this-month") {
      start = new Date(refYear, refMonth, 1);
      end = new Date(refYear, refMonth + 1, 0);
    } else if (selectedPeriod === "last-6-months") {
      end = new Date(refYear, refMonth + 1, 0);
      start = addMonths(new Date(refYear, refMonth, 1), -5);
    } else if (selectedPeriod === "this-year") {
      start = new Date(refYear, 0, 1);
      end = new Date(refYear, 11, 31);
    } else {
      start = new Date(2000, 0, 1);
      end = refLatestDate;
    }
    return { start, end, refYear };
  }, [selectedYear, selectedPeriod, allDates, latestYear]);

  const filteredData = useMemo(() => {
    return businessData.data.filter(row => {
      const date = parseDateTime(
        row[mappedColumns.date],
        mappedColumns.time ? row[mappedColumns.time] : undefined
      );
      if (!date || isNaN(date.getTime())) return false;
      if (selectedYear === "all") return date >= periodRange.start && date <= periodRange.end;
      return (
        date.getFullYear() === Number(selectedYear) &&
        date >= periodRange.start &&
        date <= periodRange.end
      );
    });
  }, [businessData, mappedColumns, periodRange, selectedYear]);

  // KPIs
  const totalRevenue = useMemo(() =>
    filteredData.reduce((sum, row) => {
      const revenue = parseFloat(row[mappedColumns.revenue] || '0');
      return sum + (isNaN(revenue) ? 0 : revenue);
    }, 0)
  , [filteredData, mappedColumns]);
  const totalQuantity = useMemo(() =>
    filteredData.reduce((sum, row) => {
      const qty = parseFloat(row[mappedColumns.quantity] || '1');
      return sum + (isNaN(qty) ? 1 : qty);
    }, 0)
  , [filteredData, mappedColumns]);
  const avgOrderValue = totalRevenue / (filteredData.length || 1);
  const kpis = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      change: '+15.2%',
      trend: 'up',
      icon: DollarSign
    },
    {
      title: businessData.type === 'restaurant' ? 'Total Orders' : 'Total Sales',
      value: filteredData.length.toLocaleString(),
      change: '+8.7%',
      trend: 'up',
      icon: ShoppingCart
    },
    {
      title: 'Items Sold',
      value: totalQuantity.toLocaleString(),
      change: '+12.3%',
      trend: 'up',
      icon: Users
    },
    {
      title: 'Avg Order Value',
      value: `$${avgOrderValue.toFixed(2)}`,
      change: '+5.3%',
      trend: 'up',
      icon: Calendar
    }
  ];

  // Sales Trends (Monthly)
  const salesTrendsData = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach(row => {
      const date = parseDateTime(row[mappedColumns.date], mappedColumns.time ? row[mappedColumns.time] : undefined);
      if (!date) return;
      const month = formatMonth(date);
      const revenue = parseFloat(row[mappedColumns.revenue] || '0');
      map.set(month, (map.get(month) || 0) + revenue);
    });
    const year = allYears[allYears.length - 1] || new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    return months.map(month => ({
      month: formatMonthLabel(month),
      sales: map.get(month) || 0
    }));
  }, [filteredData, mappedColumns, allYears]);

  // Top/Bottom Performers (by productCol)
  const performerMap = useMemo(() => {
    const map = new Map();
    filteredData.forEach(row => {
      const item = productCol ? row[productCol] : undefined;
      const name = (item && typeof item === "string" && item.trim() !== "") ? item : "Unknown";
      const revenue = parseFloat(row[mappedColumns.revenue] || '0');
      map.set(name, (map.get(name) || 0) + revenue);
    });
    return map;
  }, [filteredData, productCol, mappedColumns]);
  const performerData = Array.from(performerMap.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  const top5Performers = performerData.slice(0, 5);
  const bottom5Performers = performerData.slice(-5).reverse();

  // --- Breakdown logic ---
  const categoryPieData = useMemo(() => {
    if (!categoryCol) return [];
    const map = new Map<string, number>();
    filteredData.forEach(row => {
      const val = row[categoryCol] || "Unknown";
      map.set(val, (map.get(val) || 0) + 1);
    });
    return groupPieData(Array.from(map.entries()).map(([name, value]) => ({ name, value })));
  }, [filteredData, categoryCol]);
  const typePieData = useMemo(() => {
    if (!typeCol) return [];
    const map = new Map<string, number>();
    filteredData.forEach(row => {
      const val = row[typeCol] || "Unknown";
      map.set(val, (map.get(val) || 0) + 1);
    });
    return groupPieData(Array.from(map.entries()).map(([name, value]) => ({ name, value })));
  }, [filteredData, typeCol]);
  // --- Pizza size breakdown as horizontal bar chart (absolute count) ---
  const sizeBarData = useMemo(() => {
    if (!sizeCol) return [];
    const map = new Map<string, number>();
    filteredData.forEach(row => {
      const val = row[sizeCol] || "Unknown";
      map.set(val, (map.get(val) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }, [filteredData, sizeCol]);

  // --- Store Location breakdown as bar chart (absolute revenue) ---
  const storeLocationBarData = useMemo(() => {
    if (!storeLocationCol) return [];
    const map = new Map<string, number>();
    filteredData.forEach(row => {
      const val = row[storeLocationCol] || "Unknown";
      const revenue = parseFloat(row[mappedColumns.revenue] || '0');
      map.set(val, (map.get(val) || 0) + revenue);
    });
    return Array.from(map.entries()).map(([name, revenue]) => ({ name, revenue }));
  }, [filteredData, storeLocationCol, mappedColumns]);

  // Hourly sales pattern (full width)
  const hourlyRevenueData = useMemo(() => {
    if (!mappedColumns.time) return [];
    const hourlyRevenue = new Array(24).fill(0);
    filteredData.forEach((row) => {
      const date = parseDateTime(row[mappedColumns.date], mappedColumns.time ? row[mappedColumns.time] : undefined);
      if (!date) return;
      const hour = date.getHours();
      const revenue = parseFloat(row[mappedColumns.revenue] || '0');
      if (!isNaN(revenue)) hourlyRevenue[hour] += revenue;
    });
    return hourlyRevenue.map((revenue, hour) => ({
      hour: `${hour}:00`,
      revenue,
    }));
  }, [filteredData, mappedColumns]);

  // UI: year dropdown options
  const yearOptions = [{ label: "Compare All Years", value: "all" }, ...allYears.map(y => ({ label: String(y), value: String(y) }))];

  // Growth insights (same as before)
  const usedProducts = new Set<string>();
  let growthInsights: string[] = [];
  const topCount = 3, bottomCount = 2;
  const topProducts = performerData.slice(0, topCount);
  const bottomProducts = performerData.slice(-bottomCount);

  if (topProducts.length) {
    const topNames = topProducts.map(p => `‘${p.name}’`).join(', ').replace(/, ([^,]*)$/, ' and $1');
    growthInsights.push(
      `Your top ${topProducts.length} products this period are: ${topNames}. Consider cross-promoting or creating a special combo.`
    );
    topProducts.forEach(p => usedProducts.add(p.name));
  }
  if (bottomProducts.length) {
    const lowNames = bottomProducts.map(p => `‘${p.name}’`).join(' and ');
    growthInsights.push(
      `${lowNames} are your lowest performing items. Try limited-time discounts, feature as seasonal, or consider replacing them.`
    );
    bottomProducts.forEach(p => usedProducts.add(p.name));
  }
  if (hourlyRevenueData && hourlyRevenueData.length > 1 && hourlyRevenueData.some(d => d.revenue > 0)) {
    let maxSum = 0, startHour = 0;
    for (let i = 0; i < hourlyRevenueData.length - 1; i++) {
      const sum = hourlyRevenueData[i].revenue + hourlyRevenueData[i+1].revenue;
      if (sum > maxSum) { maxSum = sum; startHour = i; }
    }
    const hourLabel = `${startHour}:00–${startHour+1}:59`;
    growthInsights.push(
      `Your busiest hours are ${hourLabel}. Consider special promotions or extra staff during this window.`
    );
  }
  if (growthInsights.length === 0 && performerData.length > 0) {
    growthInsights.push(`‘${performerData[0].name}’ is your top selling product this period. Consider promoting it to boost sales further!`);
    usedProducts.add(performerData[0].name);
  }

  // --- Breakdown chart logic with product column filtering ---
    const breakdowns: Array<{ type: string, col: string | null, chartData: any[] }> = [
    { type: 'category', col: categoryCol, chartData: categoryPieData },
    { type: 'type', col: typeCol, chartData: typePieData },
    { type: 'size', col: sizeCol, chartData: sizeBarData },
    { type: 'storeLocation', col: storeLocationCol, chartData: storeLocationBarData }
  ];
  const seenCols = new Set<string>();
  const uniqueBreakdowns = breakdowns.filter(
    b =>
      b.col &&
      !seenCols.has(b.col) &&
      seenCols.add(b.col as string) &&
      !isProductColumn(b.col)
  );

  // --- Render ---
  return (
    <div className="max-w-7xl mx-auto px-4 pb-8">
      {/* Header and selectors */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Business Dashboard
          </h2>
          <p className="text-lg text-gray-600">
            {businessData.type.replace('_', ' ').charAt(0).toUpperCase() + businessData.type.replace('_', ' ').slice(1)} insights from your data
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {periodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value as string)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {yearOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-mint-500 rounded-lg flex items-center justify-center">
                <kpi.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpi.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {kpi.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
            <div className="text-sm text-gray-500">{kpi.title}</div>
          </motion.div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trends (Monthly) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trends (Monthly)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} dot />
              <ReferenceLine y={0} stroke="red" label="Avg" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Top Products by Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Revenue</h3>
          {productCol ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performerData.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={200}
                  tickFormatter={name =>
                    name.length > 18 ? name.slice(0, 17) + "…" : name
                  }
                  tick={{ fontSize: 13, fontWeight: 500 }}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label) => {
                    const full = performerData.find(p => (p.name.length > 18 ? p.name.slice(0, 17) + "…" : p.name) === label)?.name || label;
                    return full;
                  }}
                />
                <Bar dataKey="revenue" fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-center">No product column detected.</div>
          )}
        </motion.div>
      </div>
      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {uniqueBreakdowns.length > 0 ? uniqueBreakdowns.map(({ type, col, chartData }) => {
          // SIZE BAR (COUNT) -- always bar, never pie!
          if (type === 'size' && chartData.length > 0) {
            return (
              <div key={type} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4">{LABEL_CASE(col!)} Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip formatter={(value: number) => [value, 'Count']} />
                    <Bar dataKey="value" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          }
          // CATEGORY PIE
          if (type === 'category' && chartData.length > 0) {
            return (
              <div key={type} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4">{LABEL_CASE(col!)} Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            );
          }
          // TYPE PIE
          if (type === 'type' && chartData.length > 0) {
            return (
              <div key={type} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4">{LABEL_CASE(col!)} Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            );
          }
          // STORE LOCATION BAR (REVENUE)
          if (type === 'storeLocation' && chartData.length > 0) {
            return (
              <div key={type} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4">{LABEL_CASE(col!)} Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={v => `$${Number(v).toLocaleString()}`} />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip formatter={value => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          }
          return null;
        }) : (
          <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-center text-gray-500">
            No suitable breakdown column found for your data.
          </div>
        )}
      </div>
      {/* Hourly Sales Pattern (full width) */}
      <div className="mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Sales Pattern</h3>
          <ResponsiveContainer width="100%" height={400} minWidth={700}>
            {mappedColumns.time && hourlyRevenueData.some(d => d.revenue > 0) ? (
              <BarChart data={hourlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis label={{ value: 'Total Revenue', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Total Revenue']} />
                <Bar dataKey="revenue" fill="#0ea5e9" />
              </BarChart>
            ) : (
              <div className="text-gray-500 text-center w-full mt-10">No hourly data available.</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>
      {/* Customer Loyalty & Retention Charts */}
      <div className="mb-8">
        <CustomerCharts data={filteredData} />
      </div>
      {/* Top/Bottom Performers & Growth Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top 5 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Performers</h3>
          <div className="space-y-4">
            {productCol ? (
              top5Performers.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-700">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]" title={product.name}>
                      {product.name}
                    </span>
                  </div>
                  <span className="text-green-600 font-medium">${product.revenue.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center">No product column detected.</div>
            )}
          </div>
        </motion.div>
        {/* Bottom 5 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bottom 5 Performers</h3>
          <div className="space-y-4">
            {productCol ? (
              bottom5Performers.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-medium text-red-700">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]" title={product.name}>
                      {product.name}
                    </span>
                  </div>
                  <span className="text-red-600 font-medium">${product.revenue.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center">No product column detected.</div>
            )}
          </div>
        </motion.div>
        {/* Growth Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Opportunities</h3>
          <div className="space-y-4">
            {growthInsights.length > 0 ? (
              growthInsights.map((text, idx) => (
                <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">{text}</p>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center">
                No actionable insights detected for this period.
              </div>
            )}
          </div>
        </motion.div>
      </div>
      {/* Key Insights & Next Moves */}
      <InsightAssistant
        businessData={{
          ...businessData,
          data: filteredData
        }}
        usedProductNames={Array.from(usedProducts)}
        performerData={performerData}
        periodLabel={periodOptions.find(opt => opt.value === selectedPeriod)?.label || ""}
      />
      {/* Navigation */}
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
        <div className="text-sm text-gray-500 flex items-center">
          Dashboard generated • {new Date().toLocaleDateString()} • Showing {periodOptions.find(opt => opt.value === selectedPeriod)?.label}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;