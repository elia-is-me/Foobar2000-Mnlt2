function is_item_filtered(tf)
{
    if (tf.Eval("$meta(ESLYRICS)").toLowerCase() == "no-lyric") {
        return true;
    }
	return false;
}

