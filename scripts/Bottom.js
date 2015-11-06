// =========================================================================

// Seekbar
Seekbar = function() {

	var is_drag = false;
	var pos_p = 0, pos_p_old = 0;

	var slider_l = 5; var slider_r = 5;
	var slider_w = 0; var slider_h = slider_height;

	var img_nob = images.slider_nob;
	var nob_h = img_nob.Height; var nob_y;

	var tfont = gdi.Font("Tahoma", 9);

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

		// Set lr
		var len = format_time(fb.PlaybackLength);
		var tim = format_time(fb.PlaybackTime);

		if (this.show_time) {
			slider_r = slider_l = GetTextWidth(len, tfont) + 10;
		} else {
			slider_r = slider_l = 5;
		};

		slider_x = this.x + slider_l;
		slider_w = this.w - slider_l - slider_r;
		slider_y = this.y + Math.floor((this.h - slider_h) / 2);
		nob_y = slider_y - 4;

		// Draw time/length
		gr.GdiDrawText(tim, tfont, g_colors.bg_slider_active, this.x, this.y, slider_l, this.h, dt_cc);
		gr.GdiDrawText(len, tfont, g_colors.bg_slider_active, this.x + this.w - slider_r, this.y, slider_r, this.h, dt_cc);

		// Draw slider
		var pos_w = 0;
		
		gr.FillSolidRect(slider_x, slider_y, slider_w, slider_h, g_colors.bg_slider_normal);
		if (fb.PlaybackTime) {
			pos_w = Math.floor(fb.PlaybackTime / fb.PlaybackLength * slider_w);
			if (fb.IsPlaying && pos_w > 0) {
				gr.FillSolidRect(slider_x, slider_y, pos_w, slider_h, g_colors.bg_slider_active);
			};
		};
		gr.DrawImage(img_nob, slider_x + pos_w - nob_h / 2, nob_y, nob_h, nob_h, 0, 0, nob_h, nob_h, 0, 255);
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

	this.on_playback_time = function() {
		if (!fb.IsPlaying || fb.IsPaused || fb.PlaybackLength <= 0 || is_drag) return;
		this.repaint();
	};

	window.SetInterval(function() {
		if (!fb.IsPlaying || fb.IsPaused || fb.PlaybackLength <= 0 || is_drag) return;
		sk.repaint();
	}, 1000);

};

