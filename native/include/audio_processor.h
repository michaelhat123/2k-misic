#ifndef AUDIO_PROCESSOR_H
#define AUDIO_PROCESSOR_H

#include "equalizer.h"
#include <memory>
#include <vector>

/**
 * Audio Processor - Handles real-time audio stream processing
 * Manages buffer processing and EQ application
 */
class AudioProcessor {
public:
    AudioProcessor();
    ~AudioProcessor();

    // Initialize with sample rate
    void initialize(double sampleRate);
    
    // Process interleaved stereo audio buffer
    void processInterleavedStereo(float* buffer, int numSamples);
    
    // Process separate stereo channels
    void processSeparateChannels(float* leftChannel, float* rightChannel, int numSamples);
    
    // EQ control
    void setEQBandGain(int bandIndex, double gainDB);
    double getEQBandGain(int bandIndex);
    void applyEQPreset(const std::string& presetName);
    void resetEQ();
    void setEQEnabled(bool enabled);
    bool isEQEnabled();
    
    // Get EQ band frequencies
    std::vector<double> getBandFrequencies();
    
private:
    std::unique_ptr<Equalizer> equalizer;
    double sampleRate;
    bool initialized;
    
    std::vector<float> leftBuffer;
    std::vector<float> rightBuffer;
};

#endif // AUDIO_PROCESSOR_H
