// =================================================
// @Name "Event handler"
// @Update "2015-11-08 13:10"
// @Refer "Shutter(http://dreamxis.themex.net/709)"
// =================================================

$Event = new function() {

	var $sys_callbacks = {};
	var $exec = function(event) {
		if (eval("typeof(" + event + ")") == 'undefined') {
			var script = event + " = function (a1, a2, a3, a4) {"
				+ "var _funcArr = $sys_callbacks['" + event + "'];"
				+ "for (var i = 0; i < _funcArr.length; i++)"
				+ "    _funcArr[i](a1, a2, a3, a4);"
				+ "}";
			eval(script);
		};
	};

	this.set = function(event, func) {
		if (!event) return;
		$sys_callbacks[event] = [];
		if (func) {
			$sys_callbacks[event][0] = func;
		};
		//
		$exec(event);
	};

	this.add = function(event, func) {
		if (!event) return;
		if (!$sys_callbacks[event]) $sys_callbacks[event] = [];
		if (func) {
			$sys_callbacks[event].push(func);
		};
		//
		$exec(event);
	};

	this.reset = function(event) {
		if (!event) {
			for (var i in $sys_callbacks) {
				$sys_callbacks[i] = [];
				$exec(i);
			}
			return;
		};
		$sys_callbacks[event] = [];
		$exec(event);
	};


};

