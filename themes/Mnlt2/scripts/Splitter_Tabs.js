// vim:set ft=javascript fileencoding=utf-8 bomb et:

// NOTE: This file should be saved in utf-8 WITH BOMB.
// 注意: 此文件需保存成 utf-8带bom 格式.

var lang = window.GetProperty("界面语言(lang)(cn:中文, en: English)", "auto").toLowerCase();
if (lang != "cn" && lang != "en") {
    lang = (fb.TitleFormat("$meta()").Eval(true) == "[未知函数]") ? "cn" : "en";
}

var lang_pack = {};
if (lang == "cn") {
	lang_pack = {
        "Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)": "颜色主题 0: 系统 1: 亮色 2: 暗色 3: 用户",
        "Color text normal": "颜色 文字",
        "Color text selected": "颜色 选中文字",
        "Color background normal": "颜色 背景",
        "Color background selected" : "颜色 选中背景",
        "Color highlight": "颜色 高亮",
		"File": "文件",
		"Edit": "编辑",
		"View": "视图",
		"Playback": "播放",
		"Library": "媒体库",
		"Help": "帮助",
		"Segoe UI Semibold": "微软雅黑",
		"Debug mode": "调试模式",
        "Playlist": "播放列表",
        "Lyric": "歌词",
        "Biography": "简介",
        "About Mnlt2": "关于Mnlt2(改)",
        "System color": "系统颜色",
        "Light color": "亮色",
        "Dark color": "暗黑",
        "User color": "用户自定义颜色",
        "Library/Album List": "媒体库/专辑列表",
        "Main menu": "主菜单",
	}
}

function __(name) {
    var str = lang_pack[name];
    if (!str) str = name;
    return str;
}

var COLOR_SCHEME = [
{
    txt_normal: RGB(20, 20, 20),
    txt_selected: RGB(20, 20, 20), 
    bg_normal: RGB(245, 245, 245),
    bg_selected: RGB(164, 194, 0),
    highlight: RGB(56, 99, 0)
},
{
    txt_normal: RGB(160, 160, 160),
    txt_selected: RGB(160, 160, 160),
    bg_normal: RGB(30, 30, 30),
    bg_selected: RGB(65, 65, 65),
    highlight: RGB(255, 165, 0)
},
{
    txt_normal: eval(window.GetProperty(__("Color text normal"), "RGB(30, 30, 30)")),
    txt_selected: eval(window.GetProperty(__("Color text selected"), "RGB(0, 0, 0)")),
    bg_normal: eval(window.GetProperty(__("Color background normal"), "RGB(255, 255, 255)")),
    bg_selected: eval(window.GetProperty(__("Color background selected"), "RGB(180, 180, 180)")),
    highlight: eval(window.GetProperty(__("Color highlight"), "RGB(215, 65, 100)"))
}
];

var g_color_scheme = window.GetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), 0); 
var g_colors = {};
get_colors();

function get_colors () {
    if (g_color_scheme == 0) {
        g_colors = get_default_colors();
    } else {
        g_colors = COLOR_SCHEME[g_color_scheme - 1];
    }
    window.NotifyOthers("Switch color scheme", g_color_scheme);
}

function get_default_colors () {
    var result = {};

    if (window.InstanceType == 1) {
        result.txt_normal = window.GetColorDUI(ColorTypeDUI.text);
        result.bg_normal = window.GetColorDUI(ColorTypeDUI.background);
        result.bg_selected = window.GetColorDUI(ColorTypeDUI.selection);
        result.highlight = window.GetColorDUI(ColorTypeDUI.highlight);
        var c = combineColors(result.bg_normal, result.bg_selected & 0x39ffffff);
        result.txt_selected = (Luminance(c) > 0.6 ? 0xff000000 : 0xfff5f5f5);
        if (Luminance(c) > 0.6) {
            result.txt_selected = blendColors(result.txt_normal, 0xff000000, 0.3);
        } else {
            result.txt_selected = blendColors(result.txt_normal, 0xffffffff, 0.3);
        };
    } else { 
        try {
            result.txt_normal = window.GetColorCUI(ColorTypeCUI.text);
            result.txt_selected = window.GetColorCUI(ColorTypeCUI.selection_text);
            result.bg_normal = window.GetColorCUI(ColorTypeCUI.background);
            result.bg_selected = window.GetColorCUI(ColorTypeCUI.selection_background);
            result.highlight = window.GetColorCUI(ColorTypeCUI.active_item_frame);
        } catch (e) {
            result = COLOR_SCHEME[0];
        } 
    };

    return result;
}




