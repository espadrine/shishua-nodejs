build/Release/addon.node: *.cc *.h *.gyp
	node-gyp configure
	node-gyp build
