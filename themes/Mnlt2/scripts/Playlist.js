// vim:set ft=javascript bomb et:
// ================================================== //
// @name "Playlist"
// @update "2016-01-05 16:06"
// ================================================== //

// ----------LANG------------------------------------------------------------------------
var lang = window.GetProperty("界面语言(lang)(cn:中文, en: English)", "auto").toLowerCase();
if (lang != "cn" && lang != "en") {
    lang = (fb.TitleFormat("$meta()").Eval(true) == "[未知函数]") ? "cn" : "en";
}

var lang_pack = {};
if (lang == "cn") {
    lang_pack = {
        "Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)": "颜色主题 0: 系统 1: 亮色 2: 暗色 3: 用户",
        "Color text normal": "颜色 文字",
        "Color text selected": "颜色 选中文字",
        "Color background normal": "颜色 背景",
        "Color background selected" : "颜色 选中背景",
        "Color highlight": "颜色 高亮",
        "Hide toolbar": "隐藏工具栏",
        "Show scrollbar": "显示滚动条",
        "Scroll step": "滚动步数",
        "Auto collapse": "自动折叠",
        "Show group header": "显示分组标题栏",
        "Group header rows": "分组标题栏行数",
        "Row height": "行高",
        "Double line row": "双排文字",
        "Selection bg alpha": "被选项背景色透明度",
        "Show focused row": "显示焦点行",
        "Show play count": "显示播放统计",
        "Show rating": "显示评级",
        "Show row split line": "显示行分隔线",
        "Playback/Cursor follows playback": "播放/光标跟随播放",
        "Font name": "字体名",
        "Failed to load default font, Use \"": "未能载入默认字体, 使用\"",
        "\" instead!": "\"代替",
        "No\nCover": "无\n封面",
        "Loading": "载入中",
        "Padding left/right": "边距 左右",
        "Padding top/bottom": "边距 上下",
        "Empty playlist!": "空列表",
        "<not set>": "<不设置>",
        "Rating/": "等级/",
        "Show now playing": "显示正在播放",
        "Refresh": "刷新",
        "Collapse/Expand": "折叠/展开",
        "Collapse all": "全部折叠",
        "Expand all": "全部展开",
        "Preferences": "首选项",
        "Cut": "剪切",
        "Copy": "复制",
        "Paste": "粘贴",
        "Show configure...": "WSH 配置...",
        "Show properties...": "WSH 属性",
        "File/": "文件/",
        "Add files...": "添加文件...",
        "Add folder...": "添加目录...",
        "Add location...": "添加位置...",
        "Sort by...": "排序按...",
        "Randomize":　"随机",
        "Sort by album": "排序按专辑",
        "Sort by artist": "排序按艺术家",
        "Sort by path": "排序按文件路径",
        "Sort by rating": "排序按评级",
        "Selection": "选择",
        "Reverse": "颠倒",
        "Edit/Sort/Sort by...": "编辑/排序/排序按...",
        "Edit/Selection/Sort/Sort by...": "编辑/选择/排序/排序按...",
        "Edit/Sort/Reverse": "编辑/排序/颠倒",
        "Edit/Selection/Sort/Reverse": "编辑/选择/排序/颠倒",
        " tracks": " 首",
        " track": " 首",
        "Unknown artist": "未知艺术家",
        "Search [": "搜索 [",
        "Show playlist manager": "显示播放列表管理器",
        "Play": "播放",
        "Rename": "重命名",
        "Remove": "移除",
        "Save...": "保存...",
        "Insert": "插入",
        "Add": "增加",
        "New playlist": "新建列表",
        "New autoplaylist": "新建智能列表",
        "Load playlist...": "载入列表...",
        "Edit autoplaylist...": "编辑智能列表...",
        "Convert to a normal playlist": "转为普通列表",
        "Contents": "内容",
        "View/Playlist Manager": "视图/播放列表管理器",
        "Auto hide playlist manager": "自动隐藏播放列表管理器",
        "Show track artist": "显示音轨艺术家",
        "Add items": "添加项目",
        "Sort": "排序",
        "Toggle show rating": "显隐评级",
        "Toggle show playlist manager": "显隐列表管理器",
        "View default playlist manager": "显示默认列表管理器",
        "Web": "网络",
        "Search cover": "搜索封面",
        "PLAYLISTS": "播放列表",
        "Default": "默认",
    }
} else {
    lang_pack = {};
}

function __(name) {
    var str = lang_pack[name];
    if (!str) str = name;
    return str;
}



// ----------START-----------------------------------------------------------------------

var DT_LT = DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var DT_LC = DT_LT | DT_VCENTER | DT_LT;
var DT_RC = DT_RIGHT | DT_VCENTER | DT_LT;
var DT_CC = DT_CENTER | DT_VCENTER | DT_LT;

var tf_group = fb.TitleFormat("%abum artist%|||%album%|||%discnumber%");
var tf_group_header = fb.TitleFormat("%album%|||$if2(%album artist%," + __("Unknown artist") +　")[ \/ %genre%][ \/ %date% ]");
var tf_track = fb.TitleFormat("$if2(%tracknumber%,-)|||%title%|||%track artist%|||[%play_count%]|||[%length%]|||%rating%");
var tf_rating = fb.TitleFormat("%rating%");

var g_active_pl = plman.ActivePlaylist;
var g_focused_idx = plman.GetPlaylistFocusItemIndex(g_active_pl);
var g_avoid_init_list = false;
var g_avoid_show_now_playing = false;
var g_avoid_hide_plmanager = false;

var g_dpi_percent = get_system_dpi_percent();
var g_forced_percent = window.GetProperty("DPI (default = 0)", 0);
var g_dpi = (g_forced_percent == 0 ? g_dpi_percent : g_forced_percent);
if (g_dpi < 100) g_dpi = 100;

var z1 = zoom(1, g_dpi);
var z2 = zoom(2, g_dpi);
var z3 = zoom(3, g_dpi);
var z10 = zoom(10, g_dpi);
var z5 = zoom(5, g_dpi);
var z11 = zoom(11, g_dpi);
var z12 = zoom(12, g_dpi);
var z7 = zoom(7, g_dpi);
var z14 = zoom(14, g_dpi);
var z2 = zoom(2, g_dpi);
var z5 = zoom(5, g_dpi);
var z10 = zoom(10, g_dpi);
var z14 = zoom(14, g_dpi);
var z40 = zoom(40, g_dpi);
var z25 = zoom(25, g_dpi);

var ww, wh;
var mouse_x = 0, mouse_y = 0;
var repaint_counter = 0;
var force_repaint = false;

var image_cache, pl, plm;
var bt = [];
var g_image_txt_rendering = 3;

var g_colors = {};
var g_color_scheme = window.GetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), 0); 
var g_fonts = {};
var images = {};
var cover = {
    keep_aspect_ratio: false,
    max_width: 0,
    ltimer: null,
};

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

var Rating = {
    x: 0,
    w: 0,
};

var MENU_ITEM_DISABLED = 1;
var MENU_ITEM_CHECKED = 2;
var MENU_ITEM_RADIO_CHECKED = 4;

var properties = {
    // Common
    hide_toolbar: window.GetProperty("pl: " + __("Hide toolbar"), false),
	//margin: window.GetProperty("pl: Margin", 0),
	show_scrollbar: window.GetProperty("pl: " + __("Show scrollbar"), true),
    scrollbar_width: zoom(10, g_dpi), 
	scroll_step: window.GetProperty("pl: " + __("Scroll step"), 3),
	auto_collapse: window.GetProperty("pl: " + __("Auto collapse"), false),
	//vim_style_key_bindings: window.GetProperty("pl: Enable vim style key bindings", true),
    // Group
    show_group_header: window.GetProperty("pl: " + __("Show group header"), true),
    //group_header_rows: window.GetProperty("pl: " + __("Group header rows"), 2),
    group_header_rows: 0,
    //group_header_height: window.GetProperty("pl: " + __("Group header height"), 80),
    group_header_height: zoom(80, g_dpi),
    //min_group_rows: window.GetProperty("pl: Minimum group rows", 0),
    //extra_group_rows: window.GetProperty("pl: Extra group rows", 0),
    min_group_rows: 0,
    extra_group_rows: 0,
    //show_cover: window.GetProperty("pl: Show cover", true),
    // List rows
    row_height: window.GetProperty("pl: " + __("Row height"), "28,40"),
    double_line: window.GetProperty("pl: " + __("Double line row"), true),
    selection_alpha: window.GetProperty("pl: " + __("Selection bg alpha"), 85),
    //odd_even_rows: window.GetProperty("pl: Enable odd/even rows highlight", true),
    show_row_split_line: window.GetProperty("pl: " + __("Show row split line"), true),
    //line_style: window.GetProperty("pl: " + __("Line visual style"), 0),
    show_focus_row: window.GetProperty("pl: " + __("Show focused row"), true),
    show_playcount: window.GetProperty("pl: " + __("Show play count"), true),
    show_rating: window.GetProperty("pl: " + __("Show rating"), true),
    show_track_artist: window.GetProperty("pl: " + __("Show track artist"), true),
    //
    toolbar_height: zoom(30, g_dpi),
    vim_style_key_binding: true,

    // 
    cursor_follow_playback:  is_cursor_follow_playback(),
    auto_hide_plmanager: window.GetProperty("plm: " + __("Auto hide playlist manager"), true),
};


function is_cursor_follow_playback () {
    return (fb.GetMainMenuCommandStatus(__("Playback/Cursor follows playback")) == MENU_ITEM_CHECKED);
}


(function check_properties() {
    // TODO: ...
})();

function get_colors () {
    if (g_color_scheme == 0) {
        g_colors = get_default_colors();
    } else {
        g_colors = COLOR_SCHEME[g_color_scheme - 1];
    }
    var c = combineColors(g_colors.bg_normal, setAlpha(g_colors.bg_selected, properties.selection_alpha));
    g_colors.txt_selected = (Luminance(c) > 0.6 ? RGB(30, 30, 30) : RGB(245, 245, 245));
    g_colors.txt_bg_05 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.5);
    g_colors.txt_normal2 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.3);
    window.NotifyOthers("Color scheme status", g_color_scheme);
}

