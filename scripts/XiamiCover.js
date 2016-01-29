// vim:set ft=javascript fileencoding=utf-8 bomb et:
//
// XiamiCover: 
// Download album art from website xiami.com, but attention that you may not
// have permission to access xiami.com outside China.
//
// update:2016-01-22


var DT_LT = DT_NOPREFIX | DT_CALCRECT;
var DT_LC = DT_LT | DT_VCENTER;
var DT_CC = DT_CENTER | DT_VCENTER | DT_LT;

var xmlhttp = new ActiveXObject("Msxml2.XMLHTTP.3.0")
var WshShell = new ActiveXObject("WScript.Shell");
var fso = new ActiveXObject("Scripting.FileSystemObject");

var ww, wh;
var g_colors = {};
var g_fonts = {};
var g_color_scheme = window.GetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), 0); 

var close_img;
var g_buttons = {};
var g_list_buttons = [];
var g_inputbox;

var g_results = [];
var g_no_result = false;
var g_panel_visible = false;
var g_history = [];
var g_offsety = 0;

var g_cover_folder = "";

var g_metadb = null;
var g_metadb_handlelist = null;


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

get_colors();
get_images();
check_folders();
g_inputbox = new oInputbox(1, 1, "", "search xiami", RGB(255, 255, 255), RGB(101, 101, 101), 0, 0xffffffff, g_search_func, "window");


var TextButton = function(text, font, x, y, w, h, func) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.text = text;
    this.font = font;
    this.func = func;
    this.state = 0;
    this.is_down = false;
    this.is_hover = false;
}


TextButton.prototype.draw = function (gr) {
    if (this.state > 0) {
        gr.FillSolidRect(this.x, this.y + (this.state == 2 ? 1 : 0), this.w, this.h, RGB(225, 165, 0));
    }
    gr.GdiDrawText(this.text, this.font, this.state > 0 ? RGB(245, 245, 245) : RGB(100, 100, 100),
            this.x, this.y + (this.state == 2  ? 1 : 0), this.w, this.h, DT_CC);
}

TextButton.prototype.repaint = Button.prototype.repaint;
TextButton.prototype.on_click = Button.prototype.on_click;
TextButton.prototype.set_xy = Button.prototype.set_xy;
TextButton.prototype.reset = Button.prototype.reset;
TextButton.prototype.check_state = Button.prototype.check_state;


function save_image (img_url, file_path) {
    try {
        WshShell.Run("wget " + img_url + " -O " + file_path, 0, false);
        console("Save to " + file_path);
        return true;
    } catch (e) {
        return false;
    };
}

function check_folders() {
    g_cover_folder = window.GetProperty("Cover folder", "D:\\My Music\\Covers");
    if (!isFoler(g_cover_folder)) {
        g_cover_folder = FileDialog(2, "Select your cover folder", "*", "");
        window.SetProperty("Cover folder", g_cover_folder);
    }
}

function isFoler(str) {
	return fso.FolderExists(str);
}

function isFile(str) {
	return fso.FileExists(str);
}

function createFolder(str) {
	if (!isFoler(str)) {
		fso.CreateFolder(str);
	}
}

function g_search_func() {

    var s2 = g_inputbox.text;

    xmlhttp.open("GET", get_search_url(s2), true);
    xmlhttp.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {

        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                var album_id = get_albumid(xmlhttp.responseText);
                console("Album ID total: " + album_id.length);
                get_result_list(album_id);
            } else {
                console("Fail to download");
            }
        } 
    }

}

