const { exec } = require('child_process');
const os = require('os');

// Get the WiFi IP address
const getWifiIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (interface.internal === false && interface.family === 'IPv4') {
        return interface.address;
      }
    }
  }
  return '192.168.35.229'; // Fallback to the specified IP
};

const ip = getWifiIP();
console.log(`Starting Metro bundler on IP: ${ip}`);

// Set environment variable and start the server
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;

// Start the Metro bundler
exec('npm start -- --reset-cache', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(stdout);
  if (stderr) {
    console.error(stderr);
  }
}); 