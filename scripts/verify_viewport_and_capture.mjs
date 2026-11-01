import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log('Starting Edge process with remote debugging...');
  const child = spawn(edge, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let connected = false;
  let targets;
  for (let i = 0; i < 30; i++) {
    await wait(300);
    try {
      targets = await getJson(`http://127.0.0.1:${PORT}/json`);
      if (targets && targets.length > 0) {
        connected = true;
        break;
      }
    } catch {
      // retry
    }
  }

  if (!connected) {
    console.error('Failed to connect to Edge remote debugging port');
    child.kill();
    process.exit(1);
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  console.log('Connecting to WebSocket target:', pageTarget.webSocketDebuggerUrl);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  const configs = [
    {
      name: 'practice_1366x768_expanded',
      width: 1366,
      height: 768,
      url: 'http://127.0.0.1:3000/practice?collapsed=false',
      dismissBanner: true
    },
    {
      name: 'practice_1366x768_collapsed',
      width: 1366,
      height: 768,
      url: 'http://127.0.0.1:3000/practice?collapsed=true',
      dismissBanner: true
    },
    {
      name: 'practice_1920x1080_expanded',
      width: 1920,
      height: 1080,
      url: 'http://127.0.0.1:3000/practice?collapsed=false',
      dismissBanner: true
    },
    {
      name: 'practice_1920x1080_collapsed',
      width: 1920,
      height: 1080,
      url: 'http://127.0.0.1:3000/practice?collapsed=true',
      dismissBanner: true
    }
  ];

  const results = [];

  for (const cfg of configs) {
    console.log(`\n======================================================`);
    console.log(`Testing viewport ${cfg.width}x${cfg.height} (${cfg.name})`);
    console.log(`======================================================`);

    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: cfg.width,
      height: cfg.height,
      deviceScaleFactor: 1,
      mobile: false
    });

    await sendCommand('Page.navigate', { url: cfg.url });
    // Wait for page to render
    await wait(1500);

    // If active session banner dismiss button exists, dismiss it for a pure default form test on one variation
    if (cfg.dismissBanner) {
      await sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const dismissBtn = document.querySelector('button[aria-label="Dismiss banner"]');
            if (dismissBtn) dismissBtn.click();
          })()
        `
      });
      await wait(500);
    }

    const evalResult = await sendCommand('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const main = document.querySelector('main');
          const startBtn = document.querySelector('button[type="submit"]');
          const btnRect = startBtn ? startBtn.getBoundingClientRect() : null;
          const root = document.documentElement;
          const body = document.body;

          const hasPageScrollbar = 
            root.scrollHeight > window.innerHeight ||
            body.scrollHeight > window.innerHeight ||
            (main && main.scrollHeight > main.clientHeight);

          return {
            windowInnerWidth: window.innerWidth,
            windowInnerHeight: window.innerHeight,
            rootScrollHeight: root.scrollHeight,
            rootClientHeight: root.clientHeight,
            bodyScrollHeight: body.scrollHeight,
            bodyClientHeight: body.clientHeight,
            mainScrollHeight: main ? main.scrollHeight : null,
            mainClientHeight: main ? main.clientHeight : null,
            hasPageScrollbar,
            startBtnVisible: Boolean(
              btnRect &&
              btnRect.top >= 0 &&
              btnRect.bottom <= window.innerHeight &&
              btnRect.left >= 0 &&
              btnRect.right <= window.innerWidth
            ),
            btnRect: btnRect ? {
              top: Math.round(btnRect.top),
              bottom: Math.round(btnRect.bottom),
              left: Math.round(btnRect.left),
              right: Math.round(btnRect.right),
              height: Math.round(btnRect.height)
            } : null
          };
        })()
      `
    });

    const metrics = evalResult.result.value;
    console.log('Metrics:', JSON.stringify(metrics, null, 2));

    // Capture screenshot
    const screenshot = await sendCommand('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true
    });

    const outDir = path.resolve('public');
    const outFile = path.join(outDir, `${cfg.name}.png`);
    fs.writeFileSync(outFile, Buffer.from(screenshot.data, 'base64'));
    console.log(`✓ Saved screenshot to ${outFile}`);

    results.push({
      ...cfg,
      metrics
    });
  }

  // Also copy primary 1366x768 screenshot to public/practice_setup_1366x768.png
  const primary1366 = path.resolve('public', 'practice_1366x768_expanded.png');
  const targetPrimary = path.resolve('public', 'practice_setup_tightened.png');
  if (fs.existsSync(primary1366)) {
    fs.copyFileSync(primary1366, targetPrimary);
  }

  ws.close();
  child.kill();

  console.log('\n======================================================');
  console.log('SUMMARY OF VIEWPORT VERIFICATION:');
  console.log('======================================================');
  let allPassed = true;
  for (const r of results) {
    const hasScrollbar = r.metrics.hasPageScrollbar;
    const btnVisible = r.metrics.startBtnVisible;
    const status = (!hasScrollbar && btnVisible) ? 'PASS' : 'FAIL';
    if (status === 'FAIL') allPassed = false;
    console.log(`${r.name} (${r.width}x${r.height}): [${status}] PageScrollbar=${hasScrollbar}, StartBtnVisible=${btnVisible}, BtnBottom=${r.metrics.btnRect?.bottom}px (Viewport=${r.metrics.windowInnerHeight}px)`);
  }

  if (allPassed) {
    console.log('\n✓ ALL VIEWPORT TESTS PASSED PERFECTLY: No scrolling in default form, Start practice button fully visible at all target sizes!');
  } else {
    console.error('\n✗ SOME VIEWPORT TESTS FAILED');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error in verification:', err);
  process.exit(1);
});
