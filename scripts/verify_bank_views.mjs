import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = path.resolve('C:\\Users\\bhunu\\.gemini\\antigravity-ide\\brain\\a43d1fcc-ec18-4c51-a1fb-697980778bf1');
const userDataDir = path.join(artifactDir, 'scratch', 'edge_bank_profile');

async function captureBank() {
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1600,1000',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9223/json/list');
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result || msg);
        callbacks.delete(msg.id);
      }
    };

    await new Promise(r => ws.onopen = r);

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    console.log('Navigating to http://127.0.0.1:3000/bank ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/bank' });

    // Wait for load
    await new Promise(r => setTimeout(r, 3000));

    // Capture 1: Browse Collapsed
    const snap1 = await send('Page.captureScreenshot', { format: 'png' });
    const snap1Path = path.join(artifactDir, 'bank_browse_collapsed.png');
    fs.writeFileSync(snap1Path, Buffer.from(snap1.data, 'base64'));
    console.log('Captured:', snap1Path);

    // Click "Show answer & explanation"
    console.log('Clicking Show answer & explanation button...');
    const clickRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.getElementById('toggle-preview-explanation-btn');
          if (btn) {
            btn.click();
            return 'clicked';
          }
          return 'btn not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Disclosure click result:', clickRes.result.value);

    // Wait for explanation load/expand animation
    await new Promise(r => setTimeout(r, 1000));

    // Capture 2: Browse Expanded
    const snap2 = await send('Page.captureScreenshot', { format: 'png' });
    const snap2Path = path.join(artifactDir, 'bank_browse_expanded.png');
    fs.writeFileSync(snap2Path, Buffer.from(snap2.data, 'base64'));
    console.log('Captured:', snap2Path);

    // Click Focus toggle button
    console.log('Switching to Focus view...');
    const focusClick = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.getElementById('bank-view-focus-btn');
          if (btn) {
            btn.click();
            return 'clicked focus';
          }
          return 'focus btn not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Focus click result:', focusClick.result.value);

    await new Promise(r => setTimeout(r, 1000));

    // Capture 3: Focus View
    const snap3 = await send('Page.captureScreenshot', { format: 'png' });
    const snap3Path = path.join(artifactDir, 'bank_focus_view.png');
    fs.writeFileSync(snap3Path, Buffer.from(snap3.data, 'base64'));
    console.log('Captured:', snap3Path);

    ws.close();
  } finally {
    edge.kill();
  }
}

captureBank().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