function get_result_list(albumid_arr) {

    var total = albumid_arr.length;
    var album_idx = 0;
    
    g_results.length = 0;

    if (g_list_buttons && g_list_buttons.length > 0) {
        for (var i = 0; i < g_list_buttons.length; i++) {
            delete g_list_buttons[i];
        }
    }
    g_list_buttons = [];

    var get_album = function() {
        xmlhttp.open("GET", get_album_url(albumid_arr[album_idx]), true);
        console(get_album_url(albumid_arr[album_idx]));
		xmlhttp.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    try {
                        var track = json(xmlhttp.responseText).data.trackList[0];
                        g_results.push({
                            album_name: track.album_name,
                            album_url: "http://www.xiami.com/album/" + track.album_id,
                            artist: track.artist,
                            album_pic: track.album_pic,
                            pic: track.pic,
                            type: "cover",
                        });
                        //console(track.album_pic);
                        g_list_buttons.push(new TextButton("下载封面", gdi.Font("Tahoma", 11), 0, 0, 80, 24));
                        window.Repaint();
                    } catch (e) {};
                    album_idx++;
                    if (album_idx < total) {
                        get_album();
                    }
                } else {
                    console("Fail to get info...");
                }
            }
        }
    }

    get_album();

}

function get_albumid(html_text) {
    var album_reg = new RegExp("<a.*href=\".*?/album/(\\d+).*?>", "g");
    var albumid = [];
    var album_elem;

    if (html_text) {
        for (var i = 0;; i++) {
            album_elem = album_reg.exec(html_text);
            if (album_elem == null) {
                break;
            }
            albumid[i] = album_elem[1];
        }
    }
    return albumid.unique();
}


function get_search_url(string) {
    string = string.trim().replace(/\s+/g, "+");
    return  ("http://www.xiami.com/search/song/?key=" + string);
}

function get_album_url(album_id) {
    return ("http://www.xiami.com/song/playlist/id/" + album_id + "/type/1/cat/json");
}





window.DlgCode = DLGC_WANTALLKEYS;

var g_total_rows;
var g_row_height = 60;

function on_size() {
	ww = window.Width;
	wh = window.Height;

    g_buttons.close.set_xy(ww-g_buttons.close.w-5, 5);
    g_total_rows = Math.floor((wh - 105) / g_row_height);
}

function on_paint(gr) {

    // Bg
	gr.FillSolidRect(0, 0, ww, wh, blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.4));
    gr.DrawRect(0, 0, ww-1, wh-1, 1, g_colors.txt_normal);

    // Inputbox
    gr.FillSolidRect(20, 40, ww-40, 28, g_inputbox.backcolor);
    gr.DrawRect(20, 40, ww-41, 27, 1, RGB(35, 35, 35));
    g_inputbox.w = ww-50;
    g_inputbox.h = 20;
    //g_inputbox.font = 
    g_inputbox.draw(gr, 25, 44);

    // Buttons
    for (var bt in g_buttons) {
        g_buttons[bt].draw(gr);
    }

    // List
    var rw = ww - 40;
    var total = g_results.length;
    var rx = 20;

    if (total > g_total_rows) {
        total = g_total_rows;
    }
    
    var font1 = gdi.Font("Segoe UI", 14, 1);
    var font2 = gdi.Font("Segoe UI", 12);
    var color1 = RGB(245, 245, 245);
    var color2 = RGB(225, 225, 225);

    for (var i = 0; i < total; i++) {

        var ry = 145 + i * g_row_height;
        var rh = g_row_height - 10;
        //gr.FillSolidRect(rx, ry, rw, g_row_height, RGB(45, 45, 45));
        if (i % 2 == 1) {
            gr.FillSolidRect(rx, ry, rw, g_row_height, 0x05ffffff);
        }
        gr.GdiDrawText(g_results[i].album_name, font1, color1, rx + 10, ry+5, rw-120, rh/2+4, DT_LC);
        gr.GdiDrawText(g_results[i].artist, font2, color2, rx+10, ry+rh/2+2, rw-120, rh/2, DT_LC);
        //gr.GdiDrawText("下载封面", gdi.Font("Tahoma", 11), RGB(100, 100, 100), rx+rw-60, ry+5, 100, rh/2, DT_LC);

        // button
        g_list_buttons[i].x = rx+rw-80;
        g_list_buttons[i].y = ry+5;
        g_list_buttons[i].draw(gr);

    }
}

