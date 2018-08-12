//
//  machine_manager.h
//  AMAME
//  Copyright © 2017-18 jariseon. All rights reserved.
//
#ifndef MachineManager_h
#define MachineManager_h

#include "emu.h"
#include "frontend/mame/mame.h"

namespace AMAME {
class OSD;

class MachineManager : public machine_manager
{
public:
	MachineManager(emu_options &options, OSD &osd);
	virtual ~MachineManager();
	int execute();
	void schedule_new_driver(std::string driverName);

	// -- machine_manager
	virtual ui_manager* create_ui(running_machine& machine);
	virtual void create_custom(running_machine& machine);
	virtual void load_cheatfiles(running_machine& machine);
	virtual void ui_initialize(running_machine& machine);
	
private:
	OSD* m_osd;
	const game_driver *     m_new_driver_pending;   // pointer to the next pending driver
	bool                    m_firstrun;
};

} // namespace AMAME
#endif
