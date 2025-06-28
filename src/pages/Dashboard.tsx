import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import BusinessTypeSelector from '../components/BusinessTypeSelector';
import DataUpload from '../components/DataUpload';
import DataHealthCheck from '../components/DataHealthCheck';
import DashboardView from '../components/DashboardView';
import BusinessQuestions from '../components/BusinessQuestions';
import SubscriptionPrompt from '../components/SubscriptionPrompt';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { Save, History, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

export interface BusinessData {
  type: string;
  file: File | null;
  data: any[];
  mappedColumns: Record<string, string>;
  healthScore: number;
  isClean: boolean;
}

const Dashboard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessData, setBusinessData] = useState<BusinessData>({
    type: '',
    file: null,
    data: [],
    mappedColumns: {},
    healthScore: 0,
    isClean: false
  });
  const [currentDataId, setCurrentDataId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { user } = useAuth();
  const { userDataList, loading, saveUserData, updateUserData, deleteUserData } = useUserData();

  const steps = [
    { id: 1, title: 'Business Type', component: BusinessTypeSelector },
    { id: 2, title: 'Upload Data', component: DataUpload },
    { id: 3, title: 'Data Check', component: DataHealthCheck },
    { id: 4, title: 'Dashboard', component: DashboardView }
  ];

  const currentStepData = steps.find(step => step.id === currentStep);
  const CurrentComponent = currentStepData?.component;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveData = async () => {
    if (currentDataId) {
      await updateUserData(currentDataId, businessData);
    } else {
      const savedData = await saveUserData(businessData);
      if (savedData) {
        setCurrentDataId(savedData.id);
      }
    }
  };

  const handleLoadData = (userData: any) => {
    setBusinessData({
      type: userData.business_type,
      file: null, // We don't store the actual file
      data: userData.data,
      mappedColumns: userData.mapped_columns,
      healthScore: userData.health_score,
      isClean: userData.is_clean
    });
    setCurrentDataId(userData.id);
    setCurrentStep(4); // Go directly to dashboard
    setShowHistory(false);
    toast.success('Data loaded successfully!');
  };

  const handleDeleteData = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this data? This action cannot be undone.')) {
      const success = await deleteUserData(id);
      if (success && currentDataId === id) {
        // Reset current data if we deleted the currently loaded data
        setBusinessData({
          type: '',
          file: null,
          data: [],
          mappedColumns: {},
          healthScore: 0,
          isClean: false
        });
        setCurrentDataId(null);
        setCurrentStep(1);
      }
    }
  };

  const handleNewAnalysis = () => {
    setBusinessData({
      type: '',
      file: null,
      data: [],
      mappedColumns: {},
      healthScore: 0,
      isClean: false
    });
    setCurrentDataId(null);
    setCurrentStep(1);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-mint-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              <History className="w-4 h-4" />
              History ({userDataList.length})
            </button>
            <button
              onClick={handleNewAnalysis}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              New Analysis
            </button>
          </div>
          
          {currentStep === 4 && businessData.isClean && (
            <button
              onClick={handleSaveData}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              {currentDataId ? 'Update' : 'Save'} Analysis
            </button>
          )}
        </div>

        {/* History Panel */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Previous Analyses</h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : userDataList.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No saved analyses yet. Complete your first analysis to see it here!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userDataList.map((userData) => (
                  <div key={userData.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 truncate">{userData.file_name}</h4>
                      <button
                        onClick={() => handleDeleteData(userData.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {userData.business_type.replace('_', ' ')} • {userData.data?.length || 0} rows
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      Health Score: {userData.health_score}% • {new Date(userData.created_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleLoadData(userData)}
                      className="w-full bg-primary-600 text-white py-2 px-3 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      Load Analysis
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  currentStep >= step.id 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-1 mx-4 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {CurrentComponent && (
              <CurrentComponent
                businessData={businessData}
                setBusinessData={setBusinessData}
                onNext={handleNext}
                onBack={handleBack}
                canGoBack={currentStep > 1}
                canGoNext={currentStep < steps.length}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Additional Components for Dashboard View */}
        {currentStep === 4 && businessData.isClean && (
          <div className="mt-8 space-y-8">
            <BusinessQuestions businessData={businessData} />
            <SubscriptionPrompt />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;