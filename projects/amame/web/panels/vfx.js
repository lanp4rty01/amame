//
// vfx.js
// jariseon 2018-08-11
//
// HTML panel for ensoniq VFX and VFX-SD
// inspired by cbrunschen's mame/web/esqpanel/vfx/FrontPanel.js
//

// factory
createPanel = function () { return new VFX(); }

// panel
var VFX = function ()
{
  var panel;
  
  // display content from MAME
	function onMessage (data) {
    if (data[0].indexOf("vfd") == 0)
      panel.display.onmessage(data);
  }
  
  this.init = async function () {

    // -- load scripts
    await frontend.loadScript("widgets/vfd.js");
    await frontend.loadScript("widgets/button.js");
    await frontend.loadScript("widgets/slider.js");
    
    panel = new VFXPanel(socket);    
    frontend.onMessage = onMessage;
    frontend.resize(833,251);
  }
}


var VFXPanel = function (msgPort)
{
	var self = this;
	var buttons = [];
	this.lightButtons = [];

  function onbutton (e) {
		var val = (e.type == "mousedown" ? 0x80 : 0) + e.target.widget.value;
		var msg = JSON.stringify({ type:"mame", tag:":WEBGUI", mask:1, value:val });
		setTimeout( function () {
			msgPort.sendString(msg);
		}, val >= 0x80 ? 0 : 100);
  }
  
	function onAnalogValue (e) { console.log(e.target.value)
		var value = 760 * (e.target.value|0) / 100; // 90;
		value = Math.round(Math.max(0, Math.min(1023, value)));
    var mask = e.target.channel == 3 ? 2 : 4;
		var msg = JSON.stringify({ type:"mame", tag:":WEBGUI", mask:mask, value:value });
    msgPort.sendString(msg);
	}
	
	this.addButton = function (container, className, x, y, w, h, label, labelPos, value, lightID) {
		var button = new Button(x, y, w, h, label, labelPos, value, className, false, -1);

    buttons[value] = button;
    button.elem.onmousedown = onbutton;
    button.elem.onmouseup = onbutton;

		button.elem.style.left = x;
		container.appendChild(button.elem);
		return button;
	}

	function addSoundButton (id, container, className, label, lightID) {
		self.addButton(container, className, 0,0, wbutt,hbutt, label, Button.LabelPos.BELOW, id, lightID);
	}
	
	function addEditButton (id, container, className, label, lightID) {
		var h = className.indexOf("smallEdit") > 0 ? 14 : hbutt;
		var btn = self.addButton(container, className, 0,0, wbutt,h, label, Button.LabelPos.ABOVE, id, lightID);
	}
	
	function element(className,text) {
		var div = document.createElement("div");
		if (className) div.className = className;
		if (text) div.innerHTML = text;
		return div;
	}
	
	var w = 700;
	var wbutt = 50;
	var hbutt = 33;

	// --------------------------------------------------------------------------
	// sliders and data entry buttons
	//
	function createSliderPanel () {
		var panel = document.getElementById("sliderPanel");
		
		var slider = new Slider(20,202,172, 5);
		slider.elem.oninput = onAnalogValue;
		slider.elem.value = 100;
    
		var labels = element();
		labels.style.display = "flex";
		labels.style.position = "absolute";
		labels.style.top = 224;
		labels.style.left = 8;
		var label1 = element("label", "Vol");
		label1.style.width = 28;
		labels.appendChild(label1);
		
		panel.appendChild(slider.elem);
		panel.appendChild(labels);
	}
	
	// --------------------------------------------------------------------------
	// display and memory + bank buttons
	//
	function createDisplayPanel () {
		var panel = document.getElementById("displayPanel");
		
		self.display = new DisplayPanel(self, w);		
		var buttons = document.getElementById("presetButtons");
		buttons.style.width  = w + 2*41;

		var containers = buttons.querySelectorAll("div");
		var c = "ledButton";
		var r = containers[0];
		addSoundButton(52, r, c, "Cart");
		addSoundButton(53, r, c, "Sounds");
		addSoundButton(54, r, c, "Presets");
		addSoundButton(0,  r, c, "Song");

		var defs = [
			[55,0x0E,"0"], [56,0x06,"1"], [57,0x04,"2"], [46,0x0C,"3"],
			[47,0x03,"4"], [48,0x0B,"5"], [49,0x02,"6"], [35,0x0A,"7"],
			[34,0x01,"8"], [25,0x09,"9"] ];

		c += " bankButton";
		r = containers[1];
		for (var i=0; i<defs.length; i++) {
			var def = defs[i];
			self.addButton(r, c, 0,0,wbutt,hbutt, def[2], Button.LabelPos.BELOW, def[0], def[1]);
		}

		panel.appendChild(self.display.root);	
		panel.appendChild(buttons);
	}

	// --------------------------------------------------------------------------
	// data entry
	//
	function createDataPanel () {
		var panel = document.getElementById("dataPanel");
		var slider = new Slider(120,441+43,215, 3);
		slider.elem.oninput = onAnalogValue;
    slider.elem.value = 0;
		var b1 = self.addButton(panel, "panelButton", 48, 383+43, wbutt, hbutt, "&#9650", Button.LabelPos.IN, 62);
		var b2 = self.addButton(panel, "panelButton", 48, 423+43, wbutt, hbutt, "&#9660", Button.LabelPos.IN, 63);
		b1.elem.style.background = b2.elem.style.background = "#111";
		b2.elem.style.fontSize = "9px";
		
		panel.appendChild(slider.elem);
	}
	
	// --------------------------------------------------------------------------
	// edit buttons 1
	//
	function createPerformancePanel () {
		var panel = document.getElementById("performancePanel");		
		var c = "button smallEdit";
		var r = element("buttonrow");
		addEditButton(36, r, c, "Volume");
		addEditButton(37, r, c, "Pan");
		addEditButton(38, r, c, "Timbre");
		panel.appendChild(r);
		r = element("buttonrow");
		addEditButton(39, r, c, "Key Zone");
		addEditButton(40, r, c, "Trans- pose");
		addEditButton(41, r, c, "Release");
		panel.appendChild(r);
		r = element("buttonrow");
		addEditButton(26, r, c, "Patch Select");
		addEditButton(27, r, c, "MIDI");
		addEditButton(28, r, c, "Effects");
		panel.appendChild(r);
		r = element("buttonrow");
		c = "button largeEdit";
		addEditButton(29, r, c, "Replace Program");
		addEditButton(30, r, c, "A");
		addEditButton(31, r, c, "B");
		panel.appendChild(r);
	}
	
	// --------------------------------------------------------------------------
	// edit buttons 2
	//
	function createSystemPanel () {
		var panel = document.getElementById("systemPanel");		
		var c = "button smallEdit";		
		var r = element("buttonrow");
		addEditButton(20, r, c, "Master");
		addEditButton(21, r, c, "Storage");
		addEditButton(24, r, c, "MIDI Control");
		panel.appendChild(r);
		r = element("buttonrow");
		addEditButton(60, r, c, "Song");
		addEditButton(59, r, c, "Seq");
		addEditButton(61, r, c, "Track");
		panel.appendChild(r);
		r = element("buttonrow");
		addEditButton(32, r, c, "Click");
		addEditButton(18, r, c, "Seq Control");
		addEditButton(33, r, c, "Locate");
		panel.appendChild(r);
		r = element("buttonrow");
		c = "button largeEdit";
		addEditButton(19, r, c, "Rec");
		addEditButton(22, r, c, "Stop /Cont");
		addEditButton(23, r, c, "Play");
		panel.appendChild(r);
	}
	
	// --------------------------------------------------------------------------
	// edit buttons 3
	//
	function createEditPanel () {
		var panel = document.getElementById("editPanel");		
		var c = "button smallEdit";		
		var r = element("buttonrow");
		addEditButton(10, r, c, "LFO");
		addEditButton(12, r, c, "Env1");
		addEditButton(14, r, c, "Env2");
		addEditButton(16, r, c, "Env3");
		panel.appendChild(r);
		r = element("buttonrow");
		addEditButton(11, r, c, "Pitch");
		addEditButton(13, r, c, "Pitch Mod");
		addEditButton(15, r, c, "Filters");
		addEditButton(17, r, c, "Output");
		panel.appendChild(r);
		r = element("buttonrow");
		addEditButton(4, r, c, "Wave");
		addEditButton(6, r, c, "Mod Mixer");
		addEditButton(2, r, c, "Program Control");
		addEditButton(7, r, c, "Effects");
		panel.appendChild(r);
		r = element("buttonrow");
		c = "button largeEdit";
		addEditButton(5, r, c, "Select Voice");
		addEditButton(9, r, c, "Copy");
		addEditButton(3, r, c, "Write");
		addEditButton(8, r, c, "Compare");
		panel.appendChild(r);
	}
	
	createSliderPanel();
	createDisplayPanel();
	createDataPanel();
	createPerformancePanel();
	createSystemPanel();
	createEditPanel();
	
  var editPanelVisible = false;
	var edit = document.getElementById("edit");
	edit.onclick = function () {
		document.getElementById("lowerPanel").style.display = edit.classList.contains("editing") ? "none" : "flex";
		edit.classList.toggle("editing");
    
    editPanelVisible = !editPanelVisible;
    self.resize();
	}
  
  this.resize = function () {
    let dh = editPanelVisible ? 264 : 0;
    frontend.resize(833,251+dh);
  }
}

