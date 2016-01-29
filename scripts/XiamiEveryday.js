// vim:set ft=javascript fileencoding=utf-8 bomb et:
//
// XiamiEveryday:
// Online stream list of xiami everyday recomendations . 
// Need to log on with your xiami account.
//
// update: 2016-01-27
var DT_LT = DT_NOPREFIX | DT_CALCRECT | DT_END_ELLIPSIS;
var DT_LC = DT_LT | DT_VCENTER;
var DT_CC = DT_CENTER | DT_VCENTER | DT_LT;
var DT_RC = DT_RIGHT | DT_LC;

var COLOR_SCHEME = [
    {
        txt_normal: RGB(20, 20, 20),
        txt_selected: RGB(20, 20, 20), 
        bg_normal: RGB(245, 245, 245),
        bg_selected: RGB(164, 194, 0),
        highlight: RGB(56, 99, 0)
    },
    {
        txt_normal: RGB(160, 160, 160),
        txt_selected: RGB(160, 160, 160),
        bg_normal: RGB(30, 30, 30),
        bg_selected: RGB(65, 65, 65),
        highlight: RGB(255, 165, 0)
    },
    {
        txt_normal: eval(window.GetProperty(__("Color text normal"), "RGB(30, 30, 30)")),
        txt_selected: eval(window.GetProperty(__("Color text selected"), "RGB(0, 0, 0)")),
        bg_normal: eval(window.GetProperty(__("Color background normal"), "RGB(255, 255, 255)")),
        bg_selected: eval(window.GetProperty(__("Color background selected"), "RGB(180, 180, 180)")),
        highlight: eval(window.GetProperty(__("Color highlight"), "RGB(215, 65, 100)"))
    }
];

try {
	var xmlhttp = new ActiveXObject("Msxml2.XMLHTTP.3.0");
	var WshShell = new ActiveXObject("WScript.Shell");
	var fso = new ActiveXObject("Scripting.FileSystemObject");
    var doc = new ActiveXObject("htmlfile");
} catch (e) {
	alert("Check off `Safe-mode' please");
}

var ww, wh;
var g_colors = {};
var g_fonts = {};
var g_color_scheme = window.GetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), 0); 
var g_images = {};

var g_buttons = {};
var g_inputbox = null;

var g_results = [];
var g_results_cache = {};
var search_mode = 1;
var add_idx = 0;
var stop_loading = false;

var email = '',  
    password = '',
    cookie_ = '';

var user_nick_name = '';

var user_folder = WshShell.ExpandEnvironmentStrings("%HomePath%"),
    data_folder = user_folder + "\\.foobar2000";

var sidPattern = /(\d+)/,  
    songUrlPattern = /a href="(\/song\/\d+)"/g;
var isShowcollect = /www.xiami.com\/song\/showcollect\/id\/\d+/,  
    isSong = /www.xiami.com\/song\/\d+/;
var banChar = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];

var titlePattern = /<div id="title">\s*<h1>(.*)<\/h1>/,  
    albumPattern = /<a href="\/album\/\d+" title=".*">(.*)<\/a>/,
    artistPattern = /<a href="\/artist\/\d+" title=".*">(.*)<\/a>/;

var inputPattern = /input.+name="([^"]*)".+value="([^"]*)"/g,  
    inputPatternR = /input.+value="([^"]*)".+name="([^"]*)"/g;


function get_user_email() {
    var old_email = email;

}


function getLocation(param1) {
	var _loc_10 = undefined;
	var _loc_2 = Number(param1.charAt(0));
	var _loc_3 = param1.substring(1);
	var _loc_4 = Math.floor(_loc_3.length / _loc_2);
	var _loc_5 = _loc_3.length % _loc_2;
	var _loc_6 = new Array();
	var _loc_7 = 0;
	while (_loc_7 < _loc_5) {
		if (_loc_6[_loc_7] == undefined) {
			_loc_6[_loc_7] = "";
		}
		_loc_6[_loc_7] = _loc_3.substr((_loc_4 + 1) * _loc_7, (_loc_4 + 1));
		_loc_7 = _loc_7 + 1;
	}
	_loc_7 = _loc_5;
	while (_loc_7 < _loc_2) {
		_loc_6[_loc_7] = _loc_3.substr(_loc_4 * (_loc_7 - _loc_5) + (_loc_4 + 1) * _loc_5, _loc_4);
		_loc_7 = _loc_7 + 1;
	}
	var _loc_8 = "";
	_loc_7 = 0;
	while (_loc_7 < _loc_6[0].length) {
		_loc_10 = 0;
		while (_loc_10 < _loc_6.length) {
			_loc_8 = _loc_8 + _loc_6[_loc_10].charAt(_loc_7);
			_loc_10 = _loc_10 + 1;
		}
		_loc_7 = _loc_7 + 1;
	}
	_loc_8 = unescape(_loc_8);
	var _loc_9 = "";
	_loc_7 = 0;
	while (_loc_7 < _loc_8.length) {
		if (_loc_8.charAt(_loc_7) == "^") {
			_loc_9 = _loc_9 + "0";
		} else {
			_loc_9 = _loc_9 + _loc_8.charAt(_loc_7);
		}
		_loc_7 = _loc_7 + 1;
	}
	_loc_9 = _loc_9.replace("+", " ");
	return _loc_9;
}

function logout(callback) {

	xmlhttp.open("GET", 'http://www.xiami.com/member/logout', true);
	xmlhttp.setRequestHeader("Referer", "http://www.xiami.com");
	xmlhttp.send();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
                cookie_ = '';
                save_to_file(cookie_, data_folder + "\\COOKIE");
                get_user_info();
                window.Repaint();
                callback && callback();
			} else {
			}
		}
	}
}