function get_default_colors () {
    var result = {};

    if (window.InstanceType == 1) {
        result.txt_normal = window.GetColorDUI(ColorTypeDUI.text);
        result.bg_normal = window.GetColorDUI(ColorTypeDUI.background);
        result.bg_selected = window.GetColorDUI(ColorTypeDUI.selection);
        result.highlight = window.GetColorDUI(ColorTypeDUI.highlight);
        var c = combineColors(result.bg_normal, setAlpha(result.bg_selected, properties.selection_alpha));
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

var z11 = zoom(11, g_dpi);
var z12= zoom(12, g_dpi);
var z14 = zoom(14, g_dpi);
var z18 = zoom(18, g_dpi);

function get_fonts() {
    g_fonts.name = fb.TitleFormat(window.GetProperty(__("Font name"), "")).Eval(true);
    if (!utils.CheckFont(g_fonts.name)) {
        try {
            var sys_font = (window.InstanceType == 1 ? window.GetFontDUI(3) : window.GetFontCUI(0));
            g_fonts.name = sys_font.Name;
            g_fonts.size = sys_font.Size;
        } catch (e) {
            g_fonts.name = "Segoe UI";
            g_fonts.size = zoom(12, g_dpi);
            console(__("Failed to load default font, Use \"") + g_fonts.name + "\" instead!");
        };
    }
    g_fonts.name_bold = g_fonts.name;
    if (g_fonts.name.toLowerCase() == "segoe ui semibold") {
        g_fonts.name_bold = "segoe ui";
    };
    g_fonts.item = gdi.Font(g_fonts.name, z12);
    g_fonts.item_bold = gdi.Font(g_fonts.name_bold, z12, 1);
    g_fonts.item_small = gdi.Font(g_fonts.name, z11);
    g_fonts.header1 = gdi.Font(g_fonts.name, z18, 0);
    g_fonts.header2 = gdi.Font(g_fonts.name, z12, 0);
    g_fonts.header3 = gdi.Font(g_fonts.name, z14, 0);
    g_fonts.rating1 = gdi.Font("Segoe UI Symbol", z14, 0);
    g_fonts.rating2 = gdi.Font("Segoe UI Symbol", z14, 0);
    g_fonts.item_14b = gdi.Font(g_fonts.name_bold, z14, 1);
    g_fonts.info_header = gdi.Font(g_fonts.name, z12, 0);
    g_fonts.mdl2 = gdi.Font("Segoe MDL2 Assets", z12, 0);
};


function get_images() {
    
    cover.max_width = pl.group_header_rows * pl.row_height;
    var cw = cover.max_width;
    if (!cw) cw = 1;

    var img, g;

    // No cover
    img = gdi.CreateImage(cw, cw);
    g = img.GetGraphics();
    //
    //var color = blendColors(g_colors.bg_normal, 0xff000000, 0.2);
    g.FillSolidRect(0, 0, cw, cw, g_colors.bg_normal & 0xa0ffffff);

    g.SetTextRenderingHint(g_image_txt_rendering);
    g.FillSolidRect(0, 0, cw, cw, g_colors.txt_normal & 0x10ffffff);
    g.DrawString(__("No\nCover"), g_fonts.item_14b, blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.2), 
            0, 0, cw, cw, StringFormat(1, 1));
    g.SetTextRenderingHint(0);
    //
    img.ReleaseGraphics(g);
    images.no_cover = img;

    // Loading
    /*
    img = gdi.CreateImage(cw, cw);
    g = img.GetGraphics();

    //var color = blendColors(g_colors.bg_normal, 0xff000000, 0.2);
    g.FillSolidRect(0, 0, cw, cw, g_colors.bg_normal & 0xa0ffffff);
    g.SetTextRenderingHint(g_image_txt_rendering);
    //
    try {
        var load_img = gdi.Image(fb.ProfilePath + "Skins\\Mnlt2\\images\\load.png").Resize(cw, cw, 7);
        g.DrawImage(load_img, 0, 0, cw,cw, 0, 0, cw, cw, 0, 255);
    } catch (e) {
        console("No load image");
        g.DrawString("Loading", g_fonts.item_14b, g_colors.txt_bg_05, 0, 0, cw, cw, StringFormat(1, 1));
        g.SetTextRenderingHint(0);
    }
    //
    img.ReleaseGraphics(g);
    images.loading = img;
    */
    images.loading = gdi.Image(fb.ProfilePath + "Skins\\Mnlt2\\images\\load.png").Resize(cw, cw, 2);
};

function get_button_images() {

    var font = gdi.Font("Segoe MDL2 Assets", zoom(14, g_dpi));
    //var colors = [RGB(200, 200, 200), RGB(255, 255, 255), RGB(86, 156, 214)];
    var colors = [blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.2), g_colors.txt_normal, g_colors.highlight];

    var w = zoom(25, g_dpi);
    var s, imgarr, img;
    var sf = 285212672;

    // Add
    imgarr = [];
    for (s = 0; s < 3; s++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();
        g.SetTextRenderingHint(g_image_txt_rendering);

        g.DrawString("\uE710", font, colors[s], 0, 0, w, w, sf);

        img.ReleaseGraphics(g);
        imgarr[s] = img;
    };
    images.add = imgarr;

    // Rating
    imgarr = [];
    for (s = 0; s < 3; s++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();
        g.SetTextRenderingHint(g_image_txt_rendering);

        g.DrawString("\uE1CF", font, colors[s], 0, 0, w, w, sf);

        img.ReleaseGraphics(g);
        imgarr[s] = img;
    };
    images.rat = imgarr;

    img = gdi.CreateImage(w, w);
    g = img.GetGraphics();
    g.SetTextRenderingHint(g_image_txt_rendering);

    g.DrawString("\uF005", font, blendColors(colors[1], colors[2], 0.8), 0, 0, w, w, sf);

    img.ReleaseGraphics(g);
    images.rat2 = [images.rat[2], img, images.rat[1]];

    //var font = gdi.Font("FontAwesome", zoom(14, g_dpi));
    // Sort
    imgarr = [];
    for (s = 0; s < 3; s++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();
        g.SetTextRenderingHint(g_image_txt_rendering);

        g.DrawString("\uE174", font, colors[s], 0, 0, w, w, sf);

        img.ReleaseGraphics(g);
        imgarr[s] = img;
    };
    images.sort = imgarr;

    // plman
    imgarr = [];
    for (s = 0; s < 3; s++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();
        g.SetTextRenderingHint(g_image_txt_rendering);

        g.DrawString("\uE169", font, colors[s], 0, 0, w, w, sf);

        img.ReleaseGraphics(g);
        imgarr[s] = img;
    }
    images.plman = imgarr;

    // add2
    imgarr = [];
    for (s = 0; s < 3; s++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();
        g.SetTextRenderingHint(g_image_txt_rendering);

        g.DrawString("\uE710", font, colors[s], 0, 0, w, w, sf);

        img.ReleaseGraphics(g);
        imgarr[s] = img;
    }
    images.add2 = imgarr;

    // down arrow
    imgarr = [];
    for (s = 0; s < 3; s++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();
        g.SetTextRenderingHint(g_image_txt_rendering);

        if (s == 2) {
            g.FillSolidRect(0, 0, w, w, blendColors(g_colors.bg_normal, g_colors.txt_normal, 0.2));
        }
        g.DrawString("\uF107", font, colors[s], 0, 0, w, w, sf);

        img.ReleaseGraphics(g);
        imgarr[s] = img;
    }
    images.down_arrow = imgarr;

    // cog
    imgarr = [];
    for (s = 0; s < 3; s++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();
        g.SetTextRenderingHint(g_image_txt_rendering);

        g.DrawString("\uE713", font, colors[s], 0, 0, w, w, sf);

        img.ReleaseGraphics(g);
        imgarr[s] = img;
    }
    images.cog = imgarr;

    // loupe
    imgarr = [];
    for (s = 0; s < 3; s++) {
        img = gdi.CreateImage(w, w);
        g = img.GetGraphics();
        g.SetTextRenderingHint(g_image_txt_rendering);

        g.DrawString("\uE1A3", font, colors[s], 0, 0, w, w, sf);

        img.ReleaseGraphics(g);
        imgarr[s] = img;
    }
    images.loupe = imgarr;

    var font2 = gdi.Font("Segoe MDL2 Assets", z14);
    var w2 = 20;
    // plm_window
    imgarr = [];
    for (s = 0; s < 3; s++) {
        img = gdi.CreateImage(w2, w2);
        g = img.GetGraphics();
        g.SetTextRenderingHint(g_image_txt_rendering);

        g.DrawString("\uE248", font2, colors[s], 0, 0, w2, w2, sf);

        img.ReleaseGraphics(g);
        imgarr[s] = img;
    }
    images.go2 = imgarr;

};


//-----------------------------------------------------------------------------------

// * Crop from br3tt's wsh_playlist.2.0.1
ImageCache = function() {

    this.__cache = {};

    this.hit = function(metadb, cover_id, group_name) {
        var img = this.__cache[group_name];
        if (img) {
            return img;
        }

        if (typeof(img) == "undefined" || img == null) {
            if (!cover.ltimer) {
                cover.ltimer = window.SetTimeout(function() {
                    if (cover_id < 5) {
                        if (!pl.is_scrolling) {
                            utils.GetAlbumArtAsync(window.ID, metadb, cover_id, true, false, false);
                        }
                        window.ClearTimeout(cover.ltimer);
                        cover.ltimer = null;
                    }
                }, 30);
            }
        }

    }

    this.getit = function(metadb, image, group_name) {
        var cw = ch = cover.max_width;
        var img;
        var pw, ph, ratio;

        if (cover.keep_aspect_ratio && image) {
            if (image.Width <= image.Height) {
                ratio = image.Width / image.Height;
                pw = cw * ratio;
                ph = ch;
            } else {
                ratio = image.Height / image.Width;
                pw = cw;
                ph = ch * ratio;
            }
        } else {
            pw = cw;
            ph = ch;
        }

        img = format_album_art(image, pw, ph, false);
        this.__cache[group_name] = img;
        return img;

    }

}

function format_album_art(image, w, h, raw_bitmap) {
    if (image) {
        return raw_bitmap ? image.Resize(w, h, 2).CreateRawBitmap() : image.Resize(w, h, 2);
    } else {
        return raw_bitmap ? images.no_cover.Resize(w, h, 2).CreateRawBitmap() : images.no_cover.Resize(w, h, 2);
    };
};

function on_get_album_art_done(metadb, art_id, image, image_path) {

    for (var i = 0, len = pl.groups.length; i < len; i++) {
        //var name = pl.groups[i].name;
        var grp = pl.groups[i];
        if (grp.metadb && grp.metadb.Compare(metadb)) {
            if (art_id == AlbumArtId.front && !image) {
                image_cache.hit(metadb, AlbumArtId.disc, grp.name);
                break;
            } else {
                image_cache.getit(metadb, image, grp.name);
                window.Repaint();
                break;
            }
        }
    }

}


ScrollBar = function(parent) {

    this.parent = parent;
    this.clicked = false; // Mouse click cursor
    this.hover = false; // Mouse over cursor

    this.repaint = function() {
        parent.repaint();
    }

    this.set_size = function(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.update_cursor();
    }

    var z25 = zoom(25, g_dpi);
    this.update_cursor = function() {
        this.total_h = this.parent.total_h;
        this.list_h = this.parent.list_h;

        this.cursor_h = Math.round(this.h * this.list_h / this.total_h);
        if (this.cursor_h < z25) {
            this.cursor_h = z25;
        }
        this.set_cursor_y();
    }

    this.set_cursor_y = function() {
        var ratio = this.parent.offset_y / (this.total_h - this.list_h);
        this.cursor_y = this.y + Math.round((this.h - this.cursor_h) * ratio);
    }

    this.set_parent_offset_y = function() {
        var ratio = (this.cursor_y - this.y) / (this.h - this.cursor_h);
        this.parent.offset_y = Math.round((this.total_h - this.list_h) * ratio);
    }

    this.step_offset = function (offset) {
        var _offset = parent.offset_y;
        parent.offset_y -= offset;
        parent.check_offset();
        this.update_cursor();

        var to_paint = (_offset != parent.offset_y);
        return to_paint ? true : false;
    }

    this.scroll_to_y = function(y) {

        var half_cursor_h = Math.round(this.cursor_h / 2);

        if (y != this.cursor_y + half_cursor_h) {

            this.cursor_y = y - half_cursor_h;

            if (this.cursor_y < this.y) {
                this.cursor_y = this.y;
            } else if (this.cursor_y > this.y + this.h - this.cursor_h) {
                this.cursor_y = this.y + this.h - this.cursor_h;
            }

        }

        this.set_parent_offset_y();
        this.repaint();

    }
            
    this.on_mouse = function(event, x, y, m) {
        this.is_hover_scrollbar = (x > this.x && x < this.x+this.w && y > this.y && y < this.y+this.h);
        this.is_hover_cursor = (x > this.x && x < this.x+this.w && y > this.cursor_y && y < this.cursor_y+this.cursor_h);
        switch (event) {
            case "move":
                if (this.hover != this.is_hover_cursor) {
                    this.hover = this.is_hover_cursor;
                    this.parent.repaint();
                    return;
                }
                if (this.clicked) {
                    this.cursor_y = y - this.drag_delta;
                    if (this.cursor_y < this.y) {
                        this.cursor_y = this.y;
                    } else if (this.cursor_y > this.y+this.h - this.cursor_h) {
                        this.cursor_y = this.y+this.h - this.cursor_h;
                    }
                    this.set_parent_offset_y();
                    this.repaint();
                }
                break;
            case "down":
                if (this.is_hover_scrollbar) {
                    switch (true) {
                        case (y < this.cursor_y):
                            // page up
                            break;
                        case (this.hover):
                            this.clicked = true;
                            this.drag_delta = y - this.cursor_y;
                            parent.repaint();
                            break;
                        case (y > this.cursor_y+this.cursor_h):
                            // page down
                            break;
                    }
                }
                break;
            case "right":
                if (this.is_hover_list) {
                    this.context_menu(x, y);
                }
                break;
            case "up":
                if (this.clicked) {
                    this.clicked = false;
                    parent.repaint();
                }
                break;
            case "wheel":
                if (this.total_h > this.list_h) {

                    var delta_h = properties.scroll_step * pl.row_height;
                    if (utils.IsKeyPressed(VK_SHIFT)) delta_h = this.list_h;
                    if (utils.IsKeyPressed(VK_CONTROL)) delta_h = pl.row_height;

                    var _paint = this.step_offset(m * delta_h);
                    _paint && parent.repaint();
                }
                break;
            case "leave":
                this.hover = false;
                this.clicked = false;
                parent.repaint();
                break;

        }
    }

    this.draw = function(gr) {

        if (this.h < z25) {
            return;
        }

        // Bg
        gr.FillSolidRect(this.x, this.y, this.w, this.h, g_colors.txt_normal & 0x05ffffff);

        // Cursor
        var color = g_colors.txt_normal & 0x33ffffff;
        if (this.clicked) {
            color = g_colors.txt_normal & 0x99ffffff;
        } else if (this.hover) {
            color = g_colors.txt_normal & 0x55ffffff;
        }

        gr.FillSolidRect(this.x, this.cursor_y, this.w, this.cursor_h, color);

    }

    this.context_menu = function(x, y) {

        var _menu = window.CreatePopupMenu();
        var ret;

        _menu.AppendMenuItem(MF_STRING, 1, "滚动至此");
        _menu.AppendMenuSeparator();
        _menu.AppendMenuItem(MF_STRING, 2, "顶部");
        _menu.AppendMenuItem(MF_STRING, 3, "底部");
        _menu.AppendMenuSeparator();
        _menu.AppendMenuItem(MF_STRING, 4, "向下翻页");
        _menu.AppendMenuItem(MF_STRING, 5, "向上翻页");
        _menu.AppendMenuSeparator();
        _menu.AppendMenuItem(MF_STRING, 6, "向上滚动");
        _menu.AppendMenuItem(MF_STRING, 7, "向下滚动");

        ret = _menu.TrackPopupMenu(x, y);
        switch (ret) {
            case 1:
                this.scroll_to_y(y);
                break;
            case 2:
                this.scroll_to_y(this.y);
                break;
            case 3:
                this.scroll_to_y(this.y+this.h);
                break;
            case 4:
                this.step_offset(-this.list_h);
                this.repaint();
                break;
            case 5:
                this.step_offset(this.list_h);
                this.repaint();
                break;
            case 6:
                this.on_mouse("wheel", 0, 0, 1);
                break;
            case 7:
                this.on_mouse("wheel", 0, 0, -1);
                break;
        }

        _menu.Dispose();

    }


}

