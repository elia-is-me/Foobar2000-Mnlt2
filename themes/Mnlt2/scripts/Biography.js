// vim:set fileencoding=utf-8 bomb et:
// update: 2016-01-06 20:51


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
        "Failed to load default font, Use \"": "未能载入默认字体, 使用\"",
        "\" instead!": "\"代替",
        "Show scrollbar": "显示滚动条",
        "Lastfm site": "Lastfm 站点",
        "Site: ": "网站: ",
        "Default artist pattern": "默认艺术家格式",
        "Nothing here...": "没有哎...",
        "Force update": "更新",
        "Open containing folder": "打开所在文件夹",
        "Artist field remapping...": "重匹配艺术家",
        "Default value: ": "默认值: ",
        "Configure...": "WSH 配置",
        "Font size": "字号",
        "Font size pointer": "字号 索引(0:12, 1: 14, 2: 16)", 
        "Unknown artist": "未知艺术家",
        "No artist selected": "没有艺术家被选中",
        
	}
}

function __(name) {
    var str = lang_pack[name];
    if (!str) str = name;
    return str;
}


// Check off 'Safe-Mode'

var fso = new ActiveXObject("Scripting.FileSystemObject");
var WshShell = new ActiveXObject("WScript.Shell");
var doc = new ActiveXObject("htmlfile");

var folder_data = fb.ProfilePath + "Skins\\Mnlt2\\cache\\";
var folder_artists = folder_data + "artists\\";

(function (){
    createFolder(fb.ProfilePath + "Skins\\");
    createFolder(fb.ProfilePath + "Skins\\Mnlt2\\");
    createFolder(fb.ProfilePath + "Skins\\Mnlt2\\cache\\");
    createFolder(folder_data + "artists\\");
})();

var DT_LT = DT_NOPREFIX | DT_CALCRECT;
var DT_LC = DT_LT | DT_VCENTER;

var g_dpi_percent = get_system_dpi_percent();
var g_forced_percent = window.GetProperty("DPI (default = 0)", 0);
var g_dpi = (g_forced_percent == 0 ? g_dpi_percent : g_forced_percent);
if (g_dpi < 100) {
	g_dpi = 100;
}

var ww, wh;
var brw = null;

var g_colors = {};
var g_color_scheme = window.GetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), 0); 
var g_fonts = {};


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


function get_fonts() {
    g_fonts.name = fb.TitleFormat(window.GetProperty(__("Font name"), "")).Eval(true);
    if (!utils.CheckFont(g_fonts.name)) {
        try {
            var sys_font = (window.InstanceType == 1 ? window.GetFontDUI(3) : window.GetFontCUI(0));
            g_fonts.name = sys_font.Name;
            //g_fonts.name = (window.InstanceType == 1 ? window.GetFontDUI(3).Name : window.GetFontCUI(0).Name);
            g_fonts.size = sys_font.Size;
        } catch (e) {
            g_fonts.name = "Segoe UI";
            g_fonts.size = zoom(12, g_dpi);
            console(__("Failed to load default font, Use \"") + g_fonts.name + "\" instead!");
        };
    }
    g_fonts.name_bold = g_fonts.name;
    if (g_fonts.name.toLowerCase() == "segoe ui semibold") {
        g_fonts.name_bold = "segoe ui";
    };
    g_fonts.item = gdi.Font(g_fonts.name, z12);
    g_fonts.item2 = gdi.Font(g_fonts.name, z14);

};

var z10 = zoom(10, g_dpi);
var z12 = zoom(12, g_dpi);
var z14 = zoom(14, g_dpi);
var z60 = zoom(60, g_dpi);

