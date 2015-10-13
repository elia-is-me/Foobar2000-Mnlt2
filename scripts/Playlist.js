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

	this.playing_item_visible = false;

	this.repaint = function () {
		window.Repaint();
	};

	this.start_item_indexes = [];

	this.get_start_id = function() {
		this.start_arr = [];
		var start_id = [];
		var s = window.GetProperty("sys.List start id", "");
		if (s.indexOf(",") != -1) {
			start_id = s.split(",");
		} else {
			start_id[0] = Math.max(0, s);
		};

		for (var i = 0; i < fb.PlaylistCount; i++) {
			this.start_arr[i] = (start_id[i] == undefined ? 0 : (isNaN(start_id[i]) ? 0 : Math.max(0, start_id[i])));
		};

		this.start_id = this.start_arr[g_active_playlist];
		this.check_start_id();
		window.SetProperty("sys.List start id", this.start_arr.toString());
	};

	this.save_start_id = function() {
		this.start_arr[g_active_playlist] = this.start_id;
		window.SetProperty("sys.List start id", this.start_arr.toString());
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
		//
	};

	this.collapse_group = function(grp_id) {
		if (!this.groups[grp_id]) return;
		if (this.groups[grp_id].collapsed) return;
		for (var i = 0; i < this.total; i++) {
			if (this.items[i].type > 0 && this.items[i].grp_id == grp_id) {
				var prev = this.items.slice(0, i + prop.grp_header_rows);
				this.items = this.items.slice(i + prop.grp_header_rows + this.groups[grp_id].last - this.groups[grp_id].first + 1, this.items.length);
				this.items = prev.concat(this.items);
				prev = null;
				break;
			};
		};
		this.groups[grp_id].collapsed = true;
		this.total = this.items.length;
		this.set_size(resize = false);
	};

	this.expand_group = function (grp_id) {
		if (!this.groups[grp_id]) {
			console("expand group: invalid group index " + grp_id);
		   	return;
		}
		if (!this.groups[grp_id].collapsed){
			console("expand group: group expanded " + grp_id);
		   	return;
		};
		for (var i = 0; i < this.total; i++) {
			if (this.items[i].type > 0 && this.items[i].grp_id == grp_id) {
				console("expanding...");
				console("group id is: " + grp_id);
				var after = this.items.slice(i+prop.grp_header_rows, this.items.length);
				this.items = this.items.splice(0, i+prop.grp_header_rows);
				var is_odd = true;
				var item_id = i + prop.grp_header_rows;
				for (var j = this.groups[grp_id].first; j <= this.groups[grp_id].last; j++) {
					this.items[item_id] = {};
					this.items[item_id].type = 0;
					this.items[item_id].list_id = j;
					this.items[item_id].grp_id = grp_id;
					this.items[item_id].metadb = this.handles.Item(j);
					this.items[item_id].is_odd = is_odd;
					is_odd = !is_odd;
					item_id++;
				};
				this.items = this.items.concat(after);
				after = null;
				break;
			};
		};
		this.groups[grp_id].collapsed = false;
		this.total = this.items.length;
		this.set_size(resize = false);
	};


	this.update_list = function(coll) {
		var current, previous;
		var metadb;
		var grp_tf = prop.grp_format;
		var show_grp_header = prop.show_grp_header;
		var grp_header_rows = prop.grp_header_rows;
		var grp_item_count;
		var item_id = 0, grp_id = 0;
		var list_item_id = 0, grp_list_item_id = 0;
		var end;

		this.handles = plman.GetPlaylistItems(g_active_playlist);
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
				this.groups[grp_id].collapsed = prop.auto_collaspe;

				// prev-grp: add empty row items, type -1
				if (grp_id > 0) {
					this.groups[grp_id - 1].last = i - 1;
					grp_item_count = this.groups[grp_id - 1].last - this.groups[grp_id - 1].first + 1;

					if (!this.groups[grp_id - 1].collapsed) {

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
			if (!this.groups[grp_id - 1].collapsed) {
				this.items[item_id] = {};
				this.items[item_id].metadb = metadb;
				this.items[item_id].list_id = i;
				this.items[item_id].grp_id = grp_id;
				this.items[item_id].type = 0;
				this.items[item_id].is_odd = (show_grp_header ? grp_list_item_id : list_item_id) % 2;
				item_id++;
				list_item_id++;
				grp_list_item_id++;
			};
		};

		if (grp_id > 0) {

			this.groups[grp_id - 1].last = i - 1;
			grp_item_count = this.groups[grp_id - 1].last - this.groups[grp_id - 1].first + 1;

			if (!this.groups[grp_id - 1].collapsed) {

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

		};

		// parse ended <<<
		this.total = this.items.length;
		this.set_size(resize = false);
		this.get_start_id();
		this.scrb.update_cursor();
		this.repaint();
		console("total length: " + this.total);

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
		var bool;

		this.playing_item_visible = false;

		if (light_bg) { 
			even_color = RGBA(255, 255, 255, 5);
			odd_color = RGBA(0, 0, 0, 5);
		} else {
			even_color = RGBA(0, 0, 0, 5);
			odd_color = RGBA(255, 255, 255, 5);
		};

		//console("paint starting >>>");

		if (this.total > 0) { // draw list items

			rx = this.list_x;
			rw = this.list_w;

			for (var i = 0; i < this.visible_rows; i++) {

				ry = this.list_y + i * this.row_height;
				rh = this.row_height;

				item_id = this.start_id + i;
				item = this.items[item_id];
				//console("item id: " + item_id);
				//if (!item) return;
				if (item.type > -1)
					metadb = item.metadb;

				gr.GdiDrawText(item_id, g_fonts.item, 0xff000000, rx - 15, ry, 15, rh, dt_cc);

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

						//if (this.groups[grp_id].is_selected) {
						if (this.is_group_selected(grp_id))
							gr.FillSolidRect(rx, grp_y, rw, grp_h - 1, 0x55ffffff & g_colors.bg_selected);
						//};

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
				
					is_selected = plman.IsPlaylistItemSelected(g_active_playlist, item.list_id);
					is_playing = (fb.PlayingPlaylist == g_active_playlist && plman.GetPlayingItemLocation().PlaylistItemIndex == item.list_id);
					is_focused = plman.GetPlaylistFocusItemIndex(g_active_playlist) == item.list_id;
					if (is_playing) this.playing_item_visible = true;

					if (prop.enable_odd_even) {
						if (item.is_odd) gr.FillSolidRect(rx, ry+1, rw, rh-1, odd_color);
						else gr.FillSolidRect(rx, ry+1, rw, rh-1, even_color);
					};

					if (is_focused) {
						gr.DrawRect(rx, ry-1, rw - 1, rh - 1, 1, g_colors.bg_selected);
					};

					var font_color = g_colors.txt_normal;
					if (is_selected) {
						font_color = g_colors.txt_selected;
						gr.FillSolidRect(rx, ry-1, rw, rh, g_colors.bg_selected & 0x55ffffff);
					};
					if (is_playing) {
						font_color = g_colors.highlight;
					};

					var p = 5;
					// track number
					var tn = $("[%discnumber%.]%tracknumber%", metadb);
					var tn_x = rx + p * 4;
					var tn_w = 30;
					gr.GdiDrawText(tn, g_fonts.item, g_colors.txt_normal, tn_x, ry, tn_w, rh, dt_rc);

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
					var title_x = tn_x + tn_w + p * 2;
					var title_w = list_index_x - title_x - p;
					gr.GdiDrawText(title, g_fonts.item, font_color, title_x, ry, title_w, rh, dt_lc);
			
				} else if (item.type == -1) {
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

		for (var i = first_id; i <= last_id; i++) {
			selected_indexes.push(i);
		};

		plman.ClearPlaylistSelection(g_active_playlist);
		plman.SetPlaylistSelection(g_active_playlist, selected_indexes, true);
	};

	this.select_group_tracks = function(grp_id) {
		var selected_indexes = [];
		var end = this.groups[grp_id].last;
		var start = this.groups[grp_id].first;
		for (var i = start; i <= end; i++) {
			selected_indexes.push(i);
		}
		plman.SetPlaylistSelection(g_active_playlist, selected_indexes, true);
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

		this.hover_item = null;
		if (this.hover_item_id > -1) {
			this.hover_item = this.items[this.hover_item_id];
		};


		if (plman.GetPlaylistSelectedItems(list_id).Count <= 0) {
//			this.SHIFT_start_id = -1;
		};

		switch (event) {
			case "down":
				//if (!this.items.length) return;

				if (this.is_hover_scrb) {
					// scrollbar event handler
					this.scrb.on_mouse("down", x, y, mask);

				} else {
					if (this.double_clicked) return;
					if (this.hover_item == null) {
						//if (shift_pressed) {
						//} else if (ctrl_pressed) {
						//} else {
						if (!shift_pressed && !ctrl_pressed) {
							plman.ClearPlaylistSelection(g_active_playlist);
							this.SHIFT_start_id = -1
						};
						return;
					};

					//
					var item_type = this.hover_item.type;
					this.drag_clicked = true;
					//
					switch(true) {
						case (item_type > 0):
							var grp_id = this.hover_item.grp_id;
							//if (shift_pressed) {
								// do nothing here
							//} else 
								if (ctrl_pressed) {
									this.select_group_tracks(grp_id);
									this.SHIFT_start_id = this.groups[grp_id].first;
								} else {
									plman.ClearPlaylistSelection(g_active_playlist);
									this.select_group_tracks(grp_id);
									this.SHIFT_start_id = this.groups[grp_id].first;
								};
							plman.SetPlaylistFocusItem(g_active_playlist, this.groups[grp_id].first);
							break;
						case (item_type == 0): // clicked on track items
							var list_id = this.hover_item.list_id;
							if (shift_pressed) {
								if (g_focus_id != list_id) {
									if (this.SHIFT_start_id > -1) {
										this.select_a_to_b(this.SHIFT_start_id, list_id);
									} else {
										this.select_a_to_b(g_focus_id, list_id);
									}
								};

								plman.SetPlaylistFocusItem(g_active_playlist, list_id);
							} else if (ctrl_pressed) {
								if (plman.IsPlaylistItemSelected(g_active_playlist, list_id)) {
									plman.SetPlaylistSelectionSingle(g_active_playlist, list_id, false);
								} else {
									plman.SetPlaylistSelectionSingle(g_active_playlist, list_id, true);
									plman.SetPlaylistFocusItem(g_active_playlist, list_id);
								}
								this.SHIFT_start_id = list_id;
							} else {
								plman.ClearPlaylistSelection(g_active_playlist);
								plman.SetPlaylistSelectionSingle(g_active_playlist, list_id, true);
								plman.SetPlaylistFocusItem(g_active_playlist, list_id);
								this.SHIFT_start_id = list_id;
							}
							break;
						case (item_type < 0): // clicked on empty items
							break
					};
					this.repaint();
				};
				break;
			case "dblclk":
				if (this.is_hover_scrb) {
					this.scrb.on_mouse("down", x, y);
				};
				if (this.hover_item) {
					this.double_clicked = true;
					var item_type = this.items[this.hover_item_id].type;
					switch (true) {
						case (item_type > 0):
							var grp_id = this.items[this.hover_item_id].grp_id;
							this.groups[grp_id].collapsed ? this.expand_group(grp_id) : this.collapse_group(grp_id);
							/*
							console(grp_id);
							console(this.groups[grp_id].collapsed);
							if (this.groups[grp_id].collapsed) this.expand_group(grp_id);
							*/

							break;
						case (item_type == 0):
							var list_id = this.items[this.hover_item_id].list_id;
							plman.ExecutePlaylistDefaultAction(g_active_playlist, list_id);
							break;
						default:
							break;
					};
					this.repaint();
				};
				break;
			case "move":
				this.scrb.on_mouse("move", x, y);
				this.save_start_id();
				break;
			case "up":
				this.scrb.on_mouse("up", x, y);
				if (this.double_clicked) {
					this.double_clicked = false;
					return;
				};
				break;
			case "right":
				// up
				if (this.right_clicked) {
					this.right_clicked = false;
					this.context_menu(x, y, g_focus_id);
					return true;
				};
				// down
				if (!this.hover_item) {
					plman.ClearPlaylistSelection(g_active_playlist);
					//this.context_type = -1;
				};
				if (this.hover_item) {
					var item_type = this.items[this.hover_item_id].type;
					switch (true) {
						case (item_type > 0):
							var grp_id = this.items[this.hover_item_id].grp_id;
							if (!this.is_group_selected(grp_id)) {
								plman.ClearPlaylistSelection(g_active_playlist);
								this.select_group_tracks(grp_id);
								plman.SetPlaylistFocusItem(g_active_playlist, this.groups[grp_id].first);
							};
							//this.context_type = 1;
							break;
						case (item_type == 0):
							var list_id = this.items[this.hover_item_id].list_id;
							if (!plman.IsPlaylistItemSelected(g_active_playlist, list_id)) {
								plman.ClearPlaylistSelection(g_active_playlist);
								plman.SetPlaylistSelectionSingle(g_active_playlist, list_id, true);
								plman.SetPlaylistFocusItem(g_active_playlist, list_id);
							};
							//this.context_type = 1;
							break;
						default:
							//this.context_type = 0;
							break;
					};
				};
				this.repaint();
				this.right_clicked = true;
				break;
			case "leave":
				break;
			case "wheel":
				var delta = prop.scroll_step;
				if (shift_pressed) delta = this.total_rows;
				if (ctrl_pressed) delta = 1;
				this.scrb.on_mouse("wheel", 0, 0, mask * delta);
				this.save_start_id();
				break;
		};
	};

	this.is_group_selected = function (grp_id) {
		var grp = this.groups[grp_id];
		for (var i = grp.first; i <= grp.last; i++) {
			if (!plman.IsPlaylistItemSelected(g_active_playlist, i))
				return false;
		};
		return true;
	};

	this.show_now_playing_called = false;
	this.show_now_playing = function () {
		if (!fb.IsPlaying) return;

		this.playing_item = plman.GetPlayingItemLocation();
		if (!this.playing_item.IsValid) {
			console("item invalid...");
		   	return;
		};

		if (g_active_playlist != fb.PlayingPlaylist) {
		   fb.ActivePlaylist = fb.PlayingPlaylist;
		   g_active_playlist = fb.ActivePlaylist;
		   //this.update_list();
		};


		var playing_item_list_id = this.playing_item.PlaylistItemIndex;
		plman.ClearPlaylistSelection(g_active_playlist);
		plman.SetPlaylistSelectionSingle(g_active_playlist, playing_item_list_id, true);
		plman.SetPlaylistFocusItem(g_active_playlist, playing_item_list_id);

		var playing_grp_id = 0;
		console("playing list id: " + playing_item_list_id);
		for (var j = 0; j < this.total; j++) {
			if (this.items[j].type > 0) {
				var grp_id = this.items[j].grp_id;
				//console(grp_id);
				if (this.groups[grp_id].first <= playing_item_list_id && this.groups[grp_id].last >= playing_item_list_id) {
					playing_grp_id = grp_id;
					console("playing group id: " + grp_id);
					this.expand_group(grp_id);
					break;
				}
			};
		};

		// expand playing group

		var delta;
		for (var j = 0; j < this.total; j++) {
			if (this.items[j].type == 0) {
				if (this.items[j].list_id == playing_item_list_id) {
					delta = j - Math.floor(this.total_rows / 2);
					break;
				} else {
					// todo
				}
			}
		};

		this.scrb.on_mouse("wheel", 0, 0, this.start_id - delta);
		this.save_start_id();
		this.repaint();

		if (fb.ActivePlaylist != plman.PlayingPlaylist){ 
			this.show_now_playing_called = true;
			console("show now playing...");
		};

	//	};
	};

	this.context_menu = function(x, y, type) {
		var _menu = window.CreatePopupMenu();
		var Context = fb.CreateContextMenuManager();
		var context_base_id;

		var handles_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
		var has_selection = handles_selection.Count;
		if (has_selection) Context.InitContext(handles_selection);

		if (fb.IsPlaying) {
			_menu.AppendMenuItem(MF_STRING, 1, "Show now playing");
			if (has_selection) _menu.AppendMenuSeparator();
		} 

		if (has_selection) {
			_menu.AppendMenuItem(MF_STRING, 10, "Cut\tCtrl+X");
			_menu.AppendMenuItem(MF_STRING, 11, "Copy\tCtrl+C");
		};
		if (this.handles_in_clipboard_count > 0) {
			_menu.AppendMenuItem(MF_STRING, 12, "Paste\tCtrl+V");
		};


		context_base_id = 1000;
		if (has_selection){ 
			_menu.AppendMenuSeparator();
			Context.BuildMenu(_menu, context_base_id, -1);
		};

		var ret = _menu.TrackPopupMenu(x, y);

		if (has_selection) Context.ExecuteByID(ret - context_base_id);
		switch(ret) {
			case 1:
				this.show_now_playing();
				break;
			case 10:
				this.cut();
				break;
			case 11:
				this.copy();
				break;
			case 12:
				this.paste();
				break;
		};

		_menu.Dispose();
		Context.Dispose();
		return true;
	};

	this.cut = function() {
		this.copy();
		plman.RemovePlaylistSelection(g_active_playlist);
	};

	this.copy = function() {
		this.handles_in_clipboard = plman.GetPlaylistSelectedItems(g_active_playlist);
		this.handles_in_clipboard_count = this.handles_in_clipboard.Count;
		//window.NotifyOthers();
	};

	this.paste = function() {
		if (this.handles_in_clipboard_count) {
			if (plman.GetPlaylistSelectedItems(g_active_playlist).Count > 0) {
				plman.ClearPlaylistSelection(g_active_playlist);
				plman.InsertPlaylistItems(g_active_playlist, g_focus_id, this.handles_in_clipboard, true);
			} else {
				plman.InsertPlaylistItems(g_active_playlist, fb.PlaylistCount, this.handles_in_clipboard, true);
			}
			this.handles_in_clipboard_count = 0;
			this.handles_in_clipboard = null;
		};
		//window.NotifyOthers()
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
	this.grp_format = window.GetProperty("_prop_grp: Group format", "%album artist% | %album%");
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

var g_focus_id = -1;
var g_active_playlist = fb.ActivePlaylist;

var plst = new Playlist();
get_fonts();
get_colors();

window.DlgCode = DLGC_WANTALLKEYS;

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

function on_mouse_rbtn_down(x, y, mask) {
	plst.on_mouse("right", x, y, mask);
};

function on_mouse_rbtn_up(x, y, mask) {
	if (plst.scrb.is_hover_object(x, y)) {
		return true;
	};
	if (mask == VK_SHIFT) return false;
	return plst.on_mouse("right", x, y, mask);
};

function on_mouse_wheel(delta) {
	plst.on_mouse("wheel", 0, 0, delta);
};


//// playlist callbacsk

function on_playlists_changed() {
	if (g_active_playlist > fb.PlaylistCount - 1) {
		g_active_playlist = fb.PlaylistCount - 1;
	};
	if (g_active_playlist < 0) {
		g_active_playlist = 0;
	};
	if (g_active_playlist != fb.ActivePlaylist) {
		g_active_playlist = fb.ActivePlaylist;
		plst.update_list();
	};
};


function on_playlist_switch() {
	g_active_playlist = fb.ActivePlaylist;
	plst.update_list();
	if (fb.ActivePlaylist == plman.PlayingPlaylist) plst.show_now_playing();
	plst.show_now_playing_called = false;
};

function on_playlist_items_reordered(playlist) {
	if (playlist !== g_active_playlist) return;
	plst.update_list();
};

function on_playlist_items_removed(playlist) {
	if (playlist !== g_active_playlist) return;
	plst.update_list();
};

function on_playlist_items_added(playlist) {
	if (playlist !== g_active_playlist) return;
	plst.update_list();
};

function on_playlist_items_selection_change() {
	plst.repaint();
};

function on_item_selection_change() {
	plst.repaint();
};

function on_item_focus_change(playlist, from, to) {
	g_focus_id = to;
	var total_grps = plst.groups.length;
	for (var i = 0; i < total_grps; i++) {
		if (g_focus_id >= plst.groups[i].first && g_focus_id <= plst.groups[i].last) {
			plst.groups[i].is_focused = true;
		}
	};
	plst.repaint();
};


//// playback callbacks

function on_playback_pause(state) {
	if (plst.playing_item_visible) plst.repaint();
};

function on_playback_starting(cmd, is_paused) {
	if (plst.playing_item_visible)  plst.repaint();
};

function on_playback_edited(metadb) {
	plst.repaint();
};

function on_playback_new_track(metadb) {
	plst.repaint();
};

function on_playback_stop(reason) {
	if (reason != 2) {
		plst.repaint();
	};
}

//// misc
function on_metadb_changed(handles, fromhook) {
	plst.repaint();
};

function on_colors_changed() {
	get_colors();
	window.Repaint();
};

function on_font_changed() {
	get_fonts();
	window.Repaint();
};

function get_fonts() {
	g_fonts.name = prop.font_name;
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

