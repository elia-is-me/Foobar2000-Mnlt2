// vim:set ft=javascript et:
// ============================================ //
// @name "Playlist"
// @intro "a simple wsh playlist"
// @update "2015-10-16"
// ============================================ //


// from br3tt's wsh_playlist
ImageCache = function(art_id) {
    this._cache_list = {};
    this.art_id = art_id;
    // art_id: 0: front, 1: back, 2: disc, 3: icon, 4: artist, 5: genre, others...;
    this.hit = function(metadb, grp_id) {

        var img = this._cache_list[plst.groups[grp_id].key];
        if (img) return img;
        if (typeof(img) == "undefined" || img == null) {
            // if image not in cache list, load
            if (!group_art.load_timer) {
                group_art.load_timer = window.SetTimeout(function() {
                    if (img_cache.art_id < 5) {
                        utils.GetAlbumArtAsync(window.ID, metadb, prop.group_art_id, true, false, false);
                        group_art.load_timer && window.ClearTimeout(group_art.load_timer);
                        group_art.load_timer = false;
                    };
                }, 45);
            }
        }
    };

    this.get_it = function(metadb, grp_id, image) {
        var cw = group_art.max_w;
        var ch = cw;
        var img;

        // calc scale
        if (group_art.kar) { // keep aspectratio
            if (!image) {
                var pw = cw;
                var ph = ch;
            } else {
                if (image.Width <= image.Height) {
                    var ratio = image.Width / image.Height;
                    var pw = cw * ratio;
                    var ph = ch;
                } else {
                    var ratio = image.Height / image.Width;
                    var pw = cw;
                    var ph = ch * ratio;
                };
            };
        } else {
            var pw = cw;
            var ph = ch;
        };

        img = format_art(image, pw, ph, false);
        this._cache_list[plst.groups[grp_id].key] = img;
        return img;
    };
};

function format_art(image, w, h, raw_bitmap) {
    if (image) {
        return raw_bitmap ? image.Resize(w, h, 2).CreateRawBitmap() : image.Resize(w, h, 2);
    } else {
        return raw_bitmap ? images.no_cover.Resize(w, h, 2).CreateRawBitmap() : images.no_cover.Resize(w, h, 2);
    };
};

