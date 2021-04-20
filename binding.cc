#define NAPI_EXPERIMENTAL
#include <node_api.h>
#define SEEDTYPE uint64_t
#include "./shishua.h"

namespace shishua {

static const napi_type_tag SHISHUAHandleTypeTag = {
  0x4ba1eb248da1ce9e, 0x60349a86f3a4bfa7
};

void DeletePRNG(napi_env env, void *finalize_data, void *finalize_hint) {
  prng_state *prng = (prng_state *)finalize_data;
  delete prng;
}

napi_value NewPRNG(napi_env env, napi_callback_info args) {
  napi_value result;
  napi_status status;

  // Get the parameter: (seed).
  size_t argc = 1;
  napi_value argv[1];
  status = napi_get_cb_info(env, args, &argc, argv, NULL, NULL);
  if (status != napi_ok) return NULL;
  bool is_buffer;
  status = napi_is_buffer(env, argv[0], &is_buffer);
  if (status != napi_ok) return NULL;
  if (!is_buffer) return NULL;
  size_t buflen;
  uint8_t *buffer;
  status = napi_get_buffer_info(env, argv[0], (void**)&buffer, &buflen);

  SEEDTYPE seed[4] = {0};
  for (size_t si = 0; si < 4; si++) {
    for (size_t i = si * 8; i < si * 8 + 8 && i < buflen; i++) {
      seed[si] <<= 8;
      seed[si] ^= buffer[i];
    }
  }
  prng_state *prng = new prng_state;
  *prng = prng_init(seed);

  status = napi_create_object(env, &result);
  if (status != napi_ok) return NULL;
  status = napi_type_tag_object(env, result, &SHISHUAHandleTypeTag);
  if (status != napi_ok) return NULL;
  status = napi_wrap(env, result, prng, DeletePRNG, NULL, NULL);
  if (status != napi_ok) return NULL;

  return result;
}

napi_value Generate(napi_env env, napi_callback_info args) {
  napi_value result;
  napi_status status;

  // Get the parameters: (PRNG state, buffer).

  size_t argc = 2;
  napi_value argv[2];
  status = napi_get_cb_info(env, args, &argc, argv, NULL, NULL);
  if (status != napi_ok) return NULL;

  // Check the type of the first argument (the PRNG state).
  bool is_shishua_handle;
  status = napi_check_object_type_tag(env, argv[0], &SHISHUAHandleTypeTag, &is_shishua_handle);
  if (status != napi_ok) return NULL;
  if (!is_shishua_handle) return NULL;

  // Extract the C structure from the first argument.
  prng_state *prng;
  status = napi_unwrap(env, argv[0], (void**)&prng);
  if (status != napi_ok) return NULL;

  // Get the second parameter, a Buffer.
  bool is_buffer;
  status = napi_is_buffer(env, argv[1], &is_buffer);
  if (status != napi_ok) return NULL;
  if (!is_buffer) return NULL;
  size_t buflen;
  uint8_t *buffer;
  status = napi_get_buffer_info(env, argv[1], (void**)&buffer, &buflen);
  // We expect a buffer of a multiple of 128 bytes.
  if (buflen % 128 != 0) return NULL;

  prng_gen(prng, buffer, buflen);

  status = napi_get_undefined(env, &result);
  return result;
}

napi_value init(napi_env env, napi_value exports) {
  napi_status status;
  napi_value fn;

  status = napi_create_function(env, NULL, 0, NewPRNG, NULL, &fn);
  if (status != napi_ok) return NULL;
  status = napi_set_named_property(env, exports, "init", fn);
  if (status != napi_ok) return NULL;

  status = napi_create_function(env, NULL, 0, Generate, NULL, &fn);
  if (status != napi_ok) return NULL;
  status = napi_set_named_property(env, exports, "generate", fn);
  if (status != napi_ok) return NULL;

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)

}  // namespace shishua
