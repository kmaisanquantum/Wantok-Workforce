const fs = require('fs');
const path = require('path');

const index_path = path.join(__dirname, 'dist/index.html');
if (!fs.existsSync(index_path)) {
    console.log('Dist index.html not found, skipping PWA injection.');
    process.exit(0);
}

let content = fs.readFileSync(index_path, 'utf8');

if (!content.includes('rel="manifest"')) {
    content = content.replace('</head>', '  <link rel="manifest" href="/manifest.json">\n</head>');
    console.log('Injected manifest link');
}

if (!content.includes('/service-worker.js')) {
    const sw_script = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('SW registered:', reg))
            .catch(err => console.log('SW registration failed:', err));
        });
      }
    </script>
    `;
    content = content.replace('</body>', sw_script + '\n</body>');
    console.log('Injected SW registration');
}

fs.writeFileSync(index_path, content);