function zoom_all() {
}


addEventListener("on_colors_changed", function() {
    get_colors();
    get_images();
    on_size();
    window.Repaint();
    //window.NotifyOthers("Switch color scheme", g_color_scheme);
}, true);

var g_dpi_percent = get_system_dpi_percent();
var g_forced_percent = window.GetProperty("DPI (default = 0)", 0);
var g_dpi = (g_forced_percent == 0 ? g_dpi_percent : g_forced_percent);
if (g_dpi < 100) g_dpi = 100;
//window.NotifyOthers("DPI", g_dpi);

var ww = 0, wh = 0;
var debug_mode = window.GetProperty(__("Debug mode"), false);
var tab_height = zoom(46, g_dpi);;
var dtool_height = zoom(22, g_dpi);
var margin_top = debug_mode ? tab_height + dtool_height : tab_height;

var wsh_panel_start = 3;
var panels = [
	$Splitter.CreatePanel(PanelClassNames.WSHMP, wsh_panel_start, true), // 0,
	//$Splitter.CreatePanel(PanelClassNames.WSHMP, 2, true), //1,
	$Splitter.CreatePanel(PanelClassNames.PSS, 4, true), //1
	$Splitter.CreatePanel(PanelClassNames.WSHMP, wsh_panel_start+2, true), //2,
    $Splitter.CreatePanel(PanelClassNames.WSHMP, wsh_panel_start+3, true), //3,
    //$Splitter.CreatePanel(PanelClassNames.PSS, 5, true) //3,
];

var searchbox = $Splitter.CreatePanel(PanelClassNames.WSHMP,wsh_panel_start+4,true); //4

function show_panel(id) {
	for (var i = 0, l = panels.length; i < l; i++) {
		if (i == id) {
			$Splitter.ShowPanel(i, 1);
			$Splitter.MovePanel(i, 0, margin_top, ww, wh - margin_top);
		} else {
			$Splitter.ShowPanel(i, 0);
		};
	};
    // always show search panel
    $Splitter.ShowPanel(4, 1);
};


Tab = function(text, x, y, w, h, func) {
	this.text = text;
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.state = 0;
	this.is_down = false;
	this.is_hover = false;
	this.show = false;
	this.func = func;
	this.font = gdi.Font(__("Segoe UI"), zoom(14, g_dpi));
};

Tab.prototype.draw = function(gr) {
	gr.GdiDrawText(this.text, this.font, this.colors[this.state], this.x, this.y, this.w, this.h, 35845);
};

Tab.prototype.repaint = Button.prototype.repaint;
Tab.prototype.on_click = Button.prototype.on_click;
Tab.prototype.set_xy = Button.prototype.set_xy;
Tab.prototype.reset = Button.prototype.reset;
Tab.prototype.check_state = Button.prototype.check_state;

var pid = window.GetProperty("Visible Panel ID:", 0);

var bt = [
	new Tab(__("Playlist"), 0, 0, 30, tab_height, function() {
		pid = 0;
		show_panel(0);
		window.SetProperty("Visible Panel ID:", 0);
	}),
	new Tab(__("Lyric"), 0, 0, 30, tab_height, function() {
		pid = 1;
		show_panel(1);
		window.SetProperty("Visible Panel ID:", 1);
	}),
	new Tab(__("Biography"), 0, 0, 30, tab_height, function() {
		pid = 2;
		show_panel(2);
		window.SetProperty("Visible Panel ID:", 2);
	}),
	new Tab(__("Library"), 0, 0, 30, tab_height, function() {
		pid = 3;
		show_panel(3);
		window.SetProperty("Visible Panel ID:", 3);
        //fb.RunMainMenuCommand(__("Library/Album List"))
	})
];

