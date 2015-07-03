Tab Sidebar
=======================

Tab Sidebar is an Opera 30+ extension for tab management. Tabs can be displayed in the sidebar with different combinable view options, like with thumbnails, in a tree structure or with reduced size. Tabs and even their content can be easily searched, closed tabs viewed and restored, duplicate tabs closed and even all tabs sorted and rearanged within a few clicks. 

##Environment##
* Node.js (http://nodejs.org/)

##Build##

| command             	| effect                                                                                         	|
|---------------------	|------------------------------------------------------------------------------------------------	|
| npm install         	| downloads and installs all dependencies                                                        	|
| npm run gulp        	| builds all scripts and creates a runnable extension in /src                                    	|
| npm run gulpwatch   	| builds all scripts and sets a watcher for /react_components (rebuilds if changes are detected) 	|
| npm run gulpoptions 	| builds the option page scripts                                                                 	|
| npm run gulprelease 	| builds a release version in /release with minification and disabled debugging                  	|

##Steps##
Navigate into the /src directory and use the console:

    npm install
    npm run gulpwatch

Now open Opera's Extension Manager and activate 'Developer mode' (top right corner).
'Load unpacked extension...' -> select the /src directory.

Now the extension should be build and running in Opera.