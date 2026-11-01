import { execFile } from 'child_process';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
execFile(edge, [
  '--headless=new',
  '--dump-dom',
  'http://127.0.0.1:3000/?theme=dark'
], (err, stdout) => {
  const matches = stdout.match(/data-theme="[^"]*"/g);
  console.log('data-theme matches:', matches);
  const themeToggle = stdout.indexOf('Appearance');
  console.log('Appearance text found:', themeToggle !== -1);
});
