// vim:set ft=javascript fileencoding=utf-8 bomb et:
//
// ==PREPROCESSOR==
// @feature "dragdrop"
// @author "elia_is_me"
// @import "%fb2k_profile_path%skins\Mnlt2\common\common4.js"
// ==/PREPROCESSOR==
//
// Require:
// -> foobar2000 v1.3.3+ (required by wshmp)
// -> WSH Panel Mod Plus 1.5.7+
//
// Update: 2016-05-06
//
// 技术验证用，请勿用于日常使用。

////////////////////////////////////////////////////////////////////////////////////////


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


var fso = new ActiveXObject("Scripting.FileSystemObject");
var Img = new ActiveXObject("WIA.ImageFile.1");
var IP = new ActiveXObject("WIA.ImageProcess.1");
IP.Filters.Add(IP.FilterInfos("Scale").FilterID);//ID = 1
IP.Filters.Add(IP.FilterInfos("Crop").FilterID);//ID = 2
IP.Filters.Add(IP.FilterInfos("Convert").FilterID);//ID = 3
var WshShell = new ActiveXObject("WScript.Shell");
var htmlfile = new ActiveXObject('htmlfile');

var g_font = gdi.Font("Segoe Ui", 12, 0);
var time_f = fb.CreateProfiler("time_f"),
    time_s = fb.CreateProfiler("time_s"),
    time_r = fb.CreateProfiler("time_r"),
    time_h = fb.CreateProfiler(),
    time_scroll = fb.CreateProfiler("Time delay paint");

var stub_image;
var mouse_l_hold_f = false,
    repaint_main1 = false,
    repaint_main2 = false,
    repaint_main = true,
    hold_shift = false,
    mouse_in = false,
    hold_scroll = false,
    isvisible = false;
var shift_index = 0,
    time_reset_loading = 30,
    max_scroll = window.Height;

var ww = window.Width,
    wh = window.Height;

var mouse_x = 0,
    mouse_y = 0;

var start = 0,
    end = 0,
    start_ = 0,
    time_dl = 0;

var scroll = 0, scroll_ = 0;
var scr1 = 0, scr2 = window.Height;

var list = [], list_al = [], list_ar = [], list_ge = [],
    list_dr = [], list_img = [];

var row_height = 22;

var tf_group = fb.TitleFormat("[%album artist%]^^[%album%]");
var tf_title = fb.TitleFormat("%title%");
var tf_artist = fb.TitleFormat("[%artist%]");
var tf_rating = fb.TitleFormat("[%rating%]");
var tf_tracknumber = fb.TitleFormat("$if2([%track number%],-)");
var tf_length = fb.TitleFormat("%length%");

var DT_LT = DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var DT_LC = DT_LT | DT_VCENTER | DT_LT;
var DT_RC = DT_RIGHT | DT_VCENTER | DT_LT;
var DT_CC = DT_CENTER | DT_VCENTER | DT_LT;

var font_1 = gdi.Font("Segoe Ui", 12);

window.DlgCode = 0x0081;

function on_size() {
    ww = window.Width;
    wh = window.Height;
    if (ww == 0 || wh == 0) {
        return;
    }
    var scroll_t = Math.floor(scroll / row_height);
    scroll_ = scroll = scroll_t * row_height;
    max_scroll = scroll_ + wh;
    row_count = Math.ceil(wh / row_height);
    repaint();
}

function repaint () {
    repaint_main1 = repaint_main2;
}

function init_list (reload) {
    list = [];
    load_list(reload);
}