function login(email, password, callback) {

	var data = "&email=" + email + "&submit=" + encodeURIComponent("登陆") 
		+ "&done=%2f&from=web&havanald=&password=" + password;
    var url = 'http://www.xiami.com/member/login';

    //console(url + "?" + data);

	xmlhttp.open("POST", url+"?"+data, true);

    //xmlhttp.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36 AlexaToolbar/alxg-3.1');
	xmlhttp.setRequestHeader('Referer', 'http://www.xiami.com/member/login');
	xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xmlhttp.send();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
                // Save cookie
                cookie_ = xmlhttp.getResponseHeader('Set-Cookie');
                if (cookie_ && cookie_.length > 0) {
                    save_to_file(cookie_, data_folder + "\\COOKIE");
                }
                get_user_info();
                window.Repaint();

                var json_data = json(xmlhttp.responseText);
                if (json_data) {
                    if (!json_data.status) {
                        cookie_ = '';
                    }
                    console(json_data.message);
                }
                callback && callback();
			} else {
				console("Login http error: " + xmlhttp.status);
			}
		}
	}

}

function load_cached_list() {

}



function get_everyday_songs () {

    g_results = [];
    scroll = 0;
    add_idx = 0;
    load = false;

    var xmlhttp_ = utils.CreateHttpRequest("GET");

	xmlhttp.open("GET", "http://www.xiami.com/song/playlist/id/1/type/9/cat/json", true);
    xmlhttp.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var obj = json(xmlhttp.responseText);
                var locations = [];
                var send_to_list = get_target_playlist();
                plman.ActivePlaylist = send_to_list;
				if (obj["data"] && obj["data"]["trackList"]) {
					var trackList = obj.data.trackList;
					//plman.ClearPlaylist(0);
					for (var i = 0; i < trackList.length; i++) {
                        var temp_text,
                            temp_arr;

                        temp_text = trackList[i].title + " ||| " + trackList[i].album_name + " ||| " + trackList[i].artist;
                        temp_text = stripTags(temp_text).replace(";", ", ");
                        temp_arr = temp_text.split(" ||| ");

						g_results.push({
                            type: "song",
							//title: stripTags(trackList[i].title),
                            title: temp_arr[0],
							//album_name: stripTags(trackList[i].album_name),
                            album_name: temp_arr[1],
							//artist: trackList[i]["artist"],
                            artist: temp_arr[2],
							location: getLocation(trackList[i]["location"]),
							artist_url: trackList[i]["artist_url"],
							album_url: "http://www.xiami.com/album/"+trackList[i]["album_id"],
							lyric_url: trackList[i]["lyric_url"],
							length_: utils.FormatDuration(Number(trackList[i]["length"])),
						});
                        locations.push(g_results[i].location);
                        //plman.AddLocations(send_to_list, [g_results[i].location]);
					}
                    plman.ProcessLocationsAsync([locations[add_idx]]);


                    // After genarating list
					total_h = row_height * g_results.length;
					window.Repaint();

                    //get_cookie();

					// TEST

					for (var i in g_results[0]) {
						//console(g_results[0][i]);
					}
					for (var i = 0; i < g_results.length; i++) {
						//console(g_results[i].title);
					}
					// /TEST
				}
			} else {
				console("HTTP error: " + xmlhttp.status);
			}
		}
	}
}


function stripTags(value) {
	doc.open();
	var div = doc.createElement("div");
	div.innerHTML = value.toString().replace(/<[Pp][^>]*>/g, "").replace(/<\/[Pp]>/g, "<br>").replace(/\n/g, "<br>");
	value = div.innerText.trim();
	doc.close();
	return value;
}


