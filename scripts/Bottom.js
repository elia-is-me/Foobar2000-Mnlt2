// vim:set fileencoding=utf-8 bomb et:
//
// Created by Elia_Is_Me @2015-12-30

// Requirements:
// * foobar2000 v1.3.3 or newer
// * WSH Panel Mod Plus v1.5.6.1003 or newer

//------------------START----------------------------------------------------------------

// ** l18n ** //
var lang = window.GetProperty("界面语言(lang)(cn:中文, en: English)", "auto").toLowerCase();
if (lang != "cn" && lang != "en") {
    lang = (fb.TitleFormat("$meta()").Eval(true) == "[未知函数]") ? "cn" : "en";
}

var lang_pack = {};

if (lang.toLowerCase() == "cn") {
    lang_pack = {
        "Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)": "颜色主题 0: 系统 1: 亮色 2: 暗色 3: 用户",
		"Default": "默认",
		"Repeat (playlist)": "重复 (播放列表)",
		"Repeat (track)": "重复 (音轨)",
		"Random": "随机",
		"Shuffle (tracks)": "乱序 (音轨)",
		"Shuffle (albums)": "乱序 (专辑)",
		"Shuffle (folders)": "乱序 (目录)",
        "File,Edit,View,Playback,Library,Help": "文件,编辑,视图,播放,媒体库,帮助",
        "Shuffle type": "随机类型",
        "Now playing": "正在播放",
        "Volume: ": "音量: ",
        "Previous": "前一首",
        "Play or pause": "播放/暂停",
        "Next": "后一首",
        "Peferences": "首选项",
        "Console": "控制台",
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

(function zoom_all() {
    z1 = zoom(1, g_dpi);
    z2 = zoom(2, g_dpi);
    z4 = zoom(4, g_dpi);
    z5 = zoom(5, g_dpi);
    z7 = zoom(7, g_dpi);
    z10 = zoom(10, g_dpi);
    z12 = zoom(12, g_dpi);
    z14 = zoom(14, g_dpi);
    z15 = zoom(15, g_dpi);
    z16 = zoom(16, g_dpi);
    z20 = zoom(20, g_dpi);
    z30 = zoom(30, g_dpi);
    z32 = zoom(32, g_dpi);
    z115 = zoom(115, g_dpi);
    z380 = zoom(380, g_dpi);
})();

var DT_CC = DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;

var ww = 0, wh = 0;
var m_x, m_y;
var sk, vol;
var g_colors = {};
var g_fonts = {};
var images = {};
var bt = [], bt_len = 0;
var slider_height = z2;
var g_pbo = fb.PlaybackOrder;
var g_shuffle_type = window.GetProperty("SHUFFLE TYPE", 4);
var vol_state = 0;
var g_is_hover_obj = false;

var playback_order_text = "Default,Repeat (playlist),Repeat (track),Random,Shuffle (tracks),Shuffle (albums),Shuffle (folders)".split(",");
var debug = 0;


// Constructors


Seekbar = function() {

	var is_drag = false;
	var pos_p = 0, pos_p_old = 0;

	var slider_l = z5; var slider_r = z5;
	var slider_w = 0; var slider_h = slider_height;
    var slider_x, slider_y;


	var tfont = gdi.Font("Tahoma", z10);

	this.repaint = function() {
		window.Repaint();
	};

	this.is_hover = function(x, y) {
		return (x > slider_x && x < slider_x + slider_w && y > this.y && y < this.h + this.y);
	};

	this.show_time = true;

	this.set_size = function(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	};

	this.draw = function(gr) {

        var img_nob = images.slider_nob;
        var nob_h = img_nob.Height; var nob_y;

		//
		debug && gr.FillSolidRect(this.x, this.y, this.w, this.h, 0xff112233);

		// Set lr
		var len = format_time(fb.PlaybackLength);
		var tim = format_time(fb.PlaybackTime);

		if (this.show_time) {
			slider_r = slider_l = GetTextWidth(len, tfont) + z20;
		} else {
			slider_r = slider_l = z5;
		};

		slider_x = this.x + slider_l;
		slider_w = this.w - slider_l - slider_r;
		slider_y = this.y + Math.floor((this.h - slider_h) / 2);
		nob_y = slider_y - z4;

		// Draw time/length
        if (fb.IsPlaying) {
            gr.GdiDrawText(tim, tfont, g_colors.bg_slider_active, this.x, this.y, slider_l, this.h, DT_CC);
            gr.GdiDrawText(len, tfont, g_colors.bg_slider_active, this.x + this.w - slider_r, this.y, slider_r, this.h, DT_CC);
        }

		// Draw slider
		var pos_w = 0;
		
		if (fb.PlaybackLength) {
			pos_w = Math.floor(fb.PlaybackTime / fb.PlaybackLength * slider_w);
			if (fb.IsPlaying) {
                gr.FillSolidRect(slider_x, slider_y, slider_w, slider_h, g_colors.bg_slider_normal);
                if (pos_w > 0) {
                    gr.FillSolidRect(slider_x, slider_y, pos_w, slider_h, g_colors.bg_slider_active);
                    gr.DrawImage(img_nob, slider_x + pos_w - nob_h / 2, nob_y, nob_h, nob_h, 0, 0, nob_h, nob_h, 0, 236);
                }
			};
		};
	};

	this.on_mouse = function(event, x, y, mask) {

		switch (event) {
			case "move":
				if (is_drag) {
					this.set_pos(x);
					this.repaint();
				};
				break;
			case "down":
				if (this.is_hover(x, y)) {
					if (fb.IsPlaying && fb.PlaybackLength > 0) {
						is_drag = true;
						this.set_pos(x);
						this.repaint();
					};
				};
				break;
			case "up":
				if (is_drag) is_drag = false;
				break;
			case "leave":
				break;
			case "wheel":
				break;
		};
	};

	this.set_pos = function(x) {
		var pt;
		x -= slider_x;
		pos_p = x < 0 ? 0 : x > slider_w ? 1 : x / slider_w;
		pt = fb.PlaybackLength * pos_p;
		fb.PlaybackTime = pt < fb.PlaybackLength ? pt : fb.PlaybackLength;
	};

    /*
	this.on_playback_time = function() {
		if (!fb.IsPlaying || fb.IsPaused || fb.PlaybackLength <= 0 || is_drag) return;
		this.repaint();
	};
    */

	window.SetInterval(function() {
		if (!fb.IsPlaying || fb.IsPaused || fb.PlaybackLength <= 0 || is_drag) return;
		sk.repaint();
	}, 1000);

};


Volume = function() {

	var is_drag = false;
	var pos_p = 0;
	//
	var slider_l = z32; var slider_r = 0;
	var slider_x; var slider_y; var slider_w; var slider_h = slider_height;

    this.tooltip = window.CreateTooltip();

	this.repaint = function() {
		window.Repaint();
	};

	this.is_hover = function(x, y) {
		return (x > slider_x && x < slider_x + slider_w && y > this.y && y < this.h + this.y);
	};

	this.set_size = function(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		slider_x = this.x + slider_l;
		slider_y = this.y + Math.floor((this.h - slider_h) / 2);
		slider_w = this.w - slider_l - slider_r;
	};

	this.draw = function(gr) {

		//
		debug && gr.FillSolidRect(this.x, this.y, this.w, this.h, 0xff223344);

        var img_nob = images.slider_nob;
        var nob_h = img_nob.Height;
		var nob_y = slider_y - z4;

		var pos_w;
		gr.FillSolidRect(slider_x, slider_y, slider_w, slider_h, g_colors.bg_slider_normal);
		pos_w = vol2pos(fb.Volume) * slider_w;
		gr.DrawImage(img_nob, slider_x + pos_w - nob_h / 2, nob_y, nob_h, nob_h, 0, 0, nob_h, nob_h, 0, 236);
		if (pos_w > 0) {
			gr.FillSolidRect(slider_x, slider_y, pos_w, slider_h, g_colors.bg_slider_active);
		};
	};

	this.on_mouse = function(event, x, y, mask) {
		var is_hover;
		is_hover = this.is_hover(x, y);
		switch (event) {
			case "move":
				if (is_drag) {
					this.set_pos(x);
				}
				break;
			case "down":
				if (is_hover) {
					is_drag = true;
					this.set_pos(x);
				};
				break;
			case "up":
				if (is_drag) is_drag = false;
                this.tooltip.Deactivate();
				break;
			case "wheel":
				if (is_hover) {
					pos_p = vol2pos(fb.Volume);
					pos_p += mask / 50 * 2;
					pos_p = (pos_p < 0 ? 0 : pos_p > 1 ? 1 : pos_p);
					fb.Volume = pos2vol(pos_p);
				};
				break;
			case "leave":
				break;
		};
	};

	this.set_pos = function(x) {
		x -= slider_x;
		pos_p = x < 0 ? 0 : x > slider_w ? 1 : x / slider_w;
		fb.Volume = pos2vol(pos_p);
	};

};


function format_time(t) {
	var zpad = function(n) {
		var str = n.toString();
		return (str.length < 2) ? "0"+str : str;
	};
	var h, m, s;
	t = Math.round(t);
	h = Math.floor(t / 3600); 
	t -= h * 3600;
	m = Math.floor(t / 60);
	t -= m * 60;
	s = Math.floor(t);
	if (h > 0) return h.toString() + ":" + zpad(m) + ":" + zpad(s);
	return m.toString() + ":" + zpad(s);
};


function pos2vol(pos) {
	return (50 * Math.log(0.99 * pos + 0.01) / Math.LN10);
};

function vol2pos(v) {
	return ((Math.pow(10, v / 50) - 0.01) / 0.99);
};



// ** on load **

get_colors();
get_fonts();
get_images();

sk = new Seekbar();
vl = new Volume();
//set_btns();


// ** Callback functions **

function on_size() {

	var min_w = z380;

	if (!window.Width || !window.Height) return;
	ww = Math.max(window.Width, min_w);
	wh = window.Height;


	var sk_h;
	var area_y, area_h;
	var vl_h, vl_w, vl_y, vl_x;
	var bh, bx, by;
	var p;

	// seekbar
	sk_h = z20;
	sk.set_size(0, 0, ww, sk_h);

	// area
	area_y = sk_h;
	area_h = wh - sk_h;

	// Volume
	vl_h = z20;
	vl_w = z115;
	vl_y = area_y + Math.floor(area_h / 2 - vl_h / 2) - z2;
	vl.set_size(ww - vl_w - z15, vl_y, vl_w, vl_h);

	// buttons
	bh = bt[0].h;
	by = area_y + Math.floor(area_h / 2 - bh / 2) - z2;
	// Prev, Play, Next
	bt[1].set_xy(ww/2 - bh/2, by); 
	bt[0].set_xy(ww/2 - bh/2*3 -z10, by);
	bt[2].set_xy(ww/2 + bh/2+z10, by);

	// PBO
	bh = bt[3].h;
	by = area_y + Math.floor(area_h / 2 - bh / 2) - z2;
	bt[3].set_xy(bt[0].x - bt[3].w - z10, by);

    // ...
    bt[5].set_xy(z12, by);
    bt[6].set_xy(z12 + bt[5].w + zoom(3, g_dpi), by);

	// VOL
	bh = bt[4].h;
	bw = bt[4].w;
	by = area_y + Math.floor(area_h / 2 - bh / 2) - z2;
	bt[4].set_xy(vl.x, by);


};



function on_paint(gr) {
	//bg
	gr.FillSolidRect(0, 0, ww, wh, g_colors.bg_panel);
    gr.FillSolidRect(0, 0, ww, 1, 0x10ffffff);
	//
	sk.draw(gr);
	vl.draw(gr);
	
	// Buttons
	for (var i = 0; i < bt_len; i++) {
		bt[i].draw(gr);
    }

};

function on_mouse_move(x, y, mask) {

    g_is_hover_obj = false;
	//
	sk.on_mouse("move", x, y, mask);
	vl.on_mouse("move", x, y, mask);
	//
	
	for (var i = 0; i < bt_len; i++) {
		bt[i].check_state("move", x, y, mask);
        if (x > bt[i].x && x < bt[i].x + bt[i].w && y > bt[i].y && y < bt[i].y + bt[i].h) {
            g_is_hover_obj = true;
        }
    }

    if (!g_is_hover_obj) {
        if (sk.is_hover(x, y) || vl.is_hover(x, y)) {
            g_is_hover_obj = true;
        }
    }
	//
	m_x = x;
	m_y = y;
};

function on_mouse_lbtn_down(x, y, mask) {
	sk.on_mouse("down", x, y, mask);
	vl.on_mouse("down", x, y, mask);
	//console(bt[3].menu);
	// buttons
	for (var i = 0; i < bt_len; i++)
		bt[i].check_state("down", x, y, mask);

};

function on_mouse_lbtn_dblclk(x, y, mask) {
	for (var i = 0; i < bt_len; i++) {
		bt[i].check_state("down", x, y);
	};

    if (!g_is_hover_obj) {
        window.NotifyOthers("Show now playing", true);
    }
};

function on_mouse_lbtn_up(x, y, mask) {
	sk.on_mouse("up", x, y, mask);
	vl.on_mouse("up", x, y, mask);
	// buttons
	for (var i = 0; i < bt_len; i++) {
		if (bt[i].check_state("up", x, y) == 1) {
			bt[i].on_click(bt[i].x, bt[i].y);
			break;
		}
	};
};

function on_mouse_rbtn_up(x, y, mask) {
    if (utils.IsKeyPressed(VK_SHIFT)) {
        return false;
    } else {
        main_menu(x, y);
        return true;
    }
}


function on_mouse_leave() {
	for (var i = 0; i < bt_len; i++) {
		if (bt[i].state == 1) bt[i].reset();
	}
}


function on_mouse_wheel(delta) {
	vl.on_mouse("wheel", m_x, m_y, delta);
};

function on_playback_stop(reason) {
	if (reason != 2) {
		sk.repaint();
		update_bt_images();
	};
};

function on_playback_pause() {
	update_bt_images();
};

function on_playback_starting() {
	sk.repaint();
    update_bt_images();
};

function on_playback_order_changed(new_order) {
	g_pbo = new_order;
	update_bt_images();
    bt[3].set_tooltip(__(playback_order_text[fb.PlaybackOrder]));
};

function on_volume_change(val) {
    bt[4].set_tooltip(__("Volume: ") + Math.round(fb.Volume));
    update_bt_images();
	vl.repaint();
};

on_volume_change();

function on_notify_data(name, info) {
	switch (name) {
		case "Reload script":
			if (window.IsVisible) {
				window.Reload();
			};
			break;
        case "DPI":
            g_dpi = info;
            zoom_all();
            slider_height = z2;
            get_images();
            sk = new Seekbar();
            vl = new Volume();
            on_size();
            window.Repaint();
            break;

	}
}


function get_colors() {
	g_colors.bg_panel = RGB(25, 25, 25);
	g_colors.bg_slider_normal = RGB(81, 81, 81);
	g_colors.bg_slider_active = RGB(236, 236, 236);
	g_colors.bg_btn_active = RGB(28, 28, 28);
};

function get_fonts() {
};

function load_image_arr(img) {
	var img_path = fb.ProfilePath + "Skins\\Mnlt2\\";
	return [
		gdi.Image(img_path + img + ".png"), 
		gdi.Image(img_path + img + "_h.png"),
		gdi.Image(img_path + img + "_h.png")
	];
};



function get_images() {

	// slider_nob
	images.slider_nob = gdi.CreateImage(z10, z10);
	g = images.slider_nob.GetGraphics();
	g.SetSmoothingMode(2);
	g.FillEllipse(z1, z1, z7, z7, 0xffffffff);
	images.slider_nob.ReleaseGraphics(g);

    var colors = [RGB(245, 245, 245), RGB(255, 255, 255), RGB(185, 185, 185)];
    var icons = ["\uF001", "\uF002", "\uF003", "\uF004", "\uF005", "\uF006", "\uF007"];
    var obj = ("prev,play,pause,next,repeat,repeat1,shuffle").split(",");
    var font = gdi.Font("mnlt2", z16);
    var rendering_hint = 3;

    var w = z30;
    var s, imgarr, img;
    var sf = StringFormat(1, 1);

    for (var i = 0; i < obj.length; i++) {

        // Create images
        imgarr = [];
        for (s = 0; s < 3; s++) {
            img = gdi.CreateImage(w, w);
            g = img.GetGraphics();
            g.SetTextRenderingHint(rendering_hint);

            g.DrawString(icons[i], font, colors[s], 0, 0, w, w, sf);

            img.ReleaseGraphics(g);
            imgarr[s] = img;
        };

        images[obj[i]] = imgarr;

    }

    var color2 = [RGB(120, 120, 120), RGB(120, 120, 120), RGB(80, 80, 80)];
    imgarr = [];
    for (var s = 0; s < 3; s++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();
        g.SetTextRenderingHint(rendering_hint);

        g.DrawString("\uF005", font, color2[s], 0, 0, w, w, sf);

        img.ReleaseGraphics(g);
        imgarr[s] = img;
    }

    images["defaul"] = imgarr;

    var icons = ["\uf028", "\uf026", "\uF26C", "\uF013"];
    var obj = ["mute", "mute2", "console", "cog"];
    var font = gdi.Font("FontAwesome", z14);

    for (var i = 0; i < obj.length; i++) {

        // Create images
        imgarr = [];
        for (s = 0; s < 3; s++) {
            img = gdi.CreateImage(w, w);
            g = img.GetGraphics();
            g.SetTextRenderingHint(rendering_hint);

            g.DrawString(icons[i], font, colors[s], 0, 0, w, w, sf);

            img.ReleaseGraphics(g);
            imgarr[s] = img;
        };

        images[obj[i]] = imgarr;

    }

    // Set buttons
	bt = [];
	// playback control
	bt[0] = new Button(images.prev, function() {fb.Prev()}, __("Previous"));
	bt[1] = new Button(images.play, function() {fb.PlayOrPause()}, __("Play or pause"));
	bt[2] = new Button(images.next, function() {fb.Next()}, __("Next"));
    bt[3] = new Button(images.defaul, function() {
        switch (fb.PlaybackOrder) {
            case 0:
            case 1:
                fb.PlaybackOrder += 1;
                break;
            case 2:
                try {
                    fb.PlaybackOrder = g_shuffle_type;
                } catch (e) {
                    fb.PlaybackOrder = 4;
                    g_shuffle_type = 4;
                    window.SetProperty("SHUFFLE TYPE", g_shuffle_type);
                }
                break;
            default:
                fb.PlaybackOrder = 0;
                break;
        }
    }, __(playback_order_text[fb.PlaybackOrder]));
    bt[4] = new Button(images.mute, function() {
        fb.VolumeMute();
    }, __("Volume: ") + Math.round(fb.Volume));
    bt[5] = new Button(images.console, function() {
        fb.ShowConsole();
    }, __("Console"));
    bt[6] = new Button(images.cog, function() {
        fb.ShowPreferences();
    }, __("Peferences"));

    bt_len = bt.length;

    update_bt_images();

};

function update_bt_images() {
    switch (fb.PlaybackOrder) {
        case 0:
            bt[3].update_img(images.defaul);
            break;
        case 1:
            bt[3].update_img(images.repeat);
            break;
        case 2:
            bt[3].update_img(images.repeat1);
            break;
        default:
            bt[3].update_img(images.shuffle);
            break;
    }

	// update play-or-pause/stop btn
	if (fb.IsPlaying && fb.IsPaused || !fb.IsPlaying) {
		bt[1].update_img(images.play);
	} else {
		bt[1].update_img(images.pause);
	};

    //
    bt[4].update_img((fb.Volume == -100) ? images.mute2 : images.mute);


    window.Repaint();
}


function main_menu (x, y) {

    var _menu = window.CreatePopupMenu();
    var contextman = fb.CreateContextMenuManager();

    contextman.InitNowPlaying();

    // Create main menus
    var main = ("File,Edit,View,Playback,Library,Help").split(",");
    var main_text = (__("File,Edit,View,Playback,Library,Help")).split(",");
    var menuman = [];
    var child = [];
    for (var i = 0; i < main.length; i++) {
        child[i] = window.CreatePopupMenu();
        child[i].AppendTo(_menu, MF_STRING, __(main_text[i]));
        menuman[i] = fb.CreateMainMenuManager();
        menuman[i].Init(main[i]);
    }

    menuman[0].BuildMenu(child[0], 1, 200);
    menuman[1].BuildMenu(child[1], 201, 200);
    menuman[2].BuildMenu(child[2], 401, 200);
    menuman[3].BuildMenu(child[3], 601, 300);
    menuman[4].BuildMenu(child[4], 901, 300);
    menuman[5].BuildMenu(child[5], 1201, 100);
    _menu.AppendMenuSeparator();

    var _st = window.CreatePopupMenu();
    _st.AppendTo(_menu, MF_STRING, __("Shuffle type"));
    _st.AppendMenuItem(MF_STRING, 2500, __("Random"));
    _st.AppendMenuSeparator();
    _st.AppendMenuItem(MF_STRING, 2501, __("Shuffle (tracks)"));
    _st.AppendMenuItem(MF_STRING, 2502, __("Shuffle (albums)"));
    _st.AppendMenuItem(MF_STRING, 2503, __("Shuffle (folders)"));
    _st.CheckMenuRadioItem(2500, 2503, 2500+g_shuffle_type-3);

    _menu.AppendMenuSeparator();

    var _cont = window.CreatePopupMenu();
    _cont.AppendTo(_menu, MF_STRING, __("Now playing"));

    contextman.InitNowPlaying();
    contextman.BuildMenu(_cont, 1301, -1);
    

    var ret = _menu.TrackPopupMenu(x, y);

    switch (true) {
        case(ret >= 1 && ret < 201):
            menuman[0].ExecuteByID(ret - 1);
            break;

        case (ret >= 201 && ret < 401):
            menuman[1].ExecuteByID(ret - 201);
            break;

        case (ret >= 401 && ret < 601):
            menuman[2].ExecuteByID(ret - 401);
            break;

        case (ret >= 601 && ret < 901):
            menuman[3].ExecuteByID(ret - 601);
            break;

        case (ret >= 901 && ret < 1201):
            menuman[4].ExecuteByID(ret - 901);
            break;

        case (ret >= 1201 && ret < 1301):
            menuman[5].ExecuteByID(ret - 1201);
            break;

        case (ret >= 1301 && ret < 2500):
            contextman.ExecuteByID(ret - 1301);
            break;
    }


    _menu.Dispose();
    _st.Dispose();
    contextman.Dispose();
    for (var i = 0; i < main.length; i++) {
        menuman[i].Dispose();
    }

}

