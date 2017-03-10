var packager = require('electron-packager')
const fs = require('fs');
const path = require('path');

packager({
  dir: '.',
  out: 'dist',
  //all: true,
  platform: 'win32',
  arch: 'x64',
  ignore: ['/plugins($|/)'],
  overwrite: true,
  afterExtract: [
    function (buildPath, electronVersion, platform, arch, callback) {
      console.log(buildPath, electronVersion, platform, arch);
      callback();
    }
  ]
}, function(errors, paths) {});