/*
function search_song_by_name(name) {
    var search_url = function(str) {
        str = str.trim().replace(/\s+/g, "+");
        return ("http://www.xiami.com/search/song/?key=" + str);
    }

    console(search_url(name));
    xmlhttp.open("GET", search_url(name), true);
    xmlhttp.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                var songidRe = new RegExp("<a.*href=\".*?/song/(\\d+).*?>", "g");
                var song_arr = [];
                var song_elem;
                //console(xmlhttp.responseText);
                if (xmlhttp.responseText) {
                    for (var i = 0; ; i++) {
                        song_elem = songidRe.exec(xmlhttp.responseText);
                        if (song_elem == null) {
                            break;
                        }
                        song_arr[i] = song_elem[1];
                    }
                }

                console(song_arr.length);
                if (song_arr.length > 0) {
                    console(song_arr[0]);
                }
                get_songs(song_arr);
            } else {
                // http error
            }
        }
    }

}

function get_songs(songid_arr) {

    total_h = 0;
    g_results = [];
    add_idx = 0;

    var idx = 0;

    var song_url = function(song_id) {
        return ("http://www.xiami.com/song/playlist/id/" + song_id + "/type/0/cat/json");
    }

    var get_song = function() {
        xmlhttp.open("GET", song_url(songid_arr[idx]), true);
		xmlhttp.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    try {
                        var obj = json(xmlhttp.responseText).data.trackList[0];
                        g_results.push({
                            type: "song",
                            title: obj.title,
                            album_name: obj.album_name,
                            artist: obj.artist,
                            location: getLocation(obj.location),
                            artist_url: obj.artist_url,
                            album_url: "http://www.xiami.com/album/" + obj.album_id,
                            lyric_url: obj.lyric_url,
                            length_: utils.FormatDuration(Number(obj.length))
                        });
                    } catch (e) {}

                    total_h = row_height * g_results.length;
                    window.Repaint();

                    if (idx < songid_arr.length) {
                        get_song();
                    }

                    idx++;
                    if (idx == g_results.length) {
                        plman.ProcessLocationsAsync([g_results[0].location]);
                    }

                } else {
                    // http error
                }
            }
        }
    }

    plman.ActivePlaylist = get_target_playlist();
    get_song();

}
*/

/*
 * Use Musicuu's api instead */

function search_song_by_name(name) {
    var search_url = function(str) {
        str = str.trim().replace(/\s+/g, "+");
        return ("http://api.musicuu.com/music/search/xm/" + str +"/1?format=json");
    }

    g_results = [];
    scroll = 0;
    add_idx = 0;
    load = false;
    plman.ActivePlaylist = get_target_playlist();

    xmlhttp.open("GET", search_url(name), true);
    console(search_url(name));
    xmlhttp.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                //try {
                var track_list = json(xmlhttp.responseText);
                for (var i = 0; i < track_list.length; i++) {
                    var track = track_list[i];
                    g_results.push({
                        type: "song",
                        title: track["SongName"],
                        album_name: track["Album"],
                        artist: track["Artist"],
                        length_: track["Length"],
                        location: track["LqUrl"],
                        artist_url: "",
                        lyric_url: "",
                        album_url: ""
                    })
                }

                plman.ProcessLocationsAsync([g_results[0].location]);
                total_h = row_height * g_results.length;
                window.Repaint();
                //} catch (e) {};
            } else {
                // ...
            }
        }
    }

}

function search_album_by_name(name) {
    var search_url = function(str) {
        str = str.trim().replace(/\s+/g, "+");
        return ("http://www.xiami.com/search/album/?&key=" + str);
    }

    g_results = [];
    scroll = 0;
    total_h = 0;
    add_idx = 0;
    load = false;
    plman.ActivePlaylist = get_target_playlist();
    
    xmlhttp.open("GET", search_url(name), true);
    xmlhttp.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                var albumidRe = new RegExp("<a href=\".*?/album/(\\d+).*?>", "g");
                var album_arr = [];
                var album_elem;

                for (var i = 0; ; i++) {
                    album_elem = albumidRe.exec(xmlhttp.responseText);
                    if (album_elem == null) {
                        break;
                    }
                    album_arr.push(album_elem[1]);
                }

                //console(album_arr.length);
                get_albums(album_arr);
            } else {
                // http error
            }
        }
    }

}

