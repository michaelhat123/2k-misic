#include "equalizer.h"
#include <algorithm>
#include <map>

// 10-band frequencies in Hz
static const double BAND_FREQUENCIES[Equalizer::NUM_BANDS] = {
    31.0, 62.0, 125.0, 250.0, 500.0,
    1000.0, 2000.0, 4000.0, 8000.0, 16000.0
};

// EQ Presets (gain values in dB for each band)
static const std::map<std::string, std::vector<double>> PRESETS = {
    {"flat",        {0, 0, 0, 0, 0, 0, 0, 0, 0, 0}},
    {"rock",        {5, 3, -2, -3, -1, 1, 3, 4, 5, 5}},
    {"pop",         {-1, 2, 4, 4, 2, 0, -1, -1, -1, -1}},
    {"jazz",        {4, 3, 1, 2, -1, -1, 0, 1, 3, 4}},
    {"classical",   {5, 4, 3, 2, -1, -1, 0, 2, 3, 4}},
    {"electronic",  {5, 4, 2, 0, -2, 2, 1, 2, 4, 5}},
    {"hiphop",      {5, 4, 1, 3, -1, -1, 1, -1, 2, 3}},
    {"acoustic",    {4, 3, 2, 1, 2, 1, 2, 3, 4, 3}},
    {"bass_boost",  {8, 6, 4, 2, 0, 0, 0, 0, 0, 0}},
    {"treble_boost",{0, 0, 0, 0, 0, 0, 2, 4, 6, 8}},
    {"vocal_boost", {-2, -1, 0, 1, 4, 4, 3, 1, 0, -1}},
    {"dance",       {4, 3, 2, 0, 0, -1, 2, 3, 4, 4}}
};

Equalizer::Equalizer(double sr)
    : sampleRate(sr), enabled(true), currentGains(NUM_BANDS, 0.0) {
    initializeFilters();
}

Equalizer::~Equalizer() {}

void Equalizer::initializeFilters() {
    leftFilters.clear();
    rightFilters.clear();
    
    for (int i = 0; i < NUM_BANDS; i++) {
        BiquadFilter leftFilter, rightFilter;
        
        // Set filter type based on band position
        BiquadFilter::FilterType type;
        if (i == 0) {
            type = BiquadFilter::LOWSHELF;
        } else if (i == NUM_BANDS - 1) {
            type = BiquadFilter::HIGHSHELF;
        } else {
            type = BiquadFilter::PEAKING;
        }
        
        leftFilter.setType(type);
        leftFilter.setFrequency(BAND_FREQUENCIES[i], sampleRate);
        leftFilter.setQ(1.0);
        leftFilter.setGain(0.0);
        
        rightFilter.setType(type);
        rightFilter.setFrequency(BAND_FREQUENCIES[i], sampleRate);
        rightFilter.setQ(1.0);
        rightFilter.setGain(0.0);
        
        leftFilters.push_back(leftFilter);
        rightFilters.push_back(rightFilter);
    }
}

void Equalizer::processStereo(float* leftChannel, float* rightChannel, int numSamples) {
    if (!enabled) return;
    
    for (int i = 0; i < numSamples; i++) {
        double leftSample = leftChannel[i];
        double rightSample = rightChannel[i];
        
        // Process through all filters
        for (int band = 0; band < NUM_BANDS; band++) {
            leftSample = leftFilters[band].process(leftSample);
            rightSample = rightFilters[band].process(rightSample);
        }
        
        // Clamp output to prevent clipping
        leftChannel[i] = std::max(-1.0, std::min(1.0, leftSample));
        rightChannel[i] = std::max(-1.0, std::min(1.0, rightSample));
    }
}

void Equalizer::setBandGain(int bandIndex, double gainDB) {
    if (bandIndex < 0 || bandIndex >= NUM_BANDS) return;
    
    // Clamp gain between -12 and +12 dB
    gainDB = std::max(-12.0, std::min(12.0, gainDB));
    
    currentGains[bandIndex] = gainDB;
    updateFilter(bandIndex);
}

double Equalizer::getBandGain(int bandIndex) const {
    if (bandIndex < 0 || bandIndex >= NUM_BANDS) return 0.0;
    return currentGains[bandIndex];
}

void Equalizer::updateFilter(int bandIndex) {
    leftFilters[bandIndex].setGain(currentGains[bandIndex]);
    rightFilters[bandIndex].setGain(currentGains[bandIndex]);
}

void Equalizer::applyPreset(const std::string& presetName) {
    auto it = PRESETS.find(presetName);
    if (it == PRESETS.end()) return;
    
    const std::vector<double>& gains = it->second;
    for (int i = 0; i < NUM_BANDS && i < gains.size(); i++) {
        setBandGain(i, gains[i]);
    }
}

void Equalizer::reset() {
    for (int i = 0; i < NUM_BANDS; i++) {
        setBandGain(i, 0.0);
        leftFilters[i].reset();
        rightFilters[i].reset();
    }
}

void Equalizer::setEnabled(bool en) {
    enabled = en;
    if (!enabled) {
        // Reset filter state when disabling
        for (int i = 0; i < NUM_BANDS; i++) {
            leftFilters[i].reset();
            rightFilters[i].reset();
        }
    }
}

bool Equalizer::isEnabled() const {
    return enabled;
}

const double* Equalizer::getBandFrequencies() {
    return BAND_FREQUENCIES;
}
