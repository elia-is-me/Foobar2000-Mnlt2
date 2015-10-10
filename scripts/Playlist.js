// simple playlist
// update:2015/10/10 

Playlist = function() {
	this.margin = prop.margin;
	this.handles = null;
	this.row_height = prop.row_height;
	this.total;
	this.groups = [];
	this.items = []; 
	this.scrb_right = this.margin;
	this.scrb_width = prop.scrb_width;
	this.show_scrb = true;
	this.need_scrb;
	this.scrb = new Scroll(true, this);

	this.start_id = 0;
	this.min_grp_items = prop.grp_min_rows;

	this.extra_grp_items = prop.grp_extra_rows;
	this.items_to_add;

	this.list_offsets = [];

	this.repaint = function () {
		window.Repaint();
	};

	this.update_all_start_id = function() {
		this.start_id_arr = [];
		var start_id = [];
		var s = window.GetProperty("sys.List start id", "");
		s.indexOf(",") != -1 ? start_id = s.split(",") : start_id[0] = Math.max(0, s);
		
		for (var i = 0; i < fb.PlaylistCount; i++) {
			this.start_id_arr[i] = (start_id[i] == undefined ? 0 : (isNaN(start_id[i]) ? 0 : Math.max(0, start_id[i])));
		};

		this.start_id = this.start_id_arr[fb.ActivePlaylist];
		window.SetProperty("sys.List start id", this.start_id_arr.toString());
	};

	this.check_start_id = function() {
		var rt = true;
		if (this.start_id + this.total_rows > this.total) {
			this.start_id = this.total - this.total_rows;
			rt = false;
		};
		if (this.start_id < 0) {
			this.start_id  = 0;
			rt = false;
		};
		return rt;
	};

	this.set_size = function(resize, x, y, w, h) {
		if (resize) {
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
		};
		//
		this.list_x = this.x + this.margin;
		this.list_y = this.y + this.margin;
		this.list_w = this.w - this.margin * 2;
		this.list_h = this.h - this.margin * 2;
		this.total_rows = Math.floor(this.list_h / this.row_height);
		this.visible_rows = Math.max(0, Math.min(this.total_rows, this.total));
		this.check_start_id();
		//
		this.need_scrb = this.total > this.total_rows;
		if (this.need_scrb && this.show_scrb) {
			this.list_w = this.list_w - this.scrb_width - this.scrb_right;
			this.scrb.set_size(this.list_x + this.list_w + this.scrb_right, this.list_y, this.scrb_width, this.list_h);
		};
	};


	this.update_list = function() {
		var current, previous;
		var metadb;
		var grp_tf = prop.grp_format;
		var show_grp_header = prop.show_grp_header;
		var grp_header_rows = prop.grp_header_rows;
		var grp_item_count;
		var item_id = 0, grp_id = 0;
		var list_item_id = 0, grp_list_item_id = 0;
		var end;

		this.handles = plman.GetPlaylistItems(fb.ActivePlaylist);
		end = this.handles.Count;
		this.groups = [];
		this.items = [];

		// parse starting >>> 
		// i: list_index
		for (var i = 0; i < end; i++) {
			metadb = this.handles.Item(i);
			current = $(grp_tf, metadb);
			if (current !== previous) {
				grp_odd_count = 0;
				// add group
				this.groups[grp_id] = {};
				this.groups[grp_id].metadb = metadb;
				this.groups[grp_id].first = i;

				// prev-grp: add empty row items, type -1
				if (grp_id > 0) {
					this.groups[grp_id - 1].last = i - 1;
					grp_item_count = this.groups[grp_id - 1].last - this.groups[grp_id - 1].first + 1;

					if (grp_item_count < this.min_grp_items) {
						this.items_to_add = this.min_grp_items - grp_item_count;
						for (var k = 0; k < this.items_to_add; k++) {
							this.items[item_id] = {};
							this.items[item_id].type = -1;
							this.items[item_id].is_odd = (show_grp_header ? grp_list_item_id : list_item_id) % 2;
							item_id++;
							list_item_id++;
							grp_list_item_id++;
						};
					};

					for (var k = 0; k < this.extra_grp_items; k++) {
						this.items[item_id] = {};
						this.items[item_id].type = -2;
						item_id++;
					};

					grp_list_item_id = 0;

				};

				// curr-grp: add grp-header items, type k+1
				if (show_grp_header) {
					for (var k = 0; k < grp_header_rows; k++) {
						this.items[item_id] = {};
						this.items[item_id].metadb = metadb;
						this.items[item_id].type = k + 1;
						this.items[item_id].grp_id = grp_id;
						item_id++;
					};
				};

				grp_id++;
				previous = current;
			};

			// curr-grp: add track items, type 0
			this.items[item_id] = {};
			this.items[item_id].metadb = metadb;
			this.items[item_id].list_id = i;
			this.items[item_id].type = 0;
			this.items[item_id].is_odd = (show_grp_header ? grp_list_item_id : list_item_id) % 2;
			item_id++;
			list_item_id++;
			grp_list_item_id++;
		};

		if (grp_id > 0) {

			this.groups[grp_id - 1].last = i - 1;
			grp_item_count = this.groups[grp_id - 1].last - this.groups[grp_id - 1].first + 1;

			if (grp_item_count < this.min_grp_items) {
				this.items_to_add = this.min_grp_items - grp_item_count;
				for (var k = 0; k < this.items_to_add; k++) {
					this.items[item_id] = {};
					this.items[item_id].type = -1;
					this.items[item_id].is_odd = (show_grp_header ? grp_list_item_id : list_item_id) % 2;
					item_id++;
				};
			}

			for (var k = 0; k < this.extra_grp_items; k++) {
				this.items[item_id] = {};
				this.items[item_id].type = -2;
				item_id++;
			};

			grp_list_item_id = 0;

		};

		// parse ended <<<
		this.total = this.items.length;

		this.set_size(resize = false);

		this.update_all_start_id();
		this.scrb.update_cursor();

		this.repaint();

	};
	this.update_list();


	this.draw = function(gr) {
		var grp_id, grp_id_saved = -1;
		var grp_header_rows = prop.grp_header_rows;
		var grp_y, grp_h;
		var rx, ry, rw, rh;
		var item, item_id = 0;
		var playing_id, selected_id, focus_id;
		var is_playing, is_selected, is_focused;
		var metadb;
		var light_bg = Luminance(g_colors.bg_normal) > 0.6;
		var odd_color, even_color;

		if (light_bg) { 
			even_color = RGBA(255, 255, 255, 5);
			odd_color = RGBA(0, 0, 0, 5);
		} else {
			even_color = RGBA(0, 0, 0, 5);
			odd_color = RGBA(255, 255, 255, 5);
		};


		if (this.total > 0) { // draw list items

			rx = this.list_x;
			rw = this.list_w;

			for (var i = 0; i < this.visible_rows; i++) {

				ry = this.list_y + i * this.row_height;
				rh = this.row_height;

				item_id = this.start_id + i;
				item = this.items[item_id];
				if (item.type > -1)
					metadb = item.metadb;

				// draw group header
				if (item.type > 0) {
					grp_id = item.grp_id;
					if (grp_id !== grp_id_saved) {
						//================
						// draw grp header
						//================
						grp_y = (i == 0) && item.type > 1 ? ry - (item.type - 1) * rh : ry;
						grp_h = grp_header_rows * rh;

						// bg
						gr.FillSolidRect(rx, grp_y, rw, grp_h - 1, 0x15000000);

						if (grp_h > 59) {
							var delta = grp_h - 88;
							if (delta > 0) delta = 0;
							if (delta < -10) delta = -10;
							var delta2 = 58 + delta;
							// cover art
							var cover_margin = 8;
							var cx = rx + cover_margin;
							var cy = grp_y + cover_margin;
							var cw = grp_h - cover_margin * 2;
							gr.FillSolidRect(cx, cy, cw, cw, g_colors.txt_normal & 0x15ffffff);

							var p = 10;
							var color_l1 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.3);
							// date
							var date = $("$year($replace(%date%,/,-))", metadb);
							var date_w = GetTextWidth(date, g_fonts.header1);
							var date_x = rx + rw - date_w - p;
							var date_y = grp_y + (grp_h - delta2) / 2;
							gr.GdiDrawText(date, g_fonts.header1, color_l1, date_x, date_y, date_w, grp_h, dt_lt);
							//var date_y = grp_y + 15;
							//gr.GdiDrawText(date, g_fonts.header1, color_l1, date_x, date_y, date_w, grp_h, dt_lt);
							// artist
							var artist = $("%album artist%", metadb);
							var artist_x = cx + cw + p;
							var artist_w = date_x - artist_x - p;
							var artist_y = date_y;
							gr.GdiDrawText(artist, g_fonts.header1, color_l1, artist_x, artist_y, artist_w, grp_h, dt_lt);
							// genre
							var genre = $("$if2(%genre%,Other)", metadb);
							var genre_w = GetTextWidth(genre, g_fonts.header2);
							var genre_x = rx + rw - genre_w - p;
							var genre_y = date_y + 30 + delta;
							gr.GdiDrawText(genre, g_fonts.header2, g_colors.txt_normal, genre_x, genre_y, genre_w, grp_h, dt_lt);
							// album
							var album = $("%album%", metadb);
							var album_x = artist_x + 20;
							var album_w = genre_x - album_x - p;
							gr.GdiDrawText(album, g_fonts.header2, g_colors.txt_normal, album_x, genre_y, album_w, grp_h, dt_lt);
						} else { 
							if (grp_h > 35){
								font = g_fonts.header1;
							} else {
								font = g_fonts.header3;
							}
							var p = 5;
							var grp_info1 = $("$year($replace(%date%,/,-))", metadb);
							var grp_info1_w = GetTextWidth(grp_info1, font);
							var grp_info1_x = rx + rw - grp_info1_w - p;
							var grp_info2 = $("[%album artist% - ][%album%][(%discnumber%)]", metadb);
							var grp_info2_x = rx + p;
							var grp_info2_w = grp_info1_x - grp_info2_x - p;
							var color = g_colors.highlight;
							gr.GdiDrawText(grp_info1, font, color, grp_info1_x, grp_y - 1, grp_info1_w, grp_h, dt_lc);
							gr.GdiDrawText(grp_info2, font, color, grp_info2_x, grp_y - 1, grp_info2_w, grp_h, dt_lc);

							var grp_info2_tw = GetTextWidth(grp_info2, font);
							var line_x1 = grp_info2_x + grp_info2_tw + p;
							var line_x2 = grp_info1_x - p;
							if (line_x2 > line_x1) {
								var line_y = grp_y + grp_h / 2  - 1;
								gr.DrawLine(line_x1, line_y, line_x2, line_y, 1, color);
							};

						};

						//
						grp_id_saved = grp_id;
					};
				} else if (item.type == 0){
					//=================
					// draw track items
					//=================

					is_focused = false;
					is_selected = false;
					is_playing = false;
				
					if (plman.IsPlaylistItemSelected(fb.ActivePlaylist, item.list_id)) is_selected = true;
					if (fb.IsPlaying && fb.PlayingPlaylist == fb.ActivePlaylist &&
							plman.GetPlayingItemLocation().PlaylistItemIndex == item.list_id) {
								is_playing = true;
							};
					if (plman.GetPlaylistFocusItemIndex(fb.ActivePlaylist) == item.list_id) is_focused = true;

					if (prop.enable_odd_even) {
						if (item.is_odd) gr.FillSolidRect(rx, ry+1, rw, rh-1, odd_color);
						else gr.FillSolidRect(rx, ry+1, rw, rh-1, even_color);
					};

					if (is_focused) {
						gr.DrawRect(rx, ry, rw - 1, rh - 1, 1, g_colors.bg_selected);
					};

					var font_color = g_colors.txt_normal;
					if (is_selected) {
						font_color = g_colors.txt_selected;
						gr.FillSolidRect(rx, ry, rw, rh, g_colors.bg_selected & 0x55ffffff);
					};
					if (is_playing) {
						font_color = g_colors.highlight;
					};

					var p = 5;
					// track number
					var tn = $("%tracknumber%", metadb);
					var tn_x = rx + p;
					var tn_w = 40;
					gr.GdiDrawText(tn, g_fonts.item, g_colors.txt_normal, tn_x, ry, tn_w, rh, dt_cc);
					// length
					var trk_length = $("%length%", metadb);
					var trk_length_x = rx + rw - 50 - p;
					var trk_length_w = 50;
					gr.GdiDrawText(trk_length, g_fonts.item, font_color, trk_length_x, ry, trk_length_w, rh, dt_rc);
					// list_index
					var list_index = item.list_id;
					var list_index_w = 30;
					var list_index_x = trk_length_x - list_index_w - p;
					gr.GdiDrawText(list_index, g_fonts.item, blendColors(g_colors.txt_normal, g_colors.highlight, 0.5), list_index_x, ry, list_index_w, rh, dt_cc);
					// title
					var title = $("%title%", metadb);
					var title_x = tn_x + tn_w + p;
					var title_w = list_index_x - title_x - p;
					gr.GdiDrawText(title, g_fonts.item, font_color, title_x, ry, title_w, rh, dt_lc);
			
				} else if (item.type == -1) {
					//gr.FillSolidRect(this.list_x, ry, this.list_w, rh, 0xffe6cfb0);
					if (prop.enable_odd_even) {
						if (item.is_odd) gr.FillSolidRect(rx, ry+1, rw, rh-1, odd_color)
						else gr.FillSolidRect(rx, ry+1, rw, rh-1, even_color);
					};
				};

			} // eol;
		} else {
		   // draw no track info	
		};

		if (this.need_scrb && this.show_scrb) this.scrb.draw(gr);

		gr.FillSolidRect(this.list_x, 0, this.list_w, this.y + this.margin, g_colors.bg_normal);
		gr.FillSolidRect(this.list_x, this.list_y + this.list_h, this.list_w, wh - this.list_y - this.list_h, g_colors.bg_normal);
	};

	this.is_hover_list = function(x, y) {
		return (x > this.list_x &&
				x < this.list_x + this.list_w &&
				y > this.list_y && y <this.list_y + this.list_h);
	};


	this.collapse_all = function(bool) {
	};

	this.select_a_to_b = function(a, b) {
		var selected_indexes = [];
		var first_id = last_id = 0;
		if (a > b) {
			first_id = b;
			last_id = a;
		} else {
			first_id = a;
			last_id = b;
		};

		for (var i = a; i <= b; i++) {
			selected_indexes.push(i);
		};

		plman.ClearPlaylistSelection(fb.ActivePlaylist);
		plman.SetPlaylistSelection(fb.ActivePlaylist, selected_indexes, true);
	};

	this.select_group_tracks = function(grp_id) {
		var selected_items = [];
		var end = this.groups[grp_id].last;
		var start = this.groups[grp_id].first;
		for (var i = start; i <= end; i++) {
			selected_items.push(i);
		}
		plman.SetPlaylistSelection(fb.ActivePlaylist, selected_items, true);
	};

	this.on_mouse = function(event, x, y, mask) {
		var shift_pressed = utils.IsKeyPressed(VK_SHIFT);
		var ctrl_pressed = utils.IsKeyPressed(VK_CONTROL);

		this.is_hover_area = this.is_hover_list(x, y);
		this.is_hover_scrb = this.scrb.is_hover_object(x, y);

		this.hover_item_id = -1;
		if (this.is_hover_area) {
			this.hover_item_id = Math.floor((y - this.list_y) / this.row_height) + this.start_id;
			if (this.hover_item_id < 0 || this.hover_item_id > this.total) {
				this.hover_item_id = -1;
			};
		};

		switch (event) {
			case "down":

				if (this.is_hover_scrb) {
					this.scrb.on_mouse("down", x, y, mask);
				};

				break;
			case "dblclk":
				if (this.is_hover_scrb) {
					this.scrb.on_mouse("down", x, y);
				};
				break;
			case "move":
				this.scrb.on_mouse("move", x, y);
				break;
			case "up":
				this.scrb.on_mouse("up", x, y);
				break;
			case "right":
				break;
			case "leave":
				break;
			case "wheel":
				var delta = prop.scroll_step;
				if (shift_pressed) delta = this.total_rows;
				if (ctrl_pressed) delta = 1;
				this.scrb.on_mouse("wheel", 0, 0, mask * delta);
				break;
		};
	};

};


