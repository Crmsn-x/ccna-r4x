import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = path.resolve('C:\\Users\\bhunu\\.gemini\\antigravity-ide\\brain\\a43d1fcc-ec18-4c51-a1fb-697980778bf1');
const userDataDir = path.join(artifactDir, 'scratch', 'edge_bank_profile');

async function testEthernetUI() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1600,1000',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9224/json/list');
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
    await new Promise(r => setTimeout(r, 3000));

    // 1. Search for ITN-M4-7-010 (Exhibit image question)
    console.log('Searching for ITN-M4-7-010...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.getElementById('search-questions-input');
          if (input) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(input, 'ITN-M4-7-010');
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return 'searched';
          }
          return 'input not found';
        })()
      `,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 1000));

    // Expand answer & explanation
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.getElementById('toggle-preview-explanation-btn');
          if (btn) btn.click();
        })()
      `
    });

    await new Promise(r => setTimeout(r, 1000));

    const snap1 = await send('Page.captureScreenshot', { format: 'png' });
    const snap1Path = path.join(artifactDir, 'bank_ethernet_exhibit.png');
    fs.writeFileSync(snap1Path, Buffer.from(snap1.data, 'base64'));
    console.log('Captured Exhibit test to:', snap1Path);

    // 2. Search for ITN-M4-7-005 (Matching question)
    console.log('Searching for ITN-M4-7-005 (Matching)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.getElementById('search-questions-input');
          if (input) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(input, 'ITN-M4-7-005');
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 1000));

    const snap2 = await send('Page.captureScreenshot', { format: 'png' });
    const snap2Path = path.join(artifactDir, 'bank_ethernet_matching.png');
    fs.writeFileSync(snap2Path, Buffer.from(snap2.data, 'base64'));
    console.log('Captured Matching test to:', snap2Path);

    ws.close();
  } finally {
    edge.kill();
  }
}

testEthernetUI().catch(err => {
  console.error('UI verification error:', err);
  process.exit(1);
});
