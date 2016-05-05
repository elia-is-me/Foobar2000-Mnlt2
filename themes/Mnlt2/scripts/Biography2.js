// vim:set ft=javascript fileencoding=utf-8 bomb et:

// ==PREPROCESSOR==
// @author "elia_is_me"
// @feature "v1.4"
// @feature "watch-metadb"
// @import "%fb2k_profile_path%themes\Mnlt2\common\common4.js"
// ==/PREPROCESSOR==

// Require:
// -> foobar2000 v1.3.3 or newer >>> http://www.foobar2000.org
// -> WSH Panel Mod Plus v1.5.7.4 >>> https://github.com/ttsping/foo_uie_wsh_panel_mod_plus/releases
//
// -> Please check off "Grab Focus" and "Delay Load"
//
// Update: 2016-04-19


// UI language translation
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

var is_safe_mode = false;
var fso, WshShell, doc;

try {
	fso = new ActiveXObject("Scripting.FileSystemObject");
	WshShell = new ActiveXObject("WScript.Shell");
	doc = new ActiveXObject("htmlfile");
	is_safe_mode = false;
} catch (e) {
	is_safe_mode = true;
}

var DT_CC = DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var DT_LC = DT_VCENTER | DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var DT_LT = DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;

var ww = 0,
	wh = 0;

var Fonts = {}, 
	Color = {};

var album_pic = null;
var album_title = "";
var current_metadb = null;


//Fonts.album_title = gdi.Font("Segoe UI", 18);
Fonts.rating1 = gdi.Font("Segoe UI Symbol", 16);
Fonts.info_item = gdi.Font("Segoe UI", 12);
Fonts.info_header = gdi.Font("Segoe UI", 18);

// on init

get_color();
get_fonts();
on_metadb_changed();


function get_douban_info () {

}

function search_douban () {

}




// Callbacks

function on_size() {
	ww = Math.max(window.Width, 320);
	wh = window.Height;
}



function on_paint(gr) {

	// background
	gr.FillSolidRect(0, 0, ww, wh, Color.back);

	// ...
	var offset_y = 15,
		offset_x = 15;

	var item_w = ww - 30,
		item_h = Fonts.album_title.Height * 2.0;
	
	// Album title
	//gr.FillSolidRect(offset_x, offset_y, item_w, item_h, 0x20aabbcc);
	gr.GdiDrawText(album_title, Fonts.album_title, Color.text, offset_x, offset_y, item_w, item_h, DT_LC);

	offset_y += item_h;
	// Album cover
	if (album_pic) {
		gr.DrawImage(album_pic, offset_x, offset_y, album_pic.Width, album_pic.Height, 0, 0, album_pic.Width, album_pic.Height, 0, 255);
	} else {
		gr.FillSolidRect(offset_x, offset_y, 100, 100, 0x20000000);
	}

	offset_x += 100 + 15;
	// Album rating info
	/*
	gr.FillSolidRect(offset_x, offset_y, ww - offset_x - 15, 28, 0x2000aabb);
	gr.GdiDrawText("\u2605\u2605\u2605\u2605\u2605", Fonts.rating1, 0xff000000, offset_x, offset_y, ww - offset_x - 15, 28, DT_LT);
	gr.FillSolidRect(offset_x, offset_y + 27, ww - offset_x - 15, 1, 0x10000000);
	*/
	var arr1 = ["表演者", "流派", "专辑类型", "介质", "发行时间", "出版者"];
	var arr2 = ["王菲", "流行", "专辑", "CD", "1997-09-30", "EMI"];
	
	item_h = Fonts.item.Height * 1.5;
	item_w = ww - offset_x - 15;

	var text_w = 0;

	for (var i = 0; i < arr1.length; i++)　{
		gr.GdiDrawText(arr1[i] + ": ", Fonts.item, Color.text, offset_x, offset_y, item_w, item_h, DT_LT);
		text_w = gr.CalcTextWidth(arr1[i] + ": ", Fonts.item);
		gr.GdiDrawText(arr2[i], Fonts.item, Color.text, offset_x + text_w, offset_y, item_w - text_w, DT_LT);
		offset_y += item_h;
	}


	// Album bio info
	
	//offset_y += 40;
	offset_x = 15;
	gr.GdiDrawText("专辑简介", Fonts.header, Color.highlight, offset_x, offset_y, ww - offset_x - 15, Fonts.header.Height * 2.0, DT_LC);

	// info text (list)
	offset_y += Fonts.header.Height * 2.0;
	item_w = ww - 15 * 2;

	var arr3 = ["　　这是简介示例", "仅此而已...", "并没有什么特殊", "用处"];
	
	for (var i = 0; i < arr3.length; i++) {
		gr.GdiDrawText(arr3[i], Fonts.item, Color.text, offset_x, offset_y, item_w, item_h, DT_LT);
		offset_y += item_h;
	}


	// Album tracks
	//offset_y += 30;
	gr.GdiDrawText("曲目", Fonts.header, Color.highlight, offset_x, offset_y, item_w, Fonts.header.Height * 2, DT_LC);
	offset_y += Fonts.header.Height * 2.0;

	var tracks = ["track1", "track2", "track3", "track4", "track5"];

	for (var i = 0; i < tracks.length; i++) {
		gr.GdiDrawText("" + (i+1) + ".  " + tracks[i], Fonts.item, Color.text, offset_x, offset_y, item_w, item_h, DT_LT);
		offset_y += item_h;
	}

}


