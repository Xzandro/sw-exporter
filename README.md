# Summoner's War Exporter

This tool will parse intercepted data from Summoner's War and extract information on the monsters and runes of the user. It works just like SWProxy and the focus was to write a smooth proxy, that runs fast and to fix common glitches with SWProxy (SW starting problems, errors on event pages etc.). You can even turn on Summoners War Exporter for normal surfing, because it doesnt really influence other pages much.

![swex](http://i.imgur.com/NQGNNaF.png)

## Downloading and Installation

1. Go to the [latest release](https://github.com/Xzandro/sw-exporter/releases/latest).
2. Download the package for your computer OS. Windows also offers a portable version which does not require installation.
3. Run it!

Further instructions are available in the Help section of Summoner's War Exporter

## Developing Plugins

You can create your own plugins that will receive in-game events and data. What you do with that data is up to your imagination. There are two options for creating a plugin - a single javascript file, or a full NPM package. Your plugin must export the following by default:

```javascript
module.exports = {
  defaultConfig: {
    enabled: true,
    // any other options for your plugin here
    // Must be simple value types - string, number, boolean
  },
  defaultConfigDetails: {
    // Provides some customization for the form input. Match keys from defaultConfig
  },
  pluginName: <string>,
  pluginDescription: <string>,
  init: function(proxy, config)
}
```

The [NodeJS 10 standard library](https://nodejs.org/dist/latest-v10.x/docs/api/) is available to use within your plugin. To receive game events, you must subscribe to events from `proxy`. See the [example plugin](https://github.com/Xzandro/sw-exporter/blob/master/app/plugins/example-plugin.js) for the two options to receive events - every game event, or specific events. `proxy` is an [EventEmitter](https://nodejs.org/docs/latest-v10.x/api/events.html). `config` is the configuration for the full SW-Exporter application. You can access your specific plugin's configuration like this: `config.Config.Plugins[<pluginName>]`. When in doubt, browse through the [prepackaged plugins](https://github.com/Xzandro/sw-exporter/tree/master/app/plugins) for examples.

### Single Javascript File

The [example plugin](https://github.com/Xzandro/sw-exporter/blob/master/app/plugins/example-plugin.js) details a barebones plugin with no external dependencies.

### Full NPM package

See this [example repo](https://github.com/PeteAndersen/example-swex-plugin) for a plugin that requires the [request](https://github.com/request/request) module as a dependency to do something. As long as your package's default export matches the form specified above, you can do anything you like within your package, including external dependencies. These dependencies must be in a node_modules folder within your plugin directory. The full file structure would look something like this:

```
> Summoners War Exporter Files\plugins\my-fancy-plugin
> Summoners War Exporter Files\plugins\my-fancy-plugin\index.js
> Summoners War Exporter Files\plugins\my-fancy-plugin\other-plugin-code.js
> Summoners War Exporter Files\plugins\my-fancy-plugin\node_modules
```

#### Packaging

You can place your plugin as a folder of files in the `plugins` directory and it will work. However, it is recommended for distribution to package your plugin as an [asar](https://github.com/electron/asar) file.

To correctly package your plugin, run `$ asar pack <plugin-folder-name> <plugin-name>.asar`. Your asar archive should include all of your javascript code files and a `node_modules` folder with your dependencies. To install your packaged plugin, simply drop the plugin.asar into the plugins folder. The directory structure will look like this:

```
Summoners War Exporter Files\plugins\my-fancy-plugin.asar
```

### Auto Updates

External plugins can utilize auto updates. Auto updates for plugins are only available if you pack your plugin as an `asar` file. You would need to add more information to your `index.js` file.

```javascript
module.exports = {
  // ... other config
  version: '2.0.0',
  autoUpdate: {
    versionURL: 'https://example.com/latest.yml',
  },
};
```

`version` and `autoUpdate.versionURL` need to be present. Version follows the [semver specs](https://semver.org/). autoUpdate.versionURL needs to be a valid URL, starting with `https` and ending with `.yml`.

The `.yml` file needs to have a specific schema.

```yml
version: 2.1.0
file: plugin-name.asar
url: https://example.com/plugin-name.asar
sha512: 1e2bb05da57d1ed20dcd751abcf670b67f6f848c9a3278b7a631e414b41545ac07fca47d5f8eeb638ea61047c54a45df16a0301079909e14ac362b6d264bb93b
size: 827
releaseDate: 2024-02-04T03:53:12.848Z
```

`url` needs to be valid, starting with `https` and ending with `.asar`. `sha512` is basically that, sha512 hash represented as hex.

SWEX will call your `.yml` version file, looks up the versions, checks if the remote version is newer than the local one and then downloads the plugin itself. SWEX will also check the `sha512` hash. If the hash of the downloaded file and the one from the `.yml` does not match, the plugin will not be updated.

## Developing SW-Exporter

Install [node.js](https://nodejs.org/).

```
$ git clone https://github.com/Xzandro/sw-exporter.git
$ cd sw-exporter
$ npm install
$ npm run dev
$ npm start
```

And you are ready to develop. We use ESLint for linting so make sure there are no linting errors before you submit a PR please.

## Building Packages

At first you need to keep in mind that you can only build packages for your current used OS!

It is also important that the bundle.js is generated & update-to-date. You can accomplish that via

```
$ npm run dev
```

to start the Development script or just do

```
$ webpack
```

After that you have several possibilities.

### Windows

For Windows you can build a Portable or Setup version (default: Both will build). That's changeable via the package.json.

```
"win": {
  "target": [
    "nsis"
  ]
}
```

Just change nsis to portable.

Building the packages (ia32 & x64 will be included in one executable automatically)

```
$ npm run dist
```

### Linux

An AppImage & snap package file will be build which is compatible with most common linux os.

```
$ npm run dist
```

### Mac

A typical DMG package file and a zip file will be build.

```
$ npm run dist
```

## Setting up on a VPS

Basically the same like for the Development environment, but you need to set two process enrionment variables:

1. port (set this to your liking)
2. autostart (set this to true or 1, so that the proxy will start automatically)

Make sure you open the specific port in your firewall. This isnt ideal, because the UI, chromium, electron and the frontend will be loaded regardless. It's the best we can get without splitting off electron though.
