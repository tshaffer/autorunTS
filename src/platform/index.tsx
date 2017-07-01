let platform;

// platform = 'desktop';

console.log('attempt to create BS javascript object.');
try {
  const deviceInfo = new BSDeviceInfo();
  console.log('deviceInfo creation succeeded, running on a brightSign');
  console.log(deviceInfo);
  console.log('registry?');
  console.log(brightsign.registry.networking.dhcp);
  platform = 'brightsign';
}
catch (e) {
  console.log('deviceInfo creation failed, not a brightSign');
  platform = 'desktop';
}

let loadedModule = null;
if(platform === 'brightsign'){
  loadedModule = require('./brightsign/index.tsx');
}else{
  loadedModule = require('./desktop/index.tsx');
}
export default loadedModule;