Volume = function() {

	var is_drag = false;
	var pos_p = 0;
	//
	var slider_l = 32; var slider_r = 0;
	var slider_x; var slider_y; var slider_w; var slider_h = slider_height;

	var img_nob = images.slider_nob;
	var nob_h = img_nob.Height;
	var nob_y;


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
		nob_y = slider_y - 4;
	};

	this.draw = function(gr) {
		var pos_w;
		gr.FillSolidRect(slider_x, slider_y, slider_w, slider_h, g_colors.bg_slider_normal);
		pos_w = vol2pos(fb.Volume) * slider_w;
		gr.DrawImage(img_nob, slider_x + pos_w - nob_h / 2, nob_y, nob_h, nob_h, 0, 0, nob_h, nob_h, 0, 255);
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

// functions

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



var dt_cc = DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var ww = 0, wh = 0;
var m_x, m_y;
var sk, vol;
var g_colors = {};
var g_fonts = {};
var images = {};
var g_btns = [], btn_length = 0;
var slider_height = 2;
var shuffle_id = 4;

/** properties **/
window.MinHeight = window.MaxHeight = 64;

get_colors();
get_fonts();
get_images();

sk = new Seekbar();
vl = new Volume();
vl.repaint();
set_btns();


function on_size() {
	var min_w = 380

	if (!window.Width || !window.Height) return;
	ww = Math.max(window.Width, min_w);
	wh = window.Height;

	// seekbar
	var sk_h = 15;
	var sk_w = ww;
	sk.set_size(0, 0, sk_w, sk_h);

	// area
	var area_y = sk_h;
	var area_h = wh - sk_h;
	var min_w = 380;

	// volumebar
	var vl_h = 20;
	var vl_w = 75 + 30;
	var vl_y = area_y + Math.floor(area_h / 2 - vl_h / 2) - 2;
	var bw3 = images.repeat_off[0].Width;
	var p = 4;
	var vl_x = ww - vl_w - (bw3 + p) * 2 - 10;
	vl.set_size(vl_x, vl_y, vl_w, vl_h);

	// buttons
	var bw = images.play[0].Width;
	var bw2 = images.stop[0].Width;
	var by = Math.floor(area_h / 2 - bw / 2)  + area_y - 2;
	var by2 = Math.floor(area_h / 2 - bw2 / 2) + area_y - 2;
	var bx = 20;
	var p = 12;
	g_btns[0].set_xy(bx, by);
	g_btns[1].set_xy(bx + bw + p, by2);
	g_btns[2].set_xy(bx + (bw + p) * 2, by2);
	g_btns[3].set_xy(bx + (bw + p) * 3, by2);

	var p = 4;
	g_btns[4].set_xy(vl.x, by);
	//
	by = Math.floor(area_h / 2 - bw3 / 2)  + area_y - 2;
	g_btns[5].set_xy(vl.x+vl.w+p, by);
	g_btns[6].set_xy(g_btns[5].x+g_btns[5].w+p, by);

};

var img_tmp = gdi.Image("E:\\img.png");

function on_paint(gr) {
	//bg
	gr.FillSolidRect(0, 0, ww, wh, RGB(38, 38, 38));
	//
	sk.draw(gr);
	vl.draw(gr);

	// btns
	for (var i = 0; i < btn_length; i++) {
		g_btns[i].draw(gr);
	};

};

function on_mouse_move(x, y, mask) {
	//
	sk.on_mouse("move", x, y, mask);
	vl.on_mouse("move", x, y, mask);
	//
	
	for (var i = 0; i < btn_length; i++)
		g_btns[i].check_state("move", x, y, mask);
	//
	m_x = x;
	m_y = y;
};

function on_mouse_lbtn_down(x, y, mask) {
	sk.on_mouse("down", x, y, mask);
	vl.on_mouse("down", x, y, mask);
	// buttons
	for (var i = 0; i < btn_length; i++)
		g_btns[i].check_state("down", x, y, mask);

};

function on_mouse_lbtn_dblclk(x, y, mask) {
	for (var i = 0; i < btn_length; i++)
		g_btns[i].check_state("down", x, y);
};

function on_mouse_lbtn_up(x, y, mask) {
	sk.on_mouse("up", x, y, mask);
	vl.on_mouse("up", x, y, mask);
	// buttons
	for (var i = 0; i < btn_length; i++) {
		if (g_btns[i].check_state("up", x, y) == 1)
			g_btns[i].on_click(g_btns[i].x, g_btns[i].y);
	};
};

function on_mouse_leave() {
	for (var i = 0; i < btn_length; i++)
		g_btns[i].check_state("leave", 0, 0);
};

function on_mouse_wheel(delta) {
	vl.on_mouse("wheel", m_x, m_y, delta);
};

function on_playback_stop(reason) {
	if (reason != 2) {
		sk.repaint();
		update_btn_img();
	};
};

function on_playback_pause() {
	update_btn_img();
};

function on_playback_starting() {
	sk.repaint();
	update_btn_img();
};

function on_playback_order_changed(new_order) {
	update_btn_img();
};

function on_volume_change(val) {
	var muted, muted_;

	muted = (fb.Volume == -100);
	if (muted != muted_) {
		g_btns[4].update_img(muted ? images.vol_m : images.vol);
	};
	vl.repaint();
};


function get_colors() {
	g_colors.bg_panel = RGB(38, 38, 38);
	g_colors.bg_slider_normal = RGB(81, 81, 81);
	g_colors.bg_slider_active = RGB(255, 255, 255);
	g_colors.bg_btn_active = RGB(28, 28, 28);
};

function get_fonts() {
};

function get_images() {

	var fontGuifx = gdi.Font("Guifx v2 Transports", 18, 0);
	var fontGuifx2 = gdi.Font("Guifx v2 Transports", 16, 0);
	var fontGuifx3 = gdi.Font("Guifx v2 Transports", 18, 0);

	var fontAwesome = gdi.Font("FontAwesome", 16, 0);


	var w = 30, r;
	var color_normal, color_hover, color_down, color, color_off;
	var s, img_arr, img, font, pt_arr;
	var sf = StringFormat(1, 1);

	color_normal = RGB(245, 245, 245);
	color_hover = RGB(224, 224, 224);
	color_down = RGB(100, 100, 100);

	// play
	img_arr = [];
	pt_arr = [8,6, 22,15, 8,24];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx2;
		if (s == 1) {color = color_hover};
		if (s == 2) {
			color = color_down;
			font = fontGuifx2;
		};
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();

		g.SetSmoothingMode(2);
		g.FillPolygon(color, 1, pt_arr);

		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.play = img_arr;

	// pause
	img_arr = [];
	pt_arr1 = [8,8, 12,8, 12,24, 8,24];
	pt_arr2 = [18,8, 22,8, 22,24, 18,24];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx2;
		(s == 1) && (color = color_hover);
		if (s == 2) {
			color = color_down;
			font = fontGuifx2;
		};
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetSmoothingMode(1);
		g.FillPolygon(color, 1, pt_arr1);
		g.FillPolygon(color, 1, pt_arr2);

		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.pause = img_arr;

	// stop
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx3;
		(s == 1) && (color = color_hover);
		if (s == 2) { 
			color = color_down;
			font = fontGuifx2;
		};

		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);

		g.DrawString("3", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.stop = img_arr;

	// prev
	img_arr = [];
	pt_arr1 = [5,15, 15,9, 15,21];
	pt_arr2 = [15,15, 25,9, 25,21];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx;
		(s == 1) && (color = color_hover);
		if (s == 2) {
			color = color_down;
			font = fontGuifx2;
		};
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetSmoothingMode(2);
		g.FillPolygon(color, 1, pt_arr1);
		g.FillPolygon(color, 1, pt_arr2);

		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.prev = img_arr;

	// next
	img_arr = [];
	pt_arr1 = [5,9, 15,15, 5,21];
	pt_arr2 = [15,9, 25,15, 15,21];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx;
		(s == 1) && (color = color_hover);
		if (s == 2) {
		   color = color_down;
		   font = fontGuifx2;
		}
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetSmoothingMode(2);
		g.FillPolygon(color, 1, pt_arr1);
		g.FillPolygon(color, 1, pt_arr2);

		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.next = img_arr;

	// add
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx2;
		if (s == 1) { color = color_hover; }
		if (s == 2) { 
			color = color_down; 
			font = fontGuifx;
		}
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);

		g.DrawString("'", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.add = img_arr;

	// vol
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontAwesome;
		if (s == 1) {color = color_hover};
		if (s == 2) { color = color_down};
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);
		g.DrawString("\uf028", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.vol = img_arr;

	// vol_mute
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontAwesome;
		if (s == 1) color = color_hover;
		if (s == 2) color = color_down;
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);
		g.DrawString("\uf026", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.vol_m = img_arr;

	//
	w = 24;
	r = 4;
	
	var color_off = g_colors.bg_slider_normal;

	// repeat_off
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_off;
		font = fontGuifx2;
		if (s == 1) color = color_hover;
		else if (s == 2) color = color_down;

		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);
		g.DrawString("*", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.repeat_off = img_arr;
	
	// repeat_pl
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx2;
		if (s == 1) color = color_hover;
		else if (s == 2) color = color_down;

		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetSmoothingMode(4);
		g.FillRoundRect(0, 2, w-1, w-5, r, r, g_colors.bg_btn_active);
		g.SetTextRenderingHint(4);
		g.DrawString("*", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.repeat_pl = img_arr;

	// repeat_1
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx2;
		if (s == 1) color = color_hover;
		else if (s == 2) color = color_down;

		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetSmoothingMode(4);
		g.FillRoundRect(0, 2, w-1, w-5, r, r, g_colors.bg_btn_active);
		g.SetTextRenderingHint(4);
		g.DrawString("(", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.repeat_1 = img_arr;

	// shuffle_off
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_off;
		font = fontGuifx2;
		if (s == 1) color = color_hover;
		else if (s == 2) color = color_down;

		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);
		g.DrawString("&", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.shuffle_off = img_arr;

	// shuffle_on
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx2;
		if (s == 1) color = color_hover;
		else if (s == 2) color = color_down;

		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetSmoothingMode(4);
		g.FillRoundRect(0, 2, w-1, w-5, r, r, g_colors.bg_btn_active);
		g.SetTextRenderingHint(4);
		g.DrawString("&", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.shuffle_on = img_arr;
	

	// slider_nob
	images.slider_nob = gdi.CreateImage(10, 10);
	g = images.slider_nob.GetGraphics();
	g.SetSmoothingMode(2);
	g.FillEllipse(1, 1, 7, 7, 0xffffffff);
	images.slider_nob.ReleaseGraphics(g);
};


function set_btns() {
	g_btns = [];
	// playback control
	g_btns[0] = new Button(images.prev, function() {fb.Prev()});
	g_btns[1] = new Button(images.play, function() {fb.PlayOrPause()});
	g_btns[2] = new Button(images.next, function() {fb.Next()});
	g_btns[3] = new Button(images.add, function(x, y) {
		var _menu = window.CreatePopupMenu();
		_menu.AppendMenuItem(MF_STRING, 1, "Add files...");
		_menu.AppendMenuItem(MF_STRING, 2, "Add folder...");
		_menu.AppendMenuItem(MF_STRING, 3, "Add location...");

		var ret = _menu.TrackPopupMenu(x, y);
		switch (ret) {
			case 1:
				fb.AddFiles();
				break;
			case 2:
				fb.AddDirectory();
				break;
			case 3:
				fb.RunMainMenuCommand("File/Add location...");
				break;
		};
		_menu.Dispose();
	});

	// vol
	var img = ((fb.Volume == -100) ? images.vol_m : images.vol);
	g_btns[4] = new Button(img, function() {
		fb.VolumeMute();
	});

	// playback-order
	g_btns[5] = new Button(images.repeat_off, function() {
		var pbo = fb.PlaybackOrder;
		if (pbo == 0 || pbo > 2) fb.PlaybackOrder = 1;
		else if (pbo == 1) fb.PlaybackOrder = 2;
		else if (pbo == 2) fb.PlaybackOrder = 0;
	});
	g_btns[6] = new Button(images.shuffle_off, function() {
		// check shuffle id
		if (shuffle_id < 3 || shuffle_id > 5) {
			shuffle_id = 4;
		};
		fb.PlaybackOrder = (fb.PlaybackOrder >= 3 ? 0 : shuffle_id);

	});

	btn_length = g_btns.length;
	update_btn_img();
};

function update_btn_img(btn) {
	// update play-or-pause/stop btn
	var pp_id = 1;
	if (fb.IsPlaying) {
		if (fb.IsPaused) g_btns[pp_id].update_img(images.play);
		else g_btns[pp_id].update_img(images.pause);
	} else {
		g_btns[pp_id].update_img(images.stop);
	};

	// update pbo btns
	var pbo = fb.PlaybackOrder;
	g_btns[5].update_img(images.repeat_off);
	g_btns[6].update_img(images.shuffle_off);
	if (pbo == 1) g_btns[5].update_img(images.repeat_pl);
	else if (pbo == 2) g_btns[5].update_img(images.repeat_1);
	else if (pbo > 2) g_btns[6].update_img(images.shuffle_on);

	//
	window.Repaint();
};