function on_metadb_changed(handle_list, fromhook) {
	//
	current_metadb = fb.IsPlaying ? fb.GetNowPlaying() : null;

	if (current_metadb) {
		album_title = $("[%album%]", current_metadb);
		utils.GetAlbumArtAsync(window.ID, current_metadb, 0);
	} else {
		album_pic = null;
		album_title = "";
		window.Repaint();
	}

}

function on_playback_new_track (metadb) {
	on_metadb_changed();
}

function on_playback_stop (reason) {
	if (reason != 2) {
		on_metadb_changed();
	}
}

function on_get_album_art_done (metadb, art_id, image, image_path) {

	if (!image) {
		album_pic = null;
		window.Repaint();
		return;
	}

	var img_w = 100, 
		img_h = 100 / image.Width * image.Height;

	album_pic = image.Resize(img_w, img_h);

	window.Repaint();

}


function on_colors_changed() {
	get_color();
	window.Repaint();
}

function on_font_changed() {
	get_fonts();
	window.Repaint();
}



function lmap (name) {
	return Language.Map(name);
}

function get_color() {

	Color = get_default_color();
	return Color;

}


function get_default_color() {

	var res = {};

	if (window.InstanceType == 1) {
        res.text = window.GetColorDUI(ColorTypeDUI.text);
        res.back = window.GetColorDUI(ColorTypeDUI.background);
        res.back_sel = window.GetColorDUI(ColorTypeDUI.selection);
        res.highlight = window.GetColorDUI(ColorTypeDUI.highlight);
	} else {
		res.text = window.GetColorCUI(ColorTypeCUI.text);
		res.text_sel = window.GetColorCUI(ColorTypeCUI.selection_text);
		res.back = window.GetColorCUI(ColorTypeCUI.background);
		res.back_sel = window.GetColorCUI(ColorTypeCUI.selection_background);
		res.highlight = window.GetColorCUI(ColorTypeCUI.active_item_frame);
	} 

	return res;

}

function get_fonts() {

    Fonts.name = fb.TitleFormat(window.GetProperty(lmap("Font name"), "")).Eval(true);

	if (!utils.CheckFont(Fonts.name)) {
		try {
			var default_font = (window.InstanceType == 1 ? window.GetFontDUI(3) : window.GetColorCUI(0));
			Fonts.name = default_font.Name;
			Fonts.size = default_font.Size;
		} catch (e) {
			Fonts.name = "Segoe UI";
			Fonts.size = 12;
			console("载入默认字体失败，使用 " + Fonts.name + " 代替.");
		}
	}

	Fonts.album_title = gdi.Font(Fonts.name, 18, 1);
	Fonts.item = gdi.Font(Fonts.name, 12);
	Fonts.header = gdi.Font(Fonts.name, 14);

}


function stripTags(value) {
	doc.open();
	var div = doc.createElement("div");
	div.innerHTML = value.toString().replace(/<[Pp][^>]*>/g, "").replace(/<\/[Pp]>/g, "<br>").replace(/\n/g, "<br>");
	value = div.innerText.trim();
	doc.close();
	return value;
}

function getElementsByTagName(value, tag) {
	doc.open();
	var div = doc.createElement("div");
	div.innerHTML = value;
	var data = div.getElementsByTagName(tag);
	doc.close();
	return data;
};


function processLineWrap(string, font, width) {
	var tmp = gdi.CreateImage(1, 1);
	var g = tmp.GetGraphics();
	var result = [];
	var paragraphs = string.split("\n");
	var l = paragraphs.length;
	var lines;
	//alert(paragraphs[0]);
	for (var i = 0; i < l; i++) {
		lines = g.EstimateLineWrap(paragraphs[i], font, width).toArray();
		//alert(lines[0]);
		var l2 = lines.length;
		for (var j = 0; j < l2; j+= 2) {
			result.push(lines[j].trim());
		}
	}
	tmp.ReleaseGraphics(g);
	tmp.Dispose();

	return result;
}
