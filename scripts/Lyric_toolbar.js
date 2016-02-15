// vim:set ft=javascript fileencoding=utf-8 bomb et:
// Lyric toolbar(for ESLyric component)
// created @2015-12-29

var lang = window.GetProperty("界面语言(lang)(cn:中文, en: English)", "auto").toLowerCase();
if (lang != "cn" && lang != "en") {
    lang = (fb.TitleFormat("$meta()").Eval(true) == "[未知函数]") ? "cn" : "en";
}

var lang_pack = {};

if (lang.toLowerCase() == "cn") {
    lang_pack = {
        "Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)": "颜色主题 0: 系统 1: 亮色 2: 暗色 3: 用户",
        "View/": "视图/",
        "Color text normal": "颜色 文字",
        "Color text selected": "颜色 选中文字",
        "Color background normal": "颜色 背景",
        "Color background selected" : "颜色 选中背景",
        "Color highlight": "颜色 高亮",
        "Delete embedded lyric": "删除内嵌歌词",
        "Do not search lyric": "此曲不搜歌词",
        "Search lyrics": "搜索歌词",
        "Reload lyric": "重载歌词",
        "Filtering": "过滤",
        "Segoe UI": "微软雅黑",
    }
}


function __(name) {
    var str = lang_pack[name];
    if (!str) str = name;
    return str;
}


var g_dpi_percent = get_system_dpi_percent();
var g_forced_percent = window.GetProperty("DPI (default = 0)", 0);
var g_dpi = (g_forced_percent == 0 ? g_dpi_percent : g_forced_percent);
if (g_dpi < 100) g_dpi = 100;

var ww, wh;

var g_colors = {};
// 0: system, 1: light, 2: dark, 3: user
var g_color_scheme = window.GetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), 0); 
var g_fonts = {};
var images = {};
var bt = [];

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


var ESLyric = {
    text_color: "_eslyric_set_text_color_normal_",
    highlight_color: "_eslyric_set_text_color_highlight_",
    background_color: "_eslyric_set_background_color_",
    background_image: "_eslyric_set_background_image_",
    font: "_eslyric_set_text_font_",
    titleformat: "_eslyric_set_text_titleformat_fallback_",
    text_fallback: "_eslyric_set_text_fallback_",
    color_scheme: "_eslyric_set_color_scheme_"
};

var tf_eslyrics = fb.TitleFormat("$meta(ESLYRICS)");
var tf_lyrics = fb.TitleFormat("$meta(LYRICS)");


function get_colors () {
    if (g_color_scheme == 0) {
        g_colors = get_default_colors();
    } else {
        g_colors = COLOR_SCHEME[g_color_scheme - 1];
    }

    window.NotifyOthers("Color scheme status", g_color_scheme);
    window.NotifyOthers(ESLyric.background_color, g_colors.bg_normal);
    window.NotifyOthers(ESLyric.text_color, g_colors.txt_normal);
    window.NotifyOthers(ESLyric.highlight_color, g_colors.highlight);
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

var z16 = zoom(16, g_dpi);
var z25 = zoom(25, g_dpi);

function get_images() {

    var font = gdi.Font("FontAwesome", z16);
    var colors = [blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.2), g_colors.txt_normal, g_colors.highlight];
    var txt_rendering = 3;

    var w = z25;
    var s, imgarr, img;
    var sf = StringFormat(1, 1);


    var icons = ["\uF002", "\uF021", "\uF0C6"];
    var obj = ["search", "reload", "clip"];


    for (var i = 0; i < obj.length; i++) {

        // Create images
        imgarr = [];
        for (s = 0; s < 3; s++) {
            img = gdi.CreateImage(w, w);
            g = img.GetGraphics();
            g.SetTextRenderingHint(3);

            g.DrawString(icons[i], font, colors[s], 0, 0, w, w, sf);

            img.ReleaseGraphics(g);
            imgarr[s] = img;
        };

        images[obj[i]] = imgarr;

    }


    // Set buttons
    bt = [];
    var cmd = [
        "ESLyric/歌词搜索...",
        "ESLyric/重载歌词",
        "ESLyric/参数设置"
    ];

    bt[0] = new Button(images.search, function() {
        fb.IsPlaying && fb.RunMainMenuCommand(__("View/") + cmd[0]);
    }, __("Search lyrics"));
    bt[1] = new Button(images.reload, function() {
        fb.IsPlaying && fb.RunMainMenuCommand(__("View/") + cmd[1]);
    }, __("Reload lyric"));
    bt[2] = new Button(images.clip, function(x, y) {
        filter_menu(bt[2].x, bt[2].y+bt[2].h);
    }, __("Filtering"));

    on_size();

}

