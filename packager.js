var packager = require('electron-packager')
const fs = require('fs');
const path = require('path');

packager({
  dir: '.',
  out: 'dist',
  //all: true,
  platform: 'win32,darwin,linux',
  arch: 'x64',
  ignore: ['/plugins($|/)'],
  overwrite: true,
  asar: true,
  win32metadata: {
    CompanyName: 'SW Exporter Company',
    FileDescription: 'Summoners War Exporter',
    OriginalFilename: 'Summoners War Exporter',
    ProductName: 'Summoners War Exporter',
    ProductName: 'Summoners War Exporter'
  },
  afterExtract: [
    function (buildPath, electronVersion, platform, arch, callback) {
      console.log(buildPath, electronVersion, platform, arch);
      callback();
    }
  ]
}, function(errors, paths) {});
