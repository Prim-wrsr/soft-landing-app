import React from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle, TrendingUp, Calendar, Shield, Zap } from 'lucide-react';

const SubscriptionPrompt: React.FC = () => {
  const plans = [
    {
      name: 'One-Time Report',
      price: '$5',
      period: 'single report',
      description: 'Perfect for a quick business snapshot',
      features: [
        'Complete business analysis',
        'Custom dashboard',
        'AI-powered insights',
        'Export all charts',
        'Email report'
      ],
      color: 'gray',
      popular: false
    },
    {
      name: 'Monthly',
      price: '$9',
      period: 'per month',
      description: 'Stay on top of your business trends',
      features: [
        'Unlimited uploads',
        'Monthly trend tracking',
        'Business Q&A',
        'Email support',
        'Data history (3 months)',
        'Weekly insights'
      ],
      color: 'blue',
      popular: false
    },
    {
      name: '3-month',
      price: '$24',
      period: 'per month',
      originalPrice: '27',
      description: 'Best for seasonal business planning',
      features: [
        'Everything in Monthly',
        'Seasonal predictions',
        'Advanced comparisons',
        'Priority support',
        'Data history (12 months)',
        'Custom KPI tracking'
      ],
      color: 'purple',
      popular: false
    },
    {
      name: 'Yearly',
      price: '$79',
      period: 'per month',
      originalPrice: '108',
      description: 'Maximum value for growing businesses',
      features: [
        'Everything in Quarterly',
        'Unlimited data history',
        'Custom integrations',
        'Phone support',
        'Business consulting (1hr/month)',
        'API access',
        'White-label reports'
      ],
      color: 'gradient',
      popular: true,
      badge: 'Best Value'
    }
  ];

  const getCardClasses = (plan: any) => {
    if (plan.color === 'gradient') {
      return 'bg-gradient-to-br from-primary-500 to-mint-500 text-white border-0 scale-105 shadow-2xl';
    }
    return 'bg-white border border-gray-200 hover:border-primary-300 hover:shadow-lg';
  };

  const getButtonClasses = (plan: any) => {
    if (plan.color === 'gradient') {
      return 'bg-white text-primary-600 hover:bg-gray-50';
    }
    return 'bg-primary-600 text-white hover:bg-primary-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-8"
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Subscribe to Track Growth Over Time</h2>
        </div>
        <p className="text-lg text-gray-600 mb-6">
          Get trend comparisons, seasonal insights, and decision support that gets better with each upload
        </p>
        
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
          <CheckCircle className="w-4 h-4" />
          First month FREE for all plans
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`rounded-xl p-6 transition-all duration-300 relative ${getCardClasses(plan)}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                  {plan.badge}
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className={`text-xl font-bold mb-2 ${plan.color === 'gradient' ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={`text-3xl font-bold ${plan.color === 'gradient' ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.color === 'gradient' ? 'text-white/80' : 'text-gray-500'}`}>
                  /{plan.period}
                </span>
              </div>
              {plan.originalPrice && (
                <div className="text-sm">
                  <span className={`line-through ${plan.color === 'gradient' ? 'text-white/60' : 'text-gray-500'}`}>
                    ${plan.originalPrice}/month
                  </span>
                  <span className={`ml-2 font-medium ${plan.color === 'gradient' ? 'text-yellow-200' : 'text-green-600'}`}>
                    Save {Math.round((1 - parseInt(plan.price.replace('$', '')) / parseInt(plan.originalPrice.replace('$', ''))) * 100)}%
                  </span>
                </div>
              )}
              <p className={`text-sm mt-2 ${plan.color === 'gradient' ? 'text-white/80' : 'text-gray-600'}`}>
                {plan.description}
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center gap-3">
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 ${
                    plan.color === 'gradient' ? 'text-yellow-200' : 'text-green-500'
                  }`} />
                  <span className={`text-sm ${plan.color === 'gradient' ? 'text-white/90' : 'text-gray-700'}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${getButtonClasses(plan)}`}>
              {plan.name === 'One-Time Report' ? 'Get Report' : 'Start Free Trial'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Subscriber Benefits */}
      <div className="bg-gradient-to-br from-primary-50 to-mint-50 rounded-xl p-6 border border-primary-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Why Subscribe? Unlock Powerful Growth Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Trend Tracking</h4>
            <p className="text-sm text-gray-600">
              Compare month-over-month, quarter-over-quarter performance with visual trend lines
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-mint-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Seasonal Predictions</h4>
            <p className="text-sm text-gray-600">
              Predict high-cost months, seasonal dips, and plan inventory accordingly
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Real-time Alerts</h4>
            <p className="text-sm text-gray-600">
              Get notified about significant changes, opportunities, and potential issues
            </p>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>No contracts</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span>30-day guarantee</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SubscriptionPrompt;