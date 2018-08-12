//
//  machine_manager.cpp
//  AMAME
//  Copyright © 2017-18 jariseon. All rights reserved.
//
#include "machine_manager.h"
#include "osd.h"

#include "emuopts.h"
#include "frontend/mame/mameopts.h"
#include "validity.h"
#include "ui/uimain.h"
#include "drivenum.h"

using namespace std;

namespace AMAME {

MachineManager::MachineManager(emu_options& options, OSD& osd)
: machine_manager(options,osd),
	m_new_driver_pending(nullptr),
	m_firstrun(true)
{
	m_osd = (OSD*)&osd;
}

MachineManager::~MachineManager()
{
}

void MachineManager::schedule_new_driver(string driverName)
{
	int i = driver_list::find(driverName.c_str());
	if (i >= 0) {
		m_new_driver_pending = &driver_list::driver(i);
		machine()->schedule_hard_reset();
	}
}

// from mame_machine_manager (mame.c)
int MachineManager::execute()
{
	bool started_empty = false;
	bool firstgame = true;

	// loop across multiple hard resets
	bool exit_pending = false;
	int error = EMU_ERR_NONE;

	while (error == EMU_ERR_NONE && !exit_pending)
	{
		m_new_driver_pending = nullptr;

		// if no driver, use the internal empty driver
		const game_driver *system = mame_options::system(m_options);
		if (system == nullptr)
		{
			system = &GAME_NAME(___empty);
			if (firstgame)
				started_empty = true;
		}

		firstgame = false;

		// parse any INI files as the first thing
		if (m_options.read_config())
		{
			std::ostringstream errors;
			mame_options::parse_standard_inis(m_options, errors);
		}

		// otherwise, perform validity checks before anything else
		bool is_empty = (system == &GAME_NAME(___empty));
		if (!is_empty)
		{
			validity_checker valid(m_options);
			valid.set_verbose(false);
			valid.check_shared_source(*system);
		}

		// create the machine configuration
		machine_config config(*system, m_options);

		// create the machine structure and driver
		running_machine machine(config, *this);

		set_machine(&machine);

		// run the machine
		error = machine.run(is_empty);
		m_firstrun = false;

		// check the state of the machine
		if (m_new_driver_pending)
		{
			// set up new system name and adjust device options accordingly
			m_options.set_system_name(m_new_driver_pending->name);
			m_firstrun = true;
		}
		else
		{
			if (machine.exit_pending())
				m_options.set_system_name("");
		}

		if (machine.exit_pending() && (!started_empty || is_empty))
			exit_pending = true;

		// machine will go away when we exit scope
		set_machine(nullptr);
	}
	// return an error
	return error;
}

ui_manager* MachineManager::create_ui(running_machine& machine) { return new ui_manager(machine); }
void MachineManager::ui_initialize(running_machine& machine) {}
void MachineManager::create_custom(running_machine& machine) {}
void MachineManager::load_cheatfiles(running_machine& machine) {}

} // namespace AMAME


void emulator_info::display_ui_chooser(running_machine& machine) {}
void emulator_info::draw_user_interface(running_machine& machine) {}
void emulator_info::periodic_check() {}
void emulator_info::layout_file_cb(util::xml::data_node const &layout) {}
bool emulator_info::frame_hook() { return false; }
bool emulator_info::standalone() { return false; }

#define APPNAME					"AMAME"
#define APPNAME_LOWER		"amame"
#define CONFIGNAME			"configname"
#define COPYRIGHT				"copyright"
#define COPYRIGHT_INFO	"copyright_info"
#define BUILD_VERSION		BARE_BUILD_VERSION

const char * emulator_info::get_appname()					{ return APPNAME; }
const char * emulator_info::get_appname_lower()		{ return APPNAME_LOWER; }
const char * emulator_info::get_configname()			{ return CONFIGNAME; }
const char * emulator_info::get_copyright()				{ return COPYRIGHT; }
const char * emulator_info::get_copyright_info()	{ return COPYRIGHT_INFO; }
const char * emulator_info::get_build_version()		{ return build_version; }
const char * emulator_info::get_bare_build_version() { return bare_build_version; }