function filter_menu(x, y) {

    bt[2].state = 2;

    var _menu = window.CreatePopupMenu();

    var cmd = [
        __("Delete embedded lyric"),
        __("Do not search lyric")
    ];
    var esl_nolyric = tf_eslyrics.Eval().toLowerCase();
    var lyric = tf_lyrics.Eval();

    _menu.AppendMenuItem((lyric && lyric != "") ? MF_STRING : MF_DISABLED, 1, cmd[0]);
    _menu.AppendMenuItem(MF_STRING, 2, cmd[1]);
    _menu.CheckMenuItem(2, esl_nolyric == "no-lyric");

    var ret = _menu.TrackPopupMenu(x, y);

    switch (ret) {
        case 1:
            fb.IsPlaying && fb.GetNowPlaying().UpdateFileInfoSimple("LYRICS", "");
            break;
        case 2:
            fb.GetNowPlaying().UpdateFileInfoSimple("ESLYRICS", esl_nolyric ? "" : "no-lyric");
            fb.RunMainMenuCommand(__("View/") + "ESLYRICS/重载歌词");
            break;
    }


    _menu.Dispose();

    bt[2].reset();

}








addEventListener("on_colors_changed", function () {
	get_colors();
    get_images();
	window.Repaint();
}, true);

addEventListener("on_font_changed", function () {
    g_fonts.name = fb.TitleFormat(window.GetProperty(__("Font name"), "")).Eval(true);
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
    window.NotifyOthers(ESLyric.font, gdi.Font(g_fonts.name, 14, 1));
	window.Repaint();
}, true);

on_font_changed();


//// On script load
get_colors();
get_images();

var panels = [
    $Splitter.CreatePanel(PanelClassNames.ESL, 1, true),
];


//// Callback functions

var z380 = zoom(380, g_dpi);
var z20 = zoom(20, g_dpi);
var z4 = zoom(4, g_dpi);
var z30 = zoom(30, g_dpi);

addEventListener("on_size", function() {

	ww = Math.max(z380, window.Width);
	wh = window.Height;

    $Splitter.ShowPanel(0, 1);
    $Splitter.MovePanel(0, z20, z30, ww-z20*2, wh - z30);

    var bx = z20;
    var by = (z30 - bt[0].h)/2;
    for (var i = 0; i < bt.length; i++) {
        bt[i].set_xy(bx, by);
        bx += (bt[i].w + z4);
    }

}, true);

var z29 = zoom(29, g_dpi);

addEventListener("on_paint", function (gr) {

	// Bg
	gr.FillSolidRect(0, 0, ww, wh, g_colors.bg_normal);
    gr.FillSolidRect(0, z29, ww-z20*0, 1, g_colors.txt_normal & 0x22ffffff);

    // Buttons
    for (var i = 0; i < bt.length; i++) {
        bt[i].draw(gr);
    }

}, true);

addEventListener("on_mouse_move", function (x, y) {
    for (var i = 0; i < bt.length; i++) {
        bt[i].check_state("move", x, y);
    }
}, true);


addEventListener("on_mouse_lbtn_down", function (x, y) {
    for (var i = 0; i < bt.length; i++) {
        bt[i].check_state("down", x, y);
    }
}, true);

addEventListener("on_mouse_lbtn_dblclk", on_mouse_lbtn_down, true);

addEventListener("on_mouse_lbtn_up", function(x, y) {
    for (var i = 0; i < bt.length; i++) {
        if (bt[i].check_state("up", x, y) == 1) {
            bt[i].on_click(x, y);
        }
    }
}, true);


addEventListener("on_mouse_leave", function (x, y) {
    for (var i = 0; i < bt.length; i++) {
        if (bt[i].state == 1) bt[i].reset();
    }
}, true);

addEventListener("on_notify_data", function (name, info) {
	switch (name) {
		case "Reload script":
			window.IsVisible && window.Reload();
			break;
		case "Switch color scheme":
			g_color_scheme = info;
            window.SetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), g_color_scheme); 
            on_colors_changed();
			break;
	}
}, true);
disable_rbtn_menu();

