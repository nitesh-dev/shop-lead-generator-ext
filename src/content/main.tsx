// import { extensionApi } from '../services/extensionApi'
// import { LeadData } from '../types/messaging'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrollFeedContainer(container: HTMLDivElement) {
  let scrollBox: HTMLElement | null = null;
  if (container.scrollHeight > container.clientHeight) {
    scrollBox = container;
  }

  if (!scrollBox) {
    console.log("❌ Scroll box not found");
    return;
  }

  console.log("✅ Found scroll container");

  scrollBox.scrollTo(0, scrollBox.scrollHeight);

  await wait(2500);

  const newHeight = scrollBox.scrollHeight;

  console.log("📜 scrolling...", newHeight);
}

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
async function getFeedItems(container: HTMLDivElement) {
  const items = container.querySelectorAll('div[role="article"]');
  console.log(`📄 Found ${items.length} items on the page`);
  console.log({ items });

  let feedItems: FeedItem[] = [];

  for (const item of items) {
    let feedItem: FeedItem = {
      id: "",
      link: "",
      shopData: null,
    };

    const linkEl = item.querySelector("a[href]") as HTMLAnchorElement | null;
    // getting id from url path
    const link = linkEl?.href || "";
    const idMatch = link.match(/\/place\/([^\/]+)/);
    const id = idMatch ? idMatch[1] : btoa(link);

    console.log(`🔗 Item ID: ${id}, Link: ${link}`);
    feedItem.id = id;
    feedItem.link = link;

    // click the item to open the detail panel
    item.scrollIntoView({ behavior: "smooth", block: "center" });
    await wait(500);
    linkEl?.click();
    await wait(3500);

    let shopData: ShopData = {
      name: "",
      address: "",
      phone: "",
      website: "",
    };

    console.log("📋 Extracting shop data...");

    let detailPanels = document.querySelectorAll(
      'div[role="main"]'
    ) as NodeListOf<HTMLDivElement>;

    console.log("🔍 Looking for detail panel...", detailPanels);
    if (detailPanels.length > 0) {
      const detailPanel = detailPanels[1];

      shopData.name =
        detailPanel?.querySelector("h1.DUwDvf")?.textContent?.trim() || "";

      shopData.address =
        detailPanel
          ?.querySelector('button[data-item-id="address"] .Io6YTe')
          ?.textContent?.trim() || "";

      shopData.phone =
        detailPanel
          ?.querySelector('button[data-item-id^="phone:tel:"] .Io6YTe')
          ?.textContent?.trim() || "";

      shopData.website =
        (
          detailPanel?.querySelector(
            'a[data-item-id="authority"]'
          ) as HTMLAnchorElement
        )?.href || "";

      feedItem.shopData = shopData;
    } else {
      console.log("❌ Detail panel not found for item ID:", id);
    }

    console.log("✅ Extracted shop data:", shopData);
  }

  return feedItems;
}

async function run() {
  console.log("🚀 Starting");

  const feedContainer = document.querySelector<HTMLElement>(
    'div[role="feed"]'
  ) as HTMLDivElement | null;

  if (!feedContainer) {
    console.log("❌ No feed container found");
    return;
  }

  await getFeedItems(feedContainer);
  await scrollFeedContainer(feedContainer);

  // await expandReviews();

  await wait(2000);

  console.log("🎉 Done");
}

setTimeout(run.bind(null), 3000);
