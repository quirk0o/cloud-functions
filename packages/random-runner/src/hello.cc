// hello.cc
#include <node.h>
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>

extern "C" {
    void Initialize(const uint32_t  seed);
    uint32_t ExtractU32();
}

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void Method(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Initialize(0xdeadbeef);

  size_t num = 65 * 1024 * 256;

  uint32_t * randoms = (uint32_t*) malloc(sizeof(uint32_t) * num);

  for(uint32_t k = 0; k < 10; ++k) {
    for(uint32_t i = 0; i < num; ++i) {
      randoms[i] = ExtractU32();
    }
  }

  for(uint32_t i = 0; i < 10; ++i) {
    printf("%d\n", randoms[i]);
  }

  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "Hello World!"));
}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "hello", Method);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)