PlManager = function () {

    this.visible = window.GetProperty("plm: " + __("Show playlist manager"), false);
    this.auto_hide = false; // TODO

    this.playlist = [];
    this.scrollbar = new ScrollBar(this);
    this.scrollbar_w = properties.scrollbar_width;
    this.need_scrollbar = false;

    this.inputbox = null;

    this.row_height = zoom(28, g_dpi);
    this.total = 0;
    this.total_h = 0;
    this.offset_y = 0;
    this.offset_y2 = 0;
    this._start = 0;
    this._end = 0;

    this.hover_id;
    this.active_id;

    this.repaint = function() {
        window.Repaint();
    }

    this.set_size = function(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.on_size();
    }

    var z15 = zoom(15, g_dpi);
    var z10 = zoom(10, g_dpi);

    this.on_size = function() {
        this.list_y = this.y + this.row_height;
        this.list_x = this.x + z15;
        this.list_w = this.w - z15 * 2;;
        this.list_h = this.h - this.row_height * 2;
        //
        this.total_rows = Math.ceil(this.list_h / this.row_height);

        // Scrollbar
        this.need_scrollbar = (this.total_h > this.list_h);
        if (this.need_scrollbar) {
            this.list_w - z10;
            this.scrollbar.set_size(this.x+this.w-this.scrollbar_w-z2,
                    this.list_y, this.scrollbar_w, this.list_h);
        }
        // bt
        bt[4].set_xy(this.x+this.w-bt[4].w-z15, this.y+(this.row_height-bt[4].h)/2);
    }

    this.check_offset = function() {
        if (this.offset_y + this.list_h > this.total_h) {
            this.offset_y = this.total_h - this.list_h;
        }
        if (this.offset_y < 0) {
            this.offset_y = 0;
        }
    }

    this.load_list = function() {
        this.playlist = [];
        this.total = fb.PlaylistCount;
        this.total_h = this.total * this.row_height;

        var idx = 0;
        while (idx < this.total) {
            this.playlist[idx] = {
                name: plman.GetPlaylistName(idx),
                is_auto: fb.IsAutoPlaylist(idx),
                track_count: fb.PlaylistItemCount(idx),
            };
            idx++;
        }

        this.check_offset();
        this.scrollbar.update_cursor();
        this.repaint();
    }

    this.load_list();

    this.load_fonts = function() {
        this.text_font = gdi.Font(g_fonts.name, z11);
        this.ico_font = gdi.Font("Segoe MDL2 Assets", z14);
        this.mnlt2_font = gdi.Font("Segoe MDL2 Assets", z7);
        this.edit_font = gdi.Font("Tahoma", z11);
    }
    this.load_fonts();


    // => Draw playlist manager
    this.draw = function(gr) {

        if (!this.visible || this.h < this.row_height*2) {
            return;
        }

        // Bg
        gr.SetSmoothingMode(4);
        gr.FillRoundRect(this.x, this.y, this.w, this.h-0, z5, z5, g_colors.bg_normal);
        gr.SetSmoothingMode(0);

        var line_color = blendColors(g_colors.bg_normal, g_colors.txt_normal, 0.2);

        var ico_w = z25;
        var ico_x = this.list_x + 0;
        var ico = "";


        if (this.total > 0) {

            if (this.total <= this.total_rows) {
                this._start = 0;
                this._end = this.total - 1;
            } else {
                this._start = Math.floor(this.offset_y / this.row_height);
                this._end = this._start + this.total_rows;
                if (this._end >= this.total) {
                    this._end = this.total - 1;
                }
            }

            var rh = this.row_height;
            var ry, rx = this.list_x, rw = this.list_w;
            var row;
            var text_color;

            for (var i = this._start; i <= this._end; i++) {

                ry = this.list_y + i * this.row_height - this.offset_y + 0;
                row = this.playlist[i];

                text_color = g_colors.txt_normal;
                //text_font = gdi.Font(g_fonts.name, z11, 0);


                if (i == plman.ActivePlaylist) {
                    text_color = g_colors.highlight;
                }

                gr.FillSolidRect(rx , ry+rh-1, rw, 1, text_color & 0x19ffffff);

                // Icon
                
                ico = "\uE700";

                if (this.playlist[i].is_auto) {
                    ico = "\uE713";
                } else if (this.playlist[i].name.indexOf(__("Search [")) == 0) {
                    ico = "\uE721";
                }

                gr.SetTextRenderingHint(g_image_txt_rendering);
                gr.DrawString(ico, this.ico_font, text_color, ico_x, ry, ico_w, this.row_height, StringFormat(1, 1));
                if (i == plman.PlayingPlaylist && fb.IsPlaying) {
                    gr.FillSolidRect(ico_x, ry+this.row_height/2, ico_w/2, ico_w/2, g_colors.bg_normal);
                    gr.DrawString("\uF002", this.mnlt2_font, text_color, ico_x, ry+this.row_height/2, ico_w/2, rh/2, StringFormat(2, 0));
                }
                gr.SetTextRenderingHint(0);

                if (i == this.drag_over_id) {
                    if (this.drag_over_id > this.drag_id) {
                        gr.FillSolidRect(rx, ry+rh-z2, rw, z2, g_colors.bg_selected);
                    } else if (this.drag_over_id < this.drag_id){
                        gr.FillSolidRect(rx, ry+z1, rw, z2, g_colors.bg_selected);
                    }
                }

                // Playlist track count

                if (this.inputboxID == i) {
                    // Rename inputbox
                    this.inputbox.font = this.edit_font;
                    this.inputbox.w = this.list_x + this.list_w - rx-ico_w-z5*2;
                    this.inputbox.draw(gr, rx + ico_w + z10/2, ry + (rh-z10*2)/2);
                } else {
                    // Item count
                    var tk_w = Math.ceil(gr.CalcTextWidth(this.playlist[i].track_count, this.text_font));
                    var tk_x = this.list_x + this.list_w - tk_w - z5;
                    gr.GdiDrawText(this.playlist[i].track_count, this.text_font, blendColors(text_color, g_colors.bg_normal, 0.3), 
                            tk_x, ry, tk_w, rh, DT_CC);
                    // Pl name
                    gr.GdiDrawText(this.playlist[i].name, this.text_font, text_color, rx + ico_w + z10/2, ry, tk_x - rx-ico_w-z5, rh, DT_LC);
                }


                // Right clicked rectangle
                if (i == this.right_clicked_id) {
                    gr.DrawRect(rx+z1, ry+z1, rw-z2, rh-z2, z2, g_colors.bg_selected);
                }

                // Drop target rectangle
                if (i == this.drop_target_id) {
                    gr.DrawRect(rx+z1, ry+z1, rw-z2, rh-z2, z2, g_colors.bg_selected);
                }

            }

            if (this.need_scrollbar) {
                this.scrollbar.draw(gr);
            }

        }


        gr.FillSolidRect(this.x, this.y+this.row_height-1, this.w, 1, line_color);

        var text_color2 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.5);
        gr.FillSolidRect(this.x+1, this.y+1, this.w-2, this.row_height-1, g_colors.bg_normal);

        gr.SetTextRenderingHint(g_image_txt_rendering);
        gr.DrawString("\uF067", this.ico_font, text_color2, ico_x, this.y, ico_w, this.row_height, StringFormat(1, 1));
        gr.SetTextRenderingHint(0);

        gr.GdiDrawText(__("PLAYLISTS"), this.text_font, text_color2, rx+ico_w+z10/2, this.y, this.w, this.row_height, DT_LC);

        gr.FillSolidRect(this.x, this.y+this.h-this.row_height+1, this.w, this.row_height-2, g_colors.bg_normal);
        gr.FillSolidRect(this.x, this.y+this.row_height-1, this.w, 1, line_color);
        gr.FillSolidRect(this.x, this.y+this.h-this.row_height, this.w, 1, line_color);
        gr.SetSmoothingMode(4);
        gr.DrawRoundRect(this.x, this.y, this.w-1, this.h-1, z5, z5, 1, line_color);
        gr.SetSmoothingMode(0);

        gr.GdiDrawText("共 " + this.playlist.length + " 项", this.text_font, text_color2, 
                rx, this.y+this.h-this.row_height, rw-z5, this.row_height, DT_RC);

        if (this.drop_target_id == fb.PlaylistCount) {
            gr.DrawRect(rx+z1, this.y+z2,rw-z2, this.row_height-z3, z2, g_colors.bg_selected);
        }

    }

    this.hover_id = -1;
    this.drag_id = -1;
    this.drag_line_y = -1;
    this.drop_target_id = -1;

    this.on_mouse = function(event, x, y, mask) {

        this.is_hover = (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h);
        this.is_hover_obj = (x > this.list_x && x < this.list_x + this.list_w && 
                y > this.list_y && y < this.list_y + this.list_h);
        this.is_hover_scrollbar = this.scrollbar.is_hover_scrollbar;

        if (this.is_hover_obj) {
            this.hover_id = Math.floor((y + this.offset_y - this.list_y) / this.row_height);
            if (this.hover_id < 0 || this.hover_id >= this.playlist.length) {
                this.hover_id = -1;
            }
        } else {
            this.hover_id = -1;
        }

        switch (event) {

            case "move":
                this.scrollbar.on_mouse("move", x, y);

                if (this.inputboxID > -1) {
                    this.inputbox.check("move", x, y);
                } 

                if (this.drag_id > -1) {
                    if (this.hover_id > -1) {
                        this.drag_over_id = this.hover_id;
                    } else {
                    }

                    if (this.total_h > this.list_h) {
                        if (y < this.y + this.row_height) {
                            !this.is_scrolling && this.start_scrolling(1/3, function() {
                            });
                        }else if (y > this.y + this.h - this.row_height) {
                            !this.is_scrolling && this.start_scrolling(-1/3, function() {
                            });
                        } else {
                            this.is_scrolling && this.stop_scrolling();
                        }
                    }
                    window.Repaint();
                } else {
                    if (this.hover_id > -1) {
                        var tmp_drop_target_id = -1;
                        if (pl.row_drag && pl.handles_sel.Count > 0) {
                            tmp_drop_target_id = this.hover_id;
                        }
                    } else if (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.row_height) {
                        var tmp_drop_target_id = -1;
                        if (pl.row_drag && pl.handles_sel.Count > 0) {
                            tmp_drop_target_id = plman.PlaylistCount;
                        }
                    }
                    if (tmp_drop_target_id != this.drop_target_id) {
                        this.drop_target_id = tmp_drop_target_id;
                        this.repaint();
                    }
                }

                //window.SetCursor(this.drag_id > -1 ? 32651 : 32512);
                
                break;
            case "down":
                if (this.is_hover_scrollbar) {
                    this.scrollbar.on_mouse("down", x, y);
                } else {
                    if (this.hover_id > -1) {
                        if (this.hover_id == this.inputboxID) {
                            this.inputbox.check("down", x, y);
                        } else {
                            if (this.inputboxID > -1) {
                                this.inputboxID = -1;
                            }
                            if (this.hover_id != fb.ActivePlaylist) {
                                fb.ActivePlaylist = this.hover_id;
                                this.repaint();
                            } else {
                                this.drag_id = this.hover_id;
                            }
                        }
                    }
                }
                break;
            case "dblclk":
                if (this.is_hover_scrollbar) {
                    this.scrollbar.on_mouse("down", x, y);
                } else {
                    /*
                    if (this.hover_id > -1) {
                        fb.PlayingPlaylist = this.hover_id;
                        fb.Play();
                        pl.show_now_playing();
                    }
                    */
                    if (this.inputboxID > -1) {
                        this.inputbox.check("dblclk", x, y);
                    }

                }
                break;
            case "up":
                this.scrollbar.on_mouse("up", x, y);

                if (this.inputboxID > -1) {
                    this.inputbox.check("up", x, y);
                }

                if (this.drag_id > -1) {
                    if (this.drag_over_id > -1) {
                        fb.MovePlaylist(this.drag_id, this.drag_over_id);
                    }
                } else if (this.drop_target_id > -1) {

                    if (this.drop_target_id < fb.PlaylistCount) {
                        var base = this.playlist[this.drop_target_id].track_count;
                        plman.InsertPlaylistItems(this.drop_target_id, base, pl.handles_sel, false);
                    } else {
                        fb.CreatePlaylist(fb.PlaylistCount, "");
                        plman.InsertPlaylistItems(this.drop_target_id, 0, pl.handles_sel, false);
                    }

                }

                if (this.is_scrolling) {
                    this.stop_scrolling();
                }

                this.drop_target_id = -1;
                this.drag_id = -1;
                this.drag_over_id = -1;
                this.repaint();
                window.SetCursor(32512);

                break;

            case "right":
                if (this.is_hover_scrollbar) {
                    this.scrollbar.on_mouse("right", x, y);
                } else {
                    if (plm.inputboxID > -1) {
                        this.inputbox.check("right", x, y);
                    } else {
                        this.context_menu(x, y, this.hover_id);
                    }
                }
                break;
            case "leave":
                this.scrollbar.on_mouse("leave");
                this.hover_id = -1;
                this.repaint();
                break;
            case "wheel":
                this.scrollbar.on_mouse("wheel", x, y, mask);
                break;

        }

    }

    var this_ = this;

    this.start_scrolling = function(delta, callback) {
        if (this.is_scrolling) return;
        if (!this.is_scrolling) {
            this_.stimer1 = window.SetTimeout(function() {
                this_.stimer2 = window.SetInterval(function() {
                    this_.scrollbar.on_mouse("wheel", this_.x+1, this_.y+1, delta);
                    /*
                    if (plm.offset_y == 0 || plm.offset_y + plm.list_h == pl.total_h) {
                        plm.stop_scrolling();
                    }
                    */
                    callback && callback();
                }, 100);
            }, 350);
            this.is_scrolling = true;
        }
    }

    this.stop_scrolling = function () {
        this.stimer1 && window.ClearTimeout(this.stimer1);
        this.stimer1 = null;
        this.stimer2 && window.ClearTimeout(this.stimer2);
        this.stimer2 = null;
        this.is_scrolling = false;
    }


    this.context_menu = function(x, y, plid) {

        this.right_clicked_id = plid;

        var _menu = window.CreatePopupMenu();
        var _newpl = window.CreatePopupMenu();
        var _cont = window.CreatePopupMenu();
        var Context = fb.CreateContextMenuManager();
        var handles = plman.GetPlaylistItems(plid);
        var base_id = 1000;

        var add_mode = (plid == null || plid < 0);

        if (add_mode) {
            plid = this.playlist.length;
        }

        if (!add_mode) {

            _menu.AppendMenuItem(this.playlist[plid].track_count > 0 ? MF_STRING : MF_DISABLED, 1, __("Play"));
            _menu.AppendMenuItem(MF_STRING, 2, __("Rename"));
            _menu.AppendMenuItem(MF_STRING, 3, __("Remove"));
            _menu.AppendMenuItem(MF_STRING, 4, __("Save..."));
            _menu.AppendMenuSeparator();

        }

        if (!add_mode) {
            _newpl.AppendTo(_menu, MF_STRING, __("Insert"));
        } else {
            _newpl.AppendTo(_menu, MF_STRING, __("Add"));
        }

        _newpl.AppendMenuItem(MF_STRING, 100, __("New playlist"));
        _newpl.AppendMenuItem(MF_STRING, 101, __("New autoplaylist"));

        _menu.AppendMenuItem(MF_STRING, 5, __("Load playlist..."));

        if (!add_mode) {
            if (plman.IsAutoPlaylist(plid)) {
                _menu.AppendMenuSeparator();
                _menu.AppendMenuItem(MF_STRING, 10, __("Edit autoplaylist..."));
                _menu.AppendMenuItem(MF_STRING, 11, __("Convert to a normal playlist"));
            }
        }

        _menu.AppendMenuSeparator();
        _cont.AppendTo(_menu, handles.Count > 0 ? MF_STRING : MF_DISABLED, __("Contents"));
        Context.InitContext(handles);
        Context.BuildMenu(_cont, base_id, -1);

        var ret = _menu.TrackPopupMenu(x, y);

        if (ret > base_id -1) {

            Context.ExecuteByID(ret - base_id);

        }

        switch (ret) {
            case 1:
                var temp_id = fb.ActivePlaylist;
                fb.Stop();
                plman.PlayingPlaylist = plid;
                plman.ActivePlaylist = plid;
                plman.ExecutePlaylistDefaultAction(plid, 0);
                //fb.ActivePlaylist = temp_id;
                break;
            case 2:
                // Rename
                this.inputbox_rename_pl(plid);
                break;
            case 3:
                plman.RemovePlaylist(plid);
                break;
            case 4:
                fb.SavePlaylist();
                break;
            case 5:
                fb.LoadPlaylist();
                break;
            case 10:
                g_avoid_hide_plmanager = true;
                fb.ShowAutoPlaylistUI(plid);
                g_avoid_hide_plmanager = false;
                break;
            case 11:
                plman.DuplicatePlaylist(plid, plman.GetPlaylistName(plid));
                plman.RemovePlaylist(plid);
                plman.ActivePlaylist = plid;
                break;
            case 100:
                fb.CreatePlaylist(plid, "");
                this.inputbox_rename_pl(plid);
                break;
            case 101:
                g_avoid_hide_plmanager = true;
                plman.CreateAutoPlaylist(plid, __("New autoplaylist"), "ALL", "%path_sort%");
                fb.ShowAutoPlaylistUI(plid);
                this.inputbox_rename_pl(plid);
                g_avoid_hide_plmanager = false;
                break;

        }

        _menu.Dispose();
        _newpl.Dispose();

        this.right_clicked_id = -1;
    }

    var z50 = zoom(50, g_dpi);
    var z20 = zoom(20, g_dpi);

    this.inputbox_rename_pl = function(plid) {

        //g_avoid_change_pl = true;
        // rename it
        this.inputbox = new oInputbox(this.list_w-z50, z20, fb.GetPlaylistName(plid), "", g_colors.bg_normal, g_colors.txt_normal, 0xff000000, g_colors.bg_selected & 0xd0ffffff, rename_playlist, "PlManager");
        this.inputboxID = plid;
        // 
        this.inputbox.on_focus(true);
        this.inputbox.edit = true;
        this.inputbox.Cpos = this.inputbox.text.length;
        this.inputbox.anchor = this.inputbox.Cpos;
        this.inputbox.SelBegin = this.inputbox.Cpos;
        this.inputbox.SelEnd = this.inputbox.Cpos;
        if (!cInputbox.timer_cursor) {
            this.inputbox.resetCursorTimer();
        }
        this.inputbox.dblclk = true;
        this.inputbox.SelBegin = 0;
        this.inputbox.SelEnd = this.inputbox.text.length;
        this.inputbox.text_selected = this.inputbox.text;
        this.inputbox.select = true;
        this.repaint();
    }

}

