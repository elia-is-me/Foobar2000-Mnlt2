// ==PREPROCESSOR==
// @name "Common"
// @version "1.1"
// @author "Jensen"
// ==/PREPROCESSOR==

var ThisPanelsName = "";
var ww, wh;
var $sys_callBackFuncs = {};

function addEventListener(event, func, unshift){
	if(!event) return;
	if(!$sys_callBackFuncs[event])
		$sys_callBackFuncs[event] = [];
	if(func){
		var funcArr2 = $sys_callBackFuncs[event];
		if(unshift)
			funcArr2.unshift(func);
		else
			funcArr2.push(func);
	}
	if(eval("typeof("+event+")")=='undefined'){
		var script = event + " = function(a1, a2, a3, a4){ var funcArr = $sys_callBackFuncs['" + event + "']; for(var i=0; i<funcArr.length; i++) funcArr[i](a1, a2, a3, a4); }";
		eval(script);
	}
}

//function removeEventListener(event, func){}

$sys_callBackFuncs["on_size"] = [];
function on_size() {
    if (!window.Width || !window.Height) return;
    ww = window.Width;
    wh = window.Height;
    
    var funcArr = $sys_callBackFuncs["on_size"];
    for(var i=0; i<funcArr.length; i++)
		funcArr[i]();
}

function disable_rbtn_menu() {
	var rbtn_down;
	addEventListener("on_mouse_rbtn_down");
	var temp = on_mouse_rbtn_down;
	on_mouse_rbtn_down = function(x, y, mask) {
		temp();
		rbtn_down = (mask == 6);
	}
	addEventListener("on_mouse_rbtn_up");
	var temp2 = on_mouse_rbtn_up;
	on_mouse_rbtn_up = function(x, y, mask) {
		temp2();
		if (rbtn_down) {
			rbtn_down = false;
			return mask != 4;
		} else {
			return true;
		}
	}
}
