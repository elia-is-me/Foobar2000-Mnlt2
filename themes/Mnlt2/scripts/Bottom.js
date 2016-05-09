// vim:set ft=javascript fileencoding=utf-8 bomb et:
//
// ==PREPROCESSOR==
// @feature "dragdrop"
// @author "elia_is_me"
// @import "%fb2k_profile_path%skins\Mnlt2\common\common4.js"
// ==/PREPROCESSOR==
//
// Require:
// -> foobar2000 v1.3.3 or newer
// -> WSH Panel Mod Plus 1.5.7 or newer
//
// Update: 2016-05-06

// 根据主程序语言判断脚本中是否使用翻译
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

function lmap (name) {
	return Language.Map(name);
}


var Panel = new function() {

	var this_ = this;

	// dpi zoom related.
	var dpi_percent = get_system_dpi_percent();
	var forced_percent = window.GetProperty("DPI(default = 0)", 0);
	this.dpi = (forced_percent == 0 ? dpi_percent : forced_percent);

	if (this.dpi < 100) {
		this.dpi = 100;
	}

	this.Zoom = function(num) {
		return Math.round(num * this.dpi / 100);
	}

	// colors
	this.colors = {};

	(this.GetColors = function () {
		this_.colors.back = RGB(25, 25, 25);
		this_.colors.slider_inactive = RGB(81, 81, 81);
		this_.colors.slider_active = RGB(236, 236, 236);
	})();

	// fonts
	this.fonts = {};

	(this.GetFonts = function () {
		this_.fonts.time = gdi.Font("Segoe UI", this_.Zoom(12));
        this_.fonts.cover = gdi.Font("Segoe UI", this_.Zoom(12));
        this_.fonts.album = gdi.Font("Segoe UI", this_.Zoom(14));
        this_.fonts.artist = gdi.Font("Segoe UI", this_.Zoom(12));
	})();

}();


var DT_CC = DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var DT_LC = DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;

var ww = 0,
	wh = 0;

var double_clicked = false;
var nob_pressed = false;

var images = {};
var bt = [];
var sk, vol;

var vol_panel = {
    visible: false,
    x: 0,
    y: 0,
    w: 180,
    h: 30
};

var playback_length = "-:--";
var playback_time = "-:--";

var cover = {
    visible: true,
    img: null,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
};

var album_text = "Not playing";
var artist_text = "...";


// if DUI
if (window.InstanceType == 1) {
	window.MaxHeight = window.MinHeight = 80;
}



prepare_images();


// create instances

sk = new Slider(images.nob,
		function () {
			return fb.PlaybackTime / fb.PlaybackLength;
		},
		function (pos) {
			fb.PlaybackTime = fb.PlaybackLength * pos;
		});
vol = new Slider(images.nob, 
		function () {
			return vol2pos(fb.Volume);
		},
		function (pos) {
			fb.Volume = pos2vol(pos);
		});

// -> create buttons
bt[0] = new Button(function () {fb.Prev() });
bt[1] = new Button(function () {
    if (double_clicked) {
        if (fb.IsPlaying) {
            fb.Stop();
        }
    } else {
        fb.PlayOrPause();
    }
});
bt[2] = new Button(function () {fb.Next() });
bt[3] = new Button(function () {
	var order = fb.PlaybackOrder;
	switch (true) {
		case (order < 2):
			fb.PlaybackOrder += 1;
			break;
		case (order == 2):
			fb.PlaybackOrder = 4;
			break;
		default:
			fb.PlaybackOrder = 0;
			break;
	}
});
bt[4] = new Button(function () {
    vol_panel.visible = !vol_panel.visible;
    window.Repaint();
} ); // volume

// init time displaying
if (fb.IsPlaying) {
    on_playback_new_track(fb.GetNowPlaying());
    on_playback_time(fb.PlaybackTime);
};

// init cover display
on_metadb_changed();

// callbacks

