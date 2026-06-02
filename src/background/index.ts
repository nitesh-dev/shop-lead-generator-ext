import { ExtensionMessage, LeadData, Settings, ApiResponse } from "../types/messaging";
import { supabase } from "../services/supabase";
import { migrateLeadsToSupabase } from "../utils/migration";

chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
    const message = msg as ExtensionMessage;
    console.log('[Background] Received message:', message.type);

    (async () => {
        try {
            let result: unknown;

            switch (message.type) {
                case 'LEAD_FOUND':
                    const newLead = message.payload as LeadData;
                    const phone = newLead.shopData?.phone;

                    if (!phone || phone.trim() === '') {
                        result = { saved: false, reason: 'missing_phone' };
                        break;
                    }

                    const normalizedPhone = phone.replace(/[^\d+]/g, '').replace(/^0+/, '');
                    
                    // Upsert to Supabase
                    const { error } = await supabase
                        .from('leads')
                        .upsert({
                            phone_normalized: normalizedPhone,
                            name: newLead.shopData?.name,
                            phone: newLead.shopData?.phone,
                            address: newLead.shopData?.address,
                            rating: newLead.shopData?.rating,
                            reviews: newLead.shopData?.reviews,
                            category: newLead.shopData?.category,
                            website: newLead.shopData?.website,
                            map_url: newLead.link, // Used newLead.link instead of shopData.mapUrl
                            status: newLead.status || 'pending',
                            raw_data: newLead
                        }, { onConflict: 'phone_normalized' });

                    if (error) {
                        console.error('[Background] Supabase error:', error);
                        result = { saved: false, error: error.message };
                    } else {
                        result = { saved: true };
                    }
                    break;

                case 'GET_ALL_LEADS':
                    const { data: leads, error: getError } = await supabase
                        .from('leads')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (getError) {
                        console.error('[Background] Supabase get error:', getError);
                        result = [];
                    } else {
                        // Map back to LeadData format if needed
                        result = (leads || []).map(l => ({
                            ...l.raw_data,
                            status: l.status
                        }));
                    }
                    break;

                case 'GET_LEADS_PAGE':
                    // payload: { limit?: number, offset?: number }
                    {
                        const { limit = 10, offset = 0 } = (message.payload as any) || {};
                        const parsedLimit = Number(limit) || 10;
                        const parsedOffset = Number(offset) || 0;

                        const { data: pageLeads, error: pageError, count } = await supabase
                            .from('leads')
                            .select('*', { count: 'exact' })
                            .order('created_at', { ascending: false })
                            .range(parsedOffset, parsedOffset + parsedLimit - 1);

                        if (pageError) {
                            console.error('[Background] Supabase page error:', pageError);
                            result = {
                                items: [],
                                total: 0,
                                limit: parsedLimit,
                                offset: parsedOffset,
                                hasMore: false,
                            };
                        } else {
                            const items = (pageLeads || []).map((l: any) => ({
                                ...l.raw_data,
                                status: l.status,
                                id: l.id,
                            }));

                            const total = typeof count === 'number' ? count : (items.length + parsedOffset);
                            const hasMore = parsedOffset + items.length < total;

                            result = {
                                items,
                                total,
                                limit: parsedLimit,
                                offset: parsedOffset,
                                hasMore,
                                nextOffset: hasMore ? parsedOffset + parsedLimit : null,
                            };
                        }
                    }
                    break;

                case 'GET_SETTINGS':
                    const settingsData = await chrome.storage.local.get('settings');
                    result = (settingsData.settings as Settings) || { limit: 10 };
                    break;
                case 'UPDATE_SETTINGS':
                    await chrome.storage.local.set({ settings: message.payload });
                    result = { success: true };
                    break;
                case 'IMPORT_LEADS':
                    const importLeads = message.payload as LeadData[];
                    const preparedLeads = importLeads.map(l => ({
                        phone_normalized: l.shopData?.phone?.replace(/[^\d+]/g, '').replace(/^0+/, ''),
                        name: l.shopData?.name,
                        phone: l.shopData?.phone,
                        address: l.shopData?.address,
                        rating: l.shopData?.rating,
                        reviews: l.shopData?.reviews,
                        category: l.shopData?.category,
                        website: l.shopData?.website,
                        map_url: l.link, // Used l.link instead of l.shopData.mapUrl
                        status: l.status || 'pending',
                        raw_data: l
                    })).filter(l => l.phone_normalized);

                    const { error: importError } = await supabase
                        .from('leads')
                        .upsert(preparedLeads, { onConflict: 'phone_normalized' });

                    result = { count: preparedLeads.length, error: importError?.message };
                    break;
                case 'CLEAR_ALL_LEADS':
                    // Safety check: actually we might not want to clear cloud database easily
                    // But for consistency:
                    const { error: clearError } = await supabase
                        .from('leads')
                        .delete()
                        .neq('id', 0); // Delete all
                    result = { success: !clearError };
                    break;
                case 'RESET_LEADS_STATUS':
                    const { error: resetError } = await supabase
                        .from('leads')
                        .update({ status: 'pending' })
                        .neq('id', 0);
                    result = { success: !resetError };
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

// Expose for manual console migration
if (typeof self !== 'undefined') {
    (self as any).migrateLeadsToSupabase = migrateLeadsToSupabase;
}