function get_albums(albums) {

    var idx = 0;

    var album_url = function (album_id) {
        return ("http://www.xiami.com/song/playlist/id/" + album_id + "/type/1/cat/json");
    }

    var get_album = function() {
        xmlhttp.open("GET", album_url(albums[idx]), true);
    //console(album_url(albums[idx]));
		xmlhttp.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    try {
                        var track_list = json(xmlhttp.responseText).data.trackList;
                        var track = track_list[0];
                        var temp_tracks = [];

                        for (var i = 0; i < track_list.length; i++) {
                            if (track_list[i].title.length > 0) {
                            temp_tracks.push({
                                type: "song",
                                title: track_list[i].title,
                                album_name: track_list[i].album_name,
                                artist: track_list[i].artist,
                                location: getLocation(track_list[i].location),
                                artist_url: track_list[i].artist_url,
                                album_url: "",
                                lyric_url: "",
                                length_: utils.FormatDuration(Number(track_list[i].length))
                            })
                            }
                        }
                        
                        g_results.push({
                            type: "album",
                            album_name: track.album_name,
                            artist: track.artist,
                            album_url: "",
                            artist_url: "",
                            tracks: temp_tracks,
                        })
                    } catch (e) { }

                    total_h = row_height * g_results.length;
                    window.Repaint();

                    if (idx < albums.length) {
                        get_album();
                    } else {
                        load = true;
                    }
                    idx++;
                } else {
                    // http error
                }
            }
        }
    }

    get_album();

}



function get_images() {

    var colors = [
        blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.3),
        g_colors.txt_normal,
        g_colors.highlight
    ];
    var imgarr, img, g, s, i;
    var w = 24, 
        h = 24;
    var sf = StringFormat(1, 1);
    var ico_font = gdi.Font("FontAwesome", 14);
    var txt_render = 3;

    var obj_name, icons;

    obj_name = ("loupe,reset").split(",");
    icons = ["\uF002", "\uF057"];
    for (i = 0; i < obj_name.length; i++) {

        imgarr = [];
        for (s = 0; s < 3; s++) {
            img = gdi.CreateImage(w, h);
            g = img.GetGraphics();
            g.SetTextRenderingHint(txt_render);

            g.DrawString(icons[i], ico_font, colors[s], 0, 0, w, w, sf);

            g.SetTextRenderingHint(0);
            img.ReleaseGraphics(g);
            imgarr[s] = img;
        }

        g_images[obj_name[i]] = imgarr;

    }

    g_buttons["loupe"] = new Button(g_images.loupe);
    g_buttons["reset"] = new Button(g_images.reset);

}

        

function get_colors() {
    if (g_color_scheme == 0) {
        g_colors = get_default_colors();
    } else {
        g_colors = COLOR_SCHEME[g_color_scheme - 1];
    }
    window.NotifyOthers("Color scheme status", g_color_scheme);
}

function get_default_colors () {
    var result = {};

    if (window.InstanceType == 1) {
        result.txt_normal = window.GetColorDUI(ColorTypeDUI.text);
        result.bg_normal = window.GetColorDUI(ColorTypeDUI.background);
        result.bg_selected = window.GetColorDUI(ColorTypeDUI.selection);
        result.highlight = window.GetColorDUI(ColorTypeDUI.highlight);
        var c = combineColors(result.bg_normal, result.bg_selected)
        if (Luminance(c) > 0.6) {
            result.txt_selected = RGB(30, 30, 30);//blendColors(result.txt_normal, 0xff000000, 0.3);
        } else {
            result.txt_selected = RGB(235, 235, 235);//blendColors(result.txt_normal, 0xffffffff, 0.3);
        };
    } else { 
        try {
            result.txt_normal = window.GetColorCUI(ColorTypeCUI.text);
            result.txt_selected = window.GetColorCUI(ColorTypeCUI.selection_text);
            result.bg_normal = window.GetColorCUI(ColorTypeCUI.background);
            result.bg_selected = window.GetColorCUI(ColorTypeCUI.selection_background);
            result.highlight = window.GetColorCUI(ColorTypeCUI.active_item_frame);
        } catch (e) {
            result = COLOR_SCHEME[0];
        } 
    };

    return result;
}

function get_target_playlist() {
    var total_pls = plman.PlaylistCount;
    var i;
    var target_id = -1;

    for (i = 0; i < total_pls; i++) {
        if (plman.GetPlaylistName(i) == "Online") {
            target_id = i;
            break;
        }
    }

    if (target_id > -1) {
        plman.ClearPlaylist(target_id);
    } else {
        target_id = total_pls;
        plman.CreatePlaylist(target_id, "Online");
    }
    return target_id;
}

function get_online_pl() {
    var total_ = plman.PlaylistCount;
    var i;
    for (i = 0; i < total_; i++) {
        if (plman.GetPlaylistName(i) == "Online") {
            return i;
        }
    }
    return -1;
}

function set_buttons() {

    g_buttons.tabs = [];

    var text_arr = ["每日推荐", "歌曲", "专辑", "歌手", "歌词"];
    var tab_font = gdi.Font("Segoe UI", 14);
    var color = g_colors.highlight;

    for (var i = 0; i < text_arr.length; i++) {
        g_buttons.tabs[i] = new TextButton(text_arr[i], tab_font, color);
    }

    g_buttons.account = new TextButton("\uF007", gdi.Font("FontAwesome", 18), g_colors.txt_normal);

}


