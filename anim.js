var require_install = require('require-install'),
  request = require_install('request'),
	animCache = {}; // yes...

exports.match = function(text) {
	return text.startsWith(this.commandPrefix + 'anim');
};

exports.help = function() {
	return this.commandPrefix + 'anim <query> : Searches for animated GIF.';
};

exports.search = function (query, callback) {
	var cacheq = query.trim().toLowerCase();
	var index = 0;
	if (animCache[cacheq]) {
		if (new Date().getTime() - animCache[cacheq].dt > 86400000
			|| animCache[cacheq].index + 1 == animCache[cacheq].length) {
			delete animCache[cacheq];
		}
		else {
			animCache[cacheq].index++;
			index = animCache[cacheq].index;
		}
	}

	var q = {v: '1.0', rsz: '8', q: query, safe: 'active', imgtype: 'animated', as_filetype: 'gif'};

	request.get({url: 'http://ajax.googleapis.com/ajax/services/search/images', qs: q}, function(error, response, body) {
		if (response.statusCode === 200 && response.body) {
			var images = JSON.parse(response.body);
			if (images.responseData) {
				images = images.responseData.results;
				if (images && images.length > 0) {
					var image = images[index];
					if (!animCache[cacheq]) {
						animCache[cacheq] = {
							dt: new Date(),
							index: index,
							length: images.length
						};
					}
					callback(image);
				}
				else {
					callback({error:'No images found.'});
				}
			}
			else {
				callback({error:'Google images sucks.'});
			}
		}
		else {
			callback({error:'Whomever the system admin is around here, I demand that they should be fired.'});
		}
	});
};

// Taken from sassy. Copyright sassy authors
exports.ensureExt = function (url) {
	if (!/(.gif|.jpe?g|.png|.gifv)$/i.test(url)) {
		url += '#.png';
	}
	return url;
}

exports.run = function(api, event) {
	var query = event.body.substr(6);
	exports.search(query, function(image) {
		var img = exports.ensureExt(image.unescapedUrl);
		api.sendImage("url", img, "I found this:", event.thread_id);
	});
};
