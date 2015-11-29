// vim:set ft=javascript bomb et:
// ================================================== //
// @name "Playlist"
// @update "2015-11-29 18:34"
// ================================================== //

// Everything put into this function!

// Image cache module, save loaded images in a cache list.
// Crop from Br3tt's Wsh_Playlist.2.0.1
ImageCache = function(art_id) {
    this.__cache = {};
    //this.art_id = art_id;
    // art_id: 0: front, 1: back, 2: disc, 3: icon, 4: artist, 5: genre, others...;
    this.hit = function(metadb, grp_id) {
        var img = this.__cache[pl.groups[grp_id].name];
        if (img) return img;
        if (typeof(img) == "undefined" || img == null) {
            // if image not in cache list, load
            if (!cover.load_timer) {
                cover.load_timer = window.SetTimeout(function() {
                    if (g_cover_id < 5) {
                        if (!pl.auto_scrolling)
                            utils.GetAlbumArtAsync(window.ID, metadb, g_cover_id, true, false, false);
                        cover.load_timer && window.ClearTimeout(cover.load_timer);
                        cover.load_timer = false;
                    };
                }, 45);
            };
        };
    };

    this.get_it = function(metadb, grp_id, image) {
        var cw = cover.max_w;
        var ch = cw;
        var img;

        // calc scale
        if (cover.k13o) { // keep aspectratio
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
        this.__cache[pl.groups[grp_id].name] = img;
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


Group = function(metadb, first_id, name) {
    this.metadb = metadb;
    this.firstID = first_id;
    this.name = name;
    this.collapsed = prop.auto_collaspe;
    this.lastID = -1;
    this.count = 0;
};

Item = function(metadb, type, list_id, grp_id) {
    this.metadb = metadb;
    this.type = type;
    this.list_id = list_id;
    this.grp_id = grp_id;
};

var Pattern = {
    album: "%album artist% ||| %album% ||| %discnumber% ||| %tracknumber%",
};


Playlist = function() {
    this.margin = prop.margin;
    this.handles = null;
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

        this.start_id = this.start_arr[g_active_pl];
        this.check_start_id();
        window.SetProperty("sys.List start id", this.start_arr.toString());
    };

    this.save_start_id = function() {
        this.start_arr[g_active_pl] = this.start_id;
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

    this.set_size = function(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.on_size();
    }
    
    this.on_size = function() {
        //
        this.list_x = this.x + this.margin;
        this.list_y = this.y + this.margin;
        this.list_w = this.w - this.margin * 2;
        this.list_h = this.h - this.margin * 2;
        //
        this.total_rows = Math.floor(this.list_h / this.row_height);
        this.visible_rows = Math.max(0, Math.min(this.total_rows, this.total));
        this.check_start_id();
        //
        this.need_scrb = this.total > this.total_rows;
        if (this.need_scrb && this.show_scrb) {
            this.list_w = this.list_w - this.scrb_width - this.scrb_right;
            this.scrb.set_size(this.list_x+this.list_w+this.scrb_right, this.list_y, this.scrb_width, this.list_h);
        }
    }

    this.collapse_group = function(grp_id) {
        if (!this.groups[grp_id]) return;
        if (this.groups[grp_id].collapsed) return;

        var befor, tot;

        for (var i = 0; i < this.total; i++) {
            if (this.items[i].type > 0 && this.items[i].grp_id == grp_id) {
                befor = this.items.slice(0, i + prop.group_header_rows);
                tot = Math.max(this.groups[grp_id].lastID - this.groups[grp_id].firstID + 1, prop.group_minimum_rows) + prop.group_extra_rows;
                this.items = this.items.slice(i + prop.group_header_rows + tot, this.items.length);
                this.items = befor.concat(this.items);
                break;
            };
        };
        this.groups[grp_id].collapsed = true;
        this.total = this.items.length;
        this.on_size();
    };

    this.expand_group = function (grp_id) {
        if (!this.groups[grp_id]) return;
        if (!this.groups[grp_id].collapsed) return;
        //
        for (var i = 0; i < this.total; i++) {
            if (this.items[i].type > 0 && this.items[i].grp_id == grp_id) {
                var after = this.items.slice(i+prop.group_header_rows, this.items.length);
                this.items = this.items.splice(0, i+prop.group_header_rows);
                var item_id = i + prop.group_header_rows;
                var end = this.groups[grp_id].firstID + Math.max(this.groups[grp_id].track_total, prop.group_minimum_rows) + prop.group_extra_rows;
                for (var j = this.groups[grp_id].firstID; j < end; j++) {
                    this.items[item_id] = {};
                    switch (true) {
                        case (j <= this.groups[grp_id].lastID): 
                            this.items[item_id] = new Item(this.handles.Item(j), 0, j, grp_id);
                            break;
                        case (j > this.groups[grp_id].lastID && j < this.groups[grp_id].firstID + prop.group_minimum_rows):
                            this.items[item_id] = new Item(this.handles.Item(j), -1, null, grp_id);
                            break;
                        default:
                            this.items[item_id] = new Item(null, -2, null, grp_id);
                            break;
                    };
                    item_id++;
                };
                this.items = this.items.concat(after);
                after = null;
                break;
            };
        };
        this.groups[grp_id].collapsed = false;
        this.total = this.items.length;
        this.on_size();
    };


    // item_types - group-header: > 0, track: == 0, 填充物: == -1, 隔离物: == -2;
    
    this.init_list = function() {
        // -- init --
        this.handles = plman.GetPlaylistItems(g_active_pl);
        this.list_total = this.handles.Count;
        this.groups = [];
        this.items = [];
        CollectGarbage();

        this.get_list(0, "!@#");
    }

    this.get_list = function(start, compare) {
        //
        var idx_start = start;
        var gid = this.groups.length;
        var iid = this.items.length;
        var profiler = fb.CreateProfiler("Init");
        var metadb = null;
        var temp = "";
        //
        while (idx_start < this.list_total) {
            if (profiler.Time > 30) {
                this.set_list_();
                break;
            }
            metadb = this.handles.Item(idx_start);
            temp = $(prop.group_format, metadb);
            if (temp != compare) {
                compare = temp;
                this.groups[gid] = new Group(metadb, idx_start, temp);
                if (gid > 0) {
                    this.groups[gid-1].track_total = idx_start - this.groups[gid-1].firstID;
                    this.groups[gid-1].lastID = idx_start - 1;
                    var gt_total = this.groups[gid-1].track_total;
                    ///
                    if (!this.groups[gid-1].collapsed) {
                        if (gt_total < prop.group_minimum_rows) {
                            var to_add = prop.group_minimum_rows - gt_total;
                            for (var k = 0; k < to_add; k++) {
                                this.items[iid] = new Item(metadb, -1, null, gid - 1);
                                iid++;
                            }
                        }
                        ///
                        for (var k = 0; k < prop.group_extra_rows; k++) {
                            this.items[iid] = new Item(null, -2, null, gid - 1);
                            iid++;
                        }
                    }

                }

                ///
                if (prop.show_group_header) {
                    //is
                    for (var k = 0; k < prop.group_header_rows; k++) {
                        this.items[iid++] = new Item(metadb, k+1, null, gid);
                    }
                }

                gid++
            }

            // track items, type = 0
            if (!this.groups[gid-1].collapsed) {
                this.items[iid++] = new Item(metadb, 0, idx_start, gid-1);
            }

            idx_start++;
        } // eol

        if (gid > 0) {
            ///
            this.groups[gid-1].track_total = idx_start - this.groups[gid-1].firstID;
            this.groups[gid-1].lastID = idx_start - 1;
            var gt_total = this.groups[gid-1].track_total;
            ///
            if (!this.groups[gid-1].collapsed) {
                if (gt_total < prop.group_minimum_rows) {
                    var to_add = prop.group_minimum_rows - gt_total;
                    for (var k = 0; k < to_add; k++) {
                        this.items[iid++] = new Item(metadb, -1, null, gid - 1);
                    }
                }
                ///
                var toadd = Math.max(prop.group_extra_rows, Math.floor(this.total_rows/2));
                for (var k = 0; k < toadd; k++) {
                    this.items[iid++] = new Item(null, -2, null, gid - 1);
                }
            }
        }

        ////
        if (idx_start == this.list_total) {
            this.set_list_();
            //
        } else {
            this.load_timer && window.ClearTimeout(this.load_timer);
            this.load_timer = window.SetTimeout(function() {
                pl.get_list(idx_start, compare);
            }, 30);
        }

    }

    this.set_list_ = function() {
        this.total = this.items.length;
        this.on_size();
        this.get_start_id();
        this.scrb.update_cursor();
        this.name = plman.GetPlaylistName(g_active_pl);
        plman.SetActivePlaylistContext();
        window.Repaint();
    }

    this.load = false;

    this.init_list();

    this.draw = function(gr) {
        //var Time = fb.CreateProfiler();

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

        var g_is_odd = false;

        //console("paint starting >>>");

        if (this.total > 0) { // draw list items

            var total_grps = pl.groups.length;
            for (var i = 0; i < total_grps; i++) {
                pl.groups[i].is_focused = false;
                if (g_focus_id >= pl.groups[i].firstID && g_focus_id <= pl.groups[i].lastID) {
                    pl.groups[i].is_focused = true;
                };
            };

            this.get_playing_item();

            rx = this.list_x;
            rw = this.list_w;

            var grp_id_saved;

            for (var i = 0; i < this.visible_rows; i++) {

                ry = this.list_y + i * this.row_height;
                rh = this.row_height;

                item_id = this.start_id + i;
                this.items[item_id].y = ry;
                item = this.items[item_id];
                if (item.type > -1) {
                    metadb = item.metadb;
                };

                // Group header
                if (item.type > 0) {
                    grp_id = item.grp_id;
                    if (grp_id !== grp_id_saved) {

                        g_is_odd = false;

                        //================
                        // draw grp header
                        //================
                        grp_y = (i == 0) && item.type > 1 ? ry - (item.type - 1) * rh : ry;
                        grp_h = grp_header_rows * rh;
                        this.groups[grp_id].y = grp_y;

                        // bg
                        gr.FillSolidRect(rx, grp_y, rw, grp_h, g_colors.txt_normal & 0x07ffffff);
                        gr.FillSolidRect(rx, grp_y, rw, 1, g_colors.txt_normal & 0x14ffffff);
                        if (grp_id == pl.groups.length - 1 && pl.groups[grp_id].collapsed) {
                            gr.FillSolidRect(rx, grp_y + grp_h - 1, rw, 1, g_colors.txt_normal & 0x14ffffff);
                        };

                        if (this.is_group_selected(grp_id)) {
                            gr.FillSolidRect(rx, grp_y, rw, grp_h, 0x55ffffff & g_colors.bg_selected);
                        };

                        // focused rect
                        if (prop.show_focus_item && this.groups[grp_id].is_focused && this.groups[grp_id].collapsed) {
                            gr.DrawRect(rx, grp_y, rw - 1, grp_h - 1, 1, RGB(127, 127, 127));
                        }

                        if (grp_h > 59) {

                            // ## cover art ##
                            //
                            var cx = rx;
                            var cw = 0;
                            if (prop.show_cover) {
                                //
                                this.groups[grp_id].grp_img = img_cache.hit(metadb, grp_id);
                                var img = this.groups[grp_id].grp_img;
                                //
                                if (prop.show_group_header ) {
                                    var cp = (grp_h - cover.max_w) / 2;
                                    var cx = rx + cp;
                                    var cy = grp_y + cp;
                                    var cw = grp_h - cp * 2;
                                    cover.x = cx;
                                    cover.w = cw;
                                    if (img) {
                                        var img_w = img.Width;
                                        var img_h = img.Height;
                                        var img_x = cx + (cw - img_w) / 2;
                                        var img_y = cy + (cw - img_h) / 2;
                                        gr.FillSolidRect(img_x - 2, img_y - 2, img_w + 4, img_h + 4, g_colors.txt_normal & 0x55ffffff);
                                        gr.DrawImage(img, img_x, img_y, img_w, img_h, 0, 0, img.Width, img.Height, 0, 205);
                                    } else {
                                        gr.FillSolidRect(cx, cy, cw, cw, g_colors.txt_normal & 0x55ffffff);
                                        gr.FillSolidRect(cx+2, cy+2, cw-4, cw-4, blendColors(g_colors.bg_normal, 0xff000000, 0.2));
                                        gr.GdiDrawText("Loading", g_fonts.item_14b, g_colors.txt_bg_05, cx, cy, cw, cw, dt_cc);
                                    };
                                }
                            };

                            // album
                            if (!this.groups[grp_id].album || force_repaint) {
                                //
                                var date = $("[%date%]", metadb).trim().slice(0,4);
                                //
                                var album = $("%album%", metadb);
                                var nameArr = "微软雅黑,segoe ui,segoe ui semibold";
                                if (nameArr.indexOf(g_fonts.header1.Name.toLowerCase()) < 0) {
                                    album = album.replace("・", "\u00b7");
                                };
                                //
                                var genre = $("[%genre%]", metadb);
                                var artist = $("%album artist%", metadb);

                                this.groups[grp_id].album = album;
                                this.groups[grp_id].date = date;
                                this.groups[grp_id].genre = genre;
                                this.groups[grp_id].artist = artist;
                            } else {
                                var album = this.groups[grp_id].album;
                                var date = this.groups[grp_id].date;
                                var genre = this.groups[grp_id].genre;
                                var artist = this.groups[grp_id].artist;
                            }
                            // ## line 1 ##

                            var p = 10;
                            var color_l1 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.2);
                            //var color_l1 = g_colors.txt_normal;
                            // date
                            var date_w = GetTextWidth(date, g_fonts.header1);
                            var date_x = rx + rw - date_w - p;
                            var date_y = grp_y + (grp_h - 50) / 2 ;
                            gr.GdiDrawText(date, g_fonts.header1, color_l1, date_x, date_y, date_w, grp_h, dt_lt);
                            //console(album);
                            //var album = $("%album%", metadb);
                            var album_x = cx + cw + p;
                            var album_w = date_x - album_x - p;
                            var album_y = date_y;
                            gr.GdiDrawText(album, g_fonts.header1, color_l1, album_x, album_y, album_w, grp_h, dt_lt);


                            // ## line 2 ##
                            //
                            var color_l2 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.4);

                            // genre
                            //var genre = $("[%genre%]", metadb);
                            var genre_w = GetTextWidth(genre, g_fonts.header2);
                            var genre_x = rx + rw - genre_w - p;
                            var genre_y = date_y + 25;
                            gr.GdiDrawText(genre, g_fonts.header2, color_l2, genre_x, genre_y, genre_w, grp_h, dt_lt);
                            // artist
                            //var artist = $("%album artist%", metadb);
                            var artist_x = album_x;
                            var artist_w = genre_x - artist_x - p;
                            gr.GdiDrawText(artist, g_fonts.header2, color_l2, artist_x, genre_y, artist_w, grp_h, dt_lt);

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

                    is_selected = plman.IsPlaylistItemSelected(g_active_pl, item.list_id);
                    is_playing = (plman.PlayingPlaylist == g_active_pl && plman.GetPlayingItemLocation().PlaylistItemIndex == item.list_id);
                    is_focused = plman.GetPlaylistFocusItemIndex(g_active_pl) == item.list_id;
                    if (is_playing) this.playing_item_visible = true;

                    if (prop.odd_even_rows) {
                        if (g_is_odd) {
                            gr.FillSolidRect(rx, ry+1, rw, rh-1, odd_color);
                        }
                        else gr.FillSolidRect(rx, ry+1, rw, rh-1, even_color);
                        g_is_odd = !g_is_odd;
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

                    var queue_id = plman.FindPlaybackQueueItemIndex(metadb, g_active_pl, item.list_id) ;

                    var p = 5;
                    // track number
                    var tn_x = rx + p * 4;
                    var tn_w = 30;

                    if (queue_id > -1) { //if (is_queued) 
                        var tn = "*" + num(queue_id + 1, 2);
                        gr.DrawRect(tn_x + 5, ry+3, tn_w, rh-7, 1, g_colors.highlight & 0x55ffffff);
                        gr.GdiDrawText(tn, g_fonts.item_bold, g_colors.highlight, tn_x, ry, tn_w, rh, dt_rc);
                    } else { //  track number
                        if (prop.group_format.indexOf("%discnumber%") > -1) {
                            var tn = $("%tracknumber%", metadb);
                        } else {
                            var tn = $("$ifgreater(%totaldiscs%,1,[%discnumber%.],)%tracknumber%", metadb);
                        };
                        gr.GdiDrawText(tn, g_fonts.item, font_color, tn_x, ry, tn_w, rh, dt_rc);
                    };

                    // rating
                    var p = 8;
                    track_rating.x = rx + rw;
                    if (prop.show_rating) {
                        var rating = $("%rating%", metadb);
                        var star_w  = 14;
                        var color = blendColors(font_color, g_colors.bg_normal, 0.2);
                        track_rating.w = star_w * 5;
                        track_rating.x = track_rating.x - p - track_rating.w;

                        for (var r = 0; r < 5; r++) {
                            var star_x = track_rating.x + r * star_w;
                            var font = (r < rating ? g_fonts.rating1 : g_fonts.rating2);
                            gr.GdiDrawText(r < rating ? "\u2605" : "\u2219", font, color, star_x, ry, star_w, rh, dt_cc);
                        };
                    };

                    // length
                    var p = 10;
                    var trk_length = $("%length%", metadb);
                    var trk_length_w = 40;
                    var trk_length_x = track_rating.x - trk_length_w - p;
                    gr.GdiDrawText(trk_length, g_fonts.item, font_color, trk_length_x, ry, trk_length_w, rh, dt_rc);
                    // count
                    var count_w = 0;
                    var p = 0;
                    if (prop.show_play_count) {
                        var p = 5;
                        var count = $("[%play_count%]", metadb);
                        var count_w = 25;
                    };
                    var count_x = trk_length_x - count_w - p;
                    if (count_w > 0) gr.GdiDrawText(count, g_fonts.item, blendColors(font_color, g_colors.bg_normal, 0.5), count_x, ry, count_w, rh, dt_rc);
                    // title
                    var p = 5;
                    var title = $("%title%", metadb);
                    var title_x = tn_x + tn_w + p * 2;
                    var title_w = count_x - title_x - p;
                    gr.GdiDrawText(title, g_fonts.item, font_color, title_x, ry, title_w, rh, dt_lc);

                } else if (item.type == -1) {
                    if (prop.odd_even_rows) {
                        if (g_is_odd) { gr.FillSolidRect(rx, ry+1, rw, rh-1, odd_color); }
                        else gr.FillSolidRect(rx, ry+1, rw, rh-1, even_color);
                        g_is_odd = !g_is_odd;
                    }
                }

            } // eol;
        } else { 
            // ---- draw text info if playlist is empty
            var font = gdi_font(g_fonts.name, 32, 1);
            gr.GdiDrawText("空列表", font, g_colors.txt_bg_05, this.list_x, this.list_y - 20, this.list_w, this.list_h, dt_cc);
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

        // dragdrop split line
        if (this.dragdrop.split_line_y > -1) {
            console(this.dragdrop.split_line_y);
            gr.FillSolidRect(this.list_x, this.dragdrop.split_line_y - 1, this.list_w, 2, g_colors.highlight & 0x88ffffff);
        };

        //Time.print();

    };

    this.is_hover_list = function(x, y) {
        return (x > this.list_x &&
                x < this.list_x + this.list_w &&
                y > this.list_y && y <this.list_y + this.list_h);
    };

    this.collapse_all = function() {
        var temp = prop.auto_collaspe;
        prop.auto_collaspe = true;
        this.init_list();
        prop.auto_collaspe = temp;
    };

    this.expand_all = function() {
        var temp = prop.auto_collaspe;
        prop.auto_collaspe = false;
        this.init_list();
        prop.auto_collaspe = temp;
    }

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

        plman.ClearPlaylistSelection(g_active_pl);
        plman.SetPlaylistSelection(g_active_pl, selected_indexes, true);
    };

    this.select_group_tracks = function(grp_id) {
        var selected_indexes = [];
        var end = this.groups[grp_id].lastID;
        var start = this.groups[grp_id].firstID;
        for (var i = start; i <= end; i++) {
            selected_indexes.push(i);
        }
        plman.SetPlaylistSelection(g_active_pl, selected_indexes, true);
    };

    this.start_auto_scroll = function(delta, on_scroll) {
        if (!this.auto_scrolling) {
            pl.scroll_timeout_timer = window.SetTimeout(function() {
                pl.scroll_interval_timer = window.SetInterval(function() {
                    var s = pl.scrb.scroll(delta);
                    if (s) {
                        on_scroll && on_scroll();
                        pl.repaint()
                    } else {
                        pl.stop_auto_scroll();
                        pl.save_start_id();
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
                            plman.ClearPlaylistSelection(g_active_pl);
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
                                this.SHIFT_start_id = this.groups[grp_id].firstID;
                                this.items_clicked = false;
                            } else {
                                plman.ClearPlaylistSelection(g_active_pl);
                                this.select_group_tracks(grp_id);
                                this.SHIFT_start_id = this.groups[grp_id].firstID;
                                this.items_clicked = true;
                            };
                            this.selecting = false;
                            plman.SetPlaylistFocusItem(g_active_pl, this.groups[grp_id].firstID);
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
                                if (g_focus_id != list_id && plman.IsPlaylistItemSelected(g_active_pl, g_focus_id)) {
                                    if (this.SHIFT_start_id > -1) {
                                        this.select_a_to_b(this.SHIFT_start_id, list_id);
                                    } else {
                                        this.select_a_to_b(g_focus_id, list_id);
                                    }
                                } else {
                                    plman.SetPlaylistSelectionSingle(g_active_pl, list_id, true);
                                    this.SHIFT_start_id = list_id;
                                };
                                plman.SetPlaylistFocusItem(g_active_pl, list_id);
                                this.items_clicked = false;
                                this.selecting = false;
                            } else if (ctrl_pressed) {
                                if (plman.IsPlaylistItemSelected(g_active_pl, list_id)) {
                                    plman.SetPlaylistSelectionSingle(g_active_pl, list_id, false);
                                } else {
                                    plman.SetPlaylistSelectionSingle(g_active_pl, list_id, true);
                                    plman.SetPlaylistFocusItem(g_active_pl, list_id);
                                }
                                this.SHIFT_start_id = list_id;
                                this.items_clicked = false;
                                this.selecting = false;
                            } else {
                                if (plman.IsPlaylistItemSelected(g_active_pl, list_id)) {
                                    this.items_clicked = true;
                                    this.items_clicked_id = this.hover_item_id;
                                    this.selecting = false;
                                } else {
                                    this.selecting = true;
                                    this.items_clicked = false;
                                    this.items_clicked_id = this.hover_item_id;
                                    plman.ClearPlaylistSelection(g_active_pl);
                                    plman.SetPlaylistSelectionSingle(g_active_pl, list_id, true);
                                };
                                plman.SetPlaylistFocusItem(g_active_pl, list_id);
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
                        //start_ = this.items[this.items_clicked_id].list_id;
                        start_ = g_focus_id;
                    };

                    if (this.hover_item_id == this.items_clicked_id) {
                        end_ = start_;
                    } else  if (this.items_clicked_id > -1 && this.hover_item && this.hover_item_id != this.items_clicked_id) {
                        if (this.hover_item.type == 0) {
                            end_ = this.hover_item.list_id;
                        } else if (this.hover_item.type > 0) {
                            var grp_id = this.hover_item.grp_id;
                            if (this.items_clicked_id > this.hover_item_id) {
                                end_ = this.groups[grp_id].firstID;
                            } else {
                                end_ = this.groups[this.hover_item.grp_id - 1].lastID;
                            };
                        } else {
                            var grp_id = this.hover_item.grp_id;
                            if (this.items_clicked_id > this.hover_item_id) {
                                end_ = this.groups[grp_id+1].firstID;
                            } else {
                                end_ = this.groups[grp_id].lastID;
                            };
                        }
                    };

                    if (this.total_rows > this.total && y > this.items[this.visible_rows - 1].y + this.row_height) {
                        end_ = this.list_total - 1;
                    };

                    if (y < this.list_y) {
                        var item_type = pl.items[pl.start_id].type;
                        var grp_id = pl.items[pl.start_id].grp_id;
                        if (item_type > 0) {
                            end_ = pl.groups[grp_id].firstID;
                        } else if (item_type < 0) {
                            end_ = pl.groups[grp_id + 1].firstID;
                        } else {
                            end_ = pl.items[pl.start_id].list_id;
                        };
                    } else if (y > this.list_y + this.list_h) {
                        var item_type = pl.items[pl.start_id + pl.visible_rows - 1].type;
                        var grp_id = pl.items[pl.start_id + pl.visible_rows - 1].grp_id;
                        if (item_type > 0) {
                            end_ = pl.groups[grp_id - 1].lastID;
                        } else if (item_type < 0) {
                            end_ = pl.groups[grp_id].lastID;
                        } else {
                            end_ = pl.items[pl.start_id + pl.visible_rows - 1].list_id;
                        };
                    };


                    // --- if mouse over header items, expand the group if collapsed
                    if (this.hover_item && this.hover_item.type > 0) {
                        if (this.groups[this.hover_item.grp_id].collapsed) {
                            this.expand_group(this.hover_item.grp_id);
                            start_ = g_focus_id;
                        };
                    };

                    this.select_a_to_b(start_, end_);

                    // --- auto-scroll
                    if (this.selecting && this.total_rows < this.total) {
                        //
                        if (y < this.list_y) {
                            this.start_auto_scroll(1, function() {
                                var item_type = pl.items[pl.start_id].type;
                                var grp_id = pl.items[pl.start_id].grp_id;
                                if (item_type > 0) {
                                    end_ = pl.groups[grp_id].firstID;
                                } else if (item_type < 0) {
                                    end_ = pl.groups[grp_id + 1].firstID;
                                } else {
                                    end_ = pl.items[pl.start_id].list_id;
                                };
                                pl.select_a_to_b(g_focus_id, end_);
                            });
                        } else if (y > this.list_y + this.list_h) {
                            this.start_auto_scroll(-1, function() {
                                var item_type = pl.items[pl.start_id + pl.visible_rows - 1].type;
                                var grp_id = pl.items[pl.start_id + pl.visible_rows - 1].grp_id;
                                if (item_type > 0) {
                                    end_ = pl.groups[grp_id - 1].lastID;
                                } else if (item_type < 0) {
                                    end_ = pl.groups[grp_id].lastID;
                                } else {
                                    end_ = pl.items[pl.start_id + pl.visible_rows - 1].list_id;
                                };
                                pl.select_a_to_b(g_focus_id, end_);
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
                            } else {
                                this.collapse_group(grp_id);
                            };
                            break;
                        case (item_type == 0):
                            // rating
                            if (prop.show_rating && this.hover_item && this.hover_item.type == 0 && x > track_rating.x && x < track_rating.x + track_rating.w) {
                                var star_w = track_rating.w / 5;
                                var metadb = this.hover_item.metadb;
                                var rating_curr = $("%rating%", metadb);
                                var rating_to = Math.ceil((x - track_rating.x) / star_w);
                                (rating_curr == rating_to) ? fb.RunContextCommandWithMetadb("<not set>", metadb) : fb.RunContextCommandWithMetadb("Rating/" + rating_to, metadb);
                                break;
                            };
                            var list_id = this.items[this.hover_item_id].list_id;
                            plman.ExecutePlaylistDefaultAction(g_active_pl, list_id);
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
                        var handles_sel = plman.GetPlaylistSelectedItems(g_active_pl);
                        var sel_total = handles_sel.Count;
                        var list_total = this.list_total;
                        if (this.hover_item && this.hover_item.type <= 0) {
                            var list_id;
                            var delta_;
                            if (this.hover_item.type == 0){ 
                                list_id = this.hover_item.list_id;
                            } else {
                                //list_id = Math.min(this.list_total -1, this.groups[this.hover_item.grp_id].last+1);
                                list_id = this.groups[this.hover_item.grp_id].last+1;
                            };

                            if (sel_total > 1) {
                                var temp;
                                var odd, add;
                                var sel_ = [];
                                for (var i = 0; i < list_total; i++) {
                                    if (plman.IsPlaylistItemSelected(g_active_pl, i)) {
                                        sel_.push(i);
                                    };
                                };

                                for (var i = 0; i < list_total; i++) {
                                    if (plman.IsPlaylistItemSelected(g_active_pl, i)) {
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
                                    plman.MovePlaylistSelection(g_active_pl, -list_total);
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

                            if (!odd && plman.IsPlaylistItemSelected(g_active_pl, list_id)) delta_ = 0;
                            plman.MovePlaylistSelection(g_active_pl, delta_);
                        };

                        // move after the last list item
                        if (!this.auto_scrolling && y > this.items[this.start_id + this.visible_rows - 1].y + this.row_height) {
                            plman.MovePlaylistSelection(g_active_pl, list_total - sel_total);
                        };

                        if (this.start_id == 0) {
                            if (y < this.items[0].y) {
                                plman.MovePlaylistSelection(g_active_pl, sel_total - list_total);
                            } 
                        };

                        this.items_dragging = false;
                    } else {
                        // --- if this.hover_item && this.hover_item_id == this.items_clicked_id:
                        if (g_avoid_to_clear_selection_on_mouse_up) {
                            g_avoid_to_clear_selection_on_mouse_up = false;
                        } else 
                            if (this.hover_item.type == 0 && !g_avoid_to_clear_selection_on_mouse_up) {
                                plman.ClearPlaylistSelection(g_active_pl);
                                plman.SetPlaylistSelectionSingle(g_active_pl, this.hover_item.list_id, true);
                                plman.SetPlaylistFocusItem(g_active_pl, this.hover_item.list_id);
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
                if (utils.IsKeyPressed(VK_SHIFT)) {
                    this.settings_menu(x, y);
                } else {
                    this.context_menu(x, y, g_focus_id);
                };
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
                //	this.save_start_id();
                break;
        };
    };

    this.is_group_selected = function (grp_id) {
        var grp = this.groups[grp_id];
        for (var i = grp.firstID; i <= grp.lastID; i++) {
            if (!plman.IsPlaylistItemSelected(g_active_pl, i))
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
            if (__playing_id >= pl.groups[i].firstID && __playing_id <= pl.groups[i].lastID) {
                pl.groups[i].is_playing = true;
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

        if (g_active_pl != plman.PlayingPlaylist) {
            plman.ActivePlaylist = plman.PlayingPlaylist;
            g_active_pl = plman.ActivePlaylist;
        };

        var playing_item_list_id = this.playing_item.PlaylistItemIndex;
        plman.ClearPlaylistSelection(g_active_pl);
        plman.SetPlaylistSelectionSingle(g_active_pl, playing_item_list_id, true);
        plman.SetPlaylistFocusItem(g_active_pl, playing_item_list_id);

        if (prop.auto_collaspe) {
            this.collapse_all();
        };

        // --------- expand playing group
        var playing_grp_id = 0;
        //console("playing list id: " + playing_item_list_id);
        for (var j = 0; j < this.total; j++) {
            if (this.items[j].type > 0) {
                var grp_id = this.items[j].grp_id;
                if (this.groups[grp_id].firstID <= playing_item_list_id && this.groups[grp_id].lastID >= playing_item_list_id) {
                    playing_grp_id = grp_id;
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
        if (plman.ActivePlaylist != plman.PlayingPlaylist){ 
            g_show_now_playing_called = true;
        };

    };

    this.dragdrop = {
        split_line_y: -1,
        target_id: -1,
    };

    this.on_drag = function(event, action, x, y, mask) {
        this.dragdrop.is_hover_area = this.is_hover_list(x, y);
        switch(event) {
            case "enter":
                dragdrop.drag_file = true;
                break;
            case "over":
                this.dragdrop.target_item_id = -1;
                this.dragdrop.split_line_y = -1;
                if (this.dragdrop.is_hover_area) {
                    this.dragdrop.target_item_id = Math.floor((y - this.list_y) / this.row_height + this.start_id);
                    if (this.dragdrop.target_item_id < 0) {
                        this.dragdrop.target_item_id = -1;
                    } else if (this.dragdrop.target_item_id > this.total) {
                        this.dragdrop.target_item_id = this.total;
                    };

                    if (this.dragdrop.target_item_id < this.total && this.items[this.dragdrop.target_item_id].type == 0) {
                        this.dragdrop.split_line_y = this.items[this.dragdrop.target_item_id].y;
                    } else if (this.dragdrop.target_item_id == this.total) {
                        this.dragdrop.split_line_y = this.items[this.total - 1].y + this.row_height;
                    };

                    if (this.dragdrop.split_line_y != this.dragdrop.split_line_y_saved) {
                        this.dragdrop.split_line_y_saved = this.dragdrop.split_line_y;
                        this.repaint();
                    };

                };

                if (dragdrop.drag_file && this.total > this.total_rows) {
                    if (y < this.list_y) {
                        this.start_auto_scroll(1, function() {
                        });
                    } else
                        if (y > this.list_y + this.list_h) {
                            this.start_auto_scroll(-1, function() {
                            });
                        };
                        else {
                            this.stop_auto_scroll();
                        };
                };
                break;
            case "drop":
                if (this.dragdrop.target_item_id == -1) {
                    // 
                    return;
                };
                var id;
                if (!fb.PlaylistCount) {
                    fb.CreatePlaylist(0, "Default");
                    fb.ActivePlaylist = 0;
                    g_active_pl = 0;
                } else {
                    plman.ClearPlaylistSelection(g_active_pl);
                };

                if (dragdrop.drag_file) {
                    action.ToPlaylist();
                    action.Playlist = g_active_pl;
                    action.ToSelect = true;
                };
                // on drop

                dragdrop.drag_file = false;
                this.dragdrop.split_line_y = -1;
                break;
            case "leave":
                this.dragdrop.split_line_y = -1;
                //dragdrop.drag_file = false;
                this.repaint();
                break;
        };
    };

    this.context_menu = function(x, y, type) {
        var _menu = window.CreatePopupMenu(); // main
        var _ce = window.CreatePopupMenu(); // collapse/expand
        var Context = fb.CreateContextMenuManager();
        var context_base_id;

        var handles_sel = plman.GetPlaylistSelectedItems(g_active_pl);
        var has_sel = handles_sel.Count;
        if (has_sel) Context.InitContext(handles_sel);

        fb.IsPlaying && _menu.AppendMenuItem(MF_STRING, 1, "Show now playing");
        if (this.total > 0 && prop.show_group_header && prop.show_cover) _menu.AppendMenuItem(MF_STRING, 2, "Refresh");
        //if (has_sel && (fb.IsPlaying || this.total > 0)) {
        if (fb.IsPlaying || this.total > 0 && prop.show_group_header && prop.show_cover) {
            _menu.AppendMenuSeparator();
        };

        if (prop.show_group_header) {
            if (fb.IsPlaying && g_active_pl == fb.PlayingPlaylist) {
                _menu.AppendMenuItem(MF_STRING, 51, "Collapse all but now playing");
            };
            if (this.total > 1) {
                _ce.AppendTo(_menu, MF_STRING | MF_POPUP, "Collapse/Expand");
                if (has_sel || this.handles_in_clipboard_count > 0) {
                    _menu.AppendMenuSeparator();
                };
                _ce.AppendMenuItem(MF_STRING, 50, "Collapse all");
                _ce.AppendMenuItem(MF_STRING, 52, "Expand all");
            }
        };

        //if (has_sel) {
            _menu.AppendMenuItem(has_sel ? MF_STRING : MF_DISABLED, 10, "Cut\tCtrl+X");
            _menu.AppendMenuItem(has_sel ? MF_STRING : MF_DISABLED, 11, "Copy\tCtrl+C");
        //};
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
                img_cache = new ImageCache(prop.cover_id);
                force_repaint = true;
                this.repaint();
                CollectGarbage();
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
                this.collapse_all();
                break;
            case 51:
                this.collapse_all();
                if (g_active_pl == fb.PlayingPlaylist) {
                    this.show_now_playing();
                }
                break;
            case 52:
                this.expand_all();
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
        plman.RemovePlaylistSelection(g_active_pl);
    };

    this.copy = function() {
        this.handles_in_clipboard = plman.GetPlaylistSelectedItems(g_active_pl);
        this.handles_in_clipboard_count = this.handles_in_clipboard.Count;
        //window.NotifyOthers();
    };

    this.paste = function() {
        if (this.handles_in_clipboard_count) {
            if (plman.GetPlaylistSelectedItems(g_active_pl).Count > 0) {
                plman.ClearPlaylistSelection(g_active_pl);
                plman.InsertPlaylistItems(g_active_pl, g_focus_id, this.handles_in_clipboard, true);
            } else {
                plman.InsertPlaylistItems(g_active_pl, plman.PlaylistCount, this.handles_in_clipboard, true);
            }
            this.handles_in_clipboard_count = 0;
            this.handles_in_clipboard = null;
        };
        //window.NotifyOthers()
    };

    this.settings_menu = function(x, y) {
        var _menu = window.CreatePopupMenu();
        var _grp = window.CreatePopupMenu();
        var _col = window.CreatePopupMenu();
        var _app = window.CreatePopupMenu();

        _grp.AppendTo(_menu, MF_STRING | MF_POPUP, "Group");
        _grp.AppendMenuItem(prop.auto_group ? MF_DISABLED : MF_STRING, 1, "Show group header");
        _grp.CheckMenuItem(1, prop.show_group_header);
        _grp.AppendMenuItem(MF_STRING, 2, "Auto group");
        _grp.CheckMenuItem(2, prop.auto_group);
        //
        _app.AppendTo(_menu, MF_STRING | MF_POPUP, "Appearences");
        _app.AppendMenuItem(MF_STRING, 10, "Show rating");
        _app.CheckMenuItem(10, prop.show_rating);
        _app.AppendMenuItem(MF_STRING, 11, "Show play count");
        _app.CheckMenuItem(11, prop.show_play_count);
        _app.AppendMenuSeparator();
        _app.AppendMenuItem(MF_STRING, 12, "Show scrollbar");
        _app.CheckMenuItem(12, prop.show_scrollbar);
        _app.AppendMenuSeparator();
        _app.AppendMenuItem(MF_STRING, 13, "Enable odd/even highlight");
        _app.CheckMenuItem(13, prop.odd_even_rows);
        _app.AppendMenuItem(MF_STRING, 14, "Show focusd item");
        _app.CheckMenuItem(14, prop.show_focus_item);
        //
        var _art = window.CreatePopupMenu();
        _art.AppendTo(_menu, MF_STRING | MF_POPUP, "Cover");
        _art.AppendMenuItem(MF_STRING, 20, "Show");
        _art.AppendMenuItem(MF_STRING, 21, "Keep aspect ratio");
        //
        _col.AppendTo(_menu, MF_STRING |MF_POPUP, "Color scheme");
        _col.AppendMenuItem(MF_STRING, 31, "UI default");
        _col.AppendMenuItem(MF_STRING, 32, "Catrox(dark)");
        _col.AppendMenuItem(MF_STRING, 33, "Modoki(light)");
        _col.AppendMenuItem(MF_STRING, 34, "User");
        var colorID = (function() {
            switch (prop.colorscheme) {
                case "system":
                    return 31;
                case "catrox":
                case "dark":
                    return 32;
                case "modoki":
                case "light":
                    return 33;
                case "user":
                    return 34;
            }
        })();
        _col.CheckMenuRadioItem(31, 34, colorID);
        _menu.AppendMenuSeparator();

        _menu.AppendMenuItem(MF_STRING, 50, "Vim-style key bindings");
        _menu.CheckMenuItem(50, prop.enable_vim_style_keybindings);

        var ret = _menu.TrackPopupMenu(x, y);

        var colorArr = ["system", "catrox", "modoki", "user"];
        // change colorscheme
        /*
           for (var i = 31; i <= 34; i++) {
           if (i == ret) {
           prop.colorscheme = colorscheme[colorArr[i - 31]];
           get_colors();
           window.Repaint();
           window.SetProperty("_prop_color: Colorscheme(system, catrox, modoki, user)", colorArr[i - 31]);
           break;
           };
           };
           */


        switch(ret) {
            case 1:
                prop.show_group_header = !prop.show_group_header;
                this.init_list();
                window.SetProperty("_prop_grp: Show group header", prop.show_group_header);
                break;
            case 2:
                prop.auto_group = !prop.auto_group;
                prop.show_group_header = window.GetProperty("_prop_grp: Show group header");
                this.init_list();
                window.SetProperty("_prop_grp: Auto group tracks", prop.auto_group);
                break;
            case 10:
                prop.show_rating = !prop.show_rating;
                this.repaint();
                window.SetProperty("_prop: Show rating", prop.show_rating);
                break;
            case 11:
                prop.show_play_count = !prop.show_play_count;
                this.repaint();
                window.SetProperty("_prop: Show play count", prop.show_play_count);
                break;
            case 12:
                prop.show_scrollbar = !prop.show_scrollbar();
                this.on_size();
                this.repaint();
                window.SetProperty("_prop: Show scrollbar", prop.show_scrollbar);
                break;
            case 13:
                prop.odd_even_rows = !prop.odd_even_rows;
                this.repaint();
                window.SetProperty("_prop: Enable odd/even rows highlight", prop.odd_even_rows);
                break;
            case 14:
                prop.show_focus_item = !prop.show_focus_item;
                this.repaint();
                window.SetProperty("_prop: Show focused item", prop.show_focus_item);
                break;
            case 20:
                break;
            case 21:
                break;
            case 50:
                prop.enable_vim_style_keybindings = !prop.enable_vim_style_keybindings;
                window.SetProperty("_prop: Enable vim key bindings", prop.enable_vim_style_keybindings);
                break;
        };

        _col.Dispose();
        _art.Dispose();
        _app.Dispose();
        _menu.Dispose();
        _grp.Dispose();
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
                    this.parent.start_id = Math.ceil((this.cursor_y - this.y) * this.parent.total / this.h);
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
                    this.parent.save_start_id();
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
    this.dpi = 96;
    this.show_info = window.GetProperty("_prop: Show info header", true);
    this.use_system_color = window.GetProperty("_prop_color: Use system color", true);
    this.colorscheme = window.GetProperty("_prop_color: Colorscheme(system, catrox, modoki, user)", "dark");
    this.font_name = window.GetProperty("_prop_font: Default font name", "Segoe UI");
    this.group_format = window.GetProperty("_prop_grp: Group format", "%album artist% | %album% | %discnumber%");
    this.group_header_rows = window.GetProperty("_prop_grp: Group header rows", 4);
    // should not set by users
    this.group_minimum_rows = window.GetProperty("_prop_grp: Minimum group rows", 0);
    this.group_extra_rows = window.GetProperty("_prop_grp: Extra group rows", 0);
    this.show_group_header = window.GetProperty("_prop_grp: Show group header", true);
    this.auto_group = window.GetProperty("_prop_grp: Auto group tracks", true);
    this.row_height = window.GetProperty("_prop: Row height", 22);
    this.margin = window.GetProperty("_prop: Margin", 15);
    this.show_scrollbar = window.GetProperty("_prop: Show scrollbar", true);
    this.scrollbar_width = 12;
    this.odd_even_rows = window.GetProperty("_prop: Enable odd/even rows highlight", true);
    this.scroll_step = window.GetProperty("_prop: Default scroll step", 3);
    this.auto_collaspe = window.GetProperty("_prop: Auto collapse", false);
    this.show_focus_item = window.GetProperty("_prop: Show focused item", false);
    this.show_rating = window.GetProperty("_prop: Show rating", true);
    this.show_play_count = window.GetProperty("_prop: Show play count", true);
    this.show_cover = window.GetProperty("_prop: Show group art", true);
    this.cover_id = window.GetProperty("_prop: Group art id(font:0, disc:2, artist:4, genre:5", 0);
    this.keep_aspect_ratio = window.GetProperty("_prop: Keep art aspect ratio", true);
    this.auto_show_now_playing = window.GetProperty("_prop: Auto show now playing", true);
    this.enable_vim_style_keybindings = window.GetProperty("_prop: Enable vim key bindings", false);
}();

g_colors = {};
g_fonts = {}
images = {
    no_cover: null,
};


colorscheme = {
    light: { // modoki
        txt_normal: RGB(25, 25, 25),
        txt_selected: RGB(0, 0, 0), 
        bg_normal: RGB(255, 255, 255),
        bg_selected: RGB(185, 187, 189),
        highlight: RGB(215, 65, 100)
    },
    dark: { // catrox
        txt_normal: RGB(125, 127, 129),
        txt_selected: RGB(160, 162, 164),
        bg_normal: RGB(30, 30, 30),
        bg_selected: RGB(65, 65, 65),
        highlight: RGB(255, 165, 0)
    },
    user: {
        txt_normal: eval(window.GetProperty("colorscheme: text normal", "RGB(70, 70, 70)")),
        txt_selected: eval(window.GetProperty("colorscheme: text selected", "RGB(0, 0, 0)")),
        bg_normal: eval(window.GetProperty("colorscheme: background normal", "RGB(245, 245, 245)")),
        bg_selected: eval(window.GetProperty("colorscheme: background selected", "RGB(110, 110, 110)")),
        highlight: eval(window.GetProperty("colorscheme: highlight", "RGB(215, 65, 100)"))
    },
};
colorscheme.modoki = colorscheme.light;
colorscheme.catrox = colorscheme.dark;

track_rating = {
    x: 0,
    w: 0,
};


cover = {
    k13o: prop.keep_aspect_ratio,
    w: 0,
    h: 0,
    max_w: 0,
    max_h: 0,
    load_timer: null
};

dragdrop = {
    drag_file: false,
    handles_in: null,
    handles_out: null,
};

timers = {
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
//var repaint_forced = false;
var repaint_counter = 0;
var force_repaint = false;

var g_cover_id = window.GetProperty("Group cover id:", AlbumArtId.front);
var g_active_pl = plman.ActivePlaylist;
var g_focus_id = plman.GetPlaylistFocusItemIndex(g_active_pl);
var g_show_now_playing_called = false;
var g_fast_scrolling = true;
var g_avoid_to_clear_selection_on_mouse_up = false;
var g_btns = [], g_btn_l = 0;


get_metrics();
get_fonts();
get_colors();
get_images();
get_btn_images();
set_btns();

var img_cache = new ImageCache(prop.cover_id);
var pl = new Playlist();

window.DlgCode = DLGC_WANTALLKEYS;











function gdi_font(name, pt, style) {
    return gdi.Font(name, pt * prop.dpi / 72, style);
};


function get_fonts() {
    try {
        g_fonts.name = (window.InstanceType == 1 ? window.GetFontDUI(3).Name : window.GetFontCUI(0).Name);
    } catch (e) {
        g_fonts.name = "Segoe UI";
        console("Failed to load default font, Use \"" + g_fonts.name + "\" instead");
    };
    //g_fonts.name = prop.font_name;
    g_fonts.name_bold = g_fonts.name;
    if (g_fonts.name.toLowerCase() == "segoe ui semibold") {
        g_fonts.name_bold = "segoe ui";
    };
    g_fonts.item = gdi.Font(g_fonts.name, 12);
    g_fonts.item_bold = gdi.Font(g_fonts.name, 12, 1);
    g_fonts.header1 = gdi.Font(g_fonts.name_bold, 18, 1);
    g_fonts.header2 = gdi.Font(g_fonts.name, 14, 0);
    g_fonts.header3 = gdi.Font(g_fonts.name, 14, 0);
    g_fonts.rating1 = gdi.Font("Segoe UI Symbol", 16, 0);
    g_fonts.rating2 = gdi.Font("Segoe UI Symbol", 14, 0);
    g_fonts.item_14b = gdi.Font(g_fonts.name_bold, 14, 1);
    g_fonts.info_header = gdi.Font("Segoe UI Semibold", 12, 0);
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
            g_colors.txt_selected = (Luminance(c) > 0.6 ? 0xff000000 : 0xfff5f5f5);
            if (Luminance(c) > 0.6) {
                g_colors.txt_selected = blendColors(g_colors.txt_normal, 0xff000000, 0.3);
            } else {
                g_colors.txt_selected = blendColors(g_colors.txt_normal, 0xffffffff, 0.3);
            };
        } else { try {
            g_colors.txt_normal = window.GetColorCUI(ColorTypeCUI.text);
            g_colors.txt_selected = window.GetColorCUI(ColorTypeCUI.selection_text);
            g_colors.bg_normal = window.GetColorCUI(ColorTypeCUI.background);
            g_colors.bg_selected = window.GetColorCUI(ColorTypeCUI.selection_background);
            g_colors.highlight = window.GetColorCUI(ColorTypeCUI.active_item_frame);
        } catch (e) {} };
    }

    g_colors.txt_bg_05 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.5);
};




function get_metrics() {
    if (prop.show_cover) {
        if (prop.show_group_header) {
            cover.max_w = prop.group_header_rows * prop.row_height - 16;
            prop.group_minimum_rows = 0;
            window.SetProperty("_prop_grp: Minimum group rows", prop.group_minimum_rows);
        };
        /*
           else {
           prop.group_minimum_rows = 5;
           window.SetProperty("_prop_grp: Minimum group rows", prop.group_minimum_rows);
           cover.max_w = 5 * prop.row_height - 20;
           };
           */
    };
    img_cache = new ImageCache(prop.cover_id);
};

function get_images() {
    var cw = cover.max_w;
    if (!cw) cw = 1;
    if (cw > 0) {
        var img, g;
        img = gdi.CreateImage(cw, cw);
        g = img.GetGraphics();
        //
        var color = blendColors(g_colors.bg_normal, 0xff000000, 0.2);
        g.FillSolidRect(0, 0, cw, cw, color);
        g.SetTextRenderingHint(4);
        //
        g.DrawString("No Cover", g_fonts.item_14b, g_colors.txt_bg_05, 0, 0, cw, cw, StringFormat(1, 1));
        g.SetTextRenderingHint(0);
        //
        img.ReleaseGraphics(g);
        images.no_cover = img;
    };
};

function get_btn_images() {

	var font = gdi.Font("FontAwesome", 16);
	var colors = [RGB(200, 200, 200), RGB(255, 255, 255), RGB(86, 156, 214)];
	var w = 25;
	var s, imgarr, img;
	var sf = 285212672;

	// Add
	imgarr = [];
	for (s = 0; s < 3; s++) {
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);
		
		g.DrawString("\uF055", font, colors[s], 0, 0, w, w, sf);

		img.ReleaseGraphics(g);
		imgarr[s] = img;
	};
	images.add = imgarr;

	// Rating
	imgarr = [];
	for (s = 0; s < 3; s++) {
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);
		
		g.DrawString("\uF005", font, colors[s], 0, 0, w, w, sf);

		img.ReleaseGraphics(g);
		imgarr[s] = img;
	};
	images.rat = imgarr;

    img = gdi.CreateImage(w, w);
    g = img.GetGraphics();
    g.SetTextRenderingHint(4);

    g.DrawString("\uF005", font, blendColors(colors[1], colors[2], 0.8), 0, 0, w, w, sf);

    img.ReleaseGraphics(g);
    images.rat2 = [images.rat[2], img, images.rat[1]];
	
	var font = gdi.Font("FontAwesome", 14);
	// Sort
	imgarr = [];
	for (s = 0; s < 3; s++) {
		img = gdi.CreateImage(w, w);
		g = img.GetGraphics();
		g.SetTextRenderingHint(4);
		
		g.DrawString("\uF161", font, colors[s], 0, 0, w, w, sf);

		img.ReleaseGraphics(g);
		imgarr[s] = img;
	};
	images.sort = imgarr;

};

function set_btns() {
    g_btns = [];
    g_btns[0] = new Button(images.add, function(x, y) {
        add_menu(x, y);
    });
    g_btns[1] = new Button(images.sort, function(x, y) {
        sort_menu(x, y);
    });
    g_btns[2] = new Button(images.rat, function() {
        toggle_show_rating();
    });
    g_btn_l = g_btns.length;
}

function toggle_show_rating() {
    prop.show_rating = !prop.show_rating;
    //g_btns[2].update_img(prop.show_rating ? images.rat2 : images.rat);
    pl.repaint();
    window.SetProperty("_prop: Show rating", prop.show_rating);
}

function add_menu(x, y) {

	g_btns[0].state = 2;

	var _menu = window.CreatePopupMenu();
	var id = 1;
	_menu.AppendMenuItem(MF_STRING, id++, "Add files...");
	_menu.AppendMenuItem(MF_STRING, id++, "Add folder...");
	_menu.AppendMenuItem(MF_STRING, id++, "Add location...");

	var ret = _menu.TrackPopupMenu(x, y);
	var cmd = ["Add files...", "Add folder...", "Add location..."];

	for (var i = 1; i < id; i++) {
		if (i == ret){ 
			fb.RunMainMenuCommand("File/" + cmd[i-1]);
			break;
		};
	};
	_menu.Dispose();

	g_btns[0].reset();

}

function sort_menu(x, y) {

    g_btns[1].state = 2;

    var _menu = window.CreatePopupMenu();
    _menu.AppendMenuItem(MF_STRING, 1, "Sort by...");
    _menu.AppendMenuItem(MF_STRING, 2, "Randomize");
    _menu.AppendMenuItem(MF_STRING, 3, "Sort by album");
    _menu.AppendMenuItem(MF_STRING, 4, "Sort by artist");
    _menu.AppendMenuItem(MF_STRING, 5, "Sort by path");
    _menu.AppendMenuItem(MF_STRING, 6, "Sort by rating");
    _menu.AppendMenuSeparator();

    var handles_sel = plman.GetPlaylistSelectedItems(g_active_pl);
    var has_sel = handles_sel.Count;
    _sel = window.CreatePopupMenu();
    _sel.AppendTo(_menu, has_sel ?  MF_STRING : MF_DISABLED, "Selection");
    _sel.AppendMenuItem(MF_STRING, 10, "Sort by...");
    _sel.AppendMenuItem(MF_STRING, 11, "Randomize");
    _sel.AppendMenuItem(MF_STRING, 12, "Sort by album");
    _sel.AppendMenuItem(MF_STRING, 13, "Sort by artist");
    _sel.AppendMenuItem(MF_STRING, 14, "Sort by path");
    _sel.AppendMenuItem(MF_STRING, 15, "Sort by rating");

    var id = _menu.TrackPopupMenu(x, y);
    var patterns = [ "", "%album%-%discnumber%-%tracknumber%", 
        "%album artist%-%album%-%discnumber%-%tracknumber%",
        "%path%-%subsong%", "$sub(10,$if2(%rating%,0))"];
    switch (true) {
        case (id == 1): 
            fb.RunMainMenuCommand("Edit/Sort/Sort by...");
            break;
        case (id >= 2 && id <= 6):
            plman.SortByFormat(g_active_pl, patterns[id-2], false);
            break;
        case (id == 10): 
            fb.RunMainMenuCommand("Edit/Selection/Sort/Sort by...");
            break;
        case (id >= 11 && id <= 15):
            plman.SortByFormat(g_active_pl, patterns[id-11], true);
    }

    _menu.Dispose();

    g_btns[1].reset();
}

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


function on_size() {
    ww = Math.max(380, window.Width);
    wh = window.Height;
    var th = 0;
    if (prop.show_info) {
        ih = 25;
        // Set buttons pos
        var bh = g_btns[0].h;
        var by = 0;
        var bx = 20;
        g_btns[0].set_xy(bx, by);

        bx = bx + g_btns[0].w + 4;
        g_btns[1].set_xy(bx, by);

        bx = bx + g_btns[1].w + 4;
        g_btns[2].set_xy(bx, by);
    };
    pl.set_size(1, ih, ww - 2, wh - ih - 1);

}

function on_paint(gr) {
    var from = new Date();
    // bg
    gr.FillSolidRect(0, 0, ww, wh, g_colors.bg_normal);
    // playlist view
    pl.draw(gr);
    // info header
    if (prop.show_info) {
        gr.FillSolidRect(0, 0, ww, 25, RGB(15, 15, 15));
        // Draw buttons
        for (var i = 0; i < g_btn_l; i++) {
            g_btns[i].draw(gr);
        }

        // Draw infos
        var tcolor = RGB(120, 120, 120);
        var p = 10;
        var txt = ", " + pl.list_total + " tracks";
        var txt_w = GetTextWidth(txt, g_fonts.info_header);
        var txt_x = ww - p - txt_w;
        gr.GdiDrawText(txt, g_fonts.info_header, tcolor, txt_x, 0, txt_w, 25, dt_cc);
        var txt = pl.name ;
        var txt_x2 = Math.max(txt_x - GetTextWidth(txt, g_fonts.info_header), g_btns[2].x + g_btns[2].w + 10);
        gr.GdiDrawText(txt, g_fonts.info_header, tcolor, txt_x2, 0, txt_x - txt_x2, 25, dt_rc);
    };

    repaint_counter++;
    if (repaint_counter > 100) {
        repaint_counter = 0;
        CollectGarbage();
    };
}

function on_mouse_move(x, y) {
    pl.on_mouse("move", x, y);

    for (var i = 0; i < g_btn_l;i++) {
        g_btns[i].check_state("move", x, y);
    }
}

function on_mouse_lbtn_down(x, y, mask) {
    pl.on_mouse("down", x, y, mask);
    for (var i = 0; i < g_btn_l; i++) {
        g_btns[i].check_state("down", x, y);
    }
}

function on_mouse_lbtn_dblclk(x, y, mask) {
    pl.on_mouse("dblclk", x, y, mask);

    for (var i = 0;i < g_btn_l; i++) {
        g_btns[i].check_state("down", x, y);
    }
}

function on_mouse_lbtn_up(x, y, mask) {
    pl.on_mouse("up", x, y, mask);

    for (var i = 0;i < g_btn_l; i++) {
        g_btns[i].check_state("up", x, y) == 1 &&
            g_btns[i].on_click(g_btns[i].x, g_btns[i].y+g_btns[i].h);
    }
}

function on_mouse_rbtn_down(x, y, mask) {
    pl.right_clicked = true;
    pl.on_mouse("down", x, y, mask);
}

function on_mouse_rbtn_up(x, y, mask) {
    if (pl.scrb.is_hover_object(x, y)) {
        return true;
    };
    pl.on_mouse("right", x, y, mask);
    return true;
}

function on_mouse_wheel(delta) {
    pl.on_mouse("wheel", 0, 0, delta);
}

function on_mouse_leave() {
    for (var i = 0;i < g_btn_l; i++) {
        if (g_btns[i].state == 1) {
            g_btns[i].reset();
        }
    };
};


//// playlist callbacsk

function on_playlists_changed() {

    if (g_active_pl > plman.PlaylistCount - 1) {
        g_active_pl = plman.PlaylistCount - 1;
    };
    if (g_active_pl < 0) {
        g_active_pl = 0;
    };
    if (g_active_pl != plman.ActivePlaylist) {
        g_active_pl = plman.ActivePlaylist;
        pl.init_list();
    };
}


function on_playlist_switch() {
    g_active_pl = plman.ActivePlaylist;
    g_focus_id = plman.GetPlaylistFocusItemIndex(g_active_pl);
    pl.init_list();
    //if (plman.ActivePlaylist == plman.PlayingPlaylist) pl.show_now_playing();
    //g_show_now_playing_called = false;
}

function on_playlist_items_reordered(playlist) {
    if (playlist !== g_active_pl) return;
    pl.init_list();
    g_focus_id = plman.GetPlaylistFocusItemIndex(g_active_pl);
}

function on_playlist_items_removed(playlist) {
    if (playlist !== g_active_pl) return;
    pl.init_list();
    g_focus_id = plman.GetPlaylistFocusItemIndex(g_active_pl);
}

function on_playlist_items_added(playlist) {
    if (playlist !== g_active_pl) return;
    pl.init_list();
    g_focus_id = plman.GetPlaylistFocusItemIndex(g_active_pl);
}

function on_playlist_items_selection_change() {
    pl.repaint();
}

function on_item_selection_change() {
    pl.repaint();
}

function on_item_focus_change(playlist, from, to) {
    g_focus_id = to;
    pl.repaint();
}


//// playback callbacks

function on_playback_pause(state) {
    if (pl.playing_item_visible) pl.repaint();
}

/*
   function on_playback_starting(cmd, is_paused) {
   pl.get_playing_item();
   if (pl.playing_item_visible)  pl.repaint();
   };
   */

function on_playback_edited(metadb) {
    pl.repaint();
}

function on_playback_new_track(metadb) {
    /*
    if (prop.auto_show_now_playing && g_active_pl == fb.PlayingPlaylist) {
        pl.show_now_playing();
        g_show_now_playing_called = false;
    };
    */
    pl.get_playing_item();
    pl.repaint();
}

function on_playback_stop(reason) {
    if (reason != 2) {
        pl.get_playing_item();
        pl.repaint();
    };
}

function on_playback_queue_changed() {
    pl.repaint();
}

//// dragdrop functions

function on_drag_enter(action, x, y, mask) {
    pl.on_drag("enter", action, x, y, mask);
}

function on_drag_over(action, x, y, mask) {
    pl.on_drag("over", action, x, y, mask);
}

function on_drag_drop(action, x, y, mask) {
    pl.on_drag("drop", action, x, y, mask);
}


function on_drag_leave() {
    pl.on_drag("leave");
}


//// keymap
function on_key_down(vkey) {
    var ctrl_pressed = utils.IsKeyPressed(VK_CONTROL);
    var shift_pressed = utils.IsKeyPressed(VK_SHIFT);

    switch(vkey) {
        case VK_UP:
            // change focus item
            pl.auto_scrolling = true;
            if (g_focus_id == 0){
                if (pl.start_id != 0) {
                    pl.scrb.on_mouse("wheel", 0, 0, pl.start_id);
                };
                return;
            };
            if (!ctrl_pressed && !shift_pressed) {
                plman.ClearPlaylistSelection(g_active_pl);
                plman.SetPlaylistSelectionSingle(g_active_pl, g_focus_id - 1, true);
            }
            plman.SetPlaylistFocusItem(g_active_pl, g_focus_id - 1);
            for (var i = 0; i < pl.total; i++) {
                // found focused id
                if (pl.items[i].type == 0 && pl.items[i].list_id == g_focus_id) {
                    if (i < pl.start_id + 1 + prop.group_header_rows) {
                        pl.scrb.on_mouse("wheel",  0, 0, -i + pl.start_id + 1 + prop.group_header_rows);
                    } else if (i >= pl.start_id + pl.total_rows) {
                        pl.scrb.on_mouse("wheel", 0, 0, -i + (pl.start_id + pl.total_rows));
                    };
                    break;
                };
            };
            break;
        case VK_DOWN:
            pl.auto_scrolling = true;
            if (g_focus_id == pl.handles.Count - 1) {
                pl.scrb.on_mouse("wheel", 0, 0, -pl.total); 
                return;
            };
            if (!ctrl_pressed && !shift_pressed) {
                plman.ClearPlaylistSelection(g_active_pl);
                plman.SetPlaylistSelectionSingle(g_active_pl, g_focus_id + 1, true);
            };
            plman.SetPlaylistFocusItem(g_active_pl, g_focus_id+1);
            for (var i = 0; i < pl.total; i++) {
                if (pl.items[i].type == 0 && pl.items[i].list_id == g_focus_id) {
                    if (i <= pl.start_id) {
                        pl.scrb.on_mouse("wheel", 0, 0, -i + pl.start_id);
                    } else if (i > pl.start_id + pl.total_rows - 2 - prop.group_header_rows) {
                        pl.scrb.on_mouse("wheel", 0, 0, -i + pl.start_id + pl.total_rows - 2 - prop.group_header_rows);
                    };
                    break;
                };
            };

            break;
        case VK_PRIOR: // page up
            pl.auto_scrolling = true;
            pl.scrb.on_mouse("wheel", 0, 0, pl.total_rows);
            break;
        case VK_NEXT: // page down
            pl.auto_scrolling = true;
            pl.scrb.on_mouse("wheel", 0, 0, -pl.total_rows);
            break;
        case VK_DELETE:
            fb.RunMainMenuCommand("Edit/Selection/Remove");
            break;
        case VK_KEY_A:
            ctrl_pressed && fb.RunMainMenuCommand("Edit/Select all");
            break;
            //case VK_KEY_F:
        case VK_RETURN:
            plman.ExecutePlaylistDefaultAction(g_active_pl, g_focus_id);
            break;
        case VK_HOME:
            if (!pl.handles.Count) return;
            plman.ClearPlaylistSelection(g_active_pl);
            plman.SetPlaylistSelectionSingle(g_active_pl, 0, true);
            plman.SetPlaylistFocusItem(g_active_pl, 0);
            pl.expand_group(0);
            pl.scrb.on_mouse("wheel", 0, 0, pl.total);
            break;
        case VK_END:
            if (!pl.handles.Count) return;
            plman.ClearPlaylistSelection(g_active_pl);
            plman.SetPlaylistSelectionSingle(g_active_pl, pl.handles.Count - 1, true);
            plman.SetPlaylistFocusItem(g_active_pl, pl.handles.Count -1);
            pl.expand_group(pl.groups.length -1);
            pl.scrb.on_mouse("wheel", 0, 0, -pl.total);
            break;
            //case VK_KEY_N:
            //case VK_KEY_O:
            //case VK_KEY_P:
            //case VK_KEY_M:
            //case VK_KEY_Q:
        case VK_F5:
            img_cache = new ImageCache(prop.cover_id);
            CollectGarbage();
            pl.repaint();
            break;
        case VK_KEY_X:
            ctrl_pressed && pl.cut();
            break;
        case VK_KEY_C:
            ctrl_pressed && pl.copy();
            break;
        case VK_KEY_V:
            ctrl_pressed && pl.paste();
            break;
    };

    if (prop.enable_vim_style_keybindings) {
        switch (vkey) {
            // ---------------------------------------------------
            // vim style key bindings
            case VK_KEY_J:
                on_key_down(VK_DOWN);
                break;
            case VK_KEY_K:
                on_key_down(VK_UP);
                break;
            case VK_KEY_H:
                if (g_active_pl > 0 && fb.PlaylistCount > 1) {
                    fb.ActivePlaylist--;
                };
                break;
            case VK_KEY_L:
                if (fb.ActivePlaylist+1 < fb.PlaylistCount) {
                    fb.ActivePlaylist++;
                };
                break;
            case VK_KEY_F:
                ctrl_pressed && on_key_down(VK_NEXT);
                break;
            case VK_KEY_B:
                ctrl_pressed && on_key_down(VK_PRIOR);
                break;
            case VK_KEY_G:
                if (shift_pressed) {
                    on_key_down(VK_END);
                } else {
                    if (pl.gg_timer) {
                        //console("top...");
                        on_key_down(VK_HOME);
                        window.ClearTimeout(pl.gg_timer);
                        pl.gg_timer = false;
                    } else {
                        pl.gg_timer = window.SetTimeout(function() {
                            //console("timer... ");
                            window.ClearTimeout(pl.gg_timer);
                            pl.gg_timer = false;
                        }, 300);
                    };
                };
                break;
        };
    };
}

function on_key_up(vkey){ 
    if (pl.auto_scrolling) {
        pl.auto_scrolling = false;
        pl.repaint();
    };
}

function on_char(code) {
};




//// misc
function on_get_album_art_done(metadb, art_id, image, image_path) {
    var tot = pl.groups.length;
    for (var i = 0; i < tot; i++) {
        if (pl.groups[i].metadb && pl.groups[i].metadb.Compare(metadb)) {
            pl.groups[i].grp_img = img_cache.get_it(metadb, i, image);
            pl.repaint();
            break;
        };
    };
}

function on_notify_data(name, info) {
    switch (name) {
        case "Reload script":
            if (window.IsVisible) {
                window.Reload();
            };
            break;
        case "Playlist toggle rating star":
            prop.show_rating = !prop.show_rating;
            pl.repaint();
            window.SetProperty("_prop: Show rating", prop.show_rating);
            break;

    };
}

function on_metadb_changed(handles, fromhook) {
    force_repaint = true;
    pl.repaint();
}

function on_colors_changed() {
    get_colors();
    get_images();
    img_cache = new ImageCache(prop.cover_id);
    window.Repaint();
}

function on_font_changed() {
    get_fonts();
    window.Repaint();
}

