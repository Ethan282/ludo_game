const fs = require('fs');
const path = require('path');

const files = ['index.html', 'ludo.html', 'socket.io.min.js'];
const targetDirs = ['public', 'dist', 'Frontend'];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  files.forEach(f => {
    let src = null;
    if (fs.existsSync(path.join(__dirname, f))) src = path.join(__dirname, f);
    if (src) {
      fs.copyFileSync(src, path.join(dir, f));
    }
  });
});

console.log('Frontend build output directories ready for Vercel.');
