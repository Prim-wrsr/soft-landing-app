import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Upload, BarChart3, Lightbulb, Star, Shield, Zap, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import Logo from '../components/Logo';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

const LandingPage: React.FC = () => {
  const location = useLocation();

  // Fix: always scroll to top if no hash, else scroll to hash
  React.useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const demoChartData = [
    { month: 'Jan', revenue: 7200 },
    { month: 'Feb', revenue: 6800 },
    { month: 'Mar', revenue: 9000 },
    { month: 'Apr', revenue: 9700 },
    { month: 'May', revenue: 8500 },
    { month: 'Jun', revenue: 11200 },
    { month: 'Jul', revenue: 10800 },
    { month: 'Aug', revenue: 9500 },
    { month: 'Sep', revenue: 10100 },
    { month: 'Oct', revenue: 9900 },
    { month: 'Nov', revenue: 13700 },
    { month: 'Dec', revenue: 14900 }
  ];

  const exampleInsight = 'Sales peaked in December, likely due to holiday demand — consider planning your next seasonal campaign early to maximize year-end revenue.';

  const features = [
    {
      icon: Upload,
      title: 'Smart Upload',
      description: 'Drop any sales file and watch our AI instantly understand your business'
    },
    {
      icon: BarChart3,
      title: 'Beautiful Dashboards',
      description: 'Get custom charts and insights tailored to your industry'
    },
    {
      icon: Lightbulb,
      title: 'AI Recommendations',
      description: 'Receive smart suggestions to grow your business'
    },
    {
      icon: TrendingUp,
      title: 'Trend Analysis',
      description: 'Track growth patterns and seasonal insights over time'
    }
  ];

  const testimonials = [
    {
      name: 'Nannie Chen',
      business: 'Bake My Day Studio',
      quote: 'Finally understand which drinks drive my revenue. Soft Landing showed me cold drinks peak at 7am - now I staff accordingly.',
      rating: 5
    },
    {
      name: 'De Pong',
      business: 'Construction Supply Co.',
      quote: 'I thought I needed expensive software. This gives me everything I need to track my best products and regions.',
      rating: 5
    },
    {
      name: 'Emma Thompson',
      business: 'Online Fashion Store',
      quote: 'The seasonal trend predictions helped me plan inventory for Black Friday. Revenue up 40% this quarter!',
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: '1-time',
      price: '$5',
      period: 'single report',
      features: [
        'Complete business analysis',
        'Custom dashboard',
        'AI-powered insights',
        'Export all charts'
      ],
      popular: false
    },
    {
      name: 'Monthly',
      price: '$9',
      period: 'per month',
      features: [
        'Unlimited uploads',
        'Trend tracking',
        'Business Q&A',
        'Email support',
        'Data history'
      ],
      popular: false
    },
    {
      name: '3-month',
      price: '$24',
      period: 'total',
      originalPrice: '$27',
      features: [
        'Everything in Monthly',
        'Seasonal predictions',
        'Advanced comparisons',
        'Priority support'
      ],
      popular: true,
      badge: 'Most Popular'
    },
    {
      name: 'Yearly',
      price: '$79',
      period: 'per year',
      originalPrice: '$108',
      features: [
        'Everything in 3-month',
        'Custom integrations',
        'Phone support',
        'Business consulting',
        'API access'
      ],
      popular: false,
      badge: 'Best Value'
    }
  ];

  const faqs = [
    {
      question: 'What file formats do you support?',
      answer: 'We support CSV, Excel (.xlsx, .xls), and most common export formats from POS systems, e-commerce platforms, and accounting software. Files up to 26MB are supported.'
    },
    {
      question: 'How does the AI understand my business?',
      answer: 'Our smart mapping technology analyzes your column headers, file names, and data patterns to automatically categorize your business type and create relevant insights.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use bank-level encryption and never store your raw data permanently. You can delete your account and all data at any time.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, all subscriptions can be canceled with one click. No contracts, no hidden fees. You keep access until the end of your billing period.'
    },
    {
      question: 'What if I don\'t have a POS system?',
      answer: 'Perfect! Soft Landing is designed for businesses that track sales manually or use simple spreadsheets. Just upload your sales data and we\'ll handle the rest.'
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Turn Your Sales Files into
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-mint-600 block">
                  Clear Business Insights
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
                <strong>Have a POS or CRM? Or none at all? No matter.</strong>
              </p>
              <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto text-center">
                Just upload your file — and we'll turn it into dashboards, smart tips,<br />
                and clear next steps you can actually use.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col items-center mb-8"
            >
              <span className="text-gray-700 font-medium text-base md:text-lg tracking-tight flex flex-row items-center gap-1">
                “Helping your business land softly
                <span className="inline-block align-middle" style={{ marginLeft: '0.2em', marginRight: '0.2em' }}>
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                    <defs>
                      <linearGradient id="parachuteSoftGradient" x1="0" y1="0" x2="32" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0ea5e9"/>
                        <stop offset="1" stopColor="#14b8a6"/>
                      </linearGradient>
                    </defs>
                    {/* Canopy */}
                    <path
                      d="M6 16 Q16 4, 26 16 Q16 11, 6 16 Z"
                      fill="url(#parachuteSoftGradient)"
                      stroke="url(#parachuteSoftGradient)"
                      strokeWidth="2"
                    />
                    {/* Ropes */}
                    <path d="M11 16 Q13 22, 16 28" stroke="url(#parachuteSoftGradient)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    <path d="M16 16 Q16 22, 16 28" stroke="url(#parachuteSoftGradient)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    <path d="M21 16 Q19 22, 16 28" stroke="url(#parachuteSoftGradient)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    {/* Soft Basket */}
                    <ellipse cx="16" cy="28" rx="3" ry="1.2" fill="url(#parachuteSoftGradient)" />
                  </svg>
                </span>
                — with <span className="text-primary-600 font-semibold">Data Made Simple</span>”
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4"
            >
              <Link
                to="/dashboard"
                className="bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors font-medium flex items-center gap-2 text-lg shadow-lg hover:shadow-xl"
              >
                Try With Your First File — No Credit Card Needed
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm text-gray-500 mb-12"
            >
              From Spreadsheets to Smart Insights — in minutes.
            </motion.div>

            {/* Demo Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-mint-500 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="ml-4 text-sm font-medium">Dashboard Preview</div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-gray-900">$14,000</div>
                      <div className="text-sm text-gray-500">Monthly Revenue</div>
                      <div className="text-green-500 text-xs">↗ +16.7%</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-gray-900">1,260</div>
                      <div className="text-sm text-gray-500">Total Orders</div>
                      <div className="text-green-500 text-xs">↗ +6.3%</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-gray-900">$52.38</div>
                      <div className="text-sm text-gray-500">Avg Order Value</div>
                      <div className="text-green-500 text-xs">↗ +4.8%</div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">Sales Trend Over Period</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={demoChartData}>
                          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-sm text-gray-600 mt-4 italic">💡 {exampleInsight}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From data upload to actionable insights, we've streamlined the entire process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-mint-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Insights in 3 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Upload Your Data',
                description: 'Drop your sales file (CSV, Excel up to 26MB) or let us auto-detect your business type',
                icon: Upload
              },
              {
                step: '2',
                title: 'Smart Processing',
                description: 'Our AI cleans and analyzes your data, creating custom dashboards',
                icon: Zap
              },
              {
                step: '3',
                title: 'Get Insights',
                description: 'Receive actionable recommendations and track your business growth',
                icon: TrendingUp
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center relative"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-mint-500 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>

                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-primary-300 to-transparent -z-10"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Growing Businesses
            </h2>
            <p className="text-xl text-gray-600">
              See how Soft Landing helps business owners make smarter decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.business}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-primary-50 to-mint-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Smart Insights for the Price of a Coffee
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start free, upgrade as you grow. Our plans are built for small businesses.
            </p>
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
              <CheckCircle className="w-4 h-4" />
              First upload is free — no credit card required
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bg-white rounded-xl p-6 shadow-lg relative ${
                  plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                      plan.badge === 'Most Popular'
                        ? 'bg-gradient-to-r from-primary-600 to-mint-600 text-white'
                        : 'bg-yellow-400 text-yellow-900'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-500">
                      <span className="line-through">{plan.originalPrice}</span>
                      <span className="text-green-600 ml-2 font-medium">
                        Save {Math.round((1 - parseInt(plan.price.replace('$', '')) / parseInt(plan.originalPrice.replace('$', ''))) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/dashboard"
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors text-center block ${
                    plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Try With Your First File
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Make better decisions for less than a cup of coffee per week.
            </p>
            <p className="text-sm text-gray-500">
              Best for committed shops who want to track progress over time.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
          About Soft Landing
        </h2>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 text-lg font-semibold text-primary-600 flex flex-col items-center">
              <span>
                At Soft Landing, we believe in…<br />
                <span className="text-gray-700 font-medium text-base md:text-lg tracking-tight">
                  Helping your business land softly — with <span className="text-primary-600 font-semibold">Data Made Simple</span>.
                </span>
              </span>
            </div>
            <p className="text-xl text-gray-600 leading-relaxed">
              Soft Landing is a friendly, AI-powered dashboard app designed for small business owners. It turns your sales files into smart, actionable insights—no complicated tools or formulas needed.<br /><br />
            
            Just upload a clean sales spreadsheet, and we’ll instantly transform it into beautiful dashboards and practical tips you can actually use—no tech skills required.<br /><br />
              We believe your business deserves access to powerful analytics.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-700">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-mint-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Data?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join hundreds of business owners who've already discovered the power of data-driven decisions
            </p>
            <Link
              to="/dashboard"
              className="bg-white text-primary-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors font-medium inline-flex items-center gap-2 text-lg shadow-lg"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3">
                <Logo size={32} showText={true} className="text-white" />
              </div>
              <p className="text-gray-400 mt-4 max-w-md">
                Built for small business owners — without the complexity.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to={{ pathname: "/", hash: "" }} className="hover:text-white transition-colors">Home</Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                </li>
                <li>
                  <Link to={{ pathname: "/", hash: "#pricing" }} className="hover:text-white transition-colors">Pricing</Link>
                </li>
                <li>
                  <Link to={{ pathname: "/", hash: "#about" }} className="hover:text-white transition-colors">About</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2025 Soft Landing. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Bolt.new Badge - required for hackathon */}
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 1000,
          borderRadius: '50%',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
          transition: 'box-shadow 0.3s',
        }}
        className="bolt-badge"
        aria-label="Built with Bolt.new"
      >
        <img
          src="https://storage.bolt.army/black_circle_360x360.png"
          alt="Built with Bolt.new badge"
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            display: 'block',
            transition: 'transform 0.3s',
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.08) rotate(8deg)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1) rotate(0deg)')}
        />
      </a>
    </div>
  );
};

export default LandingPage;