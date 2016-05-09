// ==PREPROCESSOR==
// @import "%fb2k_profile_path%skins\Mnlt2\common\common4.js"

// @import "%fb2k_profile_path%skins\Mnlt2\WSH-Splitter\Common.js"
// @import "%fb2k_profile_path%skins\Mnlt2\WSH-Splitter\WSH Splitter.js"

// @import "%fb2k_profile_path%skins\Mnlt2\scripts\Splitter_Tabs2.js"
// ==/PREPROCESSOR==


var UserInterface = function () {

    this.dui = window.InstanceType;
    this.font;
    this.textcol;
    this.backcol;
    this.use_custom_col = window.GetProperty("Use custom color", false);

    this.getColors = function () {
        this.textcol = eval(window.GetProperty("Color text", "RGB(30, 30, 30)"));
        this.backcol = eval(window.GetProperty("Color background", "RGB(255, 255, 255)"));
        this.highcol = eval(window.GetProperty("Color highlight", "RGB(215, 65, 100)"));
        if (!this.use_custom_col) {
            if (this.dui) {
                this.textcol = window.GetColorDUI(ColorTypeDUI.text);
                this.backcol = window.GetColorDUI(ColorTypeDUI.background);
                this.highlight = window.GetColorDUI(ColorTypeDUI.highlight);
            } else {
                this.textcol = window.GetColorCUI(ColorTypeCUI.text);
                this.backcol = window.GetColorCUI(ColorTypeCUI.background);
                this.highlight = window.GetColorCUI(ColorTypeCUI.active_item_frame);
            }
        }
    }
    this.getColors();

    this.getFont = function() {
        if (this.dui) {
            this.font = window.GetFontDUI(0);
        } else {
            this.font = window.GetFontCUI(1);
        }
        try {
            this.font.Name;
            this.font.Size;
            this.font.Style;
        } catch (e) {
            this.font = gdi.Font("Segoe UI", 14, 0);
            console("Cant use default font, use `Segoe ui' instead");
        }

        this.font_t = gdi.Font(this.font.Name, 13, 0);
    }
    this.getFont();

    this.toolbar_h = 46;
    this.min_width = 320;
};

var ui = new UserInterface();

addEventListener("on_colors_changed", function () {
    ui.getColors();
    window.Repaint();
}, true);

addEventListener("on_font_changed", function () {
    ui.getFont();
    window.Repaint();
}, true);


var UserPanel = function () {

    this.vis_pid = window.GetProperty("Visible panel idx", 0);
    this.total_tabs = 4;

    this.loadPanels = function() {
        // first wshmp idx
        var start = 3;
        $Splitter.CreatePanel(PanelClassNames.WSHMP, start, true); // 0,
        //$Splitter.CreatePanel(PanelClassNames.WSHMP, 2, true), //1,
        $Splitter.CreatePanel(PanelClassNames.PSS, 4, true); //1
        $Splitter.CreatePanel(PanelClassNames.WSHMP, start+2, true); //2,
        $Splitter.CreatePanel(PanelClassNames.WSHMP, start+3, true); //3,
    }
    this.loadPanels();

    this.showPanels = function (idx) {
        // tab panels
        for (var i = 0; i < this.total_tabs; i++) {
            if (i == idx) {
                $Splitter.ShowPanel(i, 1);
                $Splitter.MovePanel(i, 0, ui.toolbar_h, ww, wh - ui.toolbar_h);
            } else {
                $Splitter.ShowPanel(i, 0);
            }
        }
        // other panels if ...
        // ...
    }

    this.lt = DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
    this.lc = this.lt | DT_VCENTER;
    this.cc = this.lc | DT_CENTER;
}

var p = new UserPanel();

var Tab = Button;

Tab.prototype.draw = function(gr, text, font, x, y, w, h) {
    var col = blendColors(ui.textcol, ui.backcol, 0.3);
    var char_arr;

    if (this.state == 1) {
        col = blendColors(ui.textcol, ui.backcol, 0.5);
    } else if (this.state == 2) {
        col = ui.highcol;
    }

    char_arr = gr.GdiDrawText(text, font, col, x, y, w, h, p.cc);
    char_arr = char_arr.toArray();

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

p.tabs = [];
p.tab_txt = ["列表", "歌词", "简介", "媒体库"];
p.tabs[0] = new Tab(function() {
    p.vis_pid = 0;
    p.showPanels(0);
    window.SetProperty("Visible panel idx", 0);
});
p.tabs[1] = new Tab(function () {
    p.vis_pid = 1;
    p.showPanels(1);
    window.SetProperty("Visible panel idx", 1);
});

p.tabs[2] = new Tab(function () {
    p.vis_pid = 2;
    p.showPanels(2);
    window.SetProperty("Visible panel idx", 2);
});

p.tabs[3] = new Tab(function () {
    p.vis_pid = 3;
    p.showPanels(3);
    window.SetProperty("Visible panel idx", 3);
});


addEventListener("on_size", function () {
    ww = Math.max(window.Width, ui.min_width);
    wh = window.Height;
    p.showPanels(p.vis_pid);
}, true);

addEventListener("on_paint", function (gr) {
    // bg
    gr.FillSolidRect(0, 0, ww, wh, ui.backcol);
    gr.DrawLine(0, ui.toolbar_h-1, ww, ui.toolbar_h-1, 1, ui.textcol & 0x20ffffff);

    gr.SetSmoothingMode(4);
    //gr.DrawRoundRect(15, (ui.toolbar_h-22)/2, 110, 22, 5, 5, 1, ui.textcol & 0x30ffffff);
    gr.SetSmoothingMode(0);

    var b_x = 20, b_y = (ui.toolbar_h - 22)/2, b_w;
    var b_t = p.tab_txt;

    for (var i = 0; i < b_t.length; i++) {
        b_w = gr.CalcTextWidth(b_t[i], ui.font_t);
        p.tabs[i].draw(gr, b_t[i], ui.font_t, b_x, b_y, b_w, 22);
        b_x += b_w + 40;
    }

}, true);

addEventListener("on_mouse_move", function (x, y) {
    p.tabs.forEach(function(bt) {
        bt.move(x, y);
    });
});

addEventListener("on_mouse_lbtn_down", function (x, y, mask) {
    p.tabs.forEach(function(bt) {
        bt.down(x, y);
    })
});

addEventListener("on_mouse_lbtn_up", function (x, y, mask) {
    /*
    p.tabs.forEach(function (bt) {
        if (bt.up(x, y)) {
            bt.on_click(x, y);
            console("triiger");
            return true;
        }
    });
    */
    for (var i = 0; i < p.total_tabs; i++) {
        if (p.tabs[i].up(x, y)) {
            p.tabs[i].on_click();
            break;
        }
    }
});

