////////////////////////////////////////////// objects
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

		try {
			gr.FillSolidRect(this.x, this.cursor_y, this.w, this.cursor_h, cursor_color);
		} catch (e) { }
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
		var rt;
		this.parent.start_id -= delta;
		rt = this.parent.check_start_id();
		this.update_cursor();
		return rt;
	};
};

PlaylistManager = function() {
	this.playlist = [];
	this.margin = prop.margin;
	this.row_height = 21;
	this.show_count = true;

	this.scrb = new Scroll(true, this);
	this.scrb_right = this.margin;
	this.scrb_width = prop.scrb_width;
	this.show_scrb = true;
	this.need_scrb;

	this.start_id = 0;
	this.hover_id = -1;
	this.drag_id = -1;
	this.active_id = plman.ActivePlaylist;

	this.dragdrop = {
		target_id: -1,
		is_hover_area: false
	};

	this.repaint = function() {
		//window.Repaint();
		repaint_cover1 = repaint_cover2;
	};

	this.set_size = function(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		//
		this.list_x = this.x + this.margin;
		this.list_y = this.y + this.margin;
		this.list_w = this.w - this.margin * 2;
		this.list_h = this.h - this.margin * 2;

		this.total_rows = Math.floor((this.h - this.margin * 2) / this.row_height);
		this.check_start_id();

		this.need_scrb = this.total > this.total_rows;
		if (this.need_scrb && this.show_scrb) {
			this.list_w = this.list_w - this.scrb_width - this.scrb_right;
			this.scrb.set_size(this.list_x + this.list_w + this.scrb_right, this.list_y, this.scrb_width, this.list_h);
		};

	};

	this.check_start_id = function() {
		var rt = true;
		if (this.start_id + this.total_rows > this.total) {
			this.start_id = this.total - this.total_rows;
			rt = false;
		};
		if (this.start_id < 0) {
			this.start_id = 0;
			rt = false;
		}
		return rt;
	};

	this.update_list = function(repaint) {
		this.playlist = [];
		this.total = plman.PlaylistCount;
		for (var i = 0; i < this.total; i++) {
			this.playlist[i] = {};
			this.playlist[i].name = plman.GetPlaylistName(i);
			this.playlist[i].is_auto = fb.IsAutoPlaylist(i);
			this.playlist[i].total_tracks = plman.PlaylistItemCount(i);
		};
		this.scrb.update_cursor();
		repaint && this.repaint();
	};
	this.update_list();

	this.is_hover_list= function(x, y) {
		return (x > this.list_x &&
				x < this.list_x + this.list_w && 
				y > this.list_y &&
				y < this.list_y + this.list_h);
	};

	this.start_auto_scroll = function(delta, on_scroll) {
		if (!this.auto_scrolling) {
			plm.scroll_timeout = window.SetTimeout(function() {
				plm.scroll_interval = window.SetInterval(function() {
					var scrolling = plm.scrb.scroll(delta);
					if (scrolling) {
						on_scroll && on_scroll();
						plm.repaint();
					} else {
						plm.stop_auto_scroll();
					};
				}, 50);
			}, 350);
			this.auto_scrolling = true;
		};
	};

	this.stop_auto_scroll = function() {
		window.ClearInterval(this.scroll_interval);
		window.ClearTimeout(this.scroll_timeout);
		this.auto_scrolling = false;
	};

	this.draw = function(gr) {

		var idx = 0;
		var icon_img, icon_x, icon_y, icon_w, icon_id;
		var count_x, count_w;
		var p = 8;
		var rh = this.row_height, ry;
		var text_color;

		// bg
		gr.FillSolidRect(this.x, this.y, this.w, this.h, g_colors.bg_normal);

		//
		for (var k = 0; (k < this.total_rows) && (k + this.start_id < this.total); k++) {
			idx = k + this.start_id;
			ry = this.list_y + k * rh;

			// list item bg
			if (idx == this.active_id) {
				gr.FillSolidRect(this.list_x, ry, this.list_w, rh, g_colors.bg_selected & 0x55ffffff);
				gr.DrawRect(this.list_x, ry, this.list_w - 1, rh - 0, 1, /*g_colors.bg_selected*/RGB(127, 127, 127));
			};
			if (idx == this.hover_id && this.drag_id < 0 && !this.dragdrop.active) {
				gr.FillSolidRect(this.list_x, ry, this.list_w, rh, g_colors.bg_selected & 0x20ffffff);
				gr.DrawRect(this.list_x, ry, this.list_w - 1, rh - 0, 1, g_colors.bg_selected & 0xe7ffffff);
			};
			if (idx == this.dragdrop.target_id && (dragdrop.drag_file || this.dragdrop.active)) {
				gr.DrawRect(this.list_x+1, ry + 2, this.list_w - 1, rh - 2, 2, g_colors.highlight);
			};

			text_color = g_colors.txt_normal;
			icon_id = 0;
			if (idx == plman.PlayingPlaylist && fb.IsPlaying) {
				text_color = g_colors.highlight;
				icon_id = 1;
			};
			icon_img = images.list;
			if (this.playlist[idx].is_auto) icon_img = images.list_auto;
			if (this.playlist[idx].name.slice(0, 8) == "Search [") icon_img = images.list_search;
			icon_w = icon_img[0].Width;
			icon_x = this.list_x;
			icon_y = ry + (this.row_height - icon_w) / 2;

			// draw list icons
			try {
				gr.DrawImage(icon_img[icon_id], icon_x, icon_y, icon_w, icon_w, 0, 0, icon_w, icon_w, 0, 255);
			} catch(e) {};

			count_w = 0;
			if (this.show_count) {
				count_w = GetTextWidth(this.playlist[idx].total_tracks, g_fonts.item);
			}
			if (count_w > 0) {
				count_x = this.list_x + this.list_w - count_w - p/2;
				gr.GdiDrawText(this.playlist[idx].total_tracks, g_fonts.item, text_color, count_x, ry+1, count_w, rh, dt_lc);
			};

			// draw playlist name
			var name_x = icon_x + icon_w + p;
			var name_w = count_x - name_x - p;
			gr.GdiDrawText(this.playlist[idx].name, g_fonts.item, text_color, name_x, ry+1, name_w, rh, dt_lc);

			// drag split-line
			if (this.drag_id > -1 && idx == this.drag_hover_id) {
				gr.DrawLine(this.list_x, ry+1, this.list_x + this.list_w, ry+1, 2, g_colors.highlight);
			};
		};

		if (this.drag_id > -1 && this.drag_hover_id == this.total) {
			var max = Math.min(this.total_rows, this.total);
			var Y = this.list_y + max * this.row_height + 1;
			gr.DrawLine(this.list_x, Y, this.list_x + this.list_w, Y, 2, g_colors.highlight);
		};

		// draw scrb
		if (this.show_scrb && this.need_scrb) {
			this.scrb.draw(gr);
		};
	};

	this.on_mouse = function(event, x, y, mask) {
		this.is_hover_area = this.is_hover_list(x, y);
		this.is_hover_scrb = this.scrb.is_hover_object(x, y);

		this.hover_id = -1;
		if (this.is_hover_area) {
			this.hover_id = Math.floor((y - this.list_y) / this.row_height) + this.start_id;
			if (this.hover_id < 0 || this.hover_id >= this.total) {
				this.hover_id = -1;
			}
		};

		switch (event) {
			case "move":
				this.scrb.on_mouse("move", x, y);
				if (this.drag_id > -1) {
					if (this.hover_id > -1) {
						this.drag_hover_id = this.hover_id;
					};
					if (this.total_rows < this.total) {
						if (y > this.list_y + this.total_rows * this.row_height) {
							this.drag_hover_id = this.total;
							//this.repaint();
						};
						// auto-scroll
						if (y < this.list_y + this.row_height / 2) {
							this.start_auto_scroll(1, function() {
								plm.drag_hover_id = plm.start_id;
							});
						} else if (y > this.list_y + this.list_h - this.row_height / 2) {
							this.start_auto_scroll(-1, function() {
								plm.drag_hover_id = plm.start_id + plm.total_rows;
							});
							if (!this.check_start_id()) {
								this.drag_hover_id = this.total;
							};
						}
					} else {
						if (y < this.list_y) this.drag_hover_id = 0;
						if (y > this.list_y + this.total * this.row_height) {
							this.drag_hover_id = this.total;
						}
					};

					if (this.drag_hover_id != this.drag_hover_id_saved) {
						this.drag_hover_id_saved = this.drag_hover_id;
						this.repaint();
					};
				};

				if (dragdrop.handles_in != null) {
					if (this.hover_id > -1 && this.hover_id != this.active_id) {
						this.dragdrop.target_id = this.hover_id;
						var offset = plman.PlaylistItemCount(this.hover_id);
						plman.InsertPlaylistItems(this.hover_id, offset, dragdrop.handles_in, false);

						window.ClearTimeout(this.dragdrop.timer);
						this.dragdrop.active = true;
						this.repaint();
						this.dragdrop.timer = window.SetTimeout(function() {
							plm.dragdrop.active = false;
							plm.repaint();
						}, 500);
					};
					dragdrop.handles_in = null;
				};

				if (this.hover_id != this.hover_id_saved) {
					this.hover_id_saved = this.hover_id;
					this.repaint();
				};

				if (this.drag_id > -1) {
					window.SetCursor(32651);
				} else {
					window.SetCursor(32512);
				};
				break;
			case "down":
				if (this.is_hover_scrb) {
					this.scrb.on_mouse("down", x, y, mask);
				} else {
					if (this.hover_id > -1) {
						if (this.hover_id != this.active_id) {
							this.active_id = this.hover_id;
							this.repaint();
							plman.ActivePlaylist = this.active_id;
						} else {
							this.drag_id = this.hover_id;
						}
					}
				}
				break;
			case "dblclk":
				if (this.is_hover_scrb) {
					this.scrb.on_mouse("down", x, y);
				} else {
					if (this.hover_id > -1) {
						plman.PlayingPlaylist = this.hover_id;
						fb.Play();
						fb.RunMainMenuCommand("View/Show now playing");
					}
				};
				break;
			case "up":
				this.scrb.on_mouse("up", x, y);
				if (this.drag_id > -1) {
					if (this.drag_hover_id > -1) {
						var target_id = Math.min(this.total-1, this.drag_hover_id);
						if (this.drag_id != target_id) {
							plman.MovePlaylist(this.drag_id, target_id);
						};
					};
					this.drag_id = -1;
					this.drag_hover_id = -1;
					this.repaint();
				}
				if (this.auto_scrolling) {
					this.stop_auto_scroll();
				};
				break;
			case "right":
				if (this.is_hover_area) {
					this.context_menu(x, y, this.hover_id);
					this.repaint();
				};
				break;
			case "leave":
				if (!this.right_clicked) {
					this.hover_id = -1;
					this.hover_id_saved = -1;
					this.repaint();
				};
				break;
			case "wheel":
				this.scrb.on_mouse("wheel", 0, 0, mask);
				break;
		};
	};

	this.on_drag = function(event, action, x, y, mask) {
		this.dragdrop.is_hover_area = this.is_hover_list(x, y);
		switch (event) {
			case "enter":
				dragdrop.drag_file = true;
				break;
			case "over":
				this.dragdrop.target_id = -1;
				if (this.dragdrop.is_hover_area) {
					this.dragdrop.target_id = Math.floor((y - this.list_y) / this.row_height + this.start_id);
					if (this.dragdrop.target_id < 0) {
						this.dragdrop.target_id = -1;
					};
					if (this.dragdrop.target_id > this.total) {
						this.dragdrop.target_id = this.total;
					};
				};

				if (this.dragdrop.target_id_saved !== this.dragdrop.target_id) {
					this.dragdrop.target_id_saved = this.dragdrop.target_id;
					this.repaint();
				};

				if (this.total > this.total_rows) {
					if (y < this.list_y + this.row_height / 2) {
						this.start_auto_scroll(1, function() {
							plm.dragdrop.target_id = -1;
							if (plm.dragdrop.is_hover_area) {
								plm.dragdrop.target_id = Math.floor((y - plm.list_y) / plm.row_height) + plm.start_id;
								if (plm.dragdrop.target_id < 0) {
									plm.dragdrop.target_id = -1;
								};
								if (plm.dragdrop.target_id > plm.total) {
									plm.dragdrop.target_id = plm.total;
								};
							};
						}) // end of callback
					};
					if (y > this.list_y + this.list_h - this.row_height / 2) {
						this.start_auto_scroll(-1, function() {
							plm.dragdrop.target_id = -1;
							if (plm.dragdrop.is_hover_area) {
								plm.dragdrop.target_id = Math.floor((y - plm.list_y) / plm.row_height) + plm.start_id;
								if (plm.dragdrop.target_id < 0) {
									plm.dragdrop.target_id = -1;
								};
								if (plm.dragdrop.target_id > plm.total) {
									plm.dragdrop.target_id = plm.total;
								};
							};
						}); // end of callback
					};
				};
				break;
			case "drop":
				if (this.dragdrop.target_id == -1) return;
				dragdrop.drag_file = false;
				if (this.dragdrop.target_id < this.total) {
					action.ToPlaylist();
					action.Playlist = this.dragdrop.target_id;
					action.ToSelect = false;
				};
				window.ClearTimeout(this.dragdrop.timer);
				this.dragdrop.active = true;
				this.repaint();
				this.dragdrop.timer = window.SetTimeout(function() {
					plm.dragdrop.active = false;
					plm.repaint();
				}, 500);
				this.dragdrop.target_id = -1;
				break;
			case "leave":
				dragdrop.drag_file = false;
				if (this.auto_scrolling) {
					this.stop_auto_scroll();
				};
				break;
		}; // eos
	}; // eom

	this.context_menu = function(x, y, plid) {

		this.right_clicked = true;

		var _menu = window.CreatePopupMenu();
		var _np = window.CreatePopupMenu();
		var add_mode = (plid == null || plid < 0);
		var is_auto = fb.IsAutoPlaylist(plid);
		var idx;

		if (!add_mode) {
			_menu.AppendMenuItem(MF_STRING, 100, "Rename");
			_menu.AppendMenuItem(MF_STRING, 101, "Delete");
			_menu.AppendMenuItem(MF_STRING, 102, "Duplicate");
			_menu.AppendMenuItem(MF_STRING, 103, "Save...");
			_menu.AppendMenuSeparator();
			_np.AppendTo(_menu, MF_STRING, "Insert...");
		} else {
			plid = plman.PlaylistCount;
			_np.AppendTo(_menu, MF_STRING, "Add...");
		};

		_menu.AppendMenuItem(MF_STRING, 104, "Load playlist...");

		if (!add_mode) {
			if (is_auto) {
				_menu.AppendMenuSeparator();
				_menu.AppendMenuItem(MF_STRING, 105, "Edit autoplaylist...");
				_menu.AppendMenuItem(MF_STRING, 106, "Convert to a normal playlist");
			};
		};

		_np.AppendMenuItem(MF_STRING, 200, "New playlist...");
		_np.AppendMenuItem(MF_STRING, 201, "New autoplaylist...");

		idx = _menu.TrackPopupMenu(x, y);

		switch (idx) {
			case 100:
				break;
			case 101:
				plman.RemovePlaylist(plid);
				if (plid < plman.PlaylistCount) {
					plman.ActivePlaylist = plid;
				};
				break;
			case 102:
				break;
			case 103:
				fb.SavePlaylist();
			case 104:
				fb.LoadPlaylist();
				break;
			case 105:
				break;
			case 106:
				break;
			case 200:
				break;
			case 201:
				break;
		};

		_np.Dispose();
		_menu.Dispose();

		this.right_clicked = false;

		return true;
	};

};


