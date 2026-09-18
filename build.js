const fs = require('fs');
const path = require('path');

const files = ['index.html', 'ludo.html', 'socket.io.min.js'];
const targetDirs = ['public', 'dist', 'Frontend', 'Frontend/public', 'Frontend/dist', 'Frontend/Frontend'];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  files.forEach(f => {
    let src = null;
    if (fs.existsSync(path.join(__dirname, 'Frontend', f))) src = path.join(__dirname, 'Frontend', f);
    else if (fs.existsSync(path.join(__dirname, f))) src = path.join(__dirname, f);
    if (src) {
      fs.copyFileSync(src, path.join(dir, f));
    }
  });
});

console.log('Build output directories ready for Vercel.');
