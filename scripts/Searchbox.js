// vim:set fileencoding=utf-8 bomb et:

// NOTE: This file will be saved in utf-8 WITH BOMB.
// 注意: 文件保存成 utf-8带bom 格式.

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
        "Font name": "字体名",
		"Library search": "媒体库搜索",
		"Search [": "搜索 [",
		"Copy": "复制",
		"Cut": "剪切",
		"Paste": "粘贴",
		"Search library": "搜索媒体库",
		"Search web": "搜索网络",
		"Settings": "设置",
		"Keep search results": "保留搜索结果",
		"Auto-validation": "实时搜索",
        "Use LCMapString": "搜索简繁结果",
        "Properties": "WSH 属性",
        "Configure...": "WSH 配置",
		"WSH properties": "WSH 属性",
		"WSH configure...": "WSH 配置",
		"Searchbox auto-validation": "搜索框 实时搜索",
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
var g_fonts = {};

function get_colors () {
    if (g_color_scheme == 0) {
        g_colors = get_default_colors();
    } else {
        g_colors = COLOR_SCHEME[g_color_scheme - 1];
    }
    g_colors.txt_bg_05 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.5);
    g_colors.txt_normal2 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.2);
    window.NotifyOthers("Color scheme status", g_color_scheme);
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


var g_dpi_percent = get_system_dpi_percent();
var g_forced_percent = window.GetProperty("DPI (default = 0)", 0);
var g_dpi = (g_forced_percent == 0 ? g_dpi_percent : g_forced_percent);
if (g_dpi < 100) g_dpi = 100;

(function zoom_all() {
	z1 = zoom(1, g_dpi);
	z3 = zoom(3, g_dpi);
	z6 = zoom(6, g_dpi);
	z12 = zoom(12, g_dpi);
	z14 = zoom(14, g_dpi);
	z18 = zoom(18, g_dpi);
	z20 = zoom(20, g_dpi);
	z25 = zoom(25, g_dpi);
	z28 = zoom(28, g_dpi);
	z100 = zoom(100, g_dpi);
	z148 = zoom(148, g_dpi);
})();

SearchBox = function() {
	//var cursor_timer = false;
	//var cursor_state = true;
	//var doc = new ActiveXObject("htmlfile");
	//var clipboard_text = null;
	//
	this.inputbox = new oInputbox(z100, z20, "", __("Library search"), RGB(255, 255, 255), RGB(101, 101, 101), 0, 0xffffffff, search_action, "SearchBox");

	this.repaint = function() {
		window.Repaint();
	}

	this.draw = function(gr, x, y) {
		this.inputbox.draw(gr, x+z28, y, 0, 0);
		if (this.inputbox.text.length > 0) {
			//this.reset_bt.x = x+this.inputbox.w+25;
			//this.reset_bt.y = y + 1;
			this.reset_bt.set_xy(x+this.inputbox.w+z25, y+z1);
			this.reset_bt.draw(gr);
		}

		//this.loupe_bt.x = x+6;
		//this.loupe_bt.y = y+4;
		this.loupe_bt.set_xy(x+z6,y+z3);
		this.loupe_bt.draw(gr);
	}

	this.on_mouse = function(event, x, y, mask) {
		if (!this.inputbox.visible) return;
		switch (event) {
			case "down":
				this.loupe_bt.check_state("down", x, y);
				this.inputbox.check("down", x, y);
				if (this.inputbox.text.length > 0) {
					this.reset_bt.check_state("down", x, y);
				}
				break;
			case "up":
				// TODO: Button states
				if (this.loupe_bt.check_state("up", x, y) == 1) {
					// loupe menu
					this.loupe_bt.on_click();
				}
				this.inputbox.check("up", x, y);
				if (this.inputbox.text.length > 0) {
					if (this.reset_bt.check_state("up", x, y) == 1) {
						this.inputbox.text = "";
						this.inputbox.offset = 0;
						//this.inputbox.check("down", this.inputbox.x+1,this.inputbox.y+1);
						this.repaint();
						// TODO:
						//search_action();
					}
				}
				break;
			case "dblclk":
				this.inputbox.check("dblclk", x, y);
				break;
			case "right":
				this.inputbox.check("right", x, y);
				break;
			case "move":
				this.loupe_bt.check_state("move", x, y);
				this.inputbox.check("move", x, y);
				if (this.inputbox.text.length > 0) {
					var bt_state = this.reset_bt.check_state("move", x, y);
				}
				return (this.inputbox.hover || bt_state == 1);
				break;
		}
	};

	var loupe_img, reset_img;

	this.get_images = function() {
		var colors = [g_colors.txt_normal, g_colors.txt_normal, g_colors.highlight];
		var imgarr, img, g, s;
		var w = z18, h = z14;
		var sf = StringFormat(1,1);
		var fonta = gdi.Font("FontAwesome", z14);
		var fonta2 = gdi.Font("FontAwesome", z1*8);
        var txt_rendering = 3;

		// loupe_img
		imgarr = [];
		for (s = 0; s < 3; s++) {
			img = gdi.CreateImage(w, h);
			g = img.GetGraphics();
			g.SetTextRenderingHint(txt_rendering);

			//g.FillSolidRect(0, 0, w, h, 0xffaabbcc);
			g.DrawString("\uF002", fonta, colors[s], -z1*2, 0, w, h, sf);
			g.DrawString("\uF0D7", fonta2, colors[s], z1*6, 0, w, h, sf);

			/*
			g.DrawLine(13,6,17,6,1.0,colors[s]);
			g.DrawLine(14,7,16,7,1.0,colors[s]);
			g.FillSolidRect(15,8,1,1,colors[s]); 
			*/

			g.SetTextRenderingHint(0);
			img.ReleaseGraphics(g);
			imgarr[s] = img;
		}
		loupe_img = imgarr;

		imgarr = [];
		w = z18, h = z18;

		for (s = 0; s < 3; s++) {
			img = gdi.CreateImage(w, h);
			g = img.GetGraphics();
			g.SetTextRenderingHint(txt_rendering);

			//g.FillSolidRect(0, 0, w, h, 0xffaabbcc);
			g.DrawString("\uF057", fonta, colors[s], 0, 0, w, h, sf);
			
			g.SetTextRenderingHint(0);
			img.ReleaseGraphics(g);
			imgarr[s] = img;
		}
		reset_img = imgarr;

		this.loupe_bt = new Button(loupe_img, function(x, y) {
			loupe_bt_menu(sbox.loupe_bt.x, sbox.loupe_bt.y+sbox.loupe_bt.h);
		});
		this.reset_bt = new Button(reset_img);

	};

	this.get_images();

};

