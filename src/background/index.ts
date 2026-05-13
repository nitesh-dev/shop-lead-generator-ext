import { ExtensionMessage, ApiResponse, LeadData, Settings } from "../types/messaging";

chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
    const message = msg as ExtensionMessage;
    console.log('[Background] Received message:', message.type);

    (async () => {
        try {
            let result: unknown;

            switch (message.type) {
                case 'LEAD_FOUND':
                    const storage = await chrome.storage.local.get('leads');
                    let leads = Array.isArray(storage.leads) ? (storage.leads as LeadData[]) : [];
                    
                    // Cleanup existing duplicates and invalid entries before processing
                    const seenPhones = new Set<string>();
                    leads = leads.filter(l => {
                        const p = l.shopData?.phone;
                        if (!p || p.trim() === '') return false; // Remove if no phone
                        const normalized = p.replace(/[^\d+]/g, '');
                        if (seenPhones.has(normalized)) return false; // Remove duplicate
                        seenPhones.add(normalized);
                        return true;
                    });

                    const newLead = message.payload as LeadData;
                    const newPhone = newLead.shopData?.phone;

                    // If phone is missing, skip the lead
                    if (!newPhone || newPhone.trim() === '') {
                        console.log('[Background] Skipping lead: No phone number');
                        result = { saved: false, reason: 'missing_phone' };
                        // Save the cleaned list even if we skip the new one
                        await chrome.storage.local.set({ leads });
                        break;
                    }
                    
                    const normalizedNewPhone = newPhone.replace(/[^\d+]/g, '');
                    console.log({newLead})
                    
                    // Filter by phone number only
                    const existingLeadIndex = leads.findIndex((l) => {
                        const existingPhone = l.shopData?.phone;
                        if (existingPhone) {
                            const normalize = (p: string) => p.replace(/[^\d+]/g, '');
                            return normalize(existingPhone) === normalizedNewPhone;
                        }
                        return false;
                    });
                    
                    if (existingLeadIndex === -1) {
                        leads.push({ ...newLead, status: newLead.status || 'pending' });
                        result = { saved: true };
                        console.log('[Background] New lead saved:', newLead.shopData?.name);
                    } else {
                        // MERGE status and other data
                        leads[existingLeadIndex] = { 
                            ...leads[existingLeadIndex], 
                            ...newLead,
                            status: newLead.status || leads[existingLeadIndex].status || 'pending'
                        };
                        result = { saved: true, updated: true };
                        console.log('[Background] Lead updated (merged):', newLead.shopData?.name);
                    }
                    
                    await chrome.storage.local.set({ leads });
                    break;
                case 'GET_ALL_LEADS':
                    const allLeadsData = await chrome.storage.local.get('leads');
                    result = Array.isArray(allLeadsData.leads) ? (allLeadsData.leads as LeadData[]) : [];
                    break;
                case 'GET_SETTINGS':
                    const settingsData = await chrome.storage.local.get('settings');
                    result = (settingsData.settings as Settings) || { limit: 10 };
                    break;
                case 'UPDATE_SETTINGS':
                    await chrome.storage.local.set({ settings: message.payload });
                    result = { success: true };
                    break;
                default:
                    sendResponse({ success: false, error: 'Unknown message type' } as ApiResponse);
                    return;
            }

            sendResponse({ success: true, data: result } as ApiResponse);
        } catch (error) {
            console.error('[Background] Error handling message:', error);
            sendResponse({ success: false, error: String(error) } as ApiResponse);
        }
    })();

    return true;
});
