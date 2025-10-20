#include "audio_processor.h"

AudioProcessor::AudioProcessor()
    : sampleRate(44100.0), initialized(false) {
    equalizer = std::make_unique<Equalizer>(sampleRate);
}

AudioProcessor::~AudioProcessor() {}

void AudioProcessor::initialize(double sr) {
    sampleRate = sr;
    equalizer = std::make_unique<Equalizer>(sampleRate);
    initialized = true;
}

void AudioProcessor::processInterleavedStereo(float* buffer, int numSamples) {
    if (!initialized || !equalizer->isEnabled()) return;
    
    // De-interleave stereo buffer
    int numFrames = numSamples / 2;
    leftBuffer.resize(numFrames);
    rightBuffer.resize(numFrames);
    
    for (int i = 0; i < numFrames; i++) {
        leftBuffer[i] = buffer[i * 2];
        rightBuffer[i] = buffer[i * 2 + 1];
    }
    
    // Process with EQ
    equalizer->processStereo(leftBuffer.data(), rightBuffer.data(), numFrames);
    
    // Re-interleave
    for (int i = 0; i < numFrames; i++) {
        buffer[i * 2] = leftBuffer[i];
        buffer[i * 2 + 1] = rightBuffer[i];
    }
}

void AudioProcessor::processSeparateChannels(float* leftChannel, float* rightChannel, int numSamples) {
    if (!initialized || !equalizer->isEnabled()) return;
    equalizer->processStereo(leftChannel, rightChannel, numSamples);
}

void AudioProcessor::setEQBandGain(int bandIndex, double gainDB) {
    equalizer->setBandGain(bandIndex, gainDB);
}

double AudioProcessor::getEQBandGain(int bandIndex) {
    return equalizer->getBandGain(bandIndex);
}

void AudioProcessor::applyEQPreset(const std::string& presetName) {
    equalizer->applyPreset(presetName);
}

void AudioProcessor::resetEQ() {
    equalizer->reset();
}

void AudioProcessor::setEQEnabled(bool enabled) {
    equalizer->setEnabled(enabled);
}

bool AudioProcessor::isEQEnabled() {
    return equalizer->isEnabled();
}

std::vector<double> AudioProcessor::getBandFrequencies() {
    std::vector<double> frequencies;
    const double* freqs = Equalizer::getBandFrequencies();
    for (int i = 0; i < Equalizer::NUM_BANDS; i++) {
        frequencies.push_back(freqs[i]);
    }
    return frequencies;
}