function loupe_bt_menu(x, y) {

	sbox.loupe_bt.state = 2;

	var _menu = window.CreatePopupMenu();
	var _set = window.CreatePopupMenu();

	if (sbox.inputbox.text.length > 0) {
		_menu.AppendMenuItem(MF_STRING, 1, __("Search library"));
        //_menu.AppendMenuItem(MF_STRING, 2, __("Sent to new playlist"));
		//_menu.AppendMenuItem(MF_STRING, 2, __("Search Xiami"));
	} else {
		_menu.AppendMenuItem(MF_DISABLED, 1, __("Search library"));
		//_menu.AppendMenuItem(MF_DISABLED, 1, __("Sent to new playlist"));
		//_menu.AppendMenuItem(MF_DISABLED, 2, __("Search Xiami"));
    }
    _menu.AppendMenuSeparator();

	_set.AppendTo(_menu, MF_STRING, __("Settings"));
	_set.AppendMenuItem(MF_STRING, 10, __("Keep search results"));
	_set.AppendMenuItem(MF_STRING, 11, __("Auto-validation"));
    _set.AppendMenuItem(MF_STRING, 12, __("Use LCMapString"));
	_set.CheckMenuItem(10, keep_result);
	_set.CheckMenuItem(11, auto_validation);
    _set.CheckMenuItem(12, use_lcmapstring);
	_set.AppendMenuSeparator();
	_set.AppendMenuItem(MF_STRING, 20, __("WSH properties"));
	_set.AppendMenuItem(MF_STRING, 21, __("WSH configure..."));

	var ret = _menu.TrackPopupMenu(x, y);

	switch (ret) {
		case 1:
			if (sbox.inputbox.text.length > 0) {
				search_library();
			}
			break;
		case 2:
			search_web();
			break;
		case 10:
			keep_result = !keep_result;
			window.SetProperty(__("Keep search results"), keep_result);
			break;
		case 11:
			auto_validation = !auto_validation;
			sbox.inputbox.autovalidation = auto_validation;
			window.SetProperty(__("Searchbox auto-validation"), auto_validation);
			break;
        case 12:
            use_lcmapstring = !use_lcmapstring;
            window.SetProperty(__("Use LCMapString"), use_lcmapstring);
            break;
		case 20:
			window.ShowProperties();
			break;
		case 21:
			window.ShowConfigure();
			break;
	}

	_menu.Dispose();

	sbox.loupe_bt.reset();

}




var ww, wh;
var images = {};
var sbox = null;
var auto_validation= window.GetProperty(__("Searchbox auto-validation"), false);
var keep_result = window.GetProperty(__("Keep search results"), false);
var use_lcmapstring = window.GetProperty(__("Use LCMapString"), false);
var search_action;



// on init
search_action = search_library;
sbox = new SearchBox();
sbox.inputbox.visible = true;
sbox.inputbox.autovalidation = auto_validation;

window.DlgCode = DLGC_WANTALLKEYS;


// callbacks
function on_size() {
	ww = window.Width;
	wh = window.Height;
	if (!ww || !wh) return;
};


