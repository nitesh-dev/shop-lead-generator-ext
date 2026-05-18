import { supabase } from '../services/supabase';

/**
 * Utility to migrate existing chrome.storage.local leads to Supabase.
 * To use this:
 * 1. Open the Extension's background page inspector or Sidepanel inspector.
 * 2. Run: `await migrateLeadsToSupabase()`
 */
export async function migrateLeadsToSupabase() {
    console.log('[Migration] Starting migration...');
    
    const storage = await chrome.storage.local.get('leads');
    const existingLeads = Array.isArray(storage.leads) ? storage.leads : [];
    
    if (existingLeads.length === 0) {
        console.log('[Migration] No leads found in local storage.');
        return;
    }

    console.log(`[Migration] Found ${existingLeads.length} leads in local storage. Preparing upload...`);

    const preparedLeads = existingLeads.map(l => ({
        phone_normalized: l.shopData?.phone?.replace(/[^\d+]/g, '').replace(/^0+/, ''),
        name: l.shopData?.name,
        phone: l.shopData?.phone,
        address: l.shopData?.address,
        rating: l.shopData?.rating,
        reviews: l.shopData?.reviews,
        category: l.shopData?.category,
        website: l.shopData?.website,
        map_url: l.link, // used l.link instead of l.shopData.mapUrl
        status: l.status || 'pending',
        raw_data: l
    })).filter(l => l.phone_normalized);

    // Upload in batches of 50 to avoid payload limits
    const BATCH_SIZE = 50;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < preparedLeads.length; i += BATCH_SIZE) {
        const batch = preparedLeads.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
            .from('leads')
            .upsert(batch, { onConflict: 'phone_normalized' });

        if (error) {
            console.error(`[Migration] Batch ${i / BATCH_SIZE + 1} failed:`, error);
            failCount += batch.length;
        } else {
            console.log(`[Migration] Batch ${i / BATCH_SIZE + 1} uploaded successfully.`);
            successCount += batch.length;
        }
    }

    console.log(`[Migration] Completed! Success: ${successCount}, Failed: ${failCount}`);
    
    if (successCount > 0 && confirm('Migration finished. Do you want to clear local storage now?')) {
        await chrome.storage.local.set({ leads: [] });
        console.log('[Migration] Local storage cleared.');
    }
}
