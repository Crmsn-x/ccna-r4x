import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.resolve('C:\\Users\\bhunu\\.gemini\\antigravity-ide\\brain\\7ac6b1f2-7d7d-4f1e-be3f-f1afaefd9575\\scratch\\edge_review_profile');

async function captureReview() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1586,992',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9226/json/list');
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
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');

    console.log('Navigating to Review page...');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/review' });
    await new Promise(r => setTimeout(r, 2000));

    // Capture initial state (Light mode)
    const shotInitial = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('public', 'review_preview.png'), Buffer.from(shotInitial.data || shotInitial.result?.data, 'base64'));
    console.log('Saved public/review_preview.png');

    // Test clicking on Unsure & Guessed tab
    console.log('Switching to Unsure & Guessed tab...');
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("tab-unsure-guessed").click()',
    });
    await new Promise(r => setTimeout(r, 500));

    const shotUnsure = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('public', 'review_unsure_preview.png'), Buffer.from(shotUnsure.data || shotUnsure.result?.data, 'base64'));
    console.log('Saved public/review_unsure_preview.png');

    // Test Dark Mode on Review
    console.log('Capturing Dark Mode Review...');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/review?theme=dark' });
    await new Promise(r => setTimeout(r, 1500));
    await send('Runtime.evaluate', {
      expression: 'document.documentElement.setAttribute("data-theme", "dark"); document.documentElement.classList.add("dark");',
    });
    await new Promise(r => setTimeout(r, 500));

    const shotDark = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('public', 'review_preview_dark.png'), Buffer.from(shotDark.data || shotDark.result?.data, 'base64'));
    console.log('Saved public/review_preview_dark.png');

    ws.close();
  } catch (err) {
    console.error('Capture review error:', err);
  } finally {
    edge.kill();
  }
}

captureReview();
