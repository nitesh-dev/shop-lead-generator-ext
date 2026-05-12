import { MapsScraper } from './MapsScraper'
import { WhatsAppAutomator } from './WhatsAppAutomator'

// Orchestrator
if (window.location.host.includes('google.com') && window.location.pathname.includes('/maps')) {
  const scraper = new MapsScraper();
  scraper.initUI();
} else if (window.location.host === 'web.whatsapp.com') {
  const automator = new WhatsAppAutomator();
  automator.initUI();
}
