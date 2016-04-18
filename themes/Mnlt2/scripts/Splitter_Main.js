// dpi settings
var g_dpi_percent = get_system_dpi_percent();
var g_forced_percent = window.GetProperty("DPI (default = 0)", 0);
var g_dpi = (g_forced_percent == 0 ? g_dpi_percent : g_forced_percent);
if (g_dpi <  100) g_dpi = 100;

//

$Splitter.CreatePanel(PanelClassNames.PSS, 3, true); // PSS Tabs
$Splitter.CreatePanel(PanelClassNames.WSHMP, 9, true); // Bottom toolbar
$Splitter.CreatePanel(PanelClassNames.WSHMP, 1, true); // wsh extra 1
$Splitter.CreatePanel(PanelClassNames.WSHMP, 2, true); // Wsh extra 2


$Splitter.ShowPanel(0, 1);
$Splitter.ShowPanel(1, 1);
$Splitter.ShowPanel(2, 0); //WSH 1: xiami cover download panel
$Splitter.ShowPanel(3, 0); //WSH 2: todo


var g_xiami_panel = 2;
var g_show_xiami_panel = false;
if (g_show_xiami_panel) {
	$Splitter.ShowPanel(g_xiami_panel, 1);
}


var z70 = zoom(70, g_dpi);
var z46 = zoom(46, g_dpi);

(function zoom_all() {
	z70 = zoom(70, g_dpi);
	z46 = zoom(46, g_dpi);
})();

addEventListener("on_size", function() {
	var bottom_height;
	if (ww < 510) {
		bottom_height = 80;
	} else if (ww < 930) {
		bottom_height = 85;
	} else {
		bottom_height = 65;
	}

	$Splitter.MovePanel(0, 0, 0, ww, wh - bottom_height);
	$Splitter.MovePanel(1, 0, wh - bottom_height, ww, bottom_height);
	//
	var z320 = zoom(320, g_dpi);
	var z380 = zoom(380, g_dpi);
	if (g_show_xiami_panel) {
		$Splitter.MovePanel(g_xiami_panel, Math.max(z380, ww) -z320-1, z46+1, z320, wh-z70-z46-2);
	}
}, true);

addEventListener("on_notify_data", function(name, info) {
	switch (name) {
		case "DPI":
			g_dpi = info;
			zoom_all();
			on_size();
			break;
		case "Show_search_cover_panel":
			/*
			console("Show panel: " + info);
			g_show_xiami_panel = info[0];
			$Splitter.ShowPanel(g_xiami_panel, g_show_xiami_panel);
			on_size();
			*/
			break;

	}
}, true);