var TextButton = function(text, font, color, func) {
    this.text = text;
    this.font = font;
    this.font_ = gdi.Font(font.Name, font.Size, 4);
    this.font__ = gdi.Font(font.Name, font.Size+2, 1);
    this.color = color;
    this.func = func;
    this.state = 0;
    this.is_down = false;
    this.is_hover = false;
}

TextButton.prototype.draw = function (gr, x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    var ft = (this.state > 0 ? this.font_ : this.font);
    gr.GdiDrawText(this.text, ft, this.color, x, y, w, h, DT_CC);
}
TextButton.prototype.repaint = Button.prototype.repaint;
TextButton.prototype.on_click = Button.prototype.on_click;
TextButton.prototype.set_xy = Button.prototype.set_xy;
TextButton.prototype.reset = Button.prototype.reset;
TextButton.prototype.check_state = Button.prototype.check_state;




var total_h = 0;
var total_rows = 0;
var total_visible_rows = 0;
var scroll = 0;
var need_scrollbar = false,
    cursor_h = 0,
    cursor_y = 0;
var margin_top = 100;
var row_height = 50;
var begin, end;
var font_1 = gdi.Font("Segoe UI", 14);
var font_2 = gdi.Font("Segoe UI", 12);

var test_mode = false;

function on_size() {

	ww = Math.max(window.Width, 380);
	wh = window.Height;
	if (!ww || !wh) {
		return;
	}

	total_rows = Math.ceil((wh - margin_top) / row_height);
	total_visible_rows = Math.floor((wh - margin_top) / row_height);

}