function adjust_height() {
    if (ww < 510) {
        window.MaxHeight = window.MinHeight = 80;
    } else if (ww < 930) {
        window.MaxHeight = window.MinHeight = 85;
    } else {
        window.MaxHeight = window.MinHeight = 65;
    }
}


function on_size() {
	ww = Math.max(window.Width, 320);
	wh = window.Height;
    adjust_height();
}

function on_paint (gr) {

	// bg
	gr.FillSolidRect(0, 0, ww, wh, Panel.colors.back);
	gr.FillSolidRect(0, 0, ww, 1, Panel.colors.slider_active & 0x10ffffff);

	// time text
	var time_font = Panel.fonts.time;
	var text_color = Panel.colors.slider_active;

	var time_w1 = gr.CalcTextWidth(playback_time, time_font) + 1;
	var time_w2 = gr.CalcTextWidth(playback_length, time_font) + 1;

    if (ww < 930) {
        // draw time text
        gr.GdiDrawText(playback_time, time_font, text_color, 15, 7, time_w1, 20, DT_CC);
        gr.GdiDrawText(playback_length, time_font, text_color, ww - time_w2 - 15, 7, time_w2, 20, DT_CC);
        // seekbar
        sk.draw(gr, 20+time_w1+10, 7, ww-time_w2-time_w1-20*2-10*2, 20, 9, Panel.colors.slider_active, Panel.colors.slider_inactive);
    } else {
        //
        gr.GdiDrawText(playback_time, time_font, text_color, cover.w+20+240+10, (wh-20)/2, time_w1, 20, DT_CC);
        gr.GdiDrawText(playback_length, time_font, text_color, ww-270-time_w2, (wh-20)/2, time_w2, 20, DT_CC);
        //
        sk.draw(gr, cover.w+280 + time_w1, (wh-20)/2, ww-cover.w-280-time_w2-time_w1-270-10, 20, 9, Panel.colors.slider_active, Panel.colors.slider_inactive);
    }

	// buttons
	var bt_w = images.prev.Width;
	var pad = 20;
	var bt_y = Math.round((wh + 22 - bt_w) / 2);
	var bt_x = Math.round((ww - bt_w * 5 - pad * 4) / 2);
	var order = fb.PlaybackOrder;

	var bt_imgs = [
		images.prev,
		fb.IsPlaying && !fb.IsPaused ? images.pause : images.play,
		images.next,
		(function () {
			var img;
			switch (true) {
				case (order == 0):
					img = images.normal;
					break;
				case (order == 1):
					img = images.repeat;
					break;
				case (order == 2):
					img = images.repeat1;
					break;
				case (order >= 3):
					img = images.shuffle;
					break;
			};
			return img;
		})(),
		images.volume
	];

    if (ww < 510) {
        bt_x = Math.round((ww - bt_w * 5 - pad * 4) / 2);
    } else {
        bt_x = ww - bt_w * 5 - pad * 5;
    }

    if (ww < 930) {
        bt_y = Math.round((wh + 22 - bt_w) / 2);
    } else {
        bt_y = Math.round((wh - bt_w) / 2);
    }

	// -> draw buttons
	for (var i = 0; i < bt.length; i++) {
		bt[i].draw(gr, bt_imgs[i], bt_x, bt_y, bt_w, bt_w);
		bt_x += (bt_w + pad);
	}


    // draw volume bar
    if (vol_panel.visible) {
        // vol panel bg
        if (ww < 930) {
            vol_panel.x = bt[4].x + bt[4].w/2 - vol_panel.w/2;
            if (vol_panel.x + vol_panel.w + 2 > ww) {
                vol_panel.x = ww - 2 - vol_panel.w;
            }
            vol_panel.y = 2;
        } else {
            vol_panel.x = bt[4].x - vol_panel.w - bt[4].w/2;
            vol_panel.y = (wh - vol_panel.h) / 2;
        }
        gr.SetSmoothingMode(2);
        gr.FillSolidRect(vol_panel.x, vol_panel.y, vol_panel.w, vol_panel.h, RGB(30, 30, 30));
        gr.DrawRect(vol_panel.x, vol_panel.y, vol_panel.w-1, vol_panel.h-1, 2, 0x55ffffff & Panel.colors.slider_active);
        gr.SetSmoothingMode(0);
        // vol value
        gr.GdiDrawText(Math.round(fb.Volume+100), time_font, text_color, vol_panel.x, vol_panel.y, 40, vol_panel.h, DT_CC);
        // vol bar
        vol.draw(gr, vol_panel.x+40, vol_panel.y+5, vol_panel.w-40-15, 20, 9, Panel.colors.slider_active, Panel.colors.slider_inactive);
    }

    // draw cover & album info
    cover.visible = (ww >= 510);

    if (cover.visible && fb.IsPlaying) {

        // calc cover y
        cover.x = 10;
        if (ww < 930) {
            cover.y = 35;
            cover.w = cover.h = wh - 40;
        } else {
            cover.y = 10;
            cover.w = cover.h = wh - 20;
        }

        var album_w;

        if (ww < 930) {
            album_w = bt[0].x - cover.x - cover.w - 30;
        } else {
            album_w = 240;
        }

        // cover image
        if (cover.img) {
            gr.DrawImage(cover.img, cover.x, cover.y,  cover.w, cover.h, 0, 0, cover.img.Width, cover.img.Height, 0, 255);
        } else {
            gr.FillSolidRect(cover.x, cover.y, cover.w, cover.h, text_color & 0x10ffffff);
            gr.GdiDrawText("No\nCover", Panel.fonts.cover, blendColors(text_color, Panel.colors.back, 0.5), cover.x, cover.y, cover.w, cover.h, DT_CC);
        }


        // album info
        gr.GdiDrawText(album_text, Panel.fonts.album, text_color, cover.x+cover.w+10, cover.y, album_w, 25, DT_LC);
        gr.GdiDrawText(artist_text, Panel.fonts.artist, blendColors(text_color, Panel.colors.back, 0.3), cover.x+cover.w+10, cover.y+20, album_w, 25, DT_LC);
        //gr.DrawRect(cover.x + cover.w + 10, cover.y, album_w, cover.h-1, 1, 0xff00ffff);
    }

}