Cover = function() {
	this.image_obj = [];
	this.display_id = prop.cover_art.albumart_id;
	this.get_album_art = function(metadb) {
		if (metadb == null) {
			this.image_obj[this.display_id] = null;
			this.repaint();
			return;
		};

		this.grp = $(prop.cover_art.grp_format, metadb);

		if (this.grp == this.grp_saved) {
			(this.image_obj[this.display_id] == null) && this.repaint();
			return;
		};

		this.display_id = prop.cover_art.albumart_id;
		this.image_obj = [];
		this.repaint(); // "Loading" will be visible;
		this.timer && window.ClearInterval(this.timer);
		var art_id = 0;

		this.timer = window.SetInterval(function() {
			utils.GetAlbumArtAsync(window.ID, metadb, (art_id == 3) ? art_id = 4 : art_id);
			(art_id >= 3) && window.ClearInterval(aart.timer);
			art_id++;
		}, 50);

		this.grp_saved = this.grp;
	};

	this.on_get_album_art_done = function(metadb, art_id, image, image_path) {
		if (!image) {
			this.image_obj[art_id] = null;
			(this.display_id == art_id) && this.repaint();
			return;
		};

		if (art_id == 4) art_id = 3;

		var art_w = image.Width;
		var art_h = image.Height;
		var max_size = prop.cover_art.max_size;

		if (this.grp == $(prop.cover_art.grp_format, metadb)) {
			if (art_w > art_h) {
				if (art_h > max_size) {
					var r = art_w / art_h;
					var new_h = max_size;
					var new_w = new_h * r;
					image = image.Resize(new_w, new_h, 0);
				};
			} else {
				if (art_w > max_size) {
					var r = art_h / art_w;
					var new_w = max_size;
					var new_h = new_w * r;
					image = image.Resize(new_w, new_h, 0);
				};
			};

			var is_embedded = (image_path.slice(image_path.lastIndexOf(".") + 1) == $("$ext(%path%)", metadb));
			this.image_obj[art_id] = {};
			this.image_obj[art_id].img = image;
			this.image_obj[art_id].w = image.Width;
			this.image_obj[art_id].h = image.Height;
			this.image_obj[art_id].path = image_path;
			this.image_obj[art_id].is_embedded = is_embedded;

		};

		if (art_id == this.display_id) {
			this.calc_scale(this.image_obj[this.display_id]);
			this.repaint();
		};
	};

	this.repaint = function() {
		repaint_main1 = repaint_main2;
	//	window.RepaintRect(this.x, this.y, this.w, this.h);
	};

	this.calc_scale = function(art_obj) {
		if (!art_obj) return;

		var art_w = art_obj.w;
		var art_h = art_obj.h;

		var sx = 0;
		var sy = 0;
		var sw = this.area_w / art_w;
		var sh = this.area_h / art_h;
		var s = Math.min(sw, sh);

		if (sw > sh) {
			sx = Math.floor((this.area_w - art_w * s) / 2);
		};
		/*
		else {
			sy = Math.floor((this.area_h - art_h * s) / 2);
		}
		*/

		this.art_x = this.area_x + sx;
		this.art_y = this.area_y + sy;
		this.art_w = Math.max(0, Math.floor(art_w * s));
		this.art_h = Math.max(0, Math.floor(art_h * s));
	};

	this.margin = prop.margin;

	this.set_size = function(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.area_x = this.x + this.margin;
		this.area_y = this.y + this.margin;
		this.area_w = this.w - this.margin * 2;
		this.area_h = this.h - this.margin * 2;
		this.calc_scale(this.image_obj[this.display_id]);
	};

	this.draw = function(gr) {
		var art = this.image_obj[this.display_id];
		var font = gdi.Font("Segoe UI", 24, 0);
		var color = g_colors.txt_normal & 0x25ffffff;
		// bg
		gr.FillSolidRect(this.x, this.y, this.w, this.h, g_colors.bg_normal);
		// art
		if (art) {
			if (this.art_w + this.art_h > 10) {
				try {
					gr.DrawImage(art.img, this.art_x + 2, this.art_y + 2, this.art_w - 4, this.art_h - 4, 0, 0, art.w, art.h, 0, 225);
				} catch (e) {};
				if (this.display_id !== AlbumArtId.disc) {
					gr.DrawRect(this.art_x, this.art_y, this.art_w - 1, this.art_h - 1, 1, color);
				}
			}
		} else if (art === null) {
			gr.GdiDrawText("No Cover", font, color, this.x, this.y, this.w, this.h, dt_cc);
		} else {
			gr.GdiDrawText("Loading", font, color, this.x, this.y, this.w, this.h, dt_cc);
		};
	};

};


