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
}

var p = new UserPanel();

addEventListener("on_size", function () {
    ww = Math.max(window.Width, ui.min_width);
    wh = window.Height;
    p.showPanels(p.vis_pid);
}, true);

addEventListener("on_paint", function (gr) {
    // bg
    gr.FillSolidRect(0, 0, ww, wh, ui.backcol);
    gr.DrawLine(0, ui.toolbar_h-1, ww, ui.toolbar_h-1, 1, ui.textcol & 0x20ffffff);
}, true);