Scroll = function(vertical, parent) {
	this.parent = parent;
	this.vertical = vertical;
	this.cursor_clicked = false;
	this.cursor_hovered = false;
	this.cursor_h_min = 25;

	this.set_size = function(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.update_cursor();
	};

	this.update_cursor = function() {
		this.cursor_h = this.parent.total_rows / this.parent.total * this.h;
		this.cursor_y = this.parent.start_id / this.parent.total * this.h + this.y;
		if (this.cursor_h < this.cursor_h_min) {
			this.cursor_h = this.cursor_h_min;
			this.cursor_y = this.parent.start_id / this.parent.total * (this.h - this.cursor_h) + this.y;
		};
	};

	this.is_hover_object = function(x, y) {
		return (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h);
	};

	this.draw = function(gr) {
		if (this.h < this.cursor_h_min) return;
		var cursor_color;
	
		// bg
		gr.FillSolidRect(this.x, this.y, this.w, this.h, g_colors.txt_normal & 0x10ffffff);
		// cursor
		var cursor_color = g_colors.txt_normal & 0x33ffffff;
		if (this.cursor_clicked) {
			cursor_color = g_colors.txt_normal & 0x99ffffff;
		} else if (this.cursor_hovered) {
			cursor_color = g_colors.txt_normal & 0x55ffffff;
		}

		gr.FillSolidRect(this.x+1, this.cursor_y, this.w-2, this.cursor_h, cursor_color);
	};

	this.on_mouse = function(event, x, y, mask) {

		this.hovered = this.is_hover_object(x, y);
		this.cursor_hovered = this.hovered && (y > this.cursor_y && y < this.cursor_y + this.cursor_h);

		switch (event) {
			case "move":
				if (this.cursor_hovered != this.cursor_hovered_saved) {
					this.cursor_hovered_saved = this.cursor_hovered;
					this.parent.repaint();
				};
				if (this.cursor_clicked) {
					// scroll to new place
					this.cursor_y = y - this.cursor_clicked_delta;
					if (this.cursor_y < this.y) {
						this.cursor_y = this.y;
					}
					if (this.cursor_y + this.cursor_h > this.y + this.h) {
						this.cursor_y = this.y + this.h - this.cursor_h;
					}
					this.parent.start_id = Math.floor((this.cursor_y - this.y) * this.parent.total / this.parent.h);
					this.parent.check_start_id();
					this.parent.repaint();
				};
				break;
			case "down":
				if (this.hovered) {
					if (y < this.cursor_y) {
						this.scroll(3) && this.parent.repaint();
					};
					if (this.cursor_hovered) {
						this.cursor_clicked = true;
						this.cursor_clicked_delta = y - this.cursor_y;
						this.parent.repaint();
					};
					if (y > this.cursor_y + this.cursor_h) {
						this.scroll(-3) && this.parent.repaint();
					};
				};
				break;
			case "up":
				if (this.cursor_clicked) {
					this.cursor_clicked = false;
					this.parent.repaint();
				};
				break;
			case "wheel":
				if (this.parent.total > this.parent.total_rows) {
					this.scroll(mask) && this.parent.repaint();
				};
				break;
		};
	};

	this.scroll = function(delta) {
		var start_id_saved = this.start_id;
		this.parent.start_id -= delta;
		this.parent.check_start_id();
		this.update_cursor();
		if (this.start_id == start_id_saved) {
			return true;
		};
		return false;
	};
};




