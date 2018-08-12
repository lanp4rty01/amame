//
// AMAME hd44780.js
// jariseon 2018-08-11
// partial reimplementation of hd44780.cpp in JS
//

var HD44780 = function (container, romURL)
{
  var svg,cellTemplate;
  var rows = [];
  var cgrom;
  var NS = "http://www.w3.org/2000/svg";
  var dotsize = 5;
  var dotgap = 1;
  var cellgap = 2;
  var options = {};
  
  function createElement (tag) { return document.createElementNS(NS, tag); }

  this.onmessage = function (data) {
    let index = data >> 16;
    let value = data & 0xFFFF;
    if (index >= 64) index -= 56;
    this.setValue(index, value);
  }
  
  this.init = async function (nrows,ncols, wchar,hchar) {
    // -- fetch character rom
    romURL = romURL || "widgets/hd44780_a00.bin";
    cgrom = await fetch(romURL);
    cgrom = new Uint8Array(await cgrom.arrayBuffer());

    options.numrows = nrows;
    options.numcols = ncols;
    options.charWidth  = wchar;
    options.charHeight = hchar;
    options.cursorGap  = 3;
    
    let w = options.numcols * (options.charWidth * (dotsize + dotgap) + cellgap);
    let h = options.numrows * ((options.charHeight + 1) * (dotsize + dotgap) + options.cursorGap);
    svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width",  w * 0.5);
    svg.setAttribute("height", h * 0.5);
    svg.style.background = "#1a1a1a";
    container.appendChild(svg);

    cellTemplate = createElement("g");
    for (let h=0; h<=hchar; h++) {
      let dy = (h == hchar) ? options.cursorGap : 0;
      for (let w=0; w<wchar; w++) {
        let dot = createElement("rect");
        dot.setAttribute("x", w * (dotsize + dotgap));
        dot.setAttribute("y", h * (dotsize + dotgap) + dy);
        dot.setAttribute("width",  dotsize);
        dot.setAttribute("height", dotsize);
        dot.setAttribute("class", "dotoff");
        cellTemplate.appendChild(dot);
      }
    }

    let wcell = wchar * (dotsize + dotgap);
    for (let r=0; r<nrows; r++) {
      var row = createElement("g");
      row.setAttribute("class", "row");
      row.style.transform = "scale(0.5)"
      for (let c=0; c<ncols; c++) {
        let cell = cellTemplate.cloneNode(true);
        cell.style.transform = " translate(" + (c * (wcell + cellgap)) + "px,0)";
        row.appendChild(cell);
      }
      svg.appendChild(row);
      rows.push(row);
    }
    
    clearDisplay();
  }

  function iclamp (value, min,max) {
    if (value < min) return min;
    if (value > max) return max;
    return value | 0;
  }
  
  this.setValue = function (index, v) {
    index = iclamp(index, 0, options.numrows * options.numcols - 1);
    data[index] = v;
    
    // render
    let irow = ((index / options.numrows) | 0) % options.numrows;
    let icol = index % options.numcols;
    let cell = rows[irow].querySelectorAll("g")[icol];
    let pixels = cell.querySelectorAll("rect");
    let ipixel = 0;
    let charOffset = v * 16;
    for (let r = 0; r < options.charHeight; r++) {
      let bmp = cgrom[charOffset + r] & 0x1F;
      for (let c = (options.charWidth-1); c >= 0; c--) {
        let onoff = (bmp & (1 << c)) != 0;
        pixels[ipixel++].setAttribute("class", onoff ? "doton" : "dotoff");
      }
    }
  }
  
  this.setString = function (s) {
    for (let i=0; i<s.length; i++)
      this.setValue(i, s.charCodeAt(i));
  }
  
  this.setChar = function (index, c) {
    this.setValue(index, c.charCodeAt());
  }
  
  // --------------------------------------------------------------------------
  
  var ddram = 0;
  var cgram = 0;
  var cursor = 0;
  var shift = 0;
  var nchars = 16;
  var data = new Array(nchars);
  var self = this;
  
  function clearDisplay() {
    for (var i=0; i<nchars; i++) {
      data[i] = 0x20;
      self.setValue(i, 0x20);
    }
  }

  function correct_ac()
  {
    var max_ac = 16;
    if (cursor > max_ac)
      cursor -= max_ac + 1;
    else if (cursor < 0)
      cursor = max_ac;
  }
  
  this.onControl = function (c) {
    if (c & 0x80) {
      cursor = ((c & 0x7F) / 8) | 0;
      correct_ac();
    }
    else {
      if ((c & 0x40) == 0x40) cgram = c & 0x3F;
      if ((c & 0x02) <= 2) { cursor = shift = 0; }
      if ((c & 0x01) == 1) {
        cursor = 0;
        clearDisplay();
      }
    }
  }

  this.onData = function (d) {
    this.setValue(cursor, d);
    if (cursor < (nchars - 1)) cursor++;
  }
}
