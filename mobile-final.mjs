import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

// Mobile screenshots
const mobile = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const mPage = await mobile.newPage();

// Login
await mPage.goto('http://localhost:3456/login', { waitUntil: 'networkidle', timeout: 30000 });
await mPage.waitForTimeout(2000);
await mPage.screenshot({ path: '/home/user/demo2-login-mobile.png', fullPage: false });
console.log('✅ login-mobile');

// Demo login
const demoBtn = mPage.getByRole('button', { name: /demo/i }).first();
await demoBtn.click();
await mPage.waitForTimeout(8000);

// Dashboard
await mPage.screenshot({ path: '/home/user/demo2-dashboard-mobile.png', fullPage: false });
console.log('✅ dashboard-mobile');

// Dashboard full page
await mPage.screenshot({ path: '/home/user/demo2-dashboard-mobile-full.png', fullPage: true });
console.log('✅ dashboard-mobile-full');

// Open sidebar drawer
try {
  const menuBtn = mPage.locator('button[aria-label="Menu"]').first();
  await menuBtn.click();
  await mPage.waitForTimeout(1000);
  await mPage.screenshot({ path: '/home/user/demo2-sidebar-mobile.png', fullPage: false });
  console.log('✅ sidebar-mobile');
  await mPage.keyboard.press('Escape');
  await mPage.waitForTimeout(500);
} catch(e) { console.log('❌ sidebar:', e.message.slice(0,60)); }

// Open suite sheet
try {
  const suiteBtn = mPage.locator('text=Suite').first();
  await suiteBtn.click();
  await mPage.waitForTimeout(1000);
  await mPage.screenshot({ path: '/home/user/demo2-suite-mobile.png', fullPage: false });
  console.log('✅ suite-mobile');
  await mPage.keyboard.press('Escape');
  await mPage.waitForTimeout(500);
} catch(e) { console.log('❌ suite:', e.message.slice(0,60)); }

// More pages
const pages = ['/markets', '/health', '/settings', '/bills', '/savings', '/investments', '/control', '/budget'];
for (const p of pages) {
  try {
    await mPage.goto(`http://localhost:3456${p}`, { waitUntil: 'networkidle', timeout: 20000 });
    await mPage.waitForTimeout(2000);
    const safeName = p.replace(/\//g, '-');
    await mPage.screenshot({ path: `/home/user/demo2${safeName}-mobile.png`, fullPage: false });
    console.log(`✅ ${p}-mobile`);
  } catch(e) { console.log(`❌ ${p}: ${e.message.slice(0,60)}`); }
}

// Desktop dashboard for comparison
const desktop = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const dPage = await desktop.newPage();
await dPage.goto('http://localhost:3456/login', { waitUntil: 'networkidle', timeout: 30000 });
await dPage.waitForTimeout(1000);
const dDemoBtn = dPage.getByRole('button', { name: /demo/i }).first();
await dDemoBtn.click();
await dPage.waitForTimeout(8000);
await dPage.screenshot({ path: '/home/user/demo2-dashboard-desktop.png', fullPage: false });
console.log('✅ dashboard-desktop');

await browser.close();
console.log('All done!');
