const os = require('os');
const { execSync, spawn } = require('child_process');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function isCloudflaredInstalled() {
  try {
    execSync('cloudflared --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

(async () => {
  const port = process.env.PORT || 5173;
  const localIp = getLocalIp();
  const hasCloudflared = isCloudflaredInstalled();

  console.log('\n================================================================');
  console.log('   🚀 ServiGo — Share Project Remotely / With Friends');
  console.log('================================================================');

  console.log(`\n📶 OPTION 1: Same Wi-Fi / Local Network`);
  console.log(`   If your friend is connected to the same Wi-Fi:`);
  console.log(`   👉 http://${localIp}:${port}/`);

  console.log(`\n⚡ OPTION 2: Cloudflare Quick Tunnels (Recommended for Demos)`);
  if (hasCloudflared) {
    console.log('   ✅ `cloudflared` is detected on your system!');
    console.log(`   Starting Cloudflare Quick Tunnel for port ${port}...`);
    console.log('   (Waiting for your .trycloudflare.com link...)\n');

    const tunnel = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`]);

    tunnel.stderr.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match) {
        console.log('================================================================');
        console.log('   🎉 Cloudflare Quick Tunnel Active:');
        console.log(`   👉 ${match[0]}`);
        console.log('================================================================');
        console.log('   • No Cloudflare account needed & completely free');
        console.log('   • Share this link with anyone for remote testing');
        console.log('   • Keep this terminal open while others need access (Ctrl+C to stop)\n');
      }
    });

    tunnel.on('close', () => {
      console.log('Cloudflare tunnel closed.');
      process.exit(0);
    });

    return;
  } else {
    console.log('   Free, fast, and no account required! Steps to use:');
    console.log('   1. Install cloudflared on Windows:');
    console.log('      winget install --id Cloudflare.cloudflared');
    console.log(`   2. Run: cloudflared tunnel --url http://localhost:${port}`);
    console.log('   3. Copy the generated https://*.trycloudflare.com link and share it!');
    console.log('   💡 Or run: npm run share:cloudflare (once cloudflared is installed)');
  }

  console.log(`\n🌐 OPTION 3: Instant Localtunnel Fallback`);
  console.log('   Starting localtunnel session...');

  try {
    const localtunnel = require('localtunnel');
    const tunnel = await localtunnel({ port });

    console.log(`\n   🎉 Public Link Generated:`);
    console.log(`   👉 ${tunnel.url}`);

    try {
      const res = await fetch('https://loca.lt/mytunnelpassword');
      const pass = await res.text();
      console.log(`\n   🔑 If prompted for a "Tunnel Password / Endpoint IP":`);
      console.log(`   Enter: ${pass.trim()}`);
    } catch (e) {}

    console.log('\n================================================================');
    console.log('💡 Keep this terminal open while your friend is testing.');
    console.log('Press Ctrl + C anytime to stop sharing.\n');

    tunnel.on('close', () => {
      console.log('Sharing tunnel closed.');
      process.exit(0);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
  } catch (err) {
    console.log('\n💡 SSH Tunnel Fallback (Zero install required):');
    console.log(`   ssh -R 80:localhost:${port} nokey@localhost.run\n`);
  }
})();
