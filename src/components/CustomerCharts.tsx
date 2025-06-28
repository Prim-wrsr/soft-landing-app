import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parse } from "date-fns";

const COLORS = [
  "#0ea5e9",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

interface DataRow {
  customer_id?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  order_date?: string;
  sales_per_order?: string | number;
  order_id?: string;
  customer_segment?: string;
  [key: string]: any;
}

interface Props {
  data: DataRow[];
}

/**
 * Utility: Safely parse order_date string to yyyy-MM format
 */
function getMonth(row: DataRow): string | null {
  if (!row.order_date) return null;
  try {
    const d = parse(row.order_date, "dd-MM-yyyy", new Date());
    return format(d, "yyyy-MM");
  } catch {
    return null;
  }
}

/**
 * Utility: Get customer label (prefer first/last name, fallback to ID)
 */
function getCustomerLabel(row: DataRow): string {
  const { customer_first_name, customer_last_name, customer_id } = row;
  if (customer_first_name && customer_last_name)
    return `${customer_first_name} ${customer_last_name}`;
  if (customer_id) return customer_id;
  return "Unknown";
}

const CustomerCharts: React.FC<Props> = ({ data }) => {
  // 1. Check for relevant columns
  const hasCustomerId = data.some((row) => !!row.customer_id);
  const hasOrderDate = data.some((row) => !!row.order_date);

  // 2. Loyalty: Top Customers by Order Count
  const loyaltyBarData = useMemo(() => {
    if (!hasCustomerId) return [];
    const map = new Map<string, number>();
    data.forEach((row) => {
      const label = getCustomerLabel(row);
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data, hasCustomerId]);

  // 3. Retention: Unique Customers per Month
  const retentionLineData = useMemo(() => {
    if (!hasCustomerId || !hasOrderDate) return [];
    const monthMap = new Map<string, Set<string>>();
    data.forEach((row) => {
      const month = getMonth(row);
      if (!month || !row.customer_id) return;
      if (!monthMap.has(month)) monthMap.set(month, new Set());
      monthMap.get(month)!.add(row.customer_id);
    });
    return Array.from(monthMap.entries())
      .map(([month, set]) => ({ month, uniqueCustomers: set.size }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data, hasCustomerId, hasOrderDate]);

  // 4. Customer Segment Pie Chart
  const segmentPieData = useMemo(() => {
    if (!data.some((row) => !!row.customer_segment)) return [];
    const map = new Map<string, number>();
    data.forEach((row) => {
      const seg = row.customer_segment || "Unknown";
      map.set(seg, (map.get(seg) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([segment, count]) => ({ segment, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  // 5. Conditional Rendering
  if (!hasCustomerId && !hasOrderDate && !segmentPieData.length) {
    return (
      <div className="p-6 bg-white rounded-xl shadow">
        <p className="text-center text-gray-500">
          No customer or order date information available for loyalty/retention analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Loyalty Bar Chart */}
      {loyaltyBarData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Top Loyal Customers</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={loyaltyBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                width={160}
                tick={{ fontSize: 13, fontWeight: 500 }}
                tickFormatter={(name: string) =>
                  name.length > 18 ? name.slice(0, 17) + "…" : name
                }
              />
              <Tooltip
                formatter={(value: number) => [`${value}`, "Order Count"]}
                labelFormatter={(label: string) => {
                  const full = loyaltyBarData.find(
                    (d) =>
                      (d.name.length > 18
                        ? d.name.slice(0, 17) + "…"
                        : d.name) === label
                  )?.name;
                  return full || label;
                }}
              />
              <Bar dataKey="count" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Retention Line Chart */}
      {retentionLineData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Customer Retention Over Time</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={retentionLineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="uniqueCustomers" stroke="#14b8a6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Segment Pie Chart */}
      {segmentPieData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Customer Segment Breakdown</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={segmentPieData}
                dataKey="count"
                nameKey="segment"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={({ segment, percent }) =>
                  `${segment} ${(percent * 100).toFixed(0)}%`
                }
              >
                {segmentPieData.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${value}`,
                  "Customers",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CustomerCharts;