// vim:set ft=javascript fileencoding=utf-8 bomb et:
// Lyric toolbar(for ESLyric component)
// created @2015-12-29

var lang = window.GetProperty("界面语言(lang)(cn:中文, en: English)", "auto").toLowerCase();
if (lang != "cn" && lang != "en") {
    lang = (fb.TitleFormat("$meta()").Eval(true) == "[未知函数]") ? "cn" : "en";
}

var lang_pack = {};

function __(name) {
    var str = lang_pack[name];
    if (!str) str = name;
    return str;
}

var ww, wh;

var g_colors = {};
// 0: system, 1: light, 2: dark, 3: user
var g_color_scheme = window.GetProperty(__("Color scheme") + "(0: 系统, 1: 亮色, 2: 暗色, 3: 自定义)", 2); 
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
    txt_normal: eval(window.GetProperty(__("Color text normal"), "RGB(70, 70, 70)")),
    txt_selected: eval(window.GetProperty(__("Color text selected"), "RGB(0, 0, 0)")),
    bg_normal: eval(window.GetProperty(__("Color background normal"), "RGB(245, 245, 245)")),
    bg_selected: eval(window.GetProperty(__("Color background selected"), "RGB(180, 180, 180)")),
    highlight: eval(window.GetProperty(__("Color highlight"), "RGB(215, 65, 100)"))
}
];

function get_colors () {
    if (g_color_scheme == 0) {
        g_colors = get_default_colors();
    } else {
        g_colors = COLOR_SCHEME[g_color_scheme - 1];
    }

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

function notify_eslyric() {
}

window.NotifyOthers(ESLyric.background_color, 0xffffee00);

function get_images() {

    var font = gdi.Font("FontAwesome", 16);
    var colors = [blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.2), g_colors.txt_normal, g_colors.highlight];

    var w = 25;
    var s, imgarr, img;
    var sf = StringFormat(1, 1);


    var icons = ["\uF002", "\uF07B", "\uF0C6"];
    var obj = ["search", "folder", "clip"];


    for (var i = 0; i < obj.length; i++) {

        // Create images
        imgarr = [];
        for (s = 0; s < 3; s++) {
            img = gdi.CreateImage(w, w);
            g = img.GetGraphics();
            g.SetTextRenderingHint(4);

            g.DrawString(icons[i], font, colors[s], 0, 0, w, w, sf);

            img.ReleaseGraphics(g);
            imgarr[s] = img;
        };

        images[obj[i]] = imgarr;

    }


    // Set buttons
    bt = [];

    bt[0] = new Button(images.search);
    bt[1] = new Button(images.folder);
    bt[2] = new Button(images.clip);

}

//---------------------------------------------------------------------------------

