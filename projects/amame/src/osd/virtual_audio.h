//
//  virtual_audio.h
//  AMAME
//  Copyright © 2018 jariseon. All rights reserved.
//
#ifndef amame_virtualaudio_h
#define amame_virtualaudio_h

#include "modules/osdmodule.h"
#include "modules/sound/sound_module.h"
#include "TPCircularBuffer.h"

namespace AMAME {

class VirtualAudioModule : public osd_module, public sound_module
{
public:
	VirtualAudioModule();
	virtual ~VirtualAudioModule();

	// -- osd_module
	int init(const osd_options& options) override;
	void exit()override;

	// -- sound_module
	void update_audio_stream(bool is_throttled, const int16_t *buffer, int samples_this_frame) override;
	void set_mastervolume(int attenuation) override;
	
	// -- amame
	void render(float** inputs, float** outputs, uint32_t sampleFrames);

private:
	TPCircularBuffer m_audioOut[2];
};

} // namespace AMAME
#endif // amame_virtualaudio_h
