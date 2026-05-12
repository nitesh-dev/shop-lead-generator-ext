import React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <nav className={`flex px-4 bg-white border-b border-slate-100 sticky top-0 z-10 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`relative py-4 px-6 text-sm font-medium transition-colors outline-none ${
            activeTab === tab.id 
              ? 'text-indigo-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
      ))}
    </nav>
  );
};