Scrollbar = function(parent) {

    this.cursor_h = 0;
    this.cursor_y = 0;
    this.cursor_state = 0;
    this.parent = parent;

    this.draw = function(gr, x, y, w, h, list_h, total_h, scroll) {

        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.list_h = list_h;
        this.total_h = total_h;

        if (list_h >= total_h) {
            return;
        }

        // calc
        this.cursor_h = Math.round(list_h / total_h * list_h);
        if (this.cursor_h < 25) {
            this.cursor_h = 25;
        }
        this.cursor_y = y + Math.round((list_h - this.cursor_h) * scroll / (total_h - list_h));
        // draw
        var alpha = this.cursor_state == 2 ? 0x99ffffff : this.cursor_state == 1 ? 0x55ffffff : 0x33ffffff;
        gr.FillSolidRect(x, this.cursor_y, w, this.cursor_h, g_colors.txt_normal & alpha);

    }

    this.is_hover_cursor = function(x, y) {
        return (x > this.x && x < this.x + this.w && y > this.cursor_y && y < this.cursor_y + this.cursor_h);
    }

    this.mouse_move = function(x, y) {
        if (this.cursor_state == 2) {
            this.cursor_y = y - this.cursor_delta;
            if (this.cursor_y < this.y) {
                this.cursor_y = this.y;
            }
            if (this.cursor_y + this.cursor_h > this.y + this.h) {
                this.cursor_y = this.y + this.h - this.cursor_h;
            }
            this.set_scroll(parent);
            window.Repaint();
        } else {
            var temp_state = (this.is_hover_cursor(x, y) ? 1 : 0);
            if (temp_state != this.cursor_state) {
                this.cursor_state = temp_state;
                window.Repaint();
            }
        }
    }

    this.mouse_down = function (x, y) {
        if (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h) {
            switch (true) {
                case (y < this.cursor_y):
                    break;
                case (this.is_hover_cursor(x, y)):
                    this.cursor_state = 2;
                    this.cursor_delta = y - this.cursor_y;
                    window.Repaint();
                    break;
                case (y > this.cursor_y + this.cursor_h):
                    break;
                default:
                    break;
            }
        }
    }

    this.mouse_up = function(x, y) {
        if (this.is_hover_cursor(x, y)) {
            this.cursor_state = 1;
        } else {
            this.cursor_state = 0;
        }
        window.Repaint();
    }

    this.set_scroll = function (parent) {
        var ratio = (this.cursor_y - this.y) / (this.h - this.cursor_h);
        parent.offset_y = Math.round((this.total_h - this.list_h) * ratio);
    }

}