function rename_playlist() {
    if (!plm.inputbox.text || plm.inputbox.text == "" || plm.inputboxID == -1) {
        plm.inputbox.text = plm.playlist[plm.inputboxID].name;
    }
    if (plm.inputbox.text.length > 0) { // || (plm.inputbox.text.length == 1 && plm.inputbox.
        plm.playlist[plm.inputboxID].name = plm.inputbox.text;
        plman.RenamePlaylist(plm.inputboxID, plm.inputbox.text);
        plm.repaint();
    }
    plm.inputboxID = -1;
    //g_avoid_change_pl = false;
}

function toggle_show_plmanager() {
    if (g_avoid_hide_plmanager && plm.visible) {
        return;
    }
    plm.visible = !plm.visible;
    plm.inputboxID = -1;
    window.SetProperty("plm: " + __("Show playlist manager"), plm.visible);
    on_size();
    window.Repaint();
}



Group = function(metadb, first_id, name) {
    this.metadb = metadb;
    this.first = first_id;
    this.count = 0;
    this.last = -1;
    this.name = name;
    this.collapsed = properties.auto_collapse;
};

Item = function(metadb, type, list_index, group_index) {
    this.metadb = metadb;
    this.type = type;
    this.list_index = list_index;
    this.group_index = group_index;
};

