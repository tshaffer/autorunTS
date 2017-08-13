declare function BSDeviceInfo() : void;

let platform;

platform = 'desktop';

// platform = 'brightsign';

console.log('attempt to create BS javascript object.');
try {
  var VideoModeClass = require("@brightsign/videomodeconfiguration");
  var vm = new VideoModeClass();
  const deviceInfo = new BSDeviceInfo();
  console.log('deviceInfo creation succeeded, running on a brightSign');
  console.log(deviceInfo);
  platform = 'brightsign';

  vm.getBestMode("hdmi").then((bestMode : any) => {
    console.log(bestMode);
  });
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
