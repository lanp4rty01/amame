//
// AMAME vfd.js
// jariseon 2018-08-11
//
// based on cbrunschen's mame/web/esqpanel/vfx/FrontPanel.js
// see also bfm_bd1.cpp
//
var VFD = function (panel)
{
	var self = this;

	// -- state
	var m_cursorX = 0;
	var m_cursorY = 0;
	var m_savedCursorX = 0;
	var m_savedCursorY = 0;
	var m_blink = false;
	var m_under = false;
	var m_calib = false;
	var m_light = false;
	var m_stuff = false;

  // 
	this.setCell = function (row, col, c) {
		let cell = cells[row][col];
    let mask = 1;
    for (let i = 0; i < 16; i++) {
			var on = (c & mask) != 0;
			cell.segments[i].setAttribute("fill", on ? colorOn : colorOff);
      mask <<= 1;
    }
	}

  // after rearranging segmentPaths this is now obsolete
  function conv_segments(segin) {
    let segout = 0;

    if ( segin & 0x0001 ) segout |=  0x0004;
    if ( segin & 0x0002 ) segout |=  0x0002;
    if ( segin & 0x0004 ) segout |=  0x0020;
    if ( segin & 0x0008 ) segout |=  0x0200;
    if ( segin & 0x0010 ) segout |=  0x2000;
    if ( segin & 0x0020 ) segout |=  0x0001;
    if ( segin & 0x0040 ) segout |=  0x8000;
    if ( segin & 0x0080 ) segout |=  0x4000;
    if ( segin & 0x0100 ) segout |=  0x0008;
    if ( segin & 0x0200 ) segout |=  0x0400;
    if ( segin & 0x0400 ) segout |=  0x0010;
    if ( segin & 0x0800 ) segout |=  0x0040;
    if ( segin & 0x1000 ) segout |=  0x0080;
    if ( segin & 0x2000 ) segout |=  0x0800;
    if ( segin & 0x4000 ) segout |=  0x1000;
    if ( segin & 0x8000 ) segout |=  0x0100;

    return segout;
  }
  
  var segmentPaths = [
    "M1053 705 c-43 19 -57 47 -43 89 23 70 87 106 189 106 38 0 70 8 106 25 79 39 111 41 183 11 80 -34 119 -33 205 6 68 31 78 33 192 33 116 0 123 -1 195 -35 67 -31 87 -35 182 -40 101 -5 108 -7 137 -34 40 -38 50 -89 25 -118 -11 -11 -37 -29 -59 -39 -37 -17 -79 -19 -660 -18 -505 0 -626 2 -652 14z",
    "M2519 963 c-20 13 -46 47 -63 81 -28 53 -31 69 -37 199 -7 155 -20 211 -75 319 -50 99 -68 199 -54 301 23 167 52 217 126 217 37 0 47 -5 77 -40 53 -63 74 -151 97 -410 5 -63 16 -167 24 -230 42 -326 45 -374 21 -419 -24 -47 -63 -54 -116 -18z",    
    "M2279 2467 c-56 50 -69 80 -80 186 -6 51 -16 127 -24 169 -14 83 -10 123 25 213 36 95 44 146 31 203 -14 66 -14 205 -1 254 12 41 70 98 100 98 52 0 75 -100 100 -435 6 -77 22 -241 36 -364 28 -255 27 -268 -37 -325 -54 -49 -94 -49 -150 1z",
    "M1550 3539 c-14 5 -57 24 -97 44 -107 54 -134 56 -218 12 -79 -42 -105 -41 -170 3 -35 23 -53 28 -145 33 -131 8 -181 24 -194 62 -14 39 9 78 54 94 49 17 1278 18 1315 1 51 -23 42 -87 -18 -132 -21 -15 -48 -21 -115 -26 -77 -4 -94 -9 -140 -38 -85 -55 -195 -76 -272 -53z",
    "M695 2447 c-45 23 -76 54 -91 90 -8 18 -18 101 -24 190 -18 298 -21 328 -52 516 -26 164 -29 194 -18 235 23 91 68 107 130 44 46 -45 59 -86 71 -217 5 -55 13 -143 18 -195 11 -120 37 -199 101 -302 48 -78 50 -85 50 -153 0 -95 -15 -143 -60 -187 -42 -42 -75 -48 -125 -21z",
    "M797 938 c-32 36 -44 102 -67 377 -19 222 -30 337 -42 428 -17 138 12 277 67 313 55 36 123 -6 173 -109 52 -106 54 -167 12 -292 -27 -78 -30 -102 -30 -205 0 -79 7 -147 20 -210 11 -51 20 -111 20 -133 0 -123 -97 -231 -153 -169z",
    "M1099 2129 c-51 10 -110 43 -132 73 -28 37 -16 88 32 138 36 38 41 40 95 40 64 0 115 -22 159 -68 32 -34 46 -97 28 -130 -23 -43 -109 -68 -182 -53z",
    "M1940 2120 c-14 4 -56 8 -94 9 -80 1 -141 26 -181 73 -32 38 -32 78 1 118 48 56 84 67 249 74 146 7 151 7 195 -17 52 -27 99 -89 100 -130 0 -33 -31 -81 -63 -98 -27 -15 -125 -38 -157 -38 -14 1 -36 5 -50 9z",
    "M1515 1089 c-70 43 -69 41 -77 285 -3 121 -11 259 -18 306 -6 47 -13 142 -17 211 -6 141 5 183 54 195 78 20 124 -53 135 -216 13 -192 26 -274 61 -385 77 -245 76 -359 -3 -400 -39 -20 -99 -19 -135 4z",    
    "M1372 2456 c-40 28 -52 66 -52 166 0 92 -27 323 -55 468 -21 108 -19 246 3 290 21 44 59 65 96 56 47 -12 123 -92 146 -152 28 -77 28 -203 -1 -281 -21 -55 -22 -62 -10 -218 6 -88 14 -178 16 -201 6 -54 -11 -110 -38 -129 -28 -19 -76 -19 -105 1z",
    "M1067 2721 c-19 11 -122 161 -156 228 -42 81 -51 129 -51 276 0 113 3 147 18 175 39 80 102 35 199 -141 28 -52 56 -112 62 -134 6 -22 11 -114 11 -205 0 -134 -3 -170 -16 -188 -16 -24 -39 -27 -67 -11z",
    "M1108 1087 c-32 36 -42 71 -50 163 -5 52 -11 122 -14 156 -6 55 -1 75 41 200 53 152 59 165 87 183 16 10 24 9 44 -4 31 -20 43 -51 55 -135 5 -36 17 -97 26 -137 14 -63 15 -81 3 -145 -37 -205 -43 -222 -88 -271 -30 -32 -80 -37 -104 -10z",
    "M2144 1089 c-59 43 -88 78 -135 161 -23 41 -75 112 -115 156 -108 119 -132 188 -136 386 -3 107 -1 118 17 132 11 9 28 16 37 16 25 0 92 -63 154 -145 29 -39 100 -129 158 -200 58 -72 113 -144 121 -162 19 -40 32 -106 41 -214 5 -68 3 -91 -9 -116 -28 -52 -74 -57 -133 -14z",    
    "M1701 2579 c-24 24 -40 122 -44 261 -2 95 1 112 27 178 15 41 44 94 63 119 19 25 57 92 84 149 58 121 94 164 137 164 38 0 78 -32 90 -73 19 -60 22 -181 7 -238 -20 -77 -116 -277 -180 -376 -30 -46 -66 -106 -80 -133 -35 -69 -69 -86 -104 -51z",    
    "M2619 3393 c-19 12 -45 43 -59 67 -36 65 -36 183 0 255 48 93 136 107 207 33 60 -61 76 -152 48 -257 -17 -63 -45 -97 -94 -111 -52 -14 -64 -13 -102 13z",    
    "M512 4422 c-38 8 -46 15 -63 51 -37 83 -18 153 51 181 36 14 127 16 863 16 642 0 827 -3 847 -13 16 -8 31 -31 44 -64 16 -46 17 -57 5 -94 -8 -24 -26 -51 -42 -63 -28 -21 -34 -21 -845 -23 -501 0 -834 3 -860 9z",
	];
      
	this.parseMessage = function (data) {
		var s = "";
		for (var i = 0; i < data.length; i++) {
			var byte = data[i];

			if (m_light) {
				panel.setLight(byte & 0x3f, byte & 0xc0);
				m_light = false;
			}
			else if (m_calib) {
				console.log("calibration request")
				m_calib = false;
			}
			else if (m_stuff) {
				console.log("stuff", byte.toString(16))
				m_stuff = false;
			}
			else if (0x80 <= byte && byte < 0xd0) {
				m_cursorY = (byte & 0x7f) >= 40 ? 1 : 0;
				m_cursorX = (byte & 0x7f) % 40;
				m_blink = blink(m_cursorY, m_cursorX);
				m_under = underline(m_cursorY, m_cursorX);
			}
			else if (0x20 <= byte && byte <= 0x5f) {
				setChar(m_cursorY, m_cursorX, byte, m_under, m_blink);
				m_cursorX = Math.min(m_cursorX + 1, 39);
			}
			else switch (byte) {
				case 0xd0:	m_blink = true; break;
				case 0xd1:	m_blink = m_under = false; break;
				case 0xd2:	m_blink = m_under = true;  break;
				case 0xd3:	m_under = true; break;
				case 0xfb:  m_calib = true; break;
				case 0xff:  m_light = true; break;
				// case 0xe8:  m_stuff = true; break;
				case 0xd6:  // clear screen
					m_cursorX = m_cursorY = 0;
					m_blink = m_under = false;
					self.clear();
					break;
				case 0xf5:  // save cursor position
					m_savedCursorX = m_cursorX;
					m_savedCursorY = m_cursorY;
					break;
				case 0xf6:  // restore cursor position
					m_cursorX = m_savedCursorX;
					m_cursorY = m_savedCursorY;
					m_blink = blink(m_cursorY, m_cursorX);
					m_under = underline(m_cursorY, m_cursorX);
					break;					
				default:
					console.log("unexpected input", "0x" + byte.toString(16));
			}
		}
	}

	this.clear = function () {			
		for (var row = 0; row < nrows; row++)
			for (var col = 0; col < ncols; col++)
				setChar(row, col, ' ', false, false);
	}

	this.showString = function(y, x, s) {
		for (var i = 0; i < s.length; i++) {
			setChar(y, x, s.charCodeAt(i), false, false);
			x++;
			if (x >= cells[y].length) {
				x = 0;
				y++;
			}
			if (y >= cells.length) y = 0;
		}
	}
	
	function setChar (y,x, c, underline, blink) {
		var cell = cells[y][x];
		cell.char = c;
		cell.underline = underline;
		cell.blink = blink;
		showSegments(cell.segments, segmentsForCharacter(c, underline, blink, blinkPhase));		
	}
	
	function segmentsForCharacter (c, underline, blink, blinkPhase) {
		var lit = (c < 32 || 127 < c) ? 0 : segmentsByCharacter[c - 32];
		if (blink && !blinkPhase) { return underline ? lit : 0; }
		else return underline ? lit | 0x8000 : lit; 
	}
	
	function showSegments (segments, lit) {
		var mask = 1;
		var i;
		for (i = 0; i < 16; i++) {
			var on = (lit & mask) != 0;
			segments[i].setAttribute("fill", on ? colorOn : colorOff);
			if (overdraw) {
				segments[i].setAttribute("stroke-width", overdraw);
				if (on) segments[i].setAttribute("stroke", colorOn);
				else		segments[i].setAttribute("stroke", "none");
			} else		segments[i].setAttribute("stroke", "none");
			mask <<= 1;
		}
	}
	
	function blink (x,y) {
		return false;
	}

	function underline (x,y) {
		return false;
	}

	function createElement (tag) { return document.createElementNS("http://www.w3.org/2000/svg", tag); }
		
	var segmentsByCharacter = [
		0x0000, //  0000 0000 0000 0000 SPACE
		0x7927, //  0011 1001 0010 0111 '0.'
		0x0028, //  0000 0000 0010 1000 '"'
		0x4408, //  0000 0100 0000 1000 '1.'
		0x25e9, //  0010 0101 1110 1001 '$'
		0x70c3, //  0011 0000 1100 0011 '2.'
		0x0000, //  0000 0000 0000 0000 '&'
		0x0010, //  0000 0000 0001 0000 '''
		0x61c3, //  0010 0001 1100 0011 '3.'
		0x41e2, //  0000 0001 1110 0010 '4.'
		0x0edc, //  0000 1110 1101 1100 '*'
		0x04c8, //  0000 0100 1100 1000 '+'
		0x0000, //  0000 0000 0000 0000 ','
		0x00c0, //  0000 0000 1100 0000 '-'
		0x4000, //  0100 0000 0000 0000 '.'
		0x0804, //  0000 1000 0000 0100 '/'
		0x3927, //  0011 1001 0010 0111 '0'
		0x0408, //  0000 0100 0000 1000 '1'
		0x30c3, //  0011 0000 1100 0011 '2'
		0x21c3, //  0010 0001 1100 0011 '3'
		0x01e2, //  0000 0001 1110 0010 '4'
		0x21e1, //  0010 0001 1110 0001 '5'
		0x31e1, //  0011 0001 1110 0001 '6'
		0x0103, //  0000 0001 0000 0011 '7'
		0x31e3, //  0011 0001 1110 0011 '8'
		0x21e3, //  0010 0001 1110 0011 '9'
		0x0000, //  0000 0000 0000 0000 ':'
		0x71e1, //  0011 0001 1110 0001 '6.'
		0x0204, //  0000 0010 0000 0100 '('
		0x20c0, //  0010 0000 1100 0000 '='
		0x0810, //  0000 1000 0001 0000 ')'
		0x0000, //  0000 0000 0000 0000 '?'
		0x3583, //  0011 0101 1000 0011 '@'
		0x11e3, //  0001 0001 1110 0011 'A'
		0x254b, //  0010 0101 0100 1011 'B'
		0x3021, //  0011 0000 0010 0001 'C'
		0x250b, //  0010 0101 0000 1011 'D'
		0x30e1, //  0011 0000 1110 0001 'E'
		0x10e1, //  0001 0000 1110 0001 'F'
		0x3161, //  0011 0001 0110 0001 'G'
		0x11e2, //  0001 0001 1110 0010 'H'
		0x2409, //  0010 0100 0000 1001 'I'
		0x3102, //  0011 0001 0000 0010 'J'
		0x12a4, //  0001 0010 1010 0100 'K'
		0x3020, //  0011 0000 0010 0000 'L'
		0x1136, //  0001 0001 0011 0110 'M'
		0x1332, //  0001 0011 0011 0010 'N'
		0x3123, //  0011 0001 0010 0011 'O'
		0x10e3, //  0001 0000 1110 0011 'P'
		0x3323, //  0011 0011 0010 0011 'Q'
		0x12e3, //  0001 0010 1110 0011 'R'
		0x21e1, //  0010 0001 1110 0001 'S'
		0x0409, //  0000 0100 0000 1001 'T'
		0x3122, //  0011 0001 0010 0010 'U'
		0x1824, //  0001 1000 0010 0100 'V'
		0x1b22, //  0001 1011 0010 0010 'W'
		0x0a14, //  0000 1010 0001 0100 'X'
		0x0414, //  0000 0100 0001 0100 'Y'
		0x2805, //  0010 1000 0000 0101 'Z'
		0x3021, //  0011 0000 0010 0001 '['
		0x71e3, //  0011 0001 1110 0011 '8.'
		0x2103, //  0010 0001 0000 0011 ']'
		0x0a00, //  0000 1010 0000 0000 '^'
		0x2000, //  0010 0000 0000 0000 '_'
		0x0010, //  0000 0000 0001 0000 '`'
		0x11e3, //  0001 0001 1110 0011 'a'
		0x254b, //  0010 0101 0100 1011 'b'
		0x3021, //  0011 0000 0010 0001 'c'
		0x250b, //  0010 0101 0000 1011 'd'
		0x30e1, //  0011 0000 1110 0001 'e'
		0x10e1, //  0001 0000 1110 0001 'f'
		0x3161, //  0011 0001 0110 0001 'g'
		0x11e2, //  0001 0001 1110 0010 'h'
		0x2409, //  0010 0100 0000 1001 'i'
		0x3102, //  0011 0001 0000 0010 'j'
		0x12a4, //  0001 0010 1010 0100 'k'
		0x3020, //  0011 0000 0010 0000 'l'
		0x1136, //  0001 0001 0011 0110 'm'
		0x1332, //  0001 0011 0011 0010 'n'
		0x3123, //  0011 0001 0010 0011 'o'
		0x10e3, //  0001 0000 1110 0011 'p'
		0x3323, //  0011 0011 0010 0011 'q'
		0x12e3, //  0001 0010 1110 0011 'r'
		0x21e1, //  0010 0001 1110 0001 's'
		0x0409, //  0000 0100 0000 1001 't'
		0x3122, //  0011 0001 0010 0010 'u'
		0x1824, //  0001 1000 0010 0100 'v'
		0x1b22, //  0001 1011 0010 0010 'w'
		0x0a14, //  0000 1010 0001 0100 'x'
		0x0414, //  0000 0100 0001 0100 'y'
		0x2805, //  0010 1000 0000 0101 'z'
		0x3021, //  0011 0000 0010 0001 '{'
		0x0408, //  0000 0100 0000 1000 '|'
		0x2103, //  0010 0001 0000 0011 '}'
		0x0a00, //  0000 1010 0000 0000 '~'
		0x0000, //  0000 0000 0000 0000 DEL
	];

	var wchar = 342;
	var hchar = 572;
	var segmentScale = 0.1;
	var nrows = 2;
	var ncols = 40;
	var cells = [];
	var w = wchar * ncols;
	var h = hchar * nrows;
	var colorOn = "#00ffbb";
	var colorOff = "#002211";
	var overdraw = 0;
	var blinkPhase = true;

	var temp = createElement("g");
	temp.setAttribute('transform', 'scale(' + segmentScale + ')');
	for (var i = 0; i < segmentPaths.length; i++) {
		var path = createElement("path");
		path.setAttribute('d', segmentPaths[i]);
		temp.appendChild(path);
	}

	var svg = this.root = createElement("svg");
	svg.id = "vfd";
	svg.setAttribute("viewBox", "0 0 " + w + " " + h);
	for (var row = 0; row < 2; row++) {
		cells.push([]);
		for (var col = 0; col < 40; col++) {
			cells[row][col] = { char: ' ', blink: false, underline: false, segments: [] };
			var cell = temp.cloneNode(true);
			var ctm = "translate(" + col * wchar + ", " + row * hchar + ") " + cell.getAttribute("transform");
			cell.setAttribute("transform", ctm);
			svg.appendChild(cell);
			var segs = cell.getElementsByTagName("path");
			for (var cc = 0; cc < segs.length; cc++)
				cells[row][col].segments[cc] = segs[cc];
		}
	}
}
