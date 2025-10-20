#include <napi.h>
#include "audio_processor.h"
#include "system_audio_hook.h"
#include <memory>

// Global audio processor instance
static std::unique_ptr<AudioProcessor> processor;

// Global system audio hook instance
static std::unique_ptr<SystemAudioHook> systemHook;

// Initialize the audio processor
Napi::Value Initialize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Sample rate (number) expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double sampleRate = info[0].As<Napi::Number>().DoubleValue();
    
    processor = std::make_unique<AudioProcessor>();
    processor->initialize(sampleRate);
    
    return Napi::Boolean::New(env, true);
}

// Set EQ band gain
Napi::Value SetBandGain(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!processor) {
        Napi::Error::New(env, "Processor not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Band index and gain expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int bandIndex = info[0].As<Napi::Number>().Int32Value();
    double gain = info[1].As<Napi::Number>().DoubleValue();
    
    processor->setEQBandGain(bandIndex, gain);
    
    return Napi::Boolean::New(env, true);
}

// Get EQ band gain
Napi::Value GetBandGain(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!processor) {
        Napi::Error::New(env, "Processor not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Band index expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int bandIndex = info[0].As<Napi::Number>().Int32Value();
    double gain = processor->getEQBandGain(bandIndex);
    
    return Napi::Number::New(env, gain);
}

// Apply preset
Napi::Value ApplyPreset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!processor) {
        Napi::Error::New(env, "Processor not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Preset name (string) expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string presetName = info[0].As<Napi::String>().Utf8Value();
    processor->applyEQPreset(presetName);
    
    return Napi::Boolean::New(env, true);
}

// Reset EQ
Napi::Value ResetEQ(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!processor) {
        Napi::Error::New(env, "Processor not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    processor->resetEQ();
    return Napi::Boolean::New(env, true);
}

// Enable/Disable EQ
Napi::Value SetEnabled(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!processor) {
        Napi::Error::New(env, "Processor not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 1 || !info[0].IsBoolean()) {
        Napi::TypeError::New(env, "Boolean expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    bool enabled = info[0].As<Napi::Boolean>().Value();
    processor->setEQEnabled(enabled);
    
    return Napi::Boolean::New(env, true);
}

// Check if EQ is enabled
Napi::Value IsEnabled(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!processor) {
        return Napi::Boolean::New(env, false);
    }
    
    return Napi::Boolean::New(env, processor->isEQEnabled());
}

// Get band frequencies
Napi::Value GetBandFrequencies(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!processor) {
        Napi::Error::New(env, "Processor not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::vector<double> frequencies = processor->getBandFrequencies();
    Napi::Array result = Napi::Array::New(env, frequencies.size());
    
    for (size_t i = 0; i < frequencies.size(); i++) {
        result[i] = Napi::Number::New(env, frequencies[i]);
    }
    
    return result;
}

// Process audio buffer (for Web Audio integration)
Napi::Value ProcessBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!processor) {
        Napi::Error::New(env, "Processor not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 1 || !info[0].IsTypedArray()) {
        Napi::TypeError::New(env, "Float32Array expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Float32Array buffer = info[0].As<Napi::Float32Array>();
    int numSamples = buffer.ElementLength();
    
    processor->processInterleavedStereo(buffer.Data(), numSamples);
    
    return Napi::Boolean::New(env, true);
}

// System-wide audio hook functions
Napi::Value InitializeSystemHook(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    systemHook = std::make_unique<SystemAudioHook>();
    bool success = systemHook->initialize();
    
    return Napi::Boolean::New(env, success);
}

Napi::Value StartSystemCapture(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!systemHook) {
        Napi::Error::New(env, "System hook not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    bool success = systemHook->startCapture();
    return Napi::Boolean::New(env, success);
}

Napi::Value StopSystemCapture(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!systemHook) {
        return Napi::Boolean::New(env, true);
    }
    
    bool success = systemHook->stopCapture();
    return Napi::Boolean::New(env, success);
}

Napi::Value IsSystemCapturing(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!systemHook) {
        return Napi::Boolean::New(env, false);
    }
    
    return Napi::Boolean::New(env, systemHook->isCapturing());
}

Napi::Value SetSystemEQBandGain(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!systemHook) {
        Napi::Error::New(env, "System hook not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Band index and gain expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int bandIndex = info[0].As<Napi::Number>().Int32Value();
    double gain = info[1].As<Napi::Number>().DoubleValue();
    
    Equalizer* eq = systemHook->getEqualizer();
    if (eq) {
        eq->setBandGain(bandIndex, gain);
    }
    
    return Napi::Boolean::New(env, true);
}

Napi::Value GetSystemEQBandGain(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!systemHook) {
        return Napi::Number::New(env, 0.0);
    }
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Band index expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int bandIndex = info[0].As<Napi::Number>().Int32Value();
    
    Equalizer* eq = systemHook->getEqualizer();
    if (eq) {
        return Napi::Number::New(env, eq->getBandGain(bandIndex));
    }
    
    return Napi::Number::New(env, 0.0);
}

Napi::Value ApplySystemEQPreset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!systemHook) {
        Napi::Error::New(env, "System hook not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Preset name expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string presetName = info[0].As<Napi::String>().Utf8Value();
    
    Equalizer* eq = systemHook->getEqualizer();
    if (eq) {
        eq->applyPreset(presetName);
    }
    
    return Napi::Boolean::New(env, true);
}

Napi::Value SetSystemEQEnabled(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!systemHook) {
        Napi::Error::New(env, "System hook not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 1 || !info[0].IsBoolean()) {
        Napi::TypeError::New(env, "Boolean expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    bool enabled = info[0].As<Napi::Boolean>().Value();
    systemHook->setEnabled(enabled);
    
    return Napi::Boolean::New(env, true);
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Local file EQ functions
    exports.Set("initialize", Napi::Function::New(env, Initialize));
    exports.Set("setBandGain", Napi::Function::New(env, SetBandGain));
    exports.Set("getBandGain", Napi::Function::New(env, GetBandGain));
    exports.Set("applyPreset", Napi::Function::New(env, ApplyPreset));
    exports.Set("resetEQ", Napi::Function::New(env, ResetEQ));
    exports.Set("setEnabled", Napi::Function::New(env, SetEnabled));
    exports.Set("isEnabled", Napi::Function::New(env, IsEnabled));
    exports.Set("getBandFrequencies", Napi::Function::New(env, GetBandFrequencies));
    exports.Set("processBuffer", Napi::Function::New(env, ProcessBuffer));
    
    // System-wide EQ functions
    exports.Set("initializeSystemHook", Napi::Function::New(env, InitializeSystemHook));
    exports.Set("startSystemCapture", Napi::Function::New(env, StartSystemCapture));
    exports.Set("stopSystemCapture", Napi::Function::New(env, StopSystemCapture));
    exports.Set("isSystemCapturing", Napi::Function::New(env, IsSystemCapturing));
    exports.Set("setSystemEQBandGain", Napi::Function::New(env, SetSystemEQBandGain));
    exports.Set("getSystemEQBandGain", Napi::Function::New(env, GetSystemEQBandGain));
    exports.Set("applySystemEQPreset", Napi::Function::New(env, ApplySystemEQPreset));
    exports.Set("setSystemEQEnabled", Napi::Function::New(env, SetSystemEQEnabled));
    
    return exports;
}

NODE_API_MODULE(audio_equalizer, Init)
