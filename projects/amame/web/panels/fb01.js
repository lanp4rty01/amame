//
// fb01.js
// jariseon 2018-08-11
// HTML panel for yamaha FB-01
//

// factory
createPanel = function () { return new FB01(); }

// panel
var FB01 = function ()
{
  var lcd;

  // display content from MAME
  function onMessage (data) {
    if (data[0] == ":hd44780")
      lcd.onmessage(data[1]);
  }

  // buttons
  function onmouse (e) {
    var value = e.type == "mousedown" ? 1 : 0;
    setTimeout( function () {
      frontend.setValue(":PANEL", e.target.code, value);
    }, value == 1 ? 0 : 100);    
  }

  var buttons = [
   [{ caption:"SYSTEM<br/>SETUP", code:0x01, color:"#477971" },
    { caption:"INST<br/>SELECT", code:0x02, color:"#477971" },
    { caption:"DATA ENTRY<br/>&ndash;1/NO", code:0x40, color:"#ccc" },
    { caption:"DATA ENTRY<br/>+1/YES", code:0x80, color:"#ccc" }],
   [{ caption:"INST<br/>ASSIGN", code:0x04, color:"#4694DB" },
    { caption:"INST<br/>FUNCTION", code:0x08, color:"#4694DB" },
    { caption:"VOICE<br/>FUNCTION", code:0x10, color:"#4694DB" },
    { caption:"VOICE<br/>SELECT", code:0x20, color:"#4694DB" }],
  ];

  this.init = async function () {
    // -- load scripts
    await frontend.loadScript("widgets/hd44780.js");
    
    // -- button panel
    let temp = document.getElementById("fb01-control");
    let rows = document.querySelectorAll(".button-row");
    for (let irow = 0; irow < rows.length; irow++) {
    for (let icol = 0; icol < buttons[0].length; icol++) {
      let node = temp.content.cloneNode(true);
      let capt = node.querySelector(".fb01-title");
      let butt = node.querySelector(".fb01-button");
      let defs = buttons[irow][icol];
      capt.innerHTML = defs.caption;
      capt.style.borderBottomColor = defs.color;
      butt.code = defs.code;
      butt.onmousedown = butt.onmouseup = onmouse;
      rows[irow].appendChild(node);
    }}

    // -- display panel
    // -- with a fake boot message (websocket takes time to set up)
    lcd = new HD44780(document.getElementById("lcd"));
    await lcd.init(1,16, 5,7);
    setTimeout(() => { lcd.setString("FB-01 ready  !!!"); }, 500);
    
    frontend.onMessage = onMessage;
    frontend.resize(787,186);
  }
}
