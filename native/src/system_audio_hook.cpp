#include "system_audio_hook.h"
#include <iostream>
#include <comdef.h>

// WASAPI constants
const CLSID CLSID_MMDeviceEnumerator = __uuidof(MMDeviceEnumerator);
const IID IID_IMMDeviceEnumerator = __uuidof(IMMDeviceEnumerator);
const IID IID_IAudioClient = __uuidof(IAudioClient);
const IID IID_IAudioCaptureClient = __uuidof(IAudioCaptureClient);
const IID IID_IAudioRenderClient = __uuidof(IAudioRenderClient);

SystemAudioHook::SystemAudioHook()
    : deviceEnumerator(nullptr), audioDevice(nullptr), audioClient(nullptr),
      captureClient(nullptr), renderClient(nullptr), waveFormat(nullptr),
      bufferFrameCount(0), capturing(false), enabled(true) {
    
    // Initialize COM
    CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    
    // Create default equalizer
    equalizer = std::make_shared<Equalizer>(44100.0);
}

SystemAudioHook::~SystemAudioHook() {
    stopCapture();
    cleanup();
    CoUninitialize();
}

bool SystemAudioHook::initialize() {
    HRESULT hr;
    
    // Create device enumerator
    hr = CoCreateInstance(
        CLSID_MMDeviceEnumerator, nullptr,
        CLSCTX_ALL, IID_IMMDeviceEnumerator,
        (void**)&deviceEnumerator);
    
    if (FAILED(hr)) {
        std::cerr << "Failed to create device enumerator: " << std::hex << hr << std::endl;
        return false;
    }
    
    if (!initializeAudioDevice()) {
        return false;
    }
    
    if (!initializeAudioClient()) {
        return false;
    }
    
    std::cout << "System audio hook initialized successfully" << std::endl;
    return true;
}

bool SystemAudioHook::initializeAudioDevice() {
    HRESULT hr;
    
    // Get default audio endpoint (speakers/headphones)
    hr = deviceEnumerator->GetDefaultAudioEndpoint(
        eRender, eConsole, &audioDevice);
    
    if (FAILED(hr)) {
        std::cerr << "Failed to get default audio endpoint: " << std::hex << hr << std::endl;
        return false;
    }
    
    return true;
}

bool SystemAudioHook::initializeAudioClient() {
    HRESULT hr;
    
    // Activate audio client
    hr = audioDevice->Activate(
        IID_IAudioClient, CLSCTX_ALL,
        nullptr, (void**)&audioClient);
    
    if (FAILED(hr)) {
        std::cerr << "Failed to activate audio client: " << std::hex << hr << std::endl;
        return false;
    }
    
    // Get mix format
    hr = audioClient->GetMixFormat(&waveFormat);
    if (FAILED(hr)) {
        std::cerr << "Failed to get mix format: " << std::hex << hr << std::endl;
        return false;
    }
    
    // Initialize audio client for loopback capture
    hr = audioClient->Initialize(
        AUDCLNT_SHAREMODE_SHARED,
        AUDCLNT_STREAMFLAGS_LOOPBACK,
        10000000, // 1 second buffer
        0,
        waveFormat,
        nullptr);
    
    if (FAILED(hr)) {
        std::cerr << "Failed to initialize audio client: " << std::hex << hr << std::endl;
        return false;
    }
    
    // Get buffer size
    hr = audioClient->GetBufferSize(&bufferFrameCount);
    if (FAILED(hr)) {
        std::cerr << "Failed to get buffer size: " << std::hex << hr << std::endl;
        return false;
    }
    
    // Get capture client
    hr = audioClient->GetService(IID_IAudioCaptureClient, (void**)&captureClient);
    if (FAILED(hr)) {
        std::cerr << "Failed to get capture client: " << std::hex << hr << std::endl;
        return false;
    }
    
    // Update equalizer sample rate
    if (equalizer && waveFormat) {
        equalizer = std::make_shared<Equalizer>(waveFormat->nSamplesPerSec);
    }
    
    std::cout << "Audio client initialized - Sample Rate: " << waveFormat->nSamplesPerSec 
              << " Hz, Channels: " << waveFormat->nChannels << std::endl;
    
    return true;
}

