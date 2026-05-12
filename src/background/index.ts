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
                    const leads = Array.isArray(storage.leads) ? (storage.leads as LeadData[]) : [];
                    const newLead = message.payload as LeadData;
                    console.log({newLead})
                    
                    const existingLeadIndex = leads.findIndex((l) => l.id === newLead.id);
                    
                    if (existingLeadIndex === -1) {
                        const updatedLeads = [...leads, newLead];
                        await chrome.storage.local.set({ leads: updatedLeads });
                        result = { saved: true };
                        console.log('[Background] New lead saved:', newLead.shopData?.name);
                    } else {
                        leads[existingLeadIndex] = newLead;
                        await chrome.storage.local.set({ leads });
                        result = { saved: true, updated: true };
                        console.log('[Background] Lead updated:', newLead.shopData?.name);
                    }
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
