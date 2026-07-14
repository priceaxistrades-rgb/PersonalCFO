import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const mobile = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const mPage = await mobile.newPage();

// Login
await mPage.goto('http://localhost:3456/login', { waitUntil: 'networkidle', timeout: 30000 });
await mPage.waitForTimeout(1000);
const demoBtn = mPage.getByRole('button', { name: /demo/i }).first();
await demoBtn.click();
await mPage.waitForTimeout(8000);

// Deep diagnostic
const diagnostics = await mPage.evaluate(() => {
  const results = {};
  
  // 1. Check the flex layout container
  const flexContainer = document.querySelector('.flex.min-h-screen');
  if (flexContainer) {
    const style = getComputedStyle(flexContainer);
    results.flexContainer = {
      display: style.display,
      flexDirection: style.flexDirection,
      width: flexContainer.offsetWidth,
      height: flexContainer.offsetHeight,
      children: Array.from(flexContainer.children).map(c => ({
        tag: c.tagName,
        class: c.className?.toString().slice(0,60),
        width: c.offsetWidth,
        height: c.offsetHeight,
        position: getComputedStyle(c).position,
        zIndex: getComputedStyle(c).zIndex,
        overflow: getComputedStyle(c).overflow,
        display: getComputedStyle(c).display,
      })),
    };
  }
  
  // 2. Check header
  const header = document.querySelector('header');
  if (header) {
    results.header = {
      height: header.offsetHeight,
      position: getComputedStyle(header).position,
      zIndex: getComputedStyle(header).zIndex,
      background: getComputedStyle(header).background?.slice(0,50),
      rect: header.getBoundingClientRect(),
      isSticky: getComputedStyle(header).position === 'sticky',
    };
  }

  // 3. Check bottom nav  
  const navs = document.querySelectorAll('nav');
  results.navs = Array.from(navs).map((n, i) => ({
    index: i,
    height: n.offsetHeight,
    position: getComputedStyle(n).position,
    zIndex: getComputedStyle(n).zIndex,
    bottom: getComputedStyle(n).bottom,
    rect: n.getBoundingClientRect(),
    ariaLabel: n.getAttribute('aria-label'),
    classes: n.className?.toString().slice(0,60),
  }));

  // 4. Check main content area
  const main = document.querySelector('main');
  if (main) {
    results.main = {
      paddingTop: getComputedStyle(main).paddingTop,
      paddingBottom: getComputedStyle(main).paddingBottom,
      rect: main.getBoundingClientRect(),
    };
  }
  
  // 5. Check if Sidebar desktop aside is hidden
  const asides = document.querySelectorAll('aside');
  results.asides = Array.from(asides).map((a, i) => ({
    index: i,
    display: getComputedStyle(a).display,
    width: a.offsetWidth,
    position: getComputedStyle(a).position,
    transform: getComputedStyle(a).transform,
    classes: a.className?.toString().slice(0,80),
  }));

  // 6. Check the parent div structure
  const mainContent = document.querySelector('#main-content');
  if (mainContent) {
    results.mainContent = {
      display: getComputedStyle(mainContent).display,
      overflow: getComputedStyle(mainContent).overflow,
      overflowX: getComputedStyle(mainContent).overflowX,
      width: mainContent.offsetWidth,
      rect: mainContent.getBoundingClientRect(),
    };
  }
  
  return results;
});

console.log(JSON.stringify(diagnostics, null, 2));

await browser.close();
