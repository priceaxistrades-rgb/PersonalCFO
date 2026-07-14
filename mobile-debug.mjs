import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

const mobile = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const mPage = await mobile.newPage();

// Login first
await mPage.goto('http://localhost:3456/login', { waitUntil: 'networkidle', timeout: 30000 });
await mPage.waitForTimeout(1000);
const demoBtn = mPage.getByRole('button', { name: /demo/i }).first();
await demoBtn.click();
await mPage.waitForTimeout(8000);

// Take full-page screenshot to see everything
await mPage.screenshot({ path: '/home/user/demo-mobile-dashboard-full.png', fullPage: true });
console.log('✅ dashboard-full-page');

// Scroll down and take more
await mPage.evaluate(() => window.scrollTo(0, 500));
await mPage.waitForTimeout(500);
await mPage.screenshot({ path: '/home/user/demo-mobile-dashboard-scrolled.png', fullPage: false });
console.log('✅ dashboard-scrolled');

// Check for horizontal overflow
const overflow = await mPage.evaluate(() => {
  const body = document.body;
  const html = document.documentElement;
  const bodyScrollW = body.scrollWidth;
  const htmlScrollW = html.scrollWidth;
  const clientW = html.clientWidth;
  return {
    bodyScrollWidth: bodyScrollW,
    htmlScrollWidth: htmlScrollW,
    clientWidth: clientW,
    hasHorizontalOverflow: bodyScrollW > clientW || htmlScrollW > clientW,
    bodyOverflowX: getComputedStyle(body).overflowX,
    htmlOverflowX: getComputedStyle(html).overflowX,
  };
});
console.log('Overflow check:', JSON.stringify(overflow));

// Check which elements cause overflow
const overflowElements = await mPage.evaluate(() => {
  const clientW = document.documentElement.clientWidth;
  const culprits = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.scrollWidth > clientW + 2) {
      culprits.push({
        tag: el.tagName,
        class: el.className?.toString().slice(0, 80),
        id: el.id,
        scrollWidth: el.scrollWidth,
        offsetWidth: el.offsetWidth,
      });
    }
  });
  return culprits.slice(0, 15);
});
console.log('Overflow elements:', JSON.stringify(overflowElements, null, 2));

// Check header & nav positioning
const layoutInfo = await mPage.evaluate(() => {
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  return {
    header: header ? { height: header.offsetHeight, top: header.getBoundingClientRect().top, position: getComputedStyle(header).position, zIndex: getComputedStyle(header).zIndex } : null,
    main: main ? { paddingTop: getComputedStyle(main).paddingTop, paddingBottom: getComputedStyle(main).paddingBottom, top: main.getBoundingClientRect().top } : null,
    nav: nav ? { height: nav.offsetHeight, bottom: nav.getBoundingClientRect().bottom, position: getComputedStyle(nav).position, zIndex: getComputedStyle(nav).zIndex } : null,
  };
});
console.log('Layout info:', JSON.stringify(layoutInfo, null, 2));

// More pages
const pages = ['/markets', '/health', '/settings', '/bills', '/savings', '/investments', '/control'];
for (const p of pages) {
  try {
    await mPage.goto(`http://localhost:3456${p}`, { waitUntil: 'networkidle', timeout: 20000 });
    await mPage.waitForTimeout(2000);
    await mPage.screenshot({ path: `/home/user/demo-mobile${p.replace(/\//g, '-')}.png`, fullPage: false });
    console.log(`✅ mobile-${p}`);
  } catch(e) {
    console.log(`❌ ${p}: ${e.message.slice(0,60)}`);
  }
}

await browser.close();
console.log('Done!');
