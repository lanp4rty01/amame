//
// layout.js
// jariseon 2018-08-11
//
// fallback to convert .lay files to SVG
// this is still very much WIP as the goal is to provide custom HTML files for all devices
// a separate SVG element is created for each layout view
// SVGs may be styled with CSS .layoutview selector
// inspired by JoakimLarsson's mame/web/layout.xsl
//
AMAME = AMAME || {}

AMAME.Layout = function ()
{
  var SVGNS = "http://www.w3.org/2000/svg";
  
  // -- converts layout format definition (lay) to SVG
  // -- returns an array of svg elements, one for each layout view
  //
  this.createViews = async (xml) => {
    let xsl = await fetch("amame/lay2svg.xsl");
    let xmlParser = new DOMParser();
    xsl = xmlParser.parseFromString(await xsl.text(), "application/xml");
    xml = xmlParser.parseFromString(await xml, "application/xml");
    let xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xsl);
    
    // decided to go imperative because of my lack of XSLT wizardry
    // was having hard time as elements and views are in separate subtrees
    let frag = xsltProcessor.transformToFragment(xml, document);
    let json = frag.firstChild.textContent.split('"').map(function(v,i){
      return i%2 ? v : v.replace(/\s/g, "");
    }).join('"');
    json = json.replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9]+)(['"])?:/g, '$1"$3":');
    
    let layout = JSON.parse(json);
    normalizeElements(layout.elements);

    var svgs = [];
    layout.views.forEach((view) => {
      normalizeBounds(view.items);
      let svg = createSVG(view, layout.elements);
      svgs.push(svg);
      
      view.items.forEach((itemdef) => {
        let item = createItem(svg,itemdef, layout.elements);
      });
    });
    
    return svgs;
  }

  // bounds as { x,y,w,h }
  // colors as rgb()
  //
  function normalizeElements (elems) {
    elems.forEach((elem) => {
      normalizeBounds(elem.items);
      elem.items.forEach((item) => {
        if (item.color) {
          let c = item.color;
          item.color = "rgb("+c[0]+","+c[1]+","+c[2]+")"
        }
      });
    });
  }
  
  function normalizeBounds (items) {
    items.forEach((item) => {
      if (item.bounds) {
        let b = item.bounds;
        if (b.left != undefined)
          item.bounds = { x:b.left, y:b.top, w:b.right-b.left, h:b.bottom-b.top }
        else item.bounds = { x:b.x, y:b.y, w:b.width, h:b.height }
        let scale = 1;
        item.bounds.x *= scale;
        item.bounds.y *= scale;
        item.bounds.w *= scale;
        item.bounds.h *= scale;
      }
    });
  }

  // creates SVG element for 'view'
  //
  function createSVG (view,elems) {
    let svg = document.createElementNS(SVGNS,"svg");
    for (let i=0; i<view.items.length; i++) {
      let item = view.items[i];
      if (item.tag == "screen" || item.tag == "backdrop") {
        svg.setAttribute("width",  "100%"); // item.bounds.w);
        svg.setAttribute("height", "100%"); // item.bounds.h);
        svg.setAttribute("class", "layoutview");
        if (item.element) {
          let prop = findElement(item.element, elems);
          if (prop && prop.items.length && prop.items[0].color)
            svg.style.backgroundColor = prop.items[0].color;
        }
        break;
      }
    }
    return svg;
  }

  // creates SVG text or rect element
  //
  function createItem (svg,item,elems) {
    let r = rect(item.bounds);
    svg.appendChild(r);
    let prop = findElement(item.element, elems);
    if (prop) {
      let def = findState(prop.defstate, prop.items);
      switch (def.tag) {
        case "text":
          let x = item.bounds.x + item.bounds.w / 2;
          let y = item.bounds.y + item.bounds.h / 2;
          let s = text(x,y, def.string);
          if (def.color)
            s.setAttribute("fill", def.color);
          svg.appendChild(s);
          break;
        case "rect":
          if (def.color)
            r.setAttribute("fill", def.color);
          break;
      }
    }
    return r;
  }
  
  function rect (bounds, cls) {
    var r = document.createElementNS(SVGNS,"rect");
    if (cls) r.setAttribute("class", cls);
    r.setAttribute("x", bounds.x);
    r.setAttribute("y", bounds.y);
    r.setAttribute("width",  bounds.w);
    r.setAttribute("height", bounds.h);
    return r;
  }
  
  function text (x,y, s, cls) {
    var t = document.createElementNS(SVGNS,"text");
    if (cls) t.setAttribute("class", cls);
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("dominant-baseline", "middle");
    var content = document.createTextNode(s);
    t.appendChild(content);
    return t;
  }

  function findElement (name, elements) {
    for (let i=0; i<elements.length; i++)
      if (elements[i].name == name) return elements[i];
    return null;
  }
  
  function findState (state, items) {
    if (state.length) {
      for (let i=0; i<items.length; i++)
        if (items[i].state == state) return items[i];
    }
    else if (items.length > 0)
      return items[0];
    else return null;
  }
}
