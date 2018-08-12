//
// AMAME slider.js
// jariseon 2018-08-11
// restyled html input[type="range"]
//
var Slider = function (x, y, w, channel, min,max)
{
	var self = this;
	var div = document.createElement("div");
	var slider = document.createElement("input");
	slider.type = "range";
	slider.className = "slider";
	slider.style.left = x;
	slider.style.top  = y;
	slider.style.width = w;
	slider.channel = channel;
	slider.min = min;
	slider.max = max;
	this.elem = slider;	
}