function load_list(reload) {
    var Time = fb.CreateProfiler("Time load playlist");
    var pl_name = "", pl_idx = -1, list_;
    pl_idx = plman.ActivePlaylist;
    if (pl_idx < 0) {
        return;
    } else {
        list_ = plman.GetPlaylistItems(pl_idx);
    }
    var string_compare = "#@!", string = "", k = 0, i = 0, item, count = 0;
    var a = "", b = "", temp, total = list_.Count;
    Time.print();
    Time.Reset();
    while (k < total) {
        item = {};
        item.metadb = list_.Item(k);
        item.idx = k;
        item.title = tf_title.EvalWithMetadb(item.metadb);
        item.tracknumber = tf_tracknumber.EvalWithMetadb(item.metadb);
        item.duration = tf_length.EvalWithMetadb(item.metadb);
        list.push(item);
        count++;
        k++;
    }
    Time.print();
}

var t____ = window.SetTimeout(function() {
    init_list();
    repaint();
    window.ClearTimeout(t____);
}, 200);

function on_paint (gr) {

    if (ww == 0 || wh == 0) {
        return;
    }

    if (repaint_main) {
        repaint_main = false;

        if (list.length < 1) {
            return;
        }

        var row_h = 24;
        start = Math.max(0, Math.round(scroll_ / row_height + 0.4));
        //end = Math.min(start+row_count, list.length-1);
        end = Math.round((scroll_ + wh) / row_height - 0.5);
        end = (list.length < end) ? list.length : end;
        var sss = (1 - Math.pow(0.9, time_dl / 10));

        for (var i = start; i < end; i++) {
            //var y_ = (i-start) * row_height;
            var y_ = (i + 0.1) * row_height - scroll_;
            var ry = (i-start) * row_height;
            if (i % 2) {
                gr.FillSolidRect(2, y_, ww - 4 - 4, row_height, 0x10000000);
            }
            gr.GdiDrawText(list[i].tracknumber, font_1, 0xff000000, 2, y_, 30, row_height, DT_CC);
            gr.GdiDrawText(list[i].duration, font_1, 0xff000000, ww-4-50, y_, 50, row_height, DT_CC);
            gr.GdiDrawText(list[i].title, font_1, 0xff000000, 32, y_, ww-32-54, row_height, DT_LC);
        }

        var lenf_ = row_height * Math.round(list.length + 0.499);
        var scr2_ = Math.min(Math.round(wh * wh / lenf_) + 1, wh);
        if (list.length * row_height > wh) {
            max_scroll = lenf_;
        }
        scr1 = scroll_ / lenf_ * wh;
        scr2 += (scr2_ - scr2) * sss;
        if (scr2 < wh) {
            gr.DrawLine(ww-4, 0, ww-4, wh, 7, 0x60000000);
            gr.DrawLine(ww-4, scr1, ww-4, scr1+scr2, 5, 0xa0ffffff);
            ((scr2_ - scr2) * sss > 1) && repaint();
        }

    }
}

function on_mouse_wheel(step) {
    scroll -= step * row_height * 3;
    if (scroll < 0 || (list.length * row_height < ww)) {
        scroll = 0;
    }
    if (scroll > max_scroll - wh) {
        scroll = max_scroll - wh;
    }
    time_reset_loading = 30;
}

var g_time = window.SetInterval(function() {
    if (!window.IsVisible || ww == 0 || wh == 0) {
        return;
    }
    var repaint_1 = repaint_2 = false;
    time_dl = time_scroll.Time;
    time_scroll.Reset();
    if (scroll < 0) {
        scroll = 0;
    } else if (scroll + wh > max_scroll) {
        scroll = max_scroll - wh;
    }
    if (Math.abs(scroll - scroll_) > 0.4) {
        scroll_ += (scroll - scroll_) * (1-Math.pow(0.9, time_dl / 12));
        repaint_2 = true;
    }
    end = Math.min(end, list.length);
    
    if (repaint_main1 == repaint_main2) {
        repaint_main2 = !repaint_main1;
        repaint_2 = true;
    }
    ////////////////////////////////////////////////////////////////////////////////////
    if (repaint_1 && repaint_2) {
        repaint_main = true;
        window.Repaint();
    } else if (repaint_1) {
    } else if (repaint_2) {
        repaint_main = true;
        window.Repaint();
    }
}, 30);



