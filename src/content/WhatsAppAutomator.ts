import { delay, normalizePhone } from '@/utils';
import { extensionApi } from '../services/extensionApi'

export class WhatsAppAutomator {

    private async addToContactsAndMsg(name: string, phone: string, msg: string) {

        //click new chat button | data-testid="new-chat-outline"
        let newChatBtn = document.querySelector('span[data-testid="new-chat-outline"]') as HTMLSpanElement | null;

        if (!newChatBtn) {
            console.error("New chat button not found");
            return;
        }

        newChatBtn.click();
        await delay(3000);

        // click new contact | data-testid="new-chat-drawer-new-contact-cell"
        let newContactBtn = document.querySelector('div[data-testid="new-chat-drawer-new-contact-cell"]') as HTMLButtonElement | null;

        if (!newContactBtn) {
            console.error("New contact button not found");
            return;
        }

        newContactBtn.click();
        await delay(3000);

        // fill name and phone | name -> data-testid="text-input" | phone -> data-testid="phone-number-input" | sync -> id="sync-contact-switch"
        let nameInput = document.querySelector('div[data-testid="text-input"]') as HTMLInputElement | null;
        let phoneInput = document.querySelector('input[data-testid="phone-number-input"]') as HTMLInputElement | null;
        // label for="sync-contact-switch"
        let syncSwitch = document.querySelector('label[for="sync-contact-switch"]>span') as HTMLLabelElement | null;

        if (!nameInput || !phoneInput || !syncSwitch) {
            console.error("One or more input fields not found");
            return;
        }

        // WhatsApp uses Lexical editor for these fields. 
        // Focus and use document.execCommand('insertText') for contenteditable
        nameInput.focus();
        document.execCommand('insertText', false, name);
        await delay(1000);

        phoneInput.value = phone;
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));

        await delay(1000);
        syncSwitch.click()

        // syncSwitch.dispatchEvent(new Event('change', { bubbles: true }));

        await delay(3000);

        // check if contact already exists by looking for the warning message | id="contact-phone-number-fields-error" -> button
        let errorBtn = document.querySelector('#contact-phone-number-fields-error button') as HTMLButtonElement | null;
        if (errorBtn) {
            console.warn("Contact already exists, proceeding to message");
            errorBtn.click();
            await delay(2000);
        } else {
            // save | data-testid="save-contact-btn"
            let saveBtn = document.querySelector('div[data-testid="save-contact-btn"]') as HTMLButtonElement | null;
            if (saveBtn) {
                saveBtn.click();
            } else {
                console.error("Save button not found");

                // back 2 steps to return to chat list | data-testid="back-refreshed"

                for (let i = 0; i < 2; i++) {
                    let backBtn = document.querySelector('span[data-testid="back-refreshed"]') as HTMLDivElement | null;
                    if (backBtn) {
                        backBtn.click();
                        await delay(2000);
                    } else {
                        console.error("Back button not found");
                        // return;
                    }
                }
                return;
            }
        }


        // sending message 
        await delay(2000);
        let messageInput = document.querySelector('div[data-testid="conversation-compose-box-input"]') as HTMLDivElement | null;

        if (!messageInput) {
            console.error("Message input box not found");
            return;
        }

        messageInput.focus();
        document.execCommand('insertText', false, msg);
        await delay(1000);

        let sendBtn = document.querySelector('button[aria-label="Send"]') as HTMLButtonElement | null;
        if (sendBtn) {
            sendBtn.click();
        } else {
            console.error("Send button not found");
        }

        await delay(2000);

        // back 2 steps to return to chat list | data-testid="back-refreshed"

        for (let i = 0; i < 2; i++) {
            let backBtn = document.querySelector('span[data-testid="back-refreshed"]') as HTMLDivElement | null;
            if (backBtn) {
                backBtn.click();
                await delay(2000);
            } else {
                console.error("Back button not found");
                // return;
            }
        }
    }

    async run() {
        const settings = await extensionApi.getSettings();
        const allLeads = await extensionApi.getAllLeads();
        const template = settings?.messageTemplate || "Hello {{name}}!";

        const leadsToProcess = allLeads.filter((l: any) => l.shopData?.phone);

        if (leadsToProcess.length === 0) {
            alert("No leads with phone numbers found!");
            return;
        }

        if (!confirm(`Start sending messages to ${leadsToProcess.length} leads?`)) return;

        for (const lead of leadsToProcess) {
            const name = lead.shopData.name || 'Friend';
            const phone = normalizePhone(lead.shopData.phone); // Clean phone number
            const message = template.replace('{{name}}', name);

            console.log(`🚀 Sending to ${name} (${phone})...`);
            await this.addToContactsAndMsg(name, phone, message);
            await delay(5000); // Buffer between messages
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
