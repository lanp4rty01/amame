//
//  plugin.cpp
//  AMAME
//  Copyright © 2018 jariseon. All rights reserved.
//
#include "plugin.h"
#include "frontend.h"
#include "gui.h"
#include <string>
using namespace std;

AudioEffect* createEffectInstance (audioMasterCallback audioMaster)
{
	return new Plugin(audioMaster);
}

Plugin::Plugin (audioMasterCallback audioMaster)
: AudioEffectX (audioMaster, 0,0), m_gui(nullptr), m_front(nullptr)
{
	setNumInputs(0);
	setNumOutputs(2);
	setUniqueID('amam');
	canProcessReplacing();
	isSynth();
}

Plugin::~Plugin () {}

VstInt32 Plugin::canDo (char* prop)
{
	string sprop = prop;
	if (sprop == "receiveVstMidiEvent")	return 1;
	return 0;
}

bool Plugin::getEffectName (char* name)
{
	vst_strncpy (name, "AMAME", kVstMaxEffectNameLen);
	return true;
}


// ------------------------------------------------------------------------------------------------
// lifecycle
// ------------------------------------------------------------------------------------------------

void Plugin::open()
{
	// -- gui
	string url = "http://127.0.0.1:8080/frontend.html";
	m_gui = new GUI(this, 787,186, url);
	setEditor(m_gui);
}

void Plugin::resume()
{
	sampleRate = getSampleRate();
	
	AudioEffectX::resume();
	if (!m_front) {
		m_front = new AMAME::Frontend(this);
		m_front->init(sampleRate);
		m_front->start();
	}
}

// ------------------------------------------------------------------------------------------------
// audio and midi io
// ------------------------------------------------------------------------------------------------

void Plugin::processReplacing (float** inputs, float** outputs, VstInt32 sampleFrames)
{
	m_front->renderAudio(inputs, outputs, sampleFrames);
}

VstInt32 Plugin::processEvents(VstEvents* ev)
{
	if (ev->numEvents == 0) return 0;

	for (int i=0; i<ev->numEvents; i++) {

		// -- non-sysex
		if ((ev->events[i])->type == kVstMidiType) {
			VstMidiEvent* me = (VstMidiEvent*)ev->events[i];
			m_front->addMidiEvent((uint8_t*)me->midiData, 3);
		}

		// -- sysex
		else if( (ev->events[i])->type == kVstSysExType) {
			VstMidiSysexEvent * event = (VstMidiSysexEvent*)ev->events[i];
			setSysex((uint8_t*)event->sysexDump, event->dumpBytes);
		}
	}
	return 0;
}

void Plugin::setSysex(uint8_t* data, uint32_t length)
{
	m_front->addMidiEvent(data, length);
}