var tab_len = 4;
for (var i = 0; i < tab_len; i++) {
	bt[i].w = GetTextWidth(bt[i].text, bt[i].font);
};

var images = {};

function get_images() {
	var font = gdi.Font("Segoe MDL2 Assets", zoom(16, g_dpi));
	var colors = [g_colors.txt_normal, g_colors.txt_normal, g_colors.highlight];
	var w = zoom(25, g_dpi);
	var s, imgarr, img;
	var sf = 285212672;

	// Main menu
	imgarr =  [];
	for (s = 0; s < 3; s++) {
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(3);

		g.DrawString("\uE700", font, colors[s], 0, 0, w, w, sf);

		img.ReleaseGraphics(g);
		imgarr[s] = img;
	}
	images.menu = imgarr;
    // Main menu
    bt[tab_len] = new Button(images.menu, function() {
        main_menu(bt[tab_len].x, bt[tab_len].y+bt[tab_len].h);
    }, __("Main menu"));

}

get_images();


// Console
var bt_start = tab_len + 1;
var font_ = gdi.font("Segoe UI", zoom(12, g_dpi), 0);
var gap = zoom(30, g_dpi);

bt[bt_start] = new Tab("Console", zoom(20, g_dpi), tab_height, GetTextWidth("Console", font_), dtool_height, function() {
	fb.ShowConsole();
});
bt[bt_start].font = font_;
bt[bt_start+1] = new Tab("Preferences", bt[bt_start].x+bt[bt_start].w+gap, tab_height, GetTextWidth("Preferences", font_), dtool_height, function() {
	fb.ShowPreferences();
});
bt[bt_start+1].font = font_;
bt[bt_start+2] = new Tab("Reload", bt[bt_start+1].x+bt[bt_start+1].w+gap, tab_height, GetTextWidth("Reload", font_) , dtool_height, function() {
	window.NotifyOthers("Reload script", true);
});
bt[bt_start+2].font = font_;
bt[bt_start+3] = new Tab("Close", bt[bt_start+2].x+bt[bt_start+2].w+gap, tab_height, GetTextWidth("Close", font_), dtool_height, function() {
	debug_mode = false;
	margin_top = (debug_mode ? (tab_height+dtool_height) : tab_height);
	window.SetProperty(__("Debug mode"), debug_mode);
	on_size();
});
bt[bt_start+3].font = font_;

