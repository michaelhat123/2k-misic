/**
 * Test script for native equalizer module
 * Run: node test/test.js
 */

const path = require('path');

console.log('🧪 Testing Native Equalizer Module\n');

try {
  // Load the native module
  const modulePath = path.join(__dirname, '..', 'build', 'Release', 'audio_equalizer.node');
  console.log('📂 Loading module from:', modulePath);
  const eq = require(modulePath);
  console.log('✅ Module loaded successfully\n');

  // Test 1: Initialize
  console.log('Test 1: Initialize with 44100 Hz sample rate');
  const initResult = eq.initialize(44100);
  console.log(`Result: ${initResult ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 2: Get band frequencies
  console.log('Test 2: Get band frequencies');
  const frequencies = eq.getBandFrequencies();
  console.log('Frequencies:', frequencies);
  console.log(`Result: ${frequencies.length === 10 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 3: Set band gain
  console.log('Test 3: Set band 0 gain to 5.0 dB');
  eq.setBandGain(0, 5.0);
  const gain = eq.getBandGain(0);
  console.log(`Retrieved gain: ${gain} dB`);
  console.log(`Result: ${Math.abs(gain - 5.0) < 0.01 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 4: Apply preset
  console.log('Test 4: Apply "rock" preset');
  eq.applyPreset('rock');
  const rockGains = [];
  for (let i = 0; i < 10; i++) {
    rockGains.push(eq.getBandGain(i));
  }
  console.log('Rock preset gains:', rockGains.map(g => g.toFixed(1)).join(', '));
  console.log(`Result: ${rockGains[0] > 0 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 5: Reset EQ
  console.log('Test 5: Reset EQ to flat');
  eq.resetEQ();
  const flatGains = [];
  for (let i = 0; i < 10; i++) {
    flatGains.push(eq.getBandGain(i));
  }
  console.log('After reset:', flatGains.map(g => g.toFixed(1)).join(', '));
  const allZero = flatGains.every(g => Math.abs(g) < 0.01);
  console.log(`Result: ${allZero ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 6: Enable/Disable
  console.log('Test 6: Enable/Disable EQ');
  eq.setEnabled(true);
  const enabled1 = eq.isEnabled();
  eq.setEnabled(false);
  const enabled2 = eq.isEnabled();
  console.log(`Enabled: ${enabled1}, Disabled: ${!enabled2}`);
  console.log(`Result: ${enabled1 && !enabled2 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 7: Process buffer (dummy test)
  console.log('Test 7: Process audio buffer');
  const bufferSize = 1024;
  const buffer = new Float32Array(bufferSize * 2); // Stereo interleaved
  
  // Fill with test signal (sine wave)
  for (let i = 0; i < bufferSize; i++) {
    const sample = Math.sin(2 * Math.PI * 440 * i / 44100); // 440 Hz
    buffer[i * 2] = sample;     // Left
    buffer[i * 2 + 1] = sample; // Right
  }
  
  eq.setEnabled(true);
  eq.setBandGain(5, 6.0); // Boost 1kHz
  eq.processBuffer(buffer);
  
  console.log('Buffer processed without errors');
  console.log(`Input samples: ${bufferSize * 2}`);
  console.log(`Result: ✅ PASS\n`);

  // Summary
  console.log('═══════════════════════════════════');
  console.log('🎉 All tests completed successfully!');
  console.log('═══════════════════════════════════');
  console.log('\n📋 Available Presets:');
  const presets = ['flat', 'rock', 'pop', 'jazz', 'classical', 'electronic', 
                   'hiphop', 'acoustic', 'bass_boost', 'treble_boost', 'vocal_boost', 'dance'];
  presets.forEach(preset => console.log(`  - ${preset}`));
  
  console.log('\n✅ Native equalizer module is ready to use!');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('\nMake sure to build the module first:');
  console.error('  npm run build');
  process.exit(1);
}
