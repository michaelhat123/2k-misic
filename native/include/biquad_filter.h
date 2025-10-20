#ifndef BIQUAD_FILTER_H
#define BIQUAD_FILTER_H

#include <cmath>

/**
 * Professional Biquad Filter Implementation
 * Used for parametric EQ bands
 */
class BiquadFilter {
public:
    enum FilterType {
        LOWSHELF,
        HIGHSHELF,
        PEAKING
    };

    BiquadFilter();
    ~BiquadFilter();

    // Configure filter parameters
    void setType(FilterType type);
    void setFrequency(double freq, double sampleRate);
    void setGain(double gainDB);
    void setQ(double q);

    // Process audio sample
    double process(double input);

    // Reset filter state
    void reset();

private:
    // Filter coefficients
    double a0, a1, a2, b0, b1, b2;
    
    // Filter state
    double x1, x2;  // Input history
    double y1, y2;  // Output history

    // Parameters
    FilterType type;
    double frequency;
    double sampleRate;
    double gainDB;
    double Q;

    // Recalculate coefficients
    void calculateCoefficients();
};

#endif // BIQUAD_FILTER_H
