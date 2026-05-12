import { useEffect, useState } from 'react'
import './App.css'
import { LeadData } from '../types/messaging'
import { extensionApi } from '../services/extensionApi'

export default function App() {
  const [leads, setLeads] = useState<LeadData[]>([])

  const fetchLeads = async () => {
    try {
      const leadsList = await extensionApi.getAllLeads();
      setLeads(leadsList || []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  }

  useEffect(() => {
    fetchLeads()

    // Listen for storage changes
    const listener = (changes: any) => {
      if (changes.leads) {
        setLeads(changes.leads.newValue || [])
      }
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(listener)
      return () => chrome.storage.onChanged.removeListener(listener)
    }
  }, [])

  const exportCSV = () => {
    if (leads.length === 0) return
    
    const headers = ['Name', 'Website', 'Phone', 'Address', 'Maps URL']
    const csvRows = [
      headers.join(','),
      ...leads.map(l => [
        `"${l.shopData?.name || ''}"`,
        `"${l.shopData?.website || ''}"`,
        `"${l.shopData?.phone || ''}"`,
        `"${l.shopData?.address || ''}"`,
        `"${l.link}"`
      ].join(','))
    ]
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('hidden', '')
    a.setAttribute('href', url)
    a.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const clearLeads = async () => {
    if (confirm('Clear all leads?')) {
      await chrome.storage.local.set({ leads: [] })
    }
  }

  return (
    <div className="sidepanel">
       <header>
          <h1>Shop Leads</h1>
          <div className="stats">Found: {leads.length}</div>
       </header>

       <div className="actions">
          <button onClick={exportCSV} disabled={leads.length === 0} className="primary">Export CSV</button>
          <button onClick={clearLeads} disabled={leads.length === 0} className="secondary">Clear</button>
       </div>

       <div className="lead-container">
          {leads.length > 0 ? (
            <table className="lead-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Website</th>
                  <th>Phone</th>
                  <th>Map</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="shop-name">
                      {lead.shopData?.name || 'Unknown'}
                    </td>
                    <td>
                      {lead.shopData?.website ? (
                        <a href={lead.shopData.website} target="_blank" rel="noreferrer" className="link-icon">
                          🌐 <span className="link-text">Visit</span>
                        </a>
                      ) : '-'}
                    </td>
                    <td className="shop-phone">
                      {lead.shopData?.phone || '-'}
                    </td>
                    <td>
                      <a href={lead.link} target="_blank" rel="noreferrer" className="link-icon">
                        📍 <span className="link-text">Maps</span>
                      </a>
                    </td>
                    <td className="shop-address">
                      {lead.shopData?.address || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">Click "Generate Leads" on Google Maps!</p>
          )}
       </div>
    </div>
  )
}
