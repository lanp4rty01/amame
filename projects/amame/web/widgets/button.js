//
// AMAME button.js
// jariseon 2018-08-11
// simple pushbutton
//
var Button = function (x, y, w, h, label, labelPos, value, className, multiPage, lightId)
{
	var self = this;
	var butt = document.createElement("div");
	butt.className = className;
	butt.style.left = x;
	if (y >= 0) butt.style.top = y;
	butt.style.width  = w;
	butt.style.height = className == "ledButton" ? h-1 : h;
	
	this.value = value;
	
	if (label) {
		var div = document.createElement("div");
		var lab = document.createElement("div");
		lab.className = "label";
		lab.style.width = w;
		if (labelPos == Button.LabelPos.ABOVE) {
			var multiline = label.indexOf(" ") > 0;
			if (multiline) label = label.replace(" ", "<br/>");
			lab.style.marginTop = multiline ? 0 : 13;
			lab.style.marginBottom = 4;
			div.appendChild(lab);
			div.appendChild(butt);
		}
		else if (labelPos == Button.LabelPos.BELOW) {
			lab.style.marginTop = className == "ledButton" ? 4 : 3;
			div.appendChild(butt);
			div.appendChild(lab);			
		}
		else {
			butt.innerHTML = label;
			div.appendChild(butt);			
		}
		lab.innerHTML = label;
		this.elem = div;
	}
	else this.elem = butt;
  
  butt.widget = this;  
}
Button.LabelPos = { ABOVE:1, BELOW:2, IN:3 }
