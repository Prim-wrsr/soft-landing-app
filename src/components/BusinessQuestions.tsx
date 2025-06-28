import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, User, BarChart3, Search, Send, ChevronRight } from 'lucide-react';
import { BusinessData } from '../pages/Dashboard';

interface BusinessQuestionsProps {
  businessData: BusinessData;
}

// Improved: Roles generalized for small business, smarter answers, robust free-text
const roleQuestions = {
  owner: [
    "What are my top 5 products by revenue?",
    "Which products are underperforming?",
    "What's my profit margin by category?",
    "Which periods show the highest growth?",
    "What's my average order value trend?"
  ],
  marketing: [
    "What customer segments are growing?",
    "When do we see sales performance peaks?",
    "Which products have seasonal trends?",
    "What's our customer retention pattern?",
    "Which marketing channels drive most sales?"
  ],
  operations: [
    "What are my peak sale times?",
    "How do repeat customers compare to new ones?",
    "What inventory should I restock?",
    "Which days of the week perform best?",
    "What's my best-selling product category?"
  ]
};

const roleOptions = [
  { id: 'owner', name: 'Owner/Manager', icon: User, description: 'Revenue, profits, strategy' },
  { id: 'marketing', name: 'Marketing', icon: BarChart3, description: 'Campaigns, trends, segments' },
  { id: 'operations', name: 'Operations', icon: Search, description: 'Inventory, scheduling, sales times' }
];

