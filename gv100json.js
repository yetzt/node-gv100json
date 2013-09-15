#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var colors = require("colors");
var linereader = require("line-reader");

var argv = require("optimist").argv;

var FILE_IN = (argv._.length >= 1) ? path.resolve(argv._[0]) : null;
var FILE_OUT = (argv._.length >= 2) ? path.resolve(argv._[1]) : null;

/* some fair advice */
console.error("Don't forget to convert the input file to unicode.".yellow.bold);

if (FILE_IN === null || (!fs.existsSync(FILE_IN))) {
	console.error("Please specify the input file as first argument".red.bold);
	process.exit(1);
}

var data = {
	"bundeslaender": [],
	"regierungsbezirke": [],
	"regionen": [],
	"kreise": [],
	"verbaende": [],
	"gemeinden": []
}

var tree = {};

linereader.eachLine(FILE_IN, function(line) {
	switch(line.substr(0,2)){
		case "10":
			data.bundeslaender.push({
				"date": line.substr(2,8),
				"bundesland": line.substr(10,2),
				"name": line.substr(22,50).replace(/^\s+|\s+$/g,'')
			});
		break;
		case "20":
			data.regierungsbezirke.push({
				"date": line.substr(2,8),
				"bundesland": line.substr(10,2),
				"regierungsbezirk": line.substr(12,1),
				"name": line.substr(22,50).replace(/^\s+|\s+$/g,'')
			});
		break;
		case "30":
			data.regionen.push({
				"date": line.substr(2,8),
				"bundesland": line.substr(10,2),
				"regierungsbezirk": line.substr(12,1),
				"region": line.substr(13,1),
				"name": line.substr(22,50).replace(/^\s+|\s+$/g,'')
			});
		break;
		case "40":
			switch (line.substr(122,2)) {
				case "41": var type = "Kreisfreie Stadt"; break;
				case "42": var type = "Stadtkreis"; break;
				case "43": var type = "Kreis"; break;
				case "44": var type = "Landkreis"; break;
				case "45": var type = "Regionalverband"; break;
			}
			data.kreise.push({
				"date": line.substr(2,8),
				"bundesland": line.substr(10,2),
				"regierungsbezirk": line.substr(12,1),
				"kreis": line.substr(13,2),
				"type": type,
				"name": line.substr(22,50).replace(/^\s+|\s+$/g,'')
			});
		break;
		case "50":
			switch (line.substr(122,2)) {
				case "50": var type = "Verbandsfreie Gemeinde"; break;
				case "51": var type = "Amt"; break;
				case "52": var type = "Samtgemeinde"; break;
				case "53": var type = "Verbandsgemeinde"; break;
				case "54": var type = "Verwaltungsgemeinschaft"; break;
				case "55": var type = "Kirchspielslandgemeinde"; break;
				case "56": var type = "Verwaltungsverband"; break;
				case "57": var type = "Verwaltungsgemeinschaft Trägermodell"; break;
				case "58": var type = "Erfüllende Gemeinde"; break;
			}
			data.verbaende.push({
				"date": line.substr(2,8),
				"bundesland": line.substr(10,2),
				"regierungsbezirk": line.substr(12,1),
				"kreis": line.substr(13,2),
				"verband": line.substr(18,4),
				"type": type,
				"name": line.substr(22,50).replace(/^\s+|\s+$/g,'')
			});
		break;
		case "60":
			switch (line.substr(122,2)) {
				case "60": var type = "Markt"; break;
				case "61": var type = "Kreisfreie Stadt"; break;
				case "62": var type = "Stadtkreis"; break;
				case "63": var type = "Stadt"; break;
				case "64": var type = "Kreisangehörige Gemeinde"; break;
				case "65": var type = "Gemeindefreies Gebiet, bewohnt"; break;
				case "66": var type = "Gemeindefreies Gebiet, unbewohnt"; break;
				case "67": var type = "Große Kreisstadt"; break;
				case "68": var type = "Amtsangehörige Gemeinde"; break;
				case "69": var type = "Amtsfreie Gemeinde"; break;
			}
			data.gemeinden.push({
				"date": line.substr(2,8),
				"bundesland": line.substr(10,2),
				"regierungsbezirk": line.substr(12,1),
				"kreis": line.substr(13,2),
				"gemeinde": line.substr(15,3),
				"verband": line.substr(18,4),
				"type": type,
				"name": line.substr(22,50).replace(/^\s+|\s+$/g,''),
				"area": parseInt(line.substr(128,11), 10),
				"population": parseInt(line.substr(139,11), 10),
				"population_male": parseInt(line.substr(150,11), 10),
				"postcode": line.substr(165,5),
				"postcode_unique": ((line.substr(170,5).replace(/^\s+|\s+$/g,'') === "") ? true : false)
			});
		break;
	}
}).then(function() {
	
	data.gemeinden.forEach(function(d){
		if (!(d.bundesland in tree)) tree[d.bundesland] = {"bezirke":{}};
		if (!(d.regierungsbezirk in tree[d.bundesland].bezirke)) tree[d.bundesland].bezirke[d.regierungsbezirk] = {"kreise":{}};
		if (!(d.kreis in tree[d.bundesland].bezirke[d.regierungsbezirk].kreise)) tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis] = {"verbaende":{}};
		if (!(d.verband in tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis].verbaende)) tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis].verbaende[d.verband] = {"gemeinden":{}};
		if (!(d.gemeinde in tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis].verbaende[d.verband].gemeinden)) tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis].verbaende[d.verband].gemeinden[d.gemeinde] = {
			"name": d.name,
			"type": d.type,
			"ags": [d.bundesland, d.regierungsbezirk, d.kreis, d.gemeinde].join(' '),
			"ars": [d.bundesland, d.regierungsbezirk, d.kreis, d.verband, d.gemeinde].join(' '),
			"area": d.area,
			"population": {
				"total": d.population,
				"male": d.population_male,
				"female": (d.population-d.population_male)
			},
			"postcode": (d.postcode_unique && d.postcode !== "     ") ? d.postcode : null
		};
	});

	data.verbaende.forEach(function(d){
		if (!(d.bundesland in tree)) tree[d.bundesland] = {"h":"bezirke","bezirke":{}};
		if (!(d.regierungsbezirk in tree[d.bundesland].bezirke)) tree[d.bundesland].bezirke[d.regierungsbezirk] = {"h":"kreise","kreise":{}};
		if (!(d.kreis in tree[d.bundesland].bezirke[d.regierungsbezirk].kreise)) tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis] = {"h":"verbaende","verbaende":{}};
		if (!(d.verband in tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis].verbaende)) tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis].verbaende[d.verband] = {};

		tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis].verbaende[d.verband].name = d.name;
		tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis].verbaende[d.verband].type = d.type;
	});

	data.kreise.forEach(function(d){
		if (!(d.bundesland in tree)) tree[d.bundesland] = {"h":"bezirke","bezirke":{}};
		if (!(d.regierungsbezirk in tree[d.bundesland].bezirke)) tree[d.bundesland].bezirke[d.regierungsbezirk] = {"h":"kreise","kreise":{}};
		if (!(d.kreis in tree[d.bundesland].bezirke[d.regierungsbezirk].kreise)) tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis] = {};
		tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis].name = d.name;
		tree[d.bundesland].bezirke[d.regierungsbezirk].kreise[d.kreis].type = d.type;
	});

	data.regierungsbezirke.forEach(function(d){
		if (!(d.bundesland in tree)) tree[d.bundesland] = {"h":"bezirke","bezirke":{}};
		if (!(d.regierungsbezirk in tree[d.bundesland].bezirke)) tree[d.bundesland].bezirke[d.regierungsbezirk] = {};
		tree[d.bundesland].bezirke[d.regierungsbezirk].name = d.name;
	});

	data.bundeslaender.forEach(function(d){
		if (!(d.bundesland in tree)) tree[d.bundesland] = {};
		tree[d.bundesland].name = d.name;
	});
	
	if (FILE_OUT !== null) {
		fs.writeFileSync(FILE_OUT, JSON.stringify(tree,null,'\t'));
	} else {
		process.stdout.write(JSON.stringify(tree,null,'\t')+'\n');
	}
	
	console.error("Done.".magenta);
	
});