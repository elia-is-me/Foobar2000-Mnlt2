// vim:set ft=javascript fileencoding=utf-8 bomb et:
//
// Requirements: 
// * foobar2000 version 1.3.3 or higher
// * WSH Panel Mod Plus 1.5.7 or higher

// ==PREPROCESSOR==
// @author "elia_is_me"
// @update "2016-02-16"
// @import "%fb2k_profile_path%skins\Mnlt2\common\common4.js"
// ==/PREPROCESSOR==

var Language = new function() {
	var lang = window.GetProperty("界面语言(lang)(cn:中文, en: English)", "auto").toLowerCase();
	if (lang != "cn" && lang != "en") {
		lang = (fb.TitleFormat("$meta()").Eval(true) == "[未知函数]") ? "cn" : "en";
	}
	this.lang_pack = {};

	if (lang.toLowerCase() == "cn") {
		this.lang_pack = {
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

	this.Map = function (name) {
		var str = this.lang_pack[name];
		if (!str) {
			str = name;
		}
		return str;
	}
}();

function __(name) {
	return Language.Map(name);
}

var Panel = new function() {

    this.dpi = 100;

    this.get_dpi_percent = function() {
        var g_dpi_percent = get_system_dpi_percent();
        var g_forced_percent = window.GetProperty("DPI (default = 0)", 0);
        this.dpi = (g_forced_percent == 0 ? g_dpi_percent : g_forced_percent);
        if (this.dpi < 100){
           this.dpi = 100;
        }
    }

    this.get_dpi_percent();

    this.Zoom = function(num) {
        return Math.round(num * this.dpi / 100);
    }

}();



var DT_CC = DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;

var ww = 0,
    wh = 0;

var Colors = {};
var Fonts = {};
var images = {};
var bt = [];
var sk = null, 
    vol = null;

var playback_length = "0:00",
    playback_time = "0:00";
var time_font = gdi.Font("Segoe UI", 12);



// on_load

if (window.InstanceType == 1) {
    window.MaxHeight = window.MinHeight = 80;
}

get_colors();
prepare_images();

// new Instance of Slider
// seekbar
sk = new Slider(images.nob,
        function() {
            return fb.PlaybackTime / fb.PlaybackLength;
        },
        function (pos) {
            fb.PlaybackTime = fb.PlaybackLength * pos;
        });

// volume bar
vol = new Slider(images.nob,
        function () {
            return vol2pos(fb.Volume);
        },
        function (pos) {
            fb.Volume = pos2vol(pos);
        });
vol.visible = false;

bt[0] = new Button(function () { fb.Prev(); });
bt[1] = new Button(function () { fb.PlayOrPause(); });
bt[2] = new Button(function () { fb.Next() });
bt[3] = new Button(function () {
    var od = fb.PlaybackOrder;
    switch (true) {
        case (od < 2):
            fb.PlaybackOrder += 1;
            break;
        case (od == 2):
            fb.PlaybackOrder = 4;
            break;
        default:
            fb.PlaybackOrder = 0;
            break;
    }
})
bt[4] = new Button();

if (fb.IsPlaying) {
    on_playback_new_track(fb.GetNowPlaying());
    on_playback_time(fb.PlaybackTime);
};


function on_size() {
    ww = window.Width;
    wh = window.Height;
    if (ww < 380) {
        ww = 380;
    }
}

function on_paint(gr) {
    // Bg
    gr.FillSolidRect(0, 0, ww, wh, Colors.back);

    // Time text
    var time_w1 = gr.CalcTextWidth(playback_time, time_font)+1;
    var time_w2 = gr.CalcTextWidth(playback_length, time_font) + 1;
    var textcolor = Colors.slider_active;
    gr.GdiDrawText(playback_time, time_font, textcolor, 20, 7, time_w1, 20, DT_CC);
    gr.GdiDrawText(playback_length, time_font, textcolor, ww-time_w2-20, 7, time_w2, 20, DT_CC);

    // seekbar
    sk.draw(gr, 20+time_w1+10, 7, ww-time_w2-time_w1-20*2-10*2, 20, 9, 
            Colors.slider_active, Colors.slider_inactive);

    // buttons
    var bt_w = images.prev.Width;
    var pad = 20;
    var bt_y = Math.round((wh + 22 - bt_w) / 2);
    var bt_x = Math.round((ww - bt_w * bt.length - pad * (bt.length - 1)) / 2);
    var pbo = fb.PlaybackOrder;

    var bt_imgs = [
        images.prev, 
        fb.IsPlaying && !fb.IsPaused ? images.pause : images.play,
        images.next,
        (function() {
            var img;
            switch (true) {
                case (pbo == 0):
                    img = images.normal;
                    break;
                case (pbo == 1):
                    img = images.repeat;
                    break;
                case (pbo == 2):
                    img = images.repeat1;
                    break;
                case (pbo >= 3):
                    img = images.shuffle;
                    break;
            }
            return img;
        })(),
        images.volume];

    for (var i = 0; i < bt.length; i++) {
        try{
        bt[i].draw(gr, bt_imgs[i], bt_x, bt_y, bt_w, bt_w);
        } catch (e){};
        bt_x += (bt_w + pad);
    }

}

function on_mouse_move (x, y) {
    if (fb.IsPlaying) {
        sk.move(x, y);
        if (sk.is_drag) {
            on_playback_time(fb.PlaybackTime);
        }
    }

    bt.forEach(function (b) {
        b.move(x, y);
    });

}

function on_mouse_lbtn_down (x, y, mask) {
    if (fb.IsPlaying) {
        sk.down(x, y);
    }

    bt.find(function (b) {
        return b.down(x, y);
    });

}

function on_mouse_lbtn_up(x, y, mask) {
    sk.up(x, y);
    bt.forEach(function (b) {
        if (b.up(x,y)) {
            b.on_click(x, y);
            return true;
        }
    });
}

function on_mouse_rbtn_up(x, y, mask) {
    return (mask != MK_SHIFT);
}

function on_mouse_lbtn_dblclk(x, y, mask) {
    on_mouse_lbtn_down(x, y, mask);
}

function on_mouse_leave () {
    bt.forEach(function (b) {
        b.leave();
    });
}


function on_playback_time(time) {
    playback_time = utils.FormatDuration(time);
    sk.update();
}

function on_playback_new_track(metadb) {
    reset_time();
    playback_length = $("[%length%]", metadb);
    sk.update();
}

function on_playback_starting() {
    /*
    reset_time();
    sk.update();
    */
}

function on_playback_pause(state) {
    window.Repaint();
}

function on_playback_stop(reason) {
    if (reason != 2) {
        reset_time();
        sk.update();
    }
}

function on_playback_order_changed(new_order) {
    window.Repaint();
}


function pos2vol(pos) {
	return (50 * Math.log(0.99 * pos + 0.01) / Math.LN10);
};

function vol2pos(v) {
	return ((Math.pow(10, v / 50) - 0.01) / 0.99);
};

function get_colors() {
    Colors.back = RGB(25, 25, 25);
    Colors.slider_inactive = RGB(81, 81, 81);
    Colors.slider_active = RGB(236, 236, 236);
}

function prepare_images() {

    var g;
    var ico_font = gdi.Font("Segoe MDL2 Assets", 15);
	var ico_name = ["prev", "pause", "play", "next", "volume", "shuffle", "repeat", "repeat1", "normal"];
	var ico_code = ["\uE100", "\uE103", "\uE102", "\uE101", "\uE15D" , "\uE14B", "\uE149", "\uE1CC", "\uE8AB"];
    var len = ico_name.length;
    var w = 30, img = null;
    var sf = StringFormat(1, 1);

    var text_color = Colors.slider_active;

    for (var i = 0; i < len; i++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();

		g.SetTextRenderingHint(3);
		g.DrawString(ico_code[i], ico_font, text_color, 0, 0, w, w, sf);
		g.DrawString(ico_code[i], ico_font, text_color, 0, 0, w, w, sf);
		g.SetTextRenderingHint(0);

        img.ReleaseGraphics(g);
        images[ico_name[i]] = img;
    }

    // nob
    images.nob = gdi.CreateImage(10, 10);
    g = images.nob.GetGraphics();
    g.SetSmoothingMode(2);
    g.FillEllipse(1, 1, 7, 7, text_color);
    g.SetSmoothingMode(0);
    images.nob.ReleaseGraphics(g);

}

function reset_time() {
    playback_length = "0:00";
    playback_time = "0:00";
    window.Repaint();
}
