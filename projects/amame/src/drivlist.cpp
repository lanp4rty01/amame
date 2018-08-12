#include "emu.h"

#include "drivenum.h"

GAME_EXTERN(___empty);
GAME_EXTERN(eps);
GAME_EXTERN(eps16p);
GAME_EXTERN(fb01);
GAME_EXTERN(sd1);
GAME_EXTERN(sd132);
GAME_EXTERN(sq1);
GAME_EXTERN(sq2);
GAME_EXTERN(sqrack);
GAME_EXTERN(vfx);
GAME_EXTERN(vfxsd);

const game_driver * const driver_list::s_drivers_sorted[11] =
{
	&GAME_NAME(___empty),
	&GAME_NAME(eps),
	&GAME_NAME(eps16p),
	&GAME_NAME(fb01),
	&GAME_NAME(sd1),
	&GAME_NAME(sd132),
	&GAME_NAME(sq1),
	&GAME_NAME(sq2),
	&GAME_NAME(sqrack),
	&GAME_NAME(vfx),
	&GAME_NAME(vfxsd),
};

std::size_t const driver_list::s_driver_count = 11;