on_load();

function on_load(){
    if(!fso.FileExists(fb.ProfilePath + "cache\\LoadIMG.js")){
        var data = "var fso = new ActiveXObject(\"Scripting.FileSystemObject\");\r\n"
         + "var Img = new ActiveXObject(\"WIA.ImageFile.1\");\r\n"
         + "var IP = new ActiveXObject(\"WIA.ImageProcess.1\");\r\n"
         + "IP.Filters.Add(IP.FilterInfos(\"Scale\").FilterID);//ID = 1\r\n"
         + "IP.Filters.Add(IP.FilterInfos(\"Crop\").FilterID);//ID = 2\r\n"
         + "IP.Filters.Add(IP.FilterInfos(\"Convert\").FilterID);//ID = 3\r\n"
         + "function resize_image(path,string,tranparent)\r\n"
         + "{\r\n"
         + "    var cachesize = 300;\r\n"
         + "    var img_w = cachesize,img_h = cachesize,cr_x = 0,cr_y = 0;\r\n"
         + "    try{\r\n"
         + "    Img.LoadFile(path);\r\n"
         + "    }catch(err){\r\n"
         + "		return false;\r\n"
         + "    }\r\n"
         + "    if (Img.Width > Img.Height){\r\n"
         + "        img_w *= Img.Width / Img.Height;\r\n"
         + "        cr_x = (img_w - img_h)/2;\r\n"
         + "    }else {  \r\n"
         + "        img_h *= Img.Height / Img.Width;\r\n"
         + "        cr_y = (img_h - img_w)/2;\r\n"
         + "    }\r\n"
         + "    IP.Filters(1).Properties(\"MaximumWidth\") = img_w;\r\n"
         + "    IP.Filters(1).Properties(\"MaximumHeight\") = img_h;\r\n"
         + "    if(tranparent == \"true\"){\r\n"
         + "        IP.Filters(3).Properties(\"FormatID\").Value = '{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}';\r\n"
         + "    }else{\r\n"
         + "        IP.Filters(3).Properties(\"FormatID\").Value = '{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}';\r\n"
         + "        IP.Filters(3).Properties(\"Quality\").Value = 100; \r\n"
         + "    }\r\n"
         + "    IP.Filters(2).Properties(\"Left\") = cr_x;\r\n"
         + "    IP.Filters(2).Properties(\"Top\") = cr_y;\r\n"
         + "    IP.Filters(2).Properties(\"Right\") = cr_x;\r\n"
         + "    IP.Filters(2).Properties(\"Bottom\") = cr_y;\r\n"
         + "    Img = IP.Apply(Img);\r\n"
         + "    try{\r\n"
         + "        if(fso.FileExists(WScript.arguments(0) + \"\\\\cache\\\\imgcache\\\\\" + string))\r\n"
         + "            fso.DeleteFile(WScript.arguments(0)+ \"\\\\cache\\\\imgcache\\\\\" + string);\r\n"
         + "        Img.SaveFile(WScript.arguments(0) + \"\\\\cache\\\\imgcache\\\\\" + string);\r\n"
         + "    }catch(err){\r\n"
         + "		return false;\r\n"
         + "    }\r\n"
         + "	return true;\r\n"
         + "}\r\n"
         + "resize_image(WScript.arguments(1),WScript.arguments(2),WScript.arguments(3));";
        if(!fso.FolderExists(fb.ProfilePath + "cache"))
            fso.CreateFolder(fb.ProfilePath + "cache");
        if(!fso.FolderExists(fb.ProfilePath + "cache\\imgcache"))
            fso.CreateFolder(fb.ProfilePath + "cache\\imgcache");
        var file = fso.CreateTextFile(fb.ProfilePath + "cache\\LoadIMG.js", true,65001);
        file.WriteLine(data);
        file.Close();
    }

}
