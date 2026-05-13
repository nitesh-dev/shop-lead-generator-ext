import React, { useState, useEffect } from "react";
import { extensionApi } from "../../services/extensionApi";
import { Card, Button, Input, Table } from "../../components/ui";

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

  const handleExport = () => {
    const dataStr = JSON.stringify(leads, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `leads-export-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          const result = await extensionApi.importLeads(json);
          alert(`Successfully imported ${result.count} new leads!`);
          loadData();
        } else {
          alert("Invalid file format. Please upload a JSON array of leads.");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = "";
  };

  const handleClear = async () => {
    if (
      confirm(
        "Are you sure you want to clear all leads? This cannot be undone."
      )
    ) {
      await extensionApi.clearAllLeads();
      loadData();
    }
  };

  const columns = [
    {
      header: "Name",
      accessor: (lead: any) => (
        <div className="font-bold text-slate-800 leading-tight">
          {lead.shopData?.name || "Unknown"}
          {lead.shopData?.category && (
            <div className="text-[9px] text-slate-400 uppercase font-semibold">
              {lead.shopData.category}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Website",
      className: "text-center",
      accessor: (lead: any) =>
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
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
    {
      header: "Contact",
      accessor: (lead: any) =>
        lead.shopData?.phone ? (
          <div className="whitespace-nowrap text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-medium">
            {lead.shopData.phone}
          </div>
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
    {
      header: "Location",
      accessor: (lead: any) => (
        <div
          className="text-[10px] text-slate-500 min-w-[150px] max-w-[250px] leading-relaxed break-words"
          title={lead.shopData?.address}
        >
          {lead.shopData?.address || "N/A"}
        </div>
      ),
    },
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
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave}>
              Save Settings
            </Button>
            <Button
              variant="ghost"
              onClick={handleClear}
              className="border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
            >
              Clear All
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`Leads (${leads.length})`} className="overflow-hidden p-0">
        <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center gap-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            Data Management
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="px-3 border-1 !border-slate-200 py-1.5 text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
              onClick={handleExport}
            >
              Export
            </Button>
            <div className="relative group">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Import JSON"
              />
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all duration-200"
              >
                Import
              </Button>
            </div>
          </div>
        </div>
        <Table
          columns={columns}
          data={leads}
          emptyMessage="No leads found yet. Start scraping from Google Maps!"
        />
      </Card>
    </div>
  );
};
