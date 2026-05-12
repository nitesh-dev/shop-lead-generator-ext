import { ExtensionMessage, ApiResponse } from "../types/messaging";

chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
    const message = msg as ExtensionMessage<any>;
    console.log('[Background] Received message:', message.type);

    // Use an async IIFE to handle promises in addListener
    (async () => {
        try {
            let result: any;

            switch (message.type) {
                case 'LEAD_FOUND':
                    const storage = await chrome.storage.local.get('leads');
                    const leads = Array.isArray(storage.leads) ? storage.leads : [];
                    const newLead = message.payload;
                    
                    // Basic deduplication
                    if (!leads.find((l: any) => l.id === newLead.id)) {
                        const updatedLeads = [...leads, newLead];
                        await chrome.storage.local.set({ leads: updatedLeads });
                        result = { saved: true };
                        console.log('[Background] New lead saved:', newLead.shopData?.name);
                    } else {
                        result = { saved: false, reason: 'duplicate' };
                    }
                    break;
                case 'GET_ALL_LEADS':
                    const allLeadsData = await chrome.storage.local.get('leads');
                    result = Array.isArray(allLeadsData.leads) ? allLeadsData.leads : [];
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

    return true; // Keep the message channel open for async response
});
