import { delay } from '@/utils';
import { extensionApi } from '../services/extensionApi'


export interface ShopData {
  name: string;
  address: string;
  phone: string;
  website: string;
}

export interface FeedItem {
  id: string;
  link: string;
  shopData: ShopData | null;
}

export class MapsScraper {
  private processed = new Set<string>();
  private feedItems: FeedItem[] = [];

  async run() {
    console.log("🚀 Starting Maps Scraper");
    const settings = await extensionApi.getSettings();
    const limit = settings?.limit || 10;

    const feedContainer = document.querySelector<HTMLElement>(
      'div[role="feed"]'
    ) as HTMLDivElement | null;

    if (!feedContainer) {
      console.log("❌ No feed container found");
      return;
    }

    await this.scrape(feedContainer, limit);
    console.table(this.feedItems);
    console.log("🎉 Maps Scraping Done");
  }

  private async scrape(container: HTMLDivElement, limit: number) {
    let noNewItemsCount = 0;

    while (noNewItemsCount < 5 && this.feedItems.length < limit) {
      const items = Array.from(
        container.querySelectorAll('div[role="article"]')
      ) as HTMLDivElement[];

      let foundNew = false;

      for (const item of items) {
        if (this.feedItems.length >= limit) break;

        const linkEl = item.querySelector("a[href]") as HTMLAnchorElement | null;
        const link = linkEl?.href || "";
        const idMatch = link.match(/\/place\/([^\/]+)/);
        const id = idMatch ? idMatch[1] : btoa(link);

        if (!id || this.processed.has(id)) continue;

        this.processed.add(id);
        foundNew = true;

        console.log(`🔗 Processing ${this.feedItems.length + 1}/${limit}: ${id}`);
        item.scrollIntoView({ behavior: "smooth", block: "center" });
        await delay(1000);
        linkEl?.click();
        await delay(3500);

        const detailPanels = document.querySelectorAll('div[role="main"]') as NodeListOf<HTMLDivElement>;
        let shopData: ShopData = { name: "", address: "", phone: "", website: "" };

        if (detailPanels.length > 1) {
          const detailPanel = detailPanels[1];
          shopData.name = detailPanel?.querySelector("h1")?.textContent?.trim() || "";
          shopData.address = detailPanel?.querySelector('button[data-item-id="address"] .Io6YTe')?.textContent?.trim() || "";
          shopData.phone = detailPanel?.querySelector('button[data-item-id^="phone:tel:"] .Io6YTe')?.textContent?.trim() || "";
          shopData.website = (detailPanel?.querySelector('a[data-item-id="authority"]') as HTMLAnchorElement)?.href || "";
        }

        this.feedItems.push({ id, link, shopData });
        extensionApi.reportLead({ id, link, shopData });
      }

      if (!foundNew) {
        noNewItemsCount++;
      } else {
        noNewItemsCount = 0;
      }

      container.scrollBy({ top: 2000, behavior: "smooth" });
      await delay(2000);
    }
  }

  initUI() {
    setInterval(() => {
      const feedContainer = document.querySelector('div[role="feed"]');
      if (feedContainer && !document.getElementById('lead-gen-btn')) {
        const btn = document.createElement('button');
        btn.id = 'lead-gen-btn';
        btn.textContent = 'Generate Leads';
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.left = '50%';
        btn.style.transform = 'translateX(-50%)';
        btn.style.zIndex = '9999';
        btn.style.padding = '10px 20px';
        btn.style.backgroundColor = '#1a73e8';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '24px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = '500';
        btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

        btn.onclick = () => {
          btn.disabled = true;
          btn.textContent = 'Scraping...';
          btn.style.backgroundColor = '#ccc';
          this.run().finally(() => {
            btn.disabled = false;
            btn.textContent = 'Generate Leads';
            btn.style.backgroundColor = '#1a73e8';
          });
        };
        document.body.appendChild(btn);
      }
    }, 2000);
  }
}
