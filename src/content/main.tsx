import { extensionApi } from '../services/extensionApi'
// import { LeadData } from '../types/messaging'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



interface FeedItem {
  id: string;
  link: string;
  shopData: ShopData | null;
}

interface ShopData {
  name: string;
  address: string;
  phone: string;
  website: string;
}
async function getFeedItems(
  container: HTMLDivElement,
  limit = 10
) {
  const processed = new Set<string>();
  const feedItems: FeedItem[] = [];

  let noNewItemsCount = 0;

  while (
    noNewItemsCount < 5 &&
    feedItems.length < limit
  ) {
    const items = Array.from(
      container.querySelectorAll('div[role="article"]')
    ) as HTMLDivElement[];

    let foundNew = false;

    for (const item of items) {
      // stop immediately if limit reached
      if (feedItems.length >= limit) {
        break;
      }

      const linkEl = item.querySelector(
        "a[href]"
      ) as HTMLAnchorElement | null;

      const link = linkEl?.href || "";

      const idMatch = link.match(/\/place\/([^\/]+)/);

      const id = idMatch
        ? idMatch[1]
        : btoa(link);

      if (!id || processed.has(id)) {
        continue;
      }

      processed.add(id);
      foundNew = true;

      console.log(
        `🔗 Processing ${feedItems.length + 1}/${limit}: ${id}`
      );

      item.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      await wait(1000);

      linkEl?.click();

      await wait(3500);

      const detailPanels = document.querySelectorAll(
        'div[role="main"]'
      ) as NodeListOf<HTMLDivElement>;

      let shopData: ShopData = {
        name: "",
        address: "",
        phone: "",
        website: "",
      };

      if (detailPanels.length > 1) {
        const detailPanel = detailPanels[1];

        shopData.name =
          detailPanel
            ?.querySelector("h1")
            ?.textContent?.trim() || "";

        shopData.address =
          detailPanel
            ?.querySelector(
              'button[data-item-id="address"] .Io6YTe'
            )
            ?.textContent?.trim() || "";

        shopData.phone =
          detailPanel
            ?.querySelector(
              'button[data-item-id^="phone:tel:"] .Io6YTe'
            )
            ?.textContent?.trim() || "";

        shopData.website =
          (
            detailPanel?.querySelector(
              'a[data-item-id="authority"]'
            ) as HTMLAnchorElement
          )?.href || "";
      }

      feedItems.push({
        id,
        link,
        shopData,
      });

      // Send to background immediately
      extensionApi.reportLead({ id, link, shopData });
    }

    if (!foundNew) {
      noNewItemsCount++;
    } else {
      noNewItemsCount = 0;
    }

    container.scrollBy({
      top: 2000,
      behavior: "smooth",
    });

    await wait(2000);
  }

  return feedItems;
}
async function run() {
  console.log("🚀 Starting");

  const settings = await extensionApi.getSettings();
  const limit = settings?.limit || 10;

  const feedContainer = document.querySelector<HTMLElement>(
    'div[role="feed"]'
  ) as HTMLDivElement | null;

  if (!feedContainer) {
    console.log("❌ No feed container found");
    return;
  }

  let res = await getFeedItems(feedContainer, limit);
  console.table(res);
  console.log("🎉 Done");
}

function initUI() {
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
        run().finally(() => {
          btn.disabled = false;
          btn.textContent = 'Generate Leads';
          btn.style.backgroundColor = '#1a73e8';
        });
      };

      document.body.appendChild(btn);
    }
  }, 2000);
}

initUI();
