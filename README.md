# French Version
# Summoner's War Exporter

Cet outil analysera les données interceptées de la Guerre des Invocateurs et extraira des informations sur les monstres et les runes de l'utilisateur. Il fonctionne exactement comme SWProxy et l'objectif était d'écrire un proxy lisse, qui fonctionne rapidement et de corriger les problèmes courants avec SWProxy (problèmes de démarrage de SW, erreurs sur les pages d'événements, etc). Vous pouvez même activer Summoners War Exporter pour surfer normalement, car cela n'influence pas vraiment les autres pages.

![swex](http://i.imgur.com/NQGNNaF.png)

## Downloading and Installation

1. Allez à la[dernière version] (https://github.com/Xzandro/sw-exporter/releases/latest).
2. Téléchargez le paquet pour votre système d'exploitation. Windows propose également une version portable qui ne nécessite pas d'installation.
3. Exécutez-le !

D'autres instructions sont disponibles dans la section Aide de Summoner's War Exporter.

## Developing Plugins

Vous pouvez créer vos propres plugins qui recevront les événements et les données du jeu. Ce que vous faites de ces données dépend de votre imagination. Il y a deux options pour créer un plugin - un seul fichier javascript, ou un paquet NPM complet. Votre plugin doit exporter ce qui suit par défaut :

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

La[bibliothèque standard NodeJS 10](https://nodejs.org/dist/latest-v10.x/docs/api/) est disponible dans votre plugin. Pour recevoir les événements du jeu, vous devez vous abonner aux événements de `proxy'. Voir le[exemple de plugin](https://github.com/Xzandro/sw-exporter/blob/master/app/plugins/example-plugin.js) pour les deux options pour recevoir les événements - chaque événement de jeu ou des événements spécifiques. proxy " est un[EventEmitter](https://nodejs.org/docs/latest-v10.x/api/events.html). configuration" est la configuration de l'application SW-Exporter complète. Vous pouvez accéder à la configuration de votre plugin spécifique comme ceci : `config.Config.Plugins[<pluginName>]`. En cas de doute, parcourez les[plugins préemballés] (https://github.com/Xzandro/sw-exporter/tree/master/app/plugins) pour des exemples.

### Single Javascript File

Le[plugin exemple](https://github.com/Xzandro/sw-exporter/blob/master/app/plugins/example-plugin.js) détaille un plugin barebones sans dépendances externes.

### Full NPM package

Voir cet[exemple de repo](https://github.com/PeteAndersen/example-swex-plugin) pour un plugin qui nécessite le module[request](https://github.com/request/request) comme dépendance pour faire quelque chose. Tant que l'exportation par défaut de votre paquet correspond au formulaire spécifié ci-dessus, vous pouvez faire tout ce que vous voulez dans votre paquet, y compris les dépendances externes. Ces dépendances doivent se trouver dans un dossier node_modules dans le répertoire de votre plugin. La structure complète du fichier ressemblerait à ceci :

```
> Summoners War Exporter Files\plugins\my-fancy-plugin
> Summoners War Exporter Files\plugins\my-fancy-plugin\index.js
> Summoners War Exporter Files\plugins\my-fancy-plugin\other-plugin-code.js
> Summoners War Exporter Files\plugins\my-fancy-plugin\node_modules
```

#### Packaging

Vous pouvez placer votre plugin sous forme de dossier de fichiers dans le répertoire `plugins' et il fonctionnera. Cependant, il est recommandé de distribuer votre plugin sous la forme d'un fichier[asar](https://github.com/electron/asar).

Pour empaqueter correctement votre plugin, exécutez `$ asar pack <nom-dossier-plugin> <nom-plugin>.asar`. Votre archive asar doit inclure tous vos fichiers de code javascript et un dossier `node_modules' avec vos dépendances. Pour installer votre plugin packagé, déposez simplement le plugin.asar dans le dossier plugins. La structure du répertoire ressemblera à ceci :

```
Summoners War Exporter Files\plugins\my-fancy-plugin.asar
```

## Developing SW-Exporter

Installer [node.js](https://nodejs.org/).

```
$ git clone https://github.com/Xzandro/sw-exporter.git
$ cd sw-exporter
$ npm install
$ npm run dev
$ npm start
```

Et vous êtes prêt à vous développer. Nous utilisons ESLint pour les peluches, donc assurez-vous qu'il n'y a pas d'erreurs de peluches avant de soumettre un PR.

## Building Packages
Au début, vous devez garder à l'esprit que vous ne pouvez construire des paquets que pour votre système d'exploitation d'occasion actuel !

Il est également important que le bundle.js soit généré et mis à jour. Vous pouvez y parvenir par le biais de

```
$ npm run dev
```

pour lancer le script de développement ou simplement faire

```
$ webpack
```

Après cela, vous avez plusieurs possibilités.

### Windows

Pour Windows, vous pouvez créer une version Portable ou Setup (par défaut : Les deux seront créés). C'est modifiable via le paquet.json.
```
"win": {
  "target": [
    "nsis"
  ]
}
```

Il suffit de changer nsis en portable.

Construire les paquets (ia32 & x64 seront inclus dans un exécutable automatiquement)

```
$ npm run dist
```

### Linux

Un fichier de paquet AppImage & snap sera compilé qui est compatible avec la plupart des systèmes linux courants.

```
$ npm run dist
```

### Mac

Un fichier de paquet DMG typique et un fichier zip seront compilés.
```
$ npm run dist
```

## Setting up on a VPS

Fondamentalement, c'est la même chose que pour l'environnement de développement, mais vous devez définir deux variables d'enrionment de processus :

1. port (réglez ce paramètre à votre convenance)
2. autostart (réglez ce paramètre sur true ou 1, pour que le proxy démarre automatiquement)

Assurez-vous d'ouvrir le port spécifique dans votre pare-feu. Ce n'est pas idéal, car l'interface utilisateur, le chrome, l'électron et le frontend seront chargés quand même. C'est le mieux que l'on puisse obtenir sans pour autant séparer les électrons.