function on_paint(gr) {
	// Bg
	gr.FillSolidRect(0, 0, ww, wh, g_colors.bg_normal);
	sbox.inputbox.backcolor = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.92);
	sbox.inputbox.textcolor = g_colors.txt_normal;
	// Searchbox
	gr.SetSmoothingMode(4);
	var x = 1;
	var po_h = z25;
	var po_w = z148;
	var po_f = Math.floor(po_h / 2);
	gr.FillRoundRect(x, (wh-po_h)/2, po_w, po_h, po_f, po_f,  sbox.inputbox.backcolor);
	gr.SetSmoothingMode(0);

	if (sbox.inputbox.visible) {
		sbox.inputbox.w = z100;
		sbox.inputbox.h = z20;
        sbox.inputbox.font = g_fonts.inputbox;
        sbox.inputbox.font_italic = g_fonts.inputbox_italic;
		sbox.draw(gr, x, (wh-sbox.inputbox.h)/2);
	};
};

function on_mouse_move(x, y) {
	sbox.on_mouse("move", x, y);
}

function on_mouse_lbtn_down(x, y, mask) {
	sbox.on_mouse("down", x, y);
}

function on_mouse_lbtn_up(x, y, mask) {
	sbox.on_mouse("up", x, y);
}

function on_mouse_lbtn_dblclk(x, y, mask) {
	sbox.on_mouse("dblclk", x, y);
}

function on_mouse_rbtn_up(x, y, mask) {
	sbox.on_mouse("right", x, y);
	return true;
}

//
function on_key_down (vkey) {
	sbox.inputbox.visible && sbox.inputbox.on_key_down(vkey);
}

function on_char(code) {
	sbox.inputbox.visible && sbox.inputbox.on_char(code);
}

function on_focus(is_focused) {
	sbox.inputbox.visible && sbox.inputbox.on_focus(is_focused);
}

function search_web () {


}

function search_library() {

	var s2 = sbox.inputbox.text;
	if (s2.length == 0) return true;

    s2 = s2.replace(/[；]/g, ";");
    var str_arr = s2.split(";");
    var len = str_arr.length;


    // 处理文本
    if (use_lcmapstring) {
        for (var i = 0; i < len; i++) {
            str_arr.push(utils.LCMapString(str_arr[i], 0x0804, 0x02000000));
            str_arr.push(utils.LCMapString(str_arr[i], 0x0804, 0x04000000));
        }
    }

	var pl_to_remove = [];

	// Get to-remove plid.
	var found = false;
	var total = plman.PlaylistCount;
	for (var i = 0; i < total; i++) {
		//if (plman.GetPlaylistName(i).substr(0, 8) == __("Search [")) {
        if (plman.GetPlaylistName(i).indexOf(__("Search [")) == 0) {
			if (!keep_result) {
				if (!found) {
					var plid = i;;
					found = true;
				}
				pl_to_remove.push(i);
			}
		}
	}

	// Remove pl found
	if (found && !keep_result) {
		var r = pl_to_remove.length - 1;
		while (r >= 0) {
			plman.RemovePlaylist(pl_to_remove[r]);
			r--;
		}
	} else {
		plid = total;
	}

	// Exec search
	var handles = fb.GetAllItemsInMediaLibrary();
	var results;
	var tf = fb.TitleFormat("%album artist% | %album% | %discnumber% | %tracknumber% | %title%");

    try {
        results = fb.QueryMulti(handles, str_arr[0]);
        for (var i = 1; i < str_arr.length; i++) {
            results.AddRange(fb.QueryMulti(handles, str_arr[i]));
        }

        results.Sort();
        results.OrderByFormat(tf, 1);

        fb.CreatePlaylist(plid, __("Search [") + s2.replace(/;/g,",") + "]");
        plman.InsertPlaylistItems(plid, 0, results, select = false);
        plman.ActivePlaylist = plid;
    } catch (e) {};

    window.NotifyOthers("Search executed", true);

}

function on_colors_changed() {
	get_colors();
	sbox.get_images();
	window.Repaint();
}



function on_font_changed() {
    g_fonts.name = fb.TitleFormat(window.GetProperty(__("Font name"), "Segoe UI")).Eval(true);
    if (!utils.CheckFont(g_fonts.name)) {
        try {
            var sys_font = (window.InstanceType == 1 ? window.GetFontDUI(3) : window.GetFontCUI(0));
            g_fonts.name = sys_font.Name;
            g_fonts.size = sys_font.Size;
        } catch (e) {
            g_fonts.name = "Segoe UI";
            g_fonts.size = zoom(12, g_dpi);
            console(__("Failed to load default font, Use \"") + g_fonts.name + "\" instead!");
        };
    }
    g_fonts.inputbox = gdi.Font(g_fonts.name, z12);
    g_fonts.inputbox_italic = gdi.Font(g_fonts.name, z12, 2);
    window.Repaint();
}

function on_notify_data(name, info) {
	switch (name) {
		case "Switch color scheme":
			g_color_scheme = info;
            on_colors_changed();
            window.SetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), g_color_scheme); 
			break;
		case "DPI":
			g_dpi = info;
			zoom_all();
            on_font_changed();
			sbox = new SearchBox();
			sbox.inputbox.visible = true;
			on_size();
			break;
        case "Reload":
            window.Reload();
            break;
	}
}

on_font_changed();
	

