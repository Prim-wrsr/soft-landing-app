import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, ShoppingBag, Building, Wrench, HelpCircle, Sparkle } from 'lucide-react';
import { BusinessData } from '../pages/Dashboard';

interface BusinessTypeSelectorProps {
  businessData: BusinessData;
  setBusinessData: (data: BusinessData) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
}

const businessTypes = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Pizza shops, Cafés, Food service',
    icon: Store,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'online_seller',
    name: 'Online Seller',
    description: 'IG, Shopee, Facebook, Shopify',
    icon: ShoppingBag,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'retail',
    name: 'Retail Store',
    description: 'Physical store, Merchandise',
    icon: Building,
    color: 'from-blue-500 to-cyan-500',
    limitedSupport: true,
    badgeColor: 'yellow'
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Building supplies, Services',
    icon: Wrench,
    color: 'from-yellow-500 to-orange-500',
    limitedSupport: true,
    badgeColor: 'yellow'
  },
  {
    id: 'other',
    name: 'Other / Auto-detect',
    description: 'Let our AI detect your business type',
    icon: HelpCircle,
    color: 'from-gray-500 to-gray-600'
  }
];

// Revised RibbonBadge for more precise right alignment
const RibbonBadge: React.FC<{ text: string; color?: "yellow" | "red" }> = ({
  text,
  color = "yellow"
}) => {
  const bg =
    color === "yellow"
      ? "bg-yellow-400 text-yellow-900"
      : "bg-red-500 text-white";
  return (
    <div
      className="absolute z-10"
      style={{
        top: 18,      // adjust to match card's top padding
        right: 22,    // move a bit more to the right, inside the frame
        width: 92,
        height: 26,
        pointerEvents: "none"
      }}
    >
      <div
        className={`
          rotate-12
          ${bg}
          font-semibold text-xs tracking-wide
          py-1 px-3 shadow
          rounded
          flex items-center justify-center
          w-[92px]
          h-[26px]
          text-center
        `}
        style={{
          boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)"
        }}
      >
        {text}
      </div>
    </div>
  );
};

const detectBusinessType = (fileName: string, headers: string[]): string => {
  const joined = headers.join(' ').toLowerCase() + ' ' + fileName.toLowerCase();
  if (/(dish|menu|table|ingredient|waiter|restaurant)/.test(joined)) return 'restaurant';
  if (/(sku|shopify|cart|order|online|product|storefront)/.test(joined)) return 'online_seller';
  if (/(store|retail|barcode|inventory|pos)/.test(joined)) return 'retail';
  if (/(construction|material|site|project|contractor)/.test(joined)) return 'construction';
  return 'other';
};

const BusinessTypeSelector: React.FC<BusinessTypeSelectorProps> = ({
  businessData,
  setBusinessData,
  onNext,
}) => {
  const [detectedType, setDetectedType] = useState<string | null>(null);

  const handleTypeSelect = (type: string) => {
    setBusinessData({
      ...businessData,
      type
    });
    setDetectedType(null);
  };

  const handleAutoDetect = async () => {
    const headers = businessData.data.length > 0 ? Object.keys(businessData.data[0]) : [];
    const fileName = businessData.file?.name || '';

    const detected = detectBusinessType(fileName, headers);
    setDetectedType(detected);

    if (detected !== 'other') {
      setBusinessData({ ...businessData, type: detected });
    }
  };

  const handleContinue = () => {
    if (businessData.type === 'other') {
      handleAutoDetect();
      if (detectedType && detectedType !== 'other') {
        setBusinessData({ ...businessData, type: detectedType });
        onNext();
      }
    } else if (businessData.type) {
      onNext();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          What type of business do you run?
        </h2>
        <p className="text-lg text-gray-600">
          This helps us create the perfect dashboard for your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {businessTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              businessData.type === type.id
                ? 'border-primary-500 bg-primary-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
            }`}
            onClick={() => handleTypeSelect(type.id)}
          >
            {/* RibbonBadge inside the card, precisely aligned */}
            {type.limitedSupport && (
              <RibbonBadge text="Limited Support" color={type.badgeColor === 'red' ? 'red' : 'yellow'} />
            )}

            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${type.color} flex items-center justify-center mb-4`}>
              <type.icon className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
              {type.name}
            </h3>
            <p className="text-gray-600 text-sm">{type.description}</p>
            {type.limitedSupport && (
              <div className="mt-2 text-yellow-700 text-xs bg-yellow-50 rounded px-2 py-1">
                Dashboards for this type are experimental. Some features may be missing or inaccurate.
              </div>
            )}
            
            {businessData.type === type.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-white rounded-full" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {businessData.type === 'other' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <Sparkle className="w-5 h-5 text-blue-500 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">AI Auto-Detection</h4>
              <p className="text-blue-700 text-sm mb-2">
                Our AI will analyze your file and data to determine the best dashboard for your business.
              </p>
              {detectedType && detectedType !== 'other' && (
                <div className="mt-2 text-blue-900 bg-blue-100 rounded-lg px-4 py-2 text-sm">
                  <strong>Detected business type:</strong> {businessTypes.find(t => t.id === detectedType)?.name || detectedType}
                  <button
                    className="ml-4 text-primary-700 underline"
                    onClick={() => onNext()}
                  >Continue</button>
                </div>
              )}
              {detectedType === 'other' && (
                <div className="mt-2 text-red-800 bg-red-100 rounded-lg px-4 py-2 text-sm">
                  Could not confidently detect your business type. Please select one above or contact support.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={!businessData.type}
          className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 ${
            businessData.type
              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Upload
        </button>
      </div>
    </div>
  );
};

export default BusinessTypeSelector;