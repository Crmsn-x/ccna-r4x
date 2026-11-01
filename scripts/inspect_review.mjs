import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.resolve('C:\\Users\\bhunu\\.gemini\\antigravity-ide\\brain\\7ac6b1f2-7d7d-4f1e-be3f-f1afaefd9575\\scratch\\edge_inspect_review');

async function inspectReview() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1586,992',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9225/json/list');
    const targets = await listRes.json();
    const ws = new WebSocket(targets[0].webSocketDebuggerUrl);

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
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    const refPath = path.resolve('public', 'reference_review.png').replace(/\\/g, '/');
    await send('Page.navigate', { url: `file:///${refPath}` });
    await new Promise(r => setTimeout(r, 1000));

    // Load reference image onto canvas and inspect key elements
    const result = await send('Runtime.evaluate', {
      expression: `(() => {
        const img = document.querySelector('img');
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Sample colors and measure
        // Find title 'Review'
        // Tab bar y position
        // Empty state checkmark position
        // Start practice button position
        // Bottom link position
        return JSON.stringify({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      })()`,
      returnByValue: true
    });

    const getVal = (r) => (r.result ? r.result.value : r.value);
    console.log('Reference dimensions:', getVal(result));

    // Let's create visual crops of the key parts of the reference
    const cropScript = `
      (() => {
        const img = document.querySelector('img');
        if (!img) return JSON.stringify({ error: 'no img' });
        function crop(x, y, w, h) {
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
          return c.toDataURL('image/png').replace(/^data:image\\/png;base64,/, '');
        }
        return JSON.stringify({
          header: crop(270, 40, 1260, 100),
          tabs: crop(270, 160, 1260, 80),
          center: crop(270, 260, 1260, 360),
          bottom: crop(270, 620, 1260, 150)
        });
      })()
    `;

    const crops = await send('Runtime.evaluate', { expression: cropScript, returnByValue: true });
    const parsed = JSON.parse(getVal(crops));

    if (!parsed.error) {
      fs.writeFileSync('public/crop_ref_review_header.png', Buffer.from(parsed.header, 'base64'));
      fs.writeFileSync('public/crop_ref_review_tabs.png', Buffer.from(parsed.tabs, 'base64'));
      fs.writeFileSync('public/crop_ref_review_center.png', Buffer.from(parsed.center, 'base64'));
      fs.writeFileSync('public/crop_ref_review_bottom.png', Buffer.from(parsed.bottom, 'base64'));
      console.log('Saved crops of reference review');
    } else {
      console.error('Crop error:', parsed.error);
    }
    ws.close();
  } catch (err) {
    console.error('Inspect error:', err);
  } finally {
    edge.kill();
  }
}

inspectReview();