function on_paint(gr) {

	// Bg
	gr.FillSolidRect(0, 0, ww, wh, g_colors.bg_normal);

	// List

    if (plman.PlayingPlaylist == get_online_pl()) {
        playing_idx = plman.GetPlayingItemLocation().PlaylistItemIndex;
    } else {
        playing_idx = -1;
    }
	
	var total = g_results.length;
	var total_h = row_height * total;

	if (total <= total_visible_rows) {
		begin = 0;
		end = total - 1;
	} else {
		begin = Math.floor(scroll / row_height);
		end = begin + total_rows;
		if (begin < 0) {
			begin = 0;
		}
		if (end >= total) {
			end = total - 1;
		}
	}

	var rx = 15, 
		ry = 0, 
		rw = ww - 30, 
		rh = row_height;

	var txt_color1 = g_colors.txt_normal,
		txt_color2 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.3);

	var font1 = gdi.Font("Segoe UI", 14);
    var font1_u = gdi.Font("Segoe UI", 14, 4);
    var font1_b = gdi.Font("Segoe UI", 14, 1);
    var font1_bl = gdi.Font("Segoe UI", 14, 3);
	var font2 = gdi.Font("Segoe UI", 12);

    if (wh - margin_top < total_h) {
        rw -= 12;
    }

    //-------------------
    //=> draw result list
    //-------------------
	for (var i = begin; i <= end; i++) {

		ry = margin_top + i * rh - scroll;
		obj = g_results[i];

		if (i % 2) {
			gr.FillSolidRect(rx, ry, rw, rh, 0x05000000);
		} else {
			gr.FillSolidRect(rx, ry, rw, rh, 0x05ffffff);
		}

        switch (g_results[i].type) {
            case "song":

                if (playing_idx == i) {
                    txt_color1 = g_colors.highlight;
                    txt_color2 = blendColors(txt_color1, g_colors.bg_normal, 0.3);
                } else {
                    txt_color1 = g_colors.txt_normal;
                    txt_color2 = blendColors(txt_color1, g_colors.bg_normal, 0.3);
                }

                // list_index
                gr.GdiDrawText(i+1, font2, txt_color2, rx, ry+5, 30, rh/2, DT_CC);
                test_mode && gr.DrawRect(rx, ry+5, 29, rh/2-1, 1, 0xffaabbcc);
                // 
                if (i != hover_idx) {
                    gr.GdiDrawText(obj.title, font1, txt_color1, rx+30, ry+5, rw-110, rh/2, DT_LC);
                } else {
                    gr.GdiDrawText(obj.title, gdi.Font("Segoe UI", 14, 4), txt_color1, rx+30, ry+5, rw-110, rh/2, DT_LC);
                }
                test_mode && gr.DrawRect(rx+30, ry+5, rw-109, rh/2-1, 1, 0xffaabbcc);
                gr.GdiDrawText(obj.artist, font2, txt_color2, rx+30, ry+rh/2, rw -110, rh/2, DT_LC);

                // length
                gr.GdiDrawText(obj.length_, font1, txt_color2, rx+rw-60, ry+5, 50,rh/2, DT_RC);

                break;
            case "album":
                gr.GdiDrawText(i+1, font2, txt_color2, 25, ry+5, row_height-10, row_height-10, DT_CC);
                gr.FillSolidRect(25, ry+5, row_height - 10, row_height-10, 0x20000000);
                if (i == hover_idx) {
                    gr.GdiDrawText(obj.album_name, font1_u, txt_color1, 20 +row_height + 5,
                            ry+5, rw-row_height-10, rh/2, DT_LC);
                } else {
                    gr.GdiDrawText(obj.album_name, font1_b, txt_color1, 20 +row_height + 5,
                            ry+5, rw-row_height-10, rh/2, DT_LC);
                }
                gr.GdiDrawText(obj.artist, font2, txt_color2, 20+row_height + 5,
                        ry+rh/2, rw-row_height-10, rh/2, DT_LC);
                break;
        }

	}

    //------------------
    // Scrollbar
    //------------------
    if (wh - margin_top < total_h) {
        rw -= 12;
        cursor_h = Math.round((wh-margin_top) / total_h * (wh - margin_top));
        if (cursor_h < 25) {
            cursor_h = 25;
        }
        cursor_y = margin_top + Math.round((wh - margin_top -cursor_h) * scroll / (total_h - wh + margin_top));
        // draw
        gr.FillSolidRect(ww - 11, cursor_y, 10, cursor_h, g_colors.txt_normal & 0x33ffffff);    
    }


    // 覆盖溢出部分
	gr.FillSolidRect(0, 0, ww, 100, g_colors.bg_normal);
    gr.FillSolidRect(0, margin_top-1, ww, 1, g_colors.txt_normal & 0x20ffffff);
    
    //------------
    // Searchbox
    //-------------
    g_inputbox.backcolor = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.95);
    g_inputbox.w = 160;//ww - 40 - 28 - 28;
    g_inputbox.h = 22;

    gr.FillSolidRect(20, 15, g_inputbox.w+56, 28, g_inputbox.backcolor);
    if (g_inputbox.edit) {
        gr.DrawRect(21, 16, g_inputbox.w+54, 26, 2, g_colors.txt_normal);
    } else {
        gr.DrawRect(21, 16, g_inputbox.w+54, 26, 2, g_colors.txt_normal & 0x50ffffff);
    }
    g_inputbox.draw(gr, 48, 18);

    //-----------
    // Buttons
    //-----------
    if (g_inputbox.text.length > 0) {
        g_buttons.reset.set_xy(g_inputbox.x+g_inputbox.w+1, 15+2);
        g_buttons.reset.draw(gr);
    }
    g_buttons.loupe.set_xy(20+2, 15+2);
    g_buttons.loupe.draw(gr);

    // tabs
    var tx = 15;
    var ty = 60;
    var tw = 0;

    for (var i = 0; i < g_buttons.tabs.length; i++) {
        var b = g_buttons.tabs[i];
        if (search_mode == i) {
            b.font = gdi.Font(b.font.Name, 15, 1);
            b.font_ = b.font;
            b.color = g_colors.txt_normal;
        } else {
            b.font = gdi.Font(b.font.Name, 14, 0);
            b.font_ = gdi.Font(b.font.Name, 14, 4);
            b.color = g_colors.highlight;
        }
        tw = gr.CalcTextWidth(b.text, b.font) + 20;
        b.draw(gr, tx, ty, tw, 28, DT_CC);
        tx += tw;
    }

    // accrount
    //user_nick_name = "jeannela";
    if (user_nick_name && user_nick_name.length > 0) {
        var tw = Math.ceil(gr.CalcTextWidth(user_nick_name, font2));
        gr.GdiDrawText(user_nick_name, font2, g_colors.txt_normal, ww-20-tw, 15, tw, 28, DT_CC);
        g_buttons.account.color = blendColors(g_colors.highlight, g_colors.bg_normal, 0.1);
        g_buttons.account.draw(gr, ww - 48-tw-5, 15, 28, 28);
    } else {
        var tw = Math.ceil(gr.CalcTextWidth("login", font2));
        gr.GdiDrawText("login", font2, g_colors.txt_normal, ww-20-tw, 15, tw, 28, DT_CC);
        g_buttons.account.color = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.5);
        g_buttons.account.draw(gr, ww - 48-tw-5, 15, 28, 28);
    }
	
}


var is_hover = false,
	hover_idx = null,
    playing_idx = -1;


function on_mouse_move(x, y) {

    // inputbox
    g_inputbox.check("move", x, y);

    // buttons
    g_buttons.loupe.check_state("move", x, y);
    if (g_inputbox.text.length > 0) {
        g_buttons.reset.check_state("move", x, y);
    }
    for (var i = 0; i < g_buttons.tabs.length; i++) {
        g_buttons.tabs[i].check_state("move", x, y);
    }
    g_buttons.account.check_state("move", x, y);

    var temp_idx = hover_idx;

	is_hover = (x > 15 && x < ww-15 && y > 100 && y < wh);
	if (is_hover) {
		hover_idx = Math.floor((y + scroll - 100) / row_height);
		if (hover_idx < 0 || hover_idx >= g_results.length) {
			hover_idx = -1;
		}
	} else {
		hover_idx = -1;
	}

    if (temp_idx != hover_idx) {
        window.Repaint();
    }
}