function on_metadb_changed (handle_list, fromhook) {

    // 如果不需要显示，则...
    if (!cover.visible) {
        //return;
    }

    var metadb = fb.IsPlaying ? fb.GetNowPlaying() : null;
    if (metadb) {
        // get cover
        utils.GetAlbumArtAsync(window.ID, metadb, AlbumArtId.front);
        // get album info
        album_text = $("$if2([%album%],'Unknown album')", metadb);
        artist_text = $("$if2([%album artist%],'...')", metadb);
    } else {
        cover.img = null;
        album_text = "";
        artist_text = "";
    }
    window.Repaint();

}

function on_mouse_wheel(step) {
    if (vol_panel.visible) {
        fb.Volume += step * Math.exp(-fb.Volume / 33.333);
    }
}

function on_mouse_move (x, y) {
	if (fb.IsPlaying) {
		sk.move(x, y);
		if (sk.is_drag) {
			on_playback_time(fb.PlaybackTime);
		}
	}

    vol.move(x, y);

	bt.forEach(function (b) { b.move(x, y) });
}

function on_mouse_lbtn_down (x, y, mask) {
    var over_vol_panel = vol_panel.visible && is_over_rect(x, y, vol_panel.x, vol_panel.y, vol_panel.w, vol_panel.h)
    if (over_vol_panel ) {
        vol.down(x, y);
    } else {
        if (fb.IsPlaying) {
            sk.down(x, y);
        }
        if (!bt[4].is_mouse_over(x, y) && vol_panel.visible) {
            vol_panel.visible = false;
        }
        window.Repaint();
    }

	bt.forEach(function (b) { 
        if (!over_vol_panel) {
            b.down(x, y);
            return true;
        }
    });

}

