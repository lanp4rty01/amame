//
//  gui.h
//  AMAME
//  Copyright © 2018 jariseon. All rights reserved.
//
#ifndef gui_h
#define gui_h

#include <string>
#include "aeffeditor.h"
class AudioEffectX;

class GUI : public AEffEditor
{
public:
	GUI(AudioEffectX* plug, int w, int h, std::string url);
	virtual bool getRect (ERect** rect) override;
	virtual bool open (void* ptr) override;
	virtual void close () override;
	void createWebView (void* ptr);
	void resize(int w, int h);

	void load();
	void save(std::string filename, uint8_t* data, uint32_t byteLength);
	
protected:
	ERect m_bounds;
	std::string m_url;
};

#endif // gui_h
