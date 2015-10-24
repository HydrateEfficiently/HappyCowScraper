(function () {

	var C_HAPPY_COW_ROOT_URL = "http://happycow.net";

	function buildUrl(path) {
		return C_HAPPY_COW_ROOT_URL + path;
	}

	module.exports = {
		buildUrl: buildUrl
	};

} ());