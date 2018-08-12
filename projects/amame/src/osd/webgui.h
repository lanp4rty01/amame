//
//  webgui.h
//  AMAME
//  Copyright © 2018 jariseon. All rights reserved.
//
#ifndef webgui_h
#define webgui_h

#include "emu.h"
#include <vector>
#include <string>
#include <rapidjson/document.h>

namespace AMAME {

class WebGUI
{
public:
	bool init(running_machine* machine);
	
	typedef delegate<void (rapidjson::Document& msg)> message_delegate;
	void onMessage(message_delegate handler) { m_onmessage = handler; }
	void postMessage(std::string msg);
	void postMessage(void* data, uint32_t length);

private:
	void on_open(http_manager::websocket_connection_ptr connection);
	void on_message(http_manager::websocket_connection_ptr connection, const std::string &payload, int opcode);
	void on_close(http_manager::websocket_connection_ptr connection, int status, const std::string& reason);
	void on_error(http_manager::websocket_connection_ptr connection, const std::error_code& error_code);
	static void output_notifier_callback(const char *outname, int32_t value, void *param);
	void output(const char *outname, int32_t value);
	void forwardMessage(std::string msg);

	running_machine* p_machine;
	std::vector<std::string> m_pendingMessages;
	std::vector<http_manager::websocket_connection_ptr> m_connections;
	message_delegate m_onmessage;
};

} // namespace AMAME
#endif // webgui_h
