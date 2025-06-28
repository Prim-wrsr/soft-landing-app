import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle, Target, ArrowRight } from 'lucide-react';
import { BusinessData } from '../pages/Dashboard';
import { parseDateTime } from './dateUtils';

interface InsightAssistantProps {
  businessData: BusinessData;
  usedProductNames?: string[];
  performerData?: { name: string; revenue: number }[];
  periodLabel?: string;
}

const InsightAssistant: React.FC<InsightAssistantProps> = ({
  businessData,
  usedProductNames = [],
  performerData = [],
  periodLabel
}) => {
  // Only use the current filtered data for insight generation for accuracy
  const mappedColumns = businessData.mappedColumns;
  const filteredData = businessData.data;

  const generateInsights = () => {
    const { type } = businessData;
    const insights: any[] = [];
    const addedTypes = new Set<string>();

    // Helper to ensure only unique insight types are added
    const addInsight = (insight: any) => {
      if (!addedTypes.has(insight.type)) {
        insights.push(insight);
        addedTypes.add(insight.type);
      }
    };

    // Only include top products not already used
    const unusedProducts = performerData.filter(
      p => !usedProductNames.includes(p.name)
    );

    // 1. Product concentration (macro risk)
    if (performerData.length >= 2) {
      const top2Revenue = performerData[0].revenue + performerData[1].revenue;
      const totalRevenue = performerData.reduce((sum, prod) => sum + prod.revenue, 0);
      const concentrationPercent = Math.round((top2Revenue / totalRevenue) * 100);
      addInsight({
        type: 'concentration',
        icon: Target,
        title: 'Product Concentration',
        description: `Your top 2 products ("${performerData[0].name}" and "${performerData[1].name}") make up ${concentrationPercent}% of revenue. This creates both opportunity and risk.`,
        action: 'Consider product diversification or create bundles with complementary items.',
        priority: concentrationPercent > 70 ? 'high' : 'medium',
        color: concentrationPercent > 70 ? 'orange' : 'blue'
      });
    }

    // 2. Product opportunity if there's a strong "trend" product not already used
    const trendProduct = unusedProducts.find(p => /organic|vegan|sustain|plant/i.test(p.name));
    if (trendProduct) {
      addInsight({
        type: 'trend',
        icon: TrendingUp,
        title: 'Consumer Trend Opportunity',
        description: `‘${trendProduct.name}’ aligns with health/eco trends. Leverage this momentum in your marketing.`,
        action: `Promote ‘${trendProduct.name}’ with messaging around healthy or sustainable choices.`,
        priority: 'medium',
        color: 'green'
      });
    }

    // 3. Data-driven seasonal insight
    const monthlySales = Array(12).fill(0);
    filteredData.forEach(row => {
      const date = parseDateTime(row[mappedColumns.date], mappedColumns.time ? row[mappedColumns.time] : undefined);
      if (!date) return;
      const month = date.getMonth(); // 0: Jan, 11: Dec
      const revenue = parseFloat(row[mappedColumns.revenue] || '0');
      monthlySales[month] += isNaN(revenue) ? 0 : revenue;
    });

    const avgMonthlySales = monthlySales.reduce((a, b) => a + b, 0) / 12;
    // Find up to 3 peak months with >10% above avg sales
    const peakMonths = monthlySales
      .map((value, idx) => ({
        month: idx,
        value,
        pct: avgMonthlySales === 0 ? 0 : ((value - avgMonthlySales) / avgMonthlySales)
      }))
      .filter(m => m.pct > 0.10)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    if (peakMonths.length) {
      const monthNames = peakMonths.map(pm =>
        new Date(2000, pm.month, 1).toLocaleString('en-US', { month: 'long' })
      );
      const pctString = peakMonths.map(pm =>
        `${new Date(2000, pm.month, 1).toLocaleString('en-US', { month: 'long' })} (${(pm.pct * 100).toFixed(0)}% above avg)`
      ).join(', ');
      addInsight({
        type: 'seasonal',
        icon: Lightbulb,
        title: 'Seasonal Opportunity',
        description: `Based on your data, sales peak in ${monthNames.join(', ')}. For example: ${pctString}.`,
        action: `Prepare inventory, staffing, and campaigns for these high-demand months.`,
        priority: 'medium',
        color: 'mint'
      });
    } else {
      // fallback, little seasonality
      addInsight({
        type: 'seasonal',
        icon: Lightbulb,
        title: 'Seasonal Opportunity',
        description: `No strong seasonality detected—sales are relatively stable throughout the year.`,
        action: 'Maintain steady inventory and marketing, but watch for new trends.',
        priority: 'medium',
        color: 'mint'
      });
    }

    // 4. Strategic, business-type-specific insight (not tactical, use hourly sales pattern if available)
    if (type === 'restaurant') {
      addInsight({
        type: 'timing',
        icon: AlertTriangle,
        title: 'Peak Hour Optimization',
        description: 'Analyze your actual hourly sales pattern and optimize staffing and inventory for your busiest times, not just lunch hours. Consider running breakfast/lunch specials based on your peak sales window.',
        action: 'Use the “Hourly Sales Pattern” chart above to find and target your peak hours.',
        priority: 'high',
        color: 'orange'
      });
    } else if (type === 'online_seller') {
      addInsight({
        type: 'regional',
        icon: TrendingUp,
        title: 'Sales Channel Performance',
        description: 'Online sales patterns suggest strong customer engagement. Consider expanding your digital presence.',
        action: 'Invest in SEO, social media marketing, and customer retention programs.',
        priority: 'medium',
        color: 'purple'
      });
    } else if (type === 'construction') {
      addInsight({
        type: 'seasonal_construction',
        icon: Lightbulb,
        title: 'Seasonal Planning',
        description: 'Construction materials typically see increased demand in March–October. Plan inventory accordingly.',
        action: 'Stock up on high-demand materials before spring construction season.',
        priority: 'medium',
        color: 'mint'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-50 border-green-200 text-green-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      mint: 'bg-mint-50 border-mint-200 text-mint-800',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors = {
      green: 'text-green-600',
      blue: 'text-blue-600',
      orange: 'text-orange-600',
      purple: 'text-purple-600',
      mint: 'text-mint-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-8 mt-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-mint-500 rounded-xl flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Key Insights & Next Moves</h2>
          <p className="text-gray-600">Data-powered recommendations for your business</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`border rounded-xl p-6 ${getColorClasses(insight.color)}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center ${getIconColor(insight.color)}`}>
                <insight.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    insight.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {insight.priority} priority
                  </span>
                </div>
                <p className="text-gray-700 mb-3 text-sm leading-relaxed">
                  {insight.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <ArrowRight className="w-4 h-4" />
                  {insight.action}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-mint-50 rounded-xl border border-primary-200">
        <h3 className="font-semibold text-gray-900 mb-2">Executive Summary</h3>
        <p className="text-gray-700 text-sm leading-relaxed">
          Your {businessData.type.replace('_', ' ')} business shows strong potential with {insights.length} key opportunities identified for {periodLabel || "the current period"}. 
          Focus on high-priority actions first, then work through medium-priority improvements to maximize your growth potential.
        </p>
      </div>
    </motion.div>
  );
};

export default InsightAssistant;