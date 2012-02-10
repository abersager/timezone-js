
function printUsage() {
	print("usage: rhino preparse.js [options] [exemplarCity...]");
	print("");
	print("options:");
	print("     --zoneFileDirectory=<dir>    Specify location of Olson timezone files");
	print("     --datePath=<file>            Specify location of timezoneJS date.js");
	print("     --jsonPath=<file>            Specify location of JSON parser");
	print('Ex. >>> rhino preparse.js --zoneFileDirectory=olson_files Asia/Tokyo, America/New_York, Europe/London > major_cities.json');
	print('Ex. >>> rhino preparse.js --jsonPath=../json.js > all_cities.json');
}

function readText(uri) {
	var jf = new java.io.File(uri);
	var sb = new java.lang.StringBuffer();
	var input = new java.io.BufferedReader(new java.io.FileReader(jf));
	var line = "";
	var str = "";
	while((line = input.readLine()) != null){
		sb.append(line);
		sb.append(java.lang.System.getProperty("line.separator"));
	}
	// Cast to real JS String
	str += sb.toString();
	return str;
}

function olsonToJSON(baseDir, cities) {
	var _tz = timezoneJS.timezone;
	_tz.loadingScheme = _tz.loadingSchemes.MANUAL_LOAD;
	for (var i = 0; i < _tz.zoneFiles.length; i++) {
		var zoneFile = _tz.zoneFiles[i];
		var zoneData = readText(baseDir + '/' + zoneFile);
		_tz.parseZones(zoneData);
	}
	var result = {};
	if (cities && cities.length) {
		var zones = {};
		var rules = {};
		for (var i = 0; i < cities.length; i++) {
			var city = cities[i];
			zones[city] = _tz.zones[city];
		}
		for (var n in zones) {
			var zList = zones[n];
			for (var i = 0; i < zList.length; i++) {
				if (typeof zList[i] == 'undefined') {
					continue;
				}
				var ruleKey = zList[i][1];
				if (typeof _tz.rules[ruleKey] != 'undefined') {
					rules[ruleKey] = _tz.rules[ruleKey];
				}
			}
		}
		result.zones = zones;
		result.rules = rules;
	}
	else {
		result.zones = _tz.zones;
		result.rules = _tz.rules
	}
	result = JSON.stringify(result);
	return result;
}

function main(args) {
	
	if (!args.length) {
		printUsage();
		return;
	}

	// set defaults
	var zoneFileDirectory = '../tz_olson';
	var datePath = 'date.js';
	var jsonPath = '../json.js';
	
	var cities = [];

	// parse arguments
	var arg;
	for (var i = 0; i < args.length; i++) {
		arg = args[i];
		
		if (arg.slice(0, 2) == "--") {
			// parse option
			nameValue = arg.slice(2).split('=');

			switch(nameValue[0]) {
				case "zoneFileDirectory":
					zoneFileDirectory = nameValue[1];
					break;
				case "datePath":
					datePath = nameValue[1];
					break;
				case "jsonPath":
					jsonPath = nameValue[1];
					break;
				case "help":
					printUsage();
					return;
				default:
					print("Unknown option: " + arg);
					break;
			}
		}
		else {
			// parse remaining arguments
			cities.push(arg);
		}
	}
	
	// load dependencies
	load(datePath);
	load(jsonPath);
	
	// perform conversion
	var result = olsonToJSON(zoneFileDirectory, cities);
	print(result)
};


main(arguments);