prop = new function() {
	this.use_sys_color = window.GetProperty("_prop_color: Use sys color", false);
	this.colorscheme = window.GetProperty("_prop_color: Colorscheme(light, dark, user)", "dark");
	this.font_name = window.GetProperty("_prop_font: Default font name", "Segoe UI");
	this.grp_format = window.GetProperty("_prop_grp: Group format", "%album artist% | %album% | %discnumber%");
	this.grp_header_rows = window.GetProperty("_prop_grp: Group header rows", 4);
	this.grp_min_rows = window.GetProperty("_prop_grp: Min group rows", 0);
	this.grp_extra_rows = window.GetProperty("_prop_grp: Extra group rows", 0);
	this.show_grp_header = window.GetProperty("_prop_grp: Show group header", true);
	this.row_height = window.GetProperty("_prop: Row height", 22);
	this.margin = window.GetProperty("_prop: margin", 15);
	this.scrb_width = 12;
	this.enable_odd_even = window.GetProperty("_prop: Enable odd/even row hightlight", true);
	this.scroll_step = window.GetProperty("_prop: Default scroll step", 3);
	this.auto_collaspe = window.GetProperty("_prop: Auto collapse", false);

}();


g_colors = {};
g_fonts = {}
images = {};

colorscheme = {
	light: {
		txt_normal: RGB(70, 70, 70),
		txt_selected: RGB(0, 0, 0), 
		bg_normal: RGB(245, 245, 245),
		bg_selected: RGB(120, 120, 120),
		highlight: RGB(215, 65, 100)
	},
	dark: {
		txt_normal: RGB(190, 190, 190),
		txt_selected: RGB(255, 255, 255), 
		bg_normal: RGB(76, 76, 76),
		bg_selected: RGB(140, 140, 140),
		highlight: RGB(255, 142, 196)
	},
	user: {
		txt_normal: eval(window.GetProperty("colorscheme: text normal", "RGB(70, 70, 70)")),
		txt_selected: eval(window.GetProperty("colorscheme: text selected", "RGB(0, 0, 0)")),
		bg_normal: eval(window.GetProperty("colorscheme: background normal", "RGB(245, 245, 245)")),
		bg_selected: eval(window.GetProperty("colorscheme: background selected", "RGB(110, 110, 110)")),
		highlight: eval(window.GetProperty("colorscheme: highlight", "RGB(215, 65, 100)"))
	}
};


