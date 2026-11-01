import { execFile } from 'child_process';
import path from 'path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const captures = [
  {
    name: 'practice_timer_preview.png',
    url: 'http://127.0.0.1:3000/practice?theme=dark',
    size: '1586,992'
  },
  {
    name: 'sidebar_collapsed_light.png',
    url: 'http://127.0.0.1:3000/?theme=light&collapsed=true',
    size: '1586,992'
  },
  {
    name: 'sidebar_collapsed_dark.png',
    url: 'http://127.0.0.1:3000/?theme=dark&collapsed=true',
    size: '1586,992'
  }
];

function captureOne(idx) {
  if (idx >= captures.length) {
    console.log('All captures complete.');
    process.exit(0);
  }

  const item = captures[idx];
  const outPath = path.resolve('public', item.name);
  console.log(`Capturing ${item.name}...`);

  const args = [
    '--headless=new',
    '--screenshot=' + outPath,
    '--window-size=' + item.size,
    '--hide-scrollbars',
    item.url
  ];

  execFile(edge, args, (err) => {
    if (err) console.error(err);
    else console.log(`Saved ${item.name}`);
    setTimeout(() => captureOne(idx + 1), 700);
  });
}

captureOne(0);