function main_menu(x, y) {

	bt[tab_len].state = 2;

    var basemenu = window.CreatePopupMenu();
    //var contextman = fb.CreateContextMenuManager();

    //contextman.InitNowPlaying();

    var child1 = window.CreatePopupMenu(); //File
    var child2 = window.CreatePopupMenu(); //Edit
    var child3 = window.CreatePopupMenu(); //View
    var child4 = window.CreatePopupMenu(); //Playback
    var child5 = window.CreatePopupMenu(); //Library
    var child6 = window.CreatePopupMenu(); //Help
    //var child7 = window.CreatePopupMenu(); //Now playing

    var menuman1 = fb.CreateMainMenuManager();
    var menuman2 = fb.CreateMainMenuManager();
    var menuman3 = fb.CreateMainMenuManager();
    var menuman4 = fb.CreateMainMenuManager();
    var menuman5 = fb.CreateMainMenuManager();
    var menuman6 = fb.CreateMainMenuManager();

    child1.AppendTo(basemenu, MF_STRING, __("File"));
    child2.AppendTo(basemenu, MF_STRING, __("Edit"));
    child3.AppendTo(basemenu, MF_STRING, __("View"));
    child4.AppendTo(basemenu, MF_STRING, __("Playback"));
    child5.AppendTo(basemenu, MF_STRING, __("Library"));
    child6.AppendTo(basemenu, MF_STRING, __("Help"));

    menuman1.Init("file");
    menuman2.Init("edit");
    menuman3.Init("View");
    menuman4.Init("playback");
    menuman5.Init("library");
    menuman6.Init("help");

    menuman1.BuildMenu(child1, 1, 200);
    menuman2.BuildMenu(child2, 201, 200);
    menuman3.BuildMenu(child3, 401, 200);
    menuman4.BuildMenu(child4, 601, 300);
    menuman5.BuildMenu(child5, 901, 300);
    menuman6.BuildMenu(child6, 1201, 100);
	basemenu.AppendMenuSeparator();

	var _mnlt = window.CreatePopupMenu();
	_mnlt.AppendTo(basemenu, MF_STRING, "Mnlt2");
    _mnlt.AppendMenuItem(MF_STRING, 1500, __("About Mnlt2"));
    _mnlt.AppendMenuSeparator();
    _mnlt.AppendMenuItem(MF_STRING, 1501, __("System color"));
    //_mnlt.AppendMenuSeparator();
    _mnlt.AppendMenuItem(MF_STRING, 1502, __("Light color"));
    _mnlt.AppendMenuItem(MF_STRING, 1503, __("Dark color"));
    _mnlt.AppendMenuItem(MF_STRING, 1504, __("User color"));
    _mnlt.CheckMenuRadioItem(1501, 1504, 1501+g_color_scheme);


    //basemenu.AppendMenuItem(MF_STRING, 1500, "Mnlt2");

    ret = 0;

    ret = basemenu.TrackPopupMenu(x, y);

    // fb.trace(ret);
    switch (true) {
    case(ret >= 1 && ret < 201):
        menuman1.ExecuteByID(ret - 1);
        break;

    case (ret >= 201 && ret < 401):
        menuman2.ExecuteByID(ret - 201);
        break;

    case (ret >= 401 && ret < 601):
        menuman3.ExecuteByID(ret - 401);
        break;

    case (ret >= 601 && ret < 901):
        menuman4.ExecuteByID(ret - 601);
        break;

    case (ret >= 901 && ret < 1201):
        menuman5.ExecuteByID(ret - 901);
        break;

    case (ret >= 1201 && ret < 1301):
        menuman6.ExecuteByID(ret - 1201);
        break;

    case (ret == 1500):
        //contextman.ExecuteByID(ret - 1301);
        /*
		debug_mode = !debug_mode;
		margin_top = (debug_mode ? (tab_height+22) : tab_height);
		window.SetProperty(__("Debug mode"), debug_mode);
		on_size();
        */
        alert("关于 Mnlt2(改)\n\n" + 
                "Mnlt2 原作是 Fanco86 创作的一款 foobar2000 皮肤，以简洁、美观且方便自定义而著名。" +
                "本作品基于 Mnlt2 修改而来。\n\n" + 
                "改动\n\n" + 
                "--* 布局大改: 使用 WSH 脚本操控面板的布局、显隐\n" + 
                "--* 所有面板更换(三遍)\n" + 
                "----* 播放列表改为 WSH 播放列表\n" + 
                "----* 歌词面板改为 ESLyric (by ttsping)\n" + 
                "----* 简介改为 WSH 简介(内容来源于 lastfm)\n" + 
                "----* 媒体库改用 JSSmoothbrowser(by br3tt)\n" +
                "----* 搜索框改用 WSH searchbox(by br3tt, mod by elia-is-me)\n" + 
                "----* 底部面板由原来的 WSH 与 PSS 混搭改为整个 WSH\n\n" + 
                "使用帮助\n\n" + 
                "...待完成\n\n" + 
                "鸣谢\n\n" + 
                "在完成此作品的过程中，得到了 ttsping, Asionwu, alwaysBeta 等人的帮助，在此表示感激\n\n" + 
                "同时，本人的作品或直接使用，或参考了 Jensen, Brett, extremeHunter1972, marc2003, fanco86, " + 
                "dreamawake, thanhdat1710, tomato111, Keperlia... 等人的代码，由于时间久远，无法一一列出，" + 
                "在此一并表示感谢，直接 copy 或 作为库引用的代码版权归原作者(" + 
                "不过如果有人要抄这些代码的话，任何一位作者包括本人都不会有意见)\n\n" + 
                "也要感谢 WSHMP&ESLyric 的作者 ttsping，WSH 的作者 WangTP，PSS 的作者 ssena，以及 foobar 的作者们," + 
                "没有他们，foobar 不会这么多彩.\n\n" +
                "最后，感谢在 qq 群使用并反馈意见的人，感谢过去，现在，将来给出意见、建议的同好们。\n" + 
                "\n此致"

                );

        break;
    case (ret == 1501):
        break;

    }

    for (var i = 1501; i <=  1504; i++) {
        if (ret == i && g_color_scheme != i-1501) {
            g_color_scheme = i-1501;
            window.SetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), g_color_scheme); 
            on_colors_changed();
            break;
        }
    }

    basemenu.Dispose();
    menuman1.Dispose();
    menuman2.Dispose();
    menuman3.Dispose();
    menuman4.Dispose();
    menuman5.Dispose();
    menuman6.Dispose();

    _mnlt.Dispose();

	bt[tab_len].reset();

};