function isFile(str) {
	return fso.FileExists(str);
}

function on_mouse_lbtn_down(x, y, mask) {
    // inputbox
    g_inputbox.check("down", x, y);
    // buttons
    
    if (g_buttons.loupe.check_state("down", x, y) == 2) {;
        if (g_inputbox.text.length > 0 && search_mode > 0) {
            g_search_func();
        }
    }
    if (g_inputbox.text.length > 0) {
        if (g_buttons.reset.check_state("down", x, y) == 2) {;
            g_inputbox.text = "";
            g_inputbox.offset = 0;
            window.Repaint();
        }
    }
    for (var i = 0; i < g_buttons.tabs.length; i++) {
        if (g_buttons.tabs[i].check_state("down", x, y) == 2) {
        }
    }

    g_buttons.account.check_state("down", x, y);
}

function on_mouse_lbtn_up(x, y, mask) {
    g_inputbox.check("up", x, y);

    // button
    if (g_buttons.loupe.check_state("up", x, y) == 1) {
        /*
        if (g_inputbox.text.length > 0 && search_mode > 0) {
            g_search_func();
        }
        */
    }

    if (g_inputbox.text.length > 0) {
        if (g_buttons.reset.check_state("up", x, y) == 1) {
            /*
            g_inputbox.text = "";
            g_inputbox.offset = 0;
            window.Repaint();
            */
        }
    }
    
    for (var i = 0; i < g_buttons.tabs.length; i++) {
        if (g_buttons.tabs[i].check_state("up", x, y) == 1) {
            temp_mode = search_mode;
            search_mode = i;
            if (temp_mode != search_mode) {
                switch (i) {
                    case 0:
                        get_everyday_songs();
                        break;
                    case 1:
                    case 2:
                        if (g_inputbox.text.length > 0) {
                            g_search_func();
                        }
                        break;
                }
                window.Repaint();
            }
        }
    }

    if (g_buttons.account.check_state("up", x, y) == 1) {
        var temp_email = set_email();
        var temp_pwd = set_password();
        if (temp_email != email) {
            email = temp_email;
            password = temp_pwd;
            logout(function() {
                login(email, password, get_everyday_songs);
            });
        } else {
            if (password != temp_pwd) {
                password = temp_pwd;
                login(email, password, get_everyday_songs);
            }
        }
    }
}

function on_mouse_lbtn_dblclk(x, y, mask) {

    g_inputbox.check("dblclk", x, y);


	is_hover = (x > 15 && x < ww-15 && y > 100 && y < wh);
	if (is_hover) {
		hover_idx = Math.floor((y + scroll - 100) / row_height);
		if (hover_idx < 0 || hover_idx >= g_results.length) {
			hover_idx = -1;
		}
	} else {
		hover_idx = -1;
	}

	if (hover_idx > -1) {
        switch (g_results[0].type) {
            case "song":
                try {
                    plman.ExecutePlaylistDefaultAction(get_online_pl(), hover_idx);
                } catch (e) {};
                break;
            case "album":
                if (!load) {
                    return;
                }
                if (g_results[hover_idx].tracks.length > 0) {
                    var temp = g_results[hover_idx].tracks;
                    g_results.length = 0;
                    g_results = temp;
                    scroll = 0;
                    load = false;
                    total_h = row_height * g_results.length;
                    plman.ActivePlaylist = get_target_playlist();
                    plman.ProcessLocationsAsync([g_results[0].location]);

                    window.Repaint();
                }
                break;
        }
	}
}

function on_mouse_rbtn_up(x, y, mask) {
    g_inputbox.check("right", x, y);
}

function on_mouse_wheel(step) {
	if (total_h <= wh - 100) {
		return;
	}
	scroll -= step * 3 * row_height;
	check_scroll();
	window.Repaint();
}

function check_scroll() {
	if (scroll < 0) {
		scroll = 0;
	}
	if (scroll + wh - 100 > total_h) {
		scroll = total_h - (wh - 100);
	}
}

function on_mouse_leave() {
    hover_idx = -1;
    window.Repaint();
}

function on_key_down(vkey) {
    g_inputbox.on_key_down(vkey);
}

function on_char(code) {
    g_inputbox.on_char(code);
}

function on_focus(is_focused) {
    g_inputbox.on_focus(is_focused);
}