Textbrowser = function() {

	//createFolder(folder_data);
	createFolder(folder_artists);

	this.site = window.GetProperty(__("Lastfm site"), 2);
	this.sites = ["www.last.fm", "www.last.fm/ja", "www.last.fm/zh"];

	this.artist = "";
	this.artist_pat = window.GetProperty(__("Default artist pattern"), "$meta(artist,0)");
	this.metadb = null;

	this.content = "";
	this.filename = "";

	var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");

	this.metadb_changed = function() {

		this.metadb = fb.IsPlaying ? fb.GetNowPlaying() : fb.GetFocusItem();
		if (!this.metadb) {
			return;
		}

		var artist_temp = $(this.artist_pat, this.metadb);
		if (this.artist == artist_temp) {
			return;
		} else {
			this.artist = artist_temp;
		}

		this.get_content();
        on_size();

	}

	var newArtistFolder = function(name) {
		var folder = folder_artists + name.validate();
		createFolder(folder);
		return fso.GetFolder(folder) + "\\";
	}

	this.get_content = function() {

		this.content = "";
		this.filename = newArtistFolder(this.artist) + "bio." + this.sites[this.site].validate() + ".json";

		if (isFile(this.filename)) {
            try {
                var data = JSON.parse(openFile(this.filename));
                this.content = data[0];
            } catch(e) {};
		} else {
			this.get();
		}

		this.update();
		window.Repaint();

	}


	this.get_url = function() {
		return ("http://" + this.sites[this.site] + "/music/" + encodeURIComponent(this.artist) + "/+wiki/");
	}

	var save_content = function(file) {

		var content = getElementsByTagName(xmlhttp.responseText, "div");
		var result = null;

		for (var i in content) {
			var ci = content[i];
			if (ci["className"] && ci["className"] == "wiki-content") {
				result = ci["innerHTML"];
				break;
			}
		}

		if (!result) {
			return;
		} else {
			result = stripTags(result);
			if (save2File(JSON.stringify([result]), file)) {
				brw.get_content();
                console("艺人信息保存到: " + file);
			}
		}

	}

	this.get = function() {

		var f = this.filename;
		var url = this.get_url();

		xmlhttp.open("GET", url, true);
		xmlhttp.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
		xmlhttp.send();
		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				save_content(f);
			} else {
				//console("HTTP error");
			}
		}
	}

	//////
	
	this.offset_y = 0;
	this.margin_t = 0;
    this.scrollbar_width = z12;

    this.fsize_pointer = window.GetProperty(__("Font size pointer"), 0);
    this.fsize = [12, 14, 16];

    this.set_font = function(fsize_pt) {
        this.fsize_pointer = fsize_pt;
        try {
            this.font = gdi.Font(g_fonts.name, zoom(this.fsize[this.fsize_pointer], g_dpi));
            window.SetProperty(__("Font size pointer"), this.fsize_pointer);
        } catch (e) {
            console("Failed to change font size!");
            this.set_font(0);
        }
        this.row_height = this.font.Height * 1.5;
    }
    this.set_font(this.fsize_pointer);

	this.update  = function() {

		this.offset_y = 0;

		switch (true) {
            case this.w < 100:
                this.lines = ["", "", ""];
                break;
            case !this.content || this.content.length == 0:
				this.lines = ["", "", "", __("Nothing here...")];
				break;
			default:
                this.lines = ["", "", ""];
                this.lines = this.lines.concat(processLineWrap(this.content, this.font, this.w));
				break;
		}

		this.total_h = this.lines.length * this.row_height;

	}

    this.need_scrollbar = false;
    this.show_scrollbar = window.GetProperty(__("Show scrollbar"), true);

    this.scrollbar = new Scrollbar(this);

	this.set_size = function(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.update();

		this.total_rows = Math.floor((this.h - this.margin_t) / this.row_height);
        this.need_scrollbar = (this.h-this.margin_t < this.total_h);
	}

	this.draw = function(gr) {

		if (this.lines.length <= 3) {
			gr.GdiDrawText(__("Nothing here..."), this.font, g_colors.txt_normal,
					this.x, this.y + this.margin_t, this.w, this.row_height, DT_LT);
			return;
		} else {

			this.start = Math.floor(this.offset_y / this.row_height);
			this.end = this.start + this.total_rows ;
			if (this.end >= this.lines.length) {
				this.end = this.lines.length - 1;
			}

			for (var i = this.start; i <= this.end; i++) {

                var ry = this.y + this.margin_t + i * this.row_height - this.offset_y;

                if (i == 2) {
                    //ry -= this.row_height * 3;
                    ry = ry - this.row_height * 2;
                    var artist = "";
                    if (this.metadb) {
                        if (this.artist == "") {
                            artist = __("Unkown artist");
                        } else {
                            artist = this.artist;
                        }
                    } else {
                        artist = __("No artist selected");
                    }
                    gr.GdiDrawText(artist, gdi.Font(g_fonts.name, z20), g_colors.txt_normal,
                            z20, ry, ww-z20*2, this.row_height*3, DT_LC | DT_END_ELLIPSIS);
                } else {
                    if (this.lines[i]) {
                        gr.GdiDrawText(this.lines[i], this.font, g_colors.txt_normal,
                                this.x, ry, this.w, this.row_height, DT_LT);
                    }
                }
			}

            // Scrollbar
            this.scrollbar.draw(gr, ww-z10-1, this.y + this.margin_t, z10, this.h - this.margin_t, this.h - this.margin_t, this.total_h, this.offset_y);
            /*
            if (this.h-this.margin_t < this.total_h) {
                var cursor_h = Math.round((this.h-this.margin_t) / this.total_h * this.h);
                if (cursor_h < 25) {
                    cursor_h = 25;
                }
                var cursor_y = this.y + Math.round((this.h-cursor_h) * this.offset_y / (this.total_h-this.h+this.margin_t));

                gr.FillSolidRect(ww-z10-1, cursor_y, z10, cursor_h, g_colors.txt_normal & 0x33ffffff);
            }
            */

		}

	}

	this.step = function(offset) {

		if (this.h - this.margin_t > this.total_h) {
			return;
		}
		this.offset_y -= offset;
		this.check_offset();
		window.Repaint();

	}

	this.check_offset = function() {
		if (this.offset_y < 0) {
			this.offset_y = 0;
		}
		if (this.total_h < this.offset_y +  this.h - this.margin_t) {
			this.offset_y = this.total_h - this.h + this.margin_t;
		}
	}

    this.context_menu = function (x, y) {

        var _menu = window.CreatePopupMenu();
        var _site = window.CreatePopupMenu();
        var _fsize = window.CreatePopupMenu();

        _menu.AppendMenuItem(MF_STRING, 1, __("Force update"));
        _menu.AppendMenuSeparator();

        _site.AppendTo(_menu, MF_STRING, __("Lastfm site"));
        for (var i = 0; i < this.sites.length; i++) {
            _site.AppendMenuItem(MF_STRING, 10+i, this.sites[i]);
        }
        _site.CheckMenuRadioItem(10, 10+this.sites.length-1, this.site+10);
        _menu.AppendMenuItem(MF_STRING, 30, __("Open containing folder"));
        _menu.AppendMenuSeparator();
        _menu.AppendMenuItem(MF_STRING, 31, __("Artist field remapping..."));
        _menu.AppendMenuSeparator();
        _fsize.AppendTo(_menu, MF_STRING, __("Font size"));
        for (var i = 0; i < this.fsize.length; i++) {
            _fsize.AppendMenuItem(MF_STRING, 40 + i, this.fsize[i].toString());
        }
        _menu.CheckMenuRadioItem(40, 40+this.fsize.length-1, this.fsize_pointer+40);

        var ret = _menu.TrackPopupMenu(x, y);

        switch (ret) {
            case 1:
                this.get();
                window.Repaint();
                break;
            case 10:
            case 11:
            case 12:
                this.site = ret - 10;
                window.SetProperty(__("Lastfm site"), this.site);
                this.artist = "";
                this.metadb_changed();
                //on_size();
                break;
            case 30:
                WshShell.Run("explorer /select," + "\"" + this.filename + "\"");
                break;
            case 31:
                var pattern = InputBox("foobar2000 Mnlt2", __("Default value: ") + "$meta(artist,0)", this.artist_pat, false);
                if (pattern != "") {
                    this.artist_pat = pattern;
                }
                window.SetProperty(__("Default artist pattern"), this.artist_pat);
                this.artist = "";
                this.metadb_changed();
                //on_size();
                break;
            case 32:
                break;
            case 40:
            case 41:
            case 42:
                this.set_font(ret-40);
                this.update();
                window.Repaint();
                break;
        }

    }

}