var min_width = zoom(320, g_dpi);
var g_z20 = zoom(20, g_dpi);

addEventListener("on_size", function () {

	ww = Math.max(window.Width, min_width);
	wh = window.Height;

	// Tabs (bt[0, 1, 2, 3])
	var tx = g_z20;
	for (var i = 0; i < tab_len; i++) {
		bt[i].set_xy(tx, 0);
		tx = tx + bt[i].w + g_z20;
	};

	show_panel(pid);

	var w = bt[tab_len].w;
	// Searchbox
	var sx = Math.max(ww - w - zoom(170, g_dpi), bt[tab_len-1].x+bt[tab_len-1].w+zoom(10, g_dpi));

    $Splitter.ShowPanel(4, 1);
	$Splitter.MovePanel(tab_len, sx, 0, zoom(150, g_dpi), tab_height);

	// Menu btn
	var w = bt[tab_len].w;
	bt[tab_len].set_xy(sx + zoom(155, g_dpi), (tab_height - w) / 2);

}, true);

addEventListener("on_paint", function (gr) {

	gr.FillSolidRect(0, 0, ww,wh, g_colors.bg_normal);
	for (var i = 0, l = bt.length; i<l; i++) {
        bt[i].colors = [g_colors.txt_normal, g_colors.txt_normal, g_colors.highlight];
        if (i == pid) {
            bt[i].colors = [g_colors.highlight, g_colors.highlight, g_colors.highlight];
        }
		bt[i].draw(gr);
	};

	var t = bt[pid];
    //gr.DrawLine(bt[0].x, bt[0].y+bt[0].h-zoom(12, g_dpi), bt[3].x+bt[3].w, bt[0].y+bt[0].h-zoom(12, g_dpi), 1, g_colors.txt_normal & 0x30ffffff);
	gr.FillSolidRect(t.x, t.y+t.h-zoom(12, g_dpi), t.w, zoom(1, g_dpi), g_colors.highlight);

}, true);


addEventListener("on_mouse_move", function(x, y) {
	for (var i = 0, l = bt.length; i < l; i++) {
		bt[i].check_state("move", x, y);
	}
}, true);

addEventListener("on_mouse_lbtn_down", function (x, y) {
	for (var i = 0, l = bt.length; i < l; i++) {
		bt[i].check_state("down",x,y);
	};
}, true);

addEventListener("on_mouse_lbtn_dblclk", on_mouse_lbtn_down);


addEventListener("on_mouse_lbtn_up", function (x, y) {
	for (var i = 0, l = bt.length; i < l; i++) {
		if (bt[i].check_state("up",x,y) == 1){
			bt[i].on_click();
		}
	};
}, true);

addEventListener("on_mouse_leave", function() {
	for (var i = 0, l = bt.length; i<l; i++) {
		if (bt[i].state == 1) bt[i].reset();
	}
}, true);

disable_rbtn_menu();



addEventListener("on_notify_data", function(name, info) {
    switch (name) {
        case "Color scheme status":
            if (g_color_scheme != info) {
                window.SetTimeout(function() {
                    window.NotifyOthers("Switch color scheme", g_color_scheme);
                }, 1000);
            }
            break;
        case "Search executed":
            pid = 0;
            show_panel(0);
            window.SetProperty("Visible Panel ID:", 0);
            break;
        case "Switch panel":
            try {
                pid = info;
                show_panel(pid);
            } catch (e) {
                pid = 0;
                show_panel(pid);
            }
            window.SetProperty("Visible Panel ID:", pid);
            break;
    }
}, true);