function on_mouse_lbtn_up(x, y, mask) {
	sk.up(x, y);
    vol.up(x, y);

    var over_vol_panel = vol_panel.visible && is_over_rect(x, y, vol_panel.x, vol_panel.y, vol_panel.w, vol_panel.h)

	bt.forEach(function (b) {
		if (!over_vol_panel && b.up(x, y)) {
			b.on_click(x, y);
			return true;
		}
	});
    if (double_clicked) {
        double_clicked = false;
    }
}

function on_mouse_rbtn_up(x, y, mask) {
	return (mask != MK_SHIFT);
}

function on_mouse_lbtn_dblclk(x, y, mask) {
    double_clicked = true;
	on_mouse_lbtn_down(x, y, mask);
}

function on_mouse_leave() {
	bt.forEach(function (b) { b.leave() });
}

function on_playback_seek(time) {
    on_playback_time(time);
}

function on_playback_time(time) {
	playback_time = utils.FormatDuration(time);
	sk.update();
}

function on_playback_new_track (metadb) {
	playback_time = "0:00";
	playback_length = $("[%length%]", metadb);
	sk.update();
    on_metadb_changed();
}

function on_playback_pause(state) {
	window.Repaint();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		reset_time();
		sk.update();
        on_metadb_changed();
	}
}

function on_get_album_art_done(metadb, art_id, image, image_path) {
    cover.img = image;
    window.Repaint();
}

function on_playback_order_changed(new_order) {
	window.Repaint();
}

function on_drag_drop (action, x, y, mask) {
    var idx;
    
    if (!plman.PlaylistCount) {
        idx = plman.CreatePlaylist(0, __("Default"));
        plman.ActivePlaylist = 0;
    } else {
        plman.ClearPlaylistSelection(plman.ActivePlaylist);
        idx = plman.ActivePlaylist;
    } 

    if (idx != undefined) {
        action.ToPlaylist();
        action.Playlist = idx;
        action.ToSelect = true;
    }

    window.SetTimeout(function() {
        window.NotifyOthers("Drag enter files", true);
    }, 100);
}

function on_volume_change(val) {
    vol.update();
}



// functions 

function pos2vol(pos) {
	return (50 * Math.log(0.99 * pos + 0.01) / Math.LN10);
};

function vol2pos(v) {
	return ((Math.pow(10, v / 50) - 0.01) / 0.99);
};

function reset_time () {
	playback_length = "-:--";
	playback_time = "-:--";
	window.Repaint();
}

function prepare_images () {

	// create button images
	var g;
	var ico_f = gdi.Font("Segoe MDL2 Assets", Panel.Zoom(15));
	var ico_n = ["prev", "pause", "play", "next", "volume", "shuffle", "repeat", "repeat1", "normal"];
	var ico_c = ["\uE100", "\uE103", "\uE102", "\uE101", "\uE15D" , "\uE14B", "\uE149", "\uE1CC", "\uE8AB"];
	var len = ico_n.length;
	var w = Panel.Zoom(30), img = null;
	var sf = StringFormat(1, 1); // c-c

	var text_color = Panel.colors.slider_active;

	for (var i = 0; i < len; i++) {
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();

		g.SetTextRenderingHint(3);
		g.DrawString(ico_c[i], ico_f, text_color, 0, 0, w, w, sf);
		g.DrawString(ico_c[i], ico_f, text_color, 0, 0, w, w, sf);
		g.SetTextRenderingHint(0);

		img.ReleaseGraphics(g);
		images[ico_n[i]] = img;
	}

	// slider nob
	var w = Panel.Zoom(10);
	images.nob = gdi.CreateImage(w, w);
	g = images.nob.GetGraphics();
	g.SetSmoothingMode(2);
	g.FillEllipse(1, 1, 7, 7, text_color);
	g.SetSmoothingMode(0);
	images.nob.ReleaseGraphics(g);

}

function is_over_rect (x, y, x1, y1, w1, h1) {
    return (x > x1 && x < x1 + w1 && y > y1 && y < y1 + h1);
}

