#include "biquad_filter.h"
#include <cmath>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

BiquadFilter::BiquadFilter()
    : a0(1.0), a1(0.0), a2(0.0), b0(1.0), b1(0.0), b2(0.0),
      x1(0.0), x2(0.0), y1(0.0), y2(0.0),
      type(PEAKING), frequency(1000.0), sampleRate(44100.0),
      gainDB(0.0), Q(1.0) {
    calculateCoefficients();
}

BiquadFilter::~BiquadFilter() {}

void BiquadFilter::setType(FilterType t) {
    type = t;
    calculateCoefficients();
}

void BiquadFilter::setFrequency(double freq, double sr) {
    frequency = freq;
    sampleRate = sr;
    calculateCoefficients();
}

void BiquadFilter::setGain(double gain) {
    gainDB = gain;
    calculateCoefficients();
}

void BiquadFilter::setQ(double q) {
    Q = q;
    calculateCoefficients();
}

void BiquadFilter::calculateCoefficients() {
    double A = std::pow(10.0, gainDB / 40.0);  // Amplitude
    double omega = 2.0 * M_PI * frequency / sampleRate;
    double sn = std::sin(omega);
    double cs = std::cos(omega);
    double alpha = sn / (2.0 * Q);

    switch (type) {
        case LOWSHELF: {
            double beta = std::sqrt(A) / Q;
            b0 = A * ((A + 1) - (A - 1) * cs + beta * sn);
            b1 = 2 * A * ((A - 1) - (A + 1) * cs);
            b2 = A * ((A + 1) - (A - 1) * cs - beta * sn);
            a0 = (A + 1) + (A - 1) * cs + beta * sn;
            a1 = -2 * ((A - 1) + (A + 1) * cs);
            a2 = (A + 1) + (A - 1) * cs - beta * sn;
            break;
        }
        case HIGHSHELF: {
            double beta = std::sqrt(A) / Q;
            b0 = A * ((A + 1) + (A - 1) * cs + beta * sn);
            b1 = -2 * A * ((A - 1) + (A + 1) * cs);
            b2 = A * ((A + 1) + (A - 1) * cs - beta * sn);
            a0 = (A + 1) - (A - 1) * cs + beta * sn;
            a1 = 2 * ((A - 1) - (A + 1) * cs);
            a2 = (A + 1) - (A - 1) * cs - beta * sn;
            break;
        }
        case PEAKING: {
            b0 = 1 + alpha * A;
            b1 = -2 * cs;
            b2 = 1 - alpha * A;
            a0 = 1 + alpha / A;
            a1 = -2 * cs;
            a2 = 1 - alpha / A;
            break;
        }
    }

    // Normalize coefficients
    b0 /= a0;
    b1 /= a0;
    b2 /= a0;
    a1 /= a0;
    a2 /= a0;
    a0 = 1.0;
}

double BiquadFilter::process(double input) {
    // Direct Form II Transposed implementation
    double output = b0 * input + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;

    // Update state
    x2 = x1;
    x1 = input;
    y2 = y1;
    y1 = output;

    return output;
}

void BiquadFilter::reset() {
    x1 = x2 = y1 = y2 = 0.0;
}