bool SystemAudioHook::startCapture() {
    if (capturing.load()) {
        return true; // Already capturing
    }
    
    HRESULT hr = audioClient->Start();
    if (FAILED(hr)) {
        std::cerr << "Failed to start audio client: " << std::hex << hr << std::endl;
        return false;
    }
    
    capturing.store(true);
    captureThread = std::thread(&SystemAudioHook::audioProcessingLoop, this);
    
    std::cout << "System audio capture started" << std::endl;
    return true;
}

bool SystemAudioHook::stopCapture() {
    if (!capturing.load()) {
        return true; // Already stopped
    }
    
    capturing.store(false);
    
    if (captureThread.joinable()) {
        captureThread.join();
    }
    
    if (audioClient) {
        audioClient->Stop();
    }
    
    std::cout << "System audio capture stopped" << std::endl;
    return true;
}

void SystemAudioHook::audioProcessingLoop() {
    HRESULT hr;
    UINT32 packetLength = 0;
    BYTE* data;
    UINT32 numFramesAvailable;
    DWORD flags;
    
    while (capturing.load()) {
        // Wait for audio data
        Sleep(1); // 1ms sleep to prevent busy waiting
        
        hr = captureClient->GetNextPacketSize(&packetLength);
        if (FAILED(hr)) continue;
        
        while (packetLength != 0) {
            // Get the available data in the shared buffer
            hr = captureClient->GetBuffer(
                &data,
                &numFramesAvailable,
                &flags,
                nullptr,
                nullptr);
            
            if (FAILED(hr)) break;
            
            if (flags & AUDCLNT_BUFFERFLAGS_SILENT) {
                // Silent buffer, skip processing
            } else if (enabled.load() && equalizer && data && numFramesAvailable > 0) {
                // Process audio through equalizer
                processAudioBuffer((float*)data, numFramesAvailable, waveFormat->nChannels);
            }
            
            // Release the buffer
            hr = captureClient->ReleaseBuffer(numFramesAvailable);
            if (FAILED(hr)) break;
            
            // Get next packet size
            hr = captureClient->GetNextPacketSize(&packetLength);
            if (FAILED(hr)) break;
        }
    }
}

void SystemAudioHook::processAudioBuffer(float* buffer, UINT32 numFrames, int channels) {
    if (!equalizer || !enabled.load()) return;
    
    if (channels == 2) {
        // Stereo processing
        for (UINT32 i = 0; i < numFrames; i++) {
            float left = buffer[i * 2];
            float right = buffer[i * 2 + 1];
            
            // Process through equalizer
            equalizer->processStereo(&left, &right, 1);
            
            // Write back processed audio
            buffer[i * 2] = left;
            buffer[i * 2 + 1] = right;
        }
    } else if (channels == 1) {
        // Mono processing
        for (UINT32 i = 0; i < numFrames; i++) {
            float sample = buffer[i];
            equalizer->processStereo(&sample, &sample, 1);
            buffer[i] = sample;
        }
    }
}

bool SystemAudioHook::isCapturing() const {
    return capturing.load();
}

Equalizer* SystemAudioHook::getEqualizer() {
    return equalizer.get();
}

void SystemAudioHook::setEqualizer(std::shared_ptr<Equalizer> eq) {
    equalizer = eq;
}

void SystemAudioHook::setEnabled(bool en) {
    enabled.store(en);
}

bool SystemAudioHook::isEnabled() const {
    return enabled.load();
}

void SystemAudioHook::cleanup() {
    if (captureClient) {
        captureClient->Release();
        captureClient = nullptr;
    }
    
    if (renderClient) {
        renderClient->Release();
        renderClient = nullptr;
    }
    
    if (audioClient) {
        audioClient->Release();
        audioClient = nullptr;
    }
    
    if (audioDevice) {
        audioDevice->Release();
        audioDevice = nullptr;
    }
    
    if (deviceEnumerator) {
        deviceEnumerator->Release();
        deviceEnumerator = nullptr;
    }
    
    if (waveFormat) {
        CoTaskMemFree(waveFormat);
        waveFormat = nullptr;
    }
}