///////////////
var dt_cc = DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var dt_lc = DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var dt_rc = DT_RIGHT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var dt_lt = DT_LEFT | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var ww, wh;
var repaint_main = true, repaint_main1 = true, repaint_main2 = true;
var repaint_cover = true, repaint_cover1 = true, repaint_cover2 = true;
var window_visible = false;
var repaint_forced = false;
var repaint_counter = 0;

var plst = new Playlist();

get_fonts();
get_colors();

function on_size() {
	ww = window.Width;
	wh = window.Height;
	plst.set_size(resize = true, 0, 0, ww, wh);
};

function on_paint(gr) {
	gr.FillSolidRect(0, 0, ww, wh, g_colors.bg_normal);
	plst.draw(gr);
};


///// mouse event callbacks

function on_mouse_move(x, y, mask) {
	plst.on_mouse("move", x, y, mask);
};

function on_mouse_lbtn_down(x, y, mask) {
	plst.on_mouse("down", x, y, mask);
};

function on_mouse_lbtn_dblclk(x, y, mask) {
	plst.on_mouse("dblclk", x, y, mask);
};

function on_mouse_lbtn_up(x, y, mask) {
	plst.on_mouse("up", x, y, mask);
};

function on_mouse_rbtn_up(x, y, mask) {
	plst.on_mouse("right", x, y, mask);
};

