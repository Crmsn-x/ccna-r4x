import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.resolve('C:\\Users\\bhunu\\.gemini\\antigravity-ide\\brain\\7ac6b1f2-7d7d-4f1e-be3f-f1afaefd9575\\scratch\\edge_debug_profile');

async function testHover() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1586,992',
    'about:blank'
  ]);

  // wait 1.5s for Edge to start
  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
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

    // 1. Navigate to Practice page with collapsed sidebar
    console.log('Navigating to practice with collapsed=true...');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/practice?collapsed=true' });
    await new Promise(r => setTimeout(r, 2000));

    // Check tooltip count when cursor is at 38, 100 (blank area in sidebar)
    console.log('Hovering over blank area in sidebar (x: 38, y: 100)...');
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 38,
      y: 100
    });
    await new Promise(r => setTimeout(r, 400));

    const evalBlank = await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("[role=\'tooltip\']").length',
      returnByValue: true
    });
    console.log('Tooltips count on sidebar blank area hover:', evalBlank.result.value);

    // 2. Find location of the Home / Overview icon button
    const evalNavOverview = await send('Runtime.evaluate', {
      expression: '(() => { const el = document.getElementById("nav-overview"); if (!el) return null; const r = el.getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width/2, y: r.top + r.height/2 }); })()',
      returnByValue: true
    });
    console.log('Overview nav rect:', evalNavOverview.result.value);

    if (evalNavOverview.result.value) {
      const coords = JSON.parse(evalNavOverview.result.value);
      console.log(`Hovering directly on Overview icon at (${coords.x}, ${coords.y})...`);
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: coords.x,
        y: coords.y
      });
      await new Promise(r => setTimeout(r, 500));

      const tooltipInfo = await send('Runtime.evaluate', {
        expression: '(() => { const tt = document.querySelectorAll("[role=\'tooltip\']"); return JSON.stringify(Array.from(tt).map(t => ({ text: t.innerText, visible: t.offsetWidth > 0, html: t.outerHTML }))); })()',
        returnByValue: true
      });
      console.log('Tooltips visible when hovering Overview icon:', tooltipInfo.result.value);

      // Capture screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(shot.data || shot.result?.data, 'base64');
      fs.writeFileSync(path.resolve('public', 'tooltip_hover_overview.png'), buffer);
      console.log('Saved public/tooltip_hover_overview.png');
    }

    // 3. Test Practical Labs hover
    const evalNavLabs = await send('Runtime.evaluate', {
      expression: '(() => { const el = document.getElementById("nav-practical-labs"); if (!el) return null; const r = el.getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width/2, y: r.top + r.height/2 }); })()',
      returnByValue: true
    });
    if (evalNavLabs.result.value) {
      const coords = JSON.parse(evalNavLabs.result.value);
      console.log(`Hovering directly on Practical Labs icon at (${coords.x}, ${coords.y})...`);
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: coords.x,
        y: coords.y
      });
      await new Promise(r => setTimeout(r, 500));

      const tooltipLabs = await send('Runtime.evaluate', {
        expression: '(() => { const tt = document.querySelectorAll("[role=\'tooltip\']"); return JSON.stringify(Array.from(tt).map(t => ({ text: t.innerText, visible: t.offsetWidth > 0 }))); })()',
        returnByValue: true
      });
      console.log('Tooltips visible when hovering Practical Labs icon:', tooltipLabs.result.value);

      const shotLabs = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.resolve('public', 'tooltip_hover_labs.png'), Buffer.from(shotLabs.data || shotLabs.result?.data, 'base64'));
      console.log('Saved public/tooltip_hover_labs.png');
    }

    // 4. Test Dark Mode
    console.log('Testing Dark Mode...');
    await send('Runtime.evaluate', {
      expression: 'document.documentElement.setAttribute("data-theme", "dark"); document.documentElement.classList.add("dark");'
    });
    await new Promise(r => setTimeout(r, 400));
    const shotDark = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('public', 'tooltip_hover_dark.png'), Buffer.from(shotDark.data || shotDark.result?.data, 'base64'));
    console.log('Saved public/tooltip_hover_dark.png');

    ws.close();
  } catch (err) {
    console.error('Test hover error:', err);
  } finally {
    edge.kill();
  }
}

testHover();
