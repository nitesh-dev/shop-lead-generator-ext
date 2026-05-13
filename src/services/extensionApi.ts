import { ExtensionMessage, MessageMap, MessageType, ApiResponse, LeadData } from "../types/messaging";

export async function sendMessage<K extends MessageType>(
    type: K,
    payload: MessageMap[K]
): Promise<any> {
    const msg: ExtensionMessage<K> = { type, payload };
    const response: ApiResponse = await chrome.runtime.sendMessage(msg);

    if (response && response.success) {
        return response.data;
    }

    throw new Error(response?.error || 'Unknown extension API error');
}

export const extensionApi = {
    getAllLeads: () => sendMessage('GET_ALL_LEADS', undefined),
    reportLead: (lead: MessageMap['LEAD_FOUND']) => sendMessage('LEAD_FOUND', lead),
    importLeads: (leads: LeadData[]) => sendMessage('IMPORT_LEADS', leads),
    clearAllLeads: () => sendMessage('CLEAR_ALL_LEADS', undefined),
    resetLeadsStatus: () => sendMessage('RESET_LEADS_STATUS', undefined),
    getSettings: () => sendMessage('GET_SETTINGS', undefined),
    updateSettings: (settings: MessageMap['UPDATE_SETTINGS']) => sendMessage('UPDATE_SETTINGS', settings),
};
