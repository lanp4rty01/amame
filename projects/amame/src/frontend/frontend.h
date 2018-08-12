//
//  frontend.h
//  AMAME
//  Copyright © 2017-18 jariseon. All rights reserved.
//
#ifndef frontend_h
#define frontend_h

#include "osd.h"
#include "emu.h"
#include <pthread.h>
#include <vector>
class Plugin;

namespace AMAME {
class MachineManager;
class VirtualAudioModule;

class Frontend
{
public:
	Frontend(Plugin* plug);
	virtual ~Frontend();
	bool init(float sr);
	void start();
	void stop();
	
	void renderAudio(float** inputs, float** outputs, uint32_t sampleFrames);
	bool addMidiEvent(uint8_t* data, uint32_t length);
	
private:
	// -- subsystems
	Plugin* m_plug;
	MachineManager* m_mm;
	OSD* m_osd;
	VirtualAudioModule* m_audioIO;
	
	// -- MAME delegates
	void osdReady(OSD* osd);
	void onMessage(rapidjson::Document& msg);
	void onMidi(uint8_t data);

	std::string getLayout(std::string model);

	pthread_t m_threadID;
	static void* mamethread(void* arg);
	float m_sampleRate;
	bool m_capturingSysex;
	std::vector<uint8_t> m_midiOut;
};

} // namespace AMAME
#endif
