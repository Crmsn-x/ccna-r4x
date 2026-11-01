import { execFile } from 'child_process';
import path from 'path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const captures = [
  {
    name: 'sidebar_expanded_preview.png',
    url: 'http://127.0.0.1:3000/?theme=light',
    size: '1586,992'
  },
  {
    name: 'sidebar_collapsed_preview.png',
    url: 'http://127.0.0.1:3000/?theme=light&collapsed=true',
    size: '1586,992'
  },
  {
    name: 'sidebar_dark_preview.png',
    url: 'http://127.0.0.1:3000/?theme=dark',
    size: '1586,992'
  },
  {
    name: 'sidebar_mobile_preview.png',
    url: 'http://127.0.0.1:3000/?theme=light&mobileDrawer=true',
    size: '390,844'
  }
];

function captureOne(idx) {
  if (idx >= captures.length) {
    console.log('All screenshots captured successfully.');
    process.exit(0);
  }

  const item = captures[idx];
  const outPath = path.resolve('public', item.name);
  console.log(`Capturing ${item.name} (${item.size}) from ${item.url}...`);

  const args = [
    '--headless=new',
    '--screenshot=' + outPath,
    '--window-size=' + item.size,
    '--hide-scrollbars',
    item.url
  ];

  execFile(edge, args, (err) => {
    if (err) {
      console.error(`Error capturing ${item.name}:`, err);
    } else {
      console.log(`Saved ${item.name}`);
    }
    setTimeout(() => captureOne(idx + 1), 700);
  });
}

captureOne(0);
