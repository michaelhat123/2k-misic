; 2K Music Custom Installer Script
; Silently installs APO as "2K Music System Equalizer"

!include "MUI2.nsh"

Section "2K Music System Equalizer" SEC_EQ
  DetailPrint "Installing 2K Music System Equalizer..."
  
  ; Silent APO installation with no UI/registry entries
  ExecWait '"$INSTDIR\resources\2kmusic_equalizer.exe" /S /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /NOICONS /NODESKTOPICON /NOSTARTMENU'
  
  ; Wait for installation to complete
  Sleep 3000
  
  ; Hide APO from Programs list by removing registry entries
  DeleteRegKey HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\EqualizerAPO"
  DeleteRegKey HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\EqualizerAPO"
  
  ; Remove APO shortcuts
  Delete "$DESKTOP\Equalizer APO.lnk"
  Delete "$STARTMENU\Programs\Equalizer APO\*.*"
  RMDir "$STARTMENU\Programs\Equalizer APO"
  
  ; Rename APO service to 2K Music branding
  ExecWait 'sc config "EqualizerAPO" DisplayName="2K Music Audio Service"'
  
  DetailPrint "2K Music System Equalizer installed successfully"
SectionEnd

Section "Hide APO Files" SEC_HIDE
  ; Set files as hidden/system to prevent discovery
  ExecWait 'attrib +H +S "$PROGRAMFILES\EqualizerAPO\Editor.exe"'
  
  ; Set files as hidden/system
  ExecWait 'attrib +H +S "$PROGRAMFILES\EqualizerAPO\*.*"'
SectionEnd
