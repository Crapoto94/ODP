@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "%~dp0"
echo Using JAVA_HOME: %JAVA_HOME%
call gradlew.bat assembleDebug --info
