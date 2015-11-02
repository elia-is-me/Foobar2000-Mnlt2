// =========================================================================
// seekbar
Seekbar = function() {

	var is_drag = false;
	var pos_p = 0;

	var slider_l = 0;
	var slider_r = 0;
	var slider_w = 0;
	var slider_h = 6;

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
		slider_w = this.w - slider_l - slider_r;
		slider_y = this.y + Math.floor((this.h - slider_h) / 2);
	};

	this.draw = function(gr) {
		gr.FillSolidRect(slider_x, slider_y, slider_w, slider_h, g_colors.bg_slider_normal);
		if (fb.PlaybackTime) {
			var pos_ = Math.floor(fb.PlaybackTime / fb.PlaybackLength * slider_w);
			if (fb.IsPlaying && pos_ > 0) {
				gr.FillSolidRect(slider_x, slider_y, pos_, slider_h, g_colors.bg_slider_active);
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
	var slider_l = 32;
	var slider_r = 0;
	var slider_x;
	var slider_y;
	var slider_w;
	var slider_h = 6;

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
		var pos_w;
		gr.FillSolidRect(slider_x, slider_y, slider_w, slider_h, g_colors.bg_slider_normal);
		pos_w = vol2pos(fb.Volume) * slider_w;
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
}

function vol2pos(v) {
	return ((Math.pow(10, v / 50) - 0.01) / 0.99);
}






var ww = 0, wh = 0;
var m_x, m_y;
var sk, vol;
var g_colors = {};
var g_fonts = {};
var images = {};
var g_btns = [], btn_length = 0;

/** properties **/
window.MinHeight = window.MaxHeight = 46;
var min_width = 400;
var show_status = false; // TODO: statusbar

get_colors();
get_fonts();
get_images();

sk = new Seekbar();
vl = new Volume();
vl.repaint();
set_btns();


function on_size() {
	if (!window.Width || !window.Height) return;
	ww = window.Width;
	wh = window.Height;

	// seekbar
	var sk_h = 10;
	var sk_w = Math.max(ww, min_width);
	sk.set_size(0, 0, sk_w, sk_h);


	// area
	var area_y = sk_h;
	var area_h = wh - sk_h;

	// volumebar
	var vl_h = 20;
	var vl_w = 75 + 32;
	var vl_y = area_y + Math.floor(area_h / 2 - vl_h / 2) - 2;
	vl.set_size(ww - vl_w - 10, vl_y, vl_w, vl_h);

	// buttons
	var bw = images.play[0].Width;
	var bw2 = images.stop[0].Width;
	var by = Math.floor(area_h / 2 - bw / 2)  + area_y - 2;
	var by2 = Math.floor(area_h / 2 - bw2 / 2) + area_y - 2;
	var bx = 5;
	var p = 2;
	g_btns[0].set_xy(bx, by);
	g_btns[1].set_xy(bx + bw + p, by2);
	g_btns[2].set_xy(bx + (bw + p) * 2, by2);
	g_btns[3].set_xy(bx + (bw + p) * 3, by2);
};

function on_paint(gr) {
	//bg
	gr.FillSolidRect(0, 0, ww, wh, RGB(247, 247, 247));
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

function on_mouse_lbtn_up(x, y, mask) {
	sk.on_mouse("up", x, y, mask);
	vl.on_mouse("up", x, y, mask);
	// buttons
	for (var i = 0; i < btn_length; i++) {
		if (g_btns[i].check_state("up", x, y) == 1)
			g_btns[i].on_click();
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
	};
};

function on_playback_starting() {
	sk.repaint();
};

function on_volume_change(val) {
	vl.repaint();
};


function get_colors() {
	g_colors.bg_panel = RGB(247, 247, 247);
	g_colors.bg_slider_normal = RGB(220, 220, 220);
	g_colors.bg_slider_active = RGB(25, 25, 25);
};

function get_fonts() {
};



function get_images() {

	var fontGuifx = gdi.Font("Guifx v2 Transports", 15, 0);
	var fontGuifx2 = gdi.Font("Guifx v2 Transports", 15, 0);
	var fontGuifx3 = gdi.Font("Guifx v2 Transports", 13, 0);
	var w = 28;
	var w2 = 28;
	var color_normal, color_hover, color_down, color;
	var s, img_arr, img, font;
	var sf = StringFormat(1, 1);

	color_normal = RGB(25, 25, 25);
	color_hover = RGB(120, 120, 120);
	color_down = RGB(100, 100, 100);

	// play
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx2;
		if (s == 1) {color = color_hover};
		if (s == 2) {
			color = color_down;
			font = fontGuifx2;
		};
		img = gdi.CreateImage(w2, w2);
		g = img.GetGraphics();
		g.SetTextRenderingHint(5);

		g.FillSolidRect(1, 0, w2, w2, g_colors.bg_panel);
		g.DrawString("1", font, color, 0, 0, w2, w2, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.play = img_arr;

	// pause
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx2;
		(s == 1) && (color = color_hover);
		if (s == 2) {
			color = color_down;
			font = fontGuifx2;
		};
		img = gdi.CreateImage(w2, w2);
		g = img.GetGraphics();
		g.SetTextRenderingHint(5);

		g.FillSolidRect(0, 0, w2, w2, g_colors.bg_panel);
		g.DrawString("2", font, color, 0, 0, w2, w2, sf);
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
		g.SetTextRenderingHint(5);

		g.FillSolidRect(0, 0, w, w, g_colors.bg_panel);
		g.DrawString("3", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.stop = img_arr;

	// prev
	img_arr = [];
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
		g.SetTextRenderingHint(5);

		g.FillSolidRect(0, 0, w, w, g_colors.bg_panel);
		g.DrawString("5", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.prev = img_arr;

	// next
	img_arr = [];
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
		g.SetTextRenderingHint(5);

		g.FillSolidRect(0, 0, w, w, g_colors.bg_panel);
		g.DrawString("6", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.next = img_arr;

	// add
	img_arr = [];
	for (s = 0; s < 3; s++) {
		color = color_normal;
		font = fontGuifx;
		if (s == 1) { color = color_hover; }
		if (s == 2) { 
			color = color_down; 
			font = fontGuifx2;
		}
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(5);

		g.FillSolidRect(0, 0, w, w, g_colors.bg_panel);
		g.DrawString("'", font, color, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.add = img_arr;
};


function set_btns() {
	g_btns = [];
	// playback control
	g_btns[0] = new Button(images.prev, function() {fb.Prev()});
	g_btns[1] = new Button(images.play, function() {fb.PlayOrPause()});
	g_btns[2] = new Button(images.next, function() {fb.Next()});
	g_btns[3] = new Button(images.add, function() {});




	btn_length = g_btns.length;
};

