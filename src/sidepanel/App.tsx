import { useEffect, useState } from 'react'
import './App.css'
import { LeadData } from '../types/messaging'

export default function App() {
  const [leads, setLeads] = useState<LeadData[]>([])

  const fetchLeads = async () => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.warn('Chrome storage API not available')
      return
    }
    const storage = await chrome.storage.local.get('leads')
    const leadsList = Array.isArray(storage.leads) ? storage.leads : []
    setLeads(leadsList)
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
    
    const headers = ['Name', 'Website', 'Phone', 'Address', 'Rating', 'Maps URL']
    const csvRows = [
      headers.join(','),
      ...leads.map(l => [
        `"${l.businessName}"`,
        `"${l.website || ''}"`,
        `"${l.phoneNumber || ''}"`,
        `"${l.address || ''}"`,
        l.rating || '',
        `"${l.siteUrl}"`
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
          <h1>Shop Lead Gen</h1>
          <div className="stats">Found: {leads.length}</div>
       </header>

       <div className="actions">
          <button onClick={exportCSV} disabled={leads.length === 0} className="primary">Export CSV</button>
          <button onClick={clearLeads} disabled={leads.length === 0} className="secondary">Clear</button>
       </div>

       <div className="lead-list">
          {leads.map((lead) => (
            <div key={lead.id} className="lead-card">
              <div className="lead-header">
                <h3>{lead.businessName}</h3>
                {lead.rating && <span className="rating">★ {lead.rating}</span>}
              </div>
              <p className="address">{lead.address || 'Loading address...'}</p>
              <div className="contacts">
                {lead.website && <a href={lead.website} target="_blank" rel="noreferrer">Website</a>}
                {lead.phoneNumber && <span>{lead.phoneNumber}</span>}
              </div>
            </div>
          ))}
          {leads.length === 0 && <p className="empty">Search on Google Maps to find leads!</p>}
       </div>
    </div>
  )
}
