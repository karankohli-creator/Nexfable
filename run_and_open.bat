@echo off
rem Start the Node server in a new window
start "" cmd /c "node server.mjs"
rem Wait a few seconds for the server to start
ping -n 5 127.0.0.1 >nul
rem Open the default browser to the site
start http://localhost:3000
