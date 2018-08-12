//
//  osd.h
//  AMAME
//
//  Copyright © 2017-18 jariseon. All rights reserved.
//
#ifndef amame_osd_h
#define amame_osd_h

#include "modules/lib/osdobj_common.h"
#include "webgui.h"
#include "virtual_audio.h"
#include "virtual_midi.h"

namespace AMAME {

class OSD : public osd_common_t
{
public:
	typedef delegate<void(OSD*)> onready;
	
	OSD(osd_options& options, onready listener);
	virtual ~OSD();
	
	void init(running_machine& machine) override;
	void init_subsystems() override;
	
	virtual void customize_input_type_list(simple_list<input_type_entry> &typelist) override;
	
	virtual void video_register() override;
	virtual bool video_init() override;
	virtual void video_exit() override;
	
	virtual bool window_init() override;
	virtual void window_exit() override;
	virtual void build_slider_list() override;
	virtual void update_slider_list() override;

	virtual osd_options &options() override { return m_options; }
	
public:
	virtual void input_resume() override;
protected:
	virtual bool input_init() override;
	virtual void input_pause() override;
	
// -- subsystems
public:
	WebGUI& gui() { return m_webgui; }
	VirtualAudioModule* audio() { return dynamic_cast<VirtualAudioModule*>(m_sound); }
	VirtualMidiModule*  midi()  { return dynamic_cast<VirtualMidiModule*>(m_midi); }
private:
	WebGUI m_webgui;
	osd_options &m_options;
	onready m_onready;
};

} // namespace AMAME
#endif // amame_osd_h