function on_mouse_lbtn_down(x, y, mask) {
    g_inputbox.check("down", x, y);
    for (var i in g_buttons) {
        g_buttons[i].check_state("down", x, y);
    }
    if (g_list_buttons && g_list_buttons.length > 0) {
        for (var i = 0; i < g_list_buttons.length; i++) {
            g_list_buttons[i].check_state("down", x, y);
        }
    }
}

function on_mouse_lbtn_up(x, y, mask) {
    g_inputbox.check("up", x, y);
    for (var i in g_buttons) {
        if (g_buttons[i].check_state("up", x, y)) {
            g_buttons[i].on_click(x, y);
        }
    }

    if (g_list_buttons && g_list_buttons.length > 0) {
        for (var i = 0; i < g_list_buttons.length; i++) {
            if (g_list_buttons[i].check_state("up", x, y)) {
                g_list_buttons[i].func = function() {

                    var image_url = g_results[i].album_pic;
                    var album = $("%album%", g_metadb);
                    if (!album || album == "?") {
                        console("no album name, refuse to download.");
                        return;
                    }
                    var ext = /.[^.]+$/.exec(image_url.substring(image_url.lastIndexOf("/") + 1));
                    var string = $("%album artist%-%album%", g_metadb).replace("/", "_");
                    var file_path = "\"" + g_cover_folder + "\\" + string.validate() + fb.TitleFormat("$crc32('" + string + "')").Eval() + ext + "\"";
                    save_image(image_url, file_path);
                    window.NotifyOthers("Refresh Cover", true);
                }
                g_list_buttons[i].on_click(x, y);
            }
        }
    }
}

function on_mouse_move(x, y) {
    g_inputbox.check("move", x, y);
    for (var i in g_buttons) {
        g_buttons[i].check_state("move", x, y);
    }
    if (g_list_buttons && g_list_buttons.length > 0) {
        for (var i = 0; i < g_list_buttons.length; i++) {
            g_list_buttons[i].check_state("move", x, y);
        }
    }
}

function on_mouse_lbtn_dblclk(x, y, mask) {
    g_inputbox.check("dblclk", x, y);
    for (var i in g_buttons) {
        g_buttons[i].check_state("down", x, y);
    }
}

function on_mouse_rbtn_up(x, y, mask) {
    g_inputbox.check("right", x, y);
    return true;
}

function on_key_down (vkey) {
    g_inputbox.on_key_down(vkey);
}

function on_char(code) {
    g_inputbox.on_char(code);
}

function on_focus(is_focused) {
    g_inputbox.on_focus(is_focused);
}

function on_colors_changed() {
    get_colors();
    get_images();
    window.Repaint();
}

function on_notify_data(name, info) {
    switch (name) {
        case "DPI":
            break;
        case "Show_search_cover_panel":
            if (info[1]) {
                try {
                    g_metadb_handlelist = info[1];
                    g_metadb = g_metadb_handlelist.Item(0);

                    g_inputbox.text = $("%album artist% %album%", g_metadb);
                    window.Repaint();
                    g_search_func();
                } catch (e) {};
            };
            break;
    }
}




function get_images() {
    var font = gdi.Font("Wingdings 2", 16);
    var w = 25;
    var colors = [RGB(0, 0, 0), RGB(100, 100, 100), RGB(80, 80, 80)];
    var sf = StringFormat(1, 1);

    var s, imgarr, img, g;

    imgarr = [];
    for (s = 0; s < 3; s++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();
        g.SetTextRenderingHint(3);

        g.DrawString("\u00CF", font, colors[s], 0, 0, w, w, sf);

        g.SetTextRenderingHint(0);
        img.ReleaseGraphics(g);
        imgarr[s] = img;
    }
    close_img = imgarr;

    g_buttons.close = new Button(close_img, function() {
        window.NotifyOthers("Show_search_cover_panel", false);
    });

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

function json(text) {
	try{
		var data=JSON.parse(text);
		return data;
	}catch(e){
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
