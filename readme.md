# GV100AD.js

Convert [GV100AD](https://www.destatis.de/DE/ZahlenFakten/LaenderRegionen/Regionales/Gemeindeverzeichnis/Gemeindeverzeichnis.html) ASCII files to json. 

## Install

````
npm isntall gv100json -g
````

## Usage

Note: Convert your gv100-file to proper UTF-8 first!

````
$ iconv -f iso-8859-1 -t utf8 GV100AD.ASC
$ gv100json <GV100AD.ASC> [<out.json>]
````
