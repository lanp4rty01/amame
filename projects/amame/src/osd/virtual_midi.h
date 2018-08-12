//
//  virtual_midi.h
//  AMAME
//  Copyright © 2018 jariseon. All rights reserved.
//
#ifndef amame_virtualmidi_h
#define amame_virtualmidi_h

#include "modules/osdmodule.h"
#include "modules/midi/midi_module.h"
#include "devdelegate.h"
#include "TPCircularBuffer.h"
#include <functional>

namespace AMAME {
class VirtualMidiDevice;

class VirtualMidiModule : public osd_module, public midi_module
{
public:
	VirtualMidiModule();
	virtual ~VirtualMidiModule();

	// -- osd_module
	int init(const osd_options& options) override;
	void exit()override;

	// -- midi_module
	osd_midi_device* create_midi_device() override;
	void list_midi_devices(void) override;

	// -- amame
	typedef delegate<void(uint8_t data)> onmidi;
	void onMidi(onmidi handler) { m_midiOut = handler; }
	bool addEvent(uint8_t* midiEvent, uint32_t nbytes);

private:
	friend class VirtualMidiDevice;
	TPCircularBuffer m_midiIn;
	onmidi m_midiOut;
};

class VirtualMidiDevice : public osd_midi_device
{
public:
	VirtualMidiDevice();
	virtual ~VirtualMidiDevice();
	
	bool open_input(const char *devname) override;
	bool open_output(const char *devname) override;
	void close() override;
	
	bool poll() override;
	int read(uint8_t *pOut) override;
	void write(uint8_t data) override;	
};

} // namespace AMAME
#endif // amame_virtualmidi_h
