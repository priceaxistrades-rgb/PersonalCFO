import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

// Desktop screenshots
const desktop = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});
const dPage = await desktop.newPage();

const desktopPages = [
  { url: 'http://localhost:3456/login', name: 'login-desktop' },
  { url: 'http://localhost:3456/signup', name: 'signup-desktop' },
];

for (const p of desktopPages) {
  try {
    await dPage.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
    await dPage.waitForTimeout(2000);
    await dPage.screenshot({ path: `/home/user/demo-${p.name}.png`, fullPage: false });
    console.log(`✅ ${p.name}`);
  } catch (e) {
    console.log(`❌ ${p.name}: ${e.message.slice(0, 100)}`);
  }
}

// Mobile screenshots
const mobile = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const mPage = await mobile.newPage();

const mobilePages = [
  { url: 'http://localhost:3456/login', name: 'login-mobile' },
  { url: 'http://localhost:3456/signup', name: 'signup-mobile' },
];

for (const p of mobilePages) {
  try {
    await mPage.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
    await mPage.waitForTimeout(2000);
    await mPage.screenshot({ path: `/home/user/demo-${p.name}.png`, fullPage: false });
    console.log(`✅ ${p.name}`);
  } catch (e) {
    console.log(`❌ ${p.name}: ${e.message.slice(0, 100)}`);
  }
}

await browser.close();
console.log('All screenshots done!');