function stripTags(value) {
	doc.open();
	var div = doc.createElement("div");
	div.innerHTML = value.toString().replace(/<[Pp][^>]*>/g, "").replace(/<\/[Pp]>/g, "<br>").replace(/\n/g, "<br>");
	value = div.innerText.trim();
	doc.close();
	return value;
}

function getElementsByTagName(value, tag) {
	doc.open();
	var div = doc.createElement("div");
	div.innerHTML = value;
	var data = div.getElementsByTagName(tag);
	doc.close();
	return data;
};


function processLineWrap(string, font, width) {
	var tmp = gdi.CreateImage(1, 1);
	var g = tmp.GetGraphics();
	var result = [];
	var paragraphs = string.split("\n");
	var l = paragraphs.length;
	var lines;
	//alert(paragraphs[0]);
	for (var i = 0; i < l; i++) {
		lines = g.EstimateLineWrap(paragraphs[i], font, width).toArray();
		//alert(lines[0]);
		var l2 = lines.length;
		for (var j = 0; j < l2; j+= 2) {
			result.push(lines[j].trim());
		}
	}
	tmp.ReleaseGraphics(g);
	tmp.Dispose();

	return result;
}



function isFolder(name) {
	return fso.FolderExists(name);
}

function isFile(name) {
	return fso.FileExists(name);
}