Playlist = function() {
	this.margin = prop.margin;
	this.handles = null;
    //this.handles_selection = plman.GetPlaylistSelectedItems(g_active_playlist);
	this.row_height = prop.row_height;
	this.total;
	this.groups = [];
	this.items = []; 
	this.scrb_right = this.margin;
	this.scrb_width = prop.scrollbar_width;
	this.show_scrb = prop.show_scrollbar;
	this.need_scrb;
	this.scrb = new Scroll(true, this);

	this.start_id = 0;
	this.min_grp_items = prop.group_minimum_rows;

	this.extra_grp_items = prop.group_extra_rows;
	this.items_to_add;
	this.playing_item_visible = false;

	this.repaint = function () {
		window.Repaint();
	};

	this.get_start_id = function() {
		this.start_arr = [];
		var start_id = [];
		var s = window.GetProperty("sys.List start id", "");
		if (s.indexOf(",") != -1) {
			start_id = s.split(",");
		} else {
			start_id[0] = Math.max(0, s);
		};

		for (var i = 0; i < plman.PlaylistCount; i++) {
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
				var prev = this.items.slice(0, i + prop.group_header_rows);
                var grp_items_count = Math.max(this.groups[grp_id].last - this.groups[grp_id].first + 1, prop.group_minimum_rows) + prop.group_extra_rows;
				this.items = this.items.slice(i + prop.group_header_rows + grp_items_count, this.items.length);
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
				//console("expanding...");
				//console("group id is: " + grp_id);
				var after = this.items.slice(i+prop.group_header_rows, this.items.length);
				this.items = this.items.splice(0, i+prop.group_header_rows);
				var is_odd = false;
				var item_id = i + prop.group_header_rows;
                var end = this.groups[grp_id].first + Math.max(this.groups[grp_id].last - this.groups[grp_id].first + 1, prop.group_minimum_rows) + prop.group_extra_rows;
				for (var j = this.groups[grp_id].first; j < end; j++) {
					this.items[item_id] = {};
                    switch (true) {
                        case (j <= this.groups[grp_id].last): 
                            // track items
                            this.items[item_id].type = 0;
                            this.items[item_id].list_id = j;
                            this.items[item_id].grp_id = grp_id;
                            this.items[item_id].metadb = this.handles.Item(j);
                            this.items[item_id].is_odd = is_odd;
                            break;
                        case (j > this.groups[grp_id].last && j < this.groups[grp_id].first + prop.group_minimum_rows):
                            // 填充物
                            this.items[item_id].type = -1;
                            this.items[item_id].is_odd = is_odd;
                            this.items[item_id].grp_id = grp_id;
                            break;
                        default:
                            // 隔离物
                            this.items[item_id].type = -2;
                            this.items[item_id].grp_id = grp_id;
                            break;
                    };
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

        // 检查 展开 后的分组是否能看得到 的功能，
        // 从 dblclk 移动到这里

	};

	// item_types >>> group-header: > 0, track: == 0, 填充物: == -1, 隔离物: == -2;
	this.update_list = function(collapse_all_) {
		var current, previous;
		var metadb;
		var grp_tf = prop.group_format;
		var show_grp_header = prop.show_group_header;
		var grp_header_rows = prop.group_header_rows;
		var grp_item_count;
		var item_id = 0, grp_id = 0;
		var list_item_id = 0, grp_list_item_id = 0;
		var end;

		this.handles = plman.GetPlaylistItems(g_active_playlist);
		end = this.handles.Count;
		this.groups = [];
		this.items = [];
        CollectGarbage();

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
                this.groups[grp_id].key = current;
                this.groups[grp_id].collapsed = (collapse_all_ ? true : false);

				// prev-grp: add empty row items, type -1
				if (grp_id > 0) {
					this.groups[grp_id - 1].last = i - 1;
					grp_item_count = this.groups[grp_id - 1].last - this.groups[grp_id - 1].first + 1;

					if (!this.groups[grp_id - 1].collapsed) {

                        // 填充物
						if (grp_item_count < this.min_grp_items) {
							this.items_to_add = this.min_grp_items - grp_item_count;
							for (var k = 0; k < this.items_to_add; k++) {
								this.items[item_id] = {};
								this.items[item_id].type = -1;
								this.items[item_id].is_odd = (show_grp_header ? grp_list_item_id : list_item_id) % 2;
                                this.items[item_id].grp_id = grp_id - 1;
								item_id++;
								list_item_id++;
								grp_list_item_id++;
							};
						};

                        // 隔离物
						for (var k = 0; k < this.extra_grp_items; k++) {
							this.items[item_id] = {};
							this.items[item_id].type = -2;
                            this.items[item_id].grp_id = grp_id - 1;
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
                        this.items[item_id].grp_id = grp_id - 1;
						item_id++;
					};
				}

				for (var k = 0; k < this.extra_grp_items; k++) {
					this.items[item_id] = {};
					this.items[item_id].type = -2;
                    this.items[item_id].grp_id = grp_id - 1;
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

        plman.SetActivePlaylistContext(); // to enable main-menu "Edit"
		//console("total length: " + this.total);

	};
	this.update_list(prop.auto_collaspe);

	this.draw = function(gr) {
		var grp_id, grp_id_saved = -1;
		var grp_header_rows = prop.group_header_rows;
		var grp_y, grp_h;
		var rx, ry, rw, rh;
		var item, item_id = 0;
		var playing_id, selected_id, focus_id;
		var is_playing, is_selected, is_focused, is_queued;
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

			var total_grps = plst.groups.length;
			for (var i = 0; i < total_grps; i++) {
				plst.groups[i].is_focused = false;
				if (g_focus_id >= plst.groups[i].first && g_focus_id <= plst.groups[i].last) {
					plst.groups[i].is_focused = true;
				};
			};

            this.get_playing_item();

			rx = this.list_x;
			rw = this.list_w;

            var grp_id_saved, _grp_id_saved;

			for (var i = 0; i < this.visible_rows; i++) {

				ry = this.list_y + i * this.row_height;
				rh = this.row_height;

				item_id = this.start_id + i;
				this.items[item_id].y = ry;
				item = this.items[item_id];
				//console("item id: " + item_id);
				if (item.type > -1)
					metadb = item.metadb;

				//gr.GdiDrawText(item_id, g_fonts.item, blendColors(g_colors.bg_normal, g_colors.txt_normal, 0.5), rx - 15, ry, 15, rh, dt_cc);

				// ---------------------------------------------------------draw group header
				if (item.type > 0) {
					grp_id = item.grp_id;
					if (grp_id !== grp_id_saved) {
						//================
						// draw grp header
						//================
						grp_y = (i == 0) && item.type > 1 ? ry - (item.type - 1) * rh : ry;
						grp_h = grp_header_rows * rh;
                        this.groups[grp_id].y = grp_y;

						// bg
						gr.FillSolidRect(rx, grp_y, rw, grp_h, 0x15000000);

						if (this.is_group_selected(grp_id)) {
							gr.FillSolidRect(rx, grp_y, rw, grp_h, 0x55ffffff & g_colors.bg_selected);
						};

						// focused rect
						if (this.groups[grp_id].is_focused && this.groups[grp_id].collapsed) {
							gr.DrawRect(rx, grp_y, rw - 1, grp_h - 1, 1, RGB(127, 127, 127));
						}

						if (grp_h > 59) {
							var delta = grp_h - 88;
							if (delta > 0) delta = 0;
							if (delta < -10) delta = -10;
							var delta2 = 58 + delta;
							// cover art
                            var cx = rx;
                            var cw = 0;
                            if (prop.show_group_art) {
                                //
                                this.groups[grp_id].grp_img = img_cache.hit(metadb, grp_id);
                                var img = this.groups[grp_id].grp_img;
                                //
                                if (prop.show_group_header ) {
                                    var cp = 4;
                                    var cx = rx + cp * 2;
                                    var cy = grp_y + cp;
                                    var cw = grp_h - cp * 2;
                                    group_art.x = cx;
                                    group_art.w = cw;
                                    if (img) {
                                        var img_w = img.Width;
                                        var img_h = img.Height;
                                        var img_x = cx + (cw - img_w) / 2;
                                        var img_y = cy + (cw - img_h) / 2;
                                        gr.FillSolidRect(img_x - 2, img_y - 2, img_w + 4, img_h + 4, g_colors.txt_normal & 0x55ffffff);
                                        gr.DrawImage(img, img_x, img_y, img_w, img_h, 0, 0, img.Width, img.Height, 0, 255);
                                    } else {
                                        gr.FillSolidRect(cx, cy, cw, cw, g_colors.txt_normal & 0x55ffffff);
                                        gr.GdiDrawText("Loading", gdi.Font("Segoe UI", 14, 1), g_colors.txt_normal, cx, cy, cw, cw, dt_cc);
                                    };
                                }
                            };

							var p = 10;
							var color_l1 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.3);
							// date
							var date = $("$year($replace(%date%,/,-))", metadb);
							var date_w = GetTextWidth(date, g_fonts.header1);
							var date_x = rx + rw - date_w - p;
							var date_y = grp_y + (grp_h - delta2) / 2;
							gr.GdiDrawText(date, g_fonts.header1, color_l1, date_x, date_y, date_w, grp_h, dt_lt);
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
							// playing icon
							var ico_w = 0;
							var ico = ">";
							if (this.groups[grp_id].is_playing) {
								var ico_w = GetTextWidth(ico, g_fonts.header2);
							};
							var ico_x = artist_x;
							var ico_y = genre_y;
							(ico_w > 0 ) && gr.GdiDrawText(ico, g_fonts.header2, g_colors.txt_normal, ico_x, ico_y, ico_w, grp_h, dt_lt);
							// album
							var album = $("%album%", metadb);
							var album_x = ico_x + ico_w + p;
							var album_w = genre_x - album_x - p;
							gr.GdiDrawText(album, g_fonts.header2, g_colors.txt_normal, album_x, genre_y, album_w, grp_h, dt_lt);
							// split line
							gr.FillSolidRect(artist_x, grp_y + grp_h - 10, rx + rw - artist_x - p, 1, g_colors.txt_normal & 0x15000000);

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
				} else if (item.type == 0){ // --------------------------------- draw track items
					//=================
					// draw track items
					//=================

					is_selected = plman.IsPlaylistItemSelected(g_active_playlist, item.list_id);
					is_playing = (plman.PlayingPlaylist == g_active_playlist && plman.GetPlayingItemLocation().PlaylistItemIndex == item.list_id);
					is_focused = plman.GetPlaylistFocusItemIndex(g_active_playlist) == item.list_id;
					if (is_playing) this.playing_item_visible = true;

					if (prop.odd_even_rows) {
						if (item.is_odd) gr.FillSolidRect(rx, ry+1, rw, rh-1, odd_color);
						else gr.FillSolidRect(rx, ry+1, rw, rh-1, even_color);
					};

					if (is_focused && prop.show_focus_item) {
						gr.DrawRect(rx, ry, rw - 1, rh - 1, 1, RGB(127, 127, 127));
					};

					var font_color = g_colors.txt_normal;
					if (is_selected) {
						font_color = g_colors.txt_selected;
						gr.FillSolidRect(rx, ry, rw, rh, g_colors.bg_selected & 0x55ffffff);
					};
					if (is_playing) {
						font_color = g_colors.highlight;
					};

                    var queue_id = plman.FindPlaybackQueueItemIndex(metadb, g_active_playlist, item.list_id) ;

					var p = 5;
					// track number
					var tn_x = group_art.max_w + rx + p * 4;
					var tn_w = 30;
                    
                    if (queue_id > -1) { //if (is_queued) {
                        var tn = "*" + num(queue_id + 1, 2);
                        gr.DrawRect(tn_x + 5, ry+3, tn_w, rh-7, 1, g_colors.highlight & 0x55ffffff);
                        gr.GdiDrawText(tn, g_fonts.item_bold, g_colors.highlight, tn_x, ry, tn_w, rh, dt_rc);
                    } else { //  track number
                        var tn = $("$ifgreater(%totaldiscs%,1,[%discnumber%.],)%tracknumber%", metadb);
                        gr.GdiDrawText(tn, g_fonts.item, font_color, tn_x, ry, tn_w, rh, dt_rc);
                    };

					// rating
                    var p = 8;
                    Rating.x = rx + rw;
                    if (prop.show_rating) {
                        var rating = $("%rating%", metadb);
                        var star_w  = 14;
                        var color = blendColors(font_color, g_colors.bg_normal, 0.2);
                        Rating.w = star_w * 5;
                        Rating.x = Rating.x - p - Rating.w;

                        for (var r = 0; r < 5; r++) {
                            var star_x = Rating.x + r * star_w;
                            var font = (r < rating ? g_fonts.rating1 : g_fonts.rating2);
                            gr.GdiDrawText(r < rating ? "\u2605" : "\u2219", font, color, star_x, ry, star_w, rh, dt_cc);
                        };
                    };

					// length
                    var p = 10;
					var trk_length = $("%length%", metadb);
					var trk_length_w = 40;
					var trk_length_x = Rating.x - trk_length_w - p;
					gr.GdiDrawText(trk_length, g_fonts.item, font_color, trk_length_x, ry, trk_length_w, rh, dt_rc);
                    // count
                    var p = 5;
                    var count = $("%play_count%", metadb);
                    var count_w = 30;
                    var count_x = trk_length_x - count_w - p;
                    gr.GdiDrawText(count, g_fonts.item, blendColors(font_color, g_colors.bg_normal, 0.5), count_x, ry, count_w, rh, dt_cc);
					// title
                    var p = 5;
					var title = $("%title%", metadb);
					var title_x = tn_x + tn_w + p * 2;
					var title_w = count_x - title_x - p;
					gr.GdiDrawText(title, g_fonts.item, font_color, title_x, ry, title_w, rh, dt_lc);

				} else if (item.type == -1) {
					if (prop.odd_even_rows) {
						if (item.is_odd) gr.FillSolidRect(rx, ry+1, rw, rh-1, odd_color)
						else gr.FillSolidRect(rx, ry+1, rw, rh-1, even_color);
					};
				} else {
                    //gr.FillSolidRect(rx, ry, rw, rh, 0xa0ffffff);
                };

			} // eol;
		} else { 
			// ---- draw text info if playlist is empty
			var font = gdi.Font(g_fonts.name, 32, 1);
			var color = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.4);
			gr.GdiDrawText("空列表", font, color, this.list_x, this.list_y - 20, this.list_w, this.list_h, dt_cc);
		};

		if (this.need_scrb && this.show_scrb){
		   this.scrb.draw(gr);
		};

		// ----------------------------------  覆盖住超出范围的部分
		gr.FillSolidRect(this.list_x, 0, this.list_w, this.y + this.margin, g_colors.bg_normal);
		gr.FillSolidRect(this.list_x, this.list_y + this.list_h, this.list_w, wh - this.list_y - this.list_h, g_colors.bg_normal);

		// ----------------------------------  draw split line
		if (this.items_dragging && this.drag_split_line_y >= 0 && (this.hover_item && this.hover_item.type <= 0 || !this.hover_item)) {
			gr.FillSolidRect(this.list_x, this.drag_split_line_y -1, this.list_w, 2, g_colors.txt_normal & 0x88ffffff);
		};

	};

	this.is_hover_list = function(x, y) {
		return (x > this.list_x &&
				x < this.list_x + this.list_w &&
				y > this.list_y && y <this.list_y + this.list_h);
	};

	this.collapse_all = function(bool) {
        this.update_list(bool);
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

	this.start_auto_scroll = function(delta, on_scroll) {
		if (!this.auto_scrolling) {
			plst.scroll_timeout_timer = window.SetTimeout(function() {
				plst.scroll_interval_timer = window.SetInterval(function() {
					var s = plst.scrb.scroll(delta);
					if (s) {
						on_scroll && on_scroll();
						plst.repaint()
					} else {
						plst.stop_auto_scroll();
						plst.save_start_id();
					};
				}, utils.IsKeyPressed(VK_CONTROL) ? 150: 50);
			}, 350);
			this.auto_scrolling = true;
		};
	};

	this.stop_auto_scroll = function() {
		if (this.scroll_interval_timer) 
			window.ClearInterval(this.scroll_interval_timer);
		if (this.scroll_timeout_timer) 
			window.ClearTimeout(this.scroll_timeout_timer);
		this.auto_scrolling = false;
		this.scroll_timeout_timer = null;
		this.scroll_interval_timer = null;
	};

    this.ensure_group_visible = function(grp_id) {
        var grp_last_item_id;
        var grp_first_item_id;
        var delta;
        for (var i = 0; i < this.total; i++) {
            if (this.items[i].grp_id == grp_id && (!this.items[i+1] || this.items[i+1].grp_id != grp_id)) {
                grp_last_item_id = i;
                break;
            };
        };
        if (grp_last_item_id > this.start_id + this.total_rows) {
            delta = grp_last_item_id - (this.start_id + this.total_rows);
            this.scrb.on_mouse("wheel", 0, 0, -delta);
        };

        for (var i = 0; i < this.total; i++) {
            if (this.items[i].type > 0 && this.items[i].grp_id == grp_id) {
                grp_first_item_id = i;
                break;
            };
        };
        if (grp_first_item_id < this.start_id) {
            delta = grp_first_item_id - this.start_id;
            this.scrb.on_mouse("wheel", 0, 0, -delta);
        };

        this.save_start_id();
        return;

    };
		

	// ---------------------------- playlist mouse event handler
	this.on_mouse = function(event, x, y, mask) {

		var shift_pressed = utils.IsKeyPressed(VK_SHIFT);
		var ctrl_pressed = utils.IsKeyPressed(VK_CONTROL);

		this.is_hover_area = this.is_hover_list(x, y);
		this.is_hover_scrb = this.scrb.is_hover_object(x, y);

		this.hover_item_id = -1;
		if (this.is_hover_area) {
			this.hover_item_id = Math.floor((y - this.list_y) / this.row_height) + this.start_id;
			if (this.hover_item_id < 0 || this.hover_item_id > this.total - 1) {
				this.hover_item_id = -1;
			};
		};

		this.hover_item = null;
		if (this.hover_item_id > -1) {
			this.hover_item = this.items[this.hover_item_id];
		};

		switch (event) {
			case "down":
				if (this.is_hover_scrb) {  // scrollbar event handler
                    if (this.right_clicked) return;
					this.scrb.on_mouse("down", x, y, mask);
				} else {
					if (this.double_clicked) return;
					if (this.hover_item == null || this.hover_item.type == -2) {
						if (!shift_pressed && !ctrl_pressed) {
							plman.ClearPlaylistSelection(g_active_playlist);
							this.SHIFT_start_id = -1
						};
						return;
					};
					//
					var item_type = this.hover_item.type;
					//
					this.items_clicked_id = -1;
					switch(true) {
						case (item_type > 0): // >>>>>>>> group item 
							var grp_id = this.hover_item.grp_id;
							if (ctrl_pressed) {
								this.select_group_tracks(grp_id);
								this.SHIFT_start_id = this.groups[grp_id].first;
								this.items_clicked = false;
							} else {
								plman.ClearPlaylistSelection(g_active_playlist);
								this.select_group_tracks(grp_id);
								this.SHIFT_start_id = this.groups[grp_id].first;
								this.items_clicked = true;
							};
							this.selecting = false;
							plman.SetPlaylistFocusItem(g_active_playlist, this.groups[grp_id].first);
                            // handle auto collapse
                            if (!this.right_clicked && prop.auto_collaspe) {
                                for (var i = 0; i < this.groups.length; i++) {
                                    if (!this.groups[i].collapsed && i != grp_id) {
                                        this.collapse_group(i);
                                    };
                                };
                                this.expand_group(grp_id);
                                this.ensure_group_visible(grp_id);
                                g_avoid_to_clear_selection_on_mouse_up = true;
                                //this.double_clicked = true;
                            };
							break;
						case (item_type == 0): // >>>>>>> clicked on track items
							var list_id = this.hover_item.list_id;
							if (shift_pressed) {
								//console(this.SHIFT_start_id);
								if (g_focus_id != list_id && plman.IsPlaylistItemSelected(g_active_playlist, g_focus_id)) {
									if (this.SHIFT_start_id > -1) {
										this.select_a_to_b(this.SHIFT_start_id, list_id);
									} else {
										this.select_a_to_b(g_focus_id, list_id);
									}
								} else {
									plman.SetPlaylistSelectionSingle(g_active_playlist, list_id, true);
									this.SHIFT_start_id = list_id;
								};
								plman.SetPlaylistFocusItem(g_active_playlist, list_id);
								this.items_clicked = false;
								this.selecting = false;
							} else if (ctrl_pressed) {
								if (plman.IsPlaylistItemSelected(g_active_playlist, list_id)) {
									plman.SetPlaylistSelectionSingle(g_active_playlist, list_id, false);
								} else {
									plman.SetPlaylistSelectionSingle(g_active_playlist, list_id, true);
									plman.SetPlaylistFocusItem(g_active_playlist, list_id);
								}
								this.SHIFT_start_id = list_id;
								this.items_clicked = false;
								this.selecting = false;
							} else {
								if (plman.IsPlaylistItemSelected(g_active_playlist, list_id)) {
									this.items_clicked = true;
									this.items_clicked_id = this.hover_item_id;
									this.selecting = false;
								} else {
									this.selecting = true;
									this.items_clicked = false;
                                    this.items_clicked_id = this.hover_item_id;
									plman.ClearPlaylistSelection(g_active_playlist);
									plman.SetPlaylistSelectionSingle(g_active_playlist, list_id, true);
								};
								plman.SetPlaylistFocusItem(g_active_playlist, list_id);
								this.SHIFT_start_id = list_id;
							};
							break;
						case (item_type < 0): // clicked on empty items
                            // 
							if (this.is_hover_area) this.selecting = true;
							break
					};
					this.repaint();
				};
				break;
			case "move":
				// scrollbar
				this.scrb.on_mouse("move", x, y);
				if (this.scrb.cursor_clicked) this.save_start_id();
				if (this.double_clicked) return;

				this.drag_split_line_y = -10;
				// items handler
				// dragging file
				// --------------------------------------------------->  when dragging selections
				if (this.items_clicked) {
					// --- 
					if (!this.right_clicked && (!this.hover_item || this.hover_item_id != this.items_clicked_id)) {
						this.items_dragging = true;
					};

					if (this.items_dragging) {
						// ---if mouse over track items, show split-line
						if (this.hover_item) {
							this.drag_split_line_y = this.hover_item.y;
						} else {
							// --- else if mouse over empty list area
							if (this.total_rows > this.total) { 
								if (y > this.items[this.total - 1].y + this.row_height) {
									this.drag_split_line_y = this.items[this.total - 1].y + this.row_height;
								}
							}
                            else if (this.start_id == 0 && y < this.items[0].y) {
                                for (var i = 0; i < this.visible_rows; i++) {
                                    if (this.items[i].type == 0) {
                                        this.drag_split_line_y = this.items[i].y;
                                        break;
                                    };
                                };
                            };
						};
					};

					// --- if mouse over header items, expand the group if collapsed
                    if (!this.right_clicked && this.hover_item && this.hover_item.type > 0) {
                        if (this.groups[this.hover_item.grp_id].collapsed) {
                            this.expand_group(this.hover_item.grp_id);
                        };
                    };

					// --- auto-scroll
					if (this.items_dragging && this.total_rows < this.total) {
						if (y < this.list_y) {
							this.start_auto_scroll(1, function() {/* ... */});
						} else if (y > this.list_y + this.list_h) {
							this.start_auto_scroll(-1, function() {/* ... */});
						} else {
							this.stop_auto_scroll();
						};;
					};

					if (this.drag_split_line_y != this.drag_split_line_y_saved) {
						this.drag_split_line_y_saved = this.drag_split_line_y;
						this.repaint();
					};

				};

                // ------------------------------------ when selecting 
                if (this.selecting) {

                    var end_, start_;
                    //
                    if (this.items_clicked_id > -1) {
                        start_ = this.items[this.items_clicked_id].list_id;
                    };

                    if (this.items_clicked_id > -1 && this.hover_item && this.hover_item_id != this.items_clicked_id) {
                        end_ = -1;

                        if (this.hover_item.type == 0) {
                            end_ = this.hover_item.list_id;
                        } else if (this.hover_item.type > 0) {
                            var grp_id = this.hover_item.grp_id;
                            if (this.items_clicked_id > this.hover_item_id) {
                                end_ = this.groups[grp_id].first;
                            } else {
                                end_ = this.groups[this.hover_item.grp_id - 1].last;
                            };
                        } else {
                            var grp_id = this.hover_item.grp_id;
                            if (this.items_clicked_id > this.hover_item_id) {
                                end_ = this.groups[grp_id+1].first;
                            } else {
                                end_ = this.groups[grp_id].last;
                            };
                        }
                    };

                    if (this.hover_item_id == this.items_clicked_id) {
                        end_ = start_;
                    }

                    if (this.total_rows > this.total && y > this.items[this.visible_rows - 1].y + this.row_height) {
                        end_ = this.handles.Count - 1;
                    };

                    if (y < this.list_y) {
                        var item_type = plst.items[plst.start_id].type;
                        var grp_id = plst.items[plst.start_id].grp_id;
                        if (item_type > 0) {
                            end_ = plst.groups[grp_id].first;
                        } else if (item_type < 0) {
                            end_ = plst.groups[grp_id + 1].first;
                        } else {
                            end_ = plst.items[plst.start_id].list_id;
                        };
                    } else if (y > this.list_y + this.list_h) {
                        var item_type = plst.items[plst.start_id + plst.visible_rows - 1].type;
                        var grp_id = plst.items[plst.start_id + plst.visible_rows - 1].grp_id;
                        if (item_type > 0) {
                            end_ = plst.groups[grp_id - 1].last;
                        } else if (item_type < 0) {
                            end_ = plst.groups[grp_id].last;
                        } else {
                            end_ = plst.items[plst.start_id + plst.visible_rows - 1].list_id;
                        };
                    };

                    this.select_a_to_b(start_, end_);

					// --- if mouse over header items, expand the group if collapsed
					if (this.hover_item && this.hover_item.type > 0) {
						if (this.groups[this.hover_item.grp_id].collapsed) {
							this.expand_group(this.hover_item.grp_id);
						};
					};

					// --- auto-scroll
					if (this.selecting && this.total_rows < this.total) {
                        //
						if (y < this.list_y) {
							this.start_auto_scroll(1, function() {
                                var item_type = plst.items[plst.start_id].type;
                                var grp_id = plst.items[plst.start_id].grp_id;
                                if (item_type > 0) {
                                    end_ = plst.groups[grp_id].first;
                                } else if (item_type < 0) {
                                    end_ = plst.groups[grp_id + 1].first;
                                } else {
                                    end_ = plst.items[plst.start_id].list_id;
                                };
                                plst.select_a_to_b(plst.items[plst.items_clicked_id].list_id, end_);
                            });
						} else if (y > this.list_y + this.list_h) {
							this.start_auto_scroll(-1, function() {
                                var item_type = plst.items[plst.start_id + plst.visible_rows - 1].type;
                                var grp_id = plst.items[plst.start_id + plst.visible_rows - 1].grp_id;
                                if (item_type > 0) {
                                    end_ = plst.groups[grp_id - 1].last;
                                } else if (item_type < 0) {
                                    end_ = plst.groups[grp_id].last;
                                } else {
                                    end_ = plst.items[plst.start_id + plst.visible_rows - 1].list_id;
                                };
                                plst.select_a_to_b(plst.items[plst.items_clicked_id].list_id, end_);
                            });
						} else {
							this.stop_auto_scroll();
						};
					};

                };


				if (this.items_dragging) {
					window.SetCursor(32651);
				} else {
					window.SetCursor(32512);
				};

				break;
			case "dblclk":
				if (this.is_hover_scrb) {
					this.scrb.on_mouse("down", x, y);
				};
				if (this.hover_item) {
                    this.double_clicked = true;
					var item_type = this.items[this.hover_item_id].type;
                    // rating
					switch (true) {
						case (item_type > 0):
                            var item_id = this.hover_item_id;
							var grp_id = this.items[this.hover_item_id].grp_id;
                            //
                            if (this.groups[grp_id].collapsed) {
                                // 
                                this.expand_group(grp_id);
                                this.ensure_group_visible(grp_id);
                                // --- 检查展开后是否能看的到
                                /*
                                var grp_total_rows = Math.max(this.groups[grp_id].last - this.groups[grp_id].first + 1, prop.group_minimum_rows) + prop.group_extra_rows + prop.group_header_rows;
                                if (grp_total_rows * this.row_height + this.groups[grp_id].y > this.list_y + this.list_h) {
                                    var delta = Math.ceil((grp_total_rows * this.row_height + this.groups[grp_id].y - this.list_y - this.list_h) / this.row_height);
                                    delta = Math.min(delta, this.total_rows);
                                    this.scrb.on_mouse("wheel", 0, 0, -delta);
                                    this.save_start_id();
                                };
                                */
                            } else {
                                this.collapse_group(grp_id);
                            };
							break;
						case (item_type == 0):
                            // rating
                            if (prop.show_rating && this.hover_item && this.hover_item.type == 0 && x > Rating.x && x < Rating.x + Rating.w) {
                                var star_w = Rating.w / 5;
                                var metadb = this.hover_item.metadb;
                                var rating_curr = $("%rating%", metadb);
                                var rating_to = Math.ceil((x - Rating.x) / star_w);
                                (rating_curr == rating_to) ? fb.RunContextCommandWithMetadb("<not set>", metadb) : fb.RunContextCommandWithMetadb("Rating/" + rating_to, metadb);
                                break;
                            };
							var list_id = this.items[this.hover_item_id].list_id;
							plman.ExecutePlaylistDefaultAction(g_active_playlist, list_id);
							break;
						default:
							break;
					};
					this.repaint();
				};
				break;
			case "up":
				this.scrb.on_mouse("up", x, y);
				if (this.double_clicked) {
					this.double_clicked = false;
                    return;
				};
				this.auto_scrolling && this.stop_auto_scroll();
                if (this.selecting) this.selecting = false;

                // -- here move selection code are from catrox by extremehunter1972 --
				if (this.items_clicked) {
					if (this.items_dragging) {
						// do dragdrop action
                        var handles_sel = plman.GetPlaylistSelectedItems(g_active_playlist);
                        var sel_total = handles_sel.Count;
                        var list_total = this.handles.Count;
                        if (this.hover_item && this.hover_item.type <= 0) {
                            var list_id;
                            var delta_;
                            if (this.hover_item.type == 0){ 
                                list_id = this.hover_item.list_id;
                            } else {
                                //list_id = Math.min(this.handles.Count -1, this.groups[this.hover_item.grp_id].last+1);
                                list_id = this.groups[this.hover_item.grp_id].last+1;
                            };

                            if (sel_total > 1) {
                                var temp;
                                var odd, add;
                                var sel_ = [];
                                for (var i = 0; i < list_total; i++) {
                                    if (plman.IsPlaylistItemSelected(g_active_playlist, i)) {
                                        sel_.push(i);
                                    };
                                };

                                for (var i = 0; i < list_total; i++) {
                                    if (plman.IsPlaylistItemSelected(g_active_playlist, i)) {
                                        if (temp && ((i - 1) != temp)) {
                                            odd = true;
                                            break;
                                        };
                                        temp = i;
                                    };
                                };
                                if (odd) {
                                    for (var i = 0; i < sel_.length; i++) {
                                        if (sel_[i] < list_id) {
                                            add = i + 1;
                                        }
                                    };
                                    plman.MovePlaylistSelection(g_active_playlist, -list_total);
                                } else {
                                    for (var i = 0; i < sel_.length; i++) {
                                        if (sel_[i] == g_focus_id) {
                                            add = i;
                                            break;
                                        };
                                    };
                                };
                            };
                            if (g_focus_id > list_id) {
                                (sel_total > 1) ? (odd ? delta_ = list_id - add : delta_ = - (g_focus_id - list_id - add)) : delta_ = -(g_focus_id - list_id);
                            } else {
                                (sel_total > 1) ? (odd ? delta_ = list_id - add : delta_ = (list_id - g_focus_id - (sel_total - add))) : delta_ = (list_id - 1 - g_focus_id);
                            };

                            if (!odd && plman.IsPlaylistItemSelected(g_active_playlist, list_id)) delta_ = 0;
                            plman.MovePlaylistSelection(g_active_playlist, delta_);
                        };

                        // move after the last list item
                        if (!this.auto_scrolling && y > this.items[this.start_id + this.visible_rows - 1].y + this.row_height) {
                            plman.MovePlaylistSelection(g_active_playlist, list_total - sel_total);
                        };

                        if (this.start_id == 0) {
                            if (y < this.items[0].y) {
                                plman.MovePlaylistSelection(g_active_playlist, sel_total - list_total);
                            } 
                        };

						this.items_dragging = false;
					} else {
						// --- if this.hover_item && this.hover_item_id == this.items_clicked_id:
                        if (g_avoid_to_clear_selection_on_mouse_up) {
                            g_avoid_to_clear_selection_on_mouse_up = false;
                        } else 
						if (this.hover_item.type == 0 && !g_avoid_to_clear_selection_on_mouse_up) {
							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelectionSingle(g_active_playlist, this.hover_item.list_id, true);
							plman.SetPlaylistFocusItem(g_active_playlist, this.hover_item.list_id);
                            //g_avoid_to_clear_selection_on_mouse_up = false;
						};
					};
					this.items_clicked = false;
					this.items_clicked_id = -1;
				};


				this.repaint();
				window.SetCursor(32512);
                plman.SetActivePlaylistContext();
				break;
			case "right":
                this.selecting = false;
                this.items_clicked = false;
                this.items_dragging = false;
                this.context_menu(x, y, g_focus_id);

				break;
			case "leave":
                this.selecting = false;
                this.items_clicked = false;
                this.items_dragging = false;
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


	this.get_playing_item = function() {
		if (!fb.IsPlaying) {
			return null;
		};

        var total_grps = this.groups.length;
        for (var i = 0; i < total_grps; i++) {
            this.groups[i].is_playing = false;
            var __playing_id = plman.GetPlayingItemLocation().PlaylistItemIndex;
            if (__playing_id >= plst.groups[i].first && __playing_id <= plst.groups[i].last) {
                plst.groups[i].is_playing = true;
            };
        };
    };

	//this.show_now_playing_called = false;
	this.show_now_playing = function () {
		if (!fb.IsPlaying) return;

		this.playing_item = plman.GetPlayingItemLocation();
		if (!this.playing_item.IsValid) {
			//console("item invalid...");
		   	return;
		};

		if (g_active_playlist != plman.PlayingPlaylist) {
		   plman.ActivePlaylist = plman.PlayingPlaylist;
		   g_active_playlist = plman.ActivePlaylist;
		};

		var playing_item_list_id = this.playing_item.PlaylistItemIndex;
		plman.ClearPlaylistSelection(g_active_playlist);
		plman.SetPlaylistSelectionSingle(g_active_playlist, playing_item_list_id, true);
		plman.SetPlaylistFocusItem(g_active_playlist, playing_item_list_id);

        if (prop.auto_collaspe) {
            this.collapse_all(true);
        };

		// --------- expand playing group
		var playing_grp_id = 0;
		//console("playing list id: " + playing_item_list_id);
		for (var j = 0; j < this.total; j++) {
			if (this.items[j].type > 0) {
				var grp_id = this.items[j].grp_id;
				//console(grp_id);
				if (this.groups[grp_id].first <= playing_item_list_id && this.groups[grp_id].last >= playing_item_list_id) {
					playing_grp_id = grp_id;
					//console("playing group id: " + grp_id);
					this.expand_group(grp_id);
					break;
				}
			};
		};

        // ----- scroll to centre of the list
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

		if (plman.ActivePlaylist != plman.PlayingPlaylist){ 
			g_show_now_playing_called = true;
			//console("show now playing...");
		};

	//	};
	};

	this.context_menu = function(x, y, type) {
		var _menu = window.CreatePopupMenu(); // main
        var _ce = window.CreatePopupMenu(); // collapse/expand
		var Context = fb.CreateContextMenuManager();
		var context_base_id;

		var handles_sel = plman.GetPlaylistSelectedItems(g_active_playlist);
		var has_sel = handles_sel.Count;
		if (has_sel) Context.InitContext(handles_sel);

        fb.IsPlaying && _menu.AppendMenuItem(MF_STRING, 1, "Show now playing");
        (this.total > 0) &&_menu.AppendMenuItem(MF_STRING, 2, "Refresh");
        if (has_sel && (fb.IsPlaying || this.total > 0)) {
            _menu.AppendMenuSeparator();
        };

        if (prop.show_group_header) {
            _ce.AppendTo(_menu, MF_STRING | MF_POPUP, "Collapse/Expand");
            _menu.AppendMenuSeparator();
            _ce.AppendMenuItem(MF_STRING, 50, "Collapse all");
            _ce.AppendMenuItem(MF_STRING, 51, "Collapse all but now playing");
            _ce.AppendMenuItem(MF_STRING, 52, "Expand all");
        };

		if (has_sel) {
			_menu.AppendMenuItem(MF_STRING, 10, "Cut\tCtrl+X");
			_menu.AppendMenuItem(MF_STRING, 11, "Copy\tCtrl+C");
		};
		if (this.handles_in_clipboard_count > 0) {
			_menu.AppendMenuItem(MF_STRING, 12, "Paste\tCtrl+V");
		};

		context_base_id = 1000;
		if (has_sel){ 
			_menu.AppendMenuSeparator();
			Context.BuildMenu(_menu, context_base_id, -1);
		};

		var ret = _menu.TrackPopupMenu(x, y);

		if (has_sel) Context.ExecuteByID(ret - context_base_id);
		switch(ret) {
			case 1:
				this.show_now_playing();
				break;
            case 2:
                this.handles_in_clipboard = null;
                this.handles_in_clipboard_count = 0;
                img_cache = new ImageCache(prop.group_art_id);
                this.repaint();
                CollectGarbage()
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
            case 50:
                this.collapse_all(true);
                break;
            case 51:
                this.collapse_all(true);
                if (g_active_playlist == fb.PlayingPlaylist) {
                    this.show_now_playing();
                }
                break;
            case 52:
                this.collapse_all(false);
                break;
		};

		_menu.Dispose();
        _ce.Dispose();
		Context.Dispose();

        this.right_clicked = false;
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
				plman.InsertPlaylistItems(g_active_playlist, plman.PlaylistCount, this.handles_in_clipboard, true);
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
					this.parent.start_id = Math.ceil((this.cursor_y - this.y) * this.parent.total / this.parent.h);
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
	this.use_system_color = window.GetProperty("_prop_color: Use system color", true);
	this.colorscheme = window.GetProperty("_prop_color: Colorscheme(light, dark, user)", "dark");
	this.font_name = window.GetProperty("_prop_font: Default font name", "Segoe UI");
	this.group_format = window.GetProperty("_prop_grp: Group format", "%album artist% | %album%");
	this.group_header_rows = window.GetProperty("_prop_grp: Group header rows", 4);
	this.group_minimum_rows = window.GetProperty("_prop_grp: Minimum group rows", 0);
	this.group_extra_rows = window.GetProperty("_prop_grp: Extra group rows", 0);
	this.show_group_header = window.GetProperty("_prop_grp: Show group header", true);
	this.row_height = window.GetProperty("_prop: Row height", 22);
	this.margin = window.GetProperty("_prop: Margin", 15);
    this.show_scrollbar = window.GetProperty("_prop: Show scrollbar", true);
	this.scrollbar_width = 12;
	this.odd_even_rows = window.GetProperty("_prop: Enable odd/even rows hightlight", true);
	this.scroll_step = window.GetProperty("_prop: Default scroll step", 3);
	this.auto_collaspe = window.GetProperty("_prop: Auto collapse", false);
	this.show_focus_item = window.GetProperty("_prop: Show focused item", false);
    this.show_rating = window.GetProperty("_prop: Show rating", true);
    this.show_play_count = window.GetProperty("_prop: Show play count", true);
    this.show_group_art = window.GetProperty("_prop: Show group art", true);
    this.group_art_id = window.GetProperty("_prop: Group art id(font:0, disc:2, artist:4, genre:5", 0);
    this.keep_aspect_ratio = window.GetProperty("_prop: Keep art aspect ratio", true);
}();


g_colors = {};
g_fonts = {}
images = {
    no_cover: null,
};

colorscheme = {
	light: {
		txt_normal: RGB(70, 70, 70),
		txt_selected: RGB(0, 0, 0), 
		bg_normal: RGB(255, 255, 255),
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

Rating = {
    x: 0,
    w: 0,
};


group_art = {
    kar: prop.keep_aspect_ratio,
//    visible: true,
    w: 0,
    h: 0,
    max_w: 0,
    max_h: 0,
    load_timer: null

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

var g_active_playlist = plman.ActivePlaylist;
var g_focus_id = plman.GetPlaylistFocusItemIndex(g_active_playlist);
var g_show_now_playing_called = false;
var g_fast_scrolling = true;
var g_avoid_to_clear_selection_on_mouse_up = false;

var plst = new Playlist();
var img_cache = new ImageCache(prop.group_art_id);

get_metrics();
get_fonts();
get_colors();
get_images();

window.DlgCode = DLGC_WANTALLKEYS;

function on_size() {
	ww = window.Width;
	wh = window.Height;
	var th = 24;
	plst.set_size(resize = true, 1, th, ww-2, wh - th-1);
};

function on_paint(gr) {
    var from = new Date();
	gr.FillSolidRect(0, 0, ww, wh, g_colors.bg_normal);
	plst.draw(gr);
	gr.FillSolidRect(0, 0, ww, 24, RGB(35, 35, 35));
    gr.DrawRect(0, 0, ww -1, wh - 1, 1, RGB(172, 172, 172));
    var to = new Date();
    console("paint: " + (to - from) + " ms");
    repaint_counter++;
    if (repaint_counter > 100) {
        repaint_counter = 0;
        CollectGarbage();
    };
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
    plst.right_clicked = true;
	plst.on_mouse("down", x, y, mask);
};

function on_mouse_rbtn_up(x, y, mask) {
	if (plst.scrb.is_hover_object(x, y)) {
		return true;
	};
	if (mask == VK_SHIFT) return false;
    plst.on_mouse("right", x, y, mask);
	return true;
};

function on_mouse_wheel(delta) {
	plst.on_mouse("wheel", 0, 0, delta);
};


//// playlist callbacsk

function on_playlists_changed() {
	if (g_active_playlist > plman.PlaylistCount - 1) {
		g_active_playlist = plman.PlaylistCount - 1;
	};
	if (g_active_playlist < 0) {
		g_active_playlist = 0;
	};
	if (g_active_playlist != plman.ActivePlaylist) {
		g_active_playlist = plman.ActivePlaylist;
		plst.update_list(prop.auto_collaspe);
	};
};


function on_playlist_switch() {
	g_active_playlist = plman.ActivePlaylist;
    g_focus_id = plman.GetPlaylistFocusItemIndex(g_active_playlist);
	plst.update_list(prop.auto_collaspe);
	if (plman.ActivePlaylist == plman.PlayingPlaylist) plst.show_now_playing();
	g_show_now_playing_called = false;
};

function on_playlist_items_reordered(playlist) {
	if (playlist !== g_active_playlist) return;
	plst.update_list();
    g_focus_id = plman.GetPlaylistFocusItemIndex(g_active_playlist);
};

function on_playlist_items_removed(playlist) {
	if (playlist !== g_active_playlist) return;
	plst.update_list();
    g_focus_id = plman.GetPlaylistFocusItemIndex(g_active_playlist);
};

function on_playlist_items_added(playlist) {
	if (playlist !== g_active_playlist) return;
	plst.update_list();
    g_focus_id = plman.GetPlaylistFocusItemIndex(g_active_playlist);
};

function on_playlist_items_selection_change() {
	plst.repaint();
};

function on_item_selection_change() {
	plst.repaint();
};

function on_item_focus_change(playlist, from, to) {
	g_focus_id = to;
	plst.repaint();
};


//// playback callbacks

function on_playback_pause(state) {
	if (plst.playing_item_visible) plst.repaint();
};

function on_playback_starting(cmd, is_paused) {
	plst.get_playing_item();
	if (plst.playing_item_visible)  plst.repaint();
};

function on_playback_edited(metadb) {
	plst.repaint();
};

function on_playback_new_track(metadb) {
	plst.get_playing_item();
	plst.repaint();
};

function on_playback_stop(reason) {
	if (reason != 2) {
		plst.get_playing_item();
		plst.repaint();
	};
}

function on_playback_queue_changed() {
    plst.repaint();
};

//// misc

function on_get_album_art_done(metadb, art_id, image, image_path) {
    var tot = plst.groups.length;
    //console(art_id);
    for (var i = 0; i < tot; i++) {
        if (plst.groups[i].metadb && plst.groups[i].metadb.Compare(metadb)) {
            plst.groups[i].grp_img = img_cache.get_it(metadb, i, image);
            plst.repaint();
            break;
        };
    };
};


function on_metadb_changed(handles, fromhook) {
	plst.repaint();
};

function on_colors_changed() {
	get_colors();
    get_images();
    img_cache = new ImageCache(prop.group_art_id);
	window.Repaint();
};

function on_font_changed() {
	get_fonts();
	window.Repaint();
};

function get_fonts() {
	g_fonts.name = prop.font_name;
    g_fonts.name_bold = g_fonts.name;
    if (g_fonts.name.toLowerCase() == "segoe ui semibold") {
        g_fonts.name_bold = "segoe ui";
    };
	g_fonts.item = gdi.Font(g_fonts.name, 12);
    g_fonts.item_bold = gdi.Font(g_fonts.name, 12, 1);
	g_fonts.header1 = gdi.Font(g_fonts.name_bold, 18, 1);
	g_fonts.header2 = gdi.Font(g_fonts.name, 16, 0);
	g_fonts.header3 = gdi.Font(g_fonts.name, 14, 0);
    g_fonts.rating1 = gdi.Font("Segoe UI Symbol", 16, 0);
    g_fonts.rating2 = gdi.Font("Segoe UI Symbol", 14, 0);
};

function get_colors() {
	g_colors = colorscheme[prop.colorscheme];
	if (prop.use_system_color) {
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

function get_metrics() {
    if (prop.show_group_art) {
        if (prop.show_group_header) {
            group_art.max_w = prop.group_header_rows * prop.row_height - 12;
            prop.group_minimum_rows = 0;
            window.SetProperty("_prop_grp: Minimum group rows", prop.group_minimum_rows);
        } else {
            prop.group_minimum_rows = 5;
            window.SetProperty("_prop_grp: Minimum group rows", prop.group_minimum_rows);
            group_art.max_w = 5 * prop.row_height - 20;
            //plst.update_list();
        };
    };
    img_cache = new ImageCache(prop.group_art_id);
};

function get_images() {
    var cw = group_art.max_w;
    var img, g;
    img = gdi.CreateImage(cw, cw);
    g = img.GetGraphics();
    var color = blendColors(g_colors.bg_normal, 0xff000000, 0.2);
    g.FillSolidRect(0, 0, cw, cw, color);
    g.SetTextRenderingHint(4);
    var color = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.5);
    g.DrawString("No Cover", gdi.Font("Segoe UI", 14, 1), color, 0, 0, cw, cw, StringFormat(1, 1));
    g.SetTextRenderingHint(0);
    img.ReleaseGraphics(g);
    images.no_cover = img;
};

function isTrackQueued(handle) {
    var queue_total = plman.GetPlaybackQueueCount();
    if(queue_total > 0) {
        var vbarr = plman.GetPlaybackQueueContents();
        var arr = vbarr.toArray();
        for(var j = 0; j < queue_total; j++) {
            if(handle.Compare(arr[j].Handle)) {
                return j+1;
            }
        };
        return -1;
    }; else {
        return -1;
    };
};

function num(strg, nb) {
    var i;
    var str = strg.toString();
    var k = nb - str.length;
    if (k > 0) {
        for (i=0;i<k;i++) {
            str = "0" + str;
        };
    };
    return str.toString();
};
