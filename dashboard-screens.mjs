import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

// Desktop dashboard
const desktop = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const dPage = await desktop.newPage();

try {
  // Login via demo
  await dPage.goto('http://localhost:3456/login', { waitUntil: 'networkidle', timeout: 30000 });
  await dPage.waitForTimeout(1000);
  
  // Click demo button
  const demoBtn = dPage.locator('text=Launch Instant Demo').first();
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await dPage.waitForTimeout(5000);
    await dPage.waitForURL('**/', { timeout: 15000 });
  }
  
  // Dashboard screenshot
  await dPage.waitForTimeout(3000);
  await dPage.screenshot({ path: '/home/user/demo-dashboard-desktop.png', fullPage: false });
  console.log('✅ dashboard-desktop');
  
  // Navigate to markets
  await dPage.goto('http://localhost:3456/markets', { waitUntil: 'networkidle', timeout: 20000 });
  await dPage.waitForTimeout(2000);
  await dPage.screenshot({ path: '/home/user/demo-markets-desktop.png', fullPage: false });
  console.log('✅ markets-desktop');

  // Navigate to settings
  await dPage.goto('http://localhost:3456/settings', { waitUntil: 'networkidle', timeout: 20000 });
  await dPage.waitForTimeout(2000);
  await dPage.screenshot({ path: '/home/user/demo-settings-desktop.png', fullPage: false });
  console.log('✅ settings-desktop');

  // Navigate to health
  await dPage.goto('http://localhost:3456/health', { waitUntil: 'networkidle', timeout: 20000 });
  await dPage.waitForTimeout(2000);
  await dPage.screenshot({ path: '/home/user/demo-health-desktop.png', fullPage: false });
  console.log('✅ health-desktop');

} catch (e) {
  console.log(`❌ desktop: ${e.message.slice(0, 100)}`);
}

// Mobile dashboard
const mobile = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const mPage = await mobile.newPage();

try {
  await mPage.goto('http://localhost:3456/login', { waitUntil: 'networkidle', timeout: 30000 });
  await mPage.waitForTimeout(1000);
  
  const mDemoBtn = mPage.locator('text=Launch Instant Demo').first();
  if (await mDemoBtn.isVisible()) {
    await mDemoBtn.click();
    await mPage.waitForTimeout(5000);
    await mPage.waitForURL('**/', { timeout: 15000 });
  }
  
  await mPage.waitForTimeout(3000);
  await mPage.screenshot({ path: '/home/user/demo-dashboard-mobile.png', fullPage: false });
  console.log('✅ dashboard-mobile');
  
  // Open suite sheet
  const suiteBtn = mPage.locator('text=Suite').first();
  if (await suiteBtn.isVisible()) {
    await suiteBtn.click();
    await mPage.waitForTimeout(1500);
    await mPage.screenshot({ path: '/home/user/demo-suite-sheet-mobile.png', fullPage: false });
    console.log('✅ suite-sheet-mobile');
  }
  
  // Open sidebar drawer
  const menuBtn = mPage.locator('button[aria-label="Menu"]').first();
  if (await menuBtn.isVisible()) {
    await mPage.keyboard.press('Escape'); // close suite
    await mPage.waitForTimeout(500);
    await menuBtn.click();
    await mPage.waitForTimeout(1000);
    await mPage.screenshot({ path: '/home/user/demo-sidebar-mobile.png', fullPage: false });
    console.log('✅ sidebar-mobile');
  }

} catch (e) {
  console.log(`❌ mobile: ${e.message.slice(0, 100)}`);
}

// Aurora theme screenshot
const auroraDesktop = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const aPage = await auroraDesktop.newPage();

try {
  await aPage.goto('http://localhost:3456/login', { waitUntil: 'networkidle', timeout: 30000 });
  await aPage.waitForTimeout(1000);
  
  const aDemoBtn = aPage.locator('text=Launch Instant Demo').first();
  if (await aDemoBtn.isVisible()) {
    await aDemoBtn.click();
    await aPage.waitForTimeout(5000);
    await aPage.waitForURL('**/', { timeout: 15000 });
  }
  
  // Switch to Aurora theme
  await aPage.locator('text=Aurora').first().click();
  await aPage.waitForTimeout(2000);
  await aPage.screenshot({ path: '/home/user/demo-dashboard-aurora.png', fullPage: false });
  console.log('✅ dashboard-aurora');
} catch (e) {
  console.log(`❌ aurora: ${e.message.slice(0, 100)}`);
}

await browser.close();
console.log('All dashboard screenshots done!');