Playlist = function(mode) {

    this.padding_h = window.GetProperty("pl: " + __("Padding left/right"), 0);
    this.padding_v = window.GetProperty("pl: " + __("Padding top/bottom"), 0);

    this.padding_h = zoom(this.padding_h, g_dpi);
    this.padding_v = zoom(this.padding_v, g_dpi);

    this.get_row_height = function() {
        var rh = properties.row_height.split(",");
        this.row_height = properties.double_line ? Number(rh[1]) : Number(rh[0]);
        this.row_height = zoom(this.row_height, g_dpi);
        return this.row_height;
    }
    this.get_row_height();

    this.group_header_rows = Math.round(properties.group_header_height/this.row_height+0.2);
    this.show_scrollbar = properties.show_scrollbar;
    this.scrollbar_w = properties.scrollbar_width;

    this.scrollbar = new ScrollBar(this);
    this.need_scrollbar = false;

    this.total = 0;
    this.total_h = 0;
    this.offset_y = 0;
    this._offset_y = 0;

    this.pl_offset = {};

    this.__start = 0;
    this.__end = 0;

    this.rows = [];
    this.groups = [];
    this.load = false;

    this.repaint = function() {
        window.Repaint();
    }

    this.check_offset = function() {
        if (this.offset_y + this.list_h > this.total_h) {
            this.offset_y = this.total_h - this.list_h;
        };
        if (this.offset_y < 0) {
            this.offset_y = 0;
        }
    }

    this.set_size = function(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.on_size();
    }

    this.on_size = function() {
        this.list_x = this.x + this.padding_h;
        this.list_y = this.y + this.padding_v;
        this.list_w = this.w - this.padding_h * 2;
        this.list_h = this.h - this.padding_v * 2;
        //
        this.check_offset();
        this.total_rows = Math.ceil(this.list_h / this.row_height);
        this.total_rows_vis = Math.floor(this.list_h / this.row_height);
        //
        this.show_scrollbar = properties.show_scrollbar;
        this.need_scrollbar = (this.total_h > this.list_h);
        if (this.need_scrollbar && this.show_scrollbar) {
            this.list_w = this.list_w - this.scrollbar_w-1;
            this.scrollbar.set_size(this.list_x+this.list_w+this.padding_h, this.list_y, this.scrollbar_w, this.list_h);
        } else {
            this.scrollbar.set_size(0, 0, 0, 0);
        }
    }

    this.offset_y2 = 0;

    this.init_list = function(callbacks) {

        console("--> Init list");
        this.check_offset();
        this.handles = plman.GetPlaylistItems(g_active_pl);
        this.track_total = this.handles.Count;
        this.groups = [];
        this.rows = [];
        this.load = false;

        this.offset_y2 = this.offset_y;

        CollectGarbage();

        this.load_list(0, "!@#", callbacks);
    }

    this.load_list = function(start, compare, callback) {
        var idx = start;
        var g = this.groups.length;
        var r = this.rows.length;
        var __profile = fb.CreateProfiler("LOAD");
        var metadb = null, temp_group = "";

        while (idx < this.track_total) {

            if (__profile.Time > 30) {
                this.on_load();
                break;
            }

            metadb = this.handles.Item(idx);
            temp_group = tf_group.EvalWithMetadb(metadb);

            if (temp_group != compare) {

                compare = temp_group;
                this.groups[g] = new Group(metadb, idx, temp_group);

                if (g > 0) {
                    this.groups[g-1].track_total = idx - this.groups[g-1].first;
                    this.groups[g-1].last = idx - 1;
                    var tt = this.groups[g-1].track_total;
                    if (properties.show_group_header && !this.groups[g-1].collapsed) {
                        if (tt < properties.min_group_rows) {
                            var ta = properties.min_group_rows - tt;
                            for (var k = 0; k < ta; k++) {
                                this.rows[r++] = new Item(metadb, -1, null, g-1);
                            }
                        }
                        for (var k = 0; k < properties.extra_group_rows; k++) {
                            this.rows[r++] = new Item(null, -2, null, g-1);
                        }
                    }
                }

                if (properties.show_group_header) {
                    for (var k = 0; k < this.group_header_rows; k++) {
                        this.rows[r++] = new Item(metadb, k+1, null, g);
                    }
                }

                g++;

            }

            if (!this.groups[g-1].collapsed) {
                this.rows[r++] = new Item(metadb, 0, idx, g-1);
            }

            idx++;

        }

        if (g > 0) {
            this.groups[g-1].track_total = idx - this.groups[g-1].first;
            this.groups[g-1].last = idx-1;

            var tt = this.groups[g-1].track_total;
            if (properties.show_group_header && !this.groups[g-1].collapsed) {
                if (tt < properties.min_group_rows) {
                    var ta = properties.min_group_rows - tt;
                    for (var k = 0; k < ta; k++) {
                        this.rows[r++] = new Item(metadb, -1, null, g-1);
                    }
                }
                //var ta = Math.max(properties.extra_group_rows, 5);
                var ta = properties.extra_group_rows;
                for (var k = 0; k < ta; k++) {
                    this.rows[r++] = new Item(null, -2, null, g-1);
                }
            }
        }

        //
        if (idx == this.track_total) {
            this.load = true;
            this.on_load();
            callback && callback();
        } else {
            this.__ltimer && window.ClearTimeout(this.__ltimer);
            this.__ltimer = window.SetTimeout(function() {
                this_.load_list(idx, compare, callback);
            }, 30);
        }

    }

    var this_ = this;


    this.on_load = function() {

        this.list_name = plman.GetPlaylistName(g_active_pl);
        this.total = this.rows.length;
        this.total_h = this.total * this.row_height + 40;;
        this.on_size();

        if (this.offset_y != this.offset_y2) {
            this.offset_y = this.offset_y2;
            this.check_offset();
        }

        this.scrollbar.update_cursor();
        this.repaint();

        plman.SetActivePlaylistContext();

    }


    this.is_group_sel = function(group_index) {
        var group = this.groups[group_index];
        for (var i = group.first; i <= group.last; i++) {
            if (!plman.IsPlaylistItemSelected(g_active_pl, i))
                return false;
        }
        return true;
    }


    // Draw playlist items

    this.draw = function(gr) {

        if (this.total > 0) {

            if (this.total <= this.total_rows_vis) {
                this.__start = 0;
                this.__end = this.total - 1;
            } else {
                this.__start = Math.floor(this.offset_y / this.row_height);
                this.__end = this.__start + this.total_rows + this.group_header_rows - 1;
                if (this.__start < 0) this.__start = 0;
                if (this.__end >= this.total) this.__end = this.total - 1;
            }

            this.now_playing = -1;
            this.focus_track = -1;

            var rh = this.row_height, ry = 0;
            var rx = this.list_x, rw = this.list_w;
            var row, metadb;
            var is_odd = false;

            for (var i = this.__start; i <= this.__end; i++) {

                ry = this.list_y + i * rh - this.offset_y;
                this.rows[i].y = ry;

                var row = this.rows[i];
                if (row.type > -1) {
                    metadb = row.metadb;
                }

                switch (row.type) {
                    case this.group_header_rows:
                        
                        // ** Draw group header **

                        var g = row.group_index;
                        var gy = ry - (this.group_header_rows - 1) * rh;
                        var gh = this.group_header_rows * rh;

                        // >> Bg
                        //gr.FillSolidRect(rx, gy, rw, gh-1, g_colors.txt_normal & 0x10ffffff);

                        var backcolor_sel = setAlpha(g_colors.bg_selected, properties.selection_alpha);
                        var backcolor_light = (Luminance(backcolor_sel) > 0.6);
                        var is_grp_sel = this.is_group_sel(g);


                        if (is_grp_sel) {
                            gr.FillSolidRect(rx, gy, rw, gh, backcolor_sel);
                        }

                        // >> Cover
                        var img = image_cache.hit(metadb, AlbumArtId.front, this.groups[g].name);

                        var p = 8;
                        cover.max_width = gh - p * 2 - 1;

                        var cx = rx + p;
                        var cy = gy + p;
                        var cw = cover.max_width;
                        cover.x = cx;
                        cover.w = cw;

                        if (img) {
                            var iw = img.Width, ih = img.Height;
                            var ix = cx + (cw - iw) / 2,
                            iy = cy + (cw - ih) / 2;
                            gr.DrawImage(img, ix, iy, iw, ih, 0, 0, iw, ih, 0, 225);
                        } else {
                            gr.DrawImage(images.loading,cx, cy, cw, cw, 0, 0, cw, cw, 0, 225);
                        }

                        gr.FillSolidRect(cover.x + cover.w + z10, gy+gh-1, rx - cover.x + rw - cover.w - z10, 1, g_colors.txt_normal & 0x10ffffff);

                        // >> Text
                        var tags = tf_group_header.EvalWithMetadb(metadb).split("|||");
                        var p = z10;

                        var color_l1 = blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.2);

                        if (is_grp_sel && (Luminance(color_l1) > 0.6 && Luminance(backcolor_sel) > 0.6
                                   || Luminance(color_l1) <= 0.6 && Luminance(backcolor_sel) < 0.6)) {
                            color_l1 = negativeColor(color_l1);
                        }


                        var l1y = gy + (gh - 50) / 2;

                        //
                        var album_x = cover.x + cover.w + z10;
                        var album_w = rx+rw - album_x - z10;
                        gr.GdiDrawText(tags[0], g_fonts.header1, color_l1, album_x, l1y, album_w, gh, DT_LT);

                        var color_l2 = color_l1;
                        var l2y = l1y+30;

                        //
                        var artist_x = album_x;
                        var artist_w = album_w;
                        gr.GdiDrawText(tags[1], g_fonts.header2, color_l2, artist_x, l2y, artist_w, gh, DT_LT);

                        break;
                    case 0:
                        // Draw tracks
                        var l = row.list_index;
                        var is_selected = plman.IsPlaylistItemSelected(g_active_pl, l);
                        var is_playing = (plman.PlayingPlaylist == g_active_pl && plman.GetPlayingItemLocation().PlaylistItemIndex == l);
                        var is_focused = plman.GetPlaylistFocusItemIndex(g_active_pl) == l;


                        var txt_color = g_colors.txt_normal;

                        /*
                         * Odd/Even rows
                        if (properties.show_group_header && (l - this.groups[row.group_index].first % 2) 
                                || !properties.show_group_header && l % 2) {
                            gr.FillSolidRect(rx, ry, rw, rh, g_colors.txt_normal & 0x05ffffff);
                        }
                        */

                        // Draw row split line
                        //if (!properties.show_group_header || properties.show_row_split_line && (this.groups[row.group_index].last != l)) {
                            gr.FillSolidRect(rx, ry+rh-1, rw, 1, 0x10ffffff & g_colors.txt_normal);
                        //}

                        if (is_selected) {
                            txt_color = g_colors.txt_selected;
                            // Selection bg
                            gr.FillSolidRect(rx, ry, rw, rh, setAlpha(g_colors.bg_selected, properties.selection_alpha));
                        }
                        if (is_playing) {
                            if (i < this.__start + this.total_rows_vis - 0) {
                                this.now_playing = l;
                            }
                        }


                        // Draw focused rectangle
                        if (is_focused) {
                            if (i > this.__start && i < this.__start + this.total_rows_vis) {
                                this.focus_track = l;
                            }
                            if (properties.show_focus_row) {
                                gr.DrawRect(rx+z1, ry+z1, rw-z2, rh-z2, z2, g_colors.bg_selected);
                            }
                        }

                        
                        var txt_color2 = blendColors(txt_color, g_colors.bg_normal, 0.3);

                        var tags = tf_track.EvalWithMetadb(metadb).split("|||");
                        var l1y = ry, l2y = ry;
                        var l1h = rh, l2h = rh;

                        if (properties.double_line && this.row_height >= z40) {
                            l1y = ry + z2;
                            l2y = ry + rh/2 - z2;
                            l1h = l2h = rh/2;
                        }

                        // Track number/Queue index
                        var tn_x = rx + z5, tn_w = z25;

                        if (is_playing) {

                            gr.GdiDrawText(fb.IsPaused ? "\uE103" : "\uE102", g_fonts.mdl2, txt_color, tn_x, l1y, tn_w, l1h, DT_RC);

                        } else {
                            var queue_index = plman.FindPlaybackQueueItemIndex(metadb, g_active_pl, l);
                            if (queue_index > -1) {
                                var txt = "*" + num(queue_index + 1, 2);
                                //gr.DrawRect(tn_x+5, ry+rh/2-10, tn_w, 20, 1, g_colors.highlight & 0x55ffffff);
                                gr.GdiDrawText(txt, g_fonts.item, g_colors.highlight, tn_x, l1y, tn_w, l1h, DT_RC);
                            } else {
                                gr.GdiDrawText(tags[0], g_fonts.item, txt_color, tn_x, l1y, tn_w, l1h, DT_RC);
                            }
                        }

                        // Rating
                        var p = z10;
                        Rating.x = rx + rw;
                        if (properties.show_rating) {
                            var star_w = z14;
                            Rating.w = star_w * 5;
                            Rating.x = Rating.x - Rating.w - p + z2;
                            for (var r = 0; r < 5; r++) {
                                var star_x = Rating.x + r * star_w;
                                var font = (r < tags[5] ? g_fonts.rating1 : g_fonts.rating2);
                                gr.GdiDrawText(r < tags[5] ? "\u2605" : "\u2219", font, txt_color, star_x, l2y, star_w, l2h, DT_CC);
                            }
                        }

                        if (properties.double_line && this.row_height >= z40) {
                            var length_x = rx + rw - z40 - p;
                        } else {
                            var length_x = Rating.x - z40 - p;
                        }
                        gr.GdiDrawText(tags[4], g_fonts.item, txt_color, length_x, l1y, z40, l1h, DT_RC);

                        var count_w = (properties.show_playcount ? z25 : 0);
                        var count_x = length_x - count_w - p;
                        properties.show_playcount && gr.GdiDrawText(tags[3], g_fonts.item, txt_color2, count_x, l1y, count_w, l1h, DT_RC);

                        var title_x = tn_x + tn_w + p;
                        var title_w = count_x - title_x - p;
                        gr.GdiDrawText(tags[1], g_fonts.item, txt_color, title_x, l1y, title_w, l1h, DT_LC);

                        if (properties.double_line && this.row_height >= z40) {
                            var artist_x = title_x;
                            var artist_w = Rating.x - artist_x - p;
                            var artist = (tags[2] == "?" ? $("[%artist%]", metadb) : tags[2]);
                            gr.GdiDrawText(artist, g_fonts.item_small, txt_color2, artist_x, l2y, artist_w, l2h, DT_LC);
                        } else if (properties.show_track_artist) { 
                            var artist_x = title_x + gr.CalcTextWidth(tags[1], g_fonts.item);
                            var artist_w = title_x + title_w - artist_x;
                            if (artist_w > 0 && tags[2] != "?") {
                                gr.GdiDrawText(" - " + tags[2], g_fonts.item, txt_color2, artist_x, l2y, artist_w, l2h, DT_LC);
                            }
                        }

                        break;

                }

            }


        } else {
            //
            var font = gdi.Font(g_fonts.name, zoom(42, g_dpi), 0);
            gr.GdiDrawText(__("Empty playlist!"), font, blendColors(g_colors.txt_normal, g_colors.bg_normal, 0.5), this.list_x, this.list_y, this.list_w, this.list_h, DT_CC);
        }

        // Draw scrollbar
        if (this.need_scrollbar && this.show_scrollbar) {
            this.scrollbar.draw(gr);
        }

        if (this.split_y > -1) {

            //if (this.row_drag [>&& !(this.active_row > -1 && this.rows[this.active_row].type > 0)<]) {
                gr.FillSolidRect(this.list_x, this.split_y - 1, this.list_w, 2, g_colors.txt_normal & 0x88ffffff);
            //}

        }

        // 覆盖超出部分
        gr.FillSolidRect(rx, 0, rw, this.list_y, g_colors.bg_normal & 0xeeffffff);
        gr.FillSolidRect(rx, this.list_y+this.list_h, rw, wh-this.list_y-this.list_h, g_colors.bg_normal);

    }


    this.on_mouse = function(event, x, y, mask) {

        var is_shift_pressed = utils.IsKeyPressed(VK_SHIFT);
        var is_ctrl_pressed = utils.IsKeyPressed(VK_CONTROL);

        this.is_hover_list = (x > this.list_x && x < this.list_x+this.list_w && y > this.list_y && y < this.list_y+this.list_h);
        this.is_hover_scrollbar = this.scrollbar.is_hover_scrollbar;
        this.is_over_plman = plm.visible && plm.is_hover;

        // Get hover row index
        if (this.is_hover_list) {
            this.active_row = Math.ceil((y + this.offset_y - this.y) / this.row_height - 1);
            if (this.active_row >= this.total) this.active_row = -1;
        } else {
            this.active_row = -1;
        }

        var row_type;
        var g = -1, r = null;

        if (this.active_row > -1) {
            r = this.rows[this.active_row];
            g = r.group_index;
            row_type = r.type;
        }

        switch (event) {
            case "down":
                if (this.is_hover_scrollbar) {

                    this.scrollbar.on_mouse("down", x, y, mask);

                } else {

                    if (this.active_row == -1 || this.rows[this.active_row].type < -1) {
                        if (!is_shift_pressed && !is_ctrl_pressed && y >= this.list_y) {
                            plman.ClearPlaylistSelection(g_active_pl);
                            this.SHIFT_start_idx = -1;
                        }

                        if (this.is_hover_list) {
                            //this.is_selecting = true;
                            //this.SELECT_start_idx = this.track_total;
                        }

                        return;
                    }

                    this.SELECT_start_idx = -1;
                    this.is_selecting = false;

                    this.clicked_row = -1;
                    this.row_clicked = false;

                    switch (true) {
                        //> Clicked on group header
                        case (row_type > 0):

                            if (is_ctrl_pressed) {

                                this.select_group(g);
                                this.SHIFT_start_idx =this.groups[g].first;

                            } else {

                                plman.ClearPlaylistSelection(g_active_pl);
                                this.select_group(g);
                                this.SHIFT_start_idx = this.groups[g].first;
                                this.row_clicked = true;
                                this.clicked_row = this.active_row;

                            }

                            this.is_selecting = false;
                            plman.SetPlaylistFocusItem(g_active_pl, this.groups[g].first);

                            if (properties.auto_collapse) {

                                // ...

                            }

                            break;
                        case (row_type == 0):
                            //> Clicked on tracks
                            var list_index = r.list_index;

                            if (is_shift_pressed) {

                                if (g_focused_idx != list_index && plman.IsPlaylistItemSelected(g_active_pl, g_focused_idx)) {

                                    if (this.SHIFT_start_idx > -1) {

                                        this.select_range(this.SHIFT_start_idx, list_index);

                                    } else {

                                        this.select_range(this.g_focused_idx, list_index);

                                    }

                                } else {

                                    plman.SetPlaylistSelectionSingle(g_active_pl, list_index, true);
                                    this.SHIFT_start_idx = list_index;

                                }

                                plman.SetPlaylistFocusItem(g_active_pl, list_index);
                                this.is_selecting = false;

                            } else if (is_ctrl_pressed) {

                                if (plman.IsPlaylistItemSelected(g_active_pl, list_index)) {

                                    plman.SetPlaylistSelectionSingle(g_active_pl, list_index, false);

                                } else {

                                    plman.SetPlaylistSelectionSingle(g_active_pl, list_index, true);
                                    plman.SetPlaylistFocusItem(g_active_pl, list_index);

                                }

                                this.SHIFT_start_idx = list_index;
                                this.is_selecting = false;

                            } else {

                                if (plman.IsPlaylistItemSelected(g_active_pl, list_index)) {

                                    this.row_clicked = true;
                                    this.clicked_row = this.active_row;
                                    this.is_selecting = false;

                                } else {

                                    this.is_selecting = true;
                                    this.row_clicked = false;
                                    this.clicked_row = this.active_row;
                                    plman.ClearPlaylistSelection(g_active_pl);
                                    plman.SetPlaylistSelectionSingle(g_active_pl, list_index, true);

                                }

                                plman.SetPlaylistFocusItem(g_active_pl, list_index);
                                this.SHIFT_start_idx = list_index;

                            }

                            break;

                        default:

                            this.is_selecting = true;
                            break;
                    }

                    this.repaint();

                }
                break;
            case "dblclk":
                if (this.is_hover_scrollbar) {

                    this.scrollbar.on_mouse("down", x, y);

                } else {

                    if (this.active_row > -1) {

                        switch (true) {
                            case (row_type > 0):

                                if (this.groups[g].collapsed) {
                                    this.expand_group(g);
                                } else {
                                    this.collapse_group(g);
                                }


                                break;

                            case (row_type == 0):
                                // Set rating
                                if (properties.show_rating && x > Rating.x && x < Rating.x+Rating.w) {

                                    var star_w = Rating.w / 5;
                                    var metadb = this.rows[this.active_row].metadb;
                                    var from = tf_rating.EvalWithMetadb(metadb);
                                    var to = Math.ceil((x - Rating.x) / star_w);
                                    if (from == to) { 
                                        fb.RunContextCommandWithMetadb(__("Rating/") + __("<not set>"), metadb);  
                                    } else {
                                        fb.RunContextCommandWithMetadb(__("Rating/") + to, metadb);
                                    }
                                    break;

                                }

                                var list_index = this.rows[this.active_row].list_index;
                                plman.ExecutePlaylistDefaultAction(g_active_pl, list_index);
                                break;

                        }

                        this.repaint();

                    }

                }
                break;

            case "move":
                this.scrollbar.on_mouse("move", x, y);

                var temp_y = this.split_y; 
                this.split_y = -1;

                //> Drag selected tracks
                if (this.row_clicked) {

                    var obj_c = this.rows[this.clicked_row];
                    var obj_r = this.rows[this.active_row];

                    if (this.active_row == -1 ||
                           this.clicked_row > -1 && obj_c.type == 0 && this.active_row != this.clicked_row ||
                           this.clicked_row > -1 && obj_c.type > 0 && (obj_r.group_index !== obj_c.group_index || obj_r.type != obj_c.type) ||
                           this.is_over_plman) {

                        this.row_drag = true;
                        this.handles_sel = plman.GetPlaylistSelectedItems(g_active_pl);;

                    }

                    if (this.active_row > -1 && this.rows[this.active_row].type > 0) {

                        if (this.groups[g].collapsed) {
                            this.expand_group(g);
                        }

                    }

                    if (this.row_drag && !this.is_over_plman) {

                        if (this.active_row > -1) {

                            this.split_y = this.rows[this.active_row].y + this.row_height * (row_type > 0 ? this.group_header_rows - row_type + 1 : 0);

                        } else {

                            if (!this.need_scrollbar) {

                                if (y > this.list_y + this.total_h) {
                                    this.split_y = this.list_y + this.total_h;
                                }

                            } else {

                                if (this.offset_y == 0 && y < this.rows[0].y) {
                                    this.split_y = this.list_y + this.group_header_rows * this.row_height;
                                }

                            }

                        }

                    }

                    if (this.split_y != temp_y) {
                        this.repaint();
                    }

                    // Auto scroll
                    if (this.row_drag && this.need_scrollbar) {

                        if (y < this.list_y) {
                            if (!this.is_scrolling) {
                                this.start_scrolling(1, function(){});
                            }
                        } else if (y > this.list_y + this.list_h) {
                            if (!this.is_scrolling) {
                                this.start_scrolling(-1, function(){});
                            }
                        } else {
                            this.stop_scrolling();
                        }

                    }

                }

                // Selecting: Hold mouse left button and move up/down, then
                // affected items should be selected/deselected.
                
                if (this.is_selecting) {
                    var end_ = -1, start_ = -1;

                    if (this.clicked_row > -1) {
                        start_ = g_focused_idx;
                    }

                    // Selecting & scrolling
                    if (this.need_scrollbar) {

                        if (y < this.list_y) {

                            !this.is_scrolling && this.start_scrolling(1, function() {
                                var type = pl.rows[pl.__start].type;
                                var g = pl.rows[pl.__start].group_index;
                                if (type > 0) {
                                    end_ = pl.groups[g].first;
                                } else if (type < 0) {
                                    end_ = pl.groups[g+1].first;
                                } else {
                                    end_ = pl.rows[pl.__start].list_index;
                                }
                                pl.select_range(g_focused_idx, end_);
                            });

                        } else if (y > this.list_y + this.list_h) {

                            !this.is_scrolling && this.start_scrolling(-1, function() {
                                var type = pl.rows[pl.__end].type;
                                var g = pl.rows[pl.__end].group_index;
                                if (type > 0) {
                                    end_ = pl.groups[g-1].last;
                                } else if (type < 0) {
                                    end_ = pl.groups[g].last;
                                } else {
                                    end_ = pl.rows[pl.__end].list_index;
                                }
                                pl.select_range(g_focused_idx, end_);
                            });

                        } else {

                            this.stop_scrolling();

                        }

                    }

                    if (this.active_row == this.clicked_row) {

                        end_ = start_;

                    } else if (this.clicked_row > -1 && this.active_row > -1) {

                        if (row_type == 0) {

                            end_ = r.list_index;

                        } else if (row_type > 0) {

                            if (this.clicked_row > this.active_row) {
                                end_ = this.groups[g].first;
                            } else {
                                end_ = this.groups[g - 1].last;
                            }

                        } else {

                            if (this.clicked_row > this.active_row) {
                                end_ = this.groups[g+1].first;
                            } else {
                                end_ = this.groups[g].last;
                            }

                        }

                    }

                    if (!this.need_scrollbar && y > this.list_y + this.total_h + this.row_height) {
                        end_ = this.track_total - 1;
                    }


                    if (y < this.list_y) {

                        var type = this.rows[this.__start].type;
                        var g = this.rows[this.__start].group_index;

                        if (type > 0) {
                            end_ = this.groups[g].first;
                        } else if (type < 0) {
                            end_ = this.groups[g + 1].first;
                        } else {
                            end_ = this.rows[this.__start].list_index;
                        }

                    } else if (y > this.list_y + this.list_h) {

                        var type = this.rows[this.__end].type;
                        var g = this.rows[this.__end].group_index;

                        if (type > 0) {
                            end_ = this.groups[g - 1].last;
                        } else if (type < 0) {
                            end_ = this.groups[g].last;
                        } else {
                            end_ = this.rows[this.__end].list_index;
                        }

                    }

                    if (this.active_row > -1 && row_type > 0) {
                        if (this.groups[g].collapsed) {
                            this.expand_group(g);
                            start_ = g_focused_idx;
                        }
                    }

                    (start_ > -1 && end_ > -1) && this.select_range(start_, end_);

                }

                //window.SetCursor(this.row_drag ? 32651 : 32512);

                break;

            case "up":

                this.handles_sel = plman.GetPlaylistSelectedItems(g_active_pl);;
                var sel_total = this.handles_sel.Count;

                this.scrollbar.on_mouse("up", x, y);

                if (this.is_selecting) {
                    pl.on_mouse("move", x, y, mask);
                    this.is_selecting = false;
                }

                if (this.is_scrolling) {
                    this.stop_scrolling();
                }

                if (this.row_clicked) {

                    if (this.row_drag && !this.is_over_plman) {

                        if (this.active_row > -1) { 

                            var list_index; 

                            if (r.type > 0) {
                                list_index = this.groups[r.group_index].first;
                            } else if (r.type < 0) {
                                list_index = this.groups[r.group_index].last+1;
                            } else {
                                list_index = r.list_index;
                            }


                            if (sel_total > 1) {
                                var temp, odd, add;
                                var sel_ = [];

                                for (var i = 0; i < this.track_total; i++) {
                                    if (plman.IsPlaylistItemSelected(g_active_pl, i)) {
                                        sel_.push(i);
                                    }
                                }

                                for (var i = 0; i < this.track_total; i ++) {
                                    if (plman.IsPlaylistItemSelected(g_active_pl, i)) {
                                        if (temp && ((i - 1) != temp)) {
                                            odd = true;
                                            break;
                                        }
                                        temp = i;
                                    }
                                }

                                if (odd) {
                                    for (var i = 0; i < sel_.length; i++) {
                                        if (sel_[i] < list_index) {
                                            add = i + 1;
                                        }
                                    }
                                    plman.MovePlaylistSelection(g_active_pl, -this.track_total);
                                } else {
                                    for (var i = 0; i < sel_.length; i++) {
                                        if (sel_[i] == g_focused_idx) {
                                            add = i;
                                            break;
                                        }
                                    }
                                }

                            }

                            var __delta;

                            if (g_focused_idx > list_index) {
                                (sel_total > 1) ?  (odd ? __delta = list_index - add : __delta = -(g_focused_idx - list_index - add)) : __delta = -(g_focused_idx - list_index);
                            } else {
                                (sel_total > 1) ? (odd ? __delta = list_index - add : __delta = (list_index - g_focused_idx - (sel_total - add))) : __delta = (list_index - 1 - g_focused_idx);
                            }

                            if (!odd && plman.IsPlaylistItemSelected(g_active_pl, list_index)) __delta = 0;
                            plman.MovePlaylistSelection(g_active_pl, __delta);

                        }

                        if (!this.is_scrolling && y > this.rows[this.__end].y+this.row_height) {
                            plman.MovePlaylistSelection(g_active_pl, this.track_total - sel_total);
                        } else {
                            if (this.offset_y == 0 && y < this.list_y) {
                                plman.MovePlaylistSelection(g_active_pl, sel_total - this.track_total);
                            }
                        }

                    } else {

                        if (row_type == 0) {
                            plman.ClearPlaylistSelection(g_active_pl);
                            plman.SetPlaylistSelectionSingle(g_active_pl, r.list_index, true);
                            plman.SetPlaylistFocusItem(g_active_pl, r.list_index);
                        }

                    }

                }

                this.row_clicked = false;
                this.clicked_row = -1;
                this.row_drag = false;
                this.repaint();
                window.SetCursor(32512);
                plman.SetActivePlaylistContext();
                break;
            case "right":
                pl.on_mouse("leave", x, y, mask);
                if (this.row_drag) {
                    this.row_drag = false;
                    this.split_y = -1;
                    this.repaint();
                    window.SetCursor(32512);
                }

                if (this.is_hover_list) {

                    this.context_menu(x, y);

                } else if (this.is_hover_scrollbar) {

                    this.scrollbar.on_mouse("right", x, y);

                }
                break;
            case "wheel":
                this.scrollbar.on_mouse("wheel", x, y, mask);
                break;
            case "leave":
                this.is_selecting = false;
                this.row_clicked = false;
                break;
        }

    }

    this.select_group = function(g) {
        var indexes = [];
        var start = this.groups[g].first;
        var end = this.groups[g].last;
        for (var i = start; i <= end; i++) {
            indexes.push(i);
        }
        plman.SetPlaylistSelection(g_active_pl, indexes, true);
    }

    this.select_range = function(from, to) {
        var indexes = [];
        if (from > to) {
            var c = from;
            from = to;
            to = c;
        }

        for (var i = from; i <= to; i++) {
            indexes.push(i);
        }

        plman.ClearPlaylistSelection(g_active_pl);
        plman.SetPlaylistSelection(g_active_pl, indexes, true);
    }

    this.collapse_group = function(g) {
        if (!this.groups[g]) { return; }
        if (this.groups[g].collapsed) { return; }

        var before, total;

        for (var i = 0; i < this.total; i++) {

            if (this.rows[i].type > 0 && this.rows[i].group_index == g) {

                before = this.rows.slice(0, i + this.group_header_rows);
                total = Math.max(this.groups[g].last - this.groups[g].first + 1, properties.min_group_rows) + properties.extra_group_rows;
                this.rows = this.rows.slice(i + this.group_header_rows + total, this.rows.length);
                this.rows = before.concat(this.rows);
                break;

            }

        }

        this.groups[g].collapsed = true;

        this.offset_y2 = this.offset_y;
        this.on_load();

    }

    this.expand_group = function(g) {


        if (!this.groups[g]) return;
        if (!this.groups[g].collapsed) return;

        for (var i = 0; i < this.total; i++) {

            if (this.rows[i].type > 0 && this.rows[i].group_index == g) {

                var after = this.rows.slice(i + this.group_header_rows, this.rows.length);
                this.rows = this.rows.splice(0, i + this.group_header_rows);

                var row_index = i + this.group_header_rows;
                var end = this.groups[g].first + Math.max(this.groups[g].track_total, properties.min_group_rows) + properties.extra_group_rows;

                for (var j = this.groups[g].first; j < end; j++) {

                    this.rows[row_index] = {};

                    switch (true) {
                        case (j <= this.groups[g].last):
                            this.rows[row_index] = new Item(this.handles.Item(j), 0, j, g);
                            break;
                        case (j > this.groups[g].last && j < this.groups[g].first + properties.min_group_rows):
                            this.rows[row_index] = new Item(this.handles.Item(j), -1, null, g);
                            break;
                        default:
                            this.rows[row_index] = new Item(null, -2, null, g);
                            break;
                    }

                    row_index++;

                }

                this.rows = this.rows.concat(after);
                after = null;
                break;

            }

        }

        this.groups[g].collapsed = false;

        this.offset_y2 = this.offset_y;
        this.on_load();

    }

    this.start_scrolling = function(delta, callback) {


        if (!this.is_scrolling) {

            this_.scroll_timeout = window.SetTimeout(function() {
                this_.scroll_interval = window.SetInterval(function() {

                    this_.scrollbar.on_mouse("wheel", 0, 0, delta/3);
                    if (this_.offset_y == 0 || this_.offset_y + this_.list_h == this_.total_h) {
                        this_.stop_scrolling();
                    }
                    callback && callback();

                }, 50);

            }, 350);

            this.is_scrolling = true;

        }

    }

    this.stop_scrolling = function() {

        this.scroll_timeout && window.ClearTimeout(this.scroll_timeout);
        this.scroll_timeout = null;

        this.scroll_interval && window.ClearInterval(this.scroll_interval);
        this.scroll_interval = null;

        this.is_scrolling = false;

    }

    this.on_drag = function(event, x, y) {
    }

    this.context_menu = function (x, y) {

        var _menu = window.CreatePopupMenu();
        var _ce = window.CreatePopupMenu();
        var _pr = window.CreatePopupMenu();
        var Context = fb.CreateContextMenuManager();
        var ContextBaseID;

        this.handles_sel = plman.GetPlaylistSelectedItems(g_active_pl);;
        var has_sel = this.handles_sel.Count;
        if (has_sel) {
            Context.InitContext(this.handles_sel);
        }

        fb.IsPlaying && 
            _menu.AppendMenuItem(MF_STRING, 1, __("Show now playing"));
        if (this.total > 0 && properties.show_group_header) {
            _menu.AppendMenuItem(MF_STRING, 2, __("Refresh") + "\tF5");
        }

        if (fb.IsPlaying || properties.show_group_header && this.total > 0) {
            _menu.AppendMenuSeparator();
        }


        if (properties.show_group_header && this.total > 0) {

            _ce.AppendTo(_menu, MF_STRING | MF_POPUP, __("Collapse/Expand"));
            _ce.AppendMenuItem(MF_STRING, 10, __("Collapse all"));
            _ce.AppendMenuItem(MF_STRING, 11, __("Expand all"));

        }

        var _web = null;
        /*
        if (lang == "cn" && has_sel) {
            _web = window.CreatePopupMenu();
            _web.AppendTo(_menu, MF_STRING, __("Web"));
            _menu.AppendMenuSeparator();
            _web.AppendMenuItem(MF_STRING, 60, __("Search cover"));
        }
        */

        _pr.AppendTo(_menu, MF_STRING | MF_POPUP, __("Preferences"));

        var cmd = [
            __("Show group header"),
            __("Double line row"),
            __("Show focused row"),
            __("Auto collapse"),
            __("Show scrollbar"),
            __("Show play count"),
            __("Show rating"),
            __("Show track artist")
        ];

        for (var i = 20; i < 20+cmd.length; i++) {
            var flag = MF_STRING;
            if (i == 23 || properties.double_line && i == 27) {
                flag = MF_DISABLED;
            }
            _pr.AppendMenuItem(flag, i, cmd[i-20]);
            _pr.CheckMenuItem(i, window.GetProperty("pl: " + cmd[i-20]));
            if (i == 24) {
                _pr.AppendMenuSeparator();
            }
        }
        _pr.AppendMenuSeparator();
        _pr.AppendMenuItem(MF_STRING, 51, __("Show properties..."));
        _pr.AppendMenuItem(MF_STRING, 50, __("Show configure..."));

        _menu.AppendMenuSeparator();
        _menu.AppendMenuItem(has_sel ? MF_STRING : MF_DISABLED, 12, __("Cut") + "\tCtrl+X");
        _menu.AppendMenuItem(has_sel ? MF_STRING : MF_DISABLED, 13, __("Copy") + "\tCtrl+C");

        if (this.handles_clip) {
            _menu.AppendMenuItem(MF_STRING, 14, __("Paste") + "\tCtrl+V");
        }

        // ...
        
        ContextBaseID = 1000;
        if (has_sel) {
            _menu.AppendMenuSeparator();
            Context.BuildMenu(_menu, ContextBaseID, -1);
        }

        var ret = _menu.TrackPopupMenu(x, y);
        has_sel && Context.ExecuteByID(ret - ContextBaseID);

        switch (ret) {
            case 1:
                // Show now playing
                this.show_now_playing();
                break;
            case 2:
                // refresh cache
                image_cache = new ImageCache();
                window.Repaint();
                break;
            case 10:
                // collapse all
                var temp = properties.auto_collapse;
                properties.auto_collapse = true;
                this.init_list(function() {
                    properties.auto_collapse = temp;
                });
                break;
            case 11:
                // expand all
                var temp = properties.auto_collapse;
                properties.auto_collapse = false;
                this.init_list(function() {
                    properties.auto_collapse = temp;
                });
                break;
            case 12:
                this.cut();
                break;
            case 13:
                this.copy();
                break;
            case 14:
                this.paste();
                break;
            case 20:
                properties.show_group_header = !properties.show_group_header;
                window.SetProperty("pl: " + cmd[0], properties.show_group_header);
                image_cache = new ImageCache();
                this.init_list();
                break;
            case 24:
                properties.show_scrollbar = !properties.show_scrollbar;
                window.SetProperty("pl: " + cmd[4], properties.show_scrollbar);
                this.on_size();
                this.repaint();
                break;
            case 22:
                properties.show_focus_row = !properties.show_focus_row;
                window.SetProperty("pl: " + cmd[2], properties.show_focus_row);
                this.repaint();
                break;
            case 21:
                properties.double_line = !properties.double_line;
                window.SetProperty("pl: " + cmd[1], properties.double_line);
                this.get_row_height();
                this.group_header_rows = Math.round(zoom(88, g_dpi)/this.row_height);
                image_cache = new ImageCache();
                this.init_list();
                break;
            case 23:
                properties.auto_collapse = !properties.auto_collapse;
                window.SetProperty("pl: " + cmd[3], properties.auto_collapse);
                this.init_list();
                break;
            case 25:
                properties.show_playcount = !properties.show_playcount;
                window.SetProperty("pl: " + cmd[5], properties.show_playcount);
                this.repaint();
                break;
            case 26:
                properties.show_rating = !properties.show_rating;
                window.SetProperty("pl: " + cmd[6], properties.show_rating);
                this.repaint();
                break;
            case 27:
                properties.show_track_artist = !properties.show_track_artist;
                window.SetProperty("pl: " + cmd[7], properties.show_track_artist);
                this.repaint();
                break;
            case 50:
                window.ShowConfigure();
                break;
            case 51:
                window.ShowProperties();
                break;
            case 60:
                window.NotifyOthers("Show_search_cover_panel", [true, this.handles_sel]);
                break;
                
        }

        _menu.Dispose();
        _pr.Dispose();
        _ce.Dispose();

    }

    this.getAlbumIdfromTrackId = function(list_index) {
        if (list_index < -1) {
            return -1;
        } else {
            var middle = 0, deb = 0, fin = this.groups.length - 1;
            while (deb <= fin) {
                middle = Math.floor((fin + deb) / 2);
                if (list_index >= this.groups[middle].first && list_index <= this.groups[middle].last) {
                    return middle;
                } else if (list_index < this.groups[middle].first) {
                    fin = middle - 1;
                } else {
                    deb = middle + 1;
                }
            }
            return -1;
        }
    }

    this.get_focused_row = function() {

        var row_idx = 0;
        var focused_album = this.getAlbumIdfromTrackId(g_focused_idx);

        for (var i = 0; i < this.total; i++) {
            if (this.rows[i].type > 0 && this.rows[i].group_index == focused_album) {
                if (this.groups[focused_album].collapsed) {
                    row_idx = i;
                    break;
                }
            } 
            else if (this.rows[i].type == 0 && this.rows[i].group_index == focused_album) {
                var albumTrackId = g_focused_idx - this.groups[focused_album].first;
                row_idx = i + albumTrackId;
                break;
            }
        }
        return row_idx;

    }

    this.get_row_by_track_index = function(list_index) {

        var row_idx = 0;
        var focused_album = this.getAlbumIdfromTrackId(list_index);

        for (var i = 0; i < this.total; i++) {
            if (this.rows[i].type > 0 && this.rows[i].group_index == focused_album) {
                if (this.groups[focused_album].collapsed) {
                    row_idx = i;
                    break;
                }
            } 
            else if (this.rows[i].type == 0 && this.rows[i].group_index == focused_album) {
                var albumTrackId = list_index - this.groups[focused_album].first;
                row_idx = i + albumTrackId;
                break;
            }
        }
        return row_idx;

    }

    this.show_focused_item = function() {

        if (this.total <= 0) {
            return;
        }
        
        if (this.total_h > this.list_h) {
            var center_row = Math.floor((this.__start + this.__end) / 2);
            var offset = (this.get_row_by_track_index(g_focused_idx) - center_row + 1) * this.row_height;
            this.scrollbar.step_offset(-offset);
            this.repaint();
        }

    }


    this.show_now_playing = function () {

        if (g_avoid_show_now_playing) {
            g_avoid_show_now_playing = false;
            return;
        }

        if (!fb.IsPlaying) {
            return;
        }

        try {
            var playing_track = plman.GetPlayingItemLocation();

            if (playing_track.IsValid) {

                if (plman.PlayingPlaylist != g_active_pl) {
                    this.load = false;
                    g_active_pl = plman.ActivePlaylist = plman.PlayingPlaylist;
                }

                if (this.load) {
                    //g_focused_idx = playing_track.PlaylistItemIndex;
                    var playing_idx = playing_track.PlaylistItemIndex;
                    var playing_group = this.getAlbumIdfromTrackId(g_focused_idx);

                    plman.ClearPlaylistSelection(g_active_pl);
                    plman.SetPlaylistSelectionSingle(g_active_pl, playing_idx, true);
                    plman.SetPlaylistFocusItem(g_active_pl, playing_idx);
                    g_focused_idx = playing_idx;

                    this.expand_group(playing_group);
                    this.show_focused_item();

                } else {

                    this.show_now_playing();

                }
            }
        } catch (e) {};
    }

    this.cut = function () {
        this.copy();
        plman.RemovePlaylistSelection(g_active_pl);
    }

    this.copy = function() {
        this.handles_clip = plman.GetPlaylistSelectedItems(g_active_pl);
    }

    this.paste = function() {
        if (!this.handles_clip) return;
        var count = this.handles_clip.Count;
        if (count) {
            if (plman.GetPlaylistSelectedItems(g_active_pl).Count > 0) {
                plman.ClearPlaylistSelection(g_active_pl);
                plman.InsertPlaylistItems(g_active_pl, g_focused_idx,this.handles_clip, true);
            } else {
                plman.InsertPlaylistItems(g_active_pl, plman.PlaylistCount, this.handles_clip, true);
            }
            this.handles_clip = null;
        }
    }


    this.init_list();

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
}