oLyric = function () {
	this.rowHeight = 22;
	this.visible = false;
	this.timer = null;
	this.line = this.mid = 0;
	this.getlrc = false;
	this.focus = 0;
	this.lrc = '';
	this.tf = "[%artist% - ]%title%";
	var lrc = [];
	var lyric_path = '';
	this.setPath = function () {
		if (window.GetProperty("本地歌词路径", 'default').indexOf(':') != -1) {
			lyric_path = window.GetProperty("本地歌词路径");
		} else {
			lyric_path = fb.FoobarPath + "lyrics\\";
		}
	}
	this.setPath();

	this.repaint = function () {
		if (!this.visible) {
			return;
		}
		window.RepaintRect(this.x, this.y, this.w, this.h);
	}

	this.Locate = function (x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.mid = Math.floor(this.h / this.rowHeight / 2) * this.rowHeight + 5;
	}

	this.rebuild = function (arrTime, arrLyric) {
		var t = l = lt = 0;
		var r = b = e = 0;
		var lrc_y = 0;
		var lrc_str = 0;
		for (t = 0; t < arrTime.length; t++) {
			loop: for (l = 0; l < arrLyric.length; l++) {
				if (arrLyric[l] != null) {
					for (lt = 0; lt < arrLyric[l].length - 1; lt++) {
						if (arrTime[t] == arrLyric[l][lt]) {
							lrc[t] = new Object();
							lrc[t].tag = arrTime[t];
							lrc[t].lrc = [];
							lrc_str = arrLyric[l][arrLyric[l].length - 1];
							r = Math.ceil(calc(lrc_str, g_fonts.item, true) / (this.w - 10));
							lrc[t].y = lrc_y;
							lrc_y += r * this.rowHeight;
							b = 0;
							for (e = 1; e <= lrc_str.length; e++) {
								if (calc(lrc_str.substring(b, e), g_fonts.item, true) >= this.w - 10) {
									lrc[t].lrc.push(lrc_str.substring(b, e - 1));
									b = e - 1;
								}
								if (lrc[t].lrc.length == r - 1) {
									lrc[t].lrc.push(lrc_str.substring(b, lrc_str.length));
									break;
								}
							}
							break loop;
						}
					}
				}
			}
		}
	}

	this.getLyrics = function () {
		lyric.timer && window.ClearInterval(lyric.timer);
		lyric.timer = null;
		lrc.length = 0;
		this.lrc = '';
		var metadb = fb.GetNowPlaying();
		var time_stamps = [];
		var lyrics = [];
		var text = [];
		var stamp = [];

		if (metadb) {
			this.lrc = fb.TitleFormat("$meta(LYRICS)").Eval(false, true);
			if (this.lrc.length == 0) {
				var arr = utils.Glob(lyric_path + fb.TitleFormat(this.tf).Eval().validate() + ".*").toArray();
				for (var i = 0; i < arr.length; ++i) {
					if (arr[i].match(/\.lrc$/m)) {
						this.lrc = utils.ReadTextFile(arr[i]);
						break;
					}
				}
			}
			if (this.lrc.length > 0) {
				text = this.lrc.replace(/\[ti:.*?\]/g, '').replace(/\[ar:.*?\]/g, '').replace(/\[al:.*?\]/g, '').replace(/\[by:.*?\]/g, '').split(/\r\n/g);
				for (i = 0; i < text.length; i++) {
					stamp = text[i].match(/\[..:..\...\]/ig);
					text[i] = text[i].replace(/\[..:.*?\]/g, "");
					text[i] = text[i].length == 0 ? ' ' : text[i];
					if (stamp != null) {
						for (j = 0; j < stamp.length; j++) {
							stamp[j] = (parseInt(stamp[j].slice(1, 3), 10) * 60 + parseInt(stamp[j].slice(4, 6), 10)) * 1000 + parseInt(stamp[j].slice(7, 9), 10);
							if (!isNaN(stamp[j])) {
								time_stamps.push(stamp[j]);
							}
						}
						stamp.push(text[i]);
						lyrics[i] = stamp;
					}
				}
				if (time_stamps.length > 0) {
					time_stamps.sort(function (a, b) {
						return a - b
					});
					this.rebuild(time_stamps, lyrics);
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		}
	}

	this.lyric_show = function () {
		var playback_time = fb.TitleFormat("%playback_time_seconds%").Eval() * 1000;
		for (var t = 0; t < lrc.length; t++) {
			if (playback_time < lrc[t].tag) {
				if (t > 0) {
					this.focus = Math.abs(playback_time - lrc[t].tag) > 50 ? t - 1 : t;
				} else {
					this.focus = 0;
				}
				break;
			}
		}
	}

	this.On = function () {
		if (fb.IsPlaying && this.getlrc) {
			var temp = this.focus;
			lyric.lyric_show();
			if (temp != this.focus) {
				lyric.line = -lrc[temp].y;
				var sum = 0;
				var interval = (lrc[lyric.focus].y - lrc[temp].y) / this.rowHeight;
				lyric.timer && window.ClearInterval(lyric.timer);
				lyric.timer = null;
				if (lyric.visible) {
					lyric.timer = window.SetInterval(function () {
						lyric.line -= interval;
						sum += Math.abs(interval);
						if (sum >= Math.abs(lrc[lyric.focus].y - lrc[temp].y)) {
							lyric.line = -lrc[lyric.focus].y;
							window.ClearInterval(lyric.timer);
							lyric.timer = null;
						}
						lyric.repaint();
					}, 15)
				} else {
					lyric.line = -lrc[lyric.focus].y;
				}
			}
		}
	}

	this.Init = function (reset) {
		this.getlrc = this.getLyrics();
		if (this.getlrc && !reset) {
			this.line = -lrc[this.focus].y;
		} else {
			this.line = 0;
			this.focus = 0;
		}
		this.repaint();
	}

	this.Menu = function (x, y) {
		var m = window.CreatePopupMenu();
		m.AppendMenuItem(0, 1, '歌词搜索...');
		m.AppendMenuItem(0, 2, '开启/关闭桌面歌词');
		m.AppendMenuItem(0, 3, '锁定/解锁桌面歌词');
		m.AppendMenuItem(fb.IsPlaying ? 0 : 1, 4, '重载歌词');
		m.AppendMenuItem(fb.IsPlaying && fso.FileExists(lyric_path + fb.TitleFormat(this.tf).Eval().validate() + ".lrc") ? 0 : 1, 5, '编辑歌词');
		m.AppendMenuItem(fb.IsPlaying && fso.FileExists(lyric_path + fb.TitleFormat(this.tf).Eval().validate() + ".lrc") ? 0 : 1, 6, '删除歌词');
		m.AppendMenuSeparator();
		m.AppendMenuItem(this.getlrc ? 0 : 1, 7, '内嵌歌词');
		m.AppendMenuItem(fb.IsPlaying && fb.TitleFormat("$meta(LYRICS)").Eval().length > 0 ? 0 : 1, 8, '去除内嵌歌词');
		m.AppendMenuItem(0, 9, '参数设置...');
		var idx = m.TrackPopupMenu(x, y);
		switch (idx) {
		case 1:
			fb.RunMainMenuCommand('视图/ESLyric/歌词搜索...');
			break;
		case 2:
			fb.RunMainMenuCommand("视图/ESLyric/显示桌面歌词");
			break;
		case 3:
			fb.RunMainMenuCommand("视图/ESLyric/锁定桌面歌词");
			break;
		case 4:
			this.Init(true);
			break;
		case 5:
			try {
				WshShell.Run('notepad ' + lyric_path + fb.TitleFormat(this.tf).Eval().validate() + ".lrc");
			} catch (e) {};
			break;
		case 6:
			try {
				fso.DeleteFile(lyric_path + fb.TitleFormat(this.tf).Eval().validate() + ".lrc");
				this.Init(true);
			} catch (e) {};
			break;
		case 7:
			fb.GetNowPlaying().UpdateFileInfoSimple('LYRICS', this.lrc);
			break;
		case 8:
			fb.GetNowPlaying().UpdateFileInfoSimple('LYRICS', '');
			break;
		case 9:
			fb.RunMainMenuCommand('视图/ESLyric/参数设置...');
			break;
		default:
			break;
		}
		m.Dispose();
	}

	this.onMouse = function (event, x, y) {
		if (!this.visible) {
			return;
		}
		switch (event) {
		case 'rbtn':
			if (x > this.x && x < (this.x + this.w) && y > this.y && y < (this.y + this.h)) {
				this.Menu(x, y);
			}
			break;
		default:
			break;
		}
	}

	this.Paint = function (gr) {
		if (!this.visible) {
			return;
		}
		gr.SetSmoothingMode(2);
		if (this.getlrc) {
			for (i = 0; i < lrc.length; i++) {
				if (lrc[i].lrc != null) {
					for (j = 0; j < lrc[i].lrc.length; j++) {
						if (lrc[i].y + this.line + this.mid + j * this.rowHeight > this.h - this.rowHeight) {
							return;
						}
						if (lrc[i].y + this.line + this.mid + j * this.rowHeight >= 0) {
							gr.GdiDrawText(lrc[i].lrc[j], g_fonts.item, i == this.focus ? g_colors.highlight : g_colors.txt_normal,
								this.x + cover.xx, this.y + lrc[i].y + this.line + this.mid + j * this.rowHeight, this.w, this.rowHeight, DT_CVN);
						}
					}
				}
			}
		} else {
			gr.GdiDrawText('无歌词', gdi.Font(g_fonts.name, 32*96/72, 0), blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.5), this.x + cover.xx, this.y, this.w, this.h, DT_CV);
		}
		gr.SetSmoothingMode(0);
	}
}

function calc(str, font, GDI) {
	var temp_bmp = gdi.CreateImage(1, 1);
	var temp_gr = temp_bmp.GetGraphics();
	if (GDI) {
		var width = temp_gr.CalcTextWidth(str, font); //GDI
		temp_bmp.ReleaseGraphics(temp_gr);
		temp_bmp.Dispose();
		temp_gr = null;
		temp_bmp = null;
		return width;
	} else {
		var info = temp_gr.MeasureString(str, font, 0, 0, 99999, 99999, 0); //GDI+
		temp_bmp.ReleaseGraphics(temp_gr);
		temp_bmp.Dispose();
		temp_gr = null;
		temp_bmp = null;
		return info.Width;
	}
}

function get_font() {
    g_fonts.name = fb.TitleFormat(window.GetProperty(__("Font name"), "")).Eval(true);
    if (!utils.CheckFont(g_fonts.name)) {
        try {
            g_fonts.name = (window.InstanceType == 1 ? window.GetFontDUI(3).Name : window.GetFontCUI(0).Name);
        } catch (e) {
            g_fonts.name = "Segoe UI";
            console(__("Failed to load default font, Use \"") + g_fonts.name + "\" instead!");
        };
    }

    g_fonts.item = gdi.Font(g_fonts.name, 12);
    g_fonts.item_big = gdi.Font(g_fonts.name, 14);

}
    



instanceType = {
	DUI: 1,
	CUI: 0
}

cover = {
	xx: 0,
};


DT_LV = 0x00000000 | 0x00000004 | 0x00000020 | 0x00000400 | 0x00000800 | 0x00008000;
DT_CV = 0x00000001 | 0x00000004 | 0x00000020 | 0x00000400 | 0x00000800 | 0x00008000;
DT_RV = 0x00000002 | 0x00000004 | 0x00000020 | 0x00000400 | 0x00000800 | 0x00008000;
DT_LVN = 0x00000000 | 0x00000004 | 0x00000020 | 0x00000400 | 0x00000800;
DT_CVN = 0x00000001 | 0x00000004 | 0x00000020 | 0x00000400 | 0x00000800;

var fso = new ActiveXObject("Scripting.FileSystemObject");
var WshShell = new ActiveXObject("WScript.Shell");
var g_font, g_font_big;
var g_custom = false;

var ww, wh;
var lyric = new oLyric();
lyric.visible = true;





//// On script load
get_font();
get_colors();
get_images();




//// Callback functions

function on_size() {

	ww = Math.max(380, window.Width);
	wh = window.Height;

    var bx = 20;
    for (var i = 0; i < bt.length; i++) {
        bt[i].set_xy(bx, 0);
        bx += (bt[i].w + 4);
    }

    lyric.Locate(0, 30, ww, wh - 30);
    lyric.Init(false);

}

function on_paint(gr) {

	// Bg
	gr.FillSolidRect(0, 0, ww, wh, g_colors.bg_normal);
    gr.FillSolidRect(20, 30-1, ww-40, 1, g_colors.txt_normal & 0x19ffffff);

    // Buttons
    for (var i = 0; i < bt.length; i++) {
        bt[i].draw(gr);
    }
    
    // Lyric
    lyric.Paint(gr);

}

function on_mouse_rbtn_up(x, y, mask) {
	lyric.onMouse("rbtn", x, y);
	return true;
};

function on_playback_time(time) {
	lyric.On();
};

function on_playback_new_track(metadb) {
	lyric.Init(true);
};

function on_playback_stop(reason) {
	if (reason != 2) {
		lyric.Init(true);
	};
};

function on_notify_data(name, info) {
	switch (name) {
		case "Reload script":
			window.IsVisible && window.Reload();
			break;
		case "Switch color scheme":
			g_color_scheme = info;
            window.SetProperty(__("Color scheme") + "(0: 系统, 1: 亮色, 2: 暗色, 3: 自定义)", g_color_scheme); 
            on_colors_changed();
			break;
	}
}


function on_colors_changed() {
	get_colors();
    get_images();
    on_size();
	window.Repaint();
}

function on_font_changed() {
    get_font();
	window.Repaint();
}

