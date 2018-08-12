//
//  frontend.cpp
//  AMAME
//  Copyright © 2017 jariseon. All rights reserved.
//
#include "frontend.h"
#include "machine_manager.h"
#include "virtual_audio.h"
#include "virtual_midi.h"
#include "plugin.h"
#include "gui.h"
#include "zlib.h"

#include "frontend/mame/mame.h"
#include "frontend/mame/mameopts.h"
using namespace std;
using namespace rapidjson;

namespace AMAME {

Frontend::Frontend(Plugin* plug) : m_plug(plug), m_osd(nullptr), m_audioIO(nullptr), m_capturingSysex(false) { }
Frontend::~Frontend() { }

bool Frontend::init(float sr)
{
	m_sampleRate = sr;
	return true;
}

void Frontend::start()
{
	pthread_attr_t attr;
	pthread_attr_init(&attr);
	pthread_create(&m_threadID, NULL, Frontend::mamethread, this);
}

void Frontend::stop()
{
	pthread_cancel(m_threadID);
}

bool Frontend::addMidiEvent(uint8_t* data, uint32_t nbytes)
{
	return m_osd->midi()->addEvent(data,nbytes);
}

void Frontend::renderAudio(float** inputs, float** outputs, uint32_t sampleFrames)
{
	if (m_audioIO)
		m_audioIO->render(inputs, outputs, sampleFrames);
}

void* Frontend::mamethread(void* arg)
{
	long res = 0;
	Frontend* self = (Frontend*)arg;
	
	// disable I/O buffering
	// setvbuf(stdout, (char *) nullptr, _IONBF, 0);
	// setvbuf(stderr, (char *) nullptr, _IONBF, 0);

	{
		osd_options options;
		OSD osd(options, OSD::onready(&Frontend::osdReady, self));
		osd.register_options();

		options.set_value(OPTION_UI_ACTIVE, "0", OPTION_PRIORITY_MAXIMUM);
		options.set_value(OPTION_HTTP, "1", OPTION_PRIORITY_MAXIMUM);
		options.set_value(OPTION_HTTP_PORT, "8080", OPTION_PRIORITY_MAXIMUM);
		options.set_value(OPTION_HTTP_ROOT, "/Users/jari/Documents/code/sdk/emu/mame/200/projects/amame/web", OPTION_PRIORITY_MAXIMUM);
		// options.set_value(OPTION_VERBOSE, "1", OPTION_PRIORITY_MAXIMUM);

		std::vector<std::string> args;
		args.push_back("./dummyappname");
		args.push_back("-w");
		args.push_back("-rp");						args.push_back("/Users/jari/Documents/code/sdk/emu/mame/roms"); ///ensoniq");
		args.push_back("-sr");						args.push_back(to_string(self->m_sampleRate)); // "48000");
		args.push_back("-audio_latency");	args.push_back("1");
		args.push_back("fb01"); // fb01");	vfx vfxsd
		args.push_back("-midiin");	args.push_back("IAC emuin");
		args.push_back("-midiout");	args.push_back("IAC emuout");
		// args.push_back("-verbose");

		mame_options::populate_hashpath_from_args_and_inis(options, args);
		options.parse_command_line(args, OPTION_PRIORITY_CMDLINE);
		
		std::ostringstream option_errors;
		if (options.read_config())
			mame_options::parse_standard_inis(options, option_errors);

		MachineManager mm(options, osd);
		self->m_mm  = &mm;
		self->m_osd = &osd;
		mm.start_http_server();
		mm.execute();	// blocks
	}

	pthread_exit((void*)res);
	return nullptr;
}

// install delegates
//
void Frontend::osdReady(OSD* osd)
{
	osd->gui().onMessage( WebGUI::message_delegate(&Frontend::onMessage, this) );
	osd->midi()->onMidi( VirtualMidiModule::onmidi(&Frontend::onMidi, this) );
	m_audioIO = osd->audio();
}

// messages from webgui appear here
//
void Frontend::onMessage(rapidjson::Document& msg)
{
	string verb = msg["verb"].GetString();
	string prop = msg["prop"].GetString();
	
	if (verb == "set") {
	
		if (prop == "size") {
			int w = msg["width"].GetInt();
			int h = msg["height"].GetInt();
			m_plug->gui()->resize(w,h);
		}
		
		else if (prop == "device") {
			string device = msg["data"].GetString();
			m_mm->schedule_new_driver(device);
		}
	}
	
	else if (verb == "get") {
		if (prop == "layout") {
			string device = msg["data"].GetString();
			string layout = getLayout(device);
			string escaped;
			for (char c : layout)
				if (c == '"') escaped += "\\\"";
				else if (isprint(c)) escaped += c;
			static string body = "{ \"type\":\"amame\", \"verb\":\"set\", \"prop\":\"layout\", \"value\":\"";
			string msg = body + escaped + "\"}";
			m_osd->gui().postMessage(msg);
		}
	}
	
	else if (verb == "add") {
		if (prop == "midi") {
			uint8_t midi[3];
			const Value& arr = msg["data"];
			for (int i=0; i<3; i++)
				midi[i] = (uint8_t)arr[i].GetInt();
			addMidiEvent(midi, 3);
		}
	}
	
	else if (prop == "sysex") {
		if (verb == "load")
			m_plug->gui()->load();
		else {
			if (verb == "save")
				m_plug->gui()->save("amame.syx", m_midiOut.data(), (uint32_t)m_midiOut.size());
			else m_midiOut.clear();
		}
	}
}

// midi from mame appears here
//
void Frontend::onMidi(uint8_t data)
{
	if (!m_capturingSysex) {
		if (data != 0xF0) return;
		m_capturingSysex = true;
	}
	if (m_capturingSysex) {
		m_midiOut.push_back(data);
		if (data == 0xF7) m_capturingSysex = false;
		
		static string body = "{ \"type\":\"amame\", \"verb\":\"set\", \"prop\":\"sysexLength\", \"value\":";
		string msg = body + std::to_string(m_midiOut.size()) + "}";
		m_osd->gui().postMessage(msg);
	}
}

// from render.cpp
string Frontend::getLayout(string model)
{
	const internal_layout* layout;
	m_osd->machine().config().apply_default_layouts(
		[this, &layout] (device_t &dev, internal_layout const &L) { layout = &L; });
	
	if (layout) {
		auto tempout = make_unique_clear<u8[]>(layout->decompressed_size + 1);
		z_stream stream;

		/* initialize the stream */
		memset(&stream, 0, sizeof(stream));
		stream.next_out = tempout.get();
		stream.avail_out = (uint)layout->decompressed_size;

		int zerr = inflateInit(&stream);
		if (zerr != Z_OK) return "";

		/* decompress this chunk */
		stream.next_in = (unsigned char*)layout->data;
		stream.avail_in = (uint)layout->compressed_size;
		zerr = inflate(&stream, Z_NO_FLUSH);

		/* stop at the end of the stream */
		if (zerr == Z_STREAM_END) {}
		else if (zerr != Z_OK) return "";

		/* clean up */
		zerr = inflateEnd(&stream);
		if (zerr != Z_OK) return "";
		
		return (const char*)tempout.get();
	}
	else return "";
}

} // namespace AMAME