const BusinessQuestions: React.FC<BusinessQuestionsProps> = ({ businessData }) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [answers, setAnswers] = useState<Array<{ question: string; answer: string; chart?: any }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Smarter AI Answer Logic ---
  const generateAnswer = (question: string): string => {
    const { type, data, mappedColumns } = businessData;
    // Defensive: if not enough data, fallback
    if (!Array.isArray(data) || !mappedColumns || !mappedColumns.product || !mappedColumns.revenue) {
      return "Not enough data to answer. Please upload a file with product names and revenue columns.";
    }

    // Build product sales map, total revenue, and monthly sales
    const productMap = new Map<string, number>();
    let totalRevenue = 0;
    let orderCount = 0;
    let revenueByMonth = Array(12).fill(0);
    let orderCountByMonth = Array(12).fill(0);

    data.forEach(row => {
      const product = row[mappedColumns.product] || 'Unknown Product';
      const revenue = parseFloat(row[mappedColumns.revenue] || '0');
      if (!isNaN(revenue)) {
        totalRevenue += revenue;
        orderCount += 1;
        productMap.set(product, (productMap.get(product) || 0) + revenue);
      }
      if (mappedColumns.date) {
        const date = new Date(row[mappedColumns.date]);
        if (!isNaN(date.getTime())) {
          const m = date.getMonth();
          revenueByMonth[m] += isNaN(revenue) ? 0 : revenue;
          orderCountByMonth[m] += 1;
        }
      }
    });

    const avgOrderValue = totalRevenue / (orderCount || 1);

    // Top and bottom products
    const sortedProducts = Array.from(productMap.entries()).sort(([, a], [, b]) => b - a);
    const topProducts = sortedProducts.slice(0, 5);
    const bottomProducts = sortedProducts.slice(-3);

    // Data-driven monthly sales trend
    const avgMonthRevenue = revenueByMonth.reduce((a, b) => a + b, 0) / 12;
    const peakMonthIdx = revenueByMonth.indexOf(Math.max(...revenueByMonth));
    const peakMonthName = new Date(2000, peakMonthIdx, 1).toLocaleString('en-US', { month: 'long' });
    const peakMonthPct = avgMonthRevenue ? ((revenueByMonth[peakMonthIdx] - avgMonthRevenue) / avgMonthRevenue) : 0;

    // Template answers
    const q = question.toLowerCase();

    if (q.match(/top.*(product|item)/)) {
      if (!topProducts.length) return "I couldn't find product revenue data in your file. Please ensure your data includes product names and revenue.";
      const text = topProducts.map(([name, revenue], idx) => `${idx + 1}. ${name} ($${revenue.toLocaleString()})`).join(', ');
      const pct = Math.round(topProducts.reduce((sum, [, r]) => sum + r, 0) / totalRevenue * 100);
      return `Your top ${topProducts.length} products by revenue: ${text}. These account for ${pct}% of your total revenue ($${totalRevenue.toLocaleString()}).`;
    }

    if (q.match(/underperform|bottom|least.*(product|item)/)) {
      if (!bottomProducts.length) return "Not enough data to identify underperformers.";
      const text = bottomProducts.map(([name, revenue]) => `${name} ($${revenue.toLocaleString()})`).join(', ');
      return `The lowest performing products: ${text}. Consider promotions, placement changes, or replacing them.`;
    }

    if (q.match(/average.*order.*value|aov/)) {
      if (!orderCount) return "Not enough data for average order value.";
      return `Your average order value is $${avgOrderValue.toFixed(2)} across ${orderCount} transactions. ${avgOrderValue > 50 ? 'Great job!' : 'Consider upselling or bundling to raise AOV.'}`;
    }

    if (q.match(/profit.*margin/)) {
      if (!mappedColumns.cost && !mappedColumns.expense) {
        return "To analyze profit margin, add cost/expense columns to your data.";
      }
      // (Optional: implement margin logic if cost is available)
      return "Profit margin analysis requires cost data. Please upload a file including product cost/expense.";
    }

    if (q.match(/inventory|restock/)) {
      if (!topProducts.length) return "Need product and sales data for restock suggestions.";
      const restock = topProducts.slice(0, 3).map(([name]) => name).join(', ');
      return `High-demand items to monitor for restocking: ${restock}.`;
    }

    if (q.match(/peak.*(hour|time|period|sale)/)) {
      if (!mappedColumns.date) return "Please include a date column for time-based insights.";
      // Find busiest month, and fallback to typical period by business type
      if (revenueByMonth.some(r => r > 0)) {
        return `Your busiest month is ${peakMonthName}, where sales are ${(peakMonthPct * 100).toFixed(1)}% above average.`;
      }
      return `For ${type.replace('_', ' ')}, typical peak sales times are: ${
        type === 'restaurant' ? 'lunchtime (12–2pm) and dinner (6–8pm)' :
        type === 'online_seller' ? 'evenings (7–10pm) and weekends' :
        'late morning and afternoon'
      }.`;
    }

    if (q.match(/seasonal|trend/)) {
      if (revenueByMonth.some(r => r > 0)) {
        const monthsAboveAvg = revenueByMonth.map((v, i) => v > avgMonthRevenue * 1.10 ? i : -1).filter(i => i !== -1);
        if (monthsAboveAvg.length) {
          const names = monthsAboveAvg.map(m => new Date(2000, m, 1).toLocaleString('en-US', { month: 'long' }));
          return `Your data shows sales peaks in: ${names.join(', ')}. Prepare inventory and marketing for these high-demand months.`;
        }
        return "No strong seasonality detected in your sales data.";
      }
      return "Add a date column to your data to analyze seasonal trends.";
    }

    if (q.match(/customer.*segment|retention|repeat/)) {
      if (!mappedColumns.customer) {
        return "To analyze customer segments or retention, please include a customer ID or customer type column in your data.";
      }
      return "Customer segment and retention analysis is coming soon! (You have customer info in your data, so this will be possible.)";
    }

    if (q.match(/day.*week/)) {
      if (!mappedColumns.date) return "Add a date column to see which days perform best.";
      // Find best day of week
      const dayTotals = Array(7).fill(0);
      data.forEach(row => {
        const date = new Date(row[mappedColumns.date]);
        if (!isNaN(date.getTime())) {
          const dow = date.getDay();
          const revenue = parseFloat(row[mappedColumns.revenue] || '0');
          dayTotals[dow] += isNaN(revenue) ? 0 : revenue;
        }
      });
      const peakDay = dayTotals.indexOf(Math.max(...dayTotals));
      const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][peakDay];
      return `Your best performing day of the week is ${dayName}. Consider running promotions or extra staffing on this day.`;
    }

    if (q.match(/category|best.*category/)) {
      if (!mappedColumns.category) return "Include a product category column for category insights.";
      // Build category revenue
      const catMap = new Map<string, number>();
      data.forEach(row => {
        const cat = row[mappedColumns.category] || 'Unknown Category';
        const revenue = parseFloat(row[mappedColumns.revenue] || '0');
        catMap.set(cat, (catMap.get(cat) || 0) + (isNaN(revenue) ? 0 : revenue));
      });
      const topCat = Array.from(catMap.entries()).sort(([,a], [,b]) => b - a)[0];
      return `Your best-selling category is ${topCat ? `${topCat[0]} ($${topCat[1].toLocaleString()})` : 'N/A'}.`;
    }

    // Default fallback for unmatched/complex questions
    return `I couldn't match your question to a common business insight. Try rephrasing or ask about products, peak times, restocking, or add more columns to your data for deeper analysis.`;
  };

  // --- Handlers ---
  const handleQuestionClick = async (question: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 850)); // Fast for a responsive feel
    const answer = generateAnswer(question);
    setAnswers(prev => [...prev, { question, answer }]);
    setIsLoading(false);
  };

  const handleCustomQuestion = async () => {
    if (!customQuestion.trim()) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1100)); // Simulate AI
    const answer = generateAnswer(customQuestion);
    setAnswers(prev => [...prev, { question: customQuestion, answer }]);
    setCustomQuestion('');
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Questions</h2>
          <p className="text-gray-600">Ask about your business data and get instant, AI-powered insights</p>
        </div>
      </div>

      {/* Role Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose your focus area:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roleOptions.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedRole === role.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <role.icon className={`w-5 h-5 ${selectedRole === role.id ? 'text-primary-600' : 'text-gray-500'}`} />
                <span className="font-medium text-gray-900">{role.name}</span>
              </div>
              <p className="text-sm text-gray-600">{role.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Preset Questions */}
      {selectedRole && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Questions:</h3>
          <div className="space-y-2">
            {roleQuestions[selectedRole as keyof typeof roleQuestions].map((question, index) => (
              <motion.button
                key={question}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleQuestionClick(question)}
                className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group"
                disabled={isLoading}
              >
                <span className="text-gray-700">{question}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Custom Question Input */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask your own question:</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="e.g., What's my best-selling product category?"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomQuestion()}
          />
          <button
            onClick={handleCustomQuestion}
            disabled={!customQuestion.trim() || isLoading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-blue-700">Analyzing your data...</span>
          </div>
        </div>
      )}

      {/* Answers */}
      <AnimatePresence>
        {answers.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200"
          >
            <div className="mb-3">
              <h4 className="font-medium text-gray-900 mb-2">Q: {item.question}</h4>
              <div className="bg-white p-4 rounded-lg border-l-4 border-primary-500">
                <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Answer based on your uploaded file
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty State */}
      {answers.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Select a focus area above or type your own question to get started!</p>
        </div>
      )}
    </motion.div>
  );
};

export default BusinessQuestions;