var DisplayPanel = function (panel, w)
{
	var self = this;
	var ELight = { OFF:0, ON:1, BLINK:2 }

	this.onmessage = function (data) { 
    let index = parseInt(data[0].substring(3));
    let row = (index / 40) | 0;
    let col = index % 40;
    display.setCell(row,col,data[1]);
	}

	this.setLight = function (index, state) {
		var button = panel.lightButtons[index];
		if (button)
			button.setLight(state == 0x80 ? ELight.ON : state == 0xc0 ? ELight.BLINK : ELight.OFF);
	}

	var display = new VFD(this);
	display.root.setAttribute("width", w);
	display.clear();
	// display.showString(0,0, "connecting...");
	
	var wcell = w / 40;
	var wbutt = 3 * wcell;
	var hbutt = 14;
	var x1 = 11 * wcell - wbutt/2 + 30;
	var x2 = 23 * wcell - wbutt/2 + 30;
	var x3 = 35 * wcell - wbutt/2 + 30;
	
	this.root = document.getElementById("display");
	this.root.style.width = w;
	this.root.style.position = "relative";
	
	var upper = document.createElement("div");
	var lower = document.createElement("div");
	var c = "panelButton";
	upper.style.width  = lower.style.width  = w;
	upper.style.height = lower.style.height = hbutt;
	upper.style.padding = "10px 0";
	lower.style.padding = "10px 0";
	panel.addButton(upper, c, x1, -1, wbutt, hbutt, "", 0, 58);
	panel.addButton(upper, c, x2, -1, wbutt, hbutt, "", 0, 42);
	panel.addButton(upper, c, x3, -1, wbutt, hbutt, "", 0, 43);
	panel.addButton(lower, c, x1, -1, wbutt, hbutt, "", 0, 50);
	panel.addButton(lower, c, x2, -1, wbutt, hbutt, "", 0, 44);
	panel.addButton(lower, c, x3, -1, wbutt, hbutt, "", 0, 45);

	this.root.appendChild(upper);
	this.root.appendChild(display.root);
	this.root.appendChild(lower);
	
	var edit = document.createElement("div");
	edit.id = "edit";
	edit.innerHTML = "EDIT"
	this.root.appendChild(edit);
	
	
	this.parseMessage = function (data) { display.parseMessage(data); }
	
	return this;
}
