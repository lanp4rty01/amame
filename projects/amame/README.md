## Design Thoughts ##

AMAME provides a custom OSD and a tiny Frontend. The latter has only limited interest outside this project, but the OSD solution might be useful for upstream MAME. One of the goals in OSD design was to provide a generic solution for web based MAME front panels: instead of driver specific solutions (such as the current `mame/machine/esqpanel.cpp`), the OSD here relies on existing layout/input/output system, and as a result requires only minimal (if any) changes in drivers and MAME core when remoting the GUI.

### OSD ###

* virtual audio and midi streams
* webgui with HTML/CSS/JS panels
* fallback to .lay files if custom html is unavailable

**audio and midi streams** are implemented as lock-free ring buffers, which are thread safe for single producer/consumer scenarios. _virtual_ here means that the streams are not connected to operating system audio pipeline. They operate rather as virtual audio cables which are easy to interface from a hosting app (in this case, VST2 plugin).

**webgui** is rendered in an embedded webview, but also accessible from browsers. Multiple clients may share a single target driver/plugin, and changes made in one client are replicated in other GUIs. The files are served from local file system using MAME core http and websocket servers. The glue code is in `amame/src/osd/webgui.cpp`, and the implementation relies on existing input and output subsystems as follows:

User **input** is routed to driver's INPUT_PORT maps in webgui.cpp. This is in general transparent to drivers (e.g. `mame/drivers/fb01.cpp` did not require any related changes). I added a convenience IPT\_SCALAR port type to model digital inputs with a range (`emu/ioport.cpp`, similar to analog ports). Although that is not mandatory, it simplifies driver input map implementations (see es5506.cpp which has a boatload of buttons in its front panel).

MAME **output** is captured from output\_manager notifications (see hd44780.cpp) and forwarded to the webgui over websocket transport (webgui.cpp).

message payload is in JSON encoded RESTful content format { type, verb, prop, data }. MAME output is passed just as JSON key-value pairs, where indexed value is encoded in HIWORD(value) and the actual value is in LOWORD. Key is a string.

If the frontend cannot load a html panel, it fetches the layout file and turns that into html. Layout format file fallback is implemented using XSLT and JSON/JS in `amame/web/amame/layout.js`. 

### Frontend ###

* operates as a bridge between audio plugin / standalone audio app
* launches MAME in a separate thread
* driver hot swapping
* sysex import and export
* virtual midi keyboard

## commits ##
initial changes to MAME core are in this commit, and changes to drivers and devices are here.

## todo ##

- [ ] support for multiple front panel layouts per driver
- [ ] can MAME core http/ws servers be shared between plugin instances ?

