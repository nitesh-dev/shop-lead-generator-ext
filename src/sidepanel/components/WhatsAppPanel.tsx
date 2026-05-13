import React, { useState, useEffect } from 'react';
import { extensionApi } from '../../services/extensionApi';
import { Card, Button, Table } from '../../components/ui';

export const WhatsAppPanel: React.FC = () => {
  const [template, setTemplate] = useState('');
  const [waLimit, setWaLimit] = useState(10);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    loadData();

    // Set up a listener for storage changes to refresh the UI when leads are updated
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.leads || changes.settings) {
        loadData();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const loadData = async () => {
    const settings = await extensionApi.getSettings();
    if (settings?.messageTemplate) setTemplate(settings.messageTemplate);
    if (settings?.whatsappLimit) setWaLimit(settings.whatsappLimit);
    const allLeads = await extensionApi.getAllLeads();
    setLeads(allLeads);
  };

  const handleSave = async () => {
    // ...existing code...
  };

  const handleResetStatus = async () => {
    if (confirm('Reset all leads status to "pending"? This will allow you to message them again.')) {
      await extensionApi.resetLeadsStatus();
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: (lead: any) => (
        <div className="font-bold text-slate-800  sm:max-w-[140px]">
          {lead.shopData?.name}
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: (lead: any) => (
        <div className="text-slate-500 font-mono text-[10px]">
          {lead.shopData?.phone}
        </div>
      ),
    },
    {
      header: 'Web',
      className: 'text-center',
      accessor: (lead: any) => (
        lead.shopData?.website ? (
          <span className="text-blue-500" title="Has Website">🌐</span>
        ) : <span className="text-slate-300">-</span>
      ),
    },
    {
      header: 'Status',
      accessor: (lead: any) => {
        const status = lead.status || 'pending';
        const styles: Record<string, string> = {
          pending: 'bg-amber-50 text-amber-600 border-amber-100',
          sent: 'bg-green-50 text-green-600 border-green-100',
          failed: 'bg-red-50 text-red-600 border-red-100'
        };

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${styles[status]}`}>
            {status}
          </span>
        );
      },
    }
  ];

  return (
    <div className="space-y-4 pb-10">
      <Card title="Message Configuration">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-600">Send Limit (Queue)</label>
              <input 
                type="number" 
                value={waLimit} 
                onChange={(e) => setWaLimit(parseInt(e.target.value))}
                min="1"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-600">Message Template</label>
              <textarea 
                value={template} 
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Hello {{name}}, I found your shop..."
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-whatsapp focus:border-transparent transition-all outline-none resize-none text-sm leading-relaxed"
              />
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-400 font-medium italic">Use {"{{name}}"} for replacement.</p>
                <div className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Draft</div>
              </div>
            </div>
          </div>
          <Button variant="whatsapp" fullWidth onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </Card>

      <Card title="Queue Management" className="overflow-hidden p-0">
        <div className="px-4 py-2 border-b border-slate-100 flex justify-end bg-slate-50/30">
          <Button variant="outline" className="!py-1 !px-2 !text-[11px]" onClick={handleResetStatus}>
            Reset All to Pending
          </Button>
        </div>
        <Table 
          columns={columns} 
          data={leads} 
          emptyMessage="Queue is empty. Find leads in the Maps tab first!"
        />
      </Card>
    </div>
  );
};

