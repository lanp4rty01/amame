//
// AMAME frontend.js
// jariseon 2018-08-11
//
var AMAME = AMAME || {}

AMAME.Frontend = function ()
{
  var self = this;
  var currentModel = "fb01";
  var pendingModel = "";
  var currentSize = { w:0, h:0 };

  this.loadScript = (url) => {
    return new Promise((resolve) => {
      var script = document.createElement("script");
      script.src = url;
      script.onload = () => { resolve(); }
      document.head.appendChild(script);
    });
  }
  
  this.setModel = async (model) => {
    this.onMessage = null;
    
    let gui = model == "vfxsd" ? "vfx" : model;
    let url = "panels/" + gui;
    let resp = await fetch(url + ".html");
    if (resp.ok) {
      document.getElementById("front-panel").innerHTML = await resp.text();
      await frontend.loadScript(url + ".js");
      panel = createPanel();
      panel.init();
      scheduleDriver(model);
    }
    
    // -- html does not exist, fallback to layout file
    else {
      pendingModel = model;  // will be instantiated after layout has been loaded
      socket = new AMAME.Socket();
      socket.onopen = () => {
        let msg = JSON.stringify({ type:"amame", verb:"get", prop:"layout", data:model });
        socket.sendString(msg);
      }
    }    
  }
  
  function scheduleDriver (model) {
    if (model != currentModel) {
      currentModel = model;
      let msg = JSON.stringify({ type:"amame", verb:"set", prop:"device", data:model });
      socket.sendString(msg);
    }    
  }
  
  this.resize = (w,h) => {
    let widthChanged = w != currentSize.w;
    currentSize.w = w;
    currentSize.h = h;
    if (keysVisible) h += 62;
    document.getElementById("frontend").style.width = w + "px";
    if (widthChanged)
      keyboard = createKeyboard();      
  
    var msg = JSON.stringify({ type:"amame", verb:"set", prop:"size", width:w, height:h });
    socket.sendString(msg);
  }

  this.toggleKeys = function () {
    keysVisible = !keysVisible;
    document.getElementById("keys-toggle").classList.toggle("active");
    this.resize(currentSize.w, currentSize.h);
  }
  
  this.setValue = (tag, mask, value) => {
    var msg = JSON.stringify({ type:"mame", tag:tag, mask:mask, value:value });
    socket.sendString(msg);
  }

  this.onSysex = function (verb) {
    if (verb == "clear") {
      let indicator = document.querySelector("#sysex-numbytes");
      indicator.innerText = 0;
      indicator.style.display = "none";      
    }
    var msg = JSON.stringify({ type:"amame", verb:verb, prop:"sysex" });
    socket.sendString(msg);      
  }

  async function onmessage (data) {
		data = JSON.parse(data);
    if (data.type == "amame") {
      if (data.verb == "set") {
        if (data.prop == "sysexLength") {
          let indicator = document.querySelector("#sysex-numbytes");
          indicator.innerText = data.value;
          indicator.style.display = (data.value == 0) ? "none" : "block";
        }
        else if (data.prop == "layout") {
          let container = document.getElementById("front-panel");
          let layout = new AMAME.Layout();
          let svgs = await layout.createViews(data.value);
          container.innerHTML = "";
          svgs.forEach((svg) => { container.appendChild(svg); })
          
          if (pendingModel) {
            scheduleDriver(pendingModel);
            pendingModel = "";
          }
        }
      } 
    }
    else if (self.onMessage)
      self.onMessage(data);
	}
  
  function onmidi (data) {
    var msg = JSON.stringify({ type:"amame", verb:"add", prop:"midi", data:data });
    socket.sendString(msg);    
  }
  
  function createKeyboard () {
    let container = document.getElementById("keyboard");
    container.innerHTML = "";
    let keys = new QwertyHancock({
      container: container, height: 60,
      octaves: 6, startNote: 'C2', oct:4,
      whiteNotesColour: 'white', blackNotesColour: 'black', activeColour:'orange'
    });    
    keys.keyDown = (note, name) => onmidi([0x90, note, velocity]);
    keys.keyUp   = (note, name) => onmidi([0x80, note, velocity]);
    return keys;
  }
  
  // -- midi keyboard
  var keysVisible = false;
  var velocity = 100;
  var keyboard = createKeyboard();
    
  socket = new AMAME.Socket();
  socket.onmessage = onmessage;
}
