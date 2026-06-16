import React from 'react';
import { FiFileText, FiCheckCircle, FiUpload, FiUsers, FiCheckSquare, FiDollarSign } from 'react-icons/fi';

const steps = [
  { key: 'PARTIAL', label: 'Partielle', icon: FiFileText, step: 1 },
  { key: 'FINALIZED', label: 'Finalisée', icon: FiCheckCircle, step: 2 },
  { key: 'SUBMITTED', label: 'Soumise', icon: FiUpload, step: 3 },
  { key: 'VALIDATION', label: 'Validation', icon: FiUsers, step: 4 },
  { key: 'APPROVED', label: 'Approuvée', icon: FiCheckSquare, step: 5 },
  { key: 'INDEMNISE', label: 'Indemnisée', icon: FiDollarSign, step: 6 }
];

export const WorkflowTimeline = ({ currentStep, progress }) => {
  const currentIndex = steps.findIndex(s => s.key === currentStep);
  const displayProgress = progress !== undefined ? progress : ((currentIndex + 1) / steps.length) * 100;
  
  return (
    <div className="w-full py-4">
      <div className="relative flex justify-between">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-mutas-500 rounded-full transition-all duration-500" 
            style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }} 
          />
        </div>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <div key={step.key} className="relative flex flex-col items-center z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isCompleted ? 'bg-mutas-500 text-white shadow-lg' : 'bg-gray-200 text-gray-400'
              } ${isCurrent ? 'ring-4 ring-mutas-200 scale-110' : ''}`}>
                <Icon size={20} />
              </div>
              <span className={`text-xs mt-2 font-medium ${isCompleted ? 'text-mutas-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowTimeline;