//
//  virtual_midi.cpp
//  AMAME
//  Copyright © 2018 jariseon. All rights reserved.
//

#include "virtual_midi.h"
using namespace std;

namespace AMAME {

// how to get VirtualMidiModule from VirtualMidiDevice ??
// this is rather inelegant though efficient
static VirtualMidiModule* g_vmm = nullptr;


// ------------------------------------------------------------------------------------------------
//
//
VirtualMidiModule::VirtualMidiModule() : osd_module(OSD_MIDI_PROVIDER, "amame"), midi_module()
{
	// -- although sysex messages can be large, 64K might be an overkill
	TPCircularBufferInit(&m_midiIn,  65535);
	g_vmm = this;
}

VirtualMidiModule::~VirtualMidiModule()
{
	TPCircularBufferCleanup(&m_midiIn);
}

int VirtualMidiModule::init(const osd_options& options) { return 0; }
void VirtualMidiModule::exit() { }

osd_midi_device* VirtualMidiModule::create_midi_device() { return global_alloc(VirtualMidiDevice()); }
void VirtualMidiModule::list_midi_devices(void) { }

//
// adds a single midi/sysex event to the circular buffer
//
bool VirtualMidiModule::addEvent(uint8_t* data, uint32_t nbytes)
{
	if (data && nbytes > 0) {
		uint32_t bytesFree;
		uint8_t* buf = (uint8_t*)TPCircularBufferHead(&m_midiIn, &bytesFree);
		if (bytesFree > nbytes) {
			memcpy(buf, data, nbytes);
			TPCircularBufferProduce(&m_midiIn, nbytes);
			return true;
		}
	}
	return false;
}

// ------------------------------------------------------------------------------------------------
//
//
VirtualMidiDevice::VirtualMidiDevice()  { }
VirtualMidiDevice::~VirtualMidiDevice() { }

bool VirtualMidiDevice::open_input(const char* devname)  { return true; }
bool VirtualMidiDevice::open_output(const char* devname) { return true; }

// -- close both ports
void VirtualMidiDevice::close() { }

bool VirtualMidiDevice::poll()
{
	return g_vmm->m_midiIn.fillCount > 0;
}

int VirtualMidiDevice::read(uint8_t* pOut)
{
	uint32_t nbytes;
	uint8_t* buf = (uint8_t*)TPCircularBufferTail(&g_vmm->m_midiIn, &nbytes);
	if (nbytes > 0) {
		memcpy(pOut, buf, nbytes);
		TPCircularBufferConsume(&g_vmm->m_midiIn, nbytes);
	}
	return nbytes;
}

// output is a delegate
void VirtualMidiDevice::write(uint8_t data)
{
	if (!g_vmm->m_midiOut.isnull()) g_vmm->m_midiOut(data);
}

} // namespace AMAME

