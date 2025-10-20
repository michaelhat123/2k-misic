{
  "targets": [
    {
      "target_name": "audio_equalizer",
      "sources": [
        "src/equalizer.cpp",
        "src/biquad_filter.cpp",
        "src/audio_processor.cpp",
        "src/system_audio_hook.cpp",
        "src/bindings.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "include"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "ENABLE_SYSTEM_AUDIO_CAPTURE"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "conditions": [
        ["OS=='win'", {
          "libraries": [
            "-lole32",
            "-loleaut32",
            "-luuid",
            "-lwinmm",
            "-lksuser",
            "-lavrt"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          }
        }],
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.13"
          }
        }]
      ]
    }
  ]
}