function set_buttons() {
    bt = [];
    bt[0] = new Button(images.add, function(x, y) {
        add_menu(x, y);
    }, __("Add items"));
    bt[1] = new Button(images.sort, function(x, y) {
        sort_menu(x, y);
    }, __("Sort"));
    bt[2] = new Button(images.rat, function() {
        toggle_show_rating();
    }, __("Toggle show rating"));

    bt[3] = new Button(images.plman, function() {
        toggle_show_plmanager();
    // TODO:
    //}, __("Toggle show playlist manager"));
    });
    bt[4] = new Button(images.go2, function() {
        fb.RunMainMenuCommand(__("View/Playlist Manager"));
    }, __("View default playlist manager"));
}

function update_buttons_image () {
    bt[0].update_img(images.add);
    bt[1].update_img(images.sort);
    bt[2].update_img(images.rat);
    bt[3].update_img(images.plman);
    bt[4].update_img(images.go2);
}

function toggle_show_rating() {
    properties.show_rating = !properties.show_rating;
    pl.repaint();
    window.SetProperty("pl: " + __("Show rating"), properties.show_rating);
}


function add_menu(x, y) {

	bt[0].state = 2;

	var _menu = window.CreatePopupMenu();
	var id = 1;
	var cmd = [__("Add files..."), __("Add folder..."), __("Add location...")];
	_menu.AppendMenuItem(MF_STRING, id++, cmd[0]);
	_menu.AppendMenuItem(MF_STRING, id++, cmd[1]);
	_menu.AppendMenuItem(MF_STRING, id++, cmd[2]);

	var ret = _menu.TrackPopupMenu(x, y);

    switch (ret) {
        case 1:
            fb.AddFiles();
            break;
        case 2:
            fb.AddDirectory();
            break;
        case 3:
            fb.RunMainMenuCommand(__("File/") + cmd[2]);
            break;
    }
	_menu.Dispose();

	bt[0].reset();

}

