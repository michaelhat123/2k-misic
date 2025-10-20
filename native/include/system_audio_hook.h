#ifndef SYSTEM_AUDIO_HOOK_H
#define SYSTEM_AUDIO_HOOK_H

#include <windows.h>
#include <mmdeviceapi.h>
#include <audioclient.h>
#include <audiopolicy.h>
#include <endpointvolume.h>
#include <functiondiscoverykeys_devpkey.h>
#include <thread>
#include <atomic>
#include <memory>
#include "equalizer.h"

/**
 * System-wide Audio Hook using Windows WASAPI
 * Intercepts ALL audio output from the current process
 */
class SystemAudioHook {
public:
    SystemAudioHook();
    ~SystemAudioHook();

    // Initialize system audio capture
    bool initialize();
    
    // Start/stop audio interception
    bool startCapture();
    bool stopCapture();
    
    // Check if capturing
    bool isCapturing() const;
    
    // Get/set equalizer
    Equalizer* getEqualizer();
    void setEqualizer(std::shared_ptr<Equalizer> eq);
    
    // Enable/disable processing
    void setEnabled(bool enabled);
    bool isEnabled() const;

private:
    // COM interfaces
    IMMDeviceEnumerator* deviceEnumerator;
    IMMDevice* audioDevice;
    IAudioClient* audioClient;
    IAudioCaptureClient* captureClient;
    IAudioRenderClient* renderClient;
    
    // Audio format
    WAVEFORMATEX* waveFormat;
    UINT32 bufferFrameCount;
    
    // Processing
    std::shared_ptr<Equalizer> equalizer;
    std::atomic<bool> capturing;
    std::atomic<bool> enabled;
    std::thread captureThread;
    
    // Audio processing loop
    void audioProcessingLoop();
    
    // Helper methods
    bool initializeAudioDevice();
    bool initializeAudioClient();
    void cleanup();
    
    // Process audio buffer
    void processAudioBuffer(float* buffer, UINT32 numFrames, int channels);
};

#endif // SYSTEM_AUDIO_HOOK_H
