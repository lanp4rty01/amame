//
//  gui.mm
//  AMAME
//  Copyright © 2018 jariseon. All rights reserved.
//
#include "gui.h"
#include "plugin.h"
#import <WebKit/WebKit.h>
using namespace std;


GUI::GUI(AudioEffectX* plug, int w, int h, string url) : AEffEditor(plug)
{
	m_bounds.top  = 0;
	m_bounds.left = 0;
	m_bounds.right  = w;
	m_bounds.bottom = h;
	m_url = url;
}

bool GUI::getRect(ERect** rect)
{
	*rect = &m_bounds;
	return true;
}

bool GUI::open (void* ptr)
{
	createWebView(ptr);
	return AEffEditor::open(ptr);
}

void GUI::close ()
{
	AEffEditor::close();
}

static WKWebView* webView;
static WKWebViewConfiguration* webConfig;

void GUI::createWebView (void* ptr)
{
	webConfig = [[WKWebViewConfiguration alloc] init];
	
	// -- for debugging : right-click to get web inspector
	WKPreferences* preferences = [[WKPreferences alloc] init] ;
	[preferences setValue:@YES forKey:@"developerExtrasEnabled"];
	webConfig.preferences = preferences;
	
	float w = m_bounds.right - m_bounds.left;
	float h = m_bounds.bottom - m_bounds.top;
	webView = [[WKWebView alloc]initWithFrame:NSMakeRect(0,0,w,h) configuration:webConfig];
	NSView* view = (__bridge NSView*)ptr;
	[view addSubview:webView];

	NSString* url = [NSString stringWithUTF8String:m_url.c_str()];
	NSURL* nsurl = [NSURL URLWithString:url relativeToURL:nil];
	NSURLRequest* req = [[NSURLRequest alloc] initWithURL:nsurl];
	[webView loadRequest:req];
}

void GUI::resize(int w, int h)
{
	dispatch_async(dispatch_get_main_queue(), ^{
		NSRect frame = [webView frame];
		frame.size.width  = w;
		frame.size.height = h;
		webView.frame = frame;
    ((AudioEffectX*)effect)->sizeWindow(w,h);
	});
}

void GUI::load()
{
	dispatch_async(dispatch_get_main_queue(), ^{
		NSOpenPanel* panel = [NSOpenPanel openPanel];
		[panel beginWithCompletionHandler:^(NSInteger result) {
			if (result == NSModalResponseOK) {
				NSURL* nsurl = [[panel URLs]objectAtIndex:0];
				NSData* nsdata = [NSData dataWithContentsOfFile:[nsurl path]];
				Plugin* plug = (Plugin*)effect;
				plug->setSysex((uint8_t*)[nsdata bytes], (uint32_t)[nsdata length]);
			}
		}];
	});
}

void GUI::save(string filename, uint8_t* data, uint32_t byteLength)
{
	dispatch_async(dispatch_get_main_queue(), ^{
		NSSavePanel* panel = [NSSavePanel savePanel];
		[panel setNameFieldStringValue: [NSString stringWithCString:filename.c_str() encoding:[NSString defaultCStringEncoding]]];
		[panel beginWithCompletionHandler:^(NSInteger result) {
			if (result == NSModalResponseOK) {
				NSData* nsdata = [NSData dataWithBytesNoCopy:data length:byteLength freeWhenDone:NO];
				[nsdata writeToFile:[[panel URL] path] atomically:YES];
			}
		}];
	});
}