function sort_menu(x, y) {

    bt[1].state = 2;

    var _menu = window.CreatePopupMenu();
    _menu.AppendMenuItem(MF_STRING, 1, __("Sort by..."));
    _menu.AppendMenuItem(MF_STRING, 2, __("Randomize"));
    _menu.AppendMenuItem(MF_STRING, 20, __("Reverse"));
    _menu.AppendMenuItem(MF_STRING, 3, __("Sort by album"));
    _menu.AppendMenuItem(MF_STRING, 4, __("Sort by artist"));
    _menu.AppendMenuItem(MF_STRING, 5, __("Sort by path"));
    _menu.AppendMenuItem(MF_STRING, 6, __("Sort by rating"));
    _menu.AppendMenuSeparator();

    var handles_sel = plman.GetPlaylistSelectedItems(g_active_pl);
    var has_sel = handles_sel.Count;
    _sel = window.CreatePopupMenu();
    _sel.AppendTo(_menu, has_sel ?  MF_STRING : MF_DISABLED, __("Selection"));
    _sel.AppendMenuItem(MF_STRING, 10, __("Sort by..."));
    _sel.AppendMenuItem(MF_STRING, 11, __("Randomize"));
    _sel.AppendMenuItem(MF_STRING, 21, __("Reverse"));
    _sel.AppendMenuItem(MF_STRING, 12, __("Sort by album"));
    _sel.AppendMenuItem(MF_STRING, 13, __("Sort by artist"));
    _sel.AppendMenuItem(MF_STRING, 14, __("Sort by path"));
    _sel.AppendMenuItem(MF_STRING, 15, __("Sort by rating"));

    var id = _menu.TrackPopupMenu(x, y);
    var patterns = [ 
        "", 
        "%album%-%discnumber%-%tracknumber%", 
        "%album artist%-%album%-%discnumber%-%tracknumber%",
        "%path%-%subsong%", 
        "$sub(10,$if2(%rating%,0))"
    ];
    switch (true) {
        case (id == 1): 
            fb.RunMainMenuCommand(__("Edit/Sort/Sort by..."));
            break;
        case (id >= 2 && id <= 6):
            plman.SortByFormat(g_active_pl, patterns[id-2], false);
            break;
        case (id == 10): 
            fb.RunMainMenuCommand(__("Edit/Selection/Sort/Sort by..."));
            break;
        case (id >= 11 && id <= 15):
            plman.SortByFormat(g_active_pl, patterns[id-11], true);
            break;
        case (id == 20):
            fb.RunMainMenuCommand(__("Edit/Sort/Reverse"));
            break;
        case (id == 21):
            fb.RunMainMenuCommand(__("Edit/Selection/Sort/Reverse"));
            break;
    }

    _menu.Dispose();

    bt[1].reset();
}




get_fonts();
get_colors();
get_button_images();
set_buttons();

pl = new Playlist();
plm = new PlManager();
get_images();
image_cache = new ImageCache();

window.DlgCode = DLGC_WANTALLKEYS;

var z320 = zoom(320, g_dpi);
var z20 = zoom(20, g_dpi);
var z4 = zoom(4, g_dpi);
var z60 = zoom(60, g_dpi);
var z240 = zoom(240, g_dpi);
var z225 = zoom(225, g_dpi);
var z15 = zoom(15, g_dpi);

function on_size() {

    ww = Math.max(z320, window.Width);
    wh = window.Height;

    pl.set_size(0, properties.toolbar_height, ww, wh - properties.toolbar_height);

    if (plm.visible) {
        var rows = Math.min(Math.round((wh - z60) / plm.row_height), plm.playlist.length + 2);
        plm.set_size(ww-z240, properties.toolbar_height + z5, z225, rows * plm.row_height);
    }

    var bx = z15, by = (properties.toolbar_height - z25) / 2;
    for (var i = 0; i < 3; i++) {
        bt[i].set_xy(bx, by);
        bx += (bt[i].w + z4);
    }

}


var z10 = zoom(10, g_dpi);
var z25 = zoom(25, g_dpi);

function on_paint(gr) {

    // Bg
    gr.FillSolidRect(0, 0, ww, wh, g_colors.bg_normal);

    // Playlist
    pl.draw(gr);
    gr.FillSolidRect(0, properties.toolbar_height - 1, ww, 1, g_colors.txt_normal & 0x19ffffff);
    //gr.FillGradRect(0, wh-pl.row_height/2, ww, pl.row_height/2, 90, 0, g_colors.bg_normal, 1);

    // Plman
    if (plm.visible) {
        plm.draw(gr);
    }

    // Btns
    for (var i = 0; i < 3; i++) {
        bt[i].draw(gr);
    }
    // Pl info
    var txt, txt_w, txt_x;
    var p = z10;

    txt = ", " + pl.track_total + (pl.track_total > 1 ?__(" tracks") : __(" track"));
    txt_w = gr.CalcTextWidth(txt, g_fonts.info_header);
    txt_x = pl.list_x+pl.list_w - txt_w - 10;
    gr.GdiDrawText(txt, g_fonts.info_header, g_colors.txt_normal, txt_x, 0, txt_w, properties.toolbar_height, DT_CC);

    var txt_x2 = Math.max(txt_x - gr.CalcTextWidth(pl.list_name, g_fonts.info_header), bt[2].x + bt[2].w + bt[3].w + z10);
    gr.GdiDrawText(pl.list_name, g_fonts.info_header, g_colors.txt_normal, txt_x2, 0, txt_x - txt_x2, properties.toolbar_height, DT_CC); 

    bt[3].x = Math.max(txt_x2 - bt[3].w-z5, bt[2].x + bt[2].w + z4);
    bt[3].y = bt[2].y;
    bt[3].draw(gr);

    if (plm.visible && plm.h >= plm.row_height * 2) {
        var mid_x = bt[3].x + bt[3].w / 2;
        var pt_arr = [mid_x, bt[3].y+bt[3].h-z2, mid_x-z4*2, plm.y+z1, mid_x+z4*2, plm.y+z1];
        gr.FillPolygon(g_colors.bg_normal, 0, pt_arr);
        gr.SetSmoothingMode(4);
        var line_color = blendColors(g_colors.bg_normal, g_colors.txt_normal, 0.2);
        gr.DrawLine(pt_arr[0], pt_arr[1], pt_arr[2], pt_arr[3], 1, line_color);
        gr.DrawLine(pt_arr[0], pt_arr[1], pt_arr[4], pt_arr[5], 1, line_color);
        gr.SetSmoothingMode(0);

        bt[4].draw(gr);
    } else {
        bt[4].x = -100;
    }

}


