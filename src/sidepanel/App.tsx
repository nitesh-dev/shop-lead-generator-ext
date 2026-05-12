import { useState } from 'react'
import './App.css'
import { MapsPanel } from './components/MapsPanel'
import { WhatsAppPanel } from './components/WhatsAppPanel'
import { Tabs } from '../components/ui'

export default function App() {
  const [activeTab, setActiveTab] = useState<'maps' | 'whatsapp'>('maps');

  const tabs = [
    { id: 'maps', label: 'Google Maps' },
    { id: 'whatsapp', label: 'WhatsApp' }
  ];

  return (
    <div className="flex flex-col h-screen bg-white max-w-full overflow-hidden">
      <Tabs 
        tabs={tabs} 
        activeTab={activeTab} 
        onChange={(id) => setActiveTab(id as 'maps' | 'whatsapp')} 
      />

      <main className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
        <div className="mx-auto w-full space-y-4">
          {activeTab === 'maps' ? <MapsPanel /> : <WhatsAppPanel />}
        </div>
      </main>
    </div>
  );
}
