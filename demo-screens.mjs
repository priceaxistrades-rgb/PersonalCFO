import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

// Desktop - Login + Signup
const desktop = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const dPage = await desktop.newPage();

const shots = [
  { url: 'http://localhost:3456/login', name: 'login-desktop' },
  { url: 'http://localhost:3456/signup', name: 'signup-desktop' },
];

for (const s of shots) {
  try {
    await dPage.goto(s.url, { waitUntil: 'networkidle', timeout: 30000 });
    await dPage.waitForTimeout(2000);
    await dPage.screenshot({ path: `/home/user/demo-${s.name}.png`, fullPage: false });
    console.log(`✅ ${s.name}`);
  } catch (e) {
    console.log(`❌ ${s.name}: ${e.message.slice(0,80)}`);
  }
}

// Now do demo login and capture dashboard
try {
  await dPage.goto('http://localhost:3456/login', { waitUntil: 'networkidle', timeout: 30000 });
  await dPage.waitForTimeout(1000);
  
  const demoBtn = dPage.getByRole('button', { name: /demo/i }).first();
  await demoBtn.click();
  await dPage.waitForTimeout(8000);
  
  // Whatever page we end up on, screenshot it
  await dPage.screenshot({ path: '/home/user/demo-dashboard-desktop.png', fullPage: false });
  console.log('✅ dashboard-desktop (after demo login)');

  // Try more pages
  const pages = ['/markets', '/health', '/settings', '/bills', '/savings'];
  for (const p of pages) {
    try {
      await dPage.goto(`http://localhost:3456${p}`, { waitUntil: 'networkidle', timeout: 20000 });
      await dPage.waitForTimeout(2000);
      await dPage.screenshot({ path: `/home/user/demo-${p.replace('/','')}-desktop.png`, fullPage: false });
      console.log(`✅ ${p}-desktop`);
    } catch(e) {
      console.log(`❌ ${p}: ${e.message.slice(0,60)}`);
    }
  }

  // Aurora theme
  try {
    await dPage.goto('http://localhost:3456/', { waitUntil: 'networkidle', timeout: 20000 });
    await dPage.waitForTimeout(1000);
    const auroraBtn = dPage.locator('button:has-text("Aurora")').first();
    if (await auroraBtn.isVisible()) {
      await auroraBtn.click();
      await dPage.waitForTimeout(2000);
      await dPage.screenshot({ path: '/home/user/demo-dashboard-aurora-desktop.png', fullPage: false });
      console.log('✅ dashboard-aurora-desktop');
    }
  } catch(e) {
    console.log(`❌ aurora: ${e.message.slice(0,60)}`);
  }
} catch(e) {
  console.log(`❌ demo flow: ${e.message.slice(0,100)}`);
}

// Mobile
const mobile = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const mPage = await mobile.newPage();

try {
  await mPage.goto('http://localhost:3456/login', { waitUntil: 'networkidle', timeout: 30000 });
  await mPage.waitForTimeout(2000);
  await mPage.screenshot({ path: '/home/user/demo-login-mobile.png', fullPage: false });
  console.log('✅ login-mobile');
  
  const mDemoBtn = mPage.getByRole('button', { name: /demo/i }).first();
  await mDemoBtn.click();
  await mPage.waitForTimeout(8000);
  
  await mPage.screenshot({ path: '/home/user/demo-dashboard-mobile.png', fullPage: false });
  console.log('✅ dashboard-mobile');
  
  // Try opening sidebar
  try {
    const menuBtn = mPage.locator('button[aria-label="Menu"]').first();
    await menuBtn.click();
    await mPage.waitForTimeout(1000);
    await mPage.screenshot({ path: '/home/user/demo-sidebar-mobile.png', fullPage: false });
    console.log('✅ sidebar-mobile');
    await mPage.keyboard.press('Escape');
    await mPage.waitForTimeout(500);
  } catch(e) {}
  
  // Try opening suite sheet
  try {
    const suiteBtn = mPage.locator('text=Suite').first();
    await suiteBtn.click();
    await mPage.waitForTimeout(1000);
    await mPage.screenshot({ path: '/home/user/demo-suite-mobile.png', fullPage: false });
    console.log('✅ suite-mobile');
  } catch(e) {}

} catch(e) {
  console.log(`❌ mobile: ${e.message.slice(0,80)}`);
}

await browser.close();
console.log('All done!');
