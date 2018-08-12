//
//  osd.cpp
//  AMAME
//
//  Copyright © 2017-18 jariseon. All rights reserved.
//
#include "osd.h"

using namespace std;

namespace AMAME {

OSD::OSD(osd_options& options, onready listener) : osd_common_t(options), m_options(options), m_onready(listener) { }
OSD::~OSD() { }

void OSD::init(running_machine& machine)
{
	osd_common_t::init(machine);
	init_subsystems();
}

void OSD::init_subsystems()
{
	osd_common_t::init_subsystems();

	// FIXME these will leak
	m_midi = new VirtualMidiModule();
	m_sound = new VirtualAudioModule();

	VirtualAudioModule* vam = dynamic_cast<VirtualAudioModule*>(m_sound);
	vam->init(options());
	m_sound->m_sample_rate = options().sample_rate();
	m_sound->m_audio_latency = options().audio_latency();		// can we get lower than 1 ??
	m_webgui.init(&machine());
	m_onready(this);
}

// -- VIDEO
void OSD::video_register() {}
bool OSD::video_init() { return true; }
void OSD::video_exit() {}

// -- WINDOW
bool OSD::window_init() { return true; }
void OSD::window_exit() {}
void OSD::build_slider_list() {}
void OSD::update_slider_list() {}

// -- INPUT
void OSD::customize_input_type_list(simple_list<input_type_entry> &typelist) {}
bool OSD::input_init()	 { return false; }
void OSD::input_pause()	 {}
void OSD::input_resume() {}

} // namespace AMAME
