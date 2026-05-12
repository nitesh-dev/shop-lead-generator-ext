import React, { useState, useEffect } from 'react';
import { extensionApi } from '../../services/extensionApi';
import { Card, Button, Input, Table } from '../../components/ui';

export const MapsPanel: React.FC = () => {
  const [limit, setLimit] = useState(10);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await extensionApi.getSettings();
    if (settings?.limit) setLimit(settings.limit);
    const allLeads = await extensionApi.getAllLeads();
    setLeads(allLeads);
  };

  const handleSave = async () => {
    await extensionApi.updateSettings({ limit });
  };

  const columns = [
    {
      header: 'Name',
      accessor: (lead: any) => (
        <div className="font-bold text-slate-800 leading-tight">
          {lead.shopData?.name || 'Unknown'}
          {lead.shopData?.category && (
            <div className="text-[9px] text-slate-400 uppercase font-semibold">
              {lead.shopData.category}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Website',
      className: 'text-center',
      accessor: (lead: any) => (
        lead.shopData?.website ? (
          <a 
            href={lead.shopData.website} 
            target="_blank" 
            rel="noreferrer"
            className="text-blue-500 hover:text-blue-700 text-lg transition-transform hover:scale-110 inline-block"
            title="Visit Website"
          >
            🌐
          </a>
        ) : <span className="text-slate-300">-</span>
      ),
    },
    {
      header: 'Contact',
      accessor: (lead: any) => (
        lead.shopData?.phone ? (
          <div className="whitespace-nowrap text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-medium">
            {lead.shopData.phone}
          </div>
        ) : <span className="text-slate-300">-</span>
      ),
    },
    {
      header: 'Location',
      accessor: (lead: any) => (
        <div 
          className="text-[10px] text-slate-500 min-w-[150px] max-w-[250px] leading-relaxed break-words" 
          title={lead.shopData?.address}
        >
          {lead.shopData?.address || 'N/A'}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-4 pb-10">
      <Card title="Scraping Configuration">
        <div className="space-y-4">
          <Input 
            label="Scrape Limit"
            type="number" 
            value={limit} 
            onChange={(e) => setLimit(parseInt(e.target.value))}
            min="1"
          />
          <Button fullWidth onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </Card>

      <Card title={`Leads (${leads.length})`} className="overflow-hidden p-0">
        <Table 
          columns={columns} 
          data={leads} 
          emptyMessage="No leads found yet. Start scraping from Google Maps!"
        />
      </Card>
    </div>
  );
};