function on_mouse_move(x, y) {

    mouse_x = x;
    mouse_y = y;

    pl.on_mouse("move", x, y);

    if (plm.visible) {
       plm.on_mouse("move", x, y);
    }

    for (var i = 0; i < bt.length; i++) {
        bt[i].check_state("move", x, y);
    }

    if (pl.row_drag || plm.drag_id > -1) {
        window.SetCursor(32651);
    } else {
        window.SetCursor(32512);
    }

}

function on_mouse_lbtn_down(x, y, mask) {
    
    if (plm.visible && plm.is_hover) {
        plm.on_mouse("down", x, y, mask);
    } else {
        pl.on_mouse("down", x, y, mask);
    }

    for (var i = 0; i < bt.length; i++) {
        bt[i].check_state("down", x, y);
    }
}

function on_mouse_lbtn_dblclk(x, y, mask) {

    if (plm.visible && plm.is_hover) {
        plm.on_mouse("dblclk", x, y, mask);
    } else {
        pl.on_mouse("dblclk", x, y, mask);
    }

    for (var i = 0; i < bt.length; i++) {
        bt[i].check_state("down", x, y);
    }
}

function on_mouse_lbtn_up(x, y, mask) {

    plm.on_mouse("up", x, y, mask);

    pl.on_mouse("up", x, y, mask);

    for (var i = 0; i < bt.length; i++) {
        if (bt[i].check_state("up", x, y) == 1) {
            bt[i].on_click(bt[i].x, bt[i].y+bt[i].h);
        }
    }
}

function on_mouse_rbtn_down(x, y, mask) {
    if (utils.IsKeyPressed(VK_CONTROL) || utils.IsKeyPressed(VK_SHIFT)) {
        return;
    }

    if (plm.visible && plm.is_hover) {
        // ...
    } else if (pl.is_hover_list) {
        pl.on_mouse("down", x, y, mask);
    }
}

function on_mouse_rbtn_up(x, y, mask) {
    if (utils.IsKeyPressed(VK_SHIFT)) {
        return false;
    } else {
        if (plm.visible && plm.is_hover) {
            plm.on_mouse("right", x, y, mask);
        } else {
            pl.on_mouse("right", x, y, mask);
        }
        return true;
    }
}

function on_mouse_wheel(step) {

    if (plm.visible && plm.is_hover) {
        plm.on_mouse("wheel", mouse_x, mouse_y, step);
    } else {
        pl.on_mouse("wheel", mouse_x, mouse_y, step);
    }

}

function on_mouse_leave() {
    pl.scrollbar.on_mouse("leave", 0, 0);
    for (var i = 0; i < bt.length; i++) {
        if (bt[i].state == 1) {
            bt[i].reset();
        }
    }
}

//// drag&drop callbacks

function on_drag_drop (action, x, y, mask) {

    var idx;

    if (!fb.PlaylistCount) {
        idx = plman.CreatePlaylist(0, __("Default"));
        plman.ActivePlaylist = 0;
    } else {
        plman.ClearPlaylistSelection(g_active_pl);
        idx = g_active_pl;
    }

    if (idx != undefined) {
        action.ToPlaylist();
        action.Playlist = idx;
        action.ToSelect = true;
    }

}

function on_drag_enter(action, x, y, mask) {
}

function on_drag_leave() {
}

function on_drag_over(action, x, y, mask) {
}

//// Playlist callback

function check_active_playlist() {
    if (g_active_pl > plman.PlaylistCount - 1) {
        g_active_pl = plman.PlaylistCount - 1;
    }
    if (g_active_pl < 0) {
        g_active_pl = 0;
    }
}

function on_playlists_changed() {

    // Pl
    check_active_playlist();

    if (g_active_pl != plman.ActivePlaylist) {
        g_active_pl = plman.ActivePlaylist;
        pl.init_list();
    }
    pl.list_name = plman.GetPlaylistName(g_active_pl);

    // Plman
    plm.load_list();
    on_size();
}

function on_playlist_switch() {

    g_active_pl = plman.ActivePlaylist;
    check_active_playlist();
    pl.offset_y = 0;
    pl.init_list();
    g_focused_idx = plman.GetPlaylistFocusItemIndex(g_active_pl);

    if (fb.PlayingPlaylist == fb.ActivePlaylist) {
        pl.show_now_playing();
    }

}

function on_playlist_items_reordered(playlist) {
    if (playlist != g_active_pl) {
        return;
    }
    g_focused_idx = plman.GetPlaylistFocusItemIndex(g_active_pl);
    var offset_y = pl.offset_y;
    pl.init_list(function() {
        pl.offset_y = offset_y;
        pl.repaint();
    });
}

function on_playlist_items_removed(playlist) {
    // pl
    on_playlist_items_reordered(playlist);
    // plm
    plm.load_list();
    on_size();
}

function on_playlist_items_added(playlist) {
    // pl
    on_playlist_items_reordered(playlist);
    // plm
    plm.load_list();
    on_size();
}


function on_playlist_items_selection_change() {
    pl.repaint();
}

function on_item_selection_change() {
    pl.repaint();
}

function on_item_focus_change(playlist, from, to) {
    //g_focused_idx = to;
    g_focused_idx = plman.GetPlaylistFocusItemIndex(g_active_pl);
    pl.repaint();
}


//// Playback callbacks

function on_playback_pause(state) {
    pl.repaint();
}

function on_playback_edited(metadb) {
    pl.repaint();
}

function on_playback_new_track(metadb) {

    if (properties.cursor_follow_playback) {
        pl.show_now_playing();
    }

    pl.repaint();

}

function on_playback_starting(cmd, is_paused) {

    if (cmd == 4) {
        g_avoid_show_now_playing = true;
    }

}

function on_playback_stop(reason) {
    if (reason != 2) {
        pl.repaint();
    }
}

function on_playback_queue_changed() {
    pl.repaint();
}

//// Key map settings

function on_key_up(vkey) {
    if (pl.is_scrolling){ 
        pl.is_scrolling = false;
        pl.repaint();
    }
}

function on_key_down(vkey) {

    var mask = GetKeyboardMask();

    if (plm.inputboxID > -1) {
        //if (mask == KMask.none) {
        switch (vkey) {
            case VK_ESCAPE:
            case 222:
                plm.inputboxID = -1;
                window.Repaint();
                break;
            default:
                plm.inputbox.on_key_down(vkey);
                break;
        }
        //}
    } else {

        // Playlist key event
        var is_ctrl_pressed = utils.IsKeyPressed(VK_CONTROL);
        var is_shift_pressed = utils.IsKeyPressed(VK_SHIFT);

        switch (vkey) {
            case VK_UP:

                if (g_focused_idx == 0) {
                    pl.show_focused_item();
                    return;;
                }

                //if (!is_ctrl_pressed && !is_shift_pressed) {
                plman.ClearPlaylistSelection(g_active_pl);
                //}
                g_focused_idx--;
                plman.SetPlaylistSelectionSingle(g_active_pl, g_focused_idx, true);
                plman.SetPlaylistFocusItem(g_active_pl, g_focused_idx);

                pl.is_scrolling = true;
                //if (g_focused_idx <= pl.rows[pl.__start].list_index || g_focused_idx >= pl.rows[pl.__end].list_index) {
                if (pl.focus_track == -1) {
                    pl.show_focused_item();
                }
                //}

                break;
            case VK_DOWN:
                if (g_focused_idx == pl.track_total -1) {
                    pl.show_focused_item();
                    return;
                }
                //if (!is_ctrl_pressed && !is_shift_pressed) {
                plman.ClearPlaylistSelection(g_active_pl);
                //}
                g_focused_idx++;
                plman.SetPlaylistSelectionSingle(g_active_pl, g_focused_idx, true);
                plman.SetPlaylistFocusItem(g_active_pl, g_focused_idx);

                pl.is_scrolling = true;
                //if (g_focused_idx <= pl.rows[pl.__start].list_index || g_focused_idx >= pl.rows[pl.__end].list_index) {;
                if (pl.focus_track == -1) {
                    pl.show_focused_item();
                }
                //}

                break;
            case VK_PRIOR:
                // Page up
                pl.is_scrolling = true;
                pl.scrollbar.step_offset(pl.list_h);
                pl.repaint();
                break;
            case VK_NEXT:
                // Page down
                pl.is_scrolling = true;
                pl.scrollbar.step_offset(-pl.list_h);
                pl.repaint();
                break;

            case VK_DELETE:
                plman.RemovePlaylistSelection(g_active_pl, false);
                break;
            case VK_RETURN:
                plman.ExecutePlaylistDefaultAction(g_active_pl, g_focused_idx);
                break;
            case VK_HOME:
                plman.ClearPlaylistSelection(g_active_pl);
                plman.SetPlaylistSelectionSingle(g_active_pl, 0, true);
                plman.SetPlaylistFocusItem(g_active_pl, 0);
                pl.scrollbar.step_offset(pl.total_h);
                break;
            case VK_END:
                plman.ClearPlaylistSelection(g_active_pl);
                plman.SetPlaylistSelectionSingle(g_active_pl, pl.track_total-1, true);
                plman.SetPlaylistFocusItem(g_active_pl, pl.track_total-1);
                pl.scrollbar.step_offset(-pl.total_h);
            case VK_F5:
                image_cache = new ImageCache();
                CollectGarbage();
                pl.repaint();
                break;
            case VK_ESCAPE:
                if (plm.visible) {
                    toggle_show_plmanager();
                }
                break;
            case VK_KEY_X:
                pl.cut();
                break;
            case VK_KEY_C:
                pl.copy();
                break;
            case VK_KEY_V:
                pl.paste();
                break;
            case VK_KEY_A:
                is_ctrl_pressed && pl.select_range(0, pl.track_total-1);
                break;
            case VK_KEY_N:
                is_ctrl_pressed && plman.CreatePlaylist(plman.PlaylistCount, "");
                break;
            case VK_KEY_W:
                is_ctrl_pressed && plman.RemovePlaylist(plman.ActivePlaylist);
                break;
            case VK_KEY_P:
                is_ctrl_pressed && fb.ShowPreferences("0E966267-7DFB-433B-A07C-3F8CDD31A258");
                break;
            case VK_KEY_O:
                is_ctrl_pressed && fb.AddFiles();
                break;
            case VK_KEY_S:
                is_ctrl_pressed && fb.SavePlaylist();
                break;
        }

        if (properties.vim_style_key_binding) {

            switch (vkey) {
                case VK_KEY_J:
                    on_key_down(VK_DOWN);
                    break;
                case VK_KEY_K:
                    on_key_down(VK_UP);
                    break;
                case VK_KEY_H:
                    if (plman.ActivePlaylist > 0 && fb.PlaylistCount > 1) {
                        plman.ActivePlaylist--;
                    }
                    break;
                case VK_KEY_L:
                    if (plman.ActivePlaylist + 1 < fb.PlaylistCount) {
                        plman.ActivePlaylist++;
                    }
                    break;
                case VK_KEY_F:
                    is_ctrl_pressed && on_key_down(VK_NEXT);
                    break;
                case VK_KEY_B:
                    is_ctrl_pressed && on_key_down(VK_PRIOR);
                    break;
                case VK_KEY_G:
                    if (is_shift_pressed) {
                        on_key_down(VK_END);
                    } else {
                        if (pl.__ktimer) {
                            on_key_down(VK_HOME);
                            window.ClearTimeout(pl.__ktimer);
                            pl.__ktimer = false;
                        } else {
                            pl.__ktimer = window.SetTimeout(function() {
                                window.ClearTimeout(pl.__ktimer);
                                pl.__ktimer = false;
                            }, 300);
                        }
                    }
                    break;
            }

        }

    }

}

function on_char(code) {
    if (plm.inputboxID > -1) {
        plm.inputbox.on_char(code);
    }
}

function on_focus(is_focused) {
    if (plm.inputboxID > -1) {
        plm.inputbox.on_focus(is_focused);
    }
    if (!is_focused) {
        plm.inputboxID = -1;
        window.Repaint();
    }
    if (properties.auto_hide_plmanager && plm.visible && !is_focused) {
        toggle_show_plmanager();
    }
}


////

function on_cursor_follow_playback_changed(state) {

    properties.cursor_follow_playback = is_cursor_follow_playback();

}

function on_metadb_changed(handles, fromhook) {
    pl.repaint();
}

function on_colors_changed() {
    get_colors();
    get_images();
    get_button_images();
    update_buttons_image();
    image_cache = new ImageCache();
    window.Repaint();
}

function on_font_changed () {
    get_fonts();
    plm.load_fonts();
    window.Repaint();
}

function on_notify_data(name, info) {
    switch (name) {
        case "Reload script":
            if (window.IsVisible) {
                window.Reload();
            }
            break;
        case "Switch color scheme":
            g_color_scheme = info;
            window.SetProperty(__("Color scheme(0: SYS, 1: LIGHT, 2: DARK, 3: USER)"), g_color_scheme); 
            on_colors_changed();
            break;
        case "Show now playing":
            pl.show_now_playing();
            break;
        case "Refresh Cover":
            image_cache = new ImageCache();
            window.Repaint();
            break;
        case "Drag enter files":
            pl.scrollbar.step_offset(-pl.total_h);
            window.Repaint();
            break;

    }
}


// -----------------END------------------------------------------------------------------

