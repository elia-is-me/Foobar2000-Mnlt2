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


var DT_LT = DT_CALCRECT | DT_END_ELLIPSIS | DT_NOPREFIX;
var DT_LC = DT_LT | DT_VCENTER | DT_LT;
var DT_RC = DT_RIGHT | DT_VCENTER | DT_LT;
var DT_CC = DT_CENTER | DT_VCENTER | DT_LT;

var time_f = fb.CreateProfiler("time_f"),
    time_s = fb.CreateProfiler("time_s"),
    time_r = fb.CreateProfiler("time_r"),
    time_h = fb.CreateProfiler(),
    time_scroll = fb.CreateProfiler("Time delay paint");


