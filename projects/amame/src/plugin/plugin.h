//
//  plugin.h
//  AMAME
//  Copyright © 2018 jariseon. All rights reserved.
//
#ifndef plugin_h
#define plugin_h

#include "audioeffectx.h"
#include "frontend.h"
class GUI;

class Plugin : public AudioEffectX
{
public:
	Plugin (audioMasterCallback audioMaster);
	virtual ~Plugin ();
	VstInt32 canDo (char* prop) override;
	bool getEffectName (char* name) override;

	// -- lifecycle
	void open() override;
	void resume() override;

	// -- audio and midi io
	VstInt32 processEvents(VstEvents* ev) override;
	void processReplacing (float** inputs, float** outputs, VstInt32 sampleFrames) override;
	void setSysex(uint8_t* data, uint32_t length);

	GUI* gui() { return m_gui; }

private:
	GUI* m_gui;
	AMAME::Frontend* m_front;
};

#endif // plugin_h