function createFolder(name) {
	if (!isFolder(name)) { fso.CreateFolder(name); }
}

function openFile(file) {
	return utils.ReadTextFile(file);
}

function save2File(value, file, format) {
	try {
		var ts = fso.OpenTextFile(file, 2, true, format || 0);
		ts.WriteLine(value);
		ts.Close();
		return true;
	} catch (e) {
		console("Failed to save file...");
		return false;
	}
}


get_fonts();
get_colors();
brw = new Textbrowser();

var z380 = zoom(380, g_dpi);
var z20 = zoom(20, g_dpi);
var z30 = zoom(30, g_dpi);

function on_size() {

	ww = Math.max(window.Width, z380);
	wh = window.Height;

	brw.set_size(z20, z30, ww-z20*2, wh-z30);
}

var z16 = zoom(16, g_dpi);
var z35 = zoom(35, g_dpi);

function on_paint(gr) {

    // Bg
	gr.FillSolidRect(0, 0, ww, wh, g_colors.bg_normal);

    // Content
	brw.draw(gr);

    // Toolbar
    gr.FillSolidRect(0, 0, ww, z30, g_colors.bg_normal);
	gr.FillSolidRect(0, z30, ww-z20*0, 1, g_colors.txt_normal & 0x22ffffff);
    var language = ["English", "日文", "简体中文"];
	gr.GdiDrawText(__("Site: ") + language[brw.site], gdi.font(g_fonts.name, z12, 0), g_colors.txt_normal,
			z20, 0, ww-z20*2, z30, DT_LC);

}

function on_mouse_move(x, y) {
    brw.scrollbar.mouse_move(x, y);
}

function on_mouse_lbtn_down(x, y) {
    brw.scrollbar.mouse_down(x, y);
}

function on_mouse_lbtn_up(x, y) {
    brw.scrollbar.mouse_up(x, y);
}



function on_mouse_rbtn_up(x, y) {
    brw.context_menu(x, y);
    return true;
}

function on_mouse_wheel(delta) {
	brw.step(delta * brw.row_height * 3);
}
	

on_metadb_changed();

function on_metadb_changed() {
	brw.metadb_changed();
    //on_size();
}

function on_item_focus_change() {
    if (!fb.IsPlaying) {
        brw.metadb_changed();
        //on_size();
    }
}

function on_playback_starting(cmd, is_paused) {
	if (cmd == 6) {
		brw.metadb_changed();
        //on_size();
	}
}

function on_playback_new_track(metadb) {
	brw.metadb_changed();
    //on_size();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		brw.metadb_changed();
        //on_size();
	}
}

function on_colors_changed() {
	get_colors();
	window.Repaint();
}

function on_font_changed() {
	get_fonts();
    brw.set_font(brw.fsize_pointer);
	window.Repaint();
}


function on_notify_data(name, info) {
    switch (name) {
        case "Reload script":
            if (window.IsVisible) {
                window.Reload();
            }
            break;
        case "Switch color scheme":
            g_color_scheme = info;
            window.SetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), g_color_scheme); 
            on_colors_changed();
            break;
    }
}
