import { delay, normalizePhone } from '@/utils';
import { extensionApi } from '../services/extensionApi'

export class WhatsAppAutomator {

    private async openNewChatDrawer() {
        let newChatBtn = document.querySelector('span[data-testid="new-chat-outline"]') as HTMLSpanElement | null;
        if (!newChatBtn) {
            throw new Error("New chat button not found");
        }
        newChatBtn.click();
        await delay(3000);
    }

    private async openNewContactForm() {
        let newContactBtn = document.querySelector('div[data-testid="new-chat-drawer-new-contact-cell"]') as HTMLButtonElement | null;
        if (!newContactBtn) {
            throw new Error("New contact button not found");
        }
        newContactBtn.click();
        await delay(3000);
    }

    private async fillContactInfo(name: string, phone: string) {
        let nameInput = document.querySelector('div[data-testid="text-input"]') as HTMLInputElement | null;
        let phoneInput = document.querySelector('input[data-testid="phone-number-input"]') as HTMLInputElement | null;
        let syncSwitch = document.querySelector('label[for="sync-contact-switch"]>span') as HTMLLabelElement | null;

        if (!nameInput || !phoneInput || !syncSwitch) {
            throw new Error("One or more input fields not found");
        }

        nameInput.focus();
        document.execCommand('insertText', false, name);
        await delay(1000);

        phoneInput.value = phone;
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));

        await delay(1000);
        syncSwitch.click()
        await delay(3000);
    }

    private async saveContact() {
        let errorBtn = document.querySelector('#contact-phone-number-fields-error button') as HTMLButtonElement | null;
        if (errorBtn) {
            console.warn("Contact already exists, proceeding to message");
            errorBtn.click();
            await delay(2000);
            return;
        }

        let saveBtn = document.querySelector('div[data-testid="save-contact-btn"]') as HTMLButtonElement | null;
        if (saveBtn) {
            saveBtn.click();
            await delay(2000);
        } else {
            throw new Error("Save button not found");
        }
    }

    private async sendMessageToCurrentChat(msg: string) {
        let messageInput = document.querySelector('div[data-testid="conversation-compose-box-input"]') as HTMLDivElement | null;
        if (!messageInput) {
            throw new Error("Message input box not found");
        }

        messageInput.focus();

        const lines = msg.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Fake typing: insert characters one by one with a small delay
            for (const char of line) {
                document.execCommand('insertText', false, char);
                // Random delay between characters to simulate real typing (20ms to 50ms)
                await delay(Math.floor(Math.random() * 10) + 0);
            }

            if (i < lines.length - 1) {
                // To simulate Shift + Enter for a new line in a modern browser:
                const event = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    shiftKey: true,
                    bubbles: true,
                    cancelable: true,
                });
                messageInput.dispatchEvent(event);
                
                // Using insertText with '\n' instead of insertLineBreak is often 
                // more compatible with Lexical editors and prevents buffer clearing.
                document.execCommand('insertText', false, '\n');
                await delay(200); 
            }
        }

        await delay(2000);

        let sendBtn = document.querySelector('button[aria-label="Send"]') as HTMLButtonElement | null;
        if (sendBtn) {
            sendBtn.click();
            await delay(2000);
        } else {
            throw new Error("Send button not found");
        }
    }

    private async returnToChatList(steps: number = 2) {
        for (let i = 0; i < steps; i++) {
            let backBtn = document.querySelector('span[data-testid="back-refreshed"]') as HTMLDivElement | null;
            if (backBtn) {
                backBtn.click();
                await delay(2000);
            } else {
                console.error("Back button not found at step " + (i + 1));
            }
        }
    }

    private async addToContactsAndMsg(name: string, phone: string, msg: string) {
        try {
            await this.openNewChatDrawer();
            await this.openNewContactForm();
            await this.fillContactInfo(name, phone);
            await this.saveContact();
            await this.sendMessageToCurrentChat(msg);
            await this.returnToChatList(2);
        } catch (error) {
            console.error("Error in addToContactsAndMsg:", error);
            await this.returnToChatList(2);
            throw error;
        }
    }

    async run() {

        const settings = await extensionApi.getSettings();
        const allLeads = await extensionApi.getAllLeads();
        const template = settings?.messageTemplate || "Hello {{name}}!";
        const waLimit = settings?.whatsappLimit || 10;

        // Only process leads with phones that aren't already 'sent'
        const leadsToProcess = allLeads
            .filter((l: any) => l.shopData?.phone && l.status !== 'sent')
            .slice(0, waLimit);

        if (leadsToProcess.length === 0) {
            alert("No unsent leads with phone numbers found!");
            return;
        }

        if (!confirm(`Start sending messages to ${leadsToProcess.length} leads? (Limit: ${waLimit})`)) return;

        for (const lead of leadsToProcess) {
            const name = `${lead.shopData.name} (Lead)` || 'Lead';
            const phone = normalizePhone(lead.shopData.phone);
            const message = template.replace('{{name}}', name);

            console.log(`🚀 Sending to ${name} (${phone})...`);
            try {
                await this.addToContactsAndMsg(name, phone, message);
                console.log(`✅ Successfully sent message to ${name}`);
                await extensionApi.reportLead({ ...lead, status: 'sent' });
            } catch (err: any) {
                console.error(`❌ Failed to send to ${name}:`, err.message);
                // Ensure we report the failure to the background script
                await extensionApi.reportLead({ ...lead, status: 'failed' });
            }
            // Significant delay between leads to avoid rate limiting
            await delay(5000);
        }

        alert("Bulk messaging complete!");
    }

    private injectTriggerButton() {
        if (document.getElementById('wa-bulk-btn')) return
        const btn = document.createElement('button');
        btn.id = 'wa-bulk-btn';
        btn.textContent = 'Send Bulk Messages';
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.left = '50%';
        btn.style.transform = 'translateX(-50%)';
        btn.style.zIndex = '9999';
        btn.style.padding = '10px 20px';
        btn.style.backgroundColor = '#25D366';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '24px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = '500';
        btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

        btn.onclick = () => {
            btn.disabled = true;
            btn.textContent = 'Processing...';
            btn.style.backgroundColor = '#ccc';
            this.run().finally(() => {
                btn.disabled = false;
                btn.textContent = 'Send Bulk Messages';
                btn.style.backgroundColor = '#25D366';
            });
        };
        document.body.appendChild(btn);
    }

    async initUI() {

        while (!document.querySelector('header[data-testid="chatlist-header"]')) {
            console.log("Waiting for WhatsApp UI to load...");
            await delay(2000);
        }
        this.injectTriggerButton();

    }
}