function on_mouse_wheel(delta) {
	plst.on_mouse("wheel", 0, 0, delta);
};


//// playlist callbacsk

function on_playlists_changed() {
	if (fb.ActivePlaylist > fb.PlaylistCount - 1) {
		fb.ActivePlaylist = fb.PlaylistCount - 1;
	};
	if (fb.ActivePlaylist < 0) {
		fb.ActivePlaylist = 0;
	};
};


function on_playlist_switch() {
	plst.update_list();
};

function on_playlist_items_reordered(playlist) {
	if (playlist !== fb.ActivePlaylist) return;
	plst.update_list();
};

function on_playlist_items_removed(playlist) {
	if (playlist !== fb.ActivePlaylist) return;
	plst.update_list();
};

function on_playlist_items_added(playlist) {
	if (playlist !== fb.ActivePlaylist) return;
};

function on_playlist_items_selection_change() {
	plst.repaint();
};


//// misc

function on_script_unload() {
	plst.update_all_start_id();
};


function on_colors_changed() {
	get_colors();
	window.Repaint();
};

function get_fonts() {
	g_fonts.name = "Segoe UI";
	g_fonts.item = gdi.Font(g_fonts.name, 12);
	g_fonts.header1 = gdi.Font(g_fonts.name, 18, 1);
	g_fonts.header2 = gdi.Font(g_fonts.name, 16, 0);
	g_fonts.header3 = gdi.Font(g_fonts.name, 14, 0);
};

function get_colors() {
	g_colors = colorscheme[prop.colorscheme];
	if (prop.use_sys_color) {
		if (window.InstanceType == 1) {
			g_colors.txt_normal = window.GetColorDUI(ColorTypeDUI.text);
			g_colors.bg_normal = window.GetColorDUI(ColorTypeDUI.background);
			g_colors.bg_selected = window.GetColorDUI(ColorTypeDUI.selection);
			g_colors.highlight = window.GetColorDUI(ColorTypeDUI.highlight);
			var c = combineColors(g_colors.bg_normal, g_colors.bg_selected & 0x39ffffff);
			g_colors.txt_selected = (Luminance(c) > 0.6 ? 0xff000000 : 0xffffffff);
		} else { try {
			g_colors.txt_normal = window.GetColorCUI(ColorTypeCUI.text);
			g_colors.txt_selected = window.GetColorCUI(ColorTypeCUI.selection_text);
			g_colors.bg_normal = window.GetColorCUI(ColorTypeCUI.background);
			g_colors.bg_selected = window.GetColorCUI(ColorTypeCUI.selection_background);
			g_colors.highlight = window.GetColorCUI(ColorTypeCUI.active_item_frame);
		} catch (e) {} };
	}
};