//////////////////////////////////////////// globals

var dt_cc = DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var dt_lc = DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var ww, wh;
var repaint_main = true, repaint_main1 = true, repaint_main2 = true;
var repaint_cover = true, repaint_cover1 = true, repaint_cover2 = true;
var window_visible = false;
var repaint_counter = 0;
var repaint_forced = false;
var rpt_timer = null, cover_rpt_timer = null;
//
var plm, aart;
//
var g_colors = {};
var g_fonts = {};
var images = {
	list: null,
	list_auto: null,
	list_search: null
};

var colorscheme = {
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

var dragdrop = {
	drag_file: false,
	handles_in: null,
	handles_out: null,
};

//
prop = new function() {
	this.use_sys_color = window.GetProperty("_prop: colorscheme use system color", false);
	this.colorscheme = window.GetProperty("_prop: colorscheme name(dark, light, user)", "light");
	this.margin = window.GetProperty("_prop: margin", 15);
	this.cover_art = {
		grp_format: window.GetProperty("_prop_cover_art: group format", "%album artist% | %album%"),
		albumart_id: window.GetProperty("_prop_cover_art: displayed albumart id", AlbumArtId.front),
		max_size: window.GetProperty("_prop_cover_art: maximum image size", 300),
	};
	this.font_name = "Segoe UI";
	this.scrb_width = 10;
};
		
{ // on startup
	aart = new Cover();
	aart.get_album_art(fb.IsPlaying ? fb.GetNowPlaying() : fb.GetFocusItem());
	plm = new PlaylistManager();
	//
	get_fonts();
	get_colors();
	get_images();
}

//////////////////////////////////////////// callbacks
function on_size() {
	if (!window.Width || !window.Height) return;
	ww = window.Width;
	wh = window.Height;
	
	var th = 24;
	var p2 = 2;
	var ax = 0;
	var ay = 0 + th;
	var aw = ww;
	var ah = Math.min(wh-ay, 300, aw);
	aart.set_size(ax, ay, aw, ah);
	plm.set_size(ax, ay+ah+p2, aw, wh-ay-ah-p2);
};

function on_paint(gr) {
	gr.FillSolidRect(0, 0, ww, wh, blendColors(g_colors.bg_normal, 0xff000000, 0.02));
	gr.FillSolidRect(0, 0, ww, 24, RGB(84, 86, 82));

	if (repaint_main || !repaint_forced) {
		repaint_main = false;
		repaint_forced = false;
		aart.draw(gr);
		plm.draw(gr);
	};

	repaint_counter++;
	if (repaint_counter > 500) {
		repaint_counter = 0;
		CollectGarbage();
	};
};

//////// mouse event callbacks

function on_mouse_move(x, y, mask) {
	plm.on_mouse("move", x, y);
};

function on_mouse_lbtn_down(x, y, mask) {
	window.NotifyOthers("AnotherPanelIsClicked", 0);
	plm.on_mouse("down", x, y);
};

function on_mouse_lbtn_up(x, y, mask) {
	plm.on_mouse("up", x, y);
};

function on_mouse_rbtn_up(x, y, mask) {
	plm.on_mouse("right", x, y);
	return true;
};

function on_mouse_lbtn_dblclk(x, y, mask) {
	plm.on_mouse("dblclk", x, y);
};

function on_mouse_wheel(delta) {
	plm.on_mouse("wheel", 0, 0, delta);
}

function on_mouse_leave() {
	plm.on_mouse("leave");
};

//// playback callbacks

function on_playback_starting(cmd, is_paused) {
	if (cmd == 6) {
		aart.get_album_art(fb.GetNowPlaying());
		plm.repaint();
	};
};

function on_playback_new_track(metadb) {
	aart.get_album_art(metadb);
};

function on_playback_stop(reason) {
	if (reason !== 2) {
		aart.get_album_art(fb.GetFocusItem());
		plm.repaint();
	};
};

///// playlist callbacks

function on_playlist_switch() {
	plm.active_id = plman.ActivePlaylist;
	plm.repaint();
};

function on_playlists_changed() {
	plm.active_id = plman.ActivePlaylist;
	plm.update_list(true);
};

function on_playlist_items_added(playlist) {
	plm.update_list(true);
}

function on_playlist_items_removed(playlist, new_count) {
	plm.update_list(true);
};

///// dragdrop callbacks

function on_drag_enter() {
	plm.on_drag("enter");
};

function on_drag_over(action, x, y, mask) {
	plm.on_drag("over", action, x, y, mask);
};

function on_drag_drop(action, x, y, mask) {
	plm.on_drag("drop", action, x, y, mask);
};

function on_drag_leave() {
	plm.on_drag("leave");
};

///// misc
function on_get_album_art_done(metadb, art_id, image, image_path) {
	aart.on_get_album_art_done(metadb, art_id, image, image_path);
};

function on_item_focus_change(playlist, from, to) { 
	if (!fb.IsPlaying) aart.get_album_art(fb.GetFocusItem());
};

function on_colors_changed() {
	get_colors();
	get_images();
	window.Repaint();
};

function on_notify_data(name, info) {
	switch (name) {
		case "WshPlaylistDragDrop":
			dragdrop.handles_in = info;
			break;
	};
};



//////////////////////////////////////////// functions

function get_fonts() {
	g_fonts.name = prop.font_name;
	g_fonts.item = gdi.Font(g_fonts.name, 12);
	g_fonts.header = gdi.Font(g_fonts.name, 14);
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

function get_images() {
	var fontAwesome = gdi.Font("FontAwesome", 14, 0);
	var w = 22;
	var normal_color, playing_color, c;
	var s, img_arr, img, g;
	var sf = StringFormat(1, 1);

	normal_color = g_colors.txt_normal;
	playing_color = g_colors.highlight;

	img_arr = [];
	for (s = 0; s < 2; s++) {
		c = normal_color;
		if (s == 1) {
			c = playing_color;
		};

		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);
		//
		g.DrawString("\uf001", fontAwesome, c, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.list = img_arr;

	img_arr = [];
	for (s = 0; s < 2; s++) {
		c = ((s == 1) ? playing_color : normal_color);
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);
		g.DrawString("\uf013", fontAwesome, c, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.list_auto = img_arr;

	img_arr = [];
	for (s = 0; s < 2; s++) {
		c = ((s == 1) ? playing_color : normal_color);
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);
		g.DrawString("\uf002", fontAwesome, c, 0, 0, w, w, sf);
		img.ReleaseGraphics(g);
		img_arr[s] = img;
	};
	images.list_search = img_arr;

};


if (rpt_timer) {
	window.ClearInterval(rpt_timer);
	rpt_timer = false;
};

rpt_timer = window.SetInterval(function() {
	if (!window.IsVisible) {
		window_visible = false;
		return;
	};

	var repaint_1 = false;

	if (!window_visible) {
		window_visible = true;
		on_mouse_lbtn_down(3, 3, 0);
		on_mouse_lbtn_up(3, 3, 0);
	};

	if (repaint_main1 == repaint_main2) {
		repaint_main2 = !repaint_main1;
		repaint_1 = true;
	};

	if (repaint_1) {
		repaint_forced = true;
		repaint_main = true;
		window.Repaint();
	};
}, 35);

if (cover_rpt_timer) {
	window.ClearInterval(cover_rpt_timer);
	cover_rpt_timer = false;
};

cover_rpt_timer = window.SetInterval(function() {
	if (!window.IsVisible) {
		window_visible = false;
		return;
	};

	var repaint_1 = false;

	if (repaint_cover1 == repaint_cover2) {
		repaint_cover2 = !repaint_cover1;
		repaint_1 = true;
	};

	if (repaint_1) {
		repaint_forced = true;
		repaint_main = true;
		window.Repaint();
	};
}, 5);

