import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  PageName,
  UploadData,
  DetectionData,
  CounterfactualData,
  ProgressionData,
  ReportData
} from '../types';

interface AnalysisContextType {
  currentPage: PageName;
  setCurrentPage: (page: PageName) => void;
  uploadData: UploadData | null;
  setUploadData: (data: UploadData | null) => void;
  detectionData: DetectionData | null;
  setDetectionData: (data: DetectionData | null) => void;
  counterfactualData: CounterfactualData | null;
  setCounterfactualData: (data: CounterfactualData | null) => void;
  progressionData: ProgressionData | null;
  setProgressionData: (data: ProgressionData | null) => void;
  reportData: ReportData | null;
  setReportData: (data: ReportData | null) => void;
  resetWorkflow: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageName>('home');
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null);
  const [counterfactualData, setCounterfactualData] = useState<CounterfactualData | null>(null);
  const [progressionData, setProgressionData] = useState<ProgressionData | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const resetWorkflow = () => {
    setUploadData(null);
    setDetectionData(null);
    setCounterfactualData(null);
    setProgressionData(null);
    setReportData(null);
    setCurrentPage('home');
  };

  return (
    <AnalysisContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        uploadData,
        setUploadData,
        detectionData,
        setDetectionData,
        counterfactualData,
        setCounterfactualData,
        progressionData,
        setProgressionData,
        reportData,
        setReportData,
        resetWorkflow,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};

