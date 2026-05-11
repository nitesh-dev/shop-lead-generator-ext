import { ExtensionMessage, ApiResponse } from "../types/messaging";

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    console.log('[Background] Received message:', message.type);

    // Use an async IIFE to handle promises in addListener
    (async () => {
        try {
            let result: any;

            switch (message.type) {
                case 'START_SCRAPING':
                    // result = await leadManager.start(message.payload.url);
                    result = { status: 'started' };
                    break;
                case 'GET_ALL_LEADS':
                    // result = await leadStore.getAll();
                    result = [];
                    break;
                case 'GET_AUTH_STATUS':
                    result = { isAuthenticated: true };
                    break;
                case 'UPDATE_SETTINGS':
                    // await settingsManager.update(message.payload);
                    result = { updated: true };
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