function on_process_locations_done(metadbs) {
    plman.InsertPlaylistItems(plman.ActivePlaylist, plman.PlaylistItemCount(plman.ActivePlaylist), metadbs, select = false);
    add_idx++;
    if (add_idx < g_results.length) {
        plman.ProcessLocationsAsync([g_results[add_idx].location]);
    } else {
        load = true;
    }
}

function on_colors_changed() {
    get_colors();
    window.Repaint();
}

function on_font_changed() {
    window.Repaint();
}

function on_playback_pause(state) {
    window.Repaint();
}

function on_playback_new_track(metadb) {
    if (plman.PlayingPlaylist == get_online_pl()) {
        playing_idx = plman.GetPlayingItemLocation().PlaylistItemIndex;
    } else {
        playing_idx = -1;
    }
    if (g_results[playing_idx]) {
        var obj = g_results[playing_idx];
        var cap = obj.artist + " - " + obj.title;
        GetFBWnd().Caption = cap;
    }
    window.Repaint();
}

function on_playback_starting(cmd, is_paused) {
}

function on_playback_stop(reason) {
    if (reason != 2) {
        window.Repaint();
    }
    GetFBWnd().Caption = "foobar2002";
}


function createFolder(name) {
	if (!isFolder(name)) { fso.CreateFolder(name); }
}

function isFolder(name) {
	return fso.FolderExists(name);
}

function check_env() {
    //var user_folder = WshShell.SpecialFolders.Item("MyDocuments");

    createFolder(data_folder);
    if (!isFolder(data_folder)) {
        alert("Warning! can't create cfg folder: " + data_folder);
    }
}

function open(file_name) {
    return utils.ReadTextFile(file_name);
}


function get_cookie() {
    var cookie_file = data_folder + "\\COOKIE";
    if (isFile(cookie_file)) {
        cookie_ = utils.ReadTextFile(cookie_file).trim();
    } else {
        cookie_ = '';
    }
    return cookie_;
}

function get_email() {
    var email_file = data_folder + "\\EMAIL";
    if (isFile(email_file)) {
        email = utils.ReadTextFile(email_file).trim();
    } else {
        email = '';
    }
    return email;
}

function get_password() {
    var password_file = data_folder + "\\PASSWORD";
    if (isFile(password_file)) {
        password = utils.ReadTextFile(password_file).trim();
    } else {
        password = '';
    }
    return password;
}

function set_password() {
    var pwd_;
    var password_file = data_folder + "\\PASSWORD";

    pwd_ = InputBox("Login", "Input your password:", password, false);
    pwd_ = pwd_.trim();
    if (!save_to_file(pwd_, password_file)) {
        console("failed to save password file");
    }
    return pwd_;
}

function set_email() {
    var email_;
    var email_file = data_folder + "\\EMAIL";
    
    email_ = InputBox("Login", "Input your email:", email, false);
    email_ = email_.trim();
    if (!save_to_file(email_, email_file)) {
        console("failed to save email file!");
    }
    return email_;
}

function save_to_file(value, file, format) {
    try {
        var ts = fso.OpenTextFile(file, 2, true, format || 0);
        ts.WriteLine(value);
        ts.Close();
        return true;
    } catch (e) {
        return false;
    }
}

var user_id = "",
    user_nick_name = "",
    user_avantar = "",
    user_avantar_url = "";

function get_user_info() {
    if (!cookie_ || cookie_.length == 0) {
        return;
    }
    var user_inf = decodeURIComponent(cookie_).split(";")[0].replace(/^user=/,"");
    console(user_inf);
    var infos = user_inf.split("\"");
    for (var i = 0; i < infos.length; i++) {
        console(infos[i]);
    }

    user_id = infos[0];
    user_nick_name = infos[1];
    user_avantar_url = "http://img.xiami.net/" + infos[2];

    window.Repaint();
    return infos;
}

function g_search_func() {

    if (fb.IsPlaying) {
        //fb.Stop();
    }

    switch (search_mode) {
        case 0:
            break;
        case 1:
            search_song_by_name(g_inputbox.text);
            break;
        case 2:
            search_album_by_name(g_inputbox.text);
            break;
    }
}

// =================
// Main:
// =================
// foobar
window.DlgCode = DLGC_WANTALLKEYS;

get_colors();
get_images();
set_buttons();
g_inputbox = new oInputbox(20, 22, "", "搜索歌曲、专辑、艺术家", g_colors.txt_normal, 
        g_colors.bg_normal, 0, g_colors.bg_selected, g_search_func, "window");



// online

check_env();
get_email();
get_password();
get_cookie();
get_user_info();


//------------------------------------------------------------------------------------
function json(text) {
	try{
		var data=JSON.parse(text);
		return data;
	}catch(e){
		fb.trace("Invalid JSON file");
		return false;
	}
}

//json2.js
if(typeof JSON!=='object'){JSON={};}
(function(){'use strict';function f(n){return n<10?'0'+n:n;}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+
('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');};}}());
