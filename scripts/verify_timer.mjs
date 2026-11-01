import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.resolve('C:\\Users\\bhunu\\.gemini\\antigravity-ide\\brain\\7ac6b1f2-7d7d-4f1e-be3f-f1afaefd9575\\scratch\\edge_timer_profile');

async function testTimer() {
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

    console.log('Navigating to Practice setup with theme=dark...');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/practice?theme=dark' });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Toggle timer ON
    console.log('Clicking toggle timer switch...');
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("toggle-timer-btn").click()',
    });
    await new Promise(r => setTimeout(r, 500));

    // 2. Click 50 questions
    console.log('Clicking 50 questions preset...');
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("preset-questions-50-btn").click()',
    });
    await new Promise(r => setTimeout(r, 500));

    // 3. Click 60m timer preset
    console.log('Clicking 60m timer preset...');
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("preset-timer-60-btn").click()',
    });
    await new Promise(r => setTimeout(r, 500));

    const timeVal60 = await send('Runtime.evaluate', {
      expression: 'document.getElementById("timer-minutes-input").value',
      returnByValue: true
    });
    console.log('Timer value after 60m preset:', timeVal60.result.value);

    // 4. Click Auto preset (for 50 questions, should be 75m)
    console.log('Clicking Auto timer preset...');
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("recommended-timer-btn").click()',
    });
    await new Promise(r => setTimeout(r, 500));

    const timeValAuto = await send('Runtime.evaluate', {
      expression: 'document.getElementById("timer-minutes-input").value',
      returnByValue: true
    });
    console.log('Timer value after Auto preset:', timeValAuto.result.value);

    // 5. Test direct typing: set to 90
    console.log('Direct typing: setting timer to 90m...');
    await send('Runtime.evaluate', {
      expression: `
        const input = document.getElementById("timer-minutes-input");
        input.focus();
        input.value = "90";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.blur();
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const timeVal90 = await send('Runtime.evaluate', {
      expression: 'document.getElementById("timer-minutes-input").value',
      returnByValue: true
    });
    console.log('Timer value after typing 90:', timeVal90.result.value);

    // Capture screenshot
    const screenshot = await send('Page.captureScreenshot');
    const outPath = path.resolve('public', 'practice_timer_configured_dark.png');
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Saved public/practice_timer_configured_dark.png');

    ws.close();
  } finally {
    edge.kill();
  }
}

testTimer().catch(console.error);
