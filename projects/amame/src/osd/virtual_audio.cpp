//
//  virtual_audio.cpp
//  AMAME
//  Copyright © 2018 jariseon. All rights reserved.
//

#include "virtual_audio.h"

namespace AMAME {

// ------------------------------------------------------------------------------------------------
//
//
VirtualAudioModule::VirtualAudioModule() : osd_module(OSD_SOUND_PROVIDER, "amame"), sound_module() { }
VirtualAudioModule::~VirtualAudioModule() { }

int VirtualAudioModule::init(const osd_options& options)
{
	uint32_t length = 8 * 960 * sizeof(float);
	TPCircularBufferInit(&m_audioOut[0], length);
	TPCircularBufferInit(&m_audioOut[1], length);
	return 0;
}

void VirtualAudioModule::exit()
{
	TPCircularBufferCleanup(&m_audioOut[0]);
	TPCircularBufferCleanup(&m_audioOut[1]);
}

// samples_this_frame == 960
void VirtualAudioModule::update_audio_stream(bool is_throttled, const int16_t* buffer, int samples_this_frame)
{
	if (!sample_rate()) return;

	static float scaler = 1./32767;
	uint32_t bytesFree;
	uint32_t bytesAvailable = samples_this_frame * sizeof(int16_t);
	
	float* audioL = (float*)TPCircularBufferHead(&m_audioOut[0], &bytesFree);
	float* audioR = (float*)TPCircularBufferHead(&m_audioOut[1], &bytesFree);

	bytesAvailable *= 2;
	if (bytesFree >= bytesAvailable) {
		int i = 0;
		for (int n=0; n<samples_this_frame; n++) {
			audioL[n] = buffer[i++] * scaler;
			audioR[n] = buffer[i++] * scaler;
		}
		TPCircularBufferProduce(&m_audioOut[0], bytesAvailable);
		TPCircularBufferProduce(&m_audioOut[1], bytesAvailable);
	}
	// else printf("overflow %d %d %d\n", samples_this_frame, bytesAvailable, bytesFree);
}

void VirtualAudioModule::set_mastervolume(int attenuation) { }

void VirtualAudioModule::render(float** inputs, float** outputs, uint32_t sampleFrames)
{
	uint32_t bytesAvailable;
	uint32_t bytesRequired = sampleFrames * sizeof(float);
	
	float* vstL = outputs[0];
	float* vstR = outputs[1];
	float* mameL = (float*)TPCircularBufferTail(&m_audioOut[0], &bytesAvailable);
	float* mameR = (float*)TPCircularBufferTail(&m_audioOut[1], &bytesAvailable);
	
	if (bytesAvailable >= bytesRequired) {
		memcpy(vstL, mameL, bytesRequired);
		memcpy(vstR, mameR, bytesRequired);
		TPCircularBufferConsume(&m_audioOut[0], bytesRequired);
		TPCircularBufferConsume(&m_audioOut[1], bytesRequired);
	}
	else {
		memset(vstL, 0, bytesRequired);
		memset(vstR, 0, bytesRequired);
		// printf("underflow\n");
	}
}

} // namespace AMAME
