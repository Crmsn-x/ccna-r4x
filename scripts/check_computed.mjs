import { execFile } from 'child_process';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
execFile(edge, [
  '--headless=new',
  '--dump-dom',
  'http://127.0.0.1:3000/?theme=dark'
], (err, stdout) => {
  console.log('Sidebar background in HTML:', stdout.includes('var(--bg-sidebar)'));
});
