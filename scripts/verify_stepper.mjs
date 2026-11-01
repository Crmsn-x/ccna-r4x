import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.resolve('C:\\Users\\bhunu\\.gemini\\antigravity-ide\\brain\\7ac6b1f2-7d7d-4f1e-be3f-f1afaefd9575\\scratch\\edge_stepper_profile');

async function testStepper() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1586,992',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

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
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');

    console.log('Navigating to Practice setup...');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/practice' });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Initial State
    const initialVal = await send('Runtime.evaluate', {
      expression: 'document.getElementById("question-count-input").value',
      returnByValue: true
    });
    console.log('Initial question count input:', initialVal.result.value);

    // 2. Click 50 preset button directly
    console.log('Clicking 50 preset button...');
    await send('Runtime.evaluate', {
      expression: '(() => { const btn = document.getElementById("preset-questions-50-btn"); if (btn) { btn.click(); return "clicked 50"; } return "50 not found"; })()',
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 300));

    const valAfter50 = await send('Runtime.evaluate', {
      expression: 'document.getElementById("question-count-input").value',
      returnByValue: true
    });
    console.log('Question count after clicking 50 preset:', valAfter50.result.value);

    // 3. Test typing into the input directly (e.g. typing 35)
    console.log('Simulating direct typing of 35 into input...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.getElementById("question-count-input");
        input.focus();
        input.value = "35";
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.blur();
        return input.value;
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 300));

    const valAfterTyping = await send('Runtime.evaluate', {
      expression: 'document.getElementById("question-count-input").value',
      returnByValue: true
    });
    console.log('Question count after typing 35:', valAfterTyping.result.value);

    // 4. Click All (73) button
    console.log('Clicking All button...');
    await send('Runtime.evaluate', {
      expression: '(() => { const btn = document.getElementById("max-questions-btn"); if (btn) { btn.click(); return "clicked all"; } return "all not found"; })()',
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 300));

    const valAfterAll = await send('Runtime.evaluate', {
      expression: 'document.getElementById("question-count-input").value',
      returnByValue: true
    });
    console.log('Question count after clicking All:', valAfterAll.result.value);

    // 5. Click 50 preset again to capture preview screenshot showing 50 selected
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("preset-questions-50-btn").click()',
    });
    await new Promise(r => setTimeout(r, 400));

    // Capture screenshot in Light Mode
    const shotLight = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('public', 'stepper_presets_50_light.png'), Buffer.from(shotLight.data || shotLight.result?.data, 'base64'));
    console.log('Saved public/stepper_presets_50_light.png');

    // Test Dark Mode
    await send('Runtime.evaluate', {
      expression: 'document.documentElement.setAttribute("data-theme", "dark"); document.documentElement.classList.add("dark");',
    });
    await new Promise(r => setTimeout(r, 400));

    const shotDark = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('public', 'stepper_presets_50_dark.png'), Buffer.from(shotDark.data || shotDark.result?.data, 'base64'));
    console.log('Saved public/stepper_presets_50_dark.png');

    ws.close();
  } catch (err) {
    console.error('Test stepper error:', err);
  } finally {
    edge.kill();
  }
}

testStepper();
