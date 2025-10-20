#ifndef EQUALIZER_H
#define EQUALIZER_H

#include "biquad_filter.h"
#include <vector>
#include <string>

/**
 * 10-Band Professional Equalizer
 * Frequencies: 31, 62, 125, 250, 500, 1k, 2k, 4k, 8k, 16k Hz
 */
class Equalizer {
public:
    static const int NUM_BANDS = 10;
    
    Equalizer(double sampleRate = 44100.0);
    ~Equalizer();

    // Process stereo audio buffer
    void processStereo(float* leftChannel, float* rightChannel, int numSamples);
    
    // Set gain for specific band (-12 to +12 dB)
    void setBandGain(int bandIndex, double gainDB);
    
    // Get current gain for band
    double getBandGain(int bandIndex) const;
    
    // Apply preset by name
    void applyPreset(const std::string& presetName);
    
    // Reset all bands to 0 dB
    void reset();
    
    // Enable/disable EQ
    void setEnabled(bool enabled);
    bool isEnabled() const;
    
    // Get band frequencies
    static const double* getBandFrequencies();
    
private:
    std::vector<BiquadFilter> leftFilters;
    std::vector<BiquadFilter> rightFilters;
    std::vector<double> currentGains;
    double sampleRate;
    bool enabled;
    
    void initializeFilters();
    void updateFilter(int bandIndex);
};

#endif // EQUALIZER_H
