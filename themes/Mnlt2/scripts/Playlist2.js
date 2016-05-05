// vim:set ft=javascript bomb et:

var DT_LT = DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var DT_LC = DT_LT | DT_VCENTER | DT_LT;
var DT_RC = DT_RIGHT | DT_VCENTER | DT_LT;
var DT_CC = DT_CENTER | DT_VCENTER | DT_LT;

var tf_group = fb.TitleFormat("%abum artist%|||%album%|||%discnumber%");
//var tf_group_header = fb.TitleFormat("%album%|||$if2(%album artist%," + __("Unknown artist") +　")[ \/ %genre%][ \/ %date% ]");
var tf_track = fb.TitleFormat("$if2(%tracknumber%,-)|||%title%|||%track artist%|||[%play_count%]|||[%length%]|||%rating%");
var tf_rating = fb.TitleFormat("%rating%");



var ww, wh;

var repaint_ = false,
	repaint_main = false;



function on_size() {
	ww = window.Width;
	wh = window.Height;
}


function on_paint(gr) {
	repaint_ = false;
	!window.IsTransparent && gr.FillSolidRect(0, 0, ww, wh, 0xff888888);
	if (repaint_main) {
		repaint_main = false;
		var index = 0, 
			j = 0,
			start_ = 0,
			end_ = 0;

}

