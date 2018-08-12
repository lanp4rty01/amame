//
//  webgui.cpp
//  AMAME
//  Copyright © 2018 jariseon. All rights reserved.
//

#include "webgui.h"

using namespace std;
using namespace rapidjson;

namespace AMAME {

bool WebGUI::init(running_machine* machine)
{
	p_machine = machine;
	
	// -- websocket callbacks
	http_manager* webserver = machine->manager().http();
	using namespace std::placeholders;
	if (webserver && webserver->is_active()) {
		webserver->add_endpoint("/amame/socket",
			std::bind(&WebGUI::on_open, this, _1),
			std::bind(&WebGUI::on_message, this, _1, _2, _3),
			std::bind(&WebGUI::on_close, this, _1, _2, _3),
			std::bind(&WebGUI::on_error, this, _1, _2));
	}

	// -- output manager notifications
	machine->output().set_notifier(nullptr, output_notifier_callback, this);
	
	return true;
}

// ----------------------------------------------------------------------------
// websocket lifecycle callbacks
// connections are stored in a vector to enable any number of displays with synced contents
// for example, webview embedded in VST plugin + browser window in tablet
//
void WebGUI::on_open(http_manager::websocket_connection_ptr conn) { m_connections.push_back(conn); }
void WebGUI::on_close(http_manager::websocket_connection_ptr conn, int status, const std::string& reason)
{
	auto it = std::find(m_connections.begin(), m_connections.end(), conn);
	if (it != m_connections.end())
		m_connections.erase(it);
}
void WebGUI::on_error(http_manager::websocket_connection_ptr conn, const std::error_code& error_code) { }


// ----------------------------------------------------------------------------
// websocket messages from browser/webview appear here
//
void WebGUI::on_message(http_manager::websocket_connection_ptr connection, const std::string &payload, int opcode)
{
	Document msg;
	msg.Parse(payload.c_str());
	
	if (!msg.IsObject()) return;
	if (!msg.HasMember("type")) return;
	string type = msg["type"].GetString();

	// -- mame layout element value changed
	// -- forward to driver INPUT_PORTS
	if (type == "mame") {
		const ioport_list& ports = p_machine->ioport().ports();
		auto it = ports.find(msg["tag"].GetString());
		if (it != ports.end()) {
			int mask  = msg["mask"].GetInt();
			int value = msg["value"].GetInt();
			for (auto& field : it->second->fields()) {
				if (field.mask() == mask)
					field.set_value(value);
			}
		}
	}

	// -- pass other messages to delegate
	else if (type == "amame")
		m_onmessage(msg);
}


// ----------------------------------------------------------------------------
// output manager notifications (i.e., display content) appear here
// forward to webview/browser
//
void WebGUI::output_notifier_callback(const char *outname, int32_t value, void *param)
{
	static_cast<WebGUI*>(param)->output(outname, value);
}

void WebGUI::output(const char *outname, int32_t value)
{
	// for now just pass as an array
	string s = "[\"";
	s += outname;
	s += "\"," + to_string(value) + "]";

	forwardMessage(s);
}

void WebGUI::postMessage(void* data, uint32_t length)
{
	string s = "[";
	uint8_t* udata = (uint8_t*)data;
	for (int i=0; i<length; i++) {
		s += to_string(udata[i]);
		if (i < length-1) s += ",";
	}
	s += "]";
	
	forwardMessage(s);
}

// private helper
void WebGUI::forwardMessage(string msg)
{
	// -- if webview/browser is not open yet, store to pending message vector
	// -- otherwise push directly through websocket
	if (m_connections.size() > 0) {
		if (m_pendingMessages.size() > 0) {
			for (auto m : m_pendingMessages)
				postMessage(m);
			m_pendingMessages.clear();
		}
		postMessage(msg);
	}
	else m_pendingMessages.push_back(msg);
}

void WebGUI::postMessage(string msg)
{
	// -- iterate through all active websocket connections
	for (auto conn : m_connections)
		conn->send_message(msg, 1);
}

} // namespace AMAME
