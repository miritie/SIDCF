var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// .wrangler/tmp/bundle-fP9Tqa/checked-fetch.js
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
var urls;
var init_checked_fetch = __esm({
  ".wrangler/tmp/bundle-fP9Tqa/checked-fetch.js"() {
    urls = /* @__PURE__ */ new Set();
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// .wrangler/tmp/bundle-fP9Tqa/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
var init_strip_cf_connecting_ip_header = __esm({
  ".wrangler/tmp/bundle-fP9Tqa/strip-cf-connecting-ip-header.js"() {
    __name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        return Reflect.apply(target, thisArg, [
          stripCfConnectingIPHeader.apply(null, argArray)
        ]);
      }
    });
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// node_modules/@smithy/util-utf8/dist-es/fromUtf8.browser.js
var fromUtf8;
var init_fromUtf8_browser = __esm({
  "node_modules/@smithy/util-utf8/dist-es/fromUtf8.browser.js"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    fromUtf8 = /* @__PURE__ */ __name((input) => new TextEncoder().encode(input), "fromUtf8");
  }
});

// node_modules/@smithy/util-utf8/dist-es/toUint8Array.js
var toUint8Array;
var init_toUint8Array = __esm({
  "node_modules/@smithy/util-utf8/dist-es/toUint8Array.js"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_fromUtf8_browser();
    toUint8Array = /* @__PURE__ */ __name((data) => {
      if (typeof data === "string") {
        return fromUtf8(data);
      }
      if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
      }
      return new Uint8Array(data);
    }, "toUint8Array");
  }
});

// node_modules/@smithy/util-utf8/dist-es/toUtf8.browser.js
var toUtf8;
var init_toUtf8_browser = __esm({
  "node_modules/@smithy/util-utf8/dist-es/toUtf8.browser.js"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    toUtf8 = /* @__PURE__ */ __name((input) => {
      if (typeof input === "string") {
        return input;
      }
      if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
        throw new Error("@smithy/util-utf8: toUtf8 encoder function only accepts string | Uint8Array.");
      }
      return new TextDecoder("utf-8").decode(input);
    }, "toUtf8");
  }
});

// node_modules/@smithy/util-utf8/dist-es/index.js
var init_dist_es = __esm({
  "node_modules/@smithy/util-utf8/dist-es/index.js"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_fromUtf8_browser();
    init_toUint8Array();
    init_toUtf8_browser();
  }
});

// node_modules/@smithy/core/dist-es/submodules/event-streams/EventStreamSerde.js
var EventStreamSerde;
var init_EventStreamSerde = __esm({
  "node_modules/@smithy/core/dist-es/submodules/event-streams/EventStreamSerde.js"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_dist_es();
    EventStreamSerde = class {
      marshaller;
      serializer;
      deserializer;
      serdeContext;
      defaultContentType;
      constructor({ marshaller, serializer, deserializer, serdeContext, defaultContentType }) {
        this.marshaller = marshaller;
        this.serializer = serializer;
        this.deserializer = deserializer;
        this.serdeContext = serdeContext;
        this.defaultContentType = defaultContentType;
      }
      async serializeEventStream({ eventStream, requestSchema, initialRequest }) {
        const marshaller = this.marshaller;
        const eventStreamMember = requestSchema.getEventStreamMember();
        const unionSchema = requestSchema.getMemberSchema(eventStreamMember);
        const serializer = this.serializer;
        const defaultContentType = this.defaultContentType;
        const initialRequestMarker = Symbol("initialRequestMarker");
        const eventStreamIterable = {
          async *[Symbol.asyncIterator]() {
            if (initialRequest) {
              const headers = {
                ":event-type": { type: "string", value: "initial-request" },
                ":message-type": { type: "string", value: "event" },
                ":content-type": { type: "string", value: defaultContentType }
              };
              serializer.write(requestSchema, initialRequest);
              const body = serializer.flush();
              yield {
                [initialRequestMarker]: true,
                headers,
                body
              };
            }
            for await (const page of eventStream) {
              yield page;
            }
          }
        };
        return marshaller.serialize(eventStreamIterable, (event) => {
          if (event[initialRequestMarker]) {
            return {
              headers: event.headers,
              body: event.body
            };
          }
          const unionMember = Object.keys(event).find((key) => {
            return key !== "__type";
          }) ?? "";
          const { additionalHeaders, body, eventType, explicitPayloadContentType } = this.writeEventBody(unionMember, unionSchema, event);
          const headers = {
            ":event-type": { type: "string", value: eventType },
            ":message-type": { type: "string", value: "event" },
            ":content-type": { type: "string", value: explicitPayloadContentType ?? defaultContentType },
            ...additionalHeaders
          };
          return {
            headers,
            body
          };
        });
      }
      async deserializeEventStream({ response, responseSchema, initialResponseContainer }) {
        const marshaller = this.marshaller;
        const eventStreamMember = responseSchema.getEventStreamMember();
        const unionSchema = responseSchema.getMemberSchema(eventStreamMember);
        const memberSchemas = unionSchema.getMemberSchemas();
        const initialResponseMarker = Symbol("initialResponseMarker");
        const asyncIterable = marshaller.deserialize(response.body, async (event) => {
          const unionMember = Object.keys(event).find((key) => {
            return key !== "__type";
          }) ?? "";
          const body = event[unionMember].body;
          if (unionMember === "initial-response") {
            const dataObject = await this.deserializer.read(responseSchema, body);
            delete dataObject[eventStreamMember];
            return {
              [initialResponseMarker]: true,
              ...dataObject
            };
          } else if (unionMember in memberSchemas) {
            const eventStreamSchema = memberSchemas[unionMember];
            if (eventStreamSchema.isStructSchema()) {
              const out = {};
              let hasBindings = false;
              for (const [name, member2] of eventStreamSchema.structIterator()) {
                const { eventHeader, eventPayload } = member2.getMergedTraits();
                hasBindings = hasBindings || Boolean(eventHeader || eventPayload);
                if (eventPayload) {
                  if (member2.isBlobSchema()) {
                    out[name] = body;
                  } else if (member2.isStringSchema()) {
                    out[name] = (this.serdeContext?.utf8Encoder ?? toUtf8)(body);
                  } else if (member2.isStructSchema()) {
                    out[name] = await this.deserializer.read(member2, body);
                  }
                } else if (eventHeader) {
                  const value = event[unionMember].headers[name]?.value;
                  if (value != null) {
                    if (member2.isNumericSchema()) {
                      if (value && typeof value === "object" && "bytes" in value) {
                        out[name] = BigInt(value.toString());
                      } else {
                        out[name] = Number(value);
                      }
                    } else {
                      out[name] = value;
                    }
                  }
                }
              }
              if (hasBindings) {
                return {
                  [unionMember]: out
                };
              }
            }
            return {
              [unionMember]: await this.deserializer.read(eventStreamSchema, body)
            };
          } else {
            return {
              $unknown: event
            };
          }
        });
        const asyncIterator = asyncIterable[Symbol.asyncIterator]();
        const firstEvent = await asyncIterator.next();
        if (firstEvent.done) {
          return asyncIterable;
        }
        if (firstEvent.value?.[initialResponseMarker]) {
          if (!responseSchema) {
            throw new Error("@smithy::core/protocols - initial-response event encountered in event stream but no response schema given.");
          }
          for (const [key, value] of Object.entries(firstEvent.value)) {
            initialResponseContainer[key] = value;
          }
        }
        return {
          async *[Symbol.asyncIterator]() {
            if (!firstEvent?.value?.[initialResponseMarker]) {
              yield firstEvent.value;
            }
            while (true) {
              const { done, value } = await asyncIterator.next();
              if (done) {
                break;
              }
              yield value;
            }
          }
        };
      }
      writeEventBody(unionMember, unionSchema, event) {
        const serializer = this.serializer;
        let eventType = unionMember;
        let explicitPayloadMember = null;
        let explicitPayloadContentType;
        const isKnownSchema = (() => {
          const struct = unionSchema.getSchema();
          return struct[4].includes(unionMember);
        })();
        const additionalHeaders = {};
        if (!isKnownSchema) {
          const [type, value] = event[unionMember];
          eventType = type;
          serializer.write(15, value);
        } else {
          const eventSchema = unionSchema.getMemberSchema(unionMember);
          if (eventSchema.isStructSchema()) {
            for (const [memberName, memberSchema] of eventSchema.structIterator()) {
              const { eventHeader, eventPayload } = memberSchema.getMergedTraits();
              if (eventPayload) {
                explicitPayloadMember = memberName;
                break;
              } else if (eventHeader) {
                const value = event[unionMember][memberName];
                let type = "binary";
                if (memberSchema.isNumericSchema()) {
                  if ((-2) ** 31 <= value && value <= 2 ** 31 - 1) {
                    type = "integer";
                  } else {
                    type = "long";
                  }
                } else if (memberSchema.isTimestampSchema()) {
                  type = "timestamp";
                } else if (memberSchema.isStringSchema()) {
                  type = "string";
                } else if (memberSchema.isBooleanSchema()) {
                  type = "boolean";
                }
                if (value != null) {
                  additionalHeaders[memberName] = {
                    type,
                    value
                  };
                  delete event[unionMember][memberName];
                }
              }
            }
            if (explicitPayloadMember !== null) {
              const payloadSchema = eventSchema.getMemberSchema(explicitPayloadMember);
              if (payloadSchema.isBlobSchema()) {
                explicitPayloadContentType = "application/octet-stream";
              } else if (payloadSchema.isStringSchema()) {
                explicitPayloadContentType = "text/plain";
              }
              serializer.write(payloadSchema, event[unionMember][explicitPayloadMember]);
            } else {
              serializer.write(eventSchema, event[unionMember]);
            }
          } else {
            throw new Error("@smithy/core/event-streams - non-struct member not supported in event stream union.");
          }
        }
        const messageSerialization = serializer.flush();
        const body = typeof messageSerialization === "string" ? (this.serdeContext?.utf8Decoder ?? fromUtf8)(messageSerialization) : messageSerialization;
        return {
          body,
          eventType,
          explicitPayloadContentType,
          additionalHeaders
        };
      }
    };
    __name(EventStreamSerde, "EventStreamSerde");
  }
});

// node_modules/@smithy/core/dist-es/submodules/event-streams/index.js
var event_streams_exports = {};
__export(event_streams_exports, {
  EventStreamSerde: () => EventStreamSerde
});
var init_event_streams = __esm({
  "node_modules/@smithy/core/dist-es/submodules/event-streams/index.js"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_EventStreamSerde();
  }
});

// .wrangler/tmp/bundle-fP9Tqa/middleware-loader.entry.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// .wrangler/tmp/bundle-fP9Tqa/middleware-insertion-facade.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@neondatabase/serverless/index.mjs
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var to = Object.create;
var Ce = Object.defineProperty;
var ro = Object.getOwnPropertyDescriptor;
var no = Object.getOwnPropertyNames;
var io = Object.getPrototypeOf;
var so = Object.prototype.hasOwnProperty;
var oo = /* @__PURE__ */ __name((r2, e2, t2) => e2 in r2 ? Ce(r2, e2, { enumerable: true, configurable: true, writable: true, value: t2 }) : r2[e2] = t2, "oo");
var a = /* @__PURE__ */ __name((r2, e2) => Ce(r2, "name", { value: e2, configurable: true }), "a");
var z = /* @__PURE__ */ __name((r2, e2) => () => (r2 && (e2 = r2(r2 = 0)), e2), "z");
var I = /* @__PURE__ */ __name((r2, e2) => () => (e2 || r2((e2 = { exports: {} }).exports, e2), e2.exports), "I");
var ie = /* @__PURE__ */ __name((r2, e2) => {
  for (var t2 in e2)
    Ce(r2, t2, { get: e2[t2], enumerable: true });
}, "ie");
var An = /* @__PURE__ */ __name((r2, e2, t2, n2) => {
  if (e2 && typeof e2 == "object" || typeof e2 == "function")
    for (let i2 of no(e2))
      !so.call(r2, i2) && i2 !== t2 && Ce(r2, i2, { get: () => e2[i2], enumerable: !(n2 = ro(e2, i2)) || n2.enumerable });
  return r2;
}, "An");
var Te = /* @__PURE__ */ __name((r2, e2, t2) => (t2 = r2 != null ? to(io(r2)) : {}, An(e2 || !r2 || !r2.__esModule ? Ce(t2, "default", {
  value: r2,
  enumerable: true
}) : t2, r2)), "Te");
var N = /* @__PURE__ */ __name((r2) => An(Ce({}, "__esModule", { value: true }), r2), "N");
var _ = /* @__PURE__ */ __name((r2, e2, t2) => oo(r2, typeof e2 != "symbol" ? e2 + "" : e2, t2), "_");
var In = I((nt) => {
  "use strict";
  p();
  nt.byteLength = uo;
  nt.toByteArray = ho;
  nt.fromByteArray = po;
  var ae2 = [], te = [], ao2 = typeof Uint8Array < "u" ? Uint8Array : Array, Pt = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (ve = 0, Cn = Pt.length; ve < Cn; ++ve)
    ae2[ve] = Pt[ve], te[Pt.charCodeAt(ve)] = ve;
  var ve, Cn;
  te[45] = 62;
  te[95] = 63;
  function Tn(r2) {
    var e2 = r2.length;
    if (e2 % 4 > 0)
      throw new Error("Invalid string. Length must be a multiple of 4");
    var t2 = r2.indexOf("=");
    t2 === -1 && (t2 = e2);
    var n2 = t2 === e2 ? 0 : 4 - t2 % 4;
    return [t2, n2];
  }
  __name(Tn, "Tn");
  a(
    Tn,
    "getLens"
  );
  function uo(r2) {
    var e2 = Tn(r2), t2 = e2[0], n2 = e2[1];
    return (t2 + n2) * 3 / 4 - n2;
  }
  __name(uo, "uo");
  a(uo, "byteLength");
  function co2(r2, e2, t2) {
    return (e2 + t2) * 3 / 4 - t2;
  }
  __name(co2, "co");
  a(co2, "_byteLength");
  function ho(r2) {
    var e2, t2 = Tn(r2), n2 = t2[0], i2 = t2[1], s2 = new ao2(co2(r2, n2, i2)), o2 = 0, u2 = i2 > 0 ? n2 - 4 : n2, c2;
    for (c2 = 0; c2 < u2; c2 += 4)
      e2 = te[r2.charCodeAt(c2)] << 18 | te[r2.charCodeAt(c2 + 1)] << 12 | te[r2.charCodeAt(c2 + 2)] << 6 | te[r2.charCodeAt(c2 + 3)], s2[o2++] = e2 >> 16 & 255, s2[o2++] = e2 >> 8 & 255, s2[o2++] = e2 & 255;
    return i2 === 2 && (e2 = te[r2.charCodeAt(c2)] << 2 | te[r2.charCodeAt(c2 + 1)] >> 4, s2[o2++] = e2 & 255), i2 === 1 && (e2 = te[r2.charCodeAt(
      c2
    )] << 10 | te[r2.charCodeAt(c2 + 1)] << 4 | te[r2.charCodeAt(c2 + 2)] >> 2, s2[o2++] = e2 >> 8 & 255, s2[o2++] = e2 & 255), s2;
  }
  __name(ho, "ho");
  a(ho, "toByteArray");
  function lo(r2) {
    return ae2[r2 >> 18 & 63] + ae2[r2 >> 12 & 63] + ae2[r2 >> 6 & 63] + ae2[r2 & 63];
  }
  __name(lo, "lo");
  a(lo, "tripletToBase64");
  function fo(r2, e2, t2) {
    for (var n2, i2 = [], s2 = e2; s2 < t2; s2 += 3)
      n2 = (r2[s2] << 16 & 16711680) + (r2[s2 + 1] << 8 & 65280) + (r2[s2 + 2] & 255), i2.push(lo(n2));
    return i2.join(
      ""
    );
  }
  __name(fo, "fo");
  a(fo, "encodeChunk");
  function po(r2) {
    for (var e2, t2 = r2.length, n2 = t2 % 3, i2 = [], s2 = 16383, o2 = 0, u2 = t2 - n2; o2 < u2; o2 += s2)
      i2.push(fo(r2, o2, o2 + s2 > u2 ? u2 : o2 + s2));
    return n2 === 1 ? (e2 = r2[t2 - 1], i2.push(ae2[e2 >> 2] + ae2[e2 << 4 & 63] + "==")) : n2 === 2 && (e2 = (r2[t2 - 2] << 8) + r2[t2 - 1], i2.push(ae2[e2 >> 10] + ae2[e2 >> 4 & 63] + ae2[e2 << 2 & 63] + "=")), i2.join("");
  }
  __name(po, "po");
  a(po, "fromByteArray");
});
var Pn = I((Bt) => {
  p();
  Bt.read = function(r2, e2, t2, n2, i2) {
    var s2, o2, u2 = i2 * 8 - n2 - 1, c2 = (1 << u2) - 1, h2 = c2 >> 1, l2 = -7, d2 = t2 ? i2 - 1 : 0, b2 = t2 ? -1 : 1, C2 = r2[e2 + d2];
    for (d2 += b2, s2 = C2 & (1 << -l2) - 1, C2 >>= -l2, l2 += u2; l2 > 0; s2 = s2 * 256 + r2[e2 + d2], d2 += b2, l2 -= 8)
      ;
    for (o2 = s2 & (1 << -l2) - 1, s2 >>= -l2, l2 += n2; l2 > 0; o2 = o2 * 256 + r2[e2 + d2], d2 += b2, l2 -= 8)
      ;
    if (s2 === 0)
      s2 = 1 - h2;
    else {
      if (s2 === c2)
        return o2 ? NaN : (C2 ? -1 : 1) * (1 / 0);
      o2 = o2 + Math.pow(2, n2), s2 = s2 - h2;
    }
    return (C2 ? -1 : 1) * o2 * Math.pow(2, s2 - n2);
  };
  Bt.write = function(r2, e2, t2, n2, i2, s2) {
    var o2, u2, c2, h2 = s2 * 8 - i2 - 1, l2 = (1 << h2) - 1, d2 = l2 >> 1, b2 = i2 === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, C2 = n2 ? 0 : s2 - 1, B2 = n2 ? 1 : -1, W2 = e2 < 0 || e2 === 0 && 1 / e2 < 0 ? 1 : 0;
    for (e2 = Math.abs(e2), isNaN(e2) || e2 === 1 / 0 ? (u2 = isNaN(e2) ? 1 : 0, o2 = l2) : (o2 = Math.floor(Math.log(e2) / Math.LN2), e2 * (c2 = Math.pow(2, -o2)) < 1 && (o2--, c2 *= 2), o2 + d2 >= 1 ? e2 += b2 / c2 : e2 += b2 * Math.pow(2, 1 - d2), e2 * c2 >= 2 && (o2++, c2 /= 2), o2 + d2 >= l2 ? (u2 = 0, o2 = l2) : o2 + d2 >= 1 ? (u2 = (e2 * c2 - 1) * Math.pow(
      2,
      i2
    ), o2 = o2 + d2) : (u2 = e2 * Math.pow(2, d2 - 1) * Math.pow(2, i2), o2 = 0)); i2 >= 8; r2[t2 + C2] = u2 & 255, C2 += B2, u2 /= 256, i2 -= 8)
      ;
    for (o2 = o2 << i2 | u2, h2 += i2; h2 > 0; r2[t2 + C2] = o2 & 255, C2 += B2, o2 /= 256, h2 -= 8)
      ;
    r2[t2 + C2 - B2] |= W2 * 128;
  };
});
var $n = I((Le) => {
  "use strict";
  p();
  var Lt = In(), Pe = Pn(), Bn = typeof Symbol == "function" && typeof Symbol.for == "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
  Le.Buffer = f2;
  Le.SlowBuffer = So;
  Le.INSPECT_MAX_BYTES = 50;
  var it = 2147483647;
  Le.kMaxLength = it;
  f2.TYPED_ARRAY_SUPPORT = yo();
  !f2.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
  function yo() {
    try {
      let r2 = new Uint8Array(1), e2 = { foo: a(function() {
        return 42;
      }, "foo") };
      return Object.setPrototypeOf(e2, Uint8Array.prototype), Object.setPrototypeOf(
        r2,
        e2
      ), r2.foo() === 42;
    } catch {
      return false;
    }
  }
  __name(yo, "yo");
  a(yo, "typedArraySupport");
  Object.defineProperty(
    f2.prototype,
    "parent",
    { enumerable: true, get: a(function() {
      if (f2.isBuffer(this))
        return this.buffer;
    }, "get") }
  );
  Object.defineProperty(f2.prototype, "offset", { enumerable: true, get: a(
    function() {
      if (f2.isBuffer(this))
        return this.byteOffset;
    },
    "get"
  ) });
  function fe(r2) {
    if (r2 > it)
      throw new RangeError('The value "' + r2 + '" is invalid for option "size"');
    let e2 = new Uint8Array(
      r2
    );
    return Object.setPrototypeOf(e2, f2.prototype), e2;
  }
  __name(fe, "fe");
  a(fe, "createBuffer");
  function f2(r2, e2, t2) {
    if (typeof r2 == "number") {
      if (typeof e2 == "string")
        throw new TypeError('The "string" argument must be of type string. Received type number');
      return Dt(r2);
    }
    return Mn(
      r2,
      e2,
      t2
    );
  }
  __name(f2, "f");
  a(f2, "Buffer");
  f2.poolSize = 8192;
  function Mn(r2, e2, t2) {
    if (typeof r2 == "string")
      return go(
        r2,
        e2
      );
    if (ArrayBuffer.isView(r2))
      return wo(r2);
    if (r2 == null)
      throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof r2);
    if (ue(r2, ArrayBuffer) || r2 && ue(r2.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (ue(r2, SharedArrayBuffer) || r2 && ue(r2.buffer, SharedArrayBuffer)))
      return Ft(r2, e2, t2);
    if (typeof r2 == "number")
      throw new TypeError('The "value" argument must not be of type number. Received type number');
    let n2 = r2.valueOf && r2.valueOf();
    if (n2 != null && n2 !== r2)
      return f2.from(n2, e2, t2);
    let i2 = bo2(r2);
    if (i2)
      return i2;
    if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof r2[Symbol.toPrimitive] == "function")
      return f2.from(r2[Symbol.toPrimitive]("string"), e2, t2);
    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof r2);
  }
  __name(Mn, "Mn");
  a(Mn, "from");
  f2.from = function(r2, e2, t2) {
    return Mn(r2, e2, t2);
  };
  Object.setPrototypeOf(f2.prototype, Uint8Array.prototype);
  Object.setPrototypeOf(
    f2,
    Uint8Array
  );
  function Dn(r2) {
    if (typeof r2 != "number")
      throw new TypeError('"size" argument must be of type number');
    if (r2 < 0)
      throw new RangeError('The value "' + r2 + '" is invalid for option "size"');
  }
  __name(Dn, "Dn");
  a(Dn, "assertSize");
  function mo(r2, e2, t2) {
    return Dn(r2), r2 <= 0 ? fe(r2) : e2 !== void 0 ? typeof t2 == "string" ? fe(r2).fill(e2, t2) : fe(r2).fill(e2) : fe(r2);
  }
  __name(mo, "mo");
  a(
    mo,
    "alloc"
  );
  f2.alloc = function(r2, e2, t2) {
    return mo(r2, e2, t2);
  };
  function Dt(r2) {
    return Dn(r2), fe(
      r2 < 0 ? 0 : kt(r2) | 0
    );
  }
  __name(Dt, "Dt");
  a(Dt, "allocUnsafe");
  f2.allocUnsafe = function(r2) {
    return Dt(r2);
  };
  f2.allocUnsafeSlow = function(r2) {
    return Dt(r2);
  };
  function go(r2, e2) {
    if ((typeof e2 != "string" || e2 === "") && (e2 = "utf8"), !f2.isEncoding(e2))
      throw new TypeError("Unknown encoding: " + e2);
    let t2 = kn(r2, e2) | 0, n2 = fe(t2), i2 = n2.write(r2, e2);
    return i2 !== t2 && (n2 = n2.slice(0, i2)), n2;
  }
  __name(go, "go");
  a(go, "fromString");
  function Rt(r2) {
    let e2 = r2.length < 0 ? 0 : kt(r2.length) | 0, t2 = fe(e2);
    for (let n2 = 0; n2 < e2; n2 += 1)
      t2[n2] = r2[n2] & 255;
    return t2;
  }
  __name(Rt, "Rt");
  a(Rt, "fromArrayLike");
  function wo(r2) {
    if (ue(r2, Uint8Array)) {
      let e2 = new Uint8Array(r2);
      return Ft(e2.buffer, e2.byteOffset, e2.byteLength);
    }
    return Rt(r2);
  }
  __name(wo, "wo");
  a(wo, "fromArrayView");
  function Ft(r2, e2, t2) {
    if (e2 < 0 || r2.byteLength < e2)
      throw new RangeError('"offset" is outside of buffer bounds');
    if (r2.byteLength < e2 + (t2 || 0))
      throw new RangeError('"length" is outside of buffer bounds');
    let n2;
    return e2 === void 0 && t2 === void 0 ? n2 = new Uint8Array(
      r2
    ) : t2 === void 0 ? n2 = new Uint8Array(r2, e2) : n2 = new Uint8Array(r2, e2, t2), Object.setPrototypeOf(
      n2,
      f2.prototype
    ), n2;
  }
  __name(Ft, "Ft");
  a(Ft, "fromArrayBuffer");
  function bo2(r2) {
    if (f2.isBuffer(r2)) {
      let e2 = kt(
        r2.length
      ) | 0, t2 = fe(e2);
      return t2.length === 0 || r2.copy(t2, 0, 0, e2), t2;
    }
    if (r2.length !== void 0)
      return typeof r2.length != "number" || Ot(r2.length) ? fe(0) : Rt(r2);
    if (r2.type === "Buffer" && Array.isArray(r2.data))
      return Rt(r2.data);
  }
  __name(bo2, "bo");
  a(bo2, "fromObject");
  function kt(r2) {
    if (r2 >= it)
      throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + it.toString(16) + " bytes");
    return r2 | 0;
  }
  __name(kt, "kt");
  a(kt, "checked");
  function So(r2) {
    return +r2 != r2 && (r2 = 0), f2.alloc(+r2);
  }
  __name(So, "So");
  a(So, "SlowBuffer");
  f2.isBuffer = a(function(e2) {
    return e2 != null && e2._isBuffer === true && e2 !== f2.prototype;
  }, "isBuffer");
  f2.compare = a(function(e2, t2) {
    if (ue(e2, Uint8Array) && (e2 = f2.from(e2, e2.offset, e2.byteLength)), ue(t2, Uint8Array) && (t2 = f2.from(t2, t2.offset, t2.byteLength)), !f2.isBuffer(e2) || !f2.isBuffer(t2))
      throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
    if (e2 === t2)
      return 0;
    let n2 = e2.length, i2 = t2.length;
    for (let s2 = 0, o2 = Math.min(n2, i2); s2 < o2; ++s2)
      if (e2[s2] !== t2[s2]) {
        n2 = e2[s2], i2 = t2[s2];
        break;
      }
    return n2 < i2 ? -1 : i2 < n2 ? 1 : 0;
  }, "compare");
  f2.isEncoding = a(function(e2) {
    switch (String(e2).toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "latin1":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return true;
      default:
        return false;
    }
  }, "isEncoding");
  f2.concat = a(function(e2, t2) {
    if (!Array.isArray(e2))
      throw new TypeError('"list" argument must be an Array of Buffers');
    if (e2.length === 0)
      return f2.alloc(0);
    let n2;
    if (t2 === void 0)
      for (t2 = 0, n2 = 0; n2 < e2.length; ++n2)
        t2 += e2[n2].length;
    let i2 = f2.allocUnsafe(t2), s2 = 0;
    for (n2 = 0; n2 < e2.length; ++n2) {
      let o2 = e2[n2];
      if (ue(o2, Uint8Array))
        s2 + o2.length > i2.length ? (f2.isBuffer(
          o2
        ) || (o2 = f2.from(o2)), o2.copy(i2, s2)) : Uint8Array.prototype.set.call(i2, o2, s2);
      else if (f2.isBuffer(
        o2
      ))
        o2.copy(i2, s2);
      else
        throw new TypeError('"list" argument must be an Array of Buffers');
      s2 += o2.length;
    }
    return i2;
  }, "concat");
  function kn(r2, e2) {
    if (f2.isBuffer(r2))
      return r2.length;
    if (ArrayBuffer.isView(r2) || ue(r2, ArrayBuffer))
      return r2.byteLength;
    if (typeof r2 != "string")
      throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof r2);
    let t2 = r2.length, n2 = arguments.length > 2 && arguments[2] === true;
    if (!n2 && t2 === 0)
      return 0;
    let i2 = false;
    for (; ; )
      switch (e2) {
        case "ascii":
        case "latin1":
        case "binary":
          return t2;
        case "utf8":
        case "utf-8":
          return Mt(r2).length;
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return t2 * 2;
        case "hex":
          return t2 >>> 1;
        case "base64":
          return Gn(r2).length;
        default:
          if (i2)
            return n2 ? -1 : Mt(r2).length;
          e2 = ("" + e2).toLowerCase(), i2 = true;
      }
  }
  __name(kn, "kn");
  a(kn, "byteLength");
  f2.byteLength = kn;
  function xo(r2, e2, t2) {
    let n2 = false;
    if ((e2 === void 0 || e2 < 0) && (e2 = 0), e2 > this.length || ((t2 === void 0 || t2 > this.length) && (t2 = this.length), t2 <= 0) || (t2 >>>= 0, e2 >>>= 0, t2 <= e2))
      return "";
    for (r2 || (r2 = "utf8"); ; )
      switch (r2) {
        case "hex":
          return Lo(
            this,
            e2,
            t2
          );
        case "utf8":
        case "utf-8":
          return On(this, e2, t2);
        case "ascii":
          return Po(
            this,
            e2,
            t2
          );
        case "latin1":
        case "binary":
          return Bo(this, e2, t2);
        case "base64":
          return To(
            this,
            e2,
            t2
          );
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return Ro(this, e2, t2);
        default:
          if (n2)
            throw new TypeError("Unknown encoding: " + r2);
          r2 = (r2 + "").toLowerCase(), n2 = true;
      }
  }
  __name(xo, "xo");
  a(
    xo,
    "slowToString"
  );
  f2.prototype._isBuffer = true;
  function Ee(r2, e2, t2) {
    let n2 = r2[e2];
    r2[e2] = r2[t2], r2[t2] = n2;
  }
  __name(Ee, "Ee");
  a(Ee, "swap");
  f2.prototype.swap16 = a(function() {
    let e2 = this.length;
    if (e2 % 2 !== 0)
      throw new RangeError("Buffer size must be a multiple of 16-bits");
    for (let t2 = 0; t2 < e2; t2 += 2)
      Ee(this, t2, t2 + 1);
    return this;
  }, "swap16");
  f2.prototype.swap32 = a(function() {
    let e2 = this.length;
    if (e2 % 4 !== 0)
      throw new RangeError("Buffer size must be a multiple of 32-bits");
    for (let t2 = 0; t2 < e2; t2 += 4)
      Ee(this, t2, t2 + 3), Ee(this, t2 + 1, t2 + 2);
    return this;
  }, "swap32");
  f2.prototype.swap64 = a(function() {
    let e2 = this.length;
    if (e2 % 8 !== 0)
      throw new RangeError(
        "Buffer size must be a multiple of 64-bits"
      );
    for (let t2 = 0; t2 < e2; t2 += 8)
      Ee(this, t2, t2 + 7), Ee(this, t2 + 1, t2 + 6), Ee(this, t2 + 2, t2 + 5), Ee(this, t2 + 3, t2 + 4);
    return this;
  }, "swap64");
  f2.prototype.toString = a(function() {
    let e2 = this.length;
    return e2 === 0 ? "" : arguments.length === 0 ? On(
      this,
      0,
      e2
    ) : xo.apply(this, arguments);
  }, "toString");
  f2.prototype.toLocaleString = f2.prototype.toString;
  f2.prototype.equals = a(function(e2) {
    if (!f2.isBuffer(e2))
      throw new TypeError(
        "Argument must be a Buffer"
      );
    return this === e2 ? true : f2.compare(this, e2) === 0;
  }, "equals");
  f2.prototype.inspect = a(function() {
    let e2 = "", t2 = Le.INSPECT_MAX_BYTES;
    return e2 = this.toString(
      "hex",
      0,
      t2
    ).replace(/(.{2})/g, "$1 ").trim(), this.length > t2 && (e2 += " ... "), "<Buffer " + e2 + ">";
  }, "inspect");
  Bn && (f2.prototype[Bn] = f2.prototype.inspect);
  f2.prototype.compare = a(function(e2, t2, n2, i2, s2) {
    if (ue(e2, Uint8Array) && (e2 = f2.from(e2, e2.offset, e2.byteLength)), !f2.isBuffer(e2))
      throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof e2);
    if (t2 === void 0 && (t2 = 0), n2 === void 0 && (n2 = e2 ? e2.length : 0), i2 === void 0 && (i2 = 0), s2 === void 0 && (s2 = this.length), t2 < 0 || n2 > e2.length || i2 < 0 || s2 > this.length)
      throw new RangeError("out of range index");
    if (i2 >= s2 && t2 >= n2)
      return 0;
    if (i2 >= s2)
      return -1;
    if (t2 >= n2)
      return 1;
    if (t2 >>>= 0, n2 >>>= 0, i2 >>>= 0, s2 >>>= 0, this === e2)
      return 0;
    let o2 = s2 - i2, u2 = n2 - t2, c2 = Math.min(o2, u2), h2 = this.slice(i2, s2), l2 = e2.slice(t2, n2);
    for (let d2 = 0; d2 < c2; ++d2)
      if (h2[d2] !== l2[d2]) {
        o2 = h2[d2], u2 = l2[d2];
        break;
      }
    return o2 < u2 ? -1 : u2 < o2 ? 1 : 0;
  }, "compare");
  function Un(r2, e2, t2, n2, i2) {
    if (r2.length === 0)
      return -1;
    if (typeof t2 == "string" ? (n2 = t2, t2 = 0) : t2 > 2147483647 ? t2 = 2147483647 : t2 < -2147483648 && (t2 = -2147483648), t2 = +t2, Ot(t2) && (t2 = i2 ? 0 : r2.length - 1), t2 < 0 && (t2 = r2.length + t2), t2 >= r2.length) {
      if (i2)
        return -1;
      t2 = r2.length - 1;
    } else if (t2 < 0)
      if (i2)
        t2 = 0;
      else
        return -1;
    if (typeof e2 == "string" && (e2 = f2.from(e2, n2)), f2.isBuffer(e2))
      return e2.length === 0 ? -1 : Ln(r2, e2, t2, n2, i2);
    if (typeof e2 == "number")
      return e2 = e2 & 255, typeof Uint8Array.prototype.indexOf == "function" ? i2 ? Uint8Array.prototype.indexOf.call(r2, e2, t2) : Uint8Array.prototype.lastIndexOf.call(r2, e2, t2) : Ln(
        r2,
        [e2],
        t2,
        n2,
        i2
      );
    throw new TypeError("val must be string, number or Buffer");
  }
  __name(Un, "Un");
  a(Un, "bidirectionalIndexOf");
  function Ln(r2, e2, t2, n2, i2) {
    let s2 = 1, o2 = r2.length, u2 = e2.length;
    if (n2 !== void 0 && (n2 = String(n2).toLowerCase(), n2 === "ucs2" || n2 === "ucs-2" || n2 === "utf16le" || n2 === "utf-16le")) {
      if (r2.length < 2 || e2.length < 2)
        return -1;
      s2 = 2, o2 /= 2, u2 /= 2, t2 /= 2;
    }
    function c2(l2, d2) {
      return s2 === 1 ? l2[d2] : l2.readUInt16BE(d2 * s2);
    }
    __name(c2, "c");
    a(c2, "read");
    let h2;
    if (i2) {
      let l2 = -1;
      for (h2 = t2; h2 < o2; h2++)
        if (c2(r2, h2) === c2(e2, l2 === -1 ? 0 : h2 - l2)) {
          if (l2 === -1 && (l2 = h2), h2 - l2 + 1 === u2)
            return l2 * s2;
        } else
          l2 !== -1 && (h2 -= h2 - l2), l2 = -1;
    } else
      for (t2 + u2 > o2 && (t2 = o2 - u2), h2 = t2; h2 >= 0; h2--) {
        let l2 = true;
        for (let d2 = 0; d2 < u2; d2++)
          if (c2(r2, h2 + d2) !== c2(e2, d2)) {
            l2 = false;
            break;
          }
        if (l2)
          return h2;
      }
    return -1;
  }
  __name(Ln, "Ln");
  a(Ln, "arrayIndexOf");
  f2.prototype.includes = a(function(e2, t2, n2) {
    return this.indexOf(e2, t2, n2) !== -1;
  }, "includes");
  f2.prototype.indexOf = a(function(e2, t2, n2) {
    return Un(this, e2, t2, n2, true);
  }, "indexOf");
  f2.prototype.lastIndexOf = a(function(e2, t2, n2) {
    return Un(this, e2, t2, n2, false);
  }, "lastIndexOf");
  function vo(r2, e2, t2, n2) {
    t2 = Number(t2) || 0;
    let i2 = r2.length - t2;
    n2 ? (n2 = Number(n2), n2 > i2 && (n2 = i2)) : n2 = i2;
    let s2 = e2.length;
    n2 > s2 / 2 && (n2 = s2 / 2);
    let o2;
    for (o2 = 0; o2 < n2; ++o2) {
      let u2 = parseInt(e2.substr(o2 * 2, 2), 16);
      if (Ot(u2))
        return o2;
      r2[t2 + o2] = u2;
    }
    return o2;
  }
  __name(vo, "vo");
  a(vo, "hexWrite");
  function Eo(r2, e2, t2, n2) {
    return st(Mt(
      e2,
      r2.length - t2
    ), r2, t2, n2);
  }
  __name(Eo, "Eo");
  a(Eo, "utf8Write");
  function _o(r2, e2, t2, n2) {
    return st(ko(e2), r2, t2, n2);
  }
  __name(_o, "_o");
  a(_o, "asciiWrite");
  function Ao(r2, e2, t2, n2) {
    return st(Gn(e2), r2, t2, n2);
  }
  __name(Ao, "Ao");
  a(Ao, "base64Write");
  function Co(r2, e2, t2, n2) {
    return st(Uo(e2, r2.length - t2), r2, t2, n2);
  }
  __name(Co, "Co");
  a(Co, "ucs2Write");
  f2.prototype.write = a(function(e2, t2, n2, i2) {
    if (t2 === void 0)
      i2 = "utf8", n2 = this.length, t2 = 0;
    else if (n2 === void 0 && typeof t2 == "string")
      i2 = t2, n2 = this.length, t2 = 0;
    else if (isFinite(t2))
      t2 = t2 >>> 0, isFinite(n2) ? (n2 = n2 >>> 0, i2 === void 0 && (i2 = "utf8")) : (i2 = n2, n2 = void 0);
    else
      throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
    let s2 = this.length - t2;
    if ((n2 === void 0 || n2 > s2) && (n2 = s2), e2.length > 0 && (n2 < 0 || t2 < 0) || t2 > this.length)
      throw new RangeError(
        "Attempt to write outside buffer bounds"
      );
    i2 || (i2 = "utf8");
    let o2 = false;
    for (; ; )
      switch (i2) {
        case "hex":
          return vo(this, e2, t2, n2);
        case "utf8":
        case "utf-8":
          return Eo(this, e2, t2, n2);
        case "ascii":
        case "latin1":
        case "binary":
          return _o(this, e2, t2, n2);
        case "base64":
          return Ao(
            this,
            e2,
            t2,
            n2
          );
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return Co(this, e2, t2, n2);
        default:
          if (o2)
            throw new TypeError("Unknown encoding: " + i2);
          i2 = ("" + i2).toLowerCase(), o2 = true;
      }
  }, "write");
  f2.prototype.toJSON = a(function() {
    return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
  }, "toJSON");
  function To(r2, e2, t2) {
    return e2 === 0 && t2 === r2.length ? Lt.fromByteArray(r2) : Lt.fromByteArray(r2.slice(e2, t2));
  }
  __name(To, "To");
  a(To, "base64Slice");
  function On(r2, e2, t2) {
    t2 = Math.min(r2.length, t2);
    let n2 = [], i2 = e2;
    for (; i2 < t2; ) {
      let s2 = r2[i2], o2 = null, u2 = s2 > 239 ? 4 : s2 > 223 ? 3 : s2 > 191 ? 2 : 1;
      if (i2 + u2 <= t2) {
        let c2, h2, l2, d2;
        switch (u2) {
          case 1:
            s2 < 128 && (o2 = s2);
            break;
          case 2:
            c2 = r2[i2 + 1], (c2 & 192) === 128 && (d2 = (s2 & 31) << 6 | c2 & 63, d2 > 127 && (o2 = d2));
            break;
          case 3:
            c2 = r2[i2 + 1], h2 = r2[i2 + 2], (c2 & 192) === 128 && (h2 & 192) === 128 && (d2 = (s2 & 15) << 12 | (c2 & 63) << 6 | h2 & 63, d2 > 2047 && (d2 < 55296 || d2 > 57343) && (o2 = d2));
            break;
          case 4:
            c2 = r2[i2 + 1], h2 = r2[i2 + 2], l2 = r2[i2 + 3], (c2 & 192) === 128 && (h2 & 192) === 128 && (l2 & 192) === 128 && (d2 = (s2 & 15) << 18 | (c2 & 63) << 12 | (h2 & 63) << 6 | l2 & 63, d2 > 65535 && d2 < 1114112 && (o2 = d2));
        }
      }
      o2 === null ? (o2 = 65533, u2 = 1) : o2 > 65535 && (o2 -= 65536, n2.push(o2 >>> 10 & 1023 | 55296), o2 = 56320 | o2 & 1023), n2.push(o2), i2 += u2;
    }
    return Io(n2);
  }
  __name(On, "On");
  a(On, "utf8Slice");
  var Rn = 4096;
  function Io(r2) {
    let e2 = r2.length;
    if (e2 <= Rn)
      return String.fromCharCode.apply(String, r2);
    let t2 = "", n2 = 0;
    for (; n2 < e2; )
      t2 += String.fromCharCode.apply(String, r2.slice(n2, n2 += Rn));
    return t2;
  }
  __name(Io, "Io");
  a(Io, "decodeCodePointsArray");
  function Po(r2, e2, t2) {
    let n2 = "";
    t2 = Math.min(r2.length, t2);
    for (let i2 = e2; i2 < t2; ++i2)
      n2 += String.fromCharCode(r2[i2] & 127);
    return n2;
  }
  __name(Po, "Po");
  a(Po, "asciiSlice");
  function Bo(r2, e2, t2) {
    let n2 = "";
    t2 = Math.min(r2.length, t2);
    for (let i2 = e2; i2 < t2; ++i2)
      n2 += String.fromCharCode(r2[i2]);
    return n2;
  }
  __name(Bo, "Bo");
  a(Bo, "latin1Slice");
  function Lo(r2, e2, t2) {
    let n2 = r2.length;
    (!e2 || e2 < 0) && (e2 = 0), (!t2 || t2 < 0 || t2 > n2) && (t2 = n2);
    let i2 = "";
    for (let s2 = e2; s2 < t2; ++s2)
      i2 += Oo[r2[s2]];
    return i2;
  }
  __name(Lo, "Lo");
  a(Lo, "hexSlice");
  function Ro(r2, e2, t2) {
    let n2 = r2.slice(e2, t2), i2 = "";
    for (let s2 = 0; s2 < n2.length - 1; s2 += 2)
      i2 += String.fromCharCode(n2[s2] + n2[s2 + 1] * 256);
    return i2;
  }
  __name(Ro, "Ro");
  a(Ro, "utf16leSlice");
  f2.prototype.slice = a(function(e2, t2) {
    let n2 = this.length;
    e2 = ~~e2, t2 = t2 === void 0 ? n2 : ~~t2, e2 < 0 ? (e2 += n2, e2 < 0 && (e2 = 0)) : e2 > n2 && (e2 = n2), t2 < 0 ? (t2 += n2, t2 < 0 && (t2 = 0)) : t2 > n2 && (t2 = n2), t2 < e2 && (t2 = e2);
    let i2 = this.subarray(
      e2,
      t2
    );
    return Object.setPrototypeOf(i2, f2.prototype), i2;
  }, "slice");
  function q2(r2, e2, t2) {
    if (r2 % 1 !== 0 || r2 < 0)
      throw new RangeError("offset is not uint");
    if (r2 + e2 > t2)
      throw new RangeError(
        "Trying to access beyond buffer length"
      );
  }
  __name(q2, "q");
  a(q2, "checkOffset");
  f2.prototype.readUintLE = f2.prototype.readUIntLE = a(function(e2, t2, n2) {
    e2 = e2 >>> 0, t2 = t2 >>> 0, n2 || q2(e2, t2, this.length);
    let i2 = this[e2], s2 = 1, o2 = 0;
    for (; ++o2 < t2 && (s2 *= 256); )
      i2 += this[e2 + o2] * s2;
    return i2;
  }, "readUIntLE");
  f2.prototype.readUintBE = f2.prototype.readUIntBE = a(function(e2, t2, n2) {
    e2 = e2 >>> 0, t2 = t2 >>> 0, n2 || q2(e2, t2, this.length);
    let i2 = this[e2 + --t2], s2 = 1;
    for (; t2 > 0 && (s2 *= 256); )
      i2 += this[e2 + --t2] * s2;
    return i2;
  }, "readUIntBE");
  f2.prototype.readUint8 = f2.prototype.readUInt8 = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 1, this.length), this[e2];
  }, "readUInt8");
  f2.prototype.readUint16LE = f2.prototype.readUInt16LE = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 2, this.length), this[e2] | this[e2 + 1] << 8;
  }, "readUInt16LE");
  f2.prototype.readUint16BE = f2.prototype.readUInt16BE = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 2, this.length), this[e2] << 8 | this[e2 + 1];
  }, "readUInt16BE");
  f2.prototype.readUint32LE = f2.prototype.readUInt32LE = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 4, this.length), (this[e2] | this[e2 + 1] << 8 | this[e2 + 2] << 16) + this[e2 + 3] * 16777216;
  }, "readUInt32LE");
  f2.prototype.readUint32BE = f2.prototype.readUInt32BE = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 4, this.length), this[e2] * 16777216 + (this[e2 + 1] << 16 | this[e2 + 2] << 8 | this[e2 + 3]);
  }, "readUInt32BE");
  f2.prototype.readBigUInt64LE = ge(a(function(e2) {
    e2 = e2 >>> 0, Be(e2, "offset");
    let t2 = this[e2], n2 = this[e2 + 7];
    (t2 === void 0 || n2 === void 0) && We(e2, this.length - 8);
    let i2 = t2 + this[++e2] * 2 ** 8 + this[++e2] * 2 ** 16 + this[++e2] * 2 ** 24, s2 = this[++e2] + this[++e2] * 2 ** 8 + this[++e2] * 2 ** 16 + n2 * 2 ** 24;
    return BigInt(i2) + (BigInt(s2) << BigInt(32));
  }, "readBigUInt64LE"));
  f2.prototype.readBigUInt64BE = ge(a(function(e2) {
    e2 = e2 >>> 0, Be(e2, "offset");
    let t2 = this[e2], n2 = this[e2 + 7];
    (t2 === void 0 || n2 === void 0) && We(e2, this.length - 8);
    let i2 = t2 * 2 ** 24 + this[++e2] * 2 ** 16 + this[++e2] * 2 ** 8 + this[++e2], s2 = this[++e2] * 2 ** 24 + this[++e2] * 2 ** 16 + this[++e2] * 2 ** 8 + n2;
    return (BigInt(
      i2
    ) << BigInt(32)) + BigInt(s2);
  }, "readBigUInt64BE"));
  f2.prototype.readIntLE = a(function(e2, t2, n2) {
    e2 = e2 >>> 0, t2 = t2 >>> 0, n2 || q2(e2, t2, this.length);
    let i2 = this[e2], s2 = 1, o2 = 0;
    for (; ++o2 < t2 && (s2 *= 256); )
      i2 += this[e2 + o2] * s2;
    return s2 *= 128, i2 >= s2 && (i2 -= Math.pow(2, 8 * t2)), i2;
  }, "readIntLE");
  f2.prototype.readIntBE = a(function(e2, t2, n2) {
    e2 = e2 >>> 0, t2 = t2 >>> 0, n2 || q2(e2, t2, this.length);
    let i2 = t2, s2 = 1, o2 = this[e2 + --i2];
    for (; i2 > 0 && (s2 *= 256); )
      o2 += this[e2 + --i2] * s2;
    return s2 *= 128, o2 >= s2 && (o2 -= Math.pow(2, 8 * t2)), o2;
  }, "readIntBE");
  f2.prototype.readInt8 = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 1, this.length), this[e2] & 128 ? (255 - this[e2] + 1) * -1 : this[e2];
  }, "readInt8");
  f2.prototype.readInt16LE = a(function(e2, t2) {
    e2 = e2 >>> 0, t2 || q2(e2, 2, this.length);
    let n2 = this[e2] | this[e2 + 1] << 8;
    return n2 & 32768 ? n2 | 4294901760 : n2;
  }, "readInt16LE");
  f2.prototype.readInt16BE = a(
    function(e2, t2) {
      e2 = e2 >>> 0, t2 || q2(e2, 2, this.length);
      let n2 = this[e2 + 1] | this[e2] << 8;
      return n2 & 32768 ? n2 | 4294901760 : n2;
    },
    "readInt16BE"
  );
  f2.prototype.readInt32LE = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 4, this.length), this[e2] | this[e2 + 1] << 8 | this[e2 + 2] << 16 | this[e2 + 3] << 24;
  }, "readInt32LE");
  f2.prototype.readInt32BE = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 4, this.length), this[e2] << 24 | this[e2 + 1] << 16 | this[e2 + 2] << 8 | this[e2 + 3];
  }, "readInt32BE");
  f2.prototype.readBigInt64LE = ge(a(function(e2) {
    e2 = e2 >>> 0, Be(e2, "offset");
    let t2 = this[e2], n2 = this[e2 + 7];
    (t2 === void 0 || n2 === void 0) && We(
      e2,
      this.length - 8
    );
    let i2 = this[e2 + 4] + this[e2 + 5] * 2 ** 8 + this[e2 + 6] * 2 ** 16 + (n2 << 24);
    return (BigInt(
      i2
    ) << BigInt(32)) + BigInt(t2 + this[++e2] * 2 ** 8 + this[++e2] * 2 ** 16 + this[++e2] * 2 ** 24);
  }, "readBigInt64LE"));
  f2.prototype.readBigInt64BE = ge(a(function(e2) {
    e2 = e2 >>> 0, Be(e2, "offset");
    let t2 = this[e2], n2 = this[e2 + 7];
    (t2 === void 0 || n2 === void 0) && We(e2, this.length - 8);
    let i2 = (t2 << 24) + this[++e2] * 2 ** 16 + this[++e2] * 2 ** 8 + this[++e2];
    return (BigInt(i2) << BigInt(32)) + BigInt(
      this[++e2] * 2 ** 24 + this[++e2] * 2 ** 16 + this[++e2] * 2 ** 8 + n2
    );
  }, "readBigInt64BE"));
  f2.prototype.readFloatLE = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 4, this.length), Pe.read(
      this,
      e2,
      true,
      23,
      4
    );
  }, "readFloatLE");
  f2.prototype.readFloatBE = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 4, this.length), Pe.read(this, e2, false, 23, 4);
  }, "readFloatBE");
  f2.prototype.readDoubleLE = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 8, this.length), Pe.read(this, e2, true, 52, 8);
  }, "readDoubleLE");
  f2.prototype.readDoubleBE = a(function(e2, t2) {
    return e2 = e2 >>> 0, t2 || q2(e2, 8, this.length), Pe.read(this, e2, false, 52, 8);
  }, "readDoubleBE");
  function Y2(r2, e2, t2, n2, i2, s2) {
    if (!f2.isBuffer(
      r2
    ))
      throw new TypeError('"buffer" argument must be a Buffer instance');
    if (e2 > i2 || e2 < s2)
      throw new RangeError('"value" argument is out of bounds');
    if (t2 + n2 > r2.length)
      throw new RangeError(
        "Index out of range"
      );
  }
  __name(Y2, "Y");
  a(Y2, "checkInt");
  f2.prototype.writeUintLE = f2.prototype.writeUIntLE = a(function(e2, t2, n2, i2) {
    if (e2 = +e2, t2 = t2 >>> 0, n2 = n2 >>> 0, !i2) {
      let u2 = Math.pow(2, 8 * n2) - 1;
      Y2(
        this,
        e2,
        t2,
        n2,
        u2,
        0
      );
    }
    let s2 = 1, o2 = 0;
    for (this[t2] = e2 & 255; ++o2 < n2 && (s2 *= 256); )
      this[t2 + o2] = e2 / s2 & 255;
    return t2 + n2;
  }, "writeUIntLE");
  f2.prototype.writeUintBE = f2.prototype.writeUIntBE = a(function(e2, t2, n2, i2) {
    if (e2 = +e2, t2 = t2 >>> 0, n2 = n2 >>> 0, !i2) {
      let u2 = Math.pow(2, 8 * n2) - 1;
      Y2(this, e2, t2, n2, u2, 0);
    }
    let s2 = n2 - 1, o2 = 1;
    for (this[t2 + s2] = e2 & 255; --s2 >= 0 && (o2 *= 256); )
      this[t2 + s2] = e2 / o2 & 255;
    return t2 + n2;
  }, "writeUIntBE");
  f2.prototype.writeUint8 = f2.prototype.writeUInt8 = a(function(e2, t2, n2) {
    return e2 = +e2, t2 = t2 >>> 0, n2 || Y2(this, e2, t2, 1, 255, 0), this[t2] = e2 & 255, t2 + 1;
  }, "writeUInt8");
  f2.prototype.writeUint16LE = f2.prototype.writeUInt16LE = a(function(e2, t2, n2) {
    return e2 = +e2, t2 = t2 >>> 0, n2 || Y2(
      this,
      e2,
      t2,
      2,
      65535,
      0
    ), this[t2] = e2 & 255, this[t2 + 1] = e2 >>> 8, t2 + 2;
  }, "writeUInt16LE");
  f2.prototype.writeUint16BE = f2.prototype.writeUInt16BE = a(function(e2, t2, n2) {
    return e2 = +e2, t2 = t2 >>> 0, n2 || Y2(
      this,
      e2,
      t2,
      2,
      65535,
      0
    ), this[t2] = e2 >>> 8, this[t2 + 1] = e2 & 255, t2 + 2;
  }, "writeUInt16BE");
  f2.prototype.writeUint32LE = f2.prototype.writeUInt32LE = a(function(e2, t2, n2) {
    return e2 = +e2, t2 = t2 >>> 0, n2 || Y2(
      this,
      e2,
      t2,
      4,
      4294967295,
      0
    ), this[t2 + 3] = e2 >>> 24, this[t2 + 2] = e2 >>> 16, this[t2 + 1] = e2 >>> 8, this[t2] = e2 & 255, t2 + 4;
  }, "writeUInt32LE");
  f2.prototype.writeUint32BE = f2.prototype.writeUInt32BE = a(function(e2, t2, n2) {
    return e2 = +e2, t2 = t2 >>> 0, n2 || Y2(this, e2, t2, 4, 4294967295, 0), this[t2] = e2 >>> 24, this[t2 + 1] = e2 >>> 16, this[t2 + 2] = e2 >>> 8, this[t2 + 3] = e2 & 255, t2 + 4;
  }, "writeUInt32BE");
  function Nn(r2, e2, t2, n2, i2) {
    Hn(
      e2,
      n2,
      i2,
      r2,
      t2,
      7
    );
    let s2 = Number(e2 & BigInt(4294967295));
    r2[t2++] = s2, s2 = s2 >> 8, r2[t2++] = s2, s2 = s2 >> 8, r2[t2++] = s2, s2 = s2 >> 8, r2[t2++] = s2;
    let o2 = Number(e2 >> BigInt(32) & BigInt(4294967295));
    return r2[t2++] = o2, o2 = o2 >> 8, r2[t2++] = o2, o2 = o2 >> 8, r2[t2++] = o2, o2 = o2 >> 8, r2[t2++] = o2, t2;
  }
  __name(Nn, "Nn");
  a(Nn, "wrtBigUInt64LE");
  function qn(r2, e2, t2, n2, i2) {
    Hn(e2, n2, i2, r2, t2, 7);
    let s2 = Number(e2 & BigInt(4294967295));
    r2[t2 + 7] = s2, s2 = s2 >> 8, r2[t2 + 6] = s2, s2 = s2 >> 8, r2[t2 + 5] = s2, s2 = s2 >> 8, r2[t2 + 4] = s2;
    let o2 = Number(e2 >> BigInt(32) & BigInt(4294967295));
    return r2[t2 + 3] = o2, o2 = o2 >> 8, r2[t2 + 2] = o2, o2 = o2 >> 8, r2[t2 + 1] = o2, o2 = o2 >> 8, r2[t2] = o2, t2 + 8;
  }
  __name(qn, "qn");
  a(qn, "wrtBigUInt64BE");
  f2.prototype.writeBigUInt64LE = ge(a(function(e2, t2 = 0) {
    return Nn(this, e2, t2, BigInt(0), BigInt(
      "0xffffffffffffffff"
    ));
  }, "writeBigUInt64LE"));
  f2.prototype.writeBigUInt64BE = ge(a(function(e2, t2 = 0) {
    return qn(this, e2, t2, BigInt(0), BigInt("0xffffffffffffffff"));
  }, "writeBigUInt64BE"));
  f2.prototype.writeIntLE = a(function(e2, t2, n2, i2) {
    if (e2 = +e2, t2 = t2 >>> 0, !i2) {
      let c2 = Math.pow(
        2,
        8 * n2 - 1
      );
      Y2(this, e2, t2, n2, c2 - 1, -c2);
    }
    let s2 = 0, o2 = 1, u2 = 0;
    for (this[t2] = e2 & 255; ++s2 < n2 && (o2 *= 256); )
      e2 < 0 && u2 === 0 && this[t2 + s2 - 1] !== 0 && (u2 = 1), this[t2 + s2] = (e2 / o2 >> 0) - u2 & 255;
    return t2 + n2;
  }, "writeIntLE");
  f2.prototype.writeIntBE = a(function(e2, t2, n2, i2) {
    if (e2 = +e2, t2 = t2 >>> 0, !i2) {
      let c2 = Math.pow(
        2,
        8 * n2 - 1
      );
      Y2(this, e2, t2, n2, c2 - 1, -c2);
    }
    let s2 = n2 - 1, o2 = 1, u2 = 0;
    for (this[t2 + s2] = e2 & 255; --s2 >= 0 && (o2 *= 256); )
      e2 < 0 && u2 === 0 && this[t2 + s2 + 1] !== 0 && (u2 = 1), this[t2 + s2] = (e2 / o2 >> 0) - u2 & 255;
    return t2 + n2;
  }, "writeIntBE");
  f2.prototype.writeInt8 = a(function(e2, t2, n2) {
    return e2 = +e2, t2 = t2 >>> 0, n2 || Y2(
      this,
      e2,
      t2,
      1,
      127,
      -128
    ), e2 < 0 && (e2 = 255 + e2 + 1), this[t2] = e2 & 255, t2 + 1;
  }, "writeInt8");
  f2.prototype.writeInt16LE = a(function(e2, t2, n2) {
    return e2 = +e2, t2 = t2 >>> 0, n2 || Y2(this, e2, t2, 2, 32767, -32768), this[t2] = e2 & 255, this[t2 + 1] = e2 >>> 8, t2 + 2;
  }, "writeInt16LE");
  f2.prototype.writeInt16BE = a(function(e2, t2, n2) {
    return e2 = +e2, t2 = t2 >>> 0, n2 || Y2(this, e2, t2, 2, 32767, -32768), this[t2] = e2 >>> 8, this[t2 + 1] = e2 & 255, t2 + 2;
  }, "writeInt16BE");
  f2.prototype.writeInt32LE = a(function(e2, t2, n2) {
    return e2 = +e2, t2 = t2 >>> 0, n2 || Y2(this, e2, t2, 4, 2147483647, -2147483648), this[t2] = e2 & 255, this[t2 + 1] = e2 >>> 8, this[t2 + 2] = e2 >>> 16, this[t2 + 3] = e2 >>> 24, t2 + 4;
  }, "writeInt32LE");
  f2.prototype.writeInt32BE = a(function(e2, t2, n2) {
    return e2 = +e2, t2 = t2 >>> 0, n2 || Y2(this, e2, t2, 4, 2147483647, -2147483648), e2 < 0 && (e2 = 4294967295 + e2 + 1), this[t2] = e2 >>> 24, this[t2 + 1] = e2 >>> 16, this[t2 + 2] = e2 >>> 8, this[t2 + 3] = e2 & 255, t2 + 4;
  }, "writeInt32BE");
  f2.prototype.writeBigInt64LE = ge(a(function(e2, t2 = 0) {
    return Nn(this, e2, t2, -BigInt(
      "0x8000000000000000"
    ), BigInt("0x7fffffffffffffff"));
  }, "writeBigInt64LE"));
  f2.prototype.writeBigInt64BE = ge(a(function(e2, t2 = 0) {
    return qn(this, e2, t2, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  }, "writeBigInt64BE"));
  function Qn(r2, e2, t2, n2, i2, s2) {
    if (t2 + n2 > r2.length)
      throw new RangeError("Index out of range");
    if (t2 < 0)
      throw new RangeError(
        "Index out of range"
      );
  }
  __name(Qn, "Qn");
  a(Qn, "checkIEEE754");
  function Wn(r2, e2, t2, n2, i2) {
    return e2 = +e2, t2 = t2 >>> 0, i2 || Qn(r2, e2, t2, 4, 34028234663852886e22, -34028234663852886e22), Pe.write(
      r2,
      e2,
      t2,
      n2,
      23,
      4
    ), t2 + 4;
  }
  __name(Wn, "Wn");
  a(Wn, "writeFloat");
  f2.prototype.writeFloatLE = a(function(e2, t2, n2) {
    return Wn(
      this,
      e2,
      t2,
      true,
      n2
    );
  }, "writeFloatLE");
  f2.prototype.writeFloatBE = a(function(e2, t2, n2) {
    return Wn(
      this,
      e2,
      t2,
      false,
      n2
    );
  }, "writeFloatBE");
  function jn(r2, e2, t2, n2, i2) {
    return e2 = +e2, t2 = t2 >>> 0, i2 || Qn(
      r2,
      e2,
      t2,
      8,
      17976931348623157e292,
      -17976931348623157e292
    ), Pe.write(r2, e2, t2, n2, 52, 8), t2 + 8;
  }
  __name(jn, "jn");
  a(jn, "writeDouble");
  f2.prototype.writeDoubleLE = a(function(e2, t2, n2) {
    return jn(
      this,
      e2,
      t2,
      true,
      n2
    );
  }, "writeDoubleLE");
  f2.prototype.writeDoubleBE = a(function(e2, t2, n2) {
    return jn(
      this,
      e2,
      t2,
      false,
      n2
    );
  }, "writeDoubleBE");
  f2.prototype.copy = a(function(e2, t2, n2, i2) {
    if (!f2.isBuffer(
      e2
    ))
      throw new TypeError("argument should be a Buffer");
    if (n2 || (n2 = 0), !i2 && i2 !== 0 && (i2 = this.length), t2 >= e2.length && (t2 = e2.length), t2 || (t2 = 0), i2 > 0 && i2 < n2 && (i2 = n2), i2 === n2 || e2.length === 0 || this.length === 0)
      return 0;
    if (t2 < 0)
      throw new RangeError("targetStart out of bounds");
    if (n2 < 0 || n2 >= this.length)
      throw new RangeError("Index out of range");
    if (i2 < 0)
      throw new RangeError(
        "sourceEnd out of bounds"
      );
    i2 > this.length && (i2 = this.length), e2.length - t2 < i2 - n2 && (i2 = e2.length - t2 + n2);
    let s2 = i2 - n2;
    return this === e2 && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(t2, n2, i2) : Uint8Array.prototype.set.call(e2, this.subarray(n2, i2), t2), s2;
  }, "copy");
  f2.prototype.fill = a(function(e2, t2, n2, i2) {
    if (typeof e2 == "string") {
      if (typeof t2 == "string" ? (i2 = t2, t2 = 0, n2 = this.length) : typeof n2 == "string" && (i2 = n2, n2 = this.length), i2 !== void 0 && typeof i2 != "string")
        throw new TypeError("encoding must be a string");
      if (typeof i2 == "string" && !f2.isEncoding(i2))
        throw new TypeError("Unknown encoding: " + i2);
      if (e2.length === 1) {
        let o2 = e2.charCodeAt(0);
        (i2 === "utf8" && o2 < 128 || i2 === "latin1") && (e2 = o2);
      }
    } else
      typeof e2 == "number" ? e2 = e2 & 255 : typeof e2 == "boolean" && (e2 = Number(e2));
    if (t2 < 0 || this.length < t2 || this.length < n2)
      throw new RangeError("Out of range index");
    if (n2 <= t2)
      return this;
    t2 = t2 >>> 0, n2 = n2 === void 0 ? this.length : n2 >>> 0, e2 || (e2 = 0);
    let s2;
    if (typeof e2 == "number")
      for (s2 = t2; s2 < n2; ++s2)
        this[s2] = e2;
    else {
      let o2 = f2.isBuffer(e2) ? e2 : f2.from(e2, i2), u2 = o2.length;
      if (u2 === 0)
        throw new TypeError(
          'The value "' + e2 + '" is invalid for argument "value"'
        );
      for (s2 = 0; s2 < n2 - t2; ++s2)
        this[s2 + t2] = o2[s2 % u2];
    }
    return this;
  }, "fill");
  var Ie = {};
  function Ut(r2, e2, t2) {
    var n2;
    Ie[r2] = (n2 = /* @__PURE__ */ __name(class extends t2 {
      constructor() {
        super(), Object.defineProperty(this, "message", {
          value: e2.apply(this, arguments),
          writable: true,
          configurable: true
        }), this.name = `${this.name} [${r2}]`, this.stack, delete this.name;
      }
      get code() {
        return r2;
      }
      set code(s2) {
        Object.defineProperty(this, "code", {
          configurable: true,
          enumerable: true,
          value: s2,
          writable: true
        });
      }
      toString() {
        return `${this.name} [${r2}]: ${this.message}`;
      }
    }, "n"), a(n2, "NodeError"), n2);
  }
  __name(Ut, "Ut");
  a(Ut, "E");
  Ut("ERR_BUFFER_OUT_OF_BOUNDS", function(r2) {
    return r2 ? `${r2} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
  }, RangeError);
  Ut("ERR_INVALID_ARG_TYPE", function(r2, e2) {
    return `The "${r2}" argument must be of type number. Received type ${typeof e2}`;
  }, TypeError);
  Ut("ERR_OUT_OF_RANGE", function(r2, e2, t2) {
    let n2 = `The value of "${r2}" is out of range.`, i2 = t2;
    return Number.isInteger(t2) && Math.abs(t2) > 2 ** 32 ? i2 = Fn(String(t2)) : typeof t2 == "bigint" && (i2 = String(t2), (t2 > BigInt(2) ** BigInt(32) || t2 < -(BigInt(2) ** BigInt(32))) && (i2 = Fn(i2)), i2 += "n"), n2 += ` It must be ${e2}. Received ${i2}`, n2;
  }, RangeError);
  function Fn(r2) {
    let e2 = "", t2 = r2.length, n2 = r2[0] === "-" ? 1 : 0;
    for (; t2 >= n2 + 4; t2 -= 3)
      e2 = `_${r2.slice(t2 - 3, t2)}${e2}`;
    return `${r2.slice(
      0,
      t2
    )}${e2}`;
  }
  __name(Fn, "Fn");
  a(Fn, "addNumericalSeparator");
  function Fo(r2, e2, t2) {
    Be(e2, "offset"), (r2[e2] === void 0 || r2[e2 + t2] === void 0) && We(e2, r2.length - (t2 + 1));
  }
  __name(Fo, "Fo");
  a(Fo, "checkBounds");
  function Hn(r2, e2, t2, n2, i2, s2) {
    if (r2 > t2 || r2 < e2) {
      let o2 = typeof e2 == "bigint" ? "n" : "", u2;
      throw s2 > 3 ? e2 === 0 || e2 === BigInt(0) ? u2 = `>= 0${o2} and < 2${o2} ** ${(s2 + 1) * 8}${o2}` : u2 = `>= -(2${o2} ** ${(s2 + 1) * 8 - 1}${o2}) and < 2 ** ${(s2 + 1) * 8 - 1}${o2}` : u2 = `>= ${e2}${o2} and <= ${t2}${o2}`, new Ie.ERR_OUT_OF_RANGE(
        "value",
        u2,
        r2
      );
    }
    Fo(n2, i2, s2);
  }
  __name(Hn, "Hn");
  a(Hn, "checkIntBI");
  function Be(r2, e2) {
    if (typeof r2 != "number")
      throw new Ie.ERR_INVALID_ARG_TYPE(e2, "number", r2);
  }
  __name(Be, "Be");
  a(Be, "validateNumber");
  function We(r2, e2, t2) {
    throw Math.floor(r2) !== r2 ? (Be(r2, t2), new Ie.ERR_OUT_OF_RANGE(
      t2 || "offset",
      "an integer",
      r2
    )) : e2 < 0 ? new Ie.ERR_BUFFER_OUT_OF_BOUNDS() : new Ie.ERR_OUT_OF_RANGE(t2 || "offset", `>= ${t2 ? 1 : 0} and <= ${e2}`, r2);
  }
  __name(We, "We");
  a(We, "boundsError");
  var Mo = /[^+/0-9A-Za-z-_]/g;
  function Do(r2) {
    if (r2 = r2.split("=")[0], r2 = r2.trim().replace(Mo, ""), r2.length < 2)
      return "";
    for (; r2.length % 4 !== 0; )
      r2 = r2 + "=";
    return r2;
  }
  __name(Do, "Do");
  a(Do, "base64clean");
  function Mt(r2, e2) {
    e2 = e2 || 1 / 0;
    let t2, n2 = r2.length, i2 = null, s2 = [];
    for (let o2 = 0; o2 < n2; ++o2) {
      if (t2 = r2.charCodeAt(o2), t2 > 55295 && t2 < 57344) {
        if (!i2) {
          if (t2 > 56319) {
            (e2 -= 3) > -1 && s2.push(239, 191, 189);
            continue;
          } else if (o2 + 1 === n2) {
            (e2 -= 3) > -1 && s2.push(239, 191, 189);
            continue;
          }
          i2 = t2;
          continue;
        }
        if (t2 < 56320) {
          (e2 -= 3) > -1 && s2.push(
            239,
            191,
            189
          ), i2 = t2;
          continue;
        }
        t2 = (i2 - 55296 << 10 | t2 - 56320) + 65536;
      } else
        i2 && (e2 -= 3) > -1 && s2.push(
          239,
          191,
          189
        );
      if (i2 = null, t2 < 128) {
        if ((e2 -= 1) < 0)
          break;
        s2.push(t2);
      } else if (t2 < 2048) {
        if ((e2 -= 2) < 0)
          break;
        s2.push(t2 >> 6 | 192, t2 & 63 | 128);
      } else if (t2 < 65536) {
        if ((e2 -= 3) < 0)
          break;
        s2.push(t2 >> 12 | 224, t2 >> 6 & 63 | 128, t2 & 63 | 128);
      } else if (t2 < 1114112) {
        if ((e2 -= 4) < 0)
          break;
        s2.push(t2 >> 18 | 240, t2 >> 12 & 63 | 128, t2 >> 6 & 63 | 128, t2 & 63 | 128);
      } else
        throw new Error("Invalid code point");
    }
    return s2;
  }
  __name(Mt, "Mt");
  a(
    Mt,
    "utf8ToBytes"
  );
  function ko(r2) {
    let e2 = [];
    for (let t2 = 0; t2 < r2.length; ++t2)
      e2.push(r2.charCodeAt(
        t2
      ) & 255);
    return e2;
  }
  __name(ko, "ko");
  a(ko, "asciiToBytes");
  function Uo(r2, e2) {
    let t2, n2, i2, s2 = [];
    for (let o2 = 0; o2 < r2.length && !((e2 -= 2) < 0); ++o2)
      t2 = r2.charCodeAt(o2), n2 = t2 >> 8, i2 = t2 % 256, s2.push(i2), s2.push(n2);
    return s2;
  }
  __name(Uo, "Uo");
  a(Uo, "utf16leToBytes");
  function Gn(r2) {
    return Lt.toByteArray(Do(r2));
  }
  __name(Gn, "Gn");
  a(Gn, "base64ToBytes");
  function st(r2, e2, t2, n2) {
    let i2;
    for (i2 = 0; i2 < n2 && !(i2 + t2 >= e2.length || i2 >= r2.length); ++i2)
      e2[i2 + t2] = r2[i2];
    return i2;
  }
  __name(st, "st");
  a(st, "blitBuffer");
  function ue(r2, e2) {
    return r2 instanceof e2 || r2 != null && r2.constructor != null && r2.constructor.name != null && r2.constructor.name === e2.name;
  }
  __name(ue, "ue");
  a(ue, "isInstance");
  function Ot(r2) {
    return r2 !== r2;
  }
  __name(Ot, "Ot");
  a(Ot, "numberIsNaN");
  var Oo = function() {
    let r2 = "0123456789abcdef", e2 = new Array(256);
    for (let t2 = 0; t2 < 16; ++t2) {
      let n2 = t2 * 16;
      for (let i2 = 0; i2 < 16; ++i2)
        e2[n2 + i2] = r2[t2] + r2[i2];
    }
    return e2;
  }();
  function ge(r2) {
    return typeof BigInt > "u" ? No : r2;
  }
  __name(ge, "ge");
  a(ge, "defineBigIntMethod");
  function No() {
    throw new Error("BigInt not supported");
  }
  __name(No, "No");
  a(No, "BufferBigIntNotDefined");
});
var S;
var x;
var v;
var g;
var y;
var m;
var p = z(() => {
  "use strict";
  S = globalThis, x = globalThis.setImmediate ?? ((r2) => setTimeout(
    r2,
    0
  )), v = globalThis.clearImmediate ?? ((r2) => clearTimeout(r2)), g = globalThis.crypto ?? {};
  g.subtle ?? (g.subtle = {});
  y = typeof globalThis.Buffer == "function" && typeof globalThis.Buffer.allocUnsafe == "function" ? globalThis.Buffer : $n().Buffer, m = globalThis.process ?? {};
  m.env ?? (m.env = {});
  try {
    m.nextTick(() => {
    });
  } catch {
    let e2 = Promise.resolve();
    m.nextTick = e2.then.bind(e2);
  }
});
var we = I((Xc, Nt) => {
  "use strict";
  p();
  var Re = typeof Reflect == "object" ? Reflect : null, Vn = Re && typeof Re.apply == "function" ? Re.apply : a(function(e2, t2, n2) {
    return Function.prototype.apply.call(e2, t2, n2);
  }, "ReflectApply"), ot;
  Re && typeof Re.ownKeys == "function" ? ot = Re.ownKeys : Object.getOwnPropertySymbols ? ot = a(function(e2) {
    return Object.getOwnPropertyNames(
      e2
    ).concat(Object.getOwnPropertySymbols(e2));
  }, "ReflectOwnKeys") : ot = a(function(e2) {
    return Object.getOwnPropertyNames(e2);
  }, "ReflectOwnKeys");
  function qo(r2) {
    console && console.warn && console.warn(r2);
  }
  __name(qo, "qo");
  a(qo, "ProcessEmitWarning");
  var zn = Number.isNaN || a(function(e2) {
    return e2 !== e2;
  }, "NumberIsNaN");
  function L2() {
    L2.init.call(this);
  }
  __name(L2, "L");
  a(L2, "EventEmitter");
  Nt.exports = L2;
  Nt.exports.once = Ho;
  L2.EventEmitter = L2;
  L2.prototype._events = void 0;
  L2.prototype._eventsCount = 0;
  L2.prototype._maxListeners = void 0;
  var Kn = 10;
  function at2(r2) {
    if (typeof r2 != "function")
      throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof r2);
  }
  __name(at2, "at");
  a(at2, "checkListener");
  Object.defineProperty(L2, "defaultMaxListeners", { enumerable: true, get: a(function() {
    return Kn;
  }, "get"), set: a(function(r2) {
    if (typeof r2 != "number" || r2 < 0 || zn(r2))
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + r2 + ".");
    Kn = r2;
  }, "set") });
  L2.init = function() {
    (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
  };
  L2.prototype.setMaxListeners = a(
    function(e2) {
      if (typeof e2 != "number" || e2 < 0 || zn(e2))
        throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e2 + ".");
      return this._maxListeners = e2, this;
    },
    "setMaxListeners"
  );
  function Yn(r2) {
    return r2._maxListeners === void 0 ? L2.defaultMaxListeners : r2._maxListeners;
  }
  __name(Yn, "Yn");
  a(Yn, "_getMaxListeners");
  L2.prototype.getMaxListeners = a(function() {
    return Yn(this);
  }, "getMaxListeners");
  L2.prototype.emit = a(function(e2) {
    for (var t2 = [], n2 = 1; n2 < arguments.length; n2++)
      t2.push(arguments[n2]);
    var i2 = e2 === "error", s2 = this._events;
    if (s2 !== void 0)
      i2 = i2 && s2.error === void 0;
    else if (!i2)
      return false;
    if (i2) {
      var o2;
      if (t2.length > 0 && (o2 = t2[0]), o2 instanceof Error)
        throw o2;
      var u2 = new Error("Unhandled error." + (o2 ? " (" + o2.message + ")" : ""));
      throw u2.context = o2, u2;
    }
    var c2 = s2[e2];
    if (c2 === void 0)
      return false;
    if (typeof c2 == "function")
      Vn(c2, this, t2);
    else
      for (var h2 = c2.length, l2 = ti(c2, h2), n2 = 0; n2 < h2; ++n2)
        Vn(
          l2[n2],
          this,
          t2
        );
    return true;
  }, "emit");
  function Zn(r2, e2, t2, n2) {
    var i2, s2, o2;
    if (at2(t2), s2 = r2._events, s2 === void 0 ? (s2 = r2._events = /* @__PURE__ */ Object.create(null), r2._eventsCount = 0) : (s2.newListener !== void 0 && (r2.emit(
      "newListener",
      e2,
      t2.listener ? t2.listener : t2
    ), s2 = r2._events), o2 = s2[e2]), o2 === void 0)
      o2 = s2[e2] = t2, ++r2._eventsCount;
    else if (typeof o2 == "function" ? o2 = s2[e2] = n2 ? [t2, o2] : [o2, t2] : n2 ? o2.unshift(
      t2
    ) : o2.push(t2), i2 = Yn(r2), i2 > 0 && o2.length > i2 && !o2.warned) {
      o2.warned = true;
      var u2 = new Error("Possible EventEmitter memory leak detected. " + o2.length + " " + String(e2) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      u2.name = "MaxListenersExceededWarning", u2.emitter = r2, u2.type = e2, u2.count = o2.length, qo(u2);
    }
    return r2;
  }
  __name(Zn, "Zn");
  a(Zn, "_addListener");
  L2.prototype.addListener = a(function(e2, t2) {
    return Zn(this, e2, t2, false);
  }, "addListener");
  L2.prototype.on = L2.prototype.addListener;
  L2.prototype.prependListener = a(function(e2, t2) {
    return Zn(this, e2, t2, true);
  }, "prependListener");
  function Qo() {
    if (!this.fired)
      return this.target.removeListener(this.type, this.wrapFn), this.fired = true, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
  }
  __name(Qo, "Qo");
  a(
    Qo,
    "onceWrapper"
  );
  function Jn(r2, e2, t2) {
    var n2 = {
      fired: false,
      wrapFn: void 0,
      target: r2,
      type: e2,
      listener: t2
    }, i2 = Qo.bind(n2);
    return i2.listener = t2, n2.wrapFn = i2, i2;
  }
  __name(Jn, "Jn");
  a(Jn, "_onceWrap");
  L2.prototype.once = a(function(e2, t2) {
    return at2(t2), this.on(e2, Jn(this, e2, t2)), this;
  }, "once");
  L2.prototype.prependOnceListener = a(function(e2, t2) {
    return at2(t2), this.prependListener(e2, Jn(
      this,
      e2,
      t2
    )), this;
  }, "prependOnceListener");
  L2.prototype.removeListener = a(
    function(e2, t2) {
      var n2, i2, s2, o2, u2;
      if (at2(t2), i2 = this._events, i2 === void 0)
        return this;
      if (n2 = i2[e2], n2 === void 0)
        return this;
      if (n2 === t2 || n2.listener === t2)
        --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete i2[e2], i2.removeListener && this.emit("removeListener", e2, n2.listener || t2));
      else if (typeof n2 != "function") {
        for (s2 = -1, o2 = n2.length - 1; o2 >= 0; o2--)
          if (n2[o2] === t2 || n2[o2].listener === t2) {
            u2 = n2[o2].listener, s2 = o2;
            break;
          }
        if (s2 < 0)
          return this;
        s2 === 0 ? n2.shift() : Wo(n2, s2), n2.length === 1 && (i2[e2] = n2[0]), i2.removeListener !== void 0 && this.emit("removeListener", e2, u2 || t2);
      }
      return this;
    },
    "removeListener"
  );
  L2.prototype.off = L2.prototype.removeListener;
  L2.prototype.removeAllListeners = a(function(e2) {
    var t2, n2, i2;
    if (n2 = this._events, n2 === void 0)
      return this;
    if (n2.removeListener === void 0)
      return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : n2[e2] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete n2[e2]), this;
    if (arguments.length === 0) {
      var s2 = Object.keys(n2), o2;
      for (i2 = 0; i2 < s2.length; ++i2)
        o2 = s2[i2], o2 !== "removeListener" && this.removeAllListeners(o2);
      return this.removeAllListeners(
        "removeListener"
      ), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
    }
    if (t2 = n2[e2], typeof t2 == "function")
      this.removeListener(e2, t2);
    else if (t2 !== void 0)
      for (i2 = t2.length - 1; i2 >= 0; i2--)
        this.removeListener(e2, t2[i2]);
    return this;
  }, "removeAllListeners");
  function Xn(r2, e2, t2) {
    var n2 = r2._events;
    if (n2 === void 0)
      return [];
    var i2 = n2[e2];
    return i2 === void 0 ? [] : typeof i2 == "function" ? t2 ? [i2.listener || i2] : [i2] : t2 ? jo(i2) : ti(i2, i2.length);
  }
  __name(Xn, "Xn");
  a(Xn, "_listeners");
  L2.prototype.listeners = a(function(e2) {
    return Xn(this, e2, true);
  }, "listeners");
  L2.prototype.rawListeners = a(function(e2) {
    return Xn(this, e2, false);
  }, "rawListeners");
  L2.listenerCount = function(r2, e2) {
    return typeof r2.listenerCount == "function" ? r2.listenerCount(e2) : ei.call(r2, e2);
  };
  L2.prototype.listenerCount = ei;
  function ei(r2) {
    var e2 = this._events;
    if (e2 !== void 0) {
      var t2 = e2[r2];
      if (typeof t2 == "function")
        return 1;
      if (t2 !== void 0)
        return t2.length;
    }
    return 0;
  }
  __name(ei, "ei");
  a(ei, "listenerCount");
  L2.prototype.eventNames = a(function() {
    return this._eventsCount > 0 ? ot(this._events) : [];
  }, "eventNames");
  function ti(r2, e2) {
    for (var t2 = new Array(e2), n2 = 0; n2 < e2; ++n2)
      t2[n2] = r2[n2];
    return t2;
  }
  __name(ti, "ti");
  a(ti, "arrayClone");
  function Wo(r2, e2) {
    for (; e2 + 1 < r2.length; e2++)
      r2[e2] = r2[e2 + 1];
    r2.pop();
  }
  __name(Wo, "Wo");
  a(Wo, "spliceOne");
  function jo(r2) {
    for (var e2 = new Array(r2.length), t2 = 0; t2 < e2.length; ++t2)
      e2[t2] = r2[t2].listener || r2[t2];
    return e2;
  }
  __name(jo, "jo");
  a(jo, "unwrapListeners");
  function Ho(r2, e2) {
    return new Promise(
      function(t2, n2) {
        function i2(o2) {
          r2.removeListener(e2, s2), n2(o2);
        }
        __name(i2, "i");
        a(i2, "errorListener");
        function s2() {
          typeof r2.removeListener == "function" && r2.removeListener("error", i2), t2([].slice.call(
            arguments
          ));
        }
        __name(s2, "s");
        a(s2, "resolver"), ri(r2, e2, s2, { once: true }), e2 !== "error" && Go(r2, i2, { once: true });
      }
    );
  }
  __name(Ho, "Ho");
  a(Ho, "once");
  function Go(r2, e2, t2) {
    typeof r2.on == "function" && ri(r2, "error", e2, t2);
  }
  __name(Go, "Go");
  a(
    Go,
    "addErrorHandlerIfEventEmitter"
  );
  function ri(r2, e2, t2, n2) {
    if (typeof r2.on == "function")
      n2.once ? r2.once(e2, t2) : r2.on(e2, t2);
    else if (typeof r2.addEventListener == "function")
      r2.addEventListener(
        e2,
        a(/* @__PURE__ */ __name(function i2(s2) {
          n2.once && r2.removeEventListener(e2, i2), t2(s2);
        }, "i"), "wrapListener")
      );
    else
      throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof r2);
  }
  __name(ri, "ri");
  a(ri, "eventTargetAgnosticAddListener");
});
var je = {};
ie(je, { default: () => $o });
var $o;
var He = z(() => {
  "use strict";
  p();
  $o = {};
});
function Ge(r2) {
  let e2 = 1779033703, t2 = 3144134277, n2 = 1013904242, i2 = 2773480762, s2 = 1359893119, o2 = 2600822924, u2 = 528734635, c2 = 1541459225, h2 = 0, l2 = 0, d2 = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ], b2 = a(
    (A2, w2) => A2 >>> w2 | A2 << 32 - w2,
    "rrot"
  ), C2 = new Uint32Array(64), B2 = new Uint8Array(64), W2 = a(() => {
    for (let R2 = 0, G2 = 0; R2 < 16; R2++, G2 += 4)
      C2[R2] = B2[G2] << 24 | B2[G2 + 1] << 16 | B2[G2 + 2] << 8 | B2[G2 + 3];
    for (let R2 = 16; R2 < 64; R2++) {
      let G2 = b2(C2[R2 - 15], 7) ^ b2(C2[R2 - 15], 18) ^ C2[R2 - 15] >>> 3, he = b2(C2[R2 - 2], 17) ^ b2(C2[R2 - 2], 19) ^ C2[R2 - 2] >>> 10;
      C2[R2] = C2[R2 - 16] + G2 + C2[R2 - 7] + he | 0;
    }
    let A2 = e2, w2 = t2, P2 = n2, V2 = i2, k2 = s2, j2 = o2, ce2 = u2, ee = c2;
    for (let R2 = 0; R2 < 64; R2++) {
      let G2 = b2(
        k2,
        6
      ) ^ b2(k2, 11) ^ b2(k2, 25), he = k2 & j2 ^ ~k2 & ce2, ye = ee + G2 + he + d2[R2] + C2[R2] | 0, xe = b2(A2, 2) ^ b2(A2, 13) ^ b2(A2, 22), me = A2 & w2 ^ A2 & P2 ^ w2 & P2, se = xe + me | 0;
      ee = ce2, ce2 = j2, j2 = k2, k2 = V2 + ye | 0, V2 = P2, P2 = w2, w2 = A2, A2 = ye + se | 0;
    }
    e2 = e2 + A2 | 0, t2 = t2 + w2 | 0, n2 = n2 + P2 | 0, i2 = i2 + V2 | 0, s2 = s2 + k2 | 0, o2 = o2 + j2 | 0, u2 = u2 + ce2 | 0, c2 = c2 + ee | 0, l2 = 0;
  }, "process"), X2 = a((A2) => {
    typeof A2 == "string" && (A2 = new TextEncoder().encode(A2));
    for (let w2 = 0; w2 < A2.length; w2++)
      B2[l2++] = A2[w2], l2 === 64 && W2();
    h2 += A2.length;
  }, "add"), de = a(() => {
    if (B2[l2++] = 128, l2 == 64 && W2(), l2 + 8 > 64) {
      for (; l2 < 64; )
        B2[l2++] = 0;
      W2();
    }
    for (; l2 < 58; )
      B2[l2++] = 0;
    let A2 = h2 * 8;
    B2[l2++] = A2 / 1099511627776 & 255, B2[l2++] = A2 / 4294967296 & 255, B2[l2++] = A2 >>> 24, B2[l2++] = A2 >>> 16 & 255, B2[l2++] = A2 >>> 8 & 255, B2[l2++] = A2 & 255, W2();
    let w2 = new Uint8Array(32);
    return w2[0] = e2 >>> 24, w2[1] = e2 >>> 16 & 255, w2[2] = e2 >>> 8 & 255, w2[3] = e2 & 255, w2[4] = t2 >>> 24, w2[5] = t2 >>> 16 & 255, w2[6] = t2 >>> 8 & 255, w2[7] = t2 & 255, w2[8] = n2 >>> 24, w2[9] = n2 >>> 16 & 255, w2[10] = n2 >>> 8 & 255, w2[11] = n2 & 255, w2[12] = i2 >>> 24, w2[13] = i2 >>> 16 & 255, w2[14] = i2 >>> 8 & 255, w2[15] = i2 & 255, w2[16] = s2 >>> 24, w2[17] = s2 >>> 16 & 255, w2[18] = s2 >>> 8 & 255, w2[19] = s2 & 255, w2[20] = o2 >>> 24, w2[21] = o2 >>> 16 & 255, w2[22] = o2 >>> 8 & 255, w2[23] = o2 & 255, w2[24] = u2 >>> 24, w2[25] = u2 >>> 16 & 255, w2[26] = u2 >>> 8 & 255, w2[27] = u2 & 255, w2[28] = c2 >>> 24, w2[29] = c2 >>> 16 & 255, w2[30] = c2 >>> 8 & 255, w2[31] = c2 & 255, w2;
  }, "digest");
  return r2 === void 0 ? { add: X2, digest: de } : (X2(r2), de());
}
__name(Ge, "Ge");
var ni = z(
  () => {
    "use strict";
    p();
    a(Ge, "sha256");
  }
);
var O;
var $e;
var ii = z(() => {
  "use strict";
  p();
  O = /* @__PURE__ */ __name(class O3 {
    constructor() {
      _(
        this,
        "_dataLength",
        0
      );
      _(this, "_bufferLength", 0);
      _(this, "_state", new Int32Array(4));
      _(
        this,
        "_buffer",
        new ArrayBuffer(68)
      );
      _(this, "_buffer8");
      _(this, "_buffer32");
      this._buffer8 = new Uint8Array(
        this._buffer,
        0,
        68
      ), this._buffer32 = new Uint32Array(this._buffer, 0, 17), this.start();
    }
    static hashByteArray(e2, t2 = false) {
      return this.onePassHasher.start().appendByteArray(e2).end(t2);
    }
    static hashStr(e2, t2 = false) {
      return this.onePassHasher.start().appendStr(e2).end(t2);
    }
    static hashAsciiStr(e2, t2 = false) {
      return this.onePassHasher.start().appendAsciiStr(e2).end(t2);
    }
    static _hex(e2) {
      let t2 = O3.hexChars, n2 = O3.hexOut, i2, s2, o2, u2;
      for (u2 = 0; u2 < 4; u2 += 1)
        for (s2 = u2 * 8, i2 = e2[u2], o2 = 0; o2 < 8; o2 += 2)
          n2[s2 + 1 + o2] = t2.charAt(i2 & 15), i2 >>>= 4, n2[s2 + 0 + o2] = t2.charAt(i2 & 15), i2 >>>= 4;
      return n2.join("");
    }
    static _md5cycle(e2, t2) {
      let n2 = e2[0], i2 = e2[1], s2 = e2[2], o2 = e2[3];
      n2 += (i2 & s2 | ~i2 & o2) + t2[0] - 680876936 | 0, n2 = (n2 << 7 | n2 >>> 25) + i2 | 0, o2 += (n2 & i2 | ~n2 & s2) + t2[1] - 389564586 | 0, o2 = (o2 << 12 | o2 >>> 20) + n2 | 0, s2 += (o2 & n2 | ~o2 & i2) + t2[2] + 606105819 | 0, s2 = (s2 << 17 | s2 >>> 15) + o2 | 0, i2 += (s2 & o2 | ~s2 & n2) + t2[3] - 1044525330 | 0, i2 = (i2 << 22 | i2 >>> 10) + s2 | 0, n2 += (i2 & s2 | ~i2 & o2) + t2[4] - 176418897 | 0, n2 = (n2 << 7 | n2 >>> 25) + i2 | 0, o2 += (n2 & i2 | ~n2 & s2) + t2[5] + 1200080426 | 0, o2 = (o2 << 12 | o2 >>> 20) + n2 | 0, s2 += (o2 & n2 | ~o2 & i2) + t2[6] - 1473231341 | 0, s2 = (s2 << 17 | s2 >>> 15) + o2 | 0, i2 += (s2 & o2 | ~s2 & n2) + t2[7] - 45705983 | 0, i2 = (i2 << 22 | i2 >>> 10) + s2 | 0, n2 += (i2 & s2 | ~i2 & o2) + t2[8] + 1770035416 | 0, n2 = (n2 << 7 | n2 >>> 25) + i2 | 0, o2 += (n2 & i2 | ~n2 & s2) + t2[9] - 1958414417 | 0, o2 = (o2 << 12 | o2 >>> 20) + n2 | 0, s2 += (o2 & n2 | ~o2 & i2) + t2[10] - 42063 | 0, s2 = (s2 << 17 | s2 >>> 15) + o2 | 0, i2 += (s2 & o2 | ~s2 & n2) + t2[11] - 1990404162 | 0, i2 = (i2 << 22 | i2 >>> 10) + s2 | 0, n2 += (i2 & s2 | ~i2 & o2) + t2[12] + 1804603682 | 0, n2 = (n2 << 7 | n2 >>> 25) + i2 | 0, o2 += (n2 & i2 | ~n2 & s2) + t2[13] - 40341101 | 0, o2 = (o2 << 12 | o2 >>> 20) + n2 | 0, s2 += (o2 & n2 | ~o2 & i2) + t2[14] - 1502002290 | 0, s2 = (s2 << 17 | s2 >>> 15) + o2 | 0, i2 += (s2 & o2 | ~s2 & n2) + t2[15] + 1236535329 | 0, i2 = (i2 << 22 | i2 >>> 10) + s2 | 0, n2 += (i2 & o2 | s2 & ~o2) + t2[1] - 165796510 | 0, n2 = (n2 << 5 | n2 >>> 27) + i2 | 0, o2 += (n2 & s2 | i2 & ~s2) + t2[6] - 1069501632 | 0, o2 = (o2 << 9 | o2 >>> 23) + n2 | 0, s2 += (o2 & i2 | n2 & ~i2) + t2[11] + 643717713 | 0, s2 = (s2 << 14 | s2 >>> 18) + o2 | 0, i2 += (s2 & n2 | o2 & ~n2) + t2[0] - 373897302 | 0, i2 = (i2 << 20 | i2 >>> 12) + s2 | 0, n2 += (i2 & o2 | s2 & ~o2) + t2[5] - 701558691 | 0, n2 = (n2 << 5 | n2 >>> 27) + i2 | 0, o2 += (n2 & s2 | i2 & ~s2) + t2[10] + 38016083 | 0, o2 = (o2 << 9 | o2 >>> 23) + n2 | 0, s2 += (o2 & i2 | n2 & ~i2) + t2[15] - 660478335 | 0, s2 = (s2 << 14 | s2 >>> 18) + o2 | 0, i2 += (s2 & n2 | o2 & ~n2) + t2[4] - 405537848 | 0, i2 = (i2 << 20 | i2 >>> 12) + s2 | 0, n2 += (i2 & o2 | s2 & ~o2) + t2[9] + 568446438 | 0, n2 = (n2 << 5 | n2 >>> 27) + i2 | 0, o2 += (n2 & s2 | i2 & ~s2) + t2[14] - 1019803690 | 0, o2 = (o2 << 9 | o2 >>> 23) + n2 | 0, s2 += (o2 & i2 | n2 & ~i2) + t2[3] - 187363961 | 0, s2 = (s2 << 14 | s2 >>> 18) + o2 | 0, i2 += (s2 & n2 | o2 & ~n2) + t2[8] + 1163531501 | 0, i2 = (i2 << 20 | i2 >>> 12) + s2 | 0, n2 += (i2 & o2 | s2 & ~o2) + t2[13] - 1444681467 | 0, n2 = (n2 << 5 | n2 >>> 27) + i2 | 0, o2 += (n2 & s2 | i2 & ~s2) + t2[2] - 51403784 | 0, o2 = (o2 << 9 | o2 >>> 23) + n2 | 0, s2 += (o2 & i2 | n2 & ~i2) + t2[7] + 1735328473 | 0, s2 = (s2 << 14 | s2 >>> 18) + o2 | 0, i2 += (s2 & n2 | o2 & ~n2) + t2[12] - 1926607734 | 0, i2 = (i2 << 20 | i2 >>> 12) + s2 | 0, n2 += (i2 ^ s2 ^ o2) + t2[5] - 378558 | 0, n2 = (n2 << 4 | n2 >>> 28) + i2 | 0, o2 += (n2 ^ i2 ^ s2) + t2[8] - 2022574463 | 0, o2 = (o2 << 11 | o2 >>> 21) + n2 | 0, s2 += (o2 ^ n2 ^ i2) + t2[11] + 1839030562 | 0, s2 = (s2 << 16 | s2 >>> 16) + o2 | 0, i2 += (s2 ^ o2 ^ n2) + t2[14] - 35309556 | 0, i2 = (i2 << 23 | i2 >>> 9) + s2 | 0, n2 += (i2 ^ s2 ^ o2) + t2[1] - 1530992060 | 0, n2 = (n2 << 4 | n2 >>> 28) + i2 | 0, o2 += (n2 ^ i2 ^ s2) + t2[4] + 1272893353 | 0, o2 = (o2 << 11 | o2 >>> 21) + n2 | 0, s2 += (o2 ^ n2 ^ i2) + t2[7] - 155497632 | 0, s2 = (s2 << 16 | s2 >>> 16) + o2 | 0, i2 += (s2 ^ o2 ^ n2) + t2[10] - 1094730640 | 0, i2 = (i2 << 23 | i2 >>> 9) + s2 | 0, n2 += (i2 ^ s2 ^ o2) + t2[13] + 681279174 | 0, n2 = (n2 << 4 | n2 >>> 28) + i2 | 0, o2 += (n2 ^ i2 ^ s2) + t2[0] - 358537222 | 0, o2 = (o2 << 11 | o2 >>> 21) + n2 | 0, s2 += (o2 ^ n2 ^ i2) + t2[3] - 722521979 | 0, s2 = (s2 << 16 | s2 >>> 16) + o2 | 0, i2 += (s2 ^ o2 ^ n2) + t2[6] + 76029189 | 0, i2 = (i2 << 23 | i2 >>> 9) + s2 | 0, n2 += (i2 ^ s2 ^ o2) + t2[9] - 640364487 | 0, n2 = (n2 << 4 | n2 >>> 28) + i2 | 0, o2 += (n2 ^ i2 ^ s2) + t2[12] - 421815835 | 0, o2 = (o2 << 11 | o2 >>> 21) + n2 | 0, s2 += (o2 ^ n2 ^ i2) + t2[15] + 530742520 | 0, s2 = (s2 << 16 | s2 >>> 16) + o2 | 0, i2 += (s2 ^ o2 ^ n2) + t2[2] - 995338651 | 0, i2 = (i2 << 23 | i2 >>> 9) + s2 | 0, n2 += (s2 ^ (i2 | ~o2)) + t2[0] - 198630844 | 0, n2 = (n2 << 6 | n2 >>> 26) + i2 | 0, o2 += (i2 ^ (n2 | ~s2)) + t2[7] + 1126891415 | 0, o2 = (o2 << 10 | o2 >>> 22) + n2 | 0, s2 += (n2 ^ (o2 | ~i2)) + t2[14] - 1416354905 | 0, s2 = (s2 << 15 | s2 >>> 17) + o2 | 0, i2 += (o2 ^ (s2 | ~n2)) + t2[5] - 57434055 | 0, i2 = (i2 << 21 | i2 >>> 11) + s2 | 0, n2 += (s2 ^ (i2 | ~o2)) + t2[12] + 1700485571 | 0, n2 = (n2 << 6 | n2 >>> 26) + i2 | 0, o2 += (i2 ^ (n2 | ~s2)) + t2[3] - 1894986606 | 0, o2 = (o2 << 10 | o2 >>> 22) + n2 | 0, s2 += (n2 ^ (o2 | ~i2)) + t2[10] - 1051523 | 0, s2 = (s2 << 15 | s2 >>> 17) + o2 | 0, i2 += (o2 ^ (s2 | ~n2)) + t2[1] - 2054922799 | 0, i2 = (i2 << 21 | i2 >>> 11) + s2 | 0, n2 += (s2 ^ (i2 | ~o2)) + t2[8] + 1873313359 | 0, n2 = (n2 << 6 | n2 >>> 26) + i2 | 0, o2 += (i2 ^ (n2 | ~s2)) + t2[15] - 30611744 | 0, o2 = (o2 << 10 | o2 >>> 22) + n2 | 0, s2 += (n2 ^ (o2 | ~i2)) + t2[6] - 1560198380 | 0, s2 = (s2 << 15 | s2 >>> 17) + o2 | 0, i2 += (o2 ^ (s2 | ~n2)) + t2[13] + 1309151649 | 0, i2 = (i2 << 21 | i2 >>> 11) + s2 | 0, n2 += (s2 ^ (i2 | ~o2)) + t2[4] - 145523070 | 0, n2 = (n2 << 6 | n2 >>> 26) + i2 | 0, o2 += (i2 ^ (n2 | ~s2)) + t2[11] - 1120210379 | 0, o2 = (o2 << 10 | o2 >>> 22) + n2 | 0, s2 += (n2 ^ (o2 | ~i2)) + t2[2] + 718787259 | 0, s2 = (s2 << 15 | s2 >>> 17) + o2 | 0, i2 += (o2 ^ (s2 | ~n2)) + t2[9] - 343485551 | 0, i2 = (i2 << 21 | i2 >>> 11) + s2 | 0, e2[0] = n2 + e2[0] | 0, e2[1] = i2 + e2[1] | 0, e2[2] = s2 + e2[2] | 0, e2[3] = o2 + e2[3] | 0;
    }
    start() {
      return this._dataLength = 0, this._bufferLength = 0, this._state.set(O3.stateIdentity), this;
    }
    appendStr(e2) {
      let t2 = this._buffer8, n2 = this._buffer32, i2 = this._bufferLength, s2, o2;
      for (o2 = 0; o2 < e2.length; o2 += 1) {
        if (s2 = e2.charCodeAt(o2), s2 < 128)
          t2[i2++] = s2;
        else if (s2 < 2048)
          t2[i2++] = (s2 >>> 6) + 192, t2[i2++] = s2 & 63 | 128;
        else if (s2 < 55296 || s2 > 56319)
          t2[i2++] = (s2 >>> 12) + 224, t2[i2++] = s2 >>> 6 & 63 | 128, t2[i2++] = s2 & 63 | 128;
        else {
          if (s2 = (s2 - 55296) * 1024 + (e2.charCodeAt(++o2) - 56320) + 65536, s2 > 1114111)
            throw new Error("Unicode standard supports code points up to U+10FFFF");
          t2[i2++] = (s2 >>> 18) + 240, t2[i2++] = s2 >>> 12 & 63 | 128, t2[i2++] = s2 >>> 6 & 63 | 128, t2[i2++] = s2 & 63 | 128;
        }
        i2 >= 64 && (this._dataLength += 64, O3._md5cycle(this._state, n2), i2 -= 64, n2[0] = n2[16]);
      }
      return this._bufferLength = i2, this;
    }
    appendAsciiStr(e2) {
      let t2 = this._buffer8, n2 = this._buffer32, i2 = this._bufferLength, s2, o2 = 0;
      for (; ; ) {
        for (s2 = Math.min(e2.length - o2, 64 - i2); s2--; )
          t2[i2++] = e2.charCodeAt(o2++);
        if (i2 < 64)
          break;
        this._dataLength += 64, O3._md5cycle(
          this._state,
          n2
        ), i2 = 0;
      }
      return this._bufferLength = i2, this;
    }
    appendByteArray(e2) {
      let t2 = this._buffer8, n2 = this._buffer32, i2 = this._bufferLength, s2, o2 = 0;
      for (; ; ) {
        for (s2 = Math.min(e2.length - o2, 64 - i2); s2--; )
          t2[i2++] = e2[o2++];
        if (i2 < 64)
          break;
        this._dataLength += 64, O3._md5cycle(
          this._state,
          n2
        ), i2 = 0;
      }
      return this._bufferLength = i2, this;
    }
    getState() {
      let e2 = this._state;
      return { buffer: String.fromCharCode.apply(null, Array.from(this._buffer8)), buflen: this._bufferLength, length: this._dataLength, state: [e2[0], e2[1], e2[2], e2[3]] };
    }
    setState(e2) {
      let t2 = e2.buffer, n2 = e2.state, i2 = this._state, s2;
      for (this._dataLength = e2.length, this._bufferLength = e2.buflen, i2[0] = n2[0], i2[1] = n2[1], i2[2] = n2[2], i2[3] = n2[3], s2 = 0; s2 < t2.length; s2 += 1)
        this._buffer8[s2] = t2.charCodeAt(s2);
    }
    end(e2 = false) {
      let t2 = this._bufferLength, n2 = this._buffer8, i2 = this._buffer32, s2 = (t2 >> 2) + 1;
      this._dataLength += t2;
      let o2 = this._dataLength * 8;
      if (n2[t2] = 128, n2[t2 + 1] = n2[t2 + 2] = n2[t2 + 3] = 0, i2.set(O3.buffer32Identity.subarray(s2), s2), t2 > 55 && (O3._md5cycle(this._state, i2), i2.set(O3.buffer32Identity)), o2 <= 4294967295)
        i2[14] = o2;
      else {
        let u2 = o2.toString(16).match(/(.*?)(.{0,8})$/);
        if (u2 === null)
          return;
        let c2 = parseInt(
          u2[2],
          16
        ), h2 = parseInt(u2[1], 16) || 0;
        i2[14] = c2, i2[15] = h2;
      }
      return O3._md5cycle(this._state, i2), e2 ? this._state : O3._hex(this._state);
    }
  }, "O");
  a(O, "Md5"), _(O, "stateIdentity", new Int32Array(
    [1732584193, -271733879, -1732584194, 271733878]
  )), _(O, "buffer32Identity", new Int32Array(
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  )), _(O, "hexChars", "0123456789abcdef"), _(O, "hexOut", []), _(O, "onePassHasher", new O());
  $e = O;
});
var qt = {};
ie(qt, { createHash: () => Ko, createHmac: () => zo, randomBytes: () => Vo });
function Vo(r2) {
  return g.getRandomValues(y.alloc(r2));
}
__name(Vo, "Vo");
function Ko(r2) {
  if (r2 === "sha256")
    return { update: a(
      function(e2) {
        return { digest: a(function() {
          return y.from(Ge(e2));
        }, "digest") };
      },
      "update"
    ) };
  if (r2 === "md5")
    return { update: a(function(e2) {
      return { digest: a(function() {
        return typeof e2 == "string" ? $e.hashStr(e2) : $e.hashByteArray(e2);
      }, "digest") };
    }, "update") };
  throw new Error(
    `Hash type '${r2}' not supported`
  );
}
__name(Ko, "Ko");
function zo(r2, e2) {
  if (r2 !== "sha256")
    throw new Error(
      `Only sha256 is supported (requested: '${r2}')`
    );
  return { update: a(function(t2) {
    return {
      digest: a(function() {
        typeof e2 == "string" && (e2 = new TextEncoder().encode(e2)), typeof t2 == "string" && (t2 = new TextEncoder().encode(t2));
        let n2 = e2.length;
        if (n2 > 64)
          e2 = Ge(e2);
        else if (n2 < 64) {
          let c2 = new Uint8Array(64);
          c2.set(e2), e2 = c2;
        }
        let i2 = new Uint8Array(64), s2 = new Uint8Array(
          64
        );
        for (let c2 = 0; c2 < 64; c2++)
          i2[c2] = 54 ^ e2[c2], s2[c2] = 92 ^ e2[c2];
        let o2 = new Uint8Array(t2.length + 64);
        o2.set(i2, 0), o2.set(t2, 64);
        let u2 = new Uint8Array(96);
        return u2.set(s2, 0), u2.set(
          Ge(o2),
          64
        ), y.from(Ge(u2));
      }, "digest")
    };
  }, "update") };
}
__name(zo, "zo");
var Qt = z(() => {
  "use strict";
  p();
  ni();
  ii();
  a(Vo, "randomBytes");
  a(Ko, "createHash");
  a(zo, "createHmac");
});
var jt = I((si) => {
  "use strict";
  p();
  si.parse = function(r2, e2) {
    return new Wt(r2, e2).parse();
  };
  var ut = /* @__PURE__ */ __name(class ut2 {
    constructor(e2, t2) {
      this.source = e2, this.transform = t2 || Yo, this.position = 0, this.entries = [], this.recorded = [], this.dimension = 0;
    }
    isEof() {
      return this.position >= this.source.length;
    }
    nextCharacter() {
      var e2 = this.source[this.position++];
      return e2 === "\\" ? { value: this.source[this.position++], escaped: true } : { value: e2, escaped: false };
    }
    record(e2) {
      this.recorded.push(e2);
    }
    newEntry(e2) {
      var t2;
      (this.recorded.length > 0 || e2) && (t2 = this.recorded.join(""), t2 === "NULL" && !e2 && (t2 = null), t2 !== null && (t2 = this.transform(t2)), this.entries.push(
        t2
      ), this.recorded = []);
    }
    consumeDimensions() {
      if (this.source[0] === "[")
        for (; !this.isEof(); ) {
          var e2 = this.nextCharacter();
          if (e2.value === "=")
            break;
        }
    }
    parse(e2) {
      var t2, n2, i2;
      for (this.consumeDimensions(); !this.isEof(); )
        if (t2 = this.nextCharacter(), t2.value === "{" && !i2)
          this.dimension++, this.dimension > 1 && (n2 = new ut2(this.source.substr(this.position - 1), this.transform), this.entries.push(
            n2.parse(true)
          ), this.position += n2.position - 2);
        else if (t2.value === "}" && !i2) {
          if (this.dimension--, !this.dimension && (this.newEntry(), e2))
            return this.entries;
        } else
          t2.value === '"' && !t2.escaped ? (i2 && this.newEntry(true), i2 = !i2) : t2.value === "," && !i2 ? this.newEntry() : this.record(
            t2.value
          );
      if (this.dimension !== 0)
        throw new Error("array dimension not balanced");
      return this.entries;
    }
  }, "ut");
  a(ut, "ArrayParser");
  var Wt = ut;
  function Yo(r2) {
    return r2;
  }
  __name(Yo, "Yo");
  a(Yo, "identity");
});
var Ht = I((mh, oi) => {
  p();
  var Zo = jt();
  oi.exports = { create: a(function(r2, e2) {
    return { parse: a(
      function() {
        return Zo.parse(r2, e2);
      },
      "parse"
    ) };
  }, "create") };
});
var ci = I((bh2, ui) => {
  "use strict";
  p();
  var Jo = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/, Xo = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/, ea = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/, ta = /^-?infinity$/;
  ui.exports = a(function(e2) {
    if (ta.test(e2))
      return Number(e2.replace("i", "I"));
    var t2 = Jo.exec(e2);
    if (!t2)
      return ra(e2) || null;
    var n2 = !!t2[8], i2 = parseInt(t2[1], 10);
    n2 && (i2 = ai2(i2));
    var s2 = parseInt(
      t2[2],
      10
    ) - 1, o2 = t2[3], u2 = parseInt(t2[4], 10), c2 = parseInt(t2[5], 10), h2 = parseInt(t2[6], 10), l2 = t2[7];
    l2 = l2 ? 1e3 * parseFloat(l2) : 0;
    var d2, b2 = na(e2);
    return b2 != null ? (d2 = new Date(Date.UTC(
      i2,
      s2,
      o2,
      u2,
      c2,
      h2,
      l2
    )), Gt(i2) && d2.setUTCFullYear(i2), b2 !== 0 && d2.setTime(d2.getTime() - b2)) : (d2 = new Date(
      i2,
      s2,
      o2,
      u2,
      c2,
      h2,
      l2
    ), Gt(i2) && d2.setFullYear(i2)), d2;
  }, "parseDate");
  function ra(r2) {
    var e2 = Xo.exec(r2);
    if (e2) {
      var t2 = parseInt(e2[1], 10), n2 = !!e2[4];
      n2 && (t2 = ai2(t2));
      var i2 = parseInt(
        e2[2],
        10
      ) - 1, s2 = e2[3], o2 = new Date(t2, i2, s2);
      return Gt(t2) && o2.setFullYear(t2), o2;
    }
  }
  __name(ra, "ra");
  a(ra, "getDate");
  function na(r2) {
    if (r2.endsWith("+00"))
      return 0;
    var e2 = ea.exec(r2.split(" ")[1]);
    if (e2) {
      var t2 = e2[1];
      if (t2 === "Z")
        return 0;
      var n2 = t2 === "-" ? -1 : 1, i2 = parseInt(e2[2], 10) * 3600 + parseInt(
        e2[3] || 0,
        10
      ) * 60 + parseInt(e2[4] || 0, 10);
      return i2 * n2 * 1e3;
    }
  }
  __name(na, "na");
  a(na, "timeZoneOffset");
  function ai2(r2) {
    return -(r2 - 1);
  }
  __name(ai2, "ai");
  a(ai2, "bcYearToNegativeYear");
  function Gt(r2) {
    return r2 >= 0 && r2 < 100;
  }
  __name(Gt, "Gt");
  a(
    Gt,
    "is0To99"
  );
});
var li = I((vh, hi) => {
  p();
  hi.exports = sa;
  var ia = Object.prototype.hasOwnProperty;
  function sa(r2) {
    for (var e2 = 1; e2 < arguments.length; e2++) {
      var t2 = arguments[e2];
      for (var n2 in t2)
        ia.call(
          t2,
          n2
        ) && (r2[n2] = t2[n2]);
    }
    return r2;
  }
  __name(sa, "sa");
  a(sa, "extend");
});
var di = I((Ah, pi) => {
  "use strict";
  p();
  var oa = li();
  pi.exports = Fe;
  function Fe(r2) {
    if (!(this instanceof Fe))
      return new Fe(r2);
    oa(this, wa(r2));
  }
  __name(Fe, "Fe");
  a(Fe, "PostgresInterval");
  var aa2 = ["seconds", "minutes", "hours", "days", "months", "years"];
  Fe.prototype.toPostgres = function() {
    var r2 = aa2.filter(this.hasOwnProperty, this);
    return this.milliseconds && r2.indexOf("seconds") < 0 && r2.push("seconds"), r2.length === 0 ? "0" : r2.map(function(e2) {
      var t2 = this[e2] || 0;
      return e2 === "seconds" && this.milliseconds && (t2 = (t2 + this.milliseconds / 1e3).toFixed(6).replace(
        /\.?0+$/,
        ""
      )), t2 + " " + e2;
    }, this).join(" ");
  };
  var ua = { years: "Y", months: "M", days: "D", hours: "H", minutes: "M", seconds: "S" }, ca2 = ["years", "months", "days"], ha = ["hours", "minutes", "seconds"];
  Fe.prototype.toISOString = Fe.prototype.toISO = function() {
    var r2 = ca2.map(t2, this).join(""), e2 = ha.map(t2, this).join("");
    return "P" + r2 + "T" + e2;
    function t2(n2) {
      var i2 = this[n2] || 0;
      return n2 === "seconds" && this.milliseconds && (i2 = (i2 + this.milliseconds / 1e3).toFixed(6).replace(
        /0+$/,
        ""
      )), i2 + ua[n2];
    }
    __name(t2, "t");
  };
  var $t = "([+-]?\\d+)", la = $t + "\\s+years?", fa = $t + "\\s+mons?", pa = $t + "\\s+days?", da = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?", ya = new RegExp([
    la,
    fa,
    pa,
    da
  ].map(function(r2) {
    return "(" + r2 + ")?";
  }).join("\\s*")), fi = {
    years: 2,
    months: 4,
    days: 6,
    hours: 9,
    minutes: 10,
    seconds: 11,
    milliseconds: 12
  }, ma = ["hours", "minutes", "seconds", "milliseconds"];
  function ga(r2) {
    var e2 = r2 + "000000".slice(r2.length);
    return parseInt(
      e2,
      10
    ) / 1e3;
  }
  __name(ga, "ga");
  a(ga, "parseMilliseconds");
  function wa(r2) {
    if (!r2)
      return {};
    var e2 = ya.exec(
      r2
    ), t2 = e2[8] === "-";
    return Object.keys(fi).reduce(function(n2, i2) {
      var s2 = fi[i2], o2 = e2[s2];
      return !o2 || (o2 = i2 === "milliseconds" ? ga(o2) : parseInt(o2, 10), !o2) || (t2 && ~ma.indexOf(i2) && (o2 *= -1), n2[i2] = o2), n2;
    }, {});
  }
  __name(wa, "wa");
  a(wa, "parse");
});
var mi = I((Ih, yi) => {
  "use strict";
  p();
  yi.exports = a(function(e2) {
    if (/^\\x/.test(e2))
      return new y(
        e2.substr(2),
        "hex"
      );
    for (var t2 = "", n2 = 0; n2 < e2.length; )
      if (e2[n2] !== "\\")
        t2 += e2[n2], ++n2;
      else if (/[0-7]{3}/.test(e2.substr(n2 + 1, 3)))
        t2 += String.fromCharCode(parseInt(e2.substr(n2 + 1, 3), 8)), n2 += 4;
      else {
        for (var i2 = 1; n2 + i2 < e2.length && e2[n2 + i2] === "\\"; )
          i2++;
        for (var s2 = 0; s2 < Math.floor(i2 / 2); ++s2)
          t2 += "\\";
        n2 += Math.floor(i2 / 2) * 2;
      }
    return new y(t2, "binary");
  }, "parseBytea");
});
var Ei = I((Lh, vi) => {
  p();
  var Ve = jt(), Ke = Ht(), ct2 = ci(), wi = di(), bi2 = mi();
  function ht(r2) {
    return a(function(t2) {
      return t2 === null ? t2 : r2(t2);
    }, "nullAllowed");
  }
  __name(ht, "ht");
  a(ht, "allowNull");
  function Si(r2) {
    return r2 === null ? r2 : r2 === "TRUE" || r2 === "t" || r2 === "true" || r2 === "y" || r2 === "yes" || r2 === "on" || r2 === "1";
  }
  __name(Si, "Si");
  a(Si, "parseBool");
  function ba2(r2) {
    return r2 ? Ve.parse(r2, Si) : null;
  }
  __name(ba2, "ba");
  a(ba2, "parseBoolArray");
  function Sa(r2) {
    return parseInt(r2, 10);
  }
  __name(Sa, "Sa");
  a(Sa, "parseBaseTenInt");
  function Vt(r2) {
    return r2 ? Ve.parse(r2, ht(Sa)) : null;
  }
  __name(Vt, "Vt");
  a(Vt, "parseIntegerArray");
  function xa(r2) {
    return r2 ? Ve.parse(r2, ht(function(e2) {
      return xi(e2).trim();
    })) : null;
  }
  __name(xa, "xa");
  a(xa, "parseBigIntegerArray");
  var va = a(function(r2) {
    if (!r2)
      return null;
    var e2 = Ke.create(r2, function(t2) {
      return t2 !== null && (t2 = Zt(t2)), t2;
    });
    return e2.parse();
  }, "parsePointArray"), Kt = a(function(r2) {
    if (!r2)
      return null;
    var e2 = Ke.create(r2, function(t2) {
      return t2 !== null && (t2 = parseFloat(t2)), t2;
    });
    return e2.parse();
  }, "parseFloatArray"), re = a(function(r2) {
    if (!r2)
      return null;
    var e2 = Ke.create(r2);
    return e2.parse();
  }, "parseStringArray"), zt = a(function(r2) {
    if (!r2)
      return null;
    var e2 = Ke.create(r2, function(t2) {
      return t2 !== null && (t2 = ct2(t2)), t2;
    });
    return e2.parse();
  }, "parseDateArray"), Ea = a(function(r2) {
    if (!r2)
      return null;
    var e2 = Ke.create(r2, function(t2) {
      return t2 !== null && (t2 = wi(t2)), t2;
    });
    return e2.parse();
  }, "parseIntervalArray"), _a = a(function(r2) {
    return r2 ? Ve.parse(r2, ht(bi2)) : null;
  }, "parseByteAArray"), Yt = a(function(r2) {
    return parseInt(
      r2,
      10
    );
  }, "parseInteger"), xi = a(function(r2) {
    var e2 = String(r2);
    return /^\d+$/.test(e2) ? e2 : r2;
  }, "parseBigInteger"), gi = a(
    function(r2) {
      return r2 ? Ve.parse(r2, ht(JSON.parse)) : null;
    },
    "parseJsonArray"
  ), Zt = a(function(r2) {
    return r2[0] !== "(" ? null : (r2 = r2.substring(1, r2.length - 1).split(","), { x: parseFloat(r2[0]), y: parseFloat(r2[1]) });
  }, "parsePoint"), Aa = a(function(r2) {
    if (r2[0] !== "<" && r2[1] !== "(")
      return null;
    for (var e2 = "(", t2 = "", n2 = false, i2 = 2; i2 < r2.length - 1; i2++) {
      if (n2 || (e2 += r2[i2]), r2[i2] === ")") {
        n2 = true;
        continue;
      } else if (!n2)
        continue;
      r2[i2] !== "," && (t2 += r2[i2]);
    }
    var s2 = Zt(e2);
    return s2.radius = parseFloat(t2), s2;
  }, "parseCircle"), Ca = a(function(r2) {
    r2(
      20,
      xi
    ), r2(21, Yt), r2(23, Yt), r2(26, Yt), r2(700, parseFloat), r2(701, parseFloat), r2(16, Si), r2(
      1082,
      ct2
    ), r2(1114, ct2), r2(1184, ct2), r2(600, Zt), r2(651, re), r2(718, Aa), r2(1e3, ba2), r2(1001, _a), r2(
      1005,
      Vt
    ), r2(1007, Vt), r2(1028, Vt), r2(1016, xa), r2(1017, va), r2(1021, Kt), r2(1022, Kt), r2(1231, Kt), r2(1014, re), r2(1015, re), r2(1008, re), r2(1009, re), r2(1040, re), r2(1041, re), r2(1115, zt), r2(
      1182,
      zt
    ), r2(1185, zt), r2(1186, wi), r2(1187, Ea), r2(17, bi2), r2(114, JSON.parse.bind(JSON)), r2(
      3802,
      JSON.parse.bind(JSON)
    ), r2(199, gi), r2(3807, gi), r2(3907, re), r2(2951, re), r2(791, re), r2(
      1183,
      re
    ), r2(1270, re);
  }, "init");
  vi.exports = { init: Ca };
});
var Ai = I((Mh, _i2) => {
  "use strict";
  p();
  var Z2 = 1e6;
  function Ta(r2) {
    var e2 = r2.readInt32BE(
      0
    ), t2 = r2.readUInt32BE(4), n2 = "";
    e2 < 0 && (e2 = ~e2 + (t2 === 0), t2 = ~t2 + 1 >>> 0, n2 = "-");
    var i2 = "", s2, o2, u2, c2, h2, l2;
    {
      if (s2 = e2 % Z2, e2 = e2 / Z2 >>> 0, o2 = 4294967296 * s2 + t2, t2 = o2 / Z2 >>> 0, u2 = "" + (o2 - Z2 * t2), t2 === 0 && e2 === 0)
        return n2 + u2 + i2;
      for (c2 = "", h2 = 6 - u2.length, l2 = 0; l2 < h2; l2++)
        c2 += "0";
      i2 = c2 + u2 + i2;
    }
    {
      if (s2 = e2 % Z2, e2 = e2 / Z2 >>> 0, o2 = 4294967296 * s2 + t2, t2 = o2 / Z2 >>> 0, u2 = "" + (o2 - Z2 * t2), t2 === 0 && e2 === 0)
        return n2 + u2 + i2;
      for (c2 = "", h2 = 6 - u2.length, l2 = 0; l2 < h2; l2++)
        c2 += "0";
      i2 = c2 + u2 + i2;
    }
    {
      if (s2 = e2 % Z2, e2 = e2 / Z2 >>> 0, o2 = 4294967296 * s2 + t2, t2 = o2 / Z2 >>> 0, u2 = "" + (o2 - Z2 * t2), t2 === 0 && e2 === 0)
        return n2 + u2 + i2;
      for (c2 = "", h2 = 6 - u2.length, l2 = 0; l2 < h2; l2++)
        c2 += "0";
      i2 = c2 + u2 + i2;
    }
    return s2 = e2 % Z2, o2 = 4294967296 * s2 + t2, u2 = "" + o2 % Z2, n2 + u2 + i2;
  }
  __name(Ta, "Ta");
  a(Ta, "readInt8");
  _i2.exports = Ta;
});
var Bi = I((Uh, Pi) => {
  p();
  var Ia = Ai(), F2 = a(function(r2, e2, t2, n2, i2) {
    t2 = t2 || 0, n2 = n2 || false, i2 = i2 || function(C2, B2, W2) {
      return C2 * Math.pow(2, W2) + B2;
    };
    var s2 = t2 >> 3, o2 = a(function(C2) {
      return n2 ? ~C2 & 255 : C2;
    }, "inv"), u2 = 255, c2 = 8 - t2 % 8;
    e2 < c2 && (u2 = 255 << 8 - e2 & 255, c2 = e2), t2 && (u2 = u2 >> t2 % 8);
    var h2 = 0;
    t2 % 8 + e2 >= 8 && (h2 = i2(0, o2(r2[s2]) & u2, c2));
    for (var l2 = e2 + t2 >> 3, d2 = s2 + 1; d2 < l2; d2++)
      h2 = i2(h2, o2(r2[d2]), 8);
    var b2 = (e2 + t2) % 8;
    return b2 > 0 && (h2 = i2(h2, o2(r2[l2]) >> 8 - b2, b2)), h2;
  }, "parseBits"), Ii = a(function(r2, e2, t2) {
    var n2 = Math.pow(2, t2 - 1) - 1, i2 = F2(r2, 1), s2 = F2(r2, t2, 1);
    if (s2 === 0)
      return 0;
    var o2 = 1, u2 = a(function(h2, l2, d2) {
      h2 === 0 && (h2 = 1);
      for (var b2 = 1; b2 <= d2; b2++)
        o2 /= 2, (l2 & 1 << d2 - b2) > 0 && (h2 += o2);
      return h2;
    }, "parsePrecisionBits"), c2 = F2(r2, e2, t2 + 1, false, u2);
    return s2 == Math.pow(2, t2 + 1) - 1 ? c2 === 0 ? i2 === 0 ? 1 / 0 : -1 / 0 : NaN : (i2 === 0 ? 1 : -1) * Math.pow(2, s2 - n2) * c2;
  }, "parseFloatFromBits"), Pa = a(function(r2) {
    return F2(r2, 1) == 1 ? -1 * (F2(r2, 15, 1, true) + 1) : F2(r2, 15, 1);
  }, "parseInt16"), Ci = a(function(r2) {
    return F2(r2, 1) == 1 ? -1 * (F2(
      r2,
      31,
      1,
      true
    ) + 1) : F2(r2, 31, 1);
  }, "parseInt32"), Ba = a(function(r2) {
    return Ii(r2, 23, 8);
  }, "parseFloat32"), La = a(function(r2) {
    return Ii(r2, 52, 11);
  }, "parseFloat64"), Ra = a(function(r2) {
    var e2 = F2(r2, 16, 32);
    if (e2 == 49152)
      return NaN;
    for (var t2 = Math.pow(1e4, F2(r2, 16, 16)), n2 = 0, i2 = [], s2 = F2(r2, 16), o2 = 0; o2 < s2; o2++)
      n2 += F2(r2, 16, 64 + 16 * o2) * t2, t2 /= 1e4;
    var u2 = Math.pow(10, F2(r2, 16, 48));
    return (e2 === 0 ? 1 : -1) * Math.round(n2 * u2) / u2;
  }, "parseNumeric"), Ti = a(function(r2, e2) {
    var t2 = F2(
      e2,
      1
    ), n2 = F2(e2, 63, 1), i2 = new Date((t2 === 0 ? 1 : -1) * n2 / 1e3 + 9466848e5);
    return r2 || i2.setTime(i2.getTime() + i2.getTimezoneOffset() * 6e4), i2.usec = n2 % 1e3, i2.getMicroSeconds = function() {
      return this.usec;
    }, i2.setMicroSeconds = function(s2) {
      this.usec = s2;
    }, i2.getUTCMicroSeconds = function() {
      return this.usec;
    }, i2;
  }, "parseDate"), ze = a(function(r2) {
    for (var e2 = F2(r2, 32), t2 = F2(r2, 32, 32), n2 = F2(r2, 32, 64), i2 = 96, s2 = [], o2 = 0; o2 < e2; o2++)
      s2[o2] = F2(r2, 32, i2), i2 += 32, i2 += 32;
    var u2 = a(function(h2) {
      var l2 = F2(r2, 32, i2);
      if (i2 += 32, l2 == 4294967295)
        return null;
      var d2;
      if (h2 == 23 || h2 == 20)
        return d2 = F2(r2, l2 * 8, i2), i2 += l2 * 8, d2;
      if (h2 == 25)
        return d2 = r2.toString(this.encoding, i2 >> 3, (i2 += l2 << 3) >> 3), d2;
      console.log("ERROR: ElementType not implemented: " + h2);
    }, "parseElement"), c2 = a(function(h2, l2) {
      var d2 = [], b2;
      if (h2.length > 1) {
        var C2 = h2.shift();
        for (b2 = 0; b2 < C2; b2++)
          d2[b2] = c2(h2, l2);
        h2.unshift(
          C2
        );
      } else
        for (b2 = 0; b2 < h2[0]; b2++)
          d2[b2] = u2(l2);
      return d2;
    }, "parse");
    return c2(s2, n2);
  }, "parseArray"), Fa = a(function(r2) {
    return r2.toString("utf8");
  }, "parseText"), Ma = a(function(r2) {
    return r2 === null ? null : F2(r2, 8) > 0;
  }, "parseBool"), Da = a(function(r2) {
    r2(20, Ia), r2(21, Pa), r2(23, Ci), r2(
      26,
      Ci
    ), r2(1700, Ra), r2(700, Ba), r2(701, La), r2(16, Ma), r2(1114, Ti.bind(null, false)), r2(1184, Ti.bind(
      null,
      true
    )), r2(1e3, ze), r2(1007, ze), r2(1016, ze), r2(1008, ze), r2(1009, ze), r2(25, Fa);
  }, "init");
  Pi.exports = { init: Da };
});
var Ri = I((qh, Li) => {
  p();
  Li.exports = {
    BOOL: 16,
    BYTEA: 17,
    CHAR: 18,
    INT8: 20,
    INT2: 21,
    INT4: 23,
    REGPROC: 24,
    TEXT: 25,
    OID: 26,
    TID: 27,
    XID: 28,
    CID: 29,
    JSON: 114,
    XML: 142,
    PG_NODE_TREE: 194,
    SMGR: 210,
    PATH: 602,
    POLYGON: 604,
    CIDR: 650,
    FLOAT4: 700,
    FLOAT8: 701,
    ABSTIME: 702,
    RELTIME: 703,
    TINTERVAL: 704,
    CIRCLE: 718,
    MACADDR8: 774,
    MONEY: 790,
    MACADDR: 829,
    INET: 869,
    ACLITEM: 1033,
    BPCHAR: 1042,
    VARCHAR: 1043,
    DATE: 1082,
    TIME: 1083,
    TIMESTAMP: 1114,
    TIMESTAMPTZ: 1184,
    INTERVAL: 1186,
    TIMETZ: 1266,
    BIT: 1560,
    VARBIT: 1562,
    NUMERIC: 1700,
    REFCURSOR: 1790,
    REGPROCEDURE: 2202,
    REGOPER: 2203,
    REGOPERATOR: 2204,
    REGCLASS: 2205,
    REGTYPE: 2206,
    UUID: 2950,
    TXID_SNAPSHOT: 2970,
    PG_LSN: 3220,
    PG_NDISTINCT: 3361,
    PG_DEPENDENCIES: 3402,
    TSVECTOR: 3614,
    TSQUERY: 3615,
    GTSVECTOR: 3642,
    REGCONFIG: 3734,
    REGDICTIONARY: 3769,
    JSONB: 3802,
    REGNAMESPACE: 4089,
    REGROLE: 4096
  };
});
var Je = I((Ze) => {
  p();
  var ka = Ei(), Ua = Bi(), Oa = Ht(), Na = Ri();
  Ze.getTypeParser = qa;
  Ze.setTypeParser = Qa;
  Ze.arrayParser = Oa;
  Ze.builtins = Na;
  var Ye = { text: {}, binary: {} };
  function Fi(r2) {
    return String(
      r2
    );
  }
  __name(Fi, "Fi");
  a(Fi, "noParse");
  function qa(r2, e2) {
    return e2 = e2 || "text", Ye[e2] && Ye[e2][r2] || Fi;
  }
  __name(qa, "qa");
  a(
    qa,
    "getTypeParser"
  );
  function Qa(r2, e2, t2) {
    typeof e2 == "function" && (t2 = e2, e2 = "text"), Ye[e2][r2] = t2;
  }
  __name(Qa, "Qa");
  a(Qa, "setTypeParser");
  ka.init(function(r2, e2) {
    Ye.text[r2] = e2;
  });
  Ua.init(function(r2, e2) {
    Ye.binary[r2] = e2;
  });
});
var Xe = I((Gh, Jt) => {
  "use strict";
  p();
  Jt.exports = {
    host: "localhost",
    user: m.platform === "win32" ? m.env.USERNAME : m.env.USER,
    database: void 0,
    password: null,
    connectionString: void 0,
    port: 5432,
    rows: 0,
    binary: false,
    max: 10,
    idleTimeoutMillis: 3e4,
    client_encoding: "",
    ssl: false,
    application_name: void 0,
    fallback_application_name: void 0,
    options: void 0,
    parseInputDatesAsUTC: false,
    statement_timeout: false,
    lock_timeout: false,
    idle_in_transaction_session_timeout: false,
    query_timeout: false,
    connect_timeout: 0,
    keepalives: 1,
    keepalives_idle: 0
  };
  var Me = Je(), Wa = Me.getTypeParser(
    20,
    "text"
  ), ja = Me.getTypeParser(1016, "text");
  Jt.exports.__defineSetter__("parseInt8", function(r2) {
    Me.setTypeParser(20, "text", r2 ? Me.getTypeParser(23, "text") : Wa), Me.setTypeParser(1016, "text", r2 ? Me.getTypeParser(1007, "text") : ja);
  });
});
var et = I((Vh, Di) => {
  "use strict";
  p();
  var Ha = (Qt(), N(qt)), Ga = Xe();
  function $a(r2) {
    var e2 = r2.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return '"' + e2 + '"';
  }
  __name($a, "$a");
  a($a, "escapeElement");
  function Mi(r2) {
    for (var e2 = "{", t2 = 0; t2 < r2.length; t2++)
      t2 > 0 && (e2 = e2 + ","), r2[t2] === null || typeof r2[t2] > "u" ? e2 = e2 + "NULL" : Array.isArray(r2[t2]) ? e2 = e2 + Mi(r2[t2]) : r2[t2] instanceof y ? e2 += "\\\\x" + r2[t2].toString("hex") : e2 += $a(lt(r2[t2]));
    return e2 = e2 + "}", e2;
  }
  __name(Mi, "Mi");
  a(Mi, "arrayString");
  var lt = a(function(r2, e2) {
    if (r2 == null)
      return null;
    if (r2 instanceof y)
      return r2;
    if (ArrayBuffer.isView(r2)) {
      var t2 = y.from(r2.buffer, r2.byteOffset, r2.byteLength);
      return t2.length === r2.byteLength ? t2 : t2.slice(
        r2.byteOffset,
        r2.byteOffset + r2.byteLength
      );
    }
    return r2 instanceof Date ? Ga.parseInputDatesAsUTC ? za(r2) : Ka(r2) : Array.isArray(r2) ? Mi(r2) : typeof r2 == "object" ? Va(r2, e2) : r2.toString();
  }, "prepareValue");
  function Va(r2, e2) {
    if (r2 && typeof r2.toPostgres == "function") {
      if (e2 = e2 || [], e2.indexOf(r2) !== -1)
        throw new Error('circular reference detected while preparing "' + r2 + '" for query');
      return e2.push(r2), lt(r2.toPostgres(lt), e2);
    }
    return JSON.stringify(r2);
  }
  __name(Va, "Va");
  a(Va, "prepareObject");
  function H2(r2, e2) {
    for (r2 = "" + r2; r2.length < e2; )
      r2 = "0" + r2;
    return r2;
  }
  __name(H2, "H");
  a(
    H2,
    "pad"
  );
  function Ka(r2) {
    var e2 = -r2.getTimezoneOffset(), t2 = r2.getFullYear(), n2 = t2 < 1;
    n2 && (t2 = Math.abs(t2) + 1);
    var i2 = H2(t2, 4) + "-" + H2(r2.getMonth() + 1, 2) + "-" + H2(r2.getDate(), 2) + "T" + H2(r2.getHours(), 2) + ":" + H2(r2.getMinutes(), 2) + ":" + H2(r2.getSeconds(), 2) + "." + H2(
      r2.getMilliseconds(),
      3
    );
    return e2 < 0 ? (i2 += "-", e2 *= -1) : i2 += "+", i2 += H2(Math.floor(e2 / 60), 2) + ":" + H2(e2 % 60, 2), n2 && (i2 += " BC"), i2;
  }
  __name(Ka, "Ka");
  a(Ka, "dateToString");
  function za(r2) {
    var e2 = r2.getUTCFullYear(), t2 = e2 < 1;
    t2 && (e2 = Math.abs(e2) + 1);
    var n2 = H2(e2, 4) + "-" + H2(r2.getUTCMonth() + 1, 2) + "-" + H2(r2.getUTCDate(), 2) + "T" + H2(r2.getUTCHours(), 2) + ":" + H2(r2.getUTCMinutes(), 2) + ":" + H2(r2.getUTCSeconds(), 2) + "." + H2(r2.getUTCMilliseconds(), 3);
    return n2 += "+00:00", t2 && (n2 += " BC"), n2;
  }
  __name(za, "za");
  a(za, "dateToStringUTC");
  function Ya(r2, e2, t2) {
    return r2 = typeof r2 == "string" ? { text: r2 } : r2, e2 && (typeof e2 == "function" ? r2.callback = e2 : r2.values = e2), t2 && (r2.callback = t2), r2;
  }
  __name(Ya, "Ya");
  a(Ya, "normalizeQueryConfig");
  var Xt = a(function(r2) {
    return Ha.createHash("md5").update(r2, "utf-8").digest("hex");
  }, "md5"), Za = a(function(r2, e2, t2) {
    var n2 = Xt(e2 + r2), i2 = Xt(y.concat([y.from(n2), t2]));
    return "md5" + i2;
  }, "postgresMd5PasswordHash");
  Di.exports = { prepareValue: a(function(e2) {
    return lt(
      e2
    );
  }, "prepareValueWrapper"), normalizeQueryConfig: Ya, postgresMd5PasswordHash: Za, md5: Xt };
});
var qi = I((Yh, Ni) => {
  "use strict";
  p();
  var er = (Qt(), N(qt));
  function Ja(r2) {
    if (r2.indexOf(
      "SCRAM-SHA-256"
    ) === -1)
      throw new Error("SASL: Only mechanism SCRAM-SHA-256 is currently supported");
    let e2 = er.randomBytes(18).toString("base64");
    return { mechanism: "SCRAM-SHA-256", clientNonce: e2, response: "n,,n=*,r=" + e2, message: "SASLInitialResponse" };
  }
  __name(Ja, "Ja");
  a(Ja, "startSession");
  function Xa(r2, e2, t2) {
    if (r2.message !== "SASLInitialResponse")
      throw new Error(
        "SASL: Last message was not SASLInitialResponse"
      );
    if (typeof e2 != "string")
      throw new Error(
        "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string"
      );
    if (typeof t2 != "string")
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
    let n2 = ru(t2);
    if (n2.nonce.startsWith(r2.clientNonce)) {
      if (n2.nonce.length === r2.clientNonce.length)
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
    } else
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
    var i2 = y.from(n2.salt, "base64"), s2 = su(
      e2,
      i2,
      n2.iteration
    ), o2 = De(s2, "Client Key"), u2 = iu(o2), c2 = "n=*,r=" + r2.clientNonce, h2 = "r=" + n2.nonce + ",s=" + n2.salt + ",i=" + n2.iteration, l2 = "c=biws,r=" + n2.nonce, d2 = c2 + "," + h2 + "," + l2, b2 = De(u2, d2), C2 = Oi(
      o2,
      b2
    ), B2 = C2.toString("base64"), W2 = De(s2, "Server Key"), X2 = De(W2, d2);
    r2.message = "SASLResponse", r2.serverSignature = X2.toString("base64"), r2.response = l2 + ",p=" + B2;
  }
  __name(Xa, "Xa");
  a(Xa, "continueSession");
  function eu(r2, e2) {
    if (r2.message !== "SASLResponse")
      throw new Error("SASL: Last message was not SASLResponse");
    if (typeof e2 != "string")
      throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
    let { serverSignature: t2 } = nu(
      e2
    );
    if (t2 !== r2.serverSignature)
      throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
  }
  __name(eu, "eu");
  a(eu, "finalizeSession");
  function tu(r2) {
    if (typeof r2 != "string")
      throw new TypeError("SASL: text must be a string");
    return r2.split("").map(
      (e2, t2) => r2.charCodeAt(t2)
    ).every((e2) => e2 >= 33 && e2 <= 43 || e2 >= 45 && e2 <= 126);
  }
  __name(tu, "tu");
  a(tu, "isPrintableChars");
  function ki(r2) {
    return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(r2);
  }
  __name(ki, "ki");
  a(ki, "isBase64");
  function Ui(r2) {
    if (typeof r2 != "string")
      throw new TypeError(
        "SASL: attribute pairs text must be a string"
      );
    return new Map(r2.split(",").map((e2) => {
      if (!/^.=/.test(e2))
        throw new Error("SASL: Invalid attribute pair entry");
      let t2 = e2[0], n2 = e2.substring(2);
      return [t2, n2];
    }));
  }
  __name(Ui, "Ui");
  a(Ui, "parseAttributePairs");
  function ru(r2) {
    let e2 = Ui(
      r2
    ), t2 = e2.get("r");
    if (t2) {
      if (!tu(t2))
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
    } else
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
    let n2 = e2.get("s");
    if (n2) {
      if (!ki(n2))
        throw new Error(
          "SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64"
        );
    } else
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
    let i2 = e2.get("i");
    if (i2) {
      if (!/^[1-9][0-9]*$/.test(i2))
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
    } else
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
    let s2 = parseInt(i2, 10);
    return { nonce: t2, salt: n2, iteration: s2 };
  }
  __name(ru, "ru");
  a(ru, "parseServerFirstMessage");
  function nu(r2) {
    let t2 = Ui(r2).get("v");
    if (t2) {
      if (!ki(t2))
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
    } else
      throw new Error(
        "SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing"
      );
    return { serverSignature: t2 };
  }
  __name(nu, "nu");
  a(nu, "parseServerFinalMessage");
  function Oi(r2, e2) {
    if (!y.isBuffer(r2))
      throw new TypeError(
        "first argument must be a Buffer"
      );
    if (!y.isBuffer(e2))
      throw new TypeError("second argument must be a Buffer");
    if (r2.length !== e2.length)
      throw new Error("Buffer lengths must match");
    if (r2.length === 0)
      throw new Error("Buffers cannot be empty");
    return y.from(r2.map((t2, n2) => r2[n2] ^ e2[n2]));
  }
  __name(Oi, "Oi");
  a(Oi, "xorBuffers");
  function iu(r2) {
    return er.createHash(
      "sha256"
    ).update(r2).digest();
  }
  __name(iu, "iu");
  a(iu, "sha256");
  function De(r2, e2) {
    return er.createHmac(
      "sha256",
      r2
    ).update(e2).digest();
  }
  __name(De, "De");
  a(De, "hmacSha256");
  function su(r2, e2, t2) {
    for (var n2 = De(
      r2,
      y.concat([e2, y.from([0, 0, 0, 1])])
    ), i2 = n2, s2 = 0; s2 < t2 - 1; s2++)
      n2 = De(r2, n2), i2 = Oi(i2, n2);
    return i2;
  }
  __name(su, "su");
  a(su, "Hi");
  Ni.exports = { startSession: Ja, continueSession: Xa, finalizeSession: eu };
});
var tr = {};
ie(tr, { join: () => ou });
function ou(...r2) {
  return r2.join("/");
}
__name(ou, "ou");
var rr = z(() => {
  "use strict";
  p();
  a(ou, "join");
});
var nr = {};
ie(nr, { stat: () => au });
function au(r2, e2) {
  e2(new Error("No filesystem"));
}
__name(au, "au");
var ir = z(
  () => {
    "use strict";
    p();
    a(au, "stat");
  }
);
var sr = {};
ie(sr, { default: () => uu });
var uu;
var or = z(() => {
  "use strict";
  p();
  uu = {};
});
var Qi = {};
ie(Qi, { StringDecoder: () => ar });
var ur;
var ar;
var Wi = z(() => {
  "use strict";
  p();
  ur = /* @__PURE__ */ __name(class ur {
    constructor(e2) {
      _(this, "td");
      this.td = new TextDecoder(e2);
    }
    write(e2) {
      return this.td.decode(e2, { stream: true });
    }
    end(e2) {
      return this.td.decode(e2);
    }
  }, "ur");
  a(ur, "StringDecoder");
  ar = ur;
});
var $i = I((ol, Gi) => {
  "use strict";
  p();
  var { Transform: cu2 } = (or(), N(sr)), { StringDecoder: hu } = (Wi(), N(Qi)), be2 = Symbol("last"), ft = Symbol("decoder");
  function lu(r2, e2, t2) {
    let n2;
    if (this.overflow) {
      if (n2 = this[ft].write(r2).split(this.matcher), n2.length === 1)
        return t2();
      n2.shift(), this.overflow = false;
    } else
      this[be2] += this[ft].write(r2), n2 = this[be2].split(this.matcher);
    this[be2] = n2.pop();
    for (let i2 = 0; i2 < n2.length; i2++)
      try {
        Hi(this, this.mapper(n2[i2]));
      } catch (s2) {
        return t2(
          s2
        );
      }
    if (this.overflow = this[be2].length > this.maxLength, this.overflow && !this.skipOverflow) {
      t2(new Error("maximum buffer reached"));
      return;
    }
    t2();
  }
  __name(lu, "lu");
  a(lu, "transform");
  function fu(r2) {
    if (this[be2] += this[ft].end(), this[be2])
      try {
        Hi(this, this.mapper(this[be2]));
      } catch (e2) {
        return r2(e2);
      }
    r2();
  }
  __name(fu, "fu");
  a(fu, "flush");
  function Hi(r2, e2) {
    e2 !== void 0 && r2.push(e2);
  }
  __name(Hi, "Hi");
  a(Hi, "push");
  function ji(r2) {
    return r2;
  }
  __name(ji, "ji");
  a(ji, "noop");
  function pu(r2, e2, t2) {
    switch (r2 = r2 || /\r?\n/, e2 = e2 || ji, t2 = t2 || {}, arguments.length) {
      case 1:
        typeof r2 == "function" ? (e2 = r2, r2 = /\r?\n/) : typeof r2 == "object" && !(r2 instanceof RegExp) && !r2[Symbol.split] && (t2 = r2, r2 = /\r?\n/);
        break;
      case 2:
        typeof r2 == "function" ? (t2 = e2, e2 = r2, r2 = /\r?\n/) : typeof e2 == "object" && (t2 = e2, e2 = ji);
    }
    t2 = Object.assign({}, t2), t2.autoDestroy = true, t2.transform = lu, t2.flush = fu, t2.readableObjectMode = true;
    let n2 = new cu2(t2);
    return n2[be2] = "", n2[ft] = new hu("utf8"), n2.matcher = r2, n2.mapper = e2, n2.maxLength = t2.maxLength, n2.skipOverflow = t2.skipOverflow || false, n2.overflow = false, n2._destroy = function(i2, s2) {
      this._writableState.errorEmitted = false, s2(i2);
    }, n2;
  }
  __name(pu, "pu");
  a(pu, "split");
  Gi.exports = pu;
});
var zi = I((cl2, pe) => {
  "use strict";
  p();
  var Vi = (rr(), N(tr)), du = (or(), N(sr)).Stream, yu = $i(), Ki = (He(), N(je)), mu = 5432, pt = m.platform === "win32", tt = m.stderr, gu = 56, wu = 7, bu2 = 61440, Su = 32768;
  function xu(r2) {
    return (r2 & bu2) == Su;
  }
  __name(xu, "xu");
  a(xu, "isRegFile");
  var ke = [
    "host",
    "port",
    "database",
    "user",
    "password"
  ], cr2 = ke.length, vu = ke[cr2 - 1];
  function hr() {
    var r2 = tt instanceof du && tt.writable === true;
    if (r2) {
      var e2 = Array.prototype.slice.call(arguments).concat(`
`);
      tt.write(Ki.format.apply(Ki, e2));
    }
  }
  __name(hr, "hr");
  a(hr, "warn");
  Object.defineProperty(
    pe.exports,
    "isWin",
    { get: a(function() {
      return pt;
    }, "get"), set: a(function(r2) {
      pt = r2;
    }, "set") }
  );
  pe.exports.warnTo = function(r2) {
    var e2 = tt;
    return tt = r2, e2;
  };
  pe.exports.getFileName = function(r2) {
    var e2 = r2 || m.env, t2 = e2.PGPASSFILE || (pt ? Vi.join(e2.APPDATA || "./", "postgresql", "pgpass.conf") : Vi.join(e2.HOME || "./", ".pgpass"));
    return t2;
  };
  pe.exports.usePgPass = function(r2, e2) {
    return Object.prototype.hasOwnProperty.call(m.env, "PGPASSWORD") ? false : pt ? true : (e2 = e2 || "<unkn>", xu(r2.mode) ? r2.mode & (gu | wu) ? (hr('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', e2), false) : true : (hr('WARNING: password file "%s" is not a plain file', e2), false));
  };
  var Eu = pe.exports.match = function(r2, e2) {
    return ke.slice(0, -1).reduce(function(t2, n2, i2) {
      return i2 == 1 && Number(r2[n2] || mu) === Number(
        e2[n2]
      ) ? t2 && true : t2 && (e2[n2] === "*" || e2[n2] === r2[n2]);
    }, true);
  };
  pe.exports.getPassword = function(r2, e2, t2) {
    var n2, i2 = e2.pipe(yu());
    function s2(c2) {
      var h2 = _u(c2);
      h2 && Au(h2) && Eu(r2, h2) && (n2 = h2[vu], i2.end());
    }
    __name(s2, "s");
    a(s2, "onLine");
    var o2 = a(function() {
      e2.destroy(), t2(n2);
    }, "onEnd"), u2 = a(function(c2) {
      e2.destroy(), hr("WARNING: error on reading file: %s", c2), t2(void 0);
    }, "onErr");
    e2.on("error", u2), i2.on("data", s2).on("end", o2).on("error", u2);
  };
  var _u = pe.exports.parseLine = function(r2) {
    if (r2.length < 11 || r2.match(/^\s+#/))
      return null;
    for (var e2 = "", t2 = "", n2 = 0, i2 = 0, s2 = 0, o2 = {}, u2 = false, c2 = a(function(l2, d2, b2) {
      var C2 = r2.substring(d2, b2);
      Object.hasOwnProperty.call(
        m.env,
        "PGPASS_NO_DEESCAPE"
      ) || (C2 = C2.replace(/\\([:\\])/g, "$1")), o2[ke[l2]] = C2;
    }, "addToObj"), h2 = 0; h2 < r2.length - 1; h2 += 1) {
      if (e2 = r2.charAt(h2 + 1), t2 = r2.charAt(h2), u2 = n2 == cr2 - 1, u2) {
        c2(n2, i2);
        break;
      }
      h2 >= 0 && e2 == ":" && t2 !== "\\" && (c2(n2, i2, h2 + 1), i2 = h2 + 2, n2 += 1);
    }
    return o2 = Object.keys(o2).length === cr2 ? o2 : null, o2;
  }, Au = pe.exports.isValidEntry = function(r2) {
    for (var e2 = { 0: function(o2) {
      return o2.length > 0;
    }, 1: function(o2) {
      return o2 === "*" ? true : (o2 = Number(o2), isFinite(o2) && o2 > 0 && o2 < 9007199254740992 && Math.floor(o2) === o2);
    }, 2: function(o2) {
      return o2.length > 0;
    }, 3: function(o2) {
      return o2.length > 0;
    }, 4: function(o2) {
      return o2.length > 0;
    } }, t2 = 0; t2 < ke.length; t2 += 1) {
      var n2 = e2[t2], i2 = r2[ke[t2]] || "", s2 = n2(i2);
      if (!s2)
        return false;
    }
    return true;
  };
});
var Zi = I((pl, lr) => {
  "use strict";
  p();
  var fl = (rr(), N(tr)), Yi = (ir(), N(nr)), dt = zi();
  lr.exports = function(r2, e2) {
    var t2 = dt.getFileName();
    Yi.stat(t2, function(n2, i2) {
      if (n2 || !dt.usePgPass(i2, t2))
        return e2(void 0);
      var s2 = Yi.createReadStream(t2);
      dt.getPassword(
        r2,
        s2,
        e2
      );
    });
  };
  lr.exports.warnTo = dt.warnTo;
});
var mt = I((yl, Ji) => {
  "use strict";
  p();
  var Cu = Je();
  function yt(r2) {
    this._types = r2 || Cu, this.text = {}, this.binary = {};
  }
  __name(yt, "yt");
  a(yt, "TypeOverrides");
  yt.prototype.getOverrides = function(r2) {
    switch (r2) {
      case "text":
        return this.text;
      case "binary":
        return this.binary;
      default:
        return {};
    }
  };
  yt.prototype.setTypeParser = function(r2, e2, t2) {
    typeof e2 == "function" && (t2 = e2, e2 = "text"), this.getOverrides(e2)[r2] = t2;
  };
  yt.prototype.getTypeParser = function(r2, e2) {
    return e2 = e2 || "text", this.getOverrides(e2)[r2] || this._types.getTypeParser(r2, e2);
  };
  Ji.exports = yt;
});
var Xi = {};
ie(Xi, { default: () => Tu });
var Tu;
var es = z(() => {
  "use strict";
  p();
  Tu = {};
});
var ts = {};
ie(ts, { parse: () => fr });
function fr(r2, e2 = false) {
  let { protocol: t2 } = new URL(r2), n2 = "http:" + r2.substring(t2.length), {
    username: i2,
    password: s2,
    host: o2,
    hostname: u2,
    port: c2,
    pathname: h2,
    search: l2,
    searchParams: d2,
    hash: b2
  } = new URL(n2);
  s2 = decodeURIComponent(s2), i2 = decodeURIComponent(
    i2
  ), h2 = decodeURIComponent(h2);
  let C2 = i2 + ":" + s2, B2 = e2 ? Object.fromEntries(d2.entries()) : l2;
  return {
    href: r2,
    protocol: t2,
    auth: C2,
    username: i2,
    password: s2,
    host: o2,
    hostname: u2,
    port: c2,
    pathname: h2,
    search: l2,
    query: B2,
    hash: b2
  };
}
__name(fr, "fr");
var pr = z(() => {
  "use strict";
  p();
  a(fr, "parse");
});
var ns = I((xl, rs) => {
  "use strict";
  p();
  var Iu = (pr(), N(ts)), dr = (ir(), N(nr));
  function yr(r2) {
    if (r2.charAt(0) === "/") {
      var t2 = r2.split(" ");
      return { host: t2[0], database: t2[1] };
    }
    var e2 = Iu.parse(/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(r2) ? encodeURI(r2).replace(
      /\%25(\d\d)/g,
      "%$1"
    ) : r2, true), t2 = e2.query;
    for (var n2 in t2)
      Array.isArray(t2[n2]) && (t2[n2] = t2[n2][t2[n2].length - 1]);
    var i2 = (e2.auth || ":").split(":");
    if (t2.user = i2[0], t2.password = i2.splice(1).join(":"), t2.port = e2.port, e2.protocol == "socket:")
      return t2.host = decodeURI(e2.pathname), t2.database = e2.query.db, t2.client_encoding = e2.query.encoding, t2;
    t2.host || (t2.host = e2.hostname);
    var s2 = e2.pathname;
    if (!t2.host && s2 && /^%2f/i.test(s2)) {
      var o2 = s2.split("/");
      t2.host = decodeURIComponent(
        o2[0]
      ), s2 = o2.splice(1).join("/");
    }
    switch (s2 && s2.charAt(0) === "/" && (s2 = s2.slice(1) || null), t2.database = s2 && decodeURI(s2), (t2.ssl === "true" || t2.ssl === "1") && (t2.ssl = true), t2.ssl === "0" && (t2.ssl = false), (t2.sslcert || t2.sslkey || t2.sslrootcert || t2.sslmode) && (t2.ssl = {}), t2.sslcert && (t2.ssl.cert = dr.readFileSync(t2.sslcert).toString()), t2.sslkey && (t2.ssl.key = dr.readFileSync(
      t2.sslkey
    ).toString()), t2.sslrootcert && (t2.ssl.ca = dr.readFileSync(t2.sslrootcert).toString()), t2.sslmode) {
      case "disable": {
        t2.ssl = false;
        break;
      }
      case "prefer":
      case "require":
      case "verify-ca":
      case "verify-full":
        break;
      case "no-verify": {
        t2.ssl.rejectUnauthorized = false;
        break;
      }
    }
    return t2;
  }
  __name(yr, "yr");
  a(yr, "parse");
  rs.exports = yr;
  yr.parse = yr;
});
var gt = I((_l, os) => {
  "use strict";
  p();
  var Pu = (es(), N(Xi)), ss = Xe(), is = ns().parse, $ = a(
    function(r2, e2, t2) {
      return t2 === void 0 ? t2 = m.env["PG" + r2.toUpperCase()] : t2 === false || (t2 = m.env[t2]), e2[r2] || t2 || ss[r2];
    },
    "val"
  ), Bu = a(function() {
    switch (m.env.PGSSLMODE) {
      case "disable":
        return false;
      case "prefer":
      case "require":
      case "verify-ca":
      case "verify-full":
        return true;
      case "no-verify":
        return { rejectUnauthorized: false };
    }
    return ss.ssl;
  }, "readSSLConfigFromEnvironment"), Ue = a(
    function(r2) {
      return "'" + ("" + r2).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    },
    "quoteParamValue"
  ), ne = a(function(r2, e2, t2) {
    var n2 = e2[t2];
    n2 != null && r2.push(t2 + "=" + Ue(n2));
  }, "add"), gr = /* @__PURE__ */ __name(class gr {
    constructor(e2) {
      e2 = typeof e2 == "string" ? is(e2) : e2 || {}, e2.connectionString && (e2 = Object.assign({}, e2, is(e2.connectionString))), this.user = $("user", e2), this.database = $("database", e2), this.database === void 0 && (this.database = this.user), this.port = parseInt(
        $("port", e2),
        10
      ), this.host = $("host", e2), Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: $("password", e2)
      }), this.binary = $("binary", e2), this.options = $("options", e2), this.ssl = typeof e2.ssl > "u" ? Bu() : e2.ssl, typeof this.ssl == "string" && this.ssl === "true" && (this.ssl = true), this.ssl === "no-verify" && (this.ssl = { rejectUnauthorized: false }), this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: false }), this.client_encoding = $("client_encoding", e2), this.replication = $("replication", e2), this.isDomainSocket = !(this.host || "").indexOf("/"), this.application_name = $("application_name", e2, "PGAPPNAME"), this.fallback_application_name = $("fallback_application_name", e2, false), this.statement_timeout = $("statement_timeout", e2, false), this.lock_timeout = $(
        "lock_timeout",
        e2,
        false
      ), this.idle_in_transaction_session_timeout = $("idle_in_transaction_session_timeout", e2, false), this.query_timeout = $("query_timeout", e2, false), e2.connectionTimeoutMillis === void 0 ? this.connect_timeout = m.env.PGCONNECT_TIMEOUT || 0 : this.connect_timeout = Math.floor(e2.connectionTimeoutMillis / 1e3), e2.keepAlive === false ? this.keepalives = 0 : e2.keepAlive === true && (this.keepalives = 1), typeof e2.keepAliveInitialDelayMillis == "number" && (this.keepalives_idle = Math.floor(e2.keepAliveInitialDelayMillis / 1e3));
    }
    getLibpqConnectionString(e2) {
      var t2 = [];
      ne(t2, this, "user"), ne(t2, this, "password"), ne(t2, this, "port"), ne(t2, this, "application_name"), ne(t2, this, "fallback_application_name"), ne(t2, this, "connect_timeout"), ne(
        t2,
        this,
        "options"
      );
      var n2 = typeof this.ssl == "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
      if (ne(t2, n2, "sslmode"), ne(t2, n2, "sslca"), ne(t2, n2, "sslkey"), ne(t2, n2, "sslcert"), ne(t2, n2, "sslrootcert"), this.database && t2.push("dbname=" + Ue(this.database)), this.replication && t2.push("replication=" + Ue(this.replication)), this.host && t2.push("host=" + Ue(this.host)), this.isDomainSocket)
        return e2(null, t2.join(" "));
      this.client_encoding && t2.push("client_encoding=" + Ue(this.client_encoding)), Pu.lookup(this.host, function(i2, s2) {
        return i2 ? e2(i2, null) : (t2.push("hostaddr=" + Ue(s2)), e2(null, t2.join(" ")));
      });
    }
  }, "gr");
  a(gr, "ConnectionParameters");
  var mr = gr;
  os.exports = mr;
});
var cs = I((Tl, us) => {
  "use strict";
  p();
  var Lu = Je(), as2 = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/, br2 = /* @__PURE__ */ __name(class br {
    constructor(e2, t2) {
      this.command = null, this.rowCount = null, this.oid = null, this.rows = [], this.fields = [], this._parsers = void 0, this._types = t2, this.RowCtor = null, this.rowAsArray = e2 === "array", this.rowAsArray && (this.parseRow = this._parseRowAsArray);
    }
    addCommandComplete(e2) {
      var t2;
      e2.text ? t2 = as2.exec(e2.text) : t2 = as2.exec(e2.command), t2 && (this.command = t2[1], t2[3] ? (this.oid = parseInt(t2[2], 10), this.rowCount = parseInt(t2[3], 10)) : t2[2] && (this.rowCount = parseInt(
        t2[2],
        10
      )));
    }
    _parseRowAsArray(e2) {
      for (var t2 = new Array(e2.length), n2 = 0, i2 = e2.length; n2 < i2; n2++) {
        var s2 = e2[n2];
        s2 !== null ? t2[n2] = this._parsers[n2](s2) : t2[n2] = null;
      }
      return t2;
    }
    parseRow(e2) {
      for (var t2 = {}, n2 = 0, i2 = e2.length; n2 < i2; n2++) {
        var s2 = e2[n2], o2 = this.fields[n2].name;
        s2 !== null ? t2[o2] = this._parsers[n2](
          s2
        ) : t2[o2] = null;
      }
      return t2;
    }
    addRow(e2) {
      this.rows.push(e2);
    }
    addFields(e2) {
      this.fields = e2, this.fields.length && (this._parsers = new Array(e2.length));
      for (var t2 = 0; t2 < e2.length; t2++) {
        var n2 = e2[t2];
        this._types ? this._parsers[t2] = this._types.getTypeParser(n2.dataTypeID, n2.format || "text") : this._parsers[t2] = Lu.getTypeParser(n2.dataTypeID, n2.format || "text");
      }
    }
  }, "br");
  a(br2, "Result");
  var wr = br2;
  us.exports = wr;
});
var ps = I((Bl, fs) => {
  "use strict";
  p();
  var { EventEmitter: Ru } = we(), hs = cs(), ls = et(), xr = /* @__PURE__ */ __name(class xr extends Ru {
    constructor(e2, t2, n2) {
      super(), e2 = ls.normalizeQueryConfig(e2, t2, n2), this.text = e2.text, this.values = e2.values, this.rows = e2.rows, this.types = e2.types, this.name = e2.name, this.binary = e2.binary, this.portal = e2.portal || "", this.callback = e2.callback, this._rowMode = e2.rowMode, m.domain && e2.callback && (this.callback = m.domain.bind(e2.callback)), this._result = new hs(this._rowMode, this.types), this._results = this._result, this.isPreparedStatement = false, this._canceledDueToError = false, this._promise = null;
    }
    requiresPreparation() {
      return this.name || this.rows ? true : !this.text || !this.values ? false : this.values.length > 0;
    }
    _checkForMultirow() {
      this._result.command && (Array.isArray(this._results) || (this._results = [this._result]), this._result = new hs(
        this._rowMode,
        this.types
      ), this._results.push(this._result));
    }
    handleRowDescription(e2) {
      this._checkForMultirow(), this._result.addFields(e2.fields), this._accumulateRows = this.callback || !this.listeners("row").length;
    }
    handleDataRow(e2) {
      let t2;
      if (!this._canceledDueToError) {
        try {
          t2 = this._result.parseRow(e2.fields);
        } catch (n2) {
          this._canceledDueToError = n2;
          return;
        }
        this.emit("row", t2, this._result), this._accumulateRows && this._result.addRow(t2);
      }
    }
    handleCommandComplete(e2, t2) {
      this._checkForMultirow(), this._result.addCommandComplete(e2), this.rows && t2.sync();
    }
    handleEmptyQuery(e2) {
      this.rows && e2.sync();
    }
    handleError(e2, t2) {
      if (this._canceledDueToError && (e2 = this._canceledDueToError, this._canceledDueToError = false), this.callback)
        return this.callback(e2);
      this.emit("error", e2);
    }
    handleReadyForQuery(e2) {
      if (this._canceledDueToError)
        return this.handleError(
          this._canceledDueToError,
          e2
        );
      if (this.callback)
        try {
          this.callback(null, this._results);
        } catch (t2) {
          m.nextTick(() => {
            throw t2;
          });
        }
      this.emit("end", this._results);
    }
    submit(e2) {
      if (typeof this.text != "string" && typeof this.name != "string")
        return new Error("A query must have either text or a name. Supplying neither is unsupported.");
      let t2 = e2.parsedStatements[this.name];
      return this.text && t2 && this.text !== t2 ? new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`) : this.values && !Array.isArray(this.values) ? new Error("Query values must be an array") : (this.requiresPreparation() ? this.prepare(e2) : e2.query(this.text), null);
    }
    hasBeenParsed(e2) {
      return this.name && e2.parsedStatements[this.name];
    }
    handlePortalSuspended(e2) {
      this._getRows(e2, this.rows);
    }
    _getRows(e2, t2) {
      e2.execute(
        { portal: this.portal, rows: t2 }
      ), t2 ? e2.flush() : e2.sync();
    }
    prepare(e2) {
      this.isPreparedStatement = true, this.hasBeenParsed(e2) || e2.parse({ text: this.text, name: this.name, types: this.types });
      try {
        e2.bind({ portal: this.portal, statement: this.name, values: this.values, binary: this.binary, valueMapper: ls.prepareValue });
      } catch (t2) {
        this.handleError(t2, e2);
        return;
      }
      e2.describe(
        { type: "P", name: this.portal || "" }
      ), this._getRows(e2, this.rows);
    }
    handleCopyInResponse(e2) {
      e2.sendCopyFail("No source stream defined");
    }
    handleCopyData(e2, t2) {
    }
  }, "xr");
  a(xr, "Query");
  var Sr = xr;
  fs.exports = Sr;
});
var ys = {};
ie(ys, { Socket: () => _e, isIP: () => Fu });
function Fu(r2) {
  return 0;
}
__name(Fu, "Fu");
var ds;
var Mu;
var E;
var _e;
var wt = z(() => {
  "use strict";
  p();
  ds = Te(we(), 1);
  a(Fu, "isIP");
  Mu = a((r2) => r2.replace(
    /^[^.]+\./,
    "api."
  ), "transformHost"), E = /* @__PURE__ */ __name(class E3 extends ds.EventEmitter {
    constructor() {
      super(...arguments);
      _(this, "opts", {});
      _(this, "connecting", false);
      _(this, "pending", true);
      _(
        this,
        "writable",
        true
      );
      _(this, "encrypted", false);
      _(this, "authorized", false);
      _(this, "destroyed", false);
      _(
        this,
        "ws",
        null
      );
      _(this, "writeBuffer");
      _(this, "tlsState", 0);
      _(this, "tlsRead");
      _(this, "tlsWrite");
    }
    static get poolQueryViaFetch() {
      return E3.opts.poolQueryViaFetch ?? E3.defaults.poolQueryViaFetch;
    }
    static set poolQueryViaFetch(t2) {
      E3.opts.poolQueryViaFetch = t2;
    }
    static get fetchEndpoint() {
      return E3.opts.fetchEndpoint ?? E3.defaults.fetchEndpoint;
    }
    static set fetchEndpoint(t2) {
      E3.opts.fetchEndpoint = t2;
    }
    static get fetchConnectionCache() {
      return true;
    }
    static set fetchConnectionCache(t2) {
      console.warn("The `fetchConnectionCache` option is deprecated (now always `true`)");
    }
    static get fetchFunction() {
      return E3.opts.fetchFunction ?? E3.defaults.fetchFunction;
    }
    static set fetchFunction(t2) {
      E3.opts.fetchFunction = t2;
    }
    static get webSocketConstructor() {
      return E3.opts.webSocketConstructor ?? E3.defaults.webSocketConstructor;
    }
    static set webSocketConstructor(t2) {
      E3.opts.webSocketConstructor = t2;
    }
    get webSocketConstructor() {
      return this.opts.webSocketConstructor ?? E3.webSocketConstructor;
    }
    set webSocketConstructor(t2) {
      this.opts.webSocketConstructor = t2;
    }
    static get wsProxy() {
      return E3.opts.wsProxy ?? E3.defaults.wsProxy;
    }
    static set wsProxy(t2) {
      E3.opts.wsProxy = t2;
    }
    get wsProxy() {
      return this.opts.wsProxy ?? E3.wsProxy;
    }
    set wsProxy(t2) {
      this.opts.wsProxy = t2;
    }
    static get coalesceWrites() {
      return E3.opts.coalesceWrites ?? E3.defaults.coalesceWrites;
    }
    static set coalesceWrites(t2) {
      E3.opts.coalesceWrites = t2;
    }
    get coalesceWrites() {
      return this.opts.coalesceWrites ?? E3.coalesceWrites;
    }
    set coalesceWrites(t2) {
      this.opts.coalesceWrites = t2;
    }
    static get useSecureWebSocket() {
      return E3.opts.useSecureWebSocket ?? E3.defaults.useSecureWebSocket;
    }
    static set useSecureWebSocket(t2) {
      E3.opts.useSecureWebSocket = t2;
    }
    get useSecureWebSocket() {
      return this.opts.useSecureWebSocket ?? E3.useSecureWebSocket;
    }
    set useSecureWebSocket(t2) {
      this.opts.useSecureWebSocket = t2;
    }
    static get forceDisablePgSSL() {
      return E3.opts.forceDisablePgSSL ?? E3.defaults.forceDisablePgSSL;
    }
    static set forceDisablePgSSL(t2) {
      E3.opts.forceDisablePgSSL = t2;
    }
    get forceDisablePgSSL() {
      return this.opts.forceDisablePgSSL ?? E3.forceDisablePgSSL;
    }
    set forceDisablePgSSL(t2) {
      this.opts.forceDisablePgSSL = t2;
    }
    static get disableSNI() {
      return E3.opts.disableSNI ?? E3.defaults.disableSNI;
    }
    static set disableSNI(t2) {
      E3.opts.disableSNI = t2;
    }
    get disableSNI() {
      return this.opts.disableSNI ?? E3.disableSNI;
    }
    set disableSNI(t2) {
      this.opts.disableSNI = t2;
    }
    static get pipelineConnect() {
      return E3.opts.pipelineConnect ?? E3.defaults.pipelineConnect;
    }
    static set pipelineConnect(t2) {
      E3.opts.pipelineConnect = t2;
    }
    get pipelineConnect() {
      return this.opts.pipelineConnect ?? E3.pipelineConnect;
    }
    set pipelineConnect(t2) {
      this.opts.pipelineConnect = t2;
    }
    static get subtls() {
      return E3.opts.subtls ?? E3.defaults.subtls;
    }
    static set subtls(t2) {
      E3.opts.subtls = t2;
    }
    get subtls() {
      return this.opts.subtls ?? E3.subtls;
    }
    set subtls(t2) {
      this.opts.subtls = t2;
    }
    static get pipelineTLS() {
      return E3.opts.pipelineTLS ?? E3.defaults.pipelineTLS;
    }
    static set pipelineTLS(t2) {
      E3.opts.pipelineTLS = t2;
    }
    get pipelineTLS() {
      return this.opts.pipelineTLS ?? E3.pipelineTLS;
    }
    set pipelineTLS(t2) {
      this.opts.pipelineTLS = t2;
    }
    static get rootCerts() {
      return E3.opts.rootCerts ?? E3.defaults.rootCerts;
    }
    static set rootCerts(t2) {
      E3.opts.rootCerts = t2;
    }
    get rootCerts() {
      return this.opts.rootCerts ?? E3.rootCerts;
    }
    set rootCerts(t2) {
      this.opts.rootCerts = t2;
    }
    wsProxyAddrForHost(t2, n2) {
      let i2 = this.wsProxy;
      if (i2 === void 0)
        throw new Error("No WebSocket proxy is configured. Please see https://github.com/neondatabase/serverless/blob/main/CONFIG.md#wsproxy-string--host-string-port-number--string--string");
      return typeof i2 == "function" ? i2(t2, n2) : `${i2}?address=${t2}:${n2}`;
    }
    setNoDelay() {
      return this;
    }
    setKeepAlive() {
      return this;
    }
    ref() {
      return this;
    }
    unref() {
      return this;
    }
    connect(t2, n2, i2) {
      this.connecting = true, i2 && this.once("connect", i2);
      let s2 = a(() => {
        this.connecting = false, this.pending = false, this.emit("connect"), this.emit("ready");
      }, "handleWebSocketOpen"), o2 = a((c2, h2 = false) => {
        c2.binaryType = "arraybuffer", c2.addEventListener("error", (l2) => {
          this.emit("error", l2), this.emit("close");
        }), c2.addEventListener("message", (l2) => {
          if (this.tlsState === 0) {
            let d2 = y.from(l2.data);
            this.emit(
              "data",
              d2
            );
          }
        }), c2.addEventListener("close", () => {
          this.emit("close");
        }), h2 ? s2() : c2.addEventListener(
          "open",
          s2
        );
      }, "configureWebSocket"), u2;
      try {
        u2 = this.wsProxyAddrForHost(n2, typeof t2 == "string" ? parseInt(t2, 10) : t2);
      } catch (c2) {
        this.emit("error", c2), this.emit("close");
        return;
      }
      try {
        let h2 = (this.useSecureWebSocket ? "wss:" : "ws:") + "//" + u2;
        if (this.webSocketConstructor !== void 0)
          this.ws = new this.webSocketConstructor(h2), o2(this.ws);
        else
          try {
            this.ws = new WebSocket(
              h2
            ), o2(this.ws);
          } catch {
            this.ws = new __unstable_WebSocket(h2), o2(this.ws);
          }
      } catch (c2) {
        let l2 = (this.useSecureWebSocket ? "https:" : "http:") + "//" + u2;
        fetch(l2, { headers: { Upgrade: "websocket" } }).then((d2) => {
          if (this.ws = d2.webSocket, this.ws == null)
            throw c2;
          this.ws.accept(), o2(
            this.ws,
            true
          );
        }).catch((d2) => {
          this.emit("error", new Error(`All attempts to open a WebSocket to connect to the database failed. Please refer to https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined. Details: ${d2.message}`)), this.emit("close");
        });
      }
    }
    async startTls(t2) {
      if (this.subtls === void 0)
        throw new Error("For Postgres SSL connections, you must set `neonConfig.subtls` to the subtls library. See https://github.com/neondatabase/serverless/blob/main/CONFIG.md for more information.");
      this.tlsState = 1;
      let n2 = this.subtls.TrustedCert.fromPEM(this.rootCerts), i2 = new this.subtls.WebSocketReadQueue(this.ws), s2 = i2.read.bind(
        i2
      ), o2 = this.rawWrite.bind(this), [u2, c2] = await this.subtls.startTls(t2, n2, s2, o2, { useSNI: !this.disableSNI, expectPreData: this.pipelineTLS ? new Uint8Array([83]) : void 0 });
      this.tlsRead = u2, this.tlsWrite = c2, this.tlsState = 2, this.encrypted = true, this.authorized = true, this.emit(
        "secureConnection",
        this
      ), this.tlsReadLoop();
    }
    async tlsReadLoop() {
      for (; ; ) {
        let t2 = await this.tlsRead();
        if (t2 === void 0)
          break;
        {
          let n2 = y.from(t2);
          this.emit("data", n2);
        }
      }
    }
    rawWrite(t2) {
      if (!this.coalesceWrites) {
        this.ws.send(t2);
        return;
      }
      if (this.writeBuffer === void 0)
        this.writeBuffer = t2, setTimeout(
          () => {
            this.ws.send(this.writeBuffer), this.writeBuffer = void 0;
          },
          0
        );
      else {
        let n2 = new Uint8Array(this.writeBuffer.length + t2.length);
        n2.set(this.writeBuffer), n2.set(t2, this.writeBuffer.length), this.writeBuffer = n2;
      }
    }
    write(t2, n2 = "utf8", i2 = (s2) => {
    }) {
      return t2.length === 0 ? (i2(), true) : (typeof t2 == "string" && (t2 = y.from(t2, n2)), this.tlsState === 0 ? (this.rawWrite(t2), i2()) : this.tlsState === 1 ? this.once("secureConnection", () => {
        this.write(
          t2,
          n2,
          i2
        );
      }) : (this.tlsWrite(t2), i2()), true);
    }
    end(t2 = y.alloc(0), n2 = "utf8", i2 = () => {
    }) {
      return this.write(t2, n2, () => {
        this.ws.close(), i2();
      }), this;
    }
    destroy() {
      return this.destroyed = true, this.end();
    }
  }, "E");
  a(E, "Socket"), _(E, "defaults", {
    poolQueryViaFetch: false,
    fetchEndpoint: a((t2) => "https://" + Mu(t2) + "/sql", "fetchEndpoint"),
    fetchConnectionCache: true,
    fetchFunction: void 0,
    webSocketConstructor: void 0,
    wsProxy: a((t2) => t2 + "/v2", "wsProxy"),
    useSecureWebSocket: true,
    forceDisablePgSSL: true,
    coalesceWrites: true,
    pipelineConnect: "password",
    subtls: void 0,
    rootCerts: "",
    pipelineTLS: false,
    disableSNI: false
  }), _(E, "opts", {});
  _e = E;
});
var Yr = I((T2) => {
  "use strict";
  p();
  Object.defineProperty(T2, "__esModule", { value: true });
  T2.NoticeMessage = T2.DataRowMessage = T2.CommandCompleteMessage = T2.ReadyForQueryMessage = T2.NotificationResponseMessage = T2.BackendKeyDataMessage = T2.AuthenticationMD5Password = T2.ParameterStatusMessage = T2.ParameterDescriptionMessage = T2.RowDescriptionMessage = T2.Field = T2.CopyResponse = T2.CopyDataMessage = T2.DatabaseError = T2.copyDone = T2.emptyQuery = T2.replicationStart = T2.portalSuspended = T2.noData = T2.closeComplete = T2.bindComplete = T2.parseComplete = void 0;
  T2.parseComplete = { name: "parseComplete", length: 5 };
  T2.bindComplete = { name: "bindComplete", length: 5 };
  T2.closeComplete = { name: "closeComplete", length: 5 };
  T2.noData = { name: "noData", length: 5 };
  T2.portalSuspended = { name: "portalSuspended", length: 5 };
  T2.replicationStart = { name: "replicationStart", length: 4 };
  T2.emptyQuery = { name: "emptyQuery", length: 4 };
  T2.copyDone = { name: "copyDone", length: 4 };
  var kr = /* @__PURE__ */ __name(class kr extends Error {
    constructor(e2, t2, n2) {
      super(
        e2
      ), this.length = t2, this.name = n2;
    }
  }, "kr");
  a(kr, "DatabaseError");
  var vr = kr;
  T2.DatabaseError = vr;
  var Ur = /* @__PURE__ */ __name(class Ur {
    constructor(e2, t2) {
      this.length = e2, this.chunk = t2, this.name = "copyData";
    }
  }, "Ur");
  a(Ur, "CopyDataMessage");
  var Er = Ur;
  T2.CopyDataMessage = Er;
  var Or = /* @__PURE__ */ __name(class Or {
    constructor(e2, t2, n2, i2) {
      this.length = e2, this.name = t2, this.binary = n2, this.columnTypes = new Array(i2);
    }
  }, "Or");
  a(Or, "CopyResponse");
  var _r = Or;
  T2.CopyResponse = _r;
  var Nr = /* @__PURE__ */ __name(class Nr {
    constructor(e2, t2, n2, i2, s2, o2, u2) {
      this.name = e2, this.tableID = t2, this.columnID = n2, this.dataTypeID = i2, this.dataTypeSize = s2, this.dataTypeModifier = o2, this.format = u2;
    }
  }, "Nr");
  a(Nr, "Field");
  var Ar = Nr;
  T2.Field = Ar;
  var qr = /* @__PURE__ */ __name(class qr {
    constructor(e2, t2) {
      this.length = e2, this.fieldCount = t2, this.name = "rowDescription", this.fields = new Array(
        this.fieldCount
      );
    }
  }, "qr");
  a(qr, "RowDescriptionMessage");
  var Cr = qr;
  T2.RowDescriptionMessage = Cr;
  var Qr = /* @__PURE__ */ __name(class Qr {
    constructor(e2, t2) {
      this.length = e2, this.parameterCount = t2, this.name = "parameterDescription", this.dataTypeIDs = new Array(this.parameterCount);
    }
  }, "Qr");
  a(Qr, "ParameterDescriptionMessage");
  var Tr = Qr;
  T2.ParameterDescriptionMessage = Tr;
  var Wr = /* @__PURE__ */ __name(class Wr {
    constructor(e2, t2, n2) {
      this.length = e2, this.parameterName = t2, this.parameterValue = n2, this.name = "parameterStatus";
    }
  }, "Wr");
  a(Wr, "ParameterStatusMessage");
  var Ir = Wr;
  T2.ParameterStatusMessage = Ir;
  var jr = /* @__PURE__ */ __name(class jr {
    constructor(e2, t2) {
      this.length = e2, this.salt = t2, this.name = "authenticationMD5Password";
    }
  }, "jr");
  a(jr, "AuthenticationMD5Password");
  var Pr = jr;
  T2.AuthenticationMD5Password = Pr;
  var Hr = /* @__PURE__ */ __name(class Hr {
    constructor(e2, t2, n2) {
      this.length = e2, this.processID = t2, this.secretKey = n2, this.name = "backendKeyData";
    }
  }, "Hr");
  a(
    Hr,
    "BackendKeyDataMessage"
  );
  var Br = Hr;
  T2.BackendKeyDataMessage = Br;
  var Gr = /* @__PURE__ */ __name(class Gr {
    constructor(e2, t2, n2, i2) {
      this.length = e2, this.processId = t2, this.channel = n2, this.payload = i2, this.name = "notification";
    }
  }, "Gr");
  a(Gr, "NotificationResponseMessage");
  var Lr = Gr;
  T2.NotificationResponseMessage = Lr;
  var $r = /* @__PURE__ */ __name(class $r {
    constructor(e2, t2) {
      this.length = e2, this.status = t2, this.name = "readyForQuery";
    }
  }, "$r");
  a($r, "ReadyForQueryMessage");
  var Rr = $r;
  T2.ReadyForQueryMessage = Rr;
  var Vr = /* @__PURE__ */ __name(class Vr {
    constructor(e2, t2) {
      this.length = e2, this.text = t2, this.name = "commandComplete";
    }
  }, "Vr");
  a(Vr, "CommandCompleteMessage");
  var Fr = Vr;
  T2.CommandCompleteMessage = Fr;
  var Kr = /* @__PURE__ */ __name(class Kr {
    constructor(e2, t2) {
      this.length = e2, this.fields = t2, this.name = "dataRow", this.fieldCount = t2.length;
    }
  }, "Kr");
  a(Kr, "DataRowMessage");
  var Mr = Kr;
  T2.DataRowMessage = Mr;
  var zr = /* @__PURE__ */ __name(class zr {
    constructor(e2, t2) {
      this.length = e2, this.message = t2, this.name = "notice";
    }
  }, "zr");
  a(zr, "NoticeMessage");
  var Dr = zr;
  T2.NoticeMessage = Dr;
});
var ms = I((bt2) => {
  "use strict";
  p();
  Object.defineProperty(bt2, "__esModule", { value: true });
  bt2.Writer = void 0;
  var Jr = /* @__PURE__ */ __name(class Jr {
    constructor(e2 = 256) {
      this.size = e2, this.offset = 5, this.headerPosition = 0, this.buffer = y.allocUnsafe(e2);
    }
    ensure(e2) {
      var t2 = this.buffer.length - this.offset;
      if (t2 < e2) {
        var n2 = this.buffer, i2 = n2.length + (n2.length >> 1) + e2;
        this.buffer = y.allocUnsafe(
          i2
        ), n2.copy(this.buffer);
      }
    }
    addInt32(e2) {
      return this.ensure(4), this.buffer[this.offset++] = e2 >>> 24 & 255, this.buffer[this.offset++] = e2 >>> 16 & 255, this.buffer[this.offset++] = e2 >>> 8 & 255, this.buffer[this.offset++] = e2 >>> 0 & 255, this;
    }
    addInt16(e2) {
      return this.ensure(2), this.buffer[this.offset++] = e2 >>> 8 & 255, this.buffer[this.offset++] = e2 >>> 0 & 255, this;
    }
    addCString(e2) {
      if (!e2)
        this.ensure(1);
      else {
        var t2 = y.byteLength(e2);
        this.ensure(t2 + 1), this.buffer.write(
          e2,
          this.offset,
          "utf-8"
        ), this.offset += t2;
      }
      return this.buffer[this.offset++] = 0, this;
    }
    addString(e2 = "") {
      var t2 = y.byteLength(e2);
      return this.ensure(t2), this.buffer.write(e2, this.offset), this.offset += t2, this;
    }
    add(e2) {
      return this.ensure(e2.length), e2.copy(this.buffer, this.offset), this.offset += e2.length, this;
    }
    join(e2) {
      if (e2) {
        this.buffer[this.headerPosition] = e2;
        let t2 = this.offset - (this.headerPosition + 1);
        this.buffer.writeInt32BE(t2, this.headerPosition + 1);
      }
      return this.buffer.slice(e2 ? 0 : 5, this.offset);
    }
    flush(e2) {
      var t2 = this.join(e2);
      return this.offset = 5, this.headerPosition = 0, this.buffer = y.allocUnsafe(this.size), t2;
    }
  }, "Jr");
  a(Jr, "Writer");
  var Zr = Jr;
  bt2.Writer = Zr;
});
var ws = I((xt) => {
  "use strict";
  p();
  Object.defineProperty(xt, "__esModule", { value: true });
  xt.serialize = void 0;
  var Xr = ms(), M2 = new Xr.Writer(), Du = a((r2) => {
    M2.addInt16(3).addInt16(
      0
    );
    for (let n2 of Object.keys(r2))
      M2.addCString(n2).addCString(r2[n2]);
    M2.addCString("client_encoding").addCString("UTF8");
    var e2 = M2.addCString("").flush(), t2 = e2.length + 4;
    return new Xr.Writer().addInt32(t2).add(e2).flush();
  }, "startup"), ku = a(() => {
    let r2 = y.allocUnsafe(8);
    return r2.writeInt32BE(8, 0), r2.writeInt32BE(80877103, 4), r2;
  }, "requestSsl"), Uu = a((r2) => M2.addCString(r2).flush(112), "password"), Ou = a(function(r2, e2) {
    return M2.addCString(r2).addInt32(
      y.byteLength(e2)
    ).addString(e2), M2.flush(112);
  }, "sendSASLInitialResponseMessage"), Nu = a(
    function(r2) {
      return M2.addString(r2).flush(112);
    },
    "sendSCRAMClientFinalMessage"
  ), qu = a(
    (r2) => M2.addCString(r2).flush(81),
    "query"
  ), gs = [], Qu = a((r2) => {
    let e2 = r2.name || "";
    e2.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", e2, e2.length), console.error("This can cause conflicts and silent errors executing queries"));
    let t2 = r2.types || gs;
    for (var n2 = t2.length, i2 = M2.addCString(e2).addCString(r2.text).addInt16(n2), s2 = 0; s2 < n2; s2++)
      i2.addInt32(t2[s2]);
    return M2.flush(80);
  }, "parse"), Oe = new Xr.Writer(), Wu = a(function(r2, e2) {
    for (let t2 = 0; t2 < r2.length; t2++) {
      let n2 = e2 ? e2(r2[t2], t2) : r2[t2];
      n2 == null ? (M2.addInt16(0), Oe.addInt32(-1)) : n2 instanceof y ? (M2.addInt16(1), Oe.addInt32(n2.length), Oe.add(n2)) : (M2.addInt16(0), Oe.addInt32(y.byteLength(
        n2
      )), Oe.addString(n2));
    }
  }, "writeValues"), ju = a((r2 = {}) => {
    let e2 = r2.portal || "", t2 = r2.statement || "", n2 = r2.binary || false, i2 = r2.values || gs, s2 = i2.length;
    return M2.addCString(e2).addCString(t2), M2.addInt16(s2), Wu(i2, r2.valueMapper), M2.addInt16(s2), M2.add(Oe.flush()), M2.addInt16(n2 ? 1 : 0), M2.flush(66);
  }, "bind"), Hu = y.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]), Gu = a((r2) => {
    if (!r2 || !r2.portal && !r2.rows)
      return Hu;
    let e2 = r2.portal || "", t2 = r2.rows || 0, n2 = y.byteLength(e2), i2 = 4 + n2 + 1 + 4, s2 = y.allocUnsafe(1 + i2);
    return s2[0] = 69, s2.writeInt32BE(i2, 1), s2.write(e2, 5, "utf-8"), s2[n2 + 5] = 0, s2.writeUInt32BE(t2, s2.length - 4), s2;
  }, "execute"), $u = a((r2, e2) => {
    let t2 = y.allocUnsafe(16);
    return t2.writeInt32BE(16, 0), t2.writeInt16BE(1234, 4), t2.writeInt16BE(5678, 6), t2.writeInt32BE(
      r2,
      8
    ), t2.writeInt32BE(e2, 12), t2;
  }, "cancel"), en = a(
    (r2, e2) => {
      let n2 = 4 + y.byteLength(e2) + 1, i2 = y.allocUnsafe(1 + n2);
      return i2[0] = r2, i2.writeInt32BE(n2, 1), i2.write(e2, 5, "utf-8"), i2[n2] = 0, i2;
    },
    "cstringMessage"
  ), Vu = M2.addCString("P").flush(68), Ku = M2.addCString("S").flush(68), zu = a((r2) => r2.name ? en(68, `${r2.type}${r2.name || ""}`) : r2.type === "P" ? Vu : Ku, "describe"), Yu = a(
    (r2) => {
      let e2 = `${r2.type}${r2.name || ""}`;
      return en(67, e2);
    },
    "close"
  ), Zu = a((r2) => M2.add(r2).flush(
    100
  ), "copyData"), Ju = a((r2) => en(102, r2), "copyFail"), St = a((r2) => y.from([r2, 0, 0, 0, 4]), "codeOnlyBuffer"), Xu = St(72), ec = St(83), tc = St(88), rc = St(99), nc = {
    startup: Du,
    password: Uu,
    requestSsl: ku,
    sendSASLInitialResponseMessage: Ou,
    sendSCRAMClientFinalMessage: Nu,
    query: qu,
    parse: Qu,
    bind: ju,
    execute: Gu,
    describe: zu,
    close: Yu,
    flush: a(() => Xu, "flush"),
    sync: a(
      () => ec,
      "sync"
    ),
    end: a(() => tc, "end"),
    copyData: Zu,
    copyDone: a(() => rc, "copyDone"),
    copyFail: Ju,
    cancel: $u
  };
  xt.serialize = nc;
});
var bs = I((vt) => {
  "use strict";
  p();
  Object.defineProperty(vt, "__esModule", { value: true });
  vt.BufferReader = void 0;
  var ic = y.allocUnsafe(0), rn = /* @__PURE__ */ __name(class rn {
    constructor(e2 = 0) {
      this.offset = e2, this.buffer = ic, this.encoding = "utf-8";
    }
    setBuffer(e2, t2) {
      this.offset = e2, this.buffer = t2;
    }
    int16() {
      let e2 = this.buffer.readInt16BE(this.offset);
      return this.offset += 2, e2;
    }
    byte() {
      let e2 = this.buffer[this.offset];
      return this.offset++, e2;
    }
    int32() {
      let e2 = this.buffer.readInt32BE(this.offset);
      return this.offset += 4, e2;
    }
    string(e2) {
      let t2 = this.buffer.toString(this.encoding, this.offset, this.offset + e2);
      return this.offset += e2, t2;
    }
    cstring() {
      let e2 = this.offset, t2 = e2;
      for (; this.buffer[t2++] !== 0; )
        ;
      return this.offset = t2, this.buffer.toString(this.encoding, e2, t2 - 1);
    }
    bytes(e2) {
      let t2 = this.buffer.slice(this.offset, this.offset + e2);
      return this.offset += e2, t2;
    }
  }, "rn");
  a(rn, "BufferReader");
  var tn = rn;
  vt.BufferReader = tn;
});
var vs = I((Et) => {
  "use strict";
  p();
  Object.defineProperty(Et, "__esModule", { value: true });
  Et.Parser = void 0;
  var D2 = Yr(), sc = bs(), nn = 1, oc = 4, Ss = nn + oc, xs = y.allocUnsafe(0), on = /* @__PURE__ */ __name(class on {
    constructor(e2) {
      if (this.buffer = xs, this.bufferLength = 0, this.bufferOffset = 0, this.reader = new sc.BufferReader(), e2?.mode === "binary")
        throw new Error("Binary mode not supported yet");
      this.mode = e2?.mode || "text";
    }
    parse(e2, t2) {
      this.mergeBuffer(e2);
      let n2 = this.bufferOffset + this.bufferLength, i2 = this.bufferOffset;
      for (; i2 + Ss <= n2; ) {
        let s2 = this.buffer[i2], o2 = this.buffer.readUInt32BE(
          i2 + nn
        ), u2 = nn + o2;
        if (u2 + i2 <= n2) {
          let c2 = this.handlePacket(i2 + Ss, s2, o2, this.buffer);
          t2(c2), i2 += u2;
        } else
          break;
      }
      i2 === n2 ? (this.buffer = xs, this.bufferLength = 0, this.bufferOffset = 0) : (this.bufferLength = n2 - i2, this.bufferOffset = i2);
    }
    mergeBuffer(e2) {
      if (this.bufferLength > 0) {
        let t2 = this.bufferLength + e2.byteLength;
        if (t2 + this.bufferOffset > this.buffer.byteLength) {
          let i2;
          if (t2 <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength)
            i2 = this.buffer;
          else {
            let s2 = this.buffer.byteLength * 2;
            for (; t2 >= s2; )
              s2 *= 2;
            i2 = y.allocUnsafe(s2);
          }
          this.buffer.copy(
            i2,
            0,
            this.bufferOffset,
            this.bufferOffset + this.bufferLength
          ), this.buffer = i2, this.bufferOffset = 0;
        }
        e2.copy(this.buffer, this.bufferOffset + this.bufferLength), this.bufferLength = t2;
      } else
        this.buffer = e2, this.bufferOffset = 0, this.bufferLength = e2.byteLength;
    }
    handlePacket(e2, t2, n2, i2) {
      switch (t2) {
        case 50:
          return D2.bindComplete;
        case 49:
          return D2.parseComplete;
        case 51:
          return D2.closeComplete;
        case 110:
          return D2.noData;
        case 115:
          return D2.portalSuspended;
        case 99:
          return D2.copyDone;
        case 87:
          return D2.replicationStart;
        case 73:
          return D2.emptyQuery;
        case 68:
          return this.parseDataRowMessage(
            e2,
            n2,
            i2
          );
        case 67:
          return this.parseCommandCompleteMessage(e2, n2, i2);
        case 90:
          return this.parseReadyForQueryMessage(e2, n2, i2);
        case 65:
          return this.parseNotificationMessage(
            e2,
            n2,
            i2
          );
        case 82:
          return this.parseAuthenticationResponse(e2, n2, i2);
        case 83:
          return this.parseParameterStatusMessage(e2, n2, i2);
        case 75:
          return this.parseBackendKeyData(e2, n2, i2);
        case 69:
          return this.parseErrorMessage(e2, n2, i2, "error");
        case 78:
          return this.parseErrorMessage(
            e2,
            n2,
            i2,
            "notice"
          );
        case 84:
          return this.parseRowDescriptionMessage(e2, n2, i2);
        case 116:
          return this.parseParameterDescriptionMessage(e2, n2, i2);
        case 71:
          return this.parseCopyInMessage(
            e2,
            n2,
            i2
          );
        case 72:
          return this.parseCopyOutMessage(e2, n2, i2);
        case 100:
          return this.parseCopyData(
            e2,
            n2,
            i2
          );
        default:
          return new D2.DatabaseError("received invalid response: " + t2.toString(
            16
          ), n2, "error");
      }
    }
    parseReadyForQueryMessage(e2, t2, n2) {
      this.reader.setBuffer(e2, n2);
      let i2 = this.reader.string(1);
      return new D2.ReadyForQueryMessage(t2, i2);
    }
    parseCommandCompleteMessage(e2, t2, n2) {
      this.reader.setBuffer(e2, n2);
      let i2 = this.reader.cstring();
      return new D2.CommandCompleteMessage(
        t2,
        i2
      );
    }
    parseCopyData(e2, t2, n2) {
      let i2 = n2.slice(e2, e2 + (t2 - 4));
      return new D2.CopyDataMessage(
        t2,
        i2
      );
    }
    parseCopyInMessage(e2, t2, n2) {
      return this.parseCopyMessage(e2, t2, n2, "copyInResponse");
    }
    parseCopyOutMessage(e2, t2, n2) {
      return this.parseCopyMessage(e2, t2, n2, "copyOutResponse");
    }
    parseCopyMessage(e2, t2, n2, i2) {
      this.reader.setBuffer(e2, n2);
      let s2 = this.reader.byte() !== 0, o2 = this.reader.int16(), u2 = new D2.CopyResponse(t2, i2, s2, o2);
      for (let c2 = 0; c2 < o2; c2++)
        u2.columnTypes[c2] = this.reader.int16();
      return u2;
    }
    parseNotificationMessage(e2, t2, n2) {
      this.reader.setBuffer(
        e2,
        n2
      );
      let i2 = this.reader.int32(), s2 = this.reader.cstring(), o2 = this.reader.cstring();
      return new D2.NotificationResponseMessage(t2, i2, s2, o2);
    }
    parseRowDescriptionMessage(e2, t2, n2) {
      this.reader.setBuffer(e2, n2);
      let i2 = this.reader.int16(), s2 = new D2.RowDescriptionMessage(t2, i2);
      for (let o2 = 0; o2 < i2; o2++)
        s2.fields[o2] = this.parseField();
      return s2;
    }
    parseField() {
      let e2 = this.reader.cstring(), t2 = this.reader.int32(), n2 = this.reader.int16(), i2 = this.reader.int32(), s2 = this.reader.int16(), o2 = this.reader.int32(), u2 = this.reader.int16() === 0 ? "text" : "binary";
      return new D2.Field(e2, t2, n2, i2, s2, o2, u2);
    }
    parseParameterDescriptionMessage(e2, t2, n2) {
      this.reader.setBuffer(
        e2,
        n2
      );
      let i2 = this.reader.int16(), s2 = new D2.ParameterDescriptionMessage(t2, i2);
      for (let o2 = 0; o2 < i2; o2++)
        s2.dataTypeIDs[o2] = this.reader.int32();
      return s2;
    }
    parseDataRowMessage(e2, t2, n2) {
      this.reader.setBuffer(e2, n2);
      let i2 = this.reader.int16(), s2 = new Array(i2);
      for (let o2 = 0; o2 < i2; o2++) {
        let u2 = this.reader.int32();
        s2[o2] = u2 === -1 ? null : this.reader.string(u2);
      }
      return new D2.DataRowMessage(
        t2,
        s2
      );
    }
    parseParameterStatusMessage(e2, t2, n2) {
      this.reader.setBuffer(e2, n2);
      let i2 = this.reader.cstring(), s2 = this.reader.cstring();
      return new D2.ParameterStatusMessage(t2, i2, s2);
    }
    parseBackendKeyData(e2, t2, n2) {
      this.reader.setBuffer(e2, n2);
      let i2 = this.reader.int32(), s2 = this.reader.int32();
      return new D2.BackendKeyDataMessage(t2, i2, s2);
    }
    parseAuthenticationResponse(e2, t2, n2) {
      this.reader.setBuffer(
        e2,
        n2
      );
      let i2 = this.reader.int32(), s2 = { name: "authenticationOk", length: t2 };
      switch (i2) {
        case 0:
          break;
        case 3:
          s2.length === 8 && (s2.name = "authenticationCleartextPassword");
          break;
        case 5:
          if (s2.length === 12) {
            s2.name = "authenticationMD5Password";
            let u2 = this.reader.bytes(4);
            return new D2.AuthenticationMD5Password(t2, u2);
          }
          break;
        case 10:
          s2.name = "authenticationSASL", s2.mechanisms = [];
          let o2;
          do
            o2 = this.reader.cstring(), o2 && s2.mechanisms.push(o2);
          while (o2);
          break;
        case 11:
          s2.name = "authenticationSASLContinue", s2.data = this.reader.string(t2 - 8);
          break;
        case 12:
          s2.name = "authenticationSASLFinal", s2.data = this.reader.string(t2 - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + i2);
      }
      return s2;
    }
    parseErrorMessage(e2, t2, n2, i2) {
      this.reader.setBuffer(e2, n2);
      let s2 = {}, o2 = this.reader.string(1);
      for (; o2 !== "\0"; )
        s2[o2] = this.reader.cstring(), o2 = this.reader.string(1);
      let u2 = s2.M, c2 = i2 === "notice" ? new D2.NoticeMessage(
        t2,
        u2
      ) : new D2.DatabaseError(u2, t2, i2);
      return c2.severity = s2.S, c2.code = s2.C, c2.detail = s2.D, c2.hint = s2.H, c2.position = s2.P, c2.internalPosition = s2.p, c2.internalQuery = s2.q, c2.where = s2.W, c2.schema = s2.s, c2.table = s2.t, c2.column = s2.c, c2.dataType = s2.d, c2.constraint = s2.n, c2.file = s2.F, c2.line = s2.L, c2.routine = s2.R, c2;
    }
  }, "on");
  a(on, "Parser");
  var sn = on;
  Et.Parser = sn;
});
var an = I((Se) => {
  "use strict";
  p();
  Object.defineProperty(Se, "__esModule", { value: true });
  Se.DatabaseError = Se.serialize = Se.parse = void 0;
  var ac2 = Yr();
  Object.defineProperty(
    Se,
    "DatabaseError",
    { enumerable: true, get: a(function() {
      return ac2.DatabaseError;
    }, "get") }
  );
  var uc = ws();
  Object.defineProperty(Se, "serialize", { enumerable: true, get: a(function() {
    return uc.serialize;
  }, "get") });
  var cc2 = vs();
  function hc(r2, e2) {
    let t2 = new cc2.Parser();
    return r2.on("data", (n2) => t2.parse(n2, e2)), new Promise((n2) => r2.on("end", () => n2()));
  }
  __name(hc, "hc");
  a(hc, "parse");
  Se.parse = hc;
});
var Es = {};
ie(Es, { connect: () => lc });
function lc({ socket: r2, servername: e2 }) {
  return r2.startTls(e2), r2;
}
__name(lc, "lc");
var _s = z(() => {
  "use strict";
  p();
  a(lc, "connect");
});
var hn = I((tf, Ts) => {
  "use strict";
  p();
  var As = (wt(), N(ys)), fc = we().EventEmitter, {
    parse: pc,
    serialize: Q2
  } = an(), Cs = Q2.flush(), dc = Q2.sync(), yc = Q2.end(), cn2 = /* @__PURE__ */ __name(class cn extends fc {
    constructor(e2) {
      super(), e2 = e2 || {}, this.stream = e2.stream || new As.Socket(), this._keepAlive = e2.keepAlive, this._keepAliveInitialDelayMillis = e2.keepAliveInitialDelayMillis, this.lastBuffer = false, this.parsedStatements = {}, this.ssl = e2.ssl || false, this._ending = false, this._emitMessage = false;
      var t2 = this;
      this.on("newListener", function(n2) {
        n2 === "message" && (t2._emitMessage = true);
      });
    }
    connect(e2, t2) {
      var n2 = this;
      this._connecting = true, this.stream.setNoDelay(true), this.stream.connect(
        e2,
        t2
      ), this.stream.once("connect", function() {
        n2._keepAlive && n2.stream.setKeepAlive(
          true,
          n2._keepAliveInitialDelayMillis
        ), n2.emit("connect");
      });
      let i2 = a(function(s2) {
        n2._ending && (s2.code === "ECONNRESET" || s2.code === "EPIPE") || n2.emit("error", s2);
      }, "reportStreamError");
      if (this.stream.on("error", i2), this.stream.on("close", function() {
        n2.emit("end");
      }), !this.ssl)
        return this.attachListeners(this.stream);
      this.stream.once("data", function(s2) {
        var o2 = s2.toString("utf8");
        switch (o2) {
          case "S":
            break;
          case "N":
            return n2.stream.end(), n2.emit("error", new Error("The server does not support SSL connections"));
          default:
            return n2.stream.end(), n2.emit("error", new Error("There was an error establishing an SSL connection"));
        }
        var u2 = (_s(), N(Es));
        let c2 = { socket: n2.stream };
        n2.ssl !== true && (Object.assign(
          c2,
          n2.ssl
        ), "key" in n2.ssl && (c2.key = n2.ssl.key)), As.isIP(t2) === 0 && (c2.servername = t2);
        try {
          n2.stream = u2.connect(c2);
        } catch (h2) {
          return n2.emit("error", h2);
        }
        n2.attachListeners(n2.stream), n2.stream.on("error", i2), n2.emit("sslconnect");
      });
    }
    attachListeners(e2) {
      e2.on("end", () => {
        this.emit("end");
      }), pc(e2, (t2) => {
        var n2 = t2.name === "error" ? "errorMessage" : t2.name;
        this._emitMessage && this.emit("message", t2), this.emit(n2, t2);
      });
    }
    requestSsl() {
      this.stream.write(Q2.requestSsl());
    }
    startup(e2) {
      this.stream.write(Q2.startup(e2));
    }
    cancel(e2, t2) {
      this._send(Q2.cancel(e2, t2));
    }
    password(e2) {
      this._send(Q2.password(e2));
    }
    sendSASLInitialResponseMessage(e2, t2) {
      this._send(Q2.sendSASLInitialResponseMessage(
        e2,
        t2
      ));
    }
    sendSCRAMClientFinalMessage(e2) {
      this._send(Q2.sendSCRAMClientFinalMessage(e2));
    }
    _send(e2) {
      return this.stream.writable ? this.stream.write(e2) : false;
    }
    query(e2) {
      this._send(Q2.query(
        e2
      ));
    }
    parse(e2) {
      this._send(Q2.parse(e2));
    }
    bind(e2) {
      this._send(Q2.bind(e2));
    }
    execute(e2) {
      this._send(Q2.execute(e2));
    }
    flush() {
      this.stream.writable && this.stream.write(Cs);
    }
    sync() {
      this._ending = true, this._send(Cs), this._send(dc);
    }
    ref() {
      this.stream.ref();
    }
    unref() {
      this.stream.unref();
    }
    end() {
      if (this._ending = true, !this._connecting || !this.stream.writable) {
        this.stream.end();
        return;
      }
      return this.stream.write(yc, () => {
        this.stream.end();
      });
    }
    close(e2) {
      this._send(Q2.close(e2));
    }
    describe(e2) {
      this._send(Q2.describe(e2));
    }
    sendCopyFromChunk(e2) {
      this._send(Q2.copyData(e2));
    }
    endCopyFrom() {
      this._send(Q2.copyDone());
    }
    sendCopyFail(e2) {
      this._send(Q2.copyFail(e2));
    }
  }, "cn");
  a(cn2, "Connection");
  var un = cn2;
  Ts.exports = un;
});
var Bs = I((of, Ps) => {
  "use strict";
  p();
  var mc = we().EventEmitter, sf = (He(), N(je)), gc = et(), ln = qi(), wc = Zi(), bc2 = mt(), Sc = gt(), Is = ps(), xc = Xe(), vc = hn(), fn = /* @__PURE__ */ __name(class fn extends mc {
    constructor(e2) {
      super(), this.connectionParameters = new Sc(e2), this.user = this.connectionParameters.user, this.database = this.connectionParameters.database, this.port = this.connectionParameters.port, this.host = this.connectionParameters.host, Object.defineProperty(this, "password", { configurable: true, enumerable: false, writable: true, value: this.connectionParameters.password }), this.replication = this.connectionParameters.replication;
      var t2 = e2 || {};
      this._Promise = t2.Promise || S.Promise, this._types = new bc2(t2.types), this._ending = false, this._connecting = false, this._connected = false, this._connectionError = false, this._queryable = true, this.connection = t2.connection || new vc({ stream: t2.stream, ssl: this.connectionParameters.ssl, keepAlive: t2.keepAlive || false, keepAliveInitialDelayMillis: t2.keepAliveInitialDelayMillis || 0, encoding: this.connectionParameters.client_encoding || "utf8" }), this.queryQueue = [], this.binary = t2.binary || xc.binary, this.processID = null, this.secretKey = null, this.ssl = this.connectionParameters.ssl || false, this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: false }), this._connectionTimeoutMillis = t2.connectionTimeoutMillis || 0;
    }
    _errorAllQueries(e2) {
      let t2 = a(
        (n2) => {
          m.nextTick(() => {
            n2.handleError(e2, this.connection);
          });
        },
        "enqueueError"
      );
      this.activeQuery && (t2(this.activeQuery), this.activeQuery = null), this.queryQueue.forEach(t2), this.queryQueue.length = 0;
    }
    _connect(e2) {
      var t2 = this, n2 = this.connection;
      if (this._connectionCallback = e2, this._connecting || this._connected) {
        let i2 = new Error("Client has already been connected. You cannot reuse a client.");
        m.nextTick(() => {
          e2(i2);
        });
        return;
      }
      this._connecting = true, this.connectionTimeoutHandle, this._connectionTimeoutMillis > 0 && (this.connectionTimeoutHandle = setTimeout(() => {
        n2._ending = true, n2.stream.destroy(new Error("timeout expired"));
      }, this._connectionTimeoutMillis)), this.host && this.host.indexOf("/") === 0 ? n2.connect(this.host + "/.s.PGSQL." + this.port) : n2.connect(this.port, this.host), n2.on("connect", function() {
        t2.ssl ? n2.requestSsl() : n2.startup(t2.getStartupConf());
      }), n2.on("sslconnect", function() {
        n2.startup(t2.getStartupConf());
      }), this._attachListeners(n2), n2.once("end", () => {
        let i2 = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
        clearTimeout(this.connectionTimeoutHandle), this._errorAllQueries(i2), this._ending || (this._connecting && !this._connectionError ? this._connectionCallback ? this._connectionCallback(i2) : this._handleErrorEvent(i2) : this._connectionError || this._handleErrorEvent(
          i2
        )), m.nextTick(() => {
          this.emit("end");
        });
      });
    }
    connect(e2) {
      if (e2) {
        this._connect(e2);
        return;
      }
      return new this._Promise((t2, n2) => {
        this._connect((i2) => {
          i2 ? n2(i2) : t2();
        });
      });
    }
    _attachListeners(e2) {
      e2.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this)), e2.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this)), e2.on("authenticationSASL", this._handleAuthSASL.bind(this)), e2.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this)), e2.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this)), e2.on("backendKeyData", this._handleBackendKeyData.bind(this)), e2.on("error", this._handleErrorEvent.bind(this)), e2.on(
        "errorMessage",
        this._handleErrorMessage.bind(this)
      ), e2.on("readyForQuery", this._handleReadyForQuery.bind(this)), e2.on("notice", this._handleNotice.bind(this)), e2.on("rowDescription", this._handleRowDescription.bind(this)), e2.on("dataRow", this._handleDataRow.bind(this)), e2.on("portalSuspended", this._handlePortalSuspended.bind(this)), e2.on(
        "emptyQuery",
        this._handleEmptyQuery.bind(this)
      ), e2.on("commandComplete", this._handleCommandComplete.bind(this)), e2.on("parseComplete", this._handleParseComplete.bind(this)), e2.on("copyInResponse", this._handleCopyInResponse.bind(this)), e2.on("copyData", this._handleCopyData.bind(this)), e2.on("notification", this._handleNotification.bind(this));
    }
    _checkPgPass(e2) {
      let t2 = this.connection;
      typeof this.password == "function" ? this._Promise.resolve().then(
        () => this.password()
      ).then((n2) => {
        if (n2 !== void 0) {
          if (typeof n2 != "string") {
            t2.emit("error", new TypeError("Password must be a string"));
            return;
          }
          this.connectionParameters.password = this.password = n2;
        } else
          this.connectionParameters.password = this.password = null;
        e2();
      }).catch((n2) => {
        t2.emit("error", n2);
      }) : this.password !== null ? e2() : wc(
        this.connectionParameters,
        (n2) => {
          n2 !== void 0 && (this.connectionParameters.password = this.password = n2), e2();
        }
      );
    }
    _handleAuthCleartextPassword(e2) {
      this._checkPgPass(() => {
        this.connection.password(this.password);
      });
    }
    _handleAuthMD5Password(e2) {
      this._checkPgPass(() => {
        let t2 = gc.postgresMd5PasswordHash(
          this.user,
          this.password,
          e2.salt
        );
        this.connection.password(t2);
      });
    }
    _handleAuthSASL(e2) {
      this._checkPgPass(() => {
        this.saslSession = ln.startSession(e2.mechanisms), this.connection.sendSASLInitialResponseMessage(
          this.saslSession.mechanism,
          this.saslSession.response
        );
      });
    }
    _handleAuthSASLContinue(e2) {
      ln.continueSession(this.saslSession, this.password, e2.data), this.connection.sendSCRAMClientFinalMessage(
        this.saslSession.response
      );
    }
    _handleAuthSASLFinal(e2) {
      ln.finalizeSession(
        this.saslSession,
        e2.data
      ), this.saslSession = null;
    }
    _handleBackendKeyData(e2) {
      this.processID = e2.processID, this.secretKey = e2.secretKey;
    }
    _handleReadyForQuery(e2) {
      this._connecting && (this._connecting = false, this._connected = true, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback && (this._connectionCallback(null, this), this._connectionCallback = null), this.emit("connect"));
      let { activeQuery: t2 } = this;
      this.activeQuery = null, this.readyForQuery = true, t2 && t2.handleReadyForQuery(this.connection), this._pulseQueryQueue();
    }
    _handleErrorWhileConnecting(e2) {
      if (!this._connectionError) {
        if (this._connectionError = true, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback)
          return this._connectionCallback(e2);
        this.emit("error", e2);
      }
    }
    _handleErrorEvent(e2) {
      if (this._connecting)
        return this._handleErrorWhileConnecting(e2);
      this._queryable = false, this._errorAllQueries(e2), this.emit("error", e2);
    }
    _handleErrorMessage(e2) {
      if (this._connecting)
        return this._handleErrorWhileConnecting(e2);
      let t2 = this.activeQuery;
      if (!t2) {
        this._handleErrorEvent(
          e2
        );
        return;
      }
      this.activeQuery = null, t2.handleError(e2, this.connection);
    }
    _handleRowDescription(e2) {
      this.activeQuery.handleRowDescription(e2);
    }
    _handleDataRow(e2) {
      this.activeQuery.handleDataRow(
        e2
      );
    }
    _handlePortalSuspended(e2) {
      this.activeQuery.handlePortalSuspended(this.connection);
    }
    _handleEmptyQuery(e2) {
      this.activeQuery.handleEmptyQuery(this.connection);
    }
    _handleCommandComplete(e2) {
      this.activeQuery.handleCommandComplete(e2, this.connection);
    }
    _handleParseComplete(e2) {
      this.activeQuery.name && (this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text);
    }
    _handleCopyInResponse(e2) {
      this.activeQuery.handleCopyInResponse(
        this.connection
      );
    }
    _handleCopyData(e2) {
      this.activeQuery.handleCopyData(e2, this.connection);
    }
    _handleNotification(e2) {
      this.emit("notification", e2);
    }
    _handleNotice(e2) {
      this.emit("notice", e2);
    }
    getStartupConf() {
      var e2 = this.connectionParameters, t2 = { user: e2.user, database: e2.database }, n2 = e2.application_name || e2.fallback_application_name;
      return n2 && (t2.application_name = n2), e2.replication && (t2.replication = "" + e2.replication), e2.statement_timeout && (t2.statement_timeout = String(parseInt(
        e2.statement_timeout,
        10
      ))), e2.lock_timeout && (t2.lock_timeout = String(parseInt(e2.lock_timeout, 10))), e2.idle_in_transaction_session_timeout && (t2.idle_in_transaction_session_timeout = String(parseInt(
        e2.idle_in_transaction_session_timeout,
        10
      ))), e2.options && (t2.options = e2.options), t2;
    }
    cancel(e2, t2) {
      if (e2.activeQuery === t2) {
        var n2 = this.connection;
        this.host && this.host.indexOf("/") === 0 ? n2.connect(this.host + "/.s.PGSQL." + this.port) : n2.connect(this.port, this.host), n2.on("connect", function() {
          n2.cancel(
            e2.processID,
            e2.secretKey
          );
        });
      } else
        e2.queryQueue.indexOf(t2) !== -1 && e2.queryQueue.splice(e2.queryQueue.indexOf(t2), 1);
    }
    setTypeParser(e2, t2, n2) {
      return this._types.setTypeParser(e2, t2, n2);
    }
    getTypeParser(e2, t2) {
      return this._types.getTypeParser(e2, t2);
    }
    escapeIdentifier(e2) {
      return '"' + e2.replace(
        /"/g,
        '""'
      ) + '"';
    }
    escapeLiteral(e2) {
      for (var t2 = false, n2 = "'", i2 = 0; i2 < e2.length; i2++) {
        var s2 = e2[i2];
        s2 === "'" ? n2 += s2 + s2 : s2 === "\\" ? (n2 += s2 + s2, t2 = true) : n2 += s2;
      }
      return n2 += "'", t2 === true && (n2 = " E" + n2), n2;
    }
    _pulseQueryQueue() {
      if (this.readyForQuery === true)
        if (this.activeQuery = this.queryQueue.shift(), this.activeQuery) {
          this.readyForQuery = false, this.hasExecuted = true;
          let e2 = this.activeQuery.submit(this.connection);
          e2 && m.nextTick(() => {
            this.activeQuery.handleError(e2, this.connection), this.readyForQuery = true, this._pulseQueryQueue();
          });
        } else
          this.hasExecuted && (this.activeQuery = null, this.emit("drain"));
    }
    query(e2, t2, n2) {
      var i2, s2, o2, u2, c2;
      if (e2 == null)
        throw new TypeError("Client was passed a null or undefined query");
      return typeof e2.submit == "function" ? (o2 = e2.query_timeout || this.connectionParameters.query_timeout, s2 = i2 = e2, typeof t2 == "function" && (i2.callback = i2.callback || t2)) : (o2 = this.connectionParameters.query_timeout, i2 = new Is(
        e2,
        t2,
        n2
      ), i2.callback || (s2 = new this._Promise((h2, l2) => {
        i2.callback = (d2, b2) => d2 ? l2(d2) : h2(b2);
      }))), o2 && (c2 = i2.callback, u2 = setTimeout(() => {
        var h2 = new Error("Query read timeout");
        m.nextTick(
          () => {
            i2.handleError(h2, this.connection);
          }
        ), c2(h2), i2.callback = () => {
        };
        var l2 = this.queryQueue.indexOf(i2);
        l2 > -1 && this.queryQueue.splice(l2, 1), this._pulseQueryQueue();
      }, o2), i2.callback = (h2, l2) => {
        clearTimeout(u2), c2(h2, l2);
      }), this.binary && !i2.binary && (i2.binary = true), i2._result && !i2._result._types && (i2._result._types = this._types), this._queryable ? this._ending ? (m.nextTick(() => {
        i2.handleError(
          new Error("Client was closed and is not queryable"),
          this.connection
        );
      }), s2) : (this.queryQueue.push(i2), this._pulseQueryQueue(), s2) : (m.nextTick(
        () => {
          i2.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
        }
      ), s2);
    }
    ref() {
      this.connection.ref();
    }
    unref() {
      this.connection.unref();
    }
    end(e2) {
      if (this._ending = true, !this.connection._connecting)
        if (e2)
          e2();
        else
          return this._Promise.resolve();
      if (this.activeQuery || !this._queryable ? this.connection.stream.destroy() : this.connection.end(), e2)
        this.connection.once("end", e2);
      else
        return new this._Promise((t2) => {
          this.connection.once("end", t2);
        });
    }
  }, "fn");
  a(fn, "Client");
  var _t = fn;
  _t.Query = Is;
  Ps.exports = _t;
});
var Ms = I((cf2, Fs) => {
  "use strict";
  p();
  var Ec = we().EventEmitter, Ls = a(function() {
  }, "NOOP"), Rs = a(
    (r2, e2) => {
      let t2 = r2.findIndex(e2);
      return t2 === -1 ? void 0 : r2.splice(t2, 1)[0];
    },
    "removeWhere"
  ), yn = /* @__PURE__ */ __name(class yn {
    constructor(e2, t2, n2) {
      this.client = e2, this.idleListener = t2, this.timeoutId = n2;
    }
  }, "yn");
  a(yn, "IdleItem");
  var pn = yn, mn = /* @__PURE__ */ __name(class mn {
    constructor(e2) {
      this.callback = e2;
    }
  }, "mn");
  a(mn, "PendingItem");
  var Ne = mn;
  function _c2() {
    throw new Error("Release called on client which has already been released to the pool.");
  }
  __name(_c2, "_c");
  a(_c2, "throwOnDoubleRelease");
  function At(r2, e2) {
    if (e2)
      return { callback: e2, result: void 0 };
    let t2, n2, i2 = a(function(o2, u2) {
      o2 ? t2(o2) : n2(u2);
    }, "cb"), s2 = new r2(function(o2, u2) {
      n2 = o2, t2 = u2;
    }).catch((o2) => {
      throw Error.captureStackTrace(
        o2
      ), o2;
    });
    return { callback: i2, result: s2 };
  }
  __name(At, "At");
  a(At, "promisify");
  function Ac(r2, e2) {
    return a(
      /* @__PURE__ */ __name(function t2(n2) {
        n2.client = e2, e2.removeListener("error", t2), e2.on("error", () => {
          r2.log("additional client error after disconnection due to error", n2);
        }), r2._remove(e2), r2.emit("error", n2, e2);
      }, "t"),
      "idleListener"
    );
  }
  __name(Ac, "Ac");
  a(Ac, "makeIdleListener");
  var gn = /* @__PURE__ */ __name(class gn extends Ec {
    constructor(e2, t2) {
      super(), this.options = Object.assign({}, e2), e2 != null && "password" in e2 && Object.defineProperty(
        this.options,
        "password",
        { configurable: true, enumerable: false, writable: true, value: e2.password }
      ), e2 != null && e2.ssl && e2.ssl.key && Object.defineProperty(this.options.ssl, "key", { enumerable: false }), this.options.max = this.options.max || this.options.poolSize || 10, this.options.maxUses = this.options.maxUses || 1 / 0, this.options.allowExitOnIdle = this.options.allowExitOnIdle || false, this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0, this.log = this.options.log || function() {
      }, this.Client = this.options.Client || t2 || Ct().Client, this.Promise = this.options.Promise || S.Promise, typeof this.options.idleTimeoutMillis > "u" && (this.options.idleTimeoutMillis = 1e4), this._clients = [], this._idle = [], this._expired = /* @__PURE__ */ new WeakSet(), this._pendingQueue = [], this._endCallback = void 0, this.ending = false, this.ended = false;
    }
    _isFull() {
      return this._clients.length >= this.options.max;
    }
    _pulseQueue() {
      if (this.log("pulse queue"), this.ended) {
        this.log("pulse queue ended");
        return;
      }
      if (this.ending) {
        this.log(
          "pulse queue on ending"
        ), this._idle.length && this._idle.slice().map((t2) => {
          this._remove(
            t2.client
          );
        }), this._clients.length || (this.ended = true, this._endCallback());
        return;
      }
      if (!this._pendingQueue.length) {
        this.log("no queued requests");
        return;
      }
      if (!this._idle.length && this._isFull())
        return;
      let e2 = this._pendingQueue.shift();
      if (this._idle.length) {
        let t2 = this._idle.pop();
        clearTimeout(t2.timeoutId);
        let n2 = t2.client;
        n2.ref && n2.ref();
        let i2 = t2.idleListener;
        return this._acquireClient(n2, e2, i2, false);
      }
      if (!this._isFull())
        return this.newClient(e2);
      throw new Error("unexpected condition");
    }
    _remove(e2) {
      let t2 = Rs(this._idle, (n2) => n2.client === e2);
      t2 !== void 0 && clearTimeout(t2.timeoutId), this._clients = this._clients.filter((n2) => n2 !== e2), e2.end(), this.emit("remove", e2);
    }
    connect(e2) {
      if (this.ending) {
        let i2 = new Error("Cannot use a pool after calling end on the pool");
        return e2 ? e2(i2) : this.Promise.reject(
          i2
        );
      }
      let t2 = At(this.Promise, e2), n2 = t2.result;
      if (this._isFull() || this._idle.length) {
        if (this._idle.length && m.nextTick(() => this._pulseQueue()), !this.options.connectionTimeoutMillis)
          return this._pendingQueue.push(new Ne(t2.callback)), n2;
        let i2 = a((u2, c2, h2) => {
          clearTimeout(
            o2
          ), t2.callback(u2, c2, h2);
        }, "queueCallback"), s2 = new Ne(i2), o2 = setTimeout(() => {
          Rs(
            this._pendingQueue,
            (u2) => u2.callback === i2
          ), s2.timedOut = true, t2.callback(new Error("timeout exceeded when trying to connect"));
        }, this.options.connectionTimeoutMillis);
        return this._pendingQueue.push(s2), n2;
      }
      return this.newClient(new Ne(t2.callback)), n2;
    }
    newClient(e2) {
      let t2 = new this.Client(this.options);
      this._clients.push(t2);
      let n2 = Ac(this, t2);
      this.log("checking client timeout");
      let i2, s2 = false;
      this.options.connectionTimeoutMillis && (i2 = setTimeout(() => {
        this.log("ending client due to timeout"), s2 = true, t2.connection ? t2.connection.stream.destroy() : t2.end();
      }, this.options.connectionTimeoutMillis)), this.log("connecting new client"), t2.connect((o2) => {
        if (i2 && clearTimeout(i2), t2.on("error", n2), o2)
          this.log("client failed to connect", o2), this._clients = this._clients.filter((u2) => u2 !== t2), s2 && (o2.message = "Connection terminated due to connection timeout"), this._pulseQueue(), e2.timedOut || e2.callback(
            o2,
            void 0,
            Ls
          );
        else {
          if (this.log("new client connected"), this.options.maxLifetimeSeconds !== 0) {
            let u2 = setTimeout(() => {
              this.log("ending client due to expired lifetime"), this._expired.add(t2), this._idle.findIndex((h2) => h2.client === t2) !== -1 && this._acquireClient(
                t2,
                new Ne((h2, l2, d2) => d2()),
                n2,
                false
              );
            }, this.options.maxLifetimeSeconds * 1e3);
            u2.unref(), t2.once(
              "end",
              () => clearTimeout(u2)
            );
          }
          return this._acquireClient(t2, e2, n2, true);
        }
      });
    }
    _acquireClient(e2, t2, n2, i2) {
      i2 && this.emit("connect", e2), this.emit("acquire", e2), e2.release = this._releaseOnce(e2, n2), e2.removeListener("error", n2), t2.timedOut ? i2 && this.options.verify ? this.options.verify(
        e2,
        e2.release
      ) : e2.release() : i2 && this.options.verify ? this.options.verify(e2, (s2) => {
        if (s2)
          return e2.release(s2), t2.callback(s2, void 0, Ls);
        t2.callback(void 0, e2, e2.release);
      }) : t2.callback(
        void 0,
        e2,
        e2.release
      );
    }
    _releaseOnce(e2, t2) {
      let n2 = false;
      return (i2) => {
        n2 && _c2(), n2 = true, this._release(
          e2,
          t2,
          i2
        );
      };
    }
    _release(e2, t2, n2) {
      if (e2.on("error", t2), e2._poolUseCount = (e2._poolUseCount || 0) + 1, this.emit("release", n2, e2), n2 || this.ending || !e2._queryable || e2._ending || e2._poolUseCount >= this.options.maxUses) {
        e2._poolUseCount >= this.options.maxUses && this.log("remove expended client"), this._remove(e2), this._pulseQueue();
        return;
      }
      if (this._expired.has(e2)) {
        this.log("remove expired client"), this._expired.delete(e2), this._remove(e2), this._pulseQueue();
        return;
      }
      let s2;
      this.options.idleTimeoutMillis && (s2 = setTimeout(() => {
        this.log("remove idle client"), this._remove(e2);
      }, this.options.idleTimeoutMillis), this.options.allowExitOnIdle && s2.unref()), this.options.allowExitOnIdle && e2.unref(), this._idle.push(new pn(e2, t2, s2)), this._pulseQueue();
    }
    query(e2, t2, n2) {
      if (typeof e2 == "function") {
        let s2 = At(this.Promise, e2);
        return x(function() {
          return s2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
        }), s2.result;
      }
      typeof t2 == "function" && (n2 = t2, t2 = void 0);
      let i2 = At(this.Promise, n2);
      return n2 = i2.callback, this.connect((s2, o2) => {
        if (s2)
          return n2(s2);
        let u2 = false, c2 = a((h2) => {
          u2 || (u2 = true, o2.release(h2), n2(h2));
        }, "onError");
        o2.once("error", c2), this.log("dispatching query");
        try {
          o2.query(e2, t2, (h2, l2) => {
            if (this.log("query dispatched"), o2.removeListener("error", c2), !u2)
              return u2 = true, o2.release(h2), h2 ? n2(h2) : n2(
                void 0,
                l2
              );
          });
        } catch (h2) {
          return o2.release(h2), n2(h2);
        }
      }), i2.result;
    }
    end(e2) {
      if (this.log("ending"), this.ending) {
        let n2 = new Error("Called end on pool more than once");
        return e2 ? e2(n2) : this.Promise.reject(n2);
      }
      this.ending = true;
      let t2 = At(this.Promise, e2);
      return this._endCallback = t2.callback, this._pulseQueue(), t2.result;
    }
    get waitingCount() {
      return this._pendingQueue.length;
    }
    get idleCount() {
      return this._idle.length;
    }
    get expiredCount() {
      return this._clients.reduce((e2, t2) => e2 + (this._expired.has(t2) ? 1 : 0), 0);
    }
    get totalCount() {
      return this._clients.length;
    }
  }, "gn");
  a(gn, "Pool");
  var dn = gn;
  Fs.exports = dn;
});
var Ds = {};
ie(Ds, { default: () => Cc });
var Cc;
var ks = z(() => {
  "use strict";
  p();
  Cc = {};
});
var Us = I((pf, Tc) => {
  Tc.exports = { name: "pg", version: "8.8.0", description: "PostgreSQL client - pure javascript & libpq with the same API", keywords: [
    "database",
    "libpq",
    "pg",
    "postgre",
    "postgres",
    "postgresql",
    "rdbms"
  ], homepage: "https://github.com/brianc/node-postgres", repository: { type: "git", url: "git://github.com/brianc/node-postgres.git", directory: "packages/pg" }, author: "Brian Carlson <brian.m.carlson@gmail.com>", main: "./lib", dependencies: {
    "buffer-writer": "2.0.0",
    "packet-reader": "1.0.0",
    "pg-connection-string": "^2.5.0",
    "pg-pool": "^3.5.2",
    "pg-protocol": "^1.5.0",
    "pg-types": "^2.1.0",
    pgpass: "1.x"
  }, devDependencies: { async: "2.6.4", bluebird: "3.5.2", co: "4.6.0", "pg-copy-streams": "0.3.0" }, peerDependencies: { "pg-native": ">=3.0.1" }, peerDependenciesMeta: {
    "pg-native": { optional: true }
  }, scripts: { test: "make test-all" }, files: ["lib", "SPONSORS.md"], license: "MIT", engines: { node: ">= 8.0.0" }, gitHead: "c99fb2c127ddf8d712500db2c7b9a5491a178655" };
});
var qs = I((df, Ns) => {
  "use strict";
  p();
  var Os = we().EventEmitter, Ic = (He(), N(je)), wn = et(), qe = Ns.exports = function(r2, e2, t2) {
    Os.call(this), r2 = wn.normalizeQueryConfig(r2, e2, t2), this.text = r2.text, this.values = r2.values, this.name = r2.name, this.callback = r2.callback, this.state = "new", this._arrayMode = r2.rowMode === "array", this._emitRowEvents = false, this.on("newListener", function(n2) {
      n2 === "row" && (this._emitRowEvents = true);
    }.bind(this));
  };
  Ic.inherits(
    qe,
    Os
  );
  var Pc = { sqlState: "code", statementPosition: "position", messagePrimary: "message", context: "where", schemaName: "schema", tableName: "table", columnName: "column", dataTypeName: "dataType", constraintName: "constraint", sourceFile: "file", sourceLine: "line", sourceFunction: "routine" };
  qe.prototype.handleError = function(r2) {
    var e2 = this.native.pq.resultErrorFields();
    if (e2)
      for (var t2 in e2) {
        var n2 = Pc[t2] || t2;
        r2[n2] = e2[t2];
      }
    this.callback ? this.callback(r2) : this.emit("error", r2), this.state = "error";
  };
  qe.prototype.then = function(r2, e2) {
    return this._getPromise().then(r2, e2);
  };
  qe.prototype.catch = function(r2) {
    return this._getPromise().catch(r2);
  };
  qe.prototype._getPromise = function() {
    return this._promise ? this._promise : (this._promise = new Promise(function(r2, e2) {
      this._once("end", r2), this._once(
        "error",
        e2
      );
    }.bind(this)), this._promise);
  };
  qe.prototype.submit = function(r2) {
    this.state = "running";
    var e2 = this;
    this.native = r2.native, r2.native.arrayMode = this._arrayMode;
    var t2 = a(
      function(s2, o2, u2) {
        if (r2.native.arrayMode = false, x(function() {
          e2.emit("_done");
        }), s2)
          return e2.handleError(s2);
        e2._emitRowEvents && (u2.length > 1 ? o2.forEach((c2, h2) => {
          c2.forEach((l2) => {
            e2.emit(
              "row",
              l2,
              u2[h2]
            );
          });
        }) : o2.forEach(function(c2) {
          e2.emit("row", c2, u2);
        })), e2.state = "end", e2.emit(
          "end",
          u2
        ), e2.callback && e2.callback(null, u2);
      },
      "after"
    );
    if (m.domain && (t2 = m.domain.bind(
      t2
    )), this.name) {
      this.name.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error(
        "You supplied %s (%s)",
        this.name,
        this.name.length
      ), console.error("This can cause conflicts and silent errors executing queries"));
      var n2 = (this.values || []).map(wn.prepareValue);
      if (r2.namedQueries[this.name]) {
        if (this.text && r2.namedQueries[this.name] !== this.text) {
          let s2 = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
          return t2(s2);
        }
        return r2.native.execute(this.name, n2, t2);
      }
      return r2.native.prepare(
        this.name,
        this.text,
        n2.length,
        function(s2) {
          return s2 ? t2(s2) : (r2.namedQueries[e2.name] = e2.text, e2.native.execute(e2.name, n2, t2));
        }
      );
    } else if (this.values) {
      if (!Array.isArray(this.values)) {
        let s2 = new Error("Query values must be an array");
        return t2(s2);
      }
      var i2 = this.values.map(wn.prepareValue);
      r2.native.query(this.text, i2, t2);
    } else
      r2.native.query(this.text, t2);
  };
});
var Hs = I((wf, js) => {
  "use strict";
  p();
  var Bc = (ks(), N(Ds)), Lc = mt(), gf = Us(), Qs = we().EventEmitter, Rc = (He(), N(je)), Fc = gt(), Ws = qs(), J2 = js.exports = function(r2) {
    Qs.call(this), r2 = r2 || {}, this._Promise = r2.Promise || S.Promise, this._types = new Lc(r2.types), this.native = new Bc({ types: this._types }), this._queryQueue = [], this._ending = false, this._connecting = false, this._connected = false, this._queryable = true;
    var e2 = this.connectionParameters = new Fc(
      r2
    );
    this.user = e2.user, Object.defineProperty(this, "password", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: e2.password
    }), this.database = e2.database, this.host = e2.host, this.port = e2.port, this.namedQueries = {};
  };
  J2.Query = Ws;
  Rc.inherits(J2, Qs);
  J2.prototype._errorAllQueries = function(r2) {
    let e2 = a(
      (t2) => {
        m.nextTick(() => {
          t2.native = this.native, t2.handleError(r2);
        });
      },
      "enqueueError"
    );
    this._hasActiveQuery() && (e2(this._activeQuery), this._activeQuery = null), this._queryQueue.forEach(e2), this._queryQueue.length = 0;
  };
  J2.prototype._connect = function(r2) {
    var e2 = this;
    if (this._connecting) {
      m.nextTick(() => r2(new Error("Client has already been connected. You cannot reuse a client.")));
      return;
    }
    this._connecting = true, this.connectionParameters.getLibpqConnectionString(function(t2, n2) {
      if (t2)
        return r2(
          t2
        );
      e2.native.connect(n2, function(i2) {
        if (i2)
          return e2.native.end(), r2(i2);
        e2._connected = true, e2.native.on("error", function(s2) {
          e2._queryable = false, e2._errorAllQueries(s2), e2.emit("error", s2);
        }), e2.native.on("notification", function(s2) {
          e2.emit("notification", { channel: s2.relname, payload: s2.extra });
        }), e2.emit("connect"), e2._pulseQueryQueue(true), r2();
      });
    });
  };
  J2.prototype.connect = function(r2) {
    if (r2) {
      this._connect(r2);
      return;
    }
    return new this._Promise(
      (e2, t2) => {
        this._connect((n2) => {
          n2 ? t2(n2) : e2();
        });
      }
    );
  };
  J2.prototype.query = function(r2, e2, t2) {
    var n2, i2, s2, o2, u2;
    if (r2 == null)
      throw new TypeError("Client was passed a null or undefined query");
    if (typeof r2.submit == "function")
      s2 = r2.query_timeout || this.connectionParameters.query_timeout, i2 = n2 = r2, typeof e2 == "function" && (r2.callback = e2);
    else if (s2 = this.connectionParameters.query_timeout, n2 = new Ws(r2, e2, t2), !n2.callback) {
      let c2, h2;
      i2 = new this._Promise((l2, d2) => {
        c2 = l2, h2 = d2;
      }), n2.callback = (l2, d2) => l2 ? h2(l2) : c2(d2);
    }
    return s2 && (u2 = n2.callback, o2 = setTimeout(() => {
      var c2 = new Error("Query read timeout");
      m.nextTick(() => {
        n2.handleError(c2, this.connection);
      }), u2(c2), n2.callback = () => {
      };
      var h2 = this._queryQueue.indexOf(n2);
      h2 > -1 && this._queryQueue.splice(h2, 1), this._pulseQueryQueue();
    }, s2), n2.callback = (c2, h2) => {
      clearTimeout(o2), u2(c2, h2);
    }), this._queryable ? this._ending ? (n2.native = this.native, m.nextTick(() => {
      n2.handleError(
        new Error("Client was closed and is not queryable")
      );
    }), i2) : (this._queryQueue.push(
      n2
    ), this._pulseQueryQueue(), i2) : (n2.native = this.native, m.nextTick(() => {
      n2.handleError(
        new Error("Client has encountered a connection error and is not queryable")
      );
    }), i2);
  };
  J2.prototype.end = function(r2) {
    var e2 = this;
    this._ending = true, this._connected || this.once(
      "connect",
      this.end.bind(this, r2)
    );
    var t2;
    return r2 || (t2 = new this._Promise(function(n2, i2) {
      r2 = a((s2) => s2 ? i2(s2) : n2(), "cb");
    })), this.native.end(function() {
      e2._errorAllQueries(new Error(
        "Connection terminated"
      )), m.nextTick(() => {
        e2.emit("end"), r2 && r2();
      });
    }), t2;
  };
  J2.prototype._hasActiveQuery = function() {
    return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
  };
  J2.prototype._pulseQueryQueue = function(r2) {
    if (this._connected && !this._hasActiveQuery()) {
      var e2 = this._queryQueue.shift();
      if (!e2) {
        r2 || this.emit("drain");
        return;
      }
      this._activeQuery = e2, e2.submit(this);
      var t2 = this;
      e2.once(
        "_done",
        function() {
          t2._pulseQueryQueue();
        }
      );
    }
  };
  J2.prototype.cancel = function(r2) {
    this._activeQuery === r2 ? this.native.cancel(function() {
    }) : this._queryQueue.indexOf(r2) !== -1 && this._queryQueue.splice(this._queryQueue.indexOf(r2), 1);
  };
  J2.prototype.ref = function() {
  };
  J2.prototype.unref = function() {
  };
  J2.prototype.setTypeParser = function(r2, e2, t2) {
    return this._types.setTypeParser(r2, e2, t2);
  };
  J2.prototype.getTypeParser = function(r2, e2) {
    return this._types.getTypeParser(r2, e2);
  };
});
var bn = I((xf, Gs) => {
  "use strict";
  p();
  Gs.exports = Hs();
});
var Ct = I((Ef, rt) => {
  "use strict";
  p();
  var Mc = Bs(), Dc = Xe(), kc = hn(), Uc = Ms(), { DatabaseError: Oc } = an(), Nc = a((r2) => {
    var e2;
    return e2 = /* @__PURE__ */ __name(class extends Uc {
      constructor(n2) {
        super(n2, r2);
      }
    }, "e"), a(e2, "BoundPool"), e2;
  }, "poolFactory"), Sn = a(function(r2) {
    this.defaults = Dc, this.Client = r2, this.Query = this.Client.Query, this.Pool = Nc(this.Client), this._pools = [], this.Connection = kc, this.types = Je(), this.DatabaseError = Oc;
  }, "PG");
  typeof m.env.NODE_PG_FORCE_NATIVE < "u" ? rt.exports = new Sn(bn()) : (rt.exports = new Sn(Mc), Object.defineProperty(rt.exports, "native", { configurable: true, enumerable: false, get() {
    var r2 = null;
    try {
      r2 = new Sn(bn());
    } catch (e2) {
      if (e2.code !== "MODULE_NOT_FOUND")
        throw e2;
    }
    return Object.defineProperty(rt.exports, "native", { value: r2 }), r2;
  } }));
});
p();
var Tt = Te(Ct());
wt();
p();
pr();
wt();
var Ks = Te(et());
var zs = Te(mt());
var xn = /* @__PURE__ */ __name(class xn2 extends Error {
  constructor() {
    super(...arguments);
    _(this, "name", "NeonDbError");
    _(this, "severity");
    _(this, "code");
    _(this, "detail");
    _(this, "hint");
    _(
      this,
      "position"
    );
    _(this, "internalPosition");
    _(this, "internalQuery");
    _(this, "where");
    _(this, "schema");
    _(this, "table");
    _(this, "column");
    _(this, "dataType");
    _(
      this,
      "constraint"
    );
    _(this, "file");
    _(this, "line");
    _(this, "routine");
    _(this, "sourceError");
  }
}, "xn");
a(xn, "NeonDbError");
var Ae = xn;
var $s = "transaction() expects an array of queries, or a function returning an array of queries";
var qc = ["severity", "code", "detail", "hint", "position", "internalPosition", "internalQuery", "where", "schema", "table", "column", "dataType", "constraint", "file", "line", "routine"];
function Ys(r2, {
  arrayMode: e2,
  fullResults: t2,
  fetchOptions: n2,
  isolationLevel: i2,
  readOnly: s2,
  deferrable: o2,
  queryCallback: u2,
  resultCallback: c2
} = {}) {
  if (!r2)
    throw new Error("No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?");
  let h2;
  try {
    h2 = fr(r2);
  } catch {
    throw new Error("Database connection string provided to `neon()` is not a valid URL. Connection string: " + String(r2));
  }
  let {
    protocol: l2,
    username: d2,
    password: b2,
    hostname: C2,
    port: B2,
    pathname: W2
  } = h2;
  if (l2 !== "postgres:" && l2 !== "postgresql:" || !d2 || !b2 || !C2 || !W2)
    throw new Error("Database connection string format for `neon()` should be: postgresql://user:password@host.tld/dbname?option=value");
  function X2(A2, ...w2) {
    let P2, V2;
    if (typeof A2 == "string")
      P2 = A2, V2 = w2[1], w2 = w2[0] ?? [];
    else {
      P2 = "";
      for (let j2 = 0; j2 < A2.length; j2++)
        P2 += A2[j2], j2 < w2.length && (P2 += "$" + (j2 + 1));
    }
    w2 = w2.map((j2) => (0, Ks.prepareValue)(j2));
    let k2 = {
      query: P2,
      params: w2
    };
    return u2 && u2(k2), Qc(de, k2, V2);
  }
  __name(X2, "X");
  a(X2, "resolve"), X2.transaction = async (A2, w2) => {
    if (typeof A2 == "function" && (A2 = A2(X2)), !Array.isArray(A2))
      throw new Error($s);
    A2.forEach((k2) => {
      if (k2[Symbol.toStringTag] !== "NeonQueryPromise")
        throw new Error($s);
    });
    let P2 = A2.map((k2) => k2.parameterizedQuery), V2 = A2.map((k2) => k2.opts ?? {});
    return de(P2, V2, w2);
  };
  async function de(A2, w2, P2) {
    let {
      fetchEndpoint: V2,
      fetchFunction: k2
    } = _e, j2 = typeof V2 == "function" ? V2(C2, B2) : V2, ce2 = Array.isArray(A2) ? { queries: A2 } : A2, ee = n2 ?? {}, R2 = e2 ?? false, G2 = t2 ?? false, he = i2, ye = s2, xe = o2;
    P2 !== void 0 && (P2.fetchOptions !== void 0 && (ee = { ...ee, ...P2.fetchOptions }), P2.arrayMode !== void 0 && (R2 = P2.arrayMode), P2.fullResults !== void 0 && (G2 = P2.fullResults), P2.isolationLevel !== void 0 && (he = P2.isolationLevel), P2.readOnly !== void 0 && (ye = P2.readOnly), P2.deferrable !== void 0 && (xe = P2.deferrable)), w2 !== void 0 && !Array.isArray(w2) && w2.fetchOptions !== void 0 && (ee = { ...ee, ...w2.fetchOptions });
    let me = { "Neon-Connection-String": r2, "Neon-Raw-Text-Output": "true", "Neon-Array-Mode": "true" };
    Array.isArray(A2) && (he !== void 0 && (me["Neon-Batch-Isolation-Level"] = he), ye !== void 0 && (me["Neon-Batch-Read-Only"] = String(ye)), xe !== void 0 && (me["Neon-Batch-Deferrable"] = String(
      xe
    )));
    let se;
    try {
      se = await (k2 ?? fetch)(j2, {
        method: "POST",
        body: JSON.stringify(ce2),
        headers: me,
        ...ee
      });
    } catch (oe) {
      let U2 = new Ae(`Error connecting to database: ${oe.message}`);
      throw U2.sourceError = oe, U2;
    }
    if (se.ok) {
      let oe = await se.json();
      if (Array.isArray(A2)) {
        let U2 = oe.results;
        if (!Array.isArray(U2))
          throw new Ae("Neon internal error: unexpected result format");
        return U2.map((K2, le) => {
          let It = w2[le] ?? {}, Xs = It.arrayMode ?? R2, eo = It.fullResults ?? G2;
          return Vs(K2, {
            arrayMode: Xs,
            fullResults: eo,
            parameterizedQuery: A2[le],
            resultCallback: c2,
            types: It.types
          });
        });
      } else {
        let U2 = w2 ?? {}, K2 = U2.arrayMode ?? R2, le = U2.fullResults ?? G2;
        return Vs(
          oe,
          { arrayMode: K2, fullResults: le, parameterizedQuery: A2, resultCallback: c2, types: U2.types }
        );
      }
    } else {
      let { status: oe } = se;
      if (oe === 400) {
        let U2 = await se.json(), K2 = new Ae(U2.message);
        for (let le of qc)
          K2[le] = U2[le] ?? void 0;
        throw K2;
      } else {
        let U2 = await se.text();
        throw new Ae(`Server error (HTTP status ${oe}): ${U2}`);
      }
    }
  }
  __name(de, "de");
  return a(de, "execute"), X2;
}
__name(Ys, "Ys");
a(Ys, "neon");
function Qc(r2, e2, t2) {
  return { [Symbol.toStringTag]: "NeonQueryPromise", parameterizedQuery: e2, opts: t2, then: a(
    (n2, i2) => r2(e2, t2).then(n2, i2),
    "then"
  ), catch: a((n2) => r2(e2, t2).catch(n2), "catch"), finally: a((n2) => r2(
    e2,
    t2
  ).finally(n2), "finally") };
}
__name(Qc, "Qc");
a(Qc, "createNeonQueryPromise");
function Vs(r2, {
  arrayMode: e2,
  fullResults: t2,
  parameterizedQuery: n2,
  resultCallback: i2,
  types: s2
}) {
  let o2 = new zs.default(
    s2
  ), u2 = r2.fields.map((l2) => l2.name), c2 = r2.fields.map((l2) => o2.getTypeParser(l2.dataTypeID)), h2 = e2 === true ? r2.rows.map((l2) => l2.map((d2, b2) => d2 === null ? null : c2[b2](d2))) : r2.rows.map((l2) => Object.fromEntries(
    l2.map((d2, b2) => [u2[b2], d2 === null ? null : c2[b2](d2)])
  ));
  return i2 && i2(n2, r2, h2, { arrayMode: e2, fullResults: t2 }), t2 ? (r2.viaNeonFetch = true, r2.rowAsArray = e2, r2.rows = h2, r2._parsers = c2, r2._types = o2, r2) : h2;
}
__name(Vs, "Vs");
a(Vs, "processQueryResult");
var Js = Te(gt());
var Qe = Te(Ct());
var En = /* @__PURE__ */ __name(class En2 extends Tt.Client {
  constructor(t2) {
    super(t2);
    this.config = t2;
  }
  get neonConfig() {
    return this.connection.stream;
  }
  connect(t2) {
    let { neonConfig: n2 } = this;
    n2.forceDisablePgSSL && (this.ssl = this.connection.ssl = false), this.ssl && n2.useSecureWebSocket && console.warn("SSL is enabled for both Postgres (e.g. ?sslmode=require in the connection string + forceDisablePgSSL = false) and the WebSocket tunnel (useSecureWebSocket = true). Double encryption will increase latency and CPU usage. It may be appropriate to disable SSL in the Postgres connection parameters or set forceDisablePgSSL = true.");
    let i2 = this.config?.host !== void 0 || this.config?.connectionString !== void 0 || m.env.PGHOST !== void 0, s2 = m.env.USER ?? m.env.USERNAME;
    if (!i2 && this.host === "localhost" && this.user === s2 && this.database === s2 && this.password === null)
      throw new Error(`No database host or connection string was set, and key parameters have default values (host: localhost, user: ${s2}, db: ${s2}, password: null). Is an environment variable missing? Alternatively, if you intended to connect with these parameters, please set the host to 'localhost' explicitly.`);
    let o2 = super.connect(t2), u2 = n2.pipelineTLS && this.ssl, c2 = n2.pipelineConnect === "password";
    if (!u2 && !n2.pipelineConnect)
      return o2;
    let h2 = this.connection;
    if (u2 && h2.on("connect", () => h2.stream.emit("data", "S")), c2) {
      h2.removeAllListeners(
        "authenticationCleartextPassword"
      ), h2.removeAllListeners("readyForQuery"), h2.once(
        "readyForQuery",
        () => h2.on("readyForQuery", this._handleReadyForQuery.bind(this))
      );
      let l2 = this.ssl ? "sslconnect" : "connect";
      h2.on(l2, () => {
        this._handleAuthCleartextPassword(), this._handleReadyForQuery();
      });
    }
    return o2;
  }
  async _handleAuthSASLContinue(t2) {
    let n2 = this.saslSession, i2 = this.password, s2 = t2.data;
    if (n2.message !== "SASLInitialResponse" || typeof i2 != "string" || typeof s2 != "string")
      throw new Error("SASL: protocol error");
    let o2 = Object.fromEntries(s2.split(",").map((U2) => {
      if (!/^.=/.test(U2))
        throw new Error("SASL: Invalid attribute pair entry");
      let K2 = U2[0], le = U2.substring(2);
      return [K2, le];
    })), u2 = o2.r, c2 = o2.s, h2 = o2.i;
    if (!u2 || !/^[!-+--~]+$/.test(u2))
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing/unprintable");
    if (!c2 || !/^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(c2))
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing/not base64");
    if (!h2 || !/^[1-9][0-9]*$/.test(h2))
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: missing/invalid iteration count");
    if (!u2.startsWith(n2.clientNonce))
      throw new Error(
        "SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce"
      );
    if (u2.length === n2.clientNonce.length)
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
    let l2 = parseInt(h2, 10), d2 = y.from(c2, "base64"), b2 = new TextEncoder(), C2 = b2.encode(i2), B2 = await g.subtle.importKey("raw", C2, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]), W2 = new Uint8Array(await g.subtle.sign("HMAC", B2, y.concat([d2, y.from(
      [0, 0, 0, 1]
    )]))), X2 = W2;
    for (var de = 0; de < l2 - 1; de++)
      W2 = new Uint8Array(await g.subtle.sign(
        "HMAC",
        B2,
        W2
      )), X2 = y.from(X2.map((U2, K2) => X2[K2] ^ W2[K2]));
    let A2 = X2, w2 = await g.subtle.importKey(
      "raw",
      A2,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    ), P2 = new Uint8Array(await g.subtle.sign("HMAC", w2, b2.encode("Client Key"))), V2 = await g.subtle.digest(
      "SHA-256",
      P2
    ), k2 = "n=*,r=" + n2.clientNonce, j2 = "r=" + u2 + ",s=" + c2 + ",i=" + l2, ce2 = "c=biws,r=" + u2, ee = k2 + "," + j2 + "," + ce2, R2 = await g.subtle.importKey(
      "raw",
      V2,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    );
    var G2 = new Uint8Array(await g.subtle.sign("HMAC", R2, b2.encode(ee))), he = y.from(P2.map((U2, K2) => P2[K2] ^ G2[K2])), ye = he.toString("base64");
    let xe = await g.subtle.importKey(
      "raw",
      A2,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    ), me = await g.subtle.sign(
      "HMAC",
      xe,
      b2.encode("Server Key")
    ), se = await g.subtle.importKey("raw", me, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]);
    var oe = y.from(await g.subtle.sign(
      "HMAC",
      se,
      b2.encode(ee)
    ));
    n2.message = "SASLResponse", n2.serverSignature = oe.toString("base64"), n2.response = ce2 + ",p=" + ye, this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
  }
}, "En");
a(En, "NeonClient");
var vn = En;
function Wc(r2, e2) {
  if (e2)
    return {
      callback: e2,
      result: void 0
    };
  let t2, n2, i2 = a(function(o2, u2) {
    o2 ? t2(o2) : n2(u2);
  }, "cb"), s2 = new r2(function(o2, u2) {
    n2 = o2, t2 = u2;
  });
  return { callback: i2, result: s2 };
}
__name(Wc, "Wc");
a(Wc, "promisify");
var _n = /* @__PURE__ */ __name(class _n2 extends Tt.Pool {
  constructor() {
    super(...arguments);
    _(this, "Client", vn);
    _(this, "hasFetchUnsupportedListeners", false);
  }
  on(t2, n2) {
    return t2 !== "error" && (this.hasFetchUnsupportedListeners = true), super.on(t2, n2);
  }
  query(t2, n2, i2) {
    if (!_e.poolQueryViaFetch || this.hasFetchUnsupportedListeners || typeof t2 == "function")
      return super.query(t2, n2, i2);
    typeof n2 == "function" && (i2 = n2, n2 = void 0);
    let s2 = Wc(
      this.Promise,
      i2
    );
    i2 = s2.callback;
    try {
      let o2 = new Js.default(this.options), u2 = encodeURIComponent, c2 = encodeURI, h2 = `postgresql://${u2(o2.user)}:${u2(o2.password)}@${u2(o2.host)}/${c2(o2.database)}`, l2 = typeof t2 == "string" ? t2 : t2.text, d2 = n2 ?? t2.values ?? [];
      Ys(h2, { fullResults: true, arrayMode: t2.rowMode === "array" })(l2, d2, { types: t2.types ?? this.options?.types }).then((C2) => i2(void 0, C2)).catch((C2) => i2(
        C2
      ));
    } catch (o2) {
      i2(o2);
    }
    return s2.result;
  }
}, "_n");
a(_n, "NeonPool");
var export_ClientBase = Qe.ClientBase;
var export_Connection = Qe.Connection;
var export_DatabaseError = Qe.DatabaseError;
var export_Query = Qe.Query;
var export_defaults = Qe.defaults;
var export_types = Qe.types;

// node_modules/@aws-sdk/client-s3/dist-es/S3Client.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/middleware-expect-continue/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/protocol-http/dist-es/extensions/httpExtensionConfiguration.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getHttpHandlerExtensionConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
  return {
    setHttpHandler(handler) {
      runtimeConfig.httpHandler = handler;
    },
    httpHandler() {
      return runtimeConfig.httpHandler;
    },
    updateHttpClientConfig(key, value) {
      runtimeConfig.httpHandler?.updateHttpClientConfig(key, value);
    },
    httpHandlerConfigs() {
      return runtimeConfig.httpHandler.httpHandlerConfigs();
    }
  };
}, "getHttpHandlerExtensionConfiguration");
var resolveHttpHandlerRuntimeConfig = /* @__PURE__ */ __name((httpHandlerExtensionConfiguration) => {
  return {
    httpHandler: httpHandlerExtensionConfiguration.httpHandler()
  };
}, "resolveHttpHandlerRuntimeConfig");

// node_modules/@smithy/types/dist-es/endpoint.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var EndpointURLScheme;
(function(EndpointURLScheme2) {
  EndpointURLScheme2["HTTP"] = "http";
  EndpointURLScheme2["HTTPS"] = "https";
})(EndpointURLScheme || (EndpointURLScheme = {}));

// node_modules/@smithy/types/dist-es/extensions/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/types/dist-es/extensions/checksum.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var AlgorithmId;
(function(AlgorithmId2) {
  AlgorithmId2["MD5"] = "md5";
  AlgorithmId2["CRC32"] = "crc32";
  AlgorithmId2["CRC32C"] = "crc32c";
  AlgorithmId2["SHA1"] = "sha1";
  AlgorithmId2["SHA256"] = "sha256";
})(AlgorithmId || (AlgorithmId = {}));

// node_modules/@smithy/types/dist-es/middleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var SMITHY_CONTEXT_KEY = "__smithy_context";

// node_modules/@smithy/protocol-http/dist-es/httpRequest.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var HttpRequest = class {
  method;
  protocol;
  hostname;
  port;
  path;
  query;
  headers;
  username;
  password;
  fragment;
  body;
  constructor(options) {
    this.method = options.method || "GET";
    this.hostname = options.hostname || "localhost";
    this.port = options.port;
    this.query = options.query || {};
    this.headers = options.headers || {};
    this.body = options.body;
    this.protocol = options.protocol ? options.protocol.slice(-1) !== ":" ? `${options.protocol}:` : options.protocol : "https:";
    this.path = options.path ? options.path.charAt(0) !== "/" ? `/${options.path}` : options.path : "/";
    this.username = options.username;
    this.password = options.password;
    this.fragment = options.fragment;
  }
  static clone(request) {
    const cloned = new HttpRequest({
      ...request,
      headers: { ...request.headers }
    });
    if (cloned.query) {
      cloned.query = cloneQuery(cloned.query);
    }
    return cloned;
  }
  static isInstance(request) {
    if (!request) {
      return false;
    }
    const req = request;
    return "method" in req && "protocol" in req && "hostname" in req && "path" in req && typeof req["query"] === "object" && typeof req["headers"] === "object";
  }
  clone() {
    return HttpRequest.clone(this);
  }
};
__name(HttpRequest, "HttpRequest");
function cloneQuery(query) {
  return Object.keys(query).reduce((carry, paramName) => {
    const param = query[paramName];
    return {
      ...carry,
      [paramName]: Array.isArray(param) ? [...param] : param
    };
  }, {});
}
__name(cloneQuery, "cloneQuery");

// node_modules/@smithy/protocol-http/dist-es/httpResponse.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var HttpResponse = class {
  statusCode;
  reason;
  headers;
  body;
  constructor(options) {
    this.statusCode = options.statusCode;
    this.reason = options.reason;
    this.headers = options.headers || {};
    this.body = options.body;
  }
  static isInstance(response) {
    if (!response)
      return false;
    const resp = response;
    return typeof resp.statusCode === "number" && typeof resp.headers === "object";
  }
};
__name(HttpResponse, "HttpResponse");

// node_modules/@aws-sdk/middleware-expect-continue/dist-es/index.js
function addExpectContinueMiddleware(options) {
  return (next) => async (args) => {
    const { request } = args;
    if (options.expectContinueHeader !== false && HttpRequest.isInstance(request) && request.body && options.runtime === "node" && options.requestHandler?.constructor?.name !== "FetchHttpHandler") {
      let sendHeader = true;
      if (typeof options.expectContinueHeader === "number") {
        try {
          const bodyLength = Number(request.headers?.["content-length"]) ?? options.bodyLengthChecker?.(request.body) ?? Infinity;
          sendHeader = bodyLength >= options.expectContinueHeader;
        } catch (e2) {
        }
      } else {
        sendHeader = !!options.expectContinueHeader;
      }
      if (sendHeader) {
        request.headers.Expect = "100-continue";
      }
    }
    return next({
      ...args,
      request
    });
  };
}
__name(addExpectContinueMiddleware, "addExpectContinueMiddleware");
var addExpectContinueMiddlewareOptions = {
  step: "build",
  tags: ["SET_EXPECT_HEADER", "EXPECT_HEADER"],
  name: "addExpectContinueMiddleware",
  override: true
};
var getAddExpectContinuePlugin = /* @__PURE__ */ __name((options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(addExpectContinueMiddleware(options), addExpectContinueMiddlewareOptions);
  }
}), "getAddExpectContinuePlugin");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var RequestChecksumCalculation = {
  WHEN_SUPPORTED: "WHEN_SUPPORTED",
  WHEN_REQUIRED: "WHEN_REQUIRED"
};
var DEFAULT_REQUEST_CHECKSUM_CALCULATION = RequestChecksumCalculation.WHEN_SUPPORTED;
var ResponseChecksumValidation = {
  WHEN_SUPPORTED: "WHEN_SUPPORTED",
  WHEN_REQUIRED: "WHEN_REQUIRED"
};
var DEFAULT_RESPONSE_CHECKSUM_VALIDATION = RequestChecksumCalculation.WHEN_SUPPORTED;
var ChecksumAlgorithm;
(function(ChecksumAlgorithm2) {
  ChecksumAlgorithm2["MD5"] = "MD5";
  ChecksumAlgorithm2["CRC32"] = "CRC32";
  ChecksumAlgorithm2["CRC32C"] = "CRC32C";
  ChecksumAlgorithm2["CRC64NVME"] = "CRC64NVME";
  ChecksumAlgorithm2["SHA1"] = "SHA1";
  ChecksumAlgorithm2["SHA256"] = "SHA256";
})(ChecksumAlgorithm || (ChecksumAlgorithm = {}));
var ChecksumLocation;
(function(ChecksumLocation2) {
  ChecksumLocation2["HEADER"] = "header";
  ChecksumLocation2["TRAILER"] = "trailer";
})(ChecksumLocation || (ChecksumLocation = {}));
var DEFAULT_CHECKSUM_ALGORITHM = ChecksumAlgorithm.CRC32;

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/crc64-nvme-crt-container.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var crc64NvmeCrtContainer = {
  CrtCrc64Nvme: null
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/flexibleChecksumsMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function setCredentialFeature(credentials, feature, value) {
  if (!credentials.$source) {
    credentials.$source = {};
  }
  credentials.$source[feature] = value;
  return credentials;
}
__name(setCredentialFeature, "setCredentialFeature");

// node_modules/@aws-sdk/core/dist-es/submodules/client/setFeature.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function setFeature(context, feature, value) {
  if (!context.__aws_sdk_context) {
    context.__aws_sdk_context = {
      features: {}
    };
  } else if (!context.__aws_sdk_context.features) {
    context.__aws_sdk_context.features = {};
  }
  context.__aws_sdk_context.features[feature] = value;
}
__name(setFeature, "setFeature");

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getDateHeader.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getDateHeader = /* @__PURE__ */ __name((response) => HttpResponse.isInstance(response) ? response.headers?.date ?? response.headers?.Date : void 0, "getDateHeader");

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getSkewCorrectedDate.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getSkewCorrectedDate = /* @__PURE__ */ __name((systemClockOffset) => new Date(Date.now() + systemClockOffset), "getSkewCorrectedDate");

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getUpdatedSystemClockOffset.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/isClockSkewed.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var isClockSkewed = /* @__PURE__ */ __name((clockTime, systemClockOffset) => Math.abs(getSkewCorrectedDate(systemClockOffset).getTime() - clockTime) >= 3e5, "isClockSkewed");

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getUpdatedSystemClockOffset.js
var getUpdatedSystemClockOffset = /* @__PURE__ */ __name((clockTime, currentSystemClockOffset) => {
  const clockTimeInMs = Date.parse(clockTime);
  if (isClockSkewed(clockTimeInMs, currentSystemClockOffset)) {
    return clockTimeInMs - Date.now();
  }
  return currentSystemClockOffset;
}, "getUpdatedSystemClockOffset");

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js
var throwSigningPropertyError = /* @__PURE__ */ __name((name, property) => {
  if (!property) {
    throw new Error(`Property \`${name}\` is not resolved for AWS SDK SigV4Auth`);
  }
  return property;
}, "throwSigningPropertyError");
var validateSigningProperties = /* @__PURE__ */ __name(async (signingProperties) => {
  const context = throwSigningPropertyError("context", signingProperties.context);
  const config = throwSigningPropertyError("config", signingProperties.config);
  const authScheme = context.endpointV2?.properties?.authSchemes?.[0];
  const signerFunction = throwSigningPropertyError("signer", config.signer);
  const signer = await signerFunction(authScheme);
  const signingRegion = signingProperties?.signingRegion;
  const signingRegionSet = signingProperties?.signingRegionSet;
  const signingName = signingProperties?.signingName;
  return {
    config,
    signer,
    signingRegion,
    signingRegionSet,
    signingName
  };
}, "validateSigningProperties");
var AwsSdkSigV4Signer = class {
  async sign(httpRequest, identity, signingProperties) {
    if (!HttpRequest.isInstance(httpRequest)) {
      throw new Error("The request is not an instance of `HttpRequest` and cannot be signed");
    }
    const validatedProps = await validateSigningProperties(signingProperties);
    const { config, signer } = validatedProps;
    let { signingRegion, signingName } = validatedProps;
    const handlerExecutionContext = signingProperties.context;
    if (handlerExecutionContext?.authSchemes?.length ?? 0 > 1) {
      const [first, second] = handlerExecutionContext.authSchemes;
      if (first?.name === "sigv4a" && second?.name === "sigv4") {
        signingRegion = second?.signingRegion ?? signingRegion;
        signingName = second?.signingName ?? signingName;
      }
    }
    const signedRequest = await signer.sign(httpRequest, {
      signingDate: getSkewCorrectedDate(config.systemClockOffset),
      signingRegion,
      signingService: signingName
    });
    return signedRequest;
  }
  errorHandler(signingProperties) {
    return (error) => {
      const serverTime = error.ServerTime ?? getDateHeader(error.$response);
      if (serverTime) {
        const config = throwSigningPropertyError("config", signingProperties.config);
        const initialSystemClockOffset = config.systemClockOffset;
        config.systemClockOffset = getUpdatedSystemClockOffset(serverTime, config.systemClockOffset);
        const clockSkewCorrected = config.systemClockOffset !== initialSystemClockOffset;
        if (clockSkewCorrected && error.$metadata) {
          error.$metadata.clockSkewCorrected = true;
        }
      }
      throw error;
    };
  }
  successHandler(httpResponse, signingProperties) {
    const dateHeader = getDateHeader(httpResponse);
    if (dateHeader) {
      const config = throwSigningPropertyError("config", signingProperties.config);
      config.systemClockOffset = getUpdatedSystemClockOffset(dateHeader, config.systemClockOffset);
    }
  }
};
__name(AwsSdkSigV4Signer, "AwsSdkSigV4Signer");

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4ASigner.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var AwsSdkSigV4ASigner = class extends AwsSdkSigV4Signer {
  async sign(httpRequest, identity, signingProperties) {
    if (!HttpRequest.isInstance(httpRequest)) {
      throw new Error("The request is not an instance of `HttpRequest` and cannot be signed");
    }
    const { config, signer, signingRegion, signingRegionSet, signingName } = await validateSigningProperties(signingProperties);
    const configResolvedSigningRegionSet = await config.sigv4aSigningRegionSet?.();
    const multiRegionOverride = (configResolvedSigningRegionSet ?? signingRegionSet ?? [signingRegion]).join(",");
    const signedRequest = await signer.sign(httpRequest, {
      signingDate: getSkewCorrectedDate(config.systemClockOffset),
      signingRegion: multiRegionOverride,
      signingService: signingName
    });
    return signedRequest;
  }
};
__name(AwsSdkSigV4ASigner, "AwsSdkSigV4ASigner");

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4AConfig.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/httpAuthSchemeMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-middleware/dist-es/getSmithyContext.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getSmithyContext = /* @__PURE__ */ __name((context) => context[SMITHY_CONTEXT_KEY] || (context[SMITHY_CONTEXT_KEY] = {}), "getSmithyContext");

// node_modules/@smithy/util-middleware/dist-es/normalizeProvider.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var normalizeProvider = /* @__PURE__ */ __name((input) => {
  if (typeof input === "function")
    return input;
  const promisified = Promise.resolve(input);
  return () => promisified;
}, "normalizeProvider");

// node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/resolveAuthOptions.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var resolveAuthOptions = /* @__PURE__ */ __name((candidateAuthOptions, authSchemePreference) => {
  if (!authSchemePreference || authSchemePreference.length === 0) {
    return candidateAuthOptions;
  }
  const preferredAuthOptions = [];
  for (const preferredSchemeName of authSchemePreference) {
    for (const candidateAuthOption of candidateAuthOptions) {
      const candidateAuthSchemeName = candidateAuthOption.schemeId.split("#")[1];
      if (candidateAuthSchemeName === preferredSchemeName) {
        preferredAuthOptions.push(candidateAuthOption);
      }
    }
  }
  for (const candidateAuthOption of candidateAuthOptions) {
    if (!preferredAuthOptions.find(({ schemeId }) => schemeId === candidateAuthOption.schemeId)) {
      preferredAuthOptions.push(candidateAuthOption);
    }
  }
  return preferredAuthOptions;
}, "resolveAuthOptions");

// node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/httpAuthSchemeMiddleware.js
function convertHttpAuthSchemesToMap(httpAuthSchemes) {
  const map = /* @__PURE__ */ new Map();
  for (const scheme of httpAuthSchemes) {
    map.set(scheme.schemeId, scheme);
  }
  return map;
}
__name(convertHttpAuthSchemesToMap, "convertHttpAuthSchemesToMap");
var httpAuthSchemeMiddleware = /* @__PURE__ */ __name((config, mwOptions) => (next, context) => async (args) => {
  const options = config.httpAuthSchemeProvider(await mwOptions.httpAuthSchemeParametersProvider(config, context, args.input));
  const authSchemePreference = config.authSchemePreference ? await config.authSchemePreference() : [];
  const resolvedOptions = resolveAuthOptions(options, authSchemePreference);
  const authSchemes = convertHttpAuthSchemesToMap(config.httpAuthSchemes);
  const smithyContext = getSmithyContext(context);
  const failureReasons = [];
  for (const option of resolvedOptions) {
    const scheme = authSchemes.get(option.schemeId);
    if (!scheme) {
      failureReasons.push(`HttpAuthScheme \`${option.schemeId}\` was not enabled for this service.`);
      continue;
    }
    const identityProvider = scheme.identityProvider(await mwOptions.identityProviderConfigProvider(config));
    if (!identityProvider) {
      failureReasons.push(`HttpAuthScheme \`${option.schemeId}\` did not have an IdentityProvider configured.`);
      continue;
    }
    const { identityProperties = {}, signingProperties = {} } = option.propertiesExtractor?.(config, context) || {};
    option.identityProperties = Object.assign(option.identityProperties || {}, identityProperties);
    option.signingProperties = Object.assign(option.signingProperties || {}, signingProperties);
    smithyContext.selectedHttpAuthScheme = {
      httpAuthOption: option,
      identity: await identityProvider(option.identityProperties),
      signer: scheme.signer
    };
    break;
  }
  if (!smithyContext.selectedHttpAuthScheme) {
    throw new Error(failureReasons.join("\n"));
  }
  return next(args);
}, "httpAuthSchemeMiddleware");

// node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/getHttpAuthSchemeEndpointRuleSetPlugin.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var httpAuthSchemeEndpointRuleSetMiddlewareOptions = {
  step: "serialize",
  tags: ["HTTP_AUTH_SCHEME"],
  name: "httpAuthSchemeMiddleware",
  override: true,
  relation: "before",
  toMiddleware: "endpointV2Middleware"
};
var getHttpAuthSchemeEndpointRuleSetPlugin = /* @__PURE__ */ __name((config, { httpAuthSchemeParametersProvider, identityProviderConfigProvider }) => ({
  applyToStack: (clientStack) => {
    clientStack.addRelativeTo(httpAuthSchemeMiddleware(config, {
      httpAuthSchemeParametersProvider,
      identityProviderConfigProvider
    }), httpAuthSchemeEndpointRuleSetMiddlewareOptions);
  }
}), "getHttpAuthSchemeEndpointRuleSetPlugin");

// node_modules/@smithy/middleware-serde/dist-es/serdePlugin.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var serializerMiddlewareOption = {
  name: "serializerMiddleware",
  step: "serialize",
  tags: ["SERIALIZER"],
  override: true
};

// node_modules/@smithy/core/dist-es/middleware-http-signing/httpSigningMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var defaultErrorHandler = /* @__PURE__ */ __name((signingProperties) => (error) => {
  throw error;
}, "defaultErrorHandler");
var defaultSuccessHandler = /* @__PURE__ */ __name((httpResponse, signingProperties) => {
}, "defaultSuccessHandler");
var httpSigningMiddleware = /* @__PURE__ */ __name((config) => (next, context) => async (args) => {
  if (!HttpRequest.isInstance(args.request)) {
    return next(args);
  }
  const smithyContext = getSmithyContext(context);
  const scheme = smithyContext.selectedHttpAuthScheme;
  if (!scheme) {
    throw new Error(`No HttpAuthScheme was selected: unable to sign request`);
  }
  const { httpAuthOption: { signingProperties = {} }, identity, signer } = scheme;
  const output = await next({
    ...args,
    request: await signer.sign(args.request, identity, signingProperties)
  }).catch((signer.errorHandler || defaultErrorHandler)(signingProperties));
  (signer.successHandler || defaultSuccessHandler)(output.response, signingProperties);
  return output;
}, "httpSigningMiddleware");

// node_modules/@smithy/core/dist-es/middleware-http-signing/getHttpSigningMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var httpSigningMiddlewareOptions = {
  step: "finalizeRequest",
  tags: ["HTTP_SIGNING"],
  name: "httpSigningMiddleware",
  aliases: ["apiKeyMiddleware", "tokenMiddleware", "awsAuthMiddleware"],
  override: true,
  relation: "after",
  toMiddleware: "retryMiddleware"
};
var getHttpSigningPlugin = /* @__PURE__ */ __name((config) => ({
  applyToStack: (clientStack) => {
    clientStack.addRelativeTo(httpSigningMiddleware(config), httpSigningMiddlewareOptions);
  }
}), "getHttpSigningPlugin");

// node_modules/@smithy/core/dist-es/normalizeProvider.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var normalizeProvider2 = /* @__PURE__ */ __name((input) => {
  if (typeof input === "function")
    return input;
  const promisified = Promise.resolve(input);
  return () => promisified;
}, "normalizeProvider");

// node_modules/@smithy/core/dist-es/submodules/protocols/collect-stream-body.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-stream/dist-es/blob/Uint8ArrayBlobAdapter.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-base64/dist-es/fromBase64.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-base64/dist-es/constants.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`;
var alphabetByEncoding = Object.entries(chars).reduce((acc, [i2, c2]) => {
  acc[c2] = Number(i2);
  return acc;
}, {});
var alphabetByValue = chars.split("");
var bitsPerLetter = 6;
var bitsPerByte = 8;
var maxLetterValue = 63;

// node_modules/@smithy/util-base64/dist-es/fromBase64.browser.js
var fromBase64 = /* @__PURE__ */ __name((input) => {
  let totalByteLength = input.length / 4 * 3;
  if (input.slice(-2) === "==") {
    totalByteLength -= 2;
  } else if (input.slice(-1) === "=") {
    totalByteLength--;
  }
  const out = new ArrayBuffer(totalByteLength);
  const dataView = new DataView(out);
  for (let i2 = 0; i2 < input.length; i2 += 4) {
    let bits = 0;
    let bitLength = 0;
    for (let j2 = i2, limit = i2 + 3; j2 <= limit; j2++) {
      if (input[j2] !== "=") {
        if (!(input[j2] in alphabetByEncoding)) {
          throw new TypeError(`Invalid character ${input[j2]} in base64 string.`);
        }
        bits |= alphabetByEncoding[input[j2]] << (limit - j2) * bitsPerLetter;
        bitLength += bitsPerLetter;
      } else {
        bits >>= bitsPerLetter;
      }
    }
    const chunkOffset = i2 / 4 * 3;
    bits >>= bitLength % bitsPerByte;
    const byteLength = Math.floor(bitLength / bitsPerByte);
    for (let k2 = 0; k2 < byteLength; k2++) {
      const offset = (byteLength - k2 - 1) * bitsPerByte;
      dataView.setUint8(chunkOffset + k2, (bits & 255 << offset) >> offset);
    }
  }
  return new Uint8Array(out);
}, "fromBase64");

// node_modules/@smithy/util-base64/dist-es/toBase64.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_dist_es();
function toBase64(_input) {
  let input;
  if (typeof _input === "string") {
    input = fromUtf8(_input);
  } else {
    input = _input;
  }
  const isArrayLike = typeof input === "object" && typeof input.length === "number";
  const isUint8Array = typeof input === "object" && typeof input.byteOffset === "number" && typeof input.byteLength === "number";
  if (!isArrayLike && !isUint8Array) {
    throw new Error("@smithy/util-base64: toBase64 encoder function only accepts string | Uint8Array.");
  }
  let str = "";
  for (let i2 = 0; i2 < input.length; i2 += 3) {
    let bits = 0;
    let bitLength = 0;
    for (let j2 = i2, limit = Math.min(i2 + 3, input.length); j2 < limit; j2++) {
      bits |= input[j2] << (limit - j2 - 1) * bitsPerByte;
      bitLength += bitsPerByte;
    }
    const bitClusterCount = Math.ceil(bitLength / bitsPerLetter);
    bits <<= bitClusterCount * bitsPerLetter - bitLength;
    for (let k2 = 1; k2 <= bitClusterCount; k2++) {
      const offset = (bitClusterCount - k2) * bitsPerLetter;
      str += alphabetByValue[(bits & maxLetterValue << offset) >> offset];
    }
    str += "==".slice(0, 4 - bitClusterCount);
  }
  return str;
}
__name(toBase64, "toBase64");

// node_modules/@smithy/util-stream/dist-es/blob/Uint8ArrayBlobAdapter.js
init_dist_es();
var Uint8ArrayBlobAdapter = class extends Uint8Array {
  static fromString(source, encoding = "utf-8") {
    if (typeof source === "string") {
      if (encoding === "base64") {
        return Uint8ArrayBlobAdapter.mutate(fromBase64(source));
      }
      return Uint8ArrayBlobAdapter.mutate(fromUtf8(source));
    }
    throw new Error(`Unsupported conversion from ${typeof source} to Uint8ArrayBlobAdapter.`);
  }
  static mutate(source) {
    Object.setPrototypeOf(source, Uint8ArrayBlobAdapter.prototype);
    return source;
  }
  transformToString(encoding = "utf-8") {
    if (encoding === "base64") {
      return toBase64(this);
    }
    return toUtf8(this);
  }
};
__name(Uint8ArrayBlobAdapter, "Uint8ArrayBlobAdapter");

// node_modules/@smithy/util-stream/dist-es/checksum/ChecksumStream.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var ReadableStreamRef = typeof ReadableStream === "function" ? ReadableStream : function() {
};
var ChecksumStream = class extends ReadableStreamRef {
};
__name(ChecksumStream, "ChecksumStream");

// node_modules/@smithy/util-stream/dist-es/checksum/createChecksumStream.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-stream/dist-es/stream-type-check.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var isReadableStream = /* @__PURE__ */ __name((stream) => typeof ReadableStream === "function" && (stream?.constructor?.name === ReadableStream.name || stream instanceof ReadableStream), "isReadableStream");

// node_modules/@smithy/util-stream/dist-es/checksum/createChecksumStream.browser.js
var createChecksumStream = /* @__PURE__ */ __name(({ expectedChecksum, checksum, source, checksumSourceLocation, base64Encoder }) => {
  if (!isReadableStream(source)) {
    throw new Error(`@smithy/util-stream: unsupported source type ${source?.constructor?.name ?? source} in ChecksumStream.`);
  }
  const encoder = base64Encoder ?? toBase64;
  if (typeof TransformStream !== "function") {
    throw new Error("@smithy/util-stream: unable to instantiate ChecksumStream because API unavailable: ReadableStream/TransformStream.");
  }
  const transform = new TransformStream({
    start() {
    },
    async transform(chunk, controller) {
      checksum.update(chunk);
      controller.enqueue(chunk);
    },
    async flush(controller) {
      const digest = await checksum.digest();
      const received = encoder(digest);
      if (expectedChecksum !== received) {
        const error = new Error(`Checksum mismatch: expected "${expectedChecksum}" but received "${received}" in response header "${checksumSourceLocation}".`);
        controller.error(error);
      } else {
        controller.terminate();
      }
    }
  });
  source.pipeThrough(transform);
  const readable = transform.readable;
  Object.setPrototypeOf(readable, ChecksumStream.prototype);
  return readable;
}, "createChecksumStream");

// node_modules/@smithy/util-stream/dist-es/createBufferedReadableStream.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-stream/dist-es/ByteArrayCollector.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var ByteArrayCollector = class {
  allocByteArray;
  byteLength = 0;
  byteArrays = [];
  constructor(allocByteArray) {
    this.allocByteArray = allocByteArray;
  }
  push(byteArray) {
    this.byteArrays.push(byteArray);
    this.byteLength += byteArray.byteLength;
  }
  flush() {
    if (this.byteArrays.length === 1) {
      const bytes = this.byteArrays[0];
      this.reset();
      return bytes;
    }
    const aggregation = this.allocByteArray(this.byteLength);
    let cursor = 0;
    for (let i2 = 0; i2 < this.byteArrays.length; ++i2) {
      const bytes = this.byteArrays[i2];
      aggregation.set(bytes, cursor);
      cursor += bytes.byteLength;
    }
    this.reset();
    return aggregation;
  }
  reset() {
    this.byteArrays = [];
    this.byteLength = 0;
  }
};
__name(ByteArrayCollector, "ByteArrayCollector");

// node_modules/@smithy/util-stream/dist-es/createBufferedReadableStream.js
function createBufferedReadableStream(upstream, size, logger2) {
  const reader = upstream.getReader();
  let streamBufferingLoggedWarning = false;
  let bytesSeen = 0;
  const buffers = ["", new ByteArrayCollector((size2) => new Uint8Array(size2))];
  let mode = -1;
  const pull = /* @__PURE__ */ __name(async (controller) => {
    const { value, done } = await reader.read();
    const chunk = value;
    if (done) {
      if (mode !== -1) {
        const remainder = flush(buffers, mode);
        if (sizeOf(remainder) > 0) {
          controller.enqueue(remainder);
        }
      }
      controller.close();
    } else {
      const chunkMode = modeOf(chunk, false);
      if (mode !== chunkMode) {
        if (mode >= 0) {
          controller.enqueue(flush(buffers, mode));
        }
        mode = chunkMode;
      }
      if (mode === -1) {
        controller.enqueue(chunk);
        return;
      }
      const chunkSize = sizeOf(chunk);
      bytesSeen += chunkSize;
      const bufferSize = sizeOf(buffers[mode]);
      if (chunkSize >= size && bufferSize === 0) {
        controller.enqueue(chunk);
      } else {
        const newSize = merge(buffers, mode, chunk);
        if (!streamBufferingLoggedWarning && bytesSeen > size * 2) {
          streamBufferingLoggedWarning = true;
          logger2?.warn(`@smithy/util-stream - stream chunk size ${chunkSize} is below threshold of ${size}, automatically buffering.`);
        }
        if (newSize >= size) {
          controller.enqueue(flush(buffers, mode));
        } else {
          await pull(controller);
        }
      }
    }
  }, "pull");
  return new ReadableStream({
    pull
  });
}
__name(createBufferedReadableStream, "createBufferedReadableStream");
var createBufferedReadable = createBufferedReadableStream;
function merge(buffers, mode, chunk) {
  switch (mode) {
    case 0:
      buffers[0] += chunk;
      return sizeOf(buffers[0]);
    case 1:
    case 2:
      buffers[mode].push(chunk);
      return sizeOf(buffers[mode]);
  }
}
__name(merge, "merge");
function flush(buffers, mode) {
  switch (mode) {
    case 0:
      const s2 = buffers[0];
      buffers[0] = "";
      return s2;
    case 1:
    case 2:
      return buffers[mode].flush();
  }
  throw new Error(`@smithy/util-stream - invalid index ${mode} given to flush()`);
}
__name(flush, "flush");
function sizeOf(chunk) {
  return chunk?.byteLength ?? chunk?.length ?? 0;
}
__name(sizeOf, "sizeOf");
function modeOf(chunk, allowBuffer = true) {
  if (allowBuffer && typeof Buffer !== "undefined" && chunk instanceof Buffer) {
    return 2;
  }
  if (chunk instanceof Uint8Array) {
    return 1;
  }
  if (typeof chunk === "string") {
    return 0;
  }
  return -1;
}
__name(modeOf, "modeOf");

// node_modules/@smithy/util-stream/dist-es/getAwsChunkedEncodingStream.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getAwsChunkedEncodingStream = /* @__PURE__ */ __name((readableStream, options) => {
  const { base64Encoder, bodyLengthChecker, checksumAlgorithmFn, checksumLocationName, streamHasher } = options;
  const checksumRequired = base64Encoder !== void 0 && bodyLengthChecker !== void 0 && checksumAlgorithmFn !== void 0 && checksumLocationName !== void 0 && streamHasher !== void 0;
  const digest = checksumRequired ? streamHasher(checksumAlgorithmFn, readableStream) : void 0;
  const reader = readableStream.getReader();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.enqueue(`0\r
`);
        if (checksumRequired) {
          const checksum = base64Encoder(await digest);
          controller.enqueue(`${checksumLocationName}:${checksum}\r
`);
          controller.enqueue(`\r
`);
        }
        controller.close();
      } else {
        controller.enqueue(`${(bodyLengthChecker(value) || 0).toString(16)}\r
${value}\r
`);
      }
    }
  });
}, "getAwsChunkedEncodingStream");

// node_modules/@smithy/util-stream/dist-es/headStream.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function headStream(stream, bytes) {
  let byteLengthCounter = 0;
  const chunks = [];
  const reader = stream.getReader();
  let isDone = false;
  while (!isDone) {
    const { done, value } = await reader.read();
    if (value) {
      chunks.push(value);
      byteLengthCounter += value?.byteLength ?? 0;
    }
    if (byteLengthCounter >= bytes) {
      break;
    }
    isDone = done;
  }
  reader.releaseLock();
  const collected = new Uint8Array(Math.min(bytes, byteLengthCounter));
  let offset = 0;
  for (const chunk of chunks) {
    if (chunk.byteLength > collected.byteLength - offset) {
      collected.set(chunk.subarray(0, collected.byteLength - offset), offset);
      break;
    } else {
      collected.set(chunk, offset);
    }
    offset += chunk.length;
  }
  return collected;
}
__name(headStream, "headStream");

// node_modules/@smithy/util-stream/dist-es/sdk-stream-mixin.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/fetch-http-handler/dist-es/fetch-http-handler.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/querystring-builder/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-uri-escape/dist-es/escape-uri.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var escapeUri = /* @__PURE__ */ __name((uri) => encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode), "escapeUri");
var hexEncode = /* @__PURE__ */ __name((c2) => `%${c2.charCodeAt(0).toString(16).toUpperCase()}`, "hexEncode");

// node_modules/@smithy/querystring-builder/dist-es/index.js
function buildQueryString(query) {
  const parts = [];
  for (let key of Object.keys(query).sort()) {
    const value = query[key];
    key = escapeUri(key);
    if (Array.isArray(value)) {
      for (let i2 = 0, iLen = value.length; i2 < iLen; i2++) {
        parts.push(`${key}=${escapeUri(value[i2])}`);
      }
    } else {
      let qsEntry = key;
      if (value || typeof value === "string") {
        qsEntry += `=${escapeUri(value)}`;
      }
      parts.push(qsEntry);
    }
  }
  return parts.join("&");
}
__name(buildQueryString, "buildQueryString");

// node_modules/@smithy/fetch-http-handler/dist-es/create-request.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function createRequest(url, requestOptions) {
  return new Request(url, requestOptions);
}
__name(createRequest, "createRequest");

// node_modules/@smithy/fetch-http-handler/dist-es/request-timeout.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function requestTimeout(timeoutInMs = 0) {
  return new Promise((resolve, reject) => {
    if (timeoutInMs) {
      setTimeout(() => {
        const timeoutError = new Error(`Request did not complete within ${timeoutInMs} ms`);
        timeoutError.name = "TimeoutError";
        reject(timeoutError);
      }, timeoutInMs);
    }
  });
}
__name(requestTimeout, "requestTimeout");

// node_modules/@smithy/fetch-http-handler/dist-es/fetch-http-handler.js
var keepAliveSupport = {
  supported: void 0
};
var FetchHttpHandler = class {
  config;
  configProvider;
  static create(instanceOrOptions) {
    if (typeof instanceOrOptions?.handle === "function") {
      return instanceOrOptions;
    }
    return new FetchHttpHandler(instanceOrOptions);
  }
  constructor(options) {
    if (typeof options === "function") {
      this.configProvider = options().then((opts) => opts || {});
    } else {
      this.config = options ?? {};
      this.configProvider = Promise.resolve(this.config);
    }
    if (keepAliveSupport.supported === void 0) {
      keepAliveSupport.supported = Boolean(typeof Request !== "undefined" && "keepalive" in createRequest("https://[::1]"));
    }
  }
  destroy() {
  }
  async handle(request, { abortSignal, requestTimeout: requestTimeout2 } = {}) {
    if (!this.config) {
      this.config = await this.configProvider;
    }
    const requestTimeoutInMs = requestTimeout2 ?? this.config.requestTimeout;
    const keepAlive = this.config.keepAlive === true;
    const credentials = this.config.credentials;
    if (abortSignal?.aborted) {
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";
      return Promise.reject(abortError);
    }
    let path = request.path;
    const queryString = buildQueryString(request.query || {});
    if (queryString) {
      path += `?${queryString}`;
    }
    if (request.fragment) {
      path += `#${request.fragment}`;
    }
    let auth = "";
    if (request.username != null || request.password != null) {
      const username = request.username ?? "";
      const password = request.password ?? "";
      auth = `${username}:${password}@`;
    }
    const { port, method } = request;
    const url = `${request.protocol}//${auth}${request.hostname}${port ? `:${port}` : ""}${path}`;
    const body = method === "GET" || method === "HEAD" ? void 0 : request.body;
    const requestOptions = {
      body,
      headers: new Headers(request.headers),
      method,
      credentials
    };
    if (this.config?.cache) {
      requestOptions.cache = this.config.cache;
    }
    if (body) {
      requestOptions.duplex = "half";
    }
    if (typeof AbortController !== "undefined") {
      requestOptions.signal = abortSignal;
    }
    if (keepAliveSupport.supported) {
      requestOptions.keepalive = keepAlive;
    }
    if (typeof this.config.requestInit === "function") {
      Object.assign(requestOptions, this.config.requestInit(request));
    }
    let removeSignalEventListener = /* @__PURE__ */ __name(() => {
    }, "removeSignalEventListener");
    const fetchRequest = createRequest(url, requestOptions);
    const raceOfPromises = [
      fetch(fetchRequest).then((response) => {
        const fetchHeaders = response.headers;
        const transformedHeaders = {};
        for (const pair of fetchHeaders.entries()) {
          transformedHeaders[pair[0]] = pair[1];
        }
        const hasReadableStream = response.body != void 0;
        if (!hasReadableStream) {
          return response.blob().then((body2) => ({
            response: new HttpResponse({
              headers: transformedHeaders,
              reason: response.statusText,
              statusCode: response.status,
              body: body2
            })
          }));
        }
        return {
          response: new HttpResponse({
            headers: transformedHeaders,
            reason: response.statusText,
            statusCode: response.status,
            body: response.body
          })
        };
      }),
      requestTimeout(requestTimeoutInMs)
    ];
    if (abortSignal) {
      raceOfPromises.push(new Promise((resolve, reject) => {
        const onAbort = /* @__PURE__ */ __name(() => {
          const abortError = new Error("Request aborted");
          abortError.name = "AbortError";
          reject(abortError);
        }, "onAbort");
        if (typeof abortSignal.addEventListener === "function") {
          const signal = abortSignal;
          signal.addEventListener("abort", onAbort, { once: true });
          removeSignalEventListener = /* @__PURE__ */ __name(() => signal.removeEventListener("abort", onAbort), "removeSignalEventListener");
        } else {
          abortSignal.onabort = onAbort;
        }
      }));
    }
    return Promise.race(raceOfPromises).finally(removeSignalEventListener);
  }
  updateHttpClientConfig(key, value) {
    this.config = void 0;
    this.configProvider = this.configProvider.then((config) => {
      config[key] = value;
      return config;
    });
  }
  httpHandlerConfigs() {
    return this.config ?? {};
  }
};
__name(FetchHttpHandler, "FetchHttpHandler");

// node_modules/@smithy/fetch-http-handler/dist-es/stream-collector.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var streamCollector = /* @__PURE__ */ __name(async (stream) => {
  if (typeof Blob === "function" && stream instanceof Blob || stream.constructor?.name === "Blob") {
    if (Blob.prototype.arrayBuffer !== void 0) {
      return new Uint8Array(await stream.arrayBuffer());
    }
    return collectBlob(stream);
  }
  return collectStream(stream);
}, "streamCollector");
async function collectBlob(blob) {
  const base64 = await readToBase64(blob);
  const arrayBuffer = fromBase64(base64);
  return new Uint8Array(arrayBuffer);
}
__name(collectBlob, "collectBlob");
async function collectStream(stream) {
  const chunks = [];
  const reader = stream.getReader();
  let isDone = false;
  let length = 0;
  while (!isDone) {
    const { done, value } = await reader.read();
    if (value) {
      chunks.push(value);
      length += value.length;
    }
    isDone = done;
  }
  const collected = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    collected.set(chunk, offset);
    offset += chunk.length;
  }
  return collected;
}
__name(collectStream, "collectStream");
function readToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.readyState !== 2) {
        return reject(new Error("Reader aborted too early"));
      }
      const result = reader.result ?? "";
      const commaIndex = result.indexOf(",");
      const dataOffset = commaIndex > -1 ? commaIndex + 1 : result.length;
      resolve(result.substring(dataOffset));
    };
    reader.onabort = () => reject(new Error("Read aborted"));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
__name(readToBase64, "readToBase64");

// node_modules/@smithy/util-hex-encoding/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var SHORT_TO_HEX = {};
var HEX_TO_SHORT = {};
for (let i2 = 0; i2 < 256; i2++) {
  let encodedByte = i2.toString(16).toLowerCase();
  if (encodedByte.length === 1) {
    encodedByte = `0${encodedByte}`;
  }
  SHORT_TO_HEX[i2] = encodedByte;
  HEX_TO_SHORT[encodedByte] = i2;
}
function fromHex(encoded) {
  if (encoded.length % 2 !== 0) {
    throw new Error("Hex encoded strings must have an even number length");
  }
  const out = new Uint8Array(encoded.length / 2);
  for (let i2 = 0; i2 < encoded.length; i2 += 2) {
    const encodedByte = encoded.slice(i2, i2 + 2).toLowerCase();
    if (encodedByte in HEX_TO_SHORT) {
      out[i2 / 2] = HEX_TO_SHORT[encodedByte];
    } else {
      throw new Error(`Cannot decode unrecognized sequence ${encodedByte} as hexadecimal`);
    }
  }
  return out;
}
__name(fromHex, "fromHex");
function toHex(bytes) {
  let out = "";
  for (let i2 = 0; i2 < bytes.byteLength; i2++) {
    out += SHORT_TO_HEX[bytes[i2]];
  }
  return out;
}
__name(toHex, "toHex");

// node_modules/@smithy/util-stream/dist-es/sdk-stream-mixin.browser.js
init_dist_es();
var ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED = "The stream has already been transformed.";
var sdkStreamMixin = /* @__PURE__ */ __name((stream) => {
  if (!isBlobInstance(stream) && !isReadableStream(stream)) {
    const name = stream?.__proto__?.constructor?.name || stream;
    throw new Error(`Unexpected stream implementation, expect Blob or ReadableStream, got ${name}`);
  }
  let transformed = false;
  const transformToByteArray = /* @__PURE__ */ __name(async () => {
    if (transformed) {
      throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
    }
    transformed = true;
    return await streamCollector(stream);
  }, "transformToByteArray");
  const blobToWebStream = /* @__PURE__ */ __name((blob) => {
    if (typeof blob.stream !== "function") {
      throw new Error("Cannot transform payload Blob to web stream. Please make sure the Blob.stream() is polyfilled.\nIf you are using React Native, this API is not yet supported, see: https://react-native.canny.io/feature-requests/p/fetch-streaming-body");
    }
    return blob.stream();
  }, "blobToWebStream");
  return Object.assign(stream, {
    transformToByteArray,
    transformToString: async (encoding) => {
      const buf = await transformToByteArray();
      if (encoding === "base64") {
        return toBase64(buf);
      } else if (encoding === "hex") {
        return toHex(buf);
      } else if (encoding === void 0 || encoding === "utf8" || encoding === "utf-8") {
        return toUtf8(buf);
      } else if (typeof TextDecoder === "function") {
        return new TextDecoder(encoding).decode(buf);
      } else {
        throw new Error("TextDecoder is not available, please make sure polyfill is provided.");
      }
    },
    transformToWebStream: () => {
      if (transformed) {
        throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
      }
      transformed = true;
      if (isBlobInstance(stream)) {
        return blobToWebStream(stream);
      } else if (isReadableStream(stream)) {
        return stream;
      } else {
        throw new Error(`Cannot transform payload to web stream, got ${stream}`);
      }
    }
  });
}, "sdkStreamMixin");
var isBlobInstance = /* @__PURE__ */ __name((stream) => typeof Blob === "function" && stream instanceof Blob, "isBlobInstance");

// node_modules/@smithy/util-stream/dist-es/splitStream.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function splitStream(stream) {
  if (typeof stream.stream === "function") {
    stream = stream.stream();
  }
  const readableStream = stream;
  return readableStream.tee();
}
__name(splitStream, "splitStream");

// node_modules/@smithy/core/dist-es/submodules/protocols/collect-stream-body.js
var collectBody = /* @__PURE__ */ __name(async (streamBody = new Uint8Array(), context) => {
  if (streamBody instanceof Uint8Array) {
    return Uint8ArrayBlobAdapter.mutate(streamBody);
  }
  if (!streamBody) {
    return Uint8ArrayBlobAdapter.mutate(new Uint8Array());
  }
  const fromContext = context.streamCollector(streamBody);
  return Uint8ArrayBlobAdapter.mutate(await fromContext);
}, "collectBody");

// node_modules/@smithy/core/dist-es/submodules/protocols/extended-encode-uri-component.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function extendedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c2) {
    return "%" + c2.charCodeAt(0).toString(16).toUpperCase();
  });
}
__name(extendedEncodeURIComponent, "extendedEncodeURIComponent");

// node_modules/@smithy/core/dist-es/submodules/protocols/HttpBindingProtocol.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/core/dist-es/submodules/schema/deref.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var deref = /* @__PURE__ */ __name((schemaRef) => {
  if (typeof schemaRef === "function") {
    return schemaRef();
  }
  return schemaRef;
}, "deref");

// node_modules/@smithy/core/dist-es/submodules/schema/middleware/getSchemaSerdePlugin.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/core/dist-es/submodules/schema/middleware/schemaDeserializationMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/operation.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var operation = /* @__PURE__ */ __name((namespace, name, traits, input, output) => ({
  name,
  namespace,
  traits,
  input,
  output
}), "operation");

// node_modules/@smithy/core/dist-es/submodules/schema/middleware/schemaDeserializationMiddleware.js
var schemaDeserializationMiddleware = /* @__PURE__ */ __name((config) => (next, context) => async (args) => {
  const { response } = await next(args);
  const { operationSchema } = getSmithyContext(context);
  const [, ns2, n2, t2, i2, o2] = operationSchema ?? [];
  try {
    const parsed = await config.protocol.deserializeResponse(operation(ns2, n2, t2, i2, o2), {
      ...config,
      ...context
    }, response);
    return {
      response,
      output: parsed
    };
  } catch (error) {
    Object.defineProperty(error, "$response", {
      value: response,
      enumerable: false,
      writable: false,
      configurable: false
    });
    if (!("$metadata" in error)) {
      const hint = `Deserialization error: to see the raw response, inspect the hidden field {error}.$response on this object.`;
      try {
        error.message += "\n  " + hint;
      } catch (e2) {
        if (!context.logger || context.logger?.constructor?.name === "NoOpLogger") {
          console.warn(hint);
        } else {
          context.logger?.warn?.(hint);
        }
      }
      if (typeof error.$responseBodyText !== "undefined") {
        if (error.$response) {
          error.$response.body = error.$responseBodyText;
        }
      }
      try {
        if (HttpResponse.isInstance(response)) {
          const { headers = {} } = response;
          const headerEntries = Object.entries(headers);
          error.$metadata = {
            httpStatusCode: response.statusCode,
            requestId: findHeader(/^x-[\w-]+-request-?id$/, headerEntries),
            extendedRequestId: findHeader(/^x-[\w-]+-id-2$/, headerEntries),
            cfId: findHeader(/^x-[\w-]+-cf-id$/, headerEntries)
          };
        }
      } catch (e2) {
      }
    }
    throw error;
  }
}, "schemaDeserializationMiddleware");
var findHeader = /* @__PURE__ */ __name((pattern, headers) => {
  return (headers.find(([k2]) => {
    return k2.match(pattern);
  }) || [void 0, void 0])[1];
}, "findHeader");

// node_modules/@smithy/core/dist-es/submodules/schema/middleware/schemaSerializationMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var schemaSerializationMiddleware = /* @__PURE__ */ __name((config) => (next, context) => async (args) => {
  const { operationSchema } = getSmithyContext(context);
  const [, ns2, n2, t2, i2, o2] = operationSchema ?? [];
  const endpoint = context.endpointV2?.url && config.urlParser ? async () => config.urlParser(context.endpointV2.url) : config.endpoint;
  const request = await config.protocol.serializeRequest(operation(ns2, n2, t2, i2, o2), args.input, {
    ...config,
    ...context,
    endpoint
  });
  return next({
    ...args,
    request
  });
}, "schemaSerializationMiddleware");

// node_modules/@smithy/core/dist-es/submodules/schema/middleware/getSchemaSerdePlugin.js
var deserializerMiddlewareOption = {
  name: "deserializerMiddleware",
  step: "deserialize",
  tags: ["DESERIALIZER"],
  override: true
};
var serializerMiddlewareOption2 = {
  name: "serializerMiddleware",
  step: "serialize",
  tags: ["SERIALIZER"],
  override: true
};
function getSchemaSerdePlugin(config) {
  return {
    applyToStack: (commandStack) => {
      commandStack.add(schemaSerializationMiddleware(config), serializerMiddlewareOption2);
      commandStack.add(schemaDeserializationMiddleware(config), deserializerMiddlewareOption);
      config.protocol.setSerdeContext(config);
    }
  };
}
__name(getSchemaSerdePlugin, "getSchemaSerdePlugin");

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/translateTraits.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function translateTraits(indicator) {
  if (typeof indicator === "object") {
    return indicator;
  }
  indicator = indicator | 0;
  const traits = {};
  let i2 = 0;
  for (const trait of [
    "httpLabel",
    "idempotent",
    "idempotencyToken",
    "sensitive",
    "httpPayload",
    "httpResponseCode",
    "httpQueryParams"
  ]) {
    if ((indicator >> i2++ & 1) === 1) {
      traits[trait] = 1;
    }
  }
  return traits;
}
__name(translateTraits, "translateTraits");

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js
var _NormalizedSchema = class {
  ref;
  memberName;
  symbol = _NormalizedSchema.symbol;
  name;
  schema;
  _isMemberSchema;
  traits;
  memberTraits;
  normalizedTraits;
  constructor(ref, memberName) {
    this.ref = ref;
    this.memberName = memberName;
    const traitStack = [];
    let _ref = ref;
    let schema = ref;
    this._isMemberSchema = false;
    while (isMemberSchema(_ref)) {
      traitStack.push(_ref[1]);
      _ref = _ref[0];
      schema = deref(_ref);
      this._isMemberSchema = true;
    }
    if (traitStack.length > 0) {
      this.memberTraits = {};
      for (let i2 = traitStack.length - 1; i2 >= 0; --i2) {
        const traitSet = traitStack[i2];
        Object.assign(this.memberTraits, translateTraits(traitSet));
      }
    } else {
      this.memberTraits = 0;
    }
    if (schema instanceof _NormalizedSchema) {
      const computedMemberTraits = this.memberTraits;
      Object.assign(this, schema);
      this.memberTraits = Object.assign({}, computedMemberTraits, schema.getMemberTraits(), this.getMemberTraits());
      this.normalizedTraits = void 0;
      this.memberName = memberName ?? schema.memberName;
      return;
    }
    this.schema = deref(schema);
    if (isStaticSchema(this.schema)) {
      this.name = `${this.schema[1]}#${this.schema[2]}`;
      this.traits = this.schema[3];
    } else {
      this.name = this.memberName ?? String(schema);
      this.traits = 0;
    }
    if (this._isMemberSchema && !memberName) {
      throw new Error(`@smithy/core/schema - NormalizedSchema member init ${this.getName(true)} missing member name.`);
    }
  }
  static [Symbol.hasInstance](lhs) {
    const isPrototype = this.prototype.isPrototypeOf(lhs);
    if (!isPrototype && typeof lhs === "object" && lhs !== null) {
      const ns2 = lhs;
      return ns2.symbol === this.symbol;
    }
    return isPrototype;
  }
  static of(ref) {
    const sc = deref(ref);
    if (sc instanceof _NormalizedSchema) {
      return sc;
    }
    if (isMemberSchema(sc)) {
      const [ns2, traits] = sc;
      if (ns2 instanceof _NormalizedSchema) {
        Object.assign(ns2.getMergedTraits(), translateTraits(traits));
        return ns2;
      }
      throw new Error(`@smithy/core/schema - may not init unwrapped member schema=${JSON.stringify(ref, null, 2)}.`);
    }
    return new _NormalizedSchema(sc);
  }
  getSchema() {
    const sc = this.schema;
    if (sc[0] === 0) {
      return sc[4];
    }
    return sc;
  }
  getName(withNamespace = false) {
    const { name } = this;
    const short = !withNamespace && name && name.includes("#");
    return short ? name.split("#")[1] : name || void 0;
  }
  getMemberName() {
    return this.memberName;
  }
  isMemberSchema() {
    return this._isMemberSchema;
  }
  isListSchema() {
    const sc = this.getSchema();
    return typeof sc === "number" ? sc >= 64 && sc < 128 : sc[0] === 1;
  }
  isMapSchema() {
    const sc = this.getSchema();
    return typeof sc === "number" ? sc >= 128 && sc <= 255 : sc[0] === 2;
  }
  isStructSchema() {
    const sc = this.getSchema();
    return sc[0] === 3 || sc[0] === -3;
  }
  isBlobSchema() {
    const sc = this.getSchema();
    return sc === 21 || sc === 42;
  }
  isTimestampSchema() {
    const sc = this.getSchema();
    return typeof sc === "number" && sc >= 4 && sc <= 7;
  }
  isUnitSchema() {
    return this.getSchema() === "unit";
  }
  isDocumentSchema() {
    return this.getSchema() === 15;
  }
  isStringSchema() {
    return this.getSchema() === 0;
  }
  isBooleanSchema() {
    return this.getSchema() === 2;
  }
  isNumericSchema() {
    return this.getSchema() === 1;
  }
  isBigIntegerSchema() {
    return this.getSchema() === 17;
  }
  isBigDecimalSchema() {
    return this.getSchema() === 19;
  }
  isStreaming() {
    const { streaming } = this.getMergedTraits();
    return !!streaming || this.getSchema() === 42;
  }
  isIdempotencyToken() {
    const match = /* @__PURE__ */ __name((traits2) => (traits2 & 4) === 4 || !!traits2?.idempotencyToken, "match");
    const { normalizedTraits, traits, memberTraits } = this;
    return match(normalizedTraits) || match(traits) || match(memberTraits);
  }
  getMergedTraits() {
    return this.normalizedTraits ?? (this.normalizedTraits = {
      ...this.getOwnTraits(),
      ...this.getMemberTraits()
    });
  }
  getMemberTraits() {
    return translateTraits(this.memberTraits);
  }
  getOwnTraits() {
    return translateTraits(this.traits);
  }
  getKeySchema() {
    const [isDoc, isMap] = [this.isDocumentSchema(), this.isMapSchema()];
    if (!isDoc && !isMap) {
      throw new Error(`@smithy/core/schema - cannot get key for non-map: ${this.getName(true)}`);
    }
    const schema = this.getSchema();
    const memberSchema = isDoc ? 15 : schema[4] ?? 0;
    return member([memberSchema, 0], "key");
  }
  getValueSchema() {
    const sc = this.getSchema();
    const [isDoc, isMap, isList] = [this.isDocumentSchema(), this.isMapSchema(), this.isListSchema()];
    const memberSchema = typeof sc === "number" ? 63 & sc : sc && typeof sc === "object" && (isMap || isList) ? sc[3 + sc[0]] : isDoc ? 15 : void 0;
    if (memberSchema != null) {
      return member([memberSchema, 0], isMap ? "value" : "member");
    }
    throw new Error(`@smithy/core/schema - ${this.getName(true)} has no value member.`);
  }
  getMemberSchema(memberName) {
    const struct = this.getSchema();
    if (this.isStructSchema() && struct[4].includes(memberName)) {
      const i2 = struct[4].indexOf(memberName);
      const memberSchema = struct[5][i2];
      return member(isMemberSchema(memberSchema) ? memberSchema : [memberSchema, 0], memberName);
    }
    if (this.isDocumentSchema()) {
      return member([15, 0], memberName);
    }
    throw new Error(`@smithy/core/schema - ${this.getName(true)} has no no member=${memberName}.`);
  }
  getMemberSchemas() {
    const buffer = {};
    try {
      for (const [k2, v3] of this.structIterator()) {
        buffer[k2] = v3;
      }
    } catch (ignored) {
    }
    return buffer;
  }
  getEventStreamMember() {
    if (this.isStructSchema()) {
      for (const [memberName, memberSchema] of this.structIterator()) {
        if (memberSchema.isStreaming() && memberSchema.isStructSchema()) {
          return memberName;
        }
      }
    }
    return "";
  }
  *structIterator() {
    if (this.isUnitSchema()) {
      return;
    }
    if (!this.isStructSchema()) {
      throw new Error("@smithy/core/schema - cannot iterate non-struct schema.");
    }
    const struct = this.getSchema();
    for (let i2 = 0; i2 < struct[4].length; ++i2) {
      yield [struct[4][i2], member([struct[5][i2], 0], struct[4][i2])];
    }
  }
};
var NormalizedSchema = _NormalizedSchema;
__name(NormalizedSchema, "NormalizedSchema");
__publicField(NormalizedSchema, "symbol", Symbol.for("@smithy/nor"));
function member(memberSchema, memberName) {
  if (memberSchema instanceof NormalizedSchema) {
    return Object.assign(memberSchema, {
      memberName,
      _isMemberSchema: true
    });
  }
  const internalCtorAccess = NormalizedSchema;
  return new internalCtorAccess(memberSchema, memberName);
}
__name(member, "member");
var isMemberSchema = /* @__PURE__ */ __name((sc) => Array.isArray(sc) && sc.length === 2, "isMemberSchema");
var isStaticSchema = /* @__PURE__ */ __name((sc) => Array.isArray(sc) && sc.length >= 5, "isStaticSchema");

// node_modules/@smithy/core/dist-es/submodules/schema/TypeRegistry.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var _TypeRegistry = class {
  namespace;
  schemas;
  exceptions;
  constructor(namespace, schemas = /* @__PURE__ */ new Map(), exceptions = /* @__PURE__ */ new Map()) {
    this.namespace = namespace;
    this.schemas = schemas;
    this.exceptions = exceptions;
  }
  static for(namespace) {
    if (!_TypeRegistry.registries.has(namespace)) {
      _TypeRegistry.registries.set(namespace, new _TypeRegistry(namespace));
    }
    return _TypeRegistry.registries.get(namespace);
  }
  register(shapeId, schema) {
    const qualifiedName = this.normalizeShapeId(shapeId);
    const registry = _TypeRegistry.for(qualifiedName.split("#")[0]);
    registry.schemas.set(qualifiedName, schema);
  }
  getSchema(shapeId) {
    const id = this.normalizeShapeId(shapeId);
    if (!this.schemas.has(id)) {
      throw new Error(`@smithy/core/schema - schema not found for ${id}`);
    }
    return this.schemas.get(id);
  }
  registerError(es2, ctor) {
    const $error = es2;
    const registry = _TypeRegistry.for($error[1]);
    registry.schemas.set($error[1] + "#" + $error[2], $error);
    registry.exceptions.set($error, ctor);
  }
  getErrorCtor(es2) {
    const $error = es2;
    const registry = _TypeRegistry.for($error[1]);
    return registry.exceptions.get($error);
  }
  getBaseException() {
    for (const exceptionKey of this.exceptions.keys()) {
      if (Array.isArray(exceptionKey)) {
        const [, ns2, name] = exceptionKey;
        const id = ns2 + "#" + name;
        if (id.startsWith("smithy.ts.sdk.synthetic.") && id.endsWith("ServiceException")) {
          return exceptionKey;
        }
      }
    }
    return void 0;
  }
  find(predicate) {
    return [...this.schemas.values()].find(predicate);
  }
  clear() {
    this.schemas.clear();
    this.exceptions.clear();
  }
  normalizeShapeId(shapeId) {
    if (shapeId.includes("#")) {
      return shapeId;
    }
    return this.namespace + "#" + shapeId;
  }
};
var TypeRegistry = _TypeRegistry;
__name(TypeRegistry, "TypeRegistry");
__publicField(TypeRegistry, "registries", /* @__PURE__ */ new Map());

// node_modules/@smithy/core/dist-es/submodules/serde/date-utils.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/core/dist-es/submodules/serde/parse-utils.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var expectNumber = /* @__PURE__ */ __name((value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      if (String(parsed) !== String(value)) {
        logger.warn(stackTraceWarning(`Expected number but observed string: ${value}`));
      }
      return parsed;
    }
  }
  if (typeof value === "number") {
    return value;
  }
  throw new TypeError(`Expected number, got ${typeof value}: ${value}`);
}, "expectNumber");
var MAX_FLOAT = Math.ceil(2 ** 127 * (2 - 2 ** -23));
var expectFloat32 = /* @__PURE__ */ __name((value) => {
  const expected = expectNumber(value);
  if (expected !== void 0 && !Number.isNaN(expected) && expected !== Infinity && expected !== -Infinity) {
    if (Math.abs(expected) > MAX_FLOAT) {
      throw new TypeError(`Expected 32-bit float, got ${value}`);
    }
  }
  return expected;
}, "expectFloat32");
var expectLong = /* @__PURE__ */ __name((value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  if (Number.isInteger(value) && !Number.isNaN(value)) {
    return value;
  }
  throw new TypeError(`Expected integer, got ${typeof value}: ${value}`);
}, "expectLong");
var expectShort = /* @__PURE__ */ __name((value) => expectSizedInt(value, 16), "expectShort");
var expectByte = /* @__PURE__ */ __name((value) => expectSizedInt(value, 8), "expectByte");
var expectSizedInt = /* @__PURE__ */ __name((value, size) => {
  const expected = expectLong(value);
  if (expected !== void 0 && castInt(expected, size) !== expected) {
    throw new TypeError(`Expected ${size}-bit integer, got ${value}`);
  }
  return expected;
}, "expectSizedInt");
var castInt = /* @__PURE__ */ __name((value, size) => {
  switch (size) {
    case 32:
      return Int32Array.of(value)[0];
    case 16:
      return Int16Array.of(value)[0];
    case 8:
      return Int8Array.of(value)[0];
  }
}, "castInt");
var strictParseFloat32 = /* @__PURE__ */ __name((value) => {
  if (typeof value == "string") {
    return expectFloat32(parseNumber(value));
  }
  return expectFloat32(value);
}, "strictParseFloat32");
var NUMBER_REGEX = /(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)|(-?Infinity)|(NaN)/g;
var parseNumber = /* @__PURE__ */ __name((value) => {
  const matches = value.match(NUMBER_REGEX);
  if (matches === null || matches[0].length !== value.length) {
    throw new TypeError(`Expected real number, got implicit NaN`);
  }
  return parseFloat(value);
}, "parseNumber");
var strictParseShort = /* @__PURE__ */ __name((value) => {
  if (typeof value === "string") {
    return expectShort(parseNumber(value));
  }
  return expectShort(value);
}, "strictParseShort");
var strictParseByte = /* @__PURE__ */ __name((value) => {
  if (typeof value === "string") {
    return expectByte(parseNumber(value));
  }
  return expectByte(value);
}, "strictParseByte");
var stackTraceWarning = /* @__PURE__ */ __name((message) => {
  return String(new TypeError(message).stack || message).split("\n").slice(0, 5).filter((s2) => !s2.includes("stackTraceWarning")).join("\n");
}, "stackTraceWarning");
var logger = {
  warn: console.warn
};

// node_modules/@smithy/core/dist-es/submodules/serde/date-utils.js
var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dateToUtcString(date2) {
  const year2 = date2.getUTCFullYear();
  const month = date2.getUTCMonth();
  const dayOfWeek = date2.getUTCDay();
  const dayOfMonthInt = date2.getUTCDate();
  const hoursInt = date2.getUTCHours();
  const minutesInt = date2.getUTCMinutes();
  const secondsInt = date2.getUTCSeconds();
  const dayOfMonthString = dayOfMonthInt < 10 ? `0${dayOfMonthInt}` : `${dayOfMonthInt}`;
  const hoursString = hoursInt < 10 ? `0${hoursInt}` : `${hoursInt}`;
  const minutesString = minutesInt < 10 ? `0${minutesInt}` : `${minutesInt}`;
  const secondsString = secondsInt < 10 ? `0${secondsInt}` : `${secondsInt}`;
  return `${DAYS[dayOfWeek]}, ${dayOfMonthString} ${MONTHS[month]} ${year2} ${hoursString}:${minutesString}:${secondsString} GMT`;
}
__name(dateToUtcString, "dateToUtcString");
var RFC3339 = new RegExp(/^(\d{4})-(\d{2})-(\d{2})[tT](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?[zZ]$/);
var RFC3339_WITH_OFFSET = new RegExp(/^(\d{4})-(\d{2})-(\d{2})[tT](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(([-+]\d{2}\:\d{2})|[zZ])$/);
var IMF_FIXDATE = new RegExp(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? GMT$/);
var RFC_850_DATE = new RegExp(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? GMT$/);
var ASC_TIME = new RegExp(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( [1-9]|\d{2}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? (\d{4})$/);
var parseRfc7231DateTime = /* @__PURE__ */ __name((value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  if (typeof value !== "string") {
    throw new TypeError("RFC-7231 date-times must be expressed as strings");
  }
  let match = IMF_FIXDATE.exec(value);
  if (match) {
    const [_2, dayStr, monthStr, yearStr, hours, minutes, seconds, fractionalMilliseconds] = match;
    return buildDate(strictParseShort(stripLeadingZeroes(yearStr)), parseMonthByShortName(monthStr), parseDateValue(dayStr, "day", 1, 31), { hours, minutes, seconds, fractionalMilliseconds });
  }
  match = RFC_850_DATE.exec(value);
  if (match) {
    const [_2, dayStr, monthStr, yearStr, hours, minutes, seconds, fractionalMilliseconds] = match;
    return adjustRfc850Year(buildDate(parseTwoDigitYear(yearStr), parseMonthByShortName(monthStr), parseDateValue(dayStr, "day", 1, 31), {
      hours,
      minutes,
      seconds,
      fractionalMilliseconds
    }));
  }
  match = ASC_TIME.exec(value);
  if (match) {
    const [_2, monthStr, dayStr, hours, minutes, seconds, fractionalMilliseconds, yearStr] = match;
    return buildDate(strictParseShort(stripLeadingZeroes(yearStr)), parseMonthByShortName(monthStr), parseDateValue(dayStr.trimLeft(), "day", 1, 31), { hours, minutes, seconds, fractionalMilliseconds });
  }
  throw new TypeError("Invalid RFC-7231 date-time value");
}, "parseRfc7231DateTime");
var buildDate = /* @__PURE__ */ __name((year2, month, day, time2) => {
  const adjustedMonth = month - 1;
  validateDayOfMonth(year2, adjustedMonth, day);
  return new Date(Date.UTC(year2, adjustedMonth, day, parseDateValue(time2.hours, "hour", 0, 23), parseDateValue(time2.minutes, "minute", 0, 59), parseDateValue(time2.seconds, "seconds", 0, 60), parseMilliseconds(time2.fractionalMilliseconds)));
}, "buildDate");
var parseTwoDigitYear = /* @__PURE__ */ __name((value) => {
  const thisYear = (/* @__PURE__ */ new Date()).getUTCFullYear();
  const valueInThisCentury = Math.floor(thisYear / 100) * 100 + strictParseShort(stripLeadingZeroes(value));
  if (valueInThisCentury < thisYear) {
    return valueInThisCentury + 100;
  }
  return valueInThisCentury;
}, "parseTwoDigitYear");
var FIFTY_YEARS_IN_MILLIS = 50 * 365 * 24 * 60 * 60 * 1e3;
var adjustRfc850Year = /* @__PURE__ */ __name((input) => {
  if (input.getTime() - (/* @__PURE__ */ new Date()).getTime() > FIFTY_YEARS_IN_MILLIS) {
    return new Date(Date.UTC(input.getUTCFullYear() - 100, input.getUTCMonth(), input.getUTCDate(), input.getUTCHours(), input.getUTCMinutes(), input.getUTCSeconds(), input.getUTCMilliseconds()));
  }
  return input;
}, "adjustRfc850Year");
var parseMonthByShortName = /* @__PURE__ */ __name((value) => {
  const monthIdx = MONTHS.indexOf(value);
  if (monthIdx < 0) {
    throw new TypeError(`Invalid month: ${value}`);
  }
  return monthIdx + 1;
}, "parseMonthByShortName");
var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var validateDayOfMonth = /* @__PURE__ */ __name((year2, month, day) => {
  let maxDays = DAYS_IN_MONTH[month];
  if (month === 1 && isLeapYear(year2)) {
    maxDays = 29;
  }
  if (day > maxDays) {
    throw new TypeError(`Invalid day for ${MONTHS[month]} in ${year2}: ${day}`);
  }
}, "validateDayOfMonth");
var isLeapYear = /* @__PURE__ */ __name((year2) => {
  return year2 % 4 === 0 && (year2 % 100 !== 0 || year2 % 400 === 0);
}, "isLeapYear");
var parseDateValue = /* @__PURE__ */ __name((value, type, lower, upper) => {
  const dateVal = strictParseByte(stripLeadingZeroes(value));
  if (dateVal < lower || dateVal > upper) {
    throw new TypeError(`${type} must be between ${lower} and ${upper}, inclusive`);
  }
  return dateVal;
}, "parseDateValue");
var parseMilliseconds = /* @__PURE__ */ __name((value) => {
  if (value === null || value === void 0) {
    return 0;
  }
  return strictParseFloat32("0." + value) * 1e3;
}, "parseMilliseconds");
var stripLeadingZeroes = /* @__PURE__ */ __name((value) => {
  let idx = 0;
  while (idx < value.length - 1 && value.charAt(idx) === "0") {
    idx++;
  }
  if (idx === 0) {
    return value;
  }
  return value.slice(idx);
}, "stripLeadingZeroes");

// node_modules/@smithy/core/dist-es/submodules/serde/generateIdempotencyToken.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/uuid/dist-es/v4.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/uuid/dist-es/randomUUID.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);

// node_modules/@smithy/uuid/dist-es/v4.js
var decimalToHex = Array.from({ length: 256 }, (_2, i2) => i2.toString(16).padStart(2, "0"));
var v4 = /* @__PURE__ */ __name(() => {
  if (randomUUID) {
    return randomUUID();
  }
  const rnds = new Uint8Array(16);
  crypto.getRandomValues(rnds);
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  return decimalToHex[rnds[0]] + decimalToHex[rnds[1]] + decimalToHex[rnds[2]] + decimalToHex[rnds[3]] + "-" + decimalToHex[rnds[4]] + decimalToHex[rnds[5]] + "-" + decimalToHex[rnds[6]] + decimalToHex[rnds[7]] + "-" + decimalToHex[rnds[8]] + decimalToHex[rnds[9]] + "-" + decimalToHex[rnds[10]] + decimalToHex[rnds[11]] + decimalToHex[rnds[12]] + decimalToHex[rnds[13]] + decimalToHex[rnds[14]] + decimalToHex[rnds[15]];
}, "v4");

// node_modules/@smithy/core/dist-es/submodules/serde/lazy-json.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var LazyJsonString = /* @__PURE__ */ __name(function LazyJsonString2(val) {
  const str = Object.assign(new String(val), {
    deserializeJSON() {
      return JSON.parse(String(val));
    },
    toString() {
      return String(val);
    },
    toJSON() {
      return String(val);
    }
  });
  return str;
}, "LazyJsonString");
LazyJsonString.from = (object) => {
  if (object && typeof object === "object" && (object instanceof LazyJsonString || "deserializeJSON" in object)) {
    return object;
  } else if (typeof object === "string" || Object.getPrototypeOf(object) === String.prototype) {
    return LazyJsonString(String(object));
  }
  return LazyJsonString(JSON.stringify(object));
};
LazyJsonString.fromObject = LazyJsonString.from;

// node_modules/@smithy/core/dist-es/submodules/serde/quote-header.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function quoteHeader(part) {
  if (part.includes(",") || part.includes('"')) {
    part = `"${part.replace(/"/g, '\\"')}"`;
  }
  return part;
}
__name(quoteHeader, "quoteHeader");

// node_modules/@smithy/core/dist-es/submodules/serde/schema-serde-lib/schema-date-utils.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var ddd = `(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:[ne|u?r]?s?day)?`;
var mmm = `(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)`;
var time = `(\\d?\\d):(\\d{2}):(\\d{2})(?:\\.(\\d+))?`;
var date = `(\\d?\\d)`;
var year = `(\\d{4})`;
var RFC3339_WITH_OFFSET2 = new RegExp(/^(\d{4})-(\d\d)-(\d\d)[tT](\d\d):(\d\d):(\d\d)(\.(\d+))?(([-+]\d\d:\d\d)|[zZ])$/);
var IMF_FIXDATE2 = new RegExp(`^${ddd}, ${date} ${mmm} ${year} ${time} GMT$`);
var RFC_850_DATE2 = new RegExp(`^${ddd}, ${date}-${mmm}-(\\d\\d) ${time} GMT$`);
var ASC_TIME2 = new RegExp(`^${ddd} ${mmm} ( [1-9]|\\d\\d) ${time} ${year}$`);
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var _parseEpochTimestamp = /* @__PURE__ */ __name((value) => {
  if (value == null) {
    return void 0;
  }
  let num = NaN;
  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string") {
    if (!/^-?\d*\.?\d+$/.test(value)) {
      throw new TypeError(`parseEpochTimestamp - numeric string invalid.`);
    }
    num = Number.parseFloat(value);
  } else if (typeof value === "object" && value.tag === 1) {
    num = value.value;
  }
  if (isNaN(num) || Math.abs(num) === Infinity) {
    throw new TypeError("Epoch timestamps must be valid finite numbers.");
  }
  return new Date(Math.round(num * 1e3));
}, "_parseEpochTimestamp");
var _parseRfc3339DateTimeWithOffset = /* @__PURE__ */ __name((value) => {
  if (value == null) {
    return void 0;
  }
  if (typeof value !== "string") {
    throw new TypeError("RFC3339 timestamps must be strings");
  }
  const matches = RFC3339_WITH_OFFSET2.exec(value);
  if (!matches) {
    throw new TypeError(`Invalid RFC3339 timestamp format ${value}`);
  }
  const [, yearStr, monthStr, dayStr, hours, minutes, seconds, , ms2, offsetStr] = matches;
  range(monthStr, 1, 12);
  range(dayStr, 1, 31);
  range(hours, 0, 23);
  range(minutes, 0, 59);
  range(seconds, 0, 60);
  const date2 = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr), Number(hours), Number(minutes), Number(seconds), Number(ms2) ? Math.round(parseFloat(`0.${ms2}`) * 1e3) : 0));
  date2.setUTCFullYear(Number(yearStr));
  if (offsetStr.toUpperCase() != "Z") {
    const [, sign, offsetH, offsetM] = /([+-])(\d\d):(\d\d)/.exec(offsetStr) || [void 0, "+", 0, 0];
    const scalar = sign === "-" ? 1 : -1;
    date2.setTime(date2.getTime() + scalar * (Number(offsetH) * 60 * 60 * 1e3 + Number(offsetM) * 60 * 1e3));
  }
  return date2;
}, "_parseRfc3339DateTimeWithOffset");
var _parseRfc7231DateTime = /* @__PURE__ */ __name((value) => {
  if (value == null) {
    return void 0;
  }
  if (typeof value !== "string") {
    throw new TypeError("RFC7231 timestamps must be strings.");
  }
  let day;
  let month;
  let year2;
  let hour;
  let minute;
  let second;
  let fraction;
  let matches;
  if (matches = IMF_FIXDATE2.exec(value)) {
    [, day, month, year2, hour, minute, second, fraction] = matches;
  } else if (matches = RFC_850_DATE2.exec(value)) {
    [, day, month, year2, hour, minute, second, fraction] = matches;
    year2 = (Number(year2) + 1900).toString();
  } else if (matches = ASC_TIME2.exec(value)) {
    [, month, day, hour, minute, second, fraction, year2] = matches;
  }
  if (year2 && second) {
    const timestamp = Date.UTC(Number(year2), months.indexOf(month), Number(day), Number(hour), Number(minute), Number(second), fraction ? Math.round(parseFloat(`0.${fraction}`) * 1e3) : 0);
    range(day, 1, 31);
    range(hour, 0, 23);
    range(minute, 0, 59);
    range(second, 0, 60);
    const date2 = new Date(timestamp);
    date2.setUTCFullYear(Number(year2));
    return date2;
  }
  throw new TypeError(`Invalid RFC7231 date-time value ${value}.`);
}, "_parseRfc7231DateTime");
function range(v3, min, max) {
  const _v = Number(v3);
  if (_v < min || _v > max) {
    throw new Error(`Value ${_v} out of range [${min}, ${max}]`);
  }
}
__name(range, "range");

// node_modules/@smithy/core/dist-es/submodules/serde/split-every.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function splitEvery(value, delimiter, numDelimiters) {
  if (numDelimiters <= 0 || !Number.isInteger(numDelimiters)) {
    throw new Error("Invalid number of delimiters (" + numDelimiters + ") for splitEvery.");
  }
  const segments = value.split(delimiter);
  if (numDelimiters === 1) {
    return segments;
  }
  const compoundSegments = [];
  let currentSegment = "";
  for (let i2 = 0; i2 < segments.length; i2++) {
    if (currentSegment === "") {
      currentSegment = segments[i2];
    } else {
      currentSegment += delimiter + segments[i2];
    }
    if ((i2 + 1) % numDelimiters === 0) {
      compoundSegments.push(currentSegment);
      currentSegment = "";
    }
  }
  if (currentSegment !== "") {
    compoundSegments.push(currentSegment);
  }
  return compoundSegments;
}
__name(splitEvery, "splitEvery");

// node_modules/@smithy/core/dist-es/submodules/serde/split-header.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var splitHeader = /* @__PURE__ */ __name((value) => {
  const z3 = value.length;
  const values = [];
  let withinQuotes = false;
  let prevChar = void 0;
  let anchor = 0;
  for (let i2 = 0; i2 < z3; ++i2) {
    const char = value[i2];
    switch (char) {
      case `"`:
        if (prevChar !== "\\") {
          withinQuotes = !withinQuotes;
        }
        break;
      case ",":
        if (!withinQuotes) {
          values.push(value.slice(anchor, i2));
          anchor = i2 + 1;
        }
        break;
      default:
    }
    prevChar = char;
  }
  values.push(value.slice(anchor));
  return values.map((v3) => {
    v3 = v3.trim();
    const z4 = v3.length;
    if (z4 < 2) {
      return v3;
    }
    if (v3[0] === `"` && v3[z4 - 1] === `"`) {
      v3 = v3.slice(1, z4 - 1);
    }
    return v3.replace(/\\"/g, '"');
  });
}, "splitHeader");

// node_modules/@smithy/core/dist-es/submodules/serde/value/NumericValue.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var format = /^-?\d*(\.\d+)?$/;
var NumericValue = class {
  string;
  type;
  constructor(string, type) {
    this.string = string;
    this.type = type;
    if (!format.test(string)) {
      throw new Error(`@smithy/core/serde - NumericValue must only contain [0-9], at most one decimal point ".", and an optional negation prefix "-".`);
    }
  }
  toString() {
    return this.string;
  }
  static [Symbol.hasInstance](object) {
    if (!object || typeof object !== "object") {
      return false;
    }
    const _nv = object;
    return NumericValue.prototype.isPrototypeOf(object) || _nv.type === "bigDecimal" && format.test(_nv.string);
  }
};
__name(NumericValue, "NumericValue");

// node_modules/@smithy/core/dist-es/submodules/protocols/HttpProtocol.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/core/dist-es/submodules/protocols/SerdeContext.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var SerdeContext = class {
  serdeContext;
  setSerdeContext(serdeContext) {
    this.serdeContext = serdeContext;
  }
};
__name(SerdeContext, "SerdeContext");

// node_modules/@smithy/core/dist-es/submodules/protocols/HttpProtocol.js
var HttpProtocol = class extends SerdeContext {
  options;
  constructor(options) {
    super();
    this.options = options;
  }
  getRequestType() {
    return HttpRequest;
  }
  getResponseType() {
    return HttpResponse;
  }
  setSerdeContext(serdeContext) {
    this.serdeContext = serdeContext;
    this.serializer.setSerdeContext(serdeContext);
    this.deserializer.setSerdeContext(serdeContext);
    if (this.getPayloadCodec()) {
      this.getPayloadCodec().setSerdeContext(serdeContext);
    }
  }
  updateServiceEndpoint(request, endpoint) {
    if ("url" in endpoint) {
      request.protocol = endpoint.url.protocol;
      request.hostname = endpoint.url.hostname;
      request.port = endpoint.url.port ? Number(endpoint.url.port) : void 0;
      request.path = endpoint.url.pathname;
      request.fragment = endpoint.url.hash || void 0;
      request.username = endpoint.url.username || void 0;
      request.password = endpoint.url.password || void 0;
      if (!request.query) {
        request.query = {};
      }
      for (const [k2, v3] of endpoint.url.searchParams.entries()) {
        request.query[k2] = v3;
      }
      return request;
    } else {
      request.protocol = endpoint.protocol;
      request.hostname = endpoint.hostname;
      request.port = endpoint.port ? Number(endpoint.port) : void 0;
      request.path = endpoint.path;
      request.query = {
        ...endpoint.query
      };
      return request;
    }
  }
  setHostPrefix(request, operationSchema, input) {
    const inputNs = NormalizedSchema.of(operationSchema.input);
    const opTraits = translateTraits(operationSchema.traits ?? {});
    if (opTraits.endpoint) {
      let hostPrefix = opTraits.endpoint?.[0];
      if (typeof hostPrefix === "string") {
        const hostLabelInputs = [...inputNs.structIterator()].filter(([, member2]) => member2.getMergedTraits().hostLabel);
        for (const [name] of hostLabelInputs) {
          const replacement = input[name];
          if (typeof replacement !== "string") {
            throw new Error(`@smithy/core/schema - ${name} in input must be a string as hostLabel.`);
          }
          hostPrefix = hostPrefix.replace(`{${name}}`, replacement);
        }
        request.hostname = hostPrefix + request.hostname;
      }
    }
  }
  deserializeMetadata(output) {
    return {
      httpStatusCode: output.statusCode,
      requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
      extendedRequestId: output.headers["x-amz-id-2"],
      cfId: output.headers["x-amz-cf-id"]
    };
  }
  async serializeEventStream({ eventStream, requestSchema, initialRequest }) {
    const eventStreamSerde = await this.loadEventStreamCapability();
    return eventStreamSerde.serializeEventStream({
      eventStream,
      requestSchema,
      initialRequest
    });
  }
  async deserializeEventStream({ response, responseSchema, initialResponseContainer }) {
    const eventStreamSerde = await this.loadEventStreamCapability();
    return eventStreamSerde.deserializeEventStream({
      response,
      responseSchema,
      initialResponseContainer
    });
  }
  async loadEventStreamCapability() {
    const { EventStreamSerde: EventStreamSerde2 } = await Promise.resolve().then(() => (init_event_streams(), event_streams_exports));
    return new EventStreamSerde2({
      marshaller: this.getEventStreamMarshaller(),
      serializer: this.serializer,
      deserializer: this.deserializer,
      serdeContext: this.serdeContext,
      defaultContentType: this.getDefaultContentType()
    });
  }
  getDefaultContentType() {
    throw new Error(`@smithy/core/protocols - ${this.constructor.name} getDefaultContentType() implementation missing.`);
  }
  async deserializeHttpMessage(schema, context, response, arg4, arg5) {
    return [];
  }
  getEventStreamMarshaller() {
    const context = this.serdeContext;
    if (!context.eventStreamMarshaller) {
      throw new Error("@smithy/core - HttpProtocol: eventStreamMarshaller missing in serdeContext.");
    }
    return context.eventStreamMarshaller;
  }
};
__name(HttpProtocol, "HttpProtocol");

// node_modules/@smithy/core/dist-es/submodules/protocols/HttpBindingProtocol.js
var HttpBindingProtocol = class extends HttpProtocol {
  async serializeRequest(operationSchema, _input, context) {
    const input = {
      ..._input ?? {}
    };
    const serializer = this.serializer;
    const query = {};
    const headers = {};
    const endpoint = await context.endpoint();
    const ns2 = NormalizedSchema.of(operationSchema?.input);
    const schema = ns2.getSchema();
    let hasNonHttpBindingMember = false;
    let payload;
    const request = new HttpRequest({
      protocol: "",
      hostname: "",
      port: void 0,
      path: "",
      fragment: void 0,
      query,
      headers,
      body: void 0
    });
    if (endpoint) {
      this.updateServiceEndpoint(request, endpoint);
      this.setHostPrefix(request, operationSchema, input);
      const opTraits = translateTraits(operationSchema.traits);
      if (opTraits.http) {
        request.method = opTraits.http[0];
        const [path, search] = opTraits.http[1].split("?");
        if (request.path == "/") {
          request.path = path;
        } else {
          request.path += path;
        }
        const traitSearchParams = new URLSearchParams(search ?? "");
        Object.assign(query, Object.fromEntries(traitSearchParams));
      }
    }
    for (const [memberName, memberNs] of ns2.structIterator()) {
      const memberTraits = memberNs.getMergedTraits() ?? {};
      const inputMemberValue = input[memberName];
      if (inputMemberValue == null && !memberNs.isIdempotencyToken()) {
        continue;
      }
      if (memberTraits.httpPayload) {
        const isStreaming2 = memberNs.isStreaming();
        if (isStreaming2) {
          const isEventStream = memberNs.isStructSchema();
          if (isEventStream) {
            if (input[memberName]) {
              payload = await this.serializeEventStream({
                eventStream: input[memberName],
                requestSchema: ns2
              });
            }
          } else {
            payload = inputMemberValue;
          }
        } else {
          serializer.write(memberNs, inputMemberValue);
          payload = serializer.flush();
        }
        delete input[memberName];
      } else if (memberTraits.httpLabel) {
        serializer.write(memberNs, inputMemberValue);
        const replacement = serializer.flush();
        if (request.path.includes(`{${memberName}+}`)) {
          request.path = request.path.replace(`{${memberName}+}`, replacement.split("/").map(extendedEncodeURIComponent).join("/"));
        } else if (request.path.includes(`{${memberName}}`)) {
          request.path = request.path.replace(`{${memberName}}`, extendedEncodeURIComponent(replacement));
        }
        delete input[memberName];
      } else if (memberTraits.httpHeader) {
        serializer.write(memberNs, inputMemberValue);
        headers[memberTraits.httpHeader.toLowerCase()] = String(serializer.flush());
        delete input[memberName];
      } else if (typeof memberTraits.httpPrefixHeaders === "string") {
        for (const [key, val] of Object.entries(inputMemberValue)) {
          const amalgam = memberTraits.httpPrefixHeaders + key;
          serializer.write([memberNs.getValueSchema(), { httpHeader: amalgam }], val);
          headers[amalgam.toLowerCase()] = serializer.flush();
        }
        delete input[memberName];
      } else if (memberTraits.httpQuery || memberTraits.httpQueryParams) {
        this.serializeQuery(memberNs, inputMemberValue, query);
        delete input[memberName];
      } else {
        hasNonHttpBindingMember = true;
      }
    }
    if (hasNonHttpBindingMember && input) {
      serializer.write(schema, input);
      payload = serializer.flush();
    }
    request.headers = headers;
    request.query = query;
    request.body = payload;
    return request;
  }
  serializeQuery(ns2, data, query) {
    const serializer = this.serializer;
    const traits = ns2.getMergedTraits();
    if (traits.httpQueryParams) {
      for (const [key, val] of Object.entries(data)) {
        if (!(key in query)) {
          const valueSchema = ns2.getValueSchema();
          Object.assign(valueSchema.getMergedTraits(), {
            ...traits,
            httpQuery: key,
            httpQueryParams: void 0
          });
          this.serializeQuery(valueSchema, val, query);
        }
      }
      return;
    }
    if (ns2.isListSchema()) {
      const sparse = !!ns2.getMergedTraits().sparse;
      const buffer = [];
      for (const item of data) {
        serializer.write([ns2.getValueSchema(), traits], item);
        const serializable = serializer.flush();
        if (sparse || serializable !== void 0) {
          buffer.push(serializable);
        }
      }
      query[traits.httpQuery] = buffer;
    } else {
      serializer.write([ns2, traits], data);
      query[traits.httpQuery] = serializer.flush();
    }
  }
  async deserializeResponse(operationSchema, context, response) {
    const deserializer = this.deserializer;
    const ns2 = NormalizedSchema.of(operationSchema.output);
    const dataObject = {};
    if (response.statusCode >= 300) {
      const bytes = await collectBody(response.body, context);
      if (bytes.byteLength > 0) {
        Object.assign(dataObject, await deserializer.read(15, bytes));
      }
      await this.handleError(operationSchema, context, response, dataObject, this.deserializeMetadata(response));
      throw new Error("@smithy/core/protocols - HTTP Protocol error handler failed to throw.");
    }
    for (const header in response.headers) {
      const value = response.headers[header];
      delete response.headers[header];
      response.headers[header.toLowerCase()] = value;
    }
    const nonHttpBindingMembers = await this.deserializeHttpMessage(ns2, context, response, dataObject);
    if (nonHttpBindingMembers.length) {
      const bytes = await collectBody(response.body, context);
      if (bytes.byteLength > 0) {
        const dataFromBody = await deserializer.read(ns2, bytes);
        for (const member2 of nonHttpBindingMembers) {
          dataObject[member2] = dataFromBody[member2];
        }
      }
    }
    dataObject.$metadata = this.deserializeMetadata(response);
    return dataObject;
  }
  async deserializeHttpMessage(schema, context, response, arg4, arg5) {
    let dataObject;
    if (arg4 instanceof Set) {
      dataObject = arg5;
    } else {
      dataObject = arg4;
    }
    const deserializer = this.deserializer;
    const ns2 = NormalizedSchema.of(schema);
    const nonHttpBindingMembers = [];
    for (const [memberName, memberSchema] of ns2.structIterator()) {
      const memberTraits = memberSchema.getMemberTraits();
      if (memberTraits.httpPayload) {
        const isStreaming2 = memberSchema.isStreaming();
        if (isStreaming2) {
          const isEventStream = memberSchema.isStructSchema();
          if (isEventStream) {
            dataObject[memberName] = await this.deserializeEventStream({
              response,
              responseSchema: ns2
            });
          } else {
            dataObject[memberName] = sdkStreamMixin(response.body);
          }
        } else if (response.body) {
          const bytes = await collectBody(response.body, context);
          if (bytes.byteLength > 0) {
            dataObject[memberName] = await deserializer.read(memberSchema, bytes);
          }
        }
      } else if (memberTraits.httpHeader) {
        const key = String(memberTraits.httpHeader).toLowerCase();
        const value = response.headers[key];
        if (null != value) {
          if (memberSchema.isListSchema()) {
            const headerListValueSchema = memberSchema.getValueSchema();
            headerListValueSchema.getMergedTraits().httpHeader = key;
            let sections;
            if (headerListValueSchema.isTimestampSchema() && headerListValueSchema.getSchema() === 4) {
              sections = splitEvery(value, ",", 2);
            } else {
              sections = splitHeader(value);
            }
            const list = [];
            for (const section of sections) {
              list.push(await deserializer.read(headerListValueSchema, section.trim()));
            }
            dataObject[memberName] = list;
          } else {
            dataObject[memberName] = await deserializer.read(memberSchema, value);
          }
        }
      } else if (memberTraits.httpPrefixHeaders !== void 0) {
        dataObject[memberName] = {};
        for (const [header, value] of Object.entries(response.headers)) {
          if (header.startsWith(memberTraits.httpPrefixHeaders)) {
            const valueSchema = memberSchema.getValueSchema();
            valueSchema.getMergedTraits().httpHeader = header;
            dataObject[memberName][header.slice(memberTraits.httpPrefixHeaders.length)] = await deserializer.read(valueSchema, value);
          }
        }
      } else if (memberTraits.httpResponseCode) {
        dataObject[memberName] = response.statusCode;
      } else {
        nonHttpBindingMembers.push(memberName);
      }
    }
    return nonHttpBindingMembers;
  }
};
__name(HttpBindingProtocol, "HttpBindingProtocol");

// node_modules/@smithy/core/dist-es/submodules/protocols/serde/FromStringShapeDeserializer.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_dist_es();

// node_modules/@smithy/core/dist-es/submodules/protocols/serde/determineTimestampFormat.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function determineTimestampFormat(ns2, settings) {
  if (settings.timestampFormat.useTrait) {
    if (ns2.isTimestampSchema() && (ns2.getSchema() === 5 || ns2.getSchema() === 6 || ns2.getSchema() === 7)) {
      return ns2.getSchema();
    }
  }
  const { httpLabel, httpPrefixHeaders, httpHeader, httpQuery } = ns2.getMergedTraits();
  const bindingFormat = settings.httpBindings ? typeof httpPrefixHeaders === "string" || Boolean(httpHeader) ? 6 : Boolean(httpQuery) || Boolean(httpLabel) ? 5 : void 0 : void 0;
  return bindingFormat ?? settings.timestampFormat.default;
}
__name(determineTimestampFormat, "determineTimestampFormat");

// node_modules/@smithy/core/dist-es/submodules/protocols/serde/FromStringShapeDeserializer.js
var FromStringShapeDeserializer = class extends SerdeContext {
  settings;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  read(_schema, data) {
    const ns2 = NormalizedSchema.of(_schema);
    if (ns2.isListSchema()) {
      return splitHeader(data).map((item) => this.read(ns2.getValueSchema(), item));
    }
    if (ns2.isBlobSchema()) {
      return (this.serdeContext?.base64Decoder ?? fromBase64)(data);
    }
    if (ns2.isTimestampSchema()) {
      const format2 = determineTimestampFormat(ns2, this.settings);
      switch (format2) {
        case 5:
          return _parseRfc3339DateTimeWithOffset(data);
        case 6:
          return _parseRfc7231DateTime(data);
        case 7:
          return _parseEpochTimestamp(data);
        default:
          console.warn("Missing timestamp format, parsing value with Date constructor:", data);
          return new Date(data);
      }
    }
    if (ns2.isStringSchema()) {
      const mediaType = ns2.getMergedTraits().mediaType;
      let intermediateValue = data;
      if (mediaType) {
        if (ns2.getMergedTraits().httpHeader) {
          intermediateValue = this.base64ToUtf8(intermediateValue);
        }
        const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
        if (isJson) {
          intermediateValue = LazyJsonString.from(intermediateValue);
        }
        return intermediateValue;
      }
    }
    if (ns2.isNumericSchema()) {
      return Number(data);
    }
    if (ns2.isBigIntegerSchema()) {
      return BigInt(data);
    }
    if (ns2.isBigDecimalSchema()) {
      return new NumericValue(data, "bigDecimal");
    }
    if (ns2.isBooleanSchema()) {
      return String(data).toLowerCase() === "true";
    }
    return data;
  }
  base64ToUtf8(base64String) {
    return (this.serdeContext?.utf8Encoder ?? toUtf8)((this.serdeContext?.base64Decoder ?? fromBase64)(base64String));
  }
};
__name(FromStringShapeDeserializer, "FromStringShapeDeserializer");

// node_modules/@smithy/core/dist-es/submodules/protocols/serde/HttpInterceptingShapeDeserializer.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_dist_es();
var HttpInterceptingShapeDeserializer = class extends SerdeContext {
  codecDeserializer;
  stringDeserializer;
  constructor(codecDeserializer, codecSettings) {
    super();
    this.codecDeserializer = codecDeserializer;
    this.stringDeserializer = new FromStringShapeDeserializer(codecSettings);
  }
  setSerdeContext(serdeContext) {
    this.stringDeserializer.setSerdeContext(serdeContext);
    this.codecDeserializer.setSerdeContext(serdeContext);
    this.serdeContext = serdeContext;
  }
  read(schema, data) {
    const ns2 = NormalizedSchema.of(schema);
    const traits = ns2.getMergedTraits();
    const toString = this.serdeContext?.utf8Encoder ?? toUtf8;
    if (traits.httpHeader || traits.httpResponseCode) {
      return this.stringDeserializer.read(ns2, toString(data));
    }
    if (traits.httpPayload) {
      if (ns2.isBlobSchema()) {
        const toBytes = this.serdeContext?.utf8Decoder ?? fromUtf8;
        if (typeof data === "string") {
          return toBytes(data);
        }
        return data;
      } else if (ns2.isStringSchema()) {
        if ("byteLength" in data) {
          return toString(data);
        }
        return data;
      }
    }
    return this.codecDeserializer.read(ns2, data);
  }
};
__name(HttpInterceptingShapeDeserializer, "HttpInterceptingShapeDeserializer");

// node_modules/@smithy/core/dist-es/submodules/protocols/serde/HttpInterceptingShapeSerializer.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/core/dist-es/submodules/protocols/serde/ToStringShapeSerializer.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var ToStringShapeSerializer = class extends SerdeContext {
  settings;
  stringBuffer = "";
  constructor(settings) {
    super();
    this.settings = settings;
  }
  write(schema, value) {
    const ns2 = NormalizedSchema.of(schema);
    switch (typeof value) {
      case "object":
        if (value === null) {
          this.stringBuffer = "null";
          return;
        }
        if (ns2.isTimestampSchema()) {
          if (!(value instanceof Date)) {
            throw new Error(`@smithy/core/protocols - received non-Date value ${value} when schema expected Date in ${ns2.getName(true)}`);
          }
          const format2 = determineTimestampFormat(ns2, this.settings);
          switch (format2) {
            case 5:
              this.stringBuffer = value.toISOString().replace(".000Z", "Z");
              break;
            case 6:
              this.stringBuffer = dateToUtcString(value);
              break;
            case 7:
              this.stringBuffer = String(value.getTime() / 1e3);
              break;
            default:
              console.warn("Missing timestamp format, using epoch seconds", value);
              this.stringBuffer = String(value.getTime() / 1e3);
          }
          return;
        }
        if (ns2.isBlobSchema() && "byteLength" in value) {
          this.stringBuffer = (this.serdeContext?.base64Encoder ?? toBase64)(value);
          return;
        }
        if (ns2.isListSchema() && Array.isArray(value)) {
          let buffer = "";
          for (const item of value) {
            this.write([ns2.getValueSchema(), ns2.getMergedTraits()], item);
            const headerItem = this.flush();
            const serialized = ns2.getValueSchema().isTimestampSchema() ? headerItem : quoteHeader(headerItem);
            if (buffer !== "") {
              buffer += ", ";
            }
            buffer += serialized;
          }
          this.stringBuffer = buffer;
          return;
        }
        this.stringBuffer = JSON.stringify(value, null, 2);
        break;
      case "string":
        const mediaType = ns2.getMergedTraits().mediaType;
        let intermediateValue = value;
        if (mediaType) {
          const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
          if (isJson) {
            intermediateValue = LazyJsonString.from(intermediateValue);
          }
          if (ns2.getMergedTraits().httpHeader) {
            this.stringBuffer = (this.serdeContext?.base64Encoder ?? toBase64)(intermediateValue.toString());
            return;
          }
        }
        this.stringBuffer = value;
        break;
      default:
        if (ns2.isIdempotencyToken()) {
          this.stringBuffer = v4();
        } else {
          this.stringBuffer = String(value);
        }
    }
  }
  flush() {
    const buffer = this.stringBuffer;
    this.stringBuffer = "";
    return buffer;
  }
};
__name(ToStringShapeSerializer, "ToStringShapeSerializer");

// node_modules/@smithy/core/dist-es/submodules/protocols/serde/HttpInterceptingShapeSerializer.js
var HttpInterceptingShapeSerializer = class {
  codecSerializer;
  stringSerializer;
  buffer;
  constructor(codecSerializer, codecSettings, stringSerializer = new ToStringShapeSerializer(codecSettings)) {
    this.codecSerializer = codecSerializer;
    this.stringSerializer = stringSerializer;
  }
  setSerdeContext(serdeContext) {
    this.codecSerializer.setSerdeContext(serdeContext);
    this.stringSerializer.setSerdeContext(serdeContext);
  }
  write(schema, value) {
    const ns2 = NormalizedSchema.of(schema);
    const traits = ns2.getMergedTraits();
    if (traits.httpHeader || traits.httpLabel || traits.httpQuery) {
      this.stringSerializer.write(ns2, value);
      this.buffer = this.stringSerializer.flush();
      return;
    }
    return this.codecSerializer.write(ns2, value);
  }
  flush() {
    if (this.buffer !== void 0) {
      const buffer = this.buffer;
      this.buffer = void 0;
      return buffer;
    }
    return this.codecSerializer.flush();
  }
};
__name(HttpInterceptingShapeSerializer, "HttpInterceptingShapeSerializer");

// node_modules/@smithy/core/dist-es/setFeature.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function setFeature2(context, feature, value) {
  if (!context.__smithy_context) {
    context.__smithy_context = {
      features: {}
    };
  } else if (!context.__smithy_context.features) {
    context.__smithy_context.features = {};
  }
  context.__smithy_context.features[feature] = value;
}
__name(setFeature2, "setFeature");

// node_modules/@smithy/core/dist-es/util-identity-and-auth/DefaultIdentityProviderConfig.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var DefaultIdentityProviderConfig = class {
  authSchemes = /* @__PURE__ */ new Map();
  constructor(config) {
    for (const [key, value] of Object.entries(config)) {
      if (value !== void 0) {
        this.authSchemes.set(key, value);
      }
    }
  }
  getIdentityProvider(schemeId) {
    return this.authSchemes.get(schemeId);
  }
};
__name(DefaultIdentityProviderConfig, "DefaultIdentityProviderConfig");

// node_modules/@smithy/core/dist-es/util-identity-and-auth/memoizeIdentityProvider.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var createIsIdentityExpiredFunction = /* @__PURE__ */ __name((expirationMs) => /* @__PURE__ */ __name(function isIdentityExpired2(identity) {
  return doesIdentityRequireRefresh(identity) && identity.expiration.getTime() - Date.now() < expirationMs;
}, "isIdentityExpired"), "createIsIdentityExpiredFunction");
var EXPIRATION_MS = 3e5;
var isIdentityExpired = createIsIdentityExpiredFunction(EXPIRATION_MS);
var doesIdentityRequireRefresh = /* @__PURE__ */ __name((identity) => identity.expiration !== void 0, "doesIdentityRequireRefresh");
var memoizeIdentityProvider = /* @__PURE__ */ __name((provider, isExpired, requiresRefresh) => {
  if (provider === void 0) {
    return void 0;
  }
  const normalizedProvider = typeof provider !== "function" ? async () => Promise.resolve(provider) : provider;
  let resolved;
  let pending;
  let hasResult;
  let isConstant = false;
  const coalesceProvider = /* @__PURE__ */ __name(async (options) => {
    if (!pending) {
      pending = normalizedProvider(options);
    }
    try {
      resolved = await pending;
      hasResult = true;
      isConstant = false;
    } finally {
      pending = void 0;
    }
    return resolved;
  }, "coalesceProvider");
  if (isExpired === void 0) {
    return async (options) => {
      if (!hasResult || options?.forceRefresh) {
        resolved = await coalesceProvider(options);
      }
      return resolved;
    };
  }
  return async (options) => {
    if (!hasResult || options?.forceRefresh) {
      resolved = await coalesceProvider(options);
    }
    if (isConstant) {
      return resolved;
    }
    if (!requiresRefresh(resolved)) {
      isConstant = true;
      return resolved;
    }
    if (isExpired(resolved)) {
      await coalesceProvider(options);
      return resolved;
    }
    return resolved;
  };
}, "memoizeIdentityProvider");

// node_modules/@smithy/property-provider/dist-es/memoize.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var memoize = /* @__PURE__ */ __name((provider, isExpired, requiresRefresh) => {
  let resolved;
  let pending;
  let hasResult;
  let isConstant = false;
  const coalesceProvider = /* @__PURE__ */ __name(async () => {
    if (!pending) {
      pending = provider();
    }
    try {
      resolved = await pending;
      hasResult = true;
      isConstant = false;
    } finally {
      pending = void 0;
    }
    return resolved;
  }, "coalesceProvider");
  if (isExpired === void 0) {
    return async (options) => {
      if (!hasResult || options?.forceRefresh) {
        resolved = await coalesceProvider();
      }
      return resolved;
    };
  }
  return async (options) => {
    if (!hasResult || options?.forceRefresh) {
      resolved = await coalesceProvider();
    }
    if (isConstant) {
      return resolved;
    }
    if (requiresRefresh && !requiresRefresh(resolved)) {
      isConstant = true;
      return resolved;
    }
    if (isExpired(resolved)) {
      await coalesceProvider();
      return resolved;
    }
    return resolved;
  };
}, "memoize");

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4AConfig.js
var resolveAwsSdkSigV4AConfig = /* @__PURE__ */ __name((config) => {
  config.sigv4aSigningRegionSet = normalizeProvider2(config.sigv4aSigningRegionSet);
  return config;
}, "resolveAwsSdkSigV4AConfig");

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/signature-v4/dist-es/SignatureV4.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_dist_es();

// node_modules/@smithy/signature-v4/dist-es/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var ALGORITHM_QUERY_PARAM = "X-Amz-Algorithm";
var CREDENTIAL_QUERY_PARAM = "X-Amz-Credential";
var AMZ_DATE_QUERY_PARAM = "X-Amz-Date";
var SIGNED_HEADERS_QUERY_PARAM = "X-Amz-SignedHeaders";
var EXPIRES_QUERY_PARAM = "X-Amz-Expires";
var SIGNATURE_QUERY_PARAM = "X-Amz-Signature";
var TOKEN_QUERY_PARAM = "X-Amz-Security-Token";
var AUTH_HEADER = "authorization";
var AMZ_DATE_HEADER = AMZ_DATE_QUERY_PARAM.toLowerCase();
var DATE_HEADER = "date";
var GENERATED_HEADERS = [AUTH_HEADER, AMZ_DATE_HEADER, DATE_HEADER];
var SIGNATURE_HEADER = SIGNATURE_QUERY_PARAM.toLowerCase();
var SHA256_HEADER = "x-amz-content-sha256";
var TOKEN_HEADER = TOKEN_QUERY_PARAM.toLowerCase();
var ALWAYS_UNSIGNABLE_HEADERS = {
  authorization: true,
  "cache-control": true,
  connection: true,
  expect: true,
  from: true,
  "keep-alive": true,
  "max-forwards": true,
  pragma: true,
  referer: true,
  te: true,
  trailer: true,
  "transfer-encoding": true,
  upgrade: true,
  "user-agent": true,
  "x-amzn-trace-id": true
};
var PROXY_HEADER_PATTERN = /^proxy-/;
var SEC_HEADER_PATTERN = /^sec-/;
var ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256";
var EVENT_ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256-PAYLOAD";
var UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
var MAX_CACHE_SIZE = 50;
var KEY_TYPE_IDENTIFIER = "aws4_request";
var MAX_PRESIGNED_TTL = 60 * 60 * 24 * 7;

// node_modules/@smithy/signature-v4/dist-es/credentialDerivation.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_dist_es();
var signingKeyCache = {};
var cacheQueue = [];
var createScope = /* @__PURE__ */ __name((shortDate, region, service) => `${shortDate}/${region}/${service}/${KEY_TYPE_IDENTIFIER}`, "createScope");
var getSigningKey = /* @__PURE__ */ __name(async (sha256Constructor, credentials, shortDate, region, service) => {
  const credsHash = await hmac(sha256Constructor, credentials.secretAccessKey, credentials.accessKeyId);
  const cacheKey = `${shortDate}:${region}:${service}:${toHex(credsHash)}:${credentials.sessionToken}`;
  if (cacheKey in signingKeyCache) {
    return signingKeyCache[cacheKey];
  }
  cacheQueue.push(cacheKey);
  while (cacheQueue.length > MAX_CACHE_SIZE) {
    delete signingKeyCache[cacheQueue.shift()];
  }
  let key = `AWS4${credentials.secretAccessKey}`;
  for (const signable of [shortDate, region, service, KEY_TYPE_IDENTIFIER]) {
    key = await hmac(sha256Constructor, key, signable);
  }
  return signingKeyCache[cacheKey] = key;
}, "getSigningKey");
var hmac = /* @__PURE__ */ __name((ctor, secret, data) => {
  const hash = new ctor(secret);
  hash.update(toUint8Array(data));
  return hash.digest();
}, "hmac");

// node_modules/@smithy/signature-v4/dist-es/getCanonicalHeaders.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getCanonicalHeaders = /* @__PURE__ */ __name(({ headers }, unsignableHeaders, signableHeaders) => {
  const canonical = {};
  for (const headerName of Object.keys(headers).sort()) {
    if (headers[headerName] == void 0) {
      continue;
    }
    const canonicalHeaderName = headerName.toLowerCase();
    if (canonicalHeaderName in ALWAYS_UNSIGNABLE_HEADERS || unsignableHeaders?.has(canonicalHeaderName) || PROXY_HEADER_PATTERN.test(canonicalHeaderName) || SEC_HEADER_PATTERN.test(canonicalHeaderName)) {
      if (!signableHeaders || signableHeaders && !signableHeaders.has(canonicalHeaderName)) {
        continue;
      }
    }
    canonical[canonicalHeaderName] = headers[headerName].trim().replace(/\s+/g, " ");
  }
  return canonical;
}, "getCanonicalHeaders");

// node_modules/@smithy/signature-v4/dist-es/getPayloadHash.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/is-array-buffer/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var isArrayBuffer = /* @__PURE__ */ __name((arg) => typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer || Object.prototype.toString.call(arg) === "[object ArrayBuffer]", "isArrayBuffer");

// node_modules/@smithy/signature-v4/dist-es/getPayloadHash.js
init_dist_es();
var getPayloadHash = /* @__PURE__ */ __name(async ({ headers, body }, hashConstructor) => {
  for (const headerName of Object.keys(headers)) {
    if (headerName.toLowerCase() === SHA256_HEADER) {
      return headers[headerName];
    }
  }
  if (body == void 0) {
    return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  } else if (typeof body === "string" || ArrayBuffer.isView(body) || isArrayBuffer(body)) {
    const hashCtor = new hashConstructor();
    hashCtor.update(toUint8Array(body));
    return toHex(await hashCtor.digest());
  }
  return UNSIGNED_PAYLOAD;
}, "getPayloadHash");

// node_modules/@smithy/signature-v4/dist-es/HeaderFormatter.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_dist_es();
var HeaderFormatter = class {
  format(headers) {
    const chunks = [];
    for (const headerName of Object.keys(headers)) {
      const bytes = fromUtf8(headerName);
      chunks.push(Uint8Array.from([bytes.byteLength]), bytes, this.formatHeaderValue(headers[headerName]));
    }
    const out = new Uint8Array(chunks.reduce((carry, bytes) => carry + bytes.byteLength, 0));
    let position = 0;
    for (const chunk of chunks) {
      out.set(chunk, position);
      position += chunk.byteLength;
    }
    return out;
  }
  formatHeaderValue(header) {
    switch (header.type) {
      case "boolean":
        return Uint8Array.from([header.value ? 0 : 1]);
      case "byte":
        return Uint8Array.from([2, header.value]);
      case "short":
        const shortView = new DataView(new ArrayBuffer(3));
        shortView.setUint8(0, 3);
        shortView.setInt16(1, header.value, false);
        return new Uint8Array(shortView.buffer);
      case "integer":
        const intView = new DataView(new ArrayBuffer(5));
        intView.setUint8(0, 4);
        intView.setInt32(1, header.value, false);
        return new Uint8Array(intView.buffer);
      case "long":
        const longBytes = new Uint8Array(9);
        longBytes[0] = 5;
        longBytes.set(header.value.bytes, 1);
        return longBytes;
      case "binary":
        const binView = new DataView(new ArrayBuffer(3 + header.value.byteLength));
        binView.setUint8(0, 6);
        binView.setUint16(1, header.value.byteLength, false);
        const binBytes = new Uint8Array(binView.buffer);
        binBytes.set(header.value, 3);
        return binBytes;
      case "string":
        const utf8Bytes = fromUtf8(header.value);
        const strView = new DataView(new ArrayBuffer(3 + utf8Bytes.byteLength));
        strView.setUint8(0, 7);
        strView.setUint16(1, utf8Bytes.byteLength, false);
        const strBytes = new Uint8Array(strView.buffer);
        strBytes.set(utf8Bytes, 3);
        return strBytes;
      case "timestamp":
        const tsBytes = new Uint8Array(9);
        tsBytes[0] = 8;
        tsBytes.set(Int64.fromNumber(header.value.valueOf()).bytes, 1);
        return tsBytes;
      case "uuid":
        if (!UUID_PATTERN.test(header.value)) {
          throw new Error(`Invalid UUID received: ${header.value}`);
        }
        const uuidBytes = new Uint8Array(17);
        uuidBytes[0] = 9;
        uuidBytes.set(fromHex(header.value.replace(/\-/g, "")), 1);
        return uuidBytes;
    }
  }
};
__name(HeaderFormatter, "HeaderFormatter");
var HEADER_VALUE_TYPE;
(function(HEADER_VALUE_TYPE3) {
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["boolTrue"] = 0] = "boolTrue";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["boolFalse"] = 1] = "boolFalse";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["byte"] = 2] = "byte";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["short"] = 3] = "short";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["integer"] = 4] = "integer";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["long"] = 5] = "long";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["byteArray"] = 6] = "byteArray";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["string"] = 7] = "string";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["timestamp"] = 8] = "timestamp";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["uuid"] = 9] = "uuid";
})(HEADER_VALUE_TYPE || (HEADER_VALUE_TYPE = {}));
var UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
var Int64 = class {
  bytes;
  constructor(bytes) {
    this.bytes = bytes;
    if (bytes.byteLength !== 8) {
      throw new Error("Int64 buffers must be exactly 8 bytes");
    }
  }
  static fromNumber(number) {
    if (number > 9223372036854776e3 || number < -9223372036854776e3) {
      throw new Error(`${number} is too large (or, if negative, too small) to represent as an Int64`);
    }
    const bytes = new Uint8Array(8);
    for (let i2 = 7, remaining = Math.abs(Math.round(number)); i2 > -1 && remaining > 0; i2--, remaining /= 256) {
      bytes[i2] = remaining;
    }
    if (number < 0) {
      negate(bytes);
    }
    return new Int64(bytes);
  }
  valueOf() {
    const bytes = this.bytes.slice(0);
    const negative = bytes[0] & 128;
    if (negative) {
      negate(bytes);
    }
    return parseInt(toHex(bytes), 16) * (negative ? -1 : 1);
  }
  toString() {
    return String(this.valueOf());
  }
};
__name(Int64, "Int64");
function negate(bytes) {
  for (let i2 = 0; i2 < 8; i2++) {
    bytes[i2] ^= 255;
  }
  for (let i2 = 7; i2 > -1; i2--) {
    bytes[i2]++;
    if (bytes[i2] !== 0)
      break;
  }
}
__name(negate, "negate");

// node_modules/@smithy/signature-v4/dist-es/headerUtil.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var hasHeader = /* @__PURE__ */ __name((soughtHeader, headers) => {
  soughtHeader = soughtHeader.toLowerCase();
  for (const headerName of Object.keys(headers)) {
    if (soughtHeader === headerName.toLowerCase()) {
      return true;
    }
  }
  return false;
}, "hasHeader");

// node_modules/@smithy/signature-v4/dist-es/moveHeadersToQuery.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var moveHeadersToQuery = /* @__PURE__ */ __name((request, options = {}) => {
  const { headers, query = {} } = HttpRequest.clone(request);
  for (const name of Object.keys(headers)) {
    const lname = name.toLowerCase();
    if (lname.slice(0, 6) === "x-amz-" && !options.unhoistableHeaders?.has(lname) || options.hoistableHeaders?.has(lname)) {
      query[name] = headers[name];
      delete headers[name];
    }
  }
  return {
    ...request,
    headers,
    query
  };
}, "moveHeadersToQuery");

// node_modules/@smithy/signature-v4/dist-es/prepareRequest.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var prepareRequest = /* @__PURE__ */ __name((request) => {
  request = HttpRequest.clone(request);
  for (const headerName of Object.keys(request.headers)) {
    if (GENERATED_HEADERS.indexOf(headerName.toLowerCase()) > -1) {
      delete request.headers[headerName];
    }
  }
  return request;
}, "prepareRequest");

// node_modules/@smithy/signature-v4/dist-es/SignatureV4Base.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_dist_es();

// node_modules/@smithy/signature-v4/dist-es/getCanonicalQuery.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getCanonicalQuery = /* @__PURE__ */ __name(({ query = {} }) => {
  const keys = [];
  const serialized = {};
  for (const key of Object.keys(query)) {
    if (key.toLowerCase() === SIGNATURE_HEADER) {
      continue;
    }
    const encodedKey = escapeUri(key);
    keys.push(encodedKey);
    const value = query[key];
    if (typeof value === "string") {
      serialized[encodedKey] = `${encodedKey}=${escapeUri(value)}`;
    } else if (Array.isArray(value)) {
      serialized[encodedKey] = value.slice(0).reduce((encoded, value2) => encoded.concat([`${encodedKey}=${escapeUri(value2)}`]), []).sort().join("&");
    }
  }
  return keys.sort().map((key) => serialized[key]).filter((serialized2) => serialized2).join("&");
}, "getCanonicalQuery");

// node_modules/@smithy/signature-v4/dist-es/utilDate.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var iso8601 = /* @__PURE__ */ __name((time2) => toDate(time2).toISOString().replace(/\.\d{3}Z$/, "Z"), "iso8601");
var toDate = /* @__PURE__ */ __name((time2) => {
  if (typeof time2 === "number") {
    return new Date(time2 * 1e3);
  }
  if (typeof time2 === "string") {
    if (Number(time2)) {
      return new Date(Number(time2) * 1e3);
    }
    return new Date(time2);
  }
  return time2;
}, "toDate");

// node_modules/@smithy/signature-v4/dist-es/SignatureV4Base.js
var SignatureV4Base = class {
  service;
  regionProvider;
  credentialProvider;
  sha256;
  uriEscapePath;
  applyChecksum;
  constructor({ applyChecksum, credentials, region, service, sha256, uriEscapePath = true }) {
    this.service = service;
    this.sha256 = sha256;
    this.uriEscapePath = uriEscapePath;
    this.applyChecksum = typeof applyChecksum === "boolean" ? applyChecksum : true;
    this.regionProvider = normalizeProvider(region);
    this.credentialProvider = normalizeProvider(credentials);
  }
  createCanonicalRequest(request, canonicalHeaders, payloadHash) {
    const sortedHeaders = Object.keys(canonicalHeaders).sort();
    return `${request.method}
${this.getCanonicalPath(request)}
${getCanonicalQuery(request)}
${sortedHeaders.map((name) => `${name}:${canonicalHeaders[name]}`).join("\n")}

${sortedHeaders.join(";")}
${payloadHash}`;
  }
  async createStringToSign(longDate, credentialScope, canonicalRequest, algorithmIdentifier) {
    const hash = new this.sha256();
    hash.update(toUint8Array(canonicalRequest));
    const hashedRequest = await hash.digest();
    return `${algorithmIdentifier}
${longDate}
${credentialScope}
${toHex(hashedRequest)}`;
  }
  getCanonicalPath({ path }) {
    if (this.uriEscapePath) {
      const normalizedPathSegments = [];
      for (const pathSegment of path.split("/")) {
        if (pathSegment?.length === 0)
          continue;
        if (pathSegment === ".")
          continue;
        if (pathSegment === "..") {
          normalizedPathSegments.pop();
        } else {
          normalizedPathSegments.push(pathSegment);
        }
      }
      const normalizedPath = `${path?.startsWith("/") ? "/" : ""}${normalizedPathSegments.join("/")}${normalizedPathSegments.length > 0 && path?.endsWith("/") ? "/" : ""}`;
      const doubleEncoded = escapeUri(normalizedPath);
      return doubleEncoded.replace(/%2F/g, "/");
    }
    return path;
  }
  validateResolvedCredentials(credentials) {
    if (typeof credentials !== "object" || typeof credentials.accessKeyId !== "string" || typeof credentials.secretAccessKey !== "string") {
      throw new Error("Resolved credential object is not valid");
    }
  }
  formatDate(now) {
    const longDate = iso8601(now).replace(/[\-:]/g, "");
    return {
      longDate,
      shortDate: longDate.slice(0, 8)
    };
  }
  getCanonicalHeaderList(headers) {
    return Object.keys(headers).sort().join(";");
  }
};
__name(SignatureV4Base, "SignatureV4Base");

// node_modules/@smithy/signature-v4/dist-es/SignatureV4.js
var SignatureV4 = class extends SignatureV4Base {
  headerFormatter = new HeaderFormatter();
  constructor({ applyChecksum, credentials, region, service, sha256, uriEscapePath = true }) {
    super({
      applyChecksum,
      credentials,
      region,
      service,
      sha256,
      uriEscapePath
    });
  }
  async presign(originalRequest, options = {}) {
    const { signingDate = /* @__PURE__ */ new Date(), expiresIn = 3600, unsignableHeaders, unhoistableHeaders, signableHeaders, hoistableHeaders, signingRegion, signingService } = options;
    const credentials = await this.credentialProvider();
    this.validateResolvedCredentials(credentials);
    const region = signingRegion ?? await this.regionProvider();
    const { longDate, shortDate } = this.formatDate(signingDate);
    if (expiresIn > MAX_PRESIGNED_TTL) {
      return Promise.reject("Signature version 4 presigned URLs must have an expiration date less than one week in the future");
    }
    const scope = createScope(shortDate, region, signingService ?? this.service);
    const request = moveHeadersToQuery(prepareRequest(originalRequest), { unhoistableHeaders, hoistableHeaders });
    if (credentials.sessionToken) {
      request.query[TOKEN_QUERY_PARAM] = credentials.sessionToken;
    }
    request.query[ALGORITHM_QUERY_PARAM] = ALGORITHM_IDENTIFIER;
    request.query[CREDENTIAL_QUERY_PARAM] = `${credentials.accessKeyId}/${scope}`;
    request.query[AMZ_DATE_QUERY_PARAM] = longDate;
    request.query[EXPIRES_QUERY_PARAM] = expiresIn.toString(10);
    const canonicalHeaders = getCanonicalHeaders(request, unsignableHeaders, signableHeaders);
    request.query[SIGNED_HEADERS_QUERY_PARAM] = this.getCanonicalHeaderList(canonicalHeaders);
    request.query[SIGNATURE_QUERY_PARAM] = await this.getSignature(longDate, scope, this.getSigningKey(credentials, region, shortDate, signingService), this.createCanonicalRequest(request, canonicalHeaders, await getPayloadHash(originalRequest, this.sha256)));
    return request;
  }
  async sign(toSign, options) {
    if (typeof toSign === "string") {
      return this.signString(toSign, options);
    } else if (toSign.headers && toSign.payload) {
      return this.signEvent(toSign, options);
    } else if (toSign.message) {
      return this.signMessage(toSign, options);
    } else {
      return this.signRequest(toSign, options);
    }
  }
  async signEvent({ headers, payload }, { signingDate = /* @__PURE__ */ new Date(), priorSignature, signingRegion, signingService }) {
    const region = signingRegion ?? await this.regionProvider();
    const { shortDate, longDate } = this.formatDate(signingDate);
    const scope = createScope(shortDate, region, signingService ?? this.service);
    const hashedPayload = await getPayloadHash({ headers: {}, body: payload }, this.sha256);
    const hash = new this.sha256();
    hash.update(headers);
    const hashedHeaders = toHex(await hash.digest());
    const stringToSign = [
      EVENT_ALGORITHM_IDENTIFIER,
      longDate,
      scope,
      priorSignature,
      hashedHeaders,
      hashedPayload
    ].join("\n");
    return this.signString(stringToSign, { signingDate, signingRegion: region, signingService });
  }
  async signMessage(signableMessage, { signingDate = /* @__PURE__ */ new Date(), signingRegion, signingService }) {
    const promise = this.signEvent({
      headers: this.headerFormatter.format(signableMessage.message.headers),
      payload: signableMessage.message.body
    }, {
      signingDate,
      signingRegion,
      signingService,
      priorSignature: signableMessage.priorSignature
    });
    return promise.then((signature) => {
      return { message: signableMessage.message, signature };
    });
  }
  async signString(stringToSign, { signingDate = /* @__PURE__ */ new Date(), signingRegion, signingService } = {}) {
    const credentials = await this.credentialProvider();
    this.validateResolvedCredentials(credentials);
    const region = signingRegion ?? await this.regionProvider();
    const { shortDate } = this.formatDate(signingDate);
    const hash = new this.sha256(await this.getSigningKey(credentials, region, shortDate, signingService));
    hash.update(toUint8Array(stringToSign));
    return toHex(await hash.digest());
  }
  async signRequest(requestToSign, { signingDate = /* @__PURE__ */ new Date(), signableHeaders, unsignableHeaders, signingRegion, signingService } = {}) {
    const credentials = await this.credentialProvider();
    this.validateResolvedCredentials(credentials);
    const region = signingRegion ?? await this.regionProvider();
    const request = prepareRequest(requestToSign);
    const { longDate, shortDate } = this.formatDate(signingDate);
    const scope = createScope(shortDate, region, signingService ?? this.service);
    request.headers[AMZ_DATE_HEADER] = longDate;
    if (credentials.sessionToken) {
      request.headers[TOKEN_HEADER] = credentials.sessionToken;
    }
    const payloadHash = await getPayloadHash(request, this.sha256);
    if (!hasHeader(SHA256_HEADER, request.headers) && this.applyChecksum) {
      request.headers[SHA256_HEADER] = payloadHash;
    }
    const canonicalHeaders = getCanonicalHeaders(request, unsignableHeaders, signableHeaders);
    const signature = await this.getSignature(longDate, scope, this.getSigningKey(credentials, region, shortDate, signingService), this.createCanonicalRequest(request, canonicalHeaders, payloadHash));
    request.headers[AUTH_HEADER] = `${ALGORITHM_IDENTIFIER} Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${this.getCanonicalHeaderList(canonicalHeaders)}, Signature=${signature}`;
    return request;
  }
  async getSignature(longDate, credentialScope, keyPromise, canonicalRequest) {
    const stringToSign = await this.createStringToSign(longDate, credentialScope, canonicalRequest, ALGORITHM_IDENTIFIER);
    const hash = new this.sha256(await keyPromise);
    hash.update(toUint8Array(stringToSign));
    return toHex(await hash.digest());
  }
  getSigningKey(credentials, region, shortDate, service) {
    return getSigningKey(this.sha256, credentials, shortDate, region, service || this.service);
  }
};
__name(SignatureV4, "SignatureV4");

// node_modules/@smithy/signature-v4/dist-es/signature-v4a-container.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var signatureV4aContainer = {
  SignatureV4a: null
};

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js
var resolveAwsSdkSigV4Config = /* @__PURE__ */ __name((config) => {
  let inputCredentials = config.credentials;
  let isUserSupplied = !!config.credentials;
  let resolvedCredentials = void 0;
  Object.defineProperty(config, "credentials", {
    set(credentials) {
      if (credentials && credentials !== inputCredentials && credentials !== resolvedCredentials) {
        isUserSupplied = true;
      }
      inputCredentials = credentials;
      const memoizedProvider = normalizeCredentialProvider(config, {
        credentials: inputCredentials,
        credentialDefaultProvider: config.credentialDefaultProvider
      });
      const boundProvider = bindCallerConfig(config, memoizedProvider);
      if (isUserSupplied && !boundProvider.attributed) {
        resolvedCredentials = /* @__PURE__ */ __name(async (options) => boundProvider(options).then((creds) => setCredentialFeature(creds, "CREDENTIALS_CODE", "e")), "resolvedCredentials");
        resolvedCredentials.memoized = boundProvider.memoized;
        resolvedCredentials.configBound = boundProvider.configBound;
        resolvedCredentials.attributed = true;
      } else {
        resolvedCredentials = boundProvider;
      }
    },
    get() {
      return resolvedCredentials;
    },
    enumerable: true,
    configurable: true
  });
  config.credentials = inputCredentials;
  const { signingEscapePath = true, systemClockOffset = config.systemClockOffset || 0, sha256 } = config;
  let signer;
  if (config.signer) {
    signer = normalizeProvider2(config.signer);
  } else if (config.regionInfoProvider) {
    signer = /* @__PURE__ */ __name(() => normalizeProvider2(config.region)().then(async (region) => [
      await config.regionInfoProvider(region, {
        useFipsEndpoint: await config.useFipsEndpoint(),
        useDualstackEndpoint: await config.useDualstackEndpoint()
      }) || {},
      region
    ]).then(([regionInfo, region]) => {
      const { signingRegion, signingService } = regionInfo;
      config.signingRegion = config.signingRegion || signingRegion || region;
      config.signingName = config.signingName || signingService || config.serviceId;
      const params = {
        ...config,
        credentials: config.credentials,
        region: config.signingRegion,
        service: config.signingName,
        sha256,
        uriEscapePath: signingEscapePath
      };
      const SignerCtor = config.signerConstructor || SignatureV4;
      return new SignerCtor(params);
    }), "signer");
  } else {
    signer = /* @__PURE__ */ __name(async (authScheme) => {
      authScheme = Object.assign({}, {
        name: "sigv4",
        signingName: config.signingName || config.defaultSigningName,
        signingRegion: await normalizeProvider2(config.region)(),
        properties: {}
      }, authScheme);
      const signingRegion = authScheme.signingRegion;
      const signingService = authScheme.signingName;
      config.signingRegion = config.signingRegion || signingRegion;
      config.signingName = config.signingName || signingService || config.serviceId;
      const params = {
        ...config,
        credentials: config.credentials,
        region: config.signingRegion,
        service: config.signingName,
        sha256,
        uriEscapePath: signingEscapePath
      };
      const SignerCtor = config.signerConstructor || SignatureV4;
      return new SignerCtor(params);
    }, "signer");
  }
  const resolvedConfig = Object.assign(config, {
    systemClockOffset,
    signingEscapePath,
    signer
  });
  return resolvedConfig;
}, "resolveAwsSdkSigV4Config");
function normalizeCredentialProvider(config, { credentials, credentialDefaultProvider }) {
  let credentialsProvider;
  if (credentials) {
    if (!credentials?.memoized) {
      credentialsProvider = memoizeIdentityProvider(credentials, isIdentityExpired, doesIdentityRequireRefresh);
    } else {
      credentialsProvider = credentials;
    }
  } else {
    if (credentialDefaultProvider) {
      credentialsProvider = normalizeProvider2(credentialDefaultProvider(Object.assign({}, config, {
        parentClientConfig: config
      })));
    } else {
      credentialsProvider = /* @__PURE__ */ __name(async () => {
        throw new Error("@aws-sdk/core::resolveAwsSdkSigV4Config - `credentials` not provided and no credentialDefaultProvider was configured.");
      }, "credentialsProvider");
    }
  }
  credentialsProvider.memoized = true;
  return credentialsProvider;
}
__name(normalizeCredentialProvider, "normalizeCredentialProvider");
function bindCallerConfig(config, credentialsProvider) {
  if (credentialsProvider.configBound) {
    return credentialsProvider;
  }
  const fn = /* @__PURE__ */ __name(async (options) => credentialsProvider({ ...options, callerClientConfig: config }), "fn");
  fn.memoized = credentialsProvider.memoized;
  fn.configBound = true;
  return fn;
}
__name(bindCallerConfig, "bindCallerConfig");

// node_modules/@smithy/util-body-length-browser/dist-es/calculateBodyLength.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var TEXT_ENCODER = typeof TextEncoder == "function" ? new TextEncoder() : null;
var calculateBodyLength = /* @__PURE__ */ __name((body) => {
  if (typeof body === "string") {
    if (TEXT_ENCODER) {
      return TEXT_ENCODER.encode(body).byteLength;
    }
    let len = body.length;
    for (let i2 = len - 1; i2 >= 0; i2--) {
      const code = body.charCodeAt(i2);
      if (code > 127 && code <= 2047)
        len++;
      else if (code > 2047 && code <= 65535)
        len += 2;
      if (code >= 56320 && code <= 57343)
        i2--;
    }
    return len;
  } else if (typeof body.byteLength === "number") {
    return body.byteLength;
  } else if (typeof body.size === "number") {
    return body.size;
  }
  throw new Error(`Body Length computation failed for ${body}`);
}, "calculateBodyLength");

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/ProtocolLib.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/smithy-client/dist-es/client.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/middleware-stack/dist-es/MiddlewareStack.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getAllAliases = /* @__PURE__ */ __name((name, aliases) => {
  const _aliases = [];
  if (name) {
    _aliases.push(name);
  }
  if (aliases) {
    for (const alias of aliases) {
      _aliases.push(alias);
    }
  }
  return _aliases;
}, "getAllAliases");
var getMiddlewareNameWithAliases = /* @__PURE__ */ __name((name, aliases) => {
  return `${name || "anonymous"}${aliases && aliases.length > 0 ? ` (a.k.a. ${aliases.join(",")})` : ""}`;
}, "getMiddlewareNameWithAliases");
var constructStack = /* @__PURE__ */ __name(() => {
  let absoluteEntries = [];
  let relativeEntries = [];
  let identifyOnResolve = false;
  const entriesNameSet = /* @__PURE__ */ new Set();
  const sort = /* @__PURE__ */ __name((entries) => entries.sort((a3, b2) => stepWeights[b2.step] - stepWeights[a3.step] || priorityWeights[b2.priority || "normal"] - priorityWeights[a3.priority || "normal"]), "sort");
  const removeByName = /* @__PURE__ */ __name((toRemove) => {
    let isRemoved = false;
    const filterCb = /* @__PURE__ */ __name((entry) => {
      const aliases = getAllAliases(entry.name, entry.aliases);
      if (aliases.includes(toRemove)) {
        isRemoved = true;
        for (const alias of aliases) {
          entriesNameSet.delete(alias);
        }
        return false;
      }
      return true;
    }, "filterCb");
    absoluteEntries = absoluteEntries.filter(filterCb);
    relativeEntries = relativeEntries.filter(filterCb);
    return isRemoved;
  }, "removeByName");
  const removeByReference = /* @__PURE__ */ __name((toRemove) => {
    let isRemoved = false;
    const filterCb = /* @__PURE__ */ __name((entry) => {
      if (entry.middleware === toRemove) {
        isRemoved = true;
        for (const alias of getAllAliases(entry.name, entry.aliases)) {
          entriesNameSet.delete(alias);
        }
        return false;
      }
      return true;
    }, "filterCb");
    absoluteEntries = absoluteEntries.filter(filterCb);
    relativeEntries = relativeEntries.filter(filterCb);
    return isRemoved;
  }, "removeByReference");
  const cloneTo = /* @__PURE__ */ __name((toStack) => {
    absoluteEntries.forEach((entry) => {
      toStack.add(entry.middleware, { ...entry });
    });
    relativeEntries.forEach((entry) => {
      toStack.addRelativeTo(entry.middleware, { ...entry });
    });
    toStack.identifyOnResolve?.(stack.identifyOnResolve());
    return toStack;
  }, "cloneTo");
  const expandRelativeMiddlewareList = /* @__PURE__ */ __name((from) => {
    const expandedMiddlewareList = [];
    from.before.forEach((entry) => {
      if (entry.before.length === 0 && entry.after.length === 0) {
        expandedMiddlewareList.push(entry);
      } else {
        expandedMiddlewareList.push(...expandRelativeMiddlewareList(entry));
      }
    });
    expandedMiddlewareList.push(from);
    from.after.reverse().forEach((entry) => {
      if (entry.before.length === 0 && entry.after.length === 0) {
        expandedMiddlewareList.push(entry);
      } else {
        expandedMiddlewareList.push(...expandRelativeMiddlewareList(entry));
      }
    });
    return expandedMiddlewareList;
  }, "expandRelativeMiddlewareList");
  const getMiddlewareList = /* @__PURE__ */ __name((debug = false) => {
    const normalizedAbsoluteEntries = [];
    const normalizedRelativeEntries = [];
    const normalizedEntriesNameMap = {};
    absoluteEntries.forEach((entry) => {
      const normalizedEntry = {
        ...entry,
        before: [],
        after: []
      };
      for (const alias of getAllAliases(normalizedEntry.name, normalizedEntry.aliases)) {
        normalizedEntriesNameMap[alias] = normalizedEntry;
      }
      normalizedAbsoluteEntries.push(normalizedEntry);
    });
    relativeEntries.forEach((entry) => {
      const normalizedEntry = {
        ...entry,
        before: [],
        after: []
      };
      for (const alias of getAllAliases(normalizedEntry.name, normalizedEntry.aliases)) {
        normalizedEntriesNameMap[alias] = normalizedEntry;
      }
      normalizedRelativeEntries.push(normalizedEntry);
    });
    normalizedRelativeEntries.forEach((entry) => {
      if (entry.toMiddleware) {
        const toMiddleware = normalizedEntriesNameMap[entry.toMiddleware];
        if (toMiddleware === void 0) {
          if (debug) {
            return;
          }
          throw new Error(`${entry.toMiddleware} is not found when adding ${getMiddlewareNameWithAliases(entry.name, entry.aliases)} middleware ${entry.relation} ${entry.toMiddleware}`);
        }
        if (entry.relation === "after") {
          toMiddleware.after.push(entry);
        }
        if (entry.relation === "before") {
          toMiddleware.before.push(entry);
        }
      }
    });
    const mainChain = sort(normalizedAbsoluteEntries).map(expandRelativeMiddlewareList).reduce((wholeList, expandedMiddlewareList) => {
      wholeList.push(...expandedMiddlewareList);
      return wholeList;
    }, []);
    return mainChain;
  }, "getMiddlewareList");
  const stack = {
    add: (middleware, options = {}) => {
      const { name, override, aliases: _aliases } = options;
      const entry = {
        step: "initialize",
        priority: "normal",
        middleware,
        ...options
      };
      const aliases = getAllAliases(name, _aliases);
      if (aliases.length > 0) {
        if (aliases.some((alias) => entriesNameSet.has(alias))) {
          if (!override)
            throw new Error(`Duplicate middleware name '${getMiddlewareNameWithAliases(name, _aliases)}'`);
          for (const alias of aliases) {
            const toOverrideIndex = absoluteEntries.findIndex((entry2) => entry2.name === alias || entry2.aliases?.some((a3) => a3 === alias));
            if (toOverrideIndex === -1) {
              continue;
            }
            const toOverride = absoluteEntries[toOverrideIndex];
            if (toOverride.step !== entry.step || entry.priority !== toOverride.priority) {
              throw new Error(`"${getMiddlewareNameWithAliases(toOverride.name, toOverride.aliases)}" middleware with ${toOverride.priority} priority in ${toOverride.step} step cannot be overridden by "${getMiddlewareNameWithAliases(name, _aliases)}" middleware with ${entry.priority} priority in ${entry.step} step.`);
            }
            absoluteEntries.splice(toOverrideIndex, 1);
          }
        }
        for (const alias of aliases) {
          entriesNameSet.add(alias);
        }
      }
      absoluteEntries.push(entry);
    },
    addRelativeTo: (middleware, options) => {
      const { name, override, aliases: _aliases } = options;
      const entry = {
        middleware,
        ...options
      };
      const aliases = getAllAliases(name, _aliases);
      if (aliases.length > 0) {
        if (aliases.some((alias) => entriesNameSet.has(alias))) {
          if (!override)
            throw new Error(`Duplicate middleware name '${getMiddlewareNameWithAliases(name, _aliases)}'`);
          for (const alias of aliases) {
            const toOverrideIndex = relativeEntries.findIndex((entry2) => entry2.name === alias || entry2.aliases?.some((a3) => a3 === alias));
            if (toOverrideIndex === -1) {
              continue;
            }
            const toOverride = relativeEntries[toOverrideIndex];
            if (toOverride.toMiddleware !== entry.toMiddleware || toOverride.relation !== entry.relation) {
              throw new Error(`"${getMiddlewareNameWithAliases(toOverride.name, toOverride.aliases)}" middleware ${toOverride.relation} "${toOverride.toMiddleware}" middleware cannot be overridden by "${getMiddlewareNameWithAliases(name, _aliases)}" middleware ${entry.relation} "${entry.toMiddleware}" middleware.`);
            }
            relativeEntries.splice(toOverrideIndex, 1);
          }
        }
        for (const alias of aliases) {
          entriesNameSet.add(alias);
        }
      }
      relativeEntries.push(entry);
    },
    clone: () => cloneTo(constructStack()),
    use: (plugin) => {
      plugin.applyToStack(stack);
    },
    remove: (toRemove) => {
      if (typeof toRemove === "string")
        return removeByName(toRemove);
      else
        return removeByReference(toRemove);
    },
    removeByTag: (toRemove) => {
      let isRemoved = false;
      const filterCb = /* @__PURE__ */ __name((entry) => {
        const { tags, name, aliases: _aliases } = entry;
        if (tags && tags.includes(toRemove)) {
          const aliases = getAllAliases(name, _aliases);
          for (const alias of aliases) {
            entriesNameSet.delete(alias);
          }
          isRemoved = true;
          return false;
        }
        return true;
      }, "filterCb");
      absoluteEntries = absoluteEntries.filter(filterCb);
      relativeEntries = relativeEntries.filter(filterCb);
      return isRemoved;
    },
    concat: (from) => {
      const cloned = cloneTo(constructStack());
      cloned.use(from);
      cloned.identifyOnResolve(identifyOnResolve || cloned.identifyOnResolve() || (from.identifyOnResolve?.() ?? false));
      return cloned;
    },
    applyToStack: cloneTo,
    identify: () => {
      return getMiddlewareList(true).map((mw) => {
        const step = mw.step ?? mw.relation + " " + mw.toMiddleware;
        return getMiddlewareNameWithAliases(mw.name, mw.aliases) + " - " + step;
      });
    },
    identifyOnResolve(toggle) {
      if (typeof toggle === "boolean")
        identifyOnResolve = toggle;
      return identifyOnResolve;
    },
    resolve: (handler, context) => {
      for (const middleware of getMiddlewareList().map((entry) => entry.middleware).reverse()) {
        handler = middleware(handler, context);
      }
      if (identifyOnResolve) {
        console.log(stack.identify());
      }
      return handler;
    }
  };
  return stack;
}, "constructStack");
var stepWeights = {
  initialize: 5,
  serialize: 4,
  build: 3,
  finalizeRequest: 2,
  deserialize: 1
};
var priorityWeights = {
  high: 3,
  normal: 2,
  low: 1
};

// node_modules/@smithy/smithy-client/dist-es/client.js
var Client = class {
  config;
  middlewareStack = constructStack();
  initConfig;
  handlers;
  constructor(config) {
    this.config = config;
  }
  send(command, optionsOrCb, cb2) {
    const options = typeof optionsOrCb !== "function" ? optionsOrCb : void 0;
    const callback = typeof optionsOrCb === "function" ? optionsOrCb : cb2;
    const useHandlerCache = options === void 0 && this.config.cacheMiddleware === true;
    let handler;
    if (useHandlerCache) {
      if (!this.handlers) {
        this.handlers = /* @__PURE__ */ new WeakMap();
      }
      const handlers = this.handlers;
      if (handlers.has(command.constructor)) {
        handler = handlers.get(command.constructor);
      } else {
        handler = command.resolveMiddleware(this.middlewareStack, this.config, options);
        handlers.set(command.constructor, handler);
      }
    } else {
      delete this.handlers;
      handler = command.resolveMiddleware(this.middlewareStack, this.config, options);
    }
    if (callback) {
      handler(command).then((result) => callback(null, result.output), (err) => callback(err)).catch(() => {
      });
    } else {
      return handler(command).then((result) => result.output);
    }
  }
  destroy() {
    this.config?.requestHandler?.destroy?.();
    delete this.handlers;
  }
};
__name(Client, "Client");

// node_modules/@smithy/smithy-client/dist-es/command.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/smithy-client/dist-es/schemaLogFilter.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var SENSITIVE_STRING = "***SensitiveInformation***";
function schemaLogFilter(schema, data) {
  if (data == null) {
    return data;
  }
  const ns2 = NormalizedSchema.of(schema);
  if (ns2.getMergedTraits().sensitive) {
    return SENSITIVE_STRING;
  }
  if (ns2.isListSchema()) {
    const isSensitive = !!ns2.getValueSchema().getMergedTraits().sensitive;
    if (isSensitive) {
      return SENSITIVE_STRING;
    }
  } else if (ns2.isMapSchema()) {
    const isSensitive = !!ns2.getKeySchema().getMergedTraits().sensitive || !!ns2.getValueSchema().getMergedTraits().sensitive;
    if (isSensitive) {
      return SENSITIVE_STRING;
    }
  } else if (ns2.isStructSchema() && typeof data === "object") {
    const object = data;
    const newObject = {};
    for (const [member2, memberNs] of ns2.structIterator()) {
      if (object[member2] != null) {
        newObject[member2] = schemaLogFilter(memberNs, object[member2]);
      }
    }
    return newObject;
  }
  return data;
}
__name(schemaLogFilter, "schemaLogFilter");

// node_modules/@smithy/smithy-client/dist-es/command.js
var Command = class {
  middlewareStack = constructStack();
  schema;
  static classBuilder() {
    return new ClassBuilder();
  }
  resolveMiddlewareWithContext(clientStack, configuration, options, { middlewareFn, clientName, commandName, inputFilterSensitiveLog, outputFilterSensitiveLog, smithyContext, additionalContext, CommandCtor }) {
    for (const mw of middlewareFn.bind(this)(CommandCtor, clientStack, configuration, options)) {
      this.middlewareStack.use(mw);
    }
    const stack = clientStack.concat(this.middlewareStack);
    const { logger: logger2 } = configuration;
    const handlerExecutionContext = {
      logger: logger2,
      clientName,
      commandName,
      inputFilterSensitiveLog,
      outputFilterSensitiveLog,
      [SMITHY_CONTEXT_KEY]: {
        commandInstance: this,
        ...smithyContext
      },
      ...additionalContext
    };
    const { requestHandler } = configuration;
    return stack.resolve((request) => requestHandler.handle(request.request, options || {}), handlerExecutionContext);
  }
};
__name(Command, "Command");
var ClassBuilder = class {
  _init = () => {
  };
  _ep = {};
  _middlewareFn = () => [];
  _commandName = "";
  _clientName = "";
  _additionalContext = {};
  _smithyContext = {};
  _inputFilterSensitiveLog = void 0;
  _outputFilterSensitiveLog = void 0;
  _serializer = null;
  _deserializer = null;
  _operationSchema;
  init(cb2) {
    this._init = cb2;
  }
  ep(endpointParameterInstructions) {
    this._ep = endpointParameterInstructions;
    return this;
  }
  m(middlewareSupplier) {
    this._middlewareFn = middlewareSupplier;
    return this;
  }
  s(service, operation2, smithyContext = {}) {
    this._smithyContext = {
      service,
      operation: operation2,
      ...smithyContext
    };
    return this;
  }
  c(additionalContext = {}) {
    this._additionalContext = additionalContext;
    return this;
  }
  n(clientName, commandName) {
    this._clientName = clientName;
    this._commandName = commandName;
    return this;
  }
  f(inputFilter = (_2) => _2, outputFilter = (_2) => _2) {
    this._inputFilterSensitiveLog = inputFilter;
    this._outputFilterSensitiveLog = outputFilter;
    return this;
  }
  ser(serializer) {
    this._serializer = serializer;
    return this;
  }
  de(deserializer) {
    this._deserializer = deserializer;
    return this;
  }
  sc(operation2) {
    this._operationSchema = operation2;
    this._smithyContext.operationSchema = operation2;
    return this;
  }
  build() {
    const closure = this;
    let CommandRef;
    return CommandRef = /* @__PURE__ */ __name(class extends Command {
      input;
      static getEndpointParameterInstructions() {
        return closure._ep;
      }
      constructor(...[input]) {
        super();
        this.input = input ?? {};
        closure._init(this);
        this.schema = closure._operationSchema;
      }
      resolveMiddleware(stack, configuration, options) {
        const op = closure._operationSchema;
        const input = op?.[4] ?? op?.input;
        const output = op?.[5] ?? op?.output;
        return this.resolveMiddlewareWithContext(stack, configuration, options, {
          CommandCtor: CommandRef,
          middlewareFn: closure._middlewareFn,
          clientName: closure._clientName,
          commandName: closure._commandName,
          inputFilterSensitiveLog: closure._inputFilterSensitiveLog ?? (op ? schemaLogFilter.bind(null, input) : (_2) => _2),
          outputFilterSensitiveLog: closure._outputFilterSensitiveLog ?? (op ? schemaLogFilter.bind(null, output) : (_2) => _2),
          smithyContext: closure._smithyContext,
          additionalContext: closure._additionalContext
        });
      }
      serialize = closure._serializer;
      deserialize = closure._deserializer;
    }, "CommandRef");
  }
};
__name(ClassBuilder, "ClassBuilder");

// node_modules/@smithy/smithy-client/dist-es/exceptions.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var ServiceException = class extends Error {
  $fault;
  $response;
  $retryable;
  $metadata;
  constructor(options) {
    super(options.message);
    Object.setPrototypeOf(this, Object.getPrototypeOf(this).constructor.prototype);
    this.name = options.name;
    this.$fault = options.$fault;
    this.$metadata = options.$metadata;
  }
  static isInstance(value) {
    if (!value)
      return false;
    const candidate = value;
    return ServiceException.prototype.isPrototypeOf(candidate) || Boolean(candidate.$fault) && Boolean(candidate.$metadata) && (candidate.$fault === "client" || candidate.$fault === "server");
  }
  static [Symbol.hasInstance](instance) {
    if (!instance)
      return false;
    const candidate = instance;
    if (this === ServiceException) {
      return ServiceException.isInstance(instance);
    }
    if (ServiceException.isInstance(instance)) {
      if (candidate.name && this.name) {
        return this.prototype.isPrototypeOf(instance) || candidate.name === this.name;
      }
      return this.prototype.isPrototypeOf(instance);
    }
    return false;
  }
};
__name(ServiceException, "ServiceException");
var decorateServiceException = /* @__PURE__ */ __name((exception, additions = {}) => {
  Object.entries(additions).filter(([, v3]) => v3 !== void 0).forEach(([k2, v3]) => {
    if (exception[k2] == void 0 || exception[k2] === "") {
      exception[k2] = v3;
    }
  });
  const message = exception.message || exception.Message || "UnknownError";
  exception.message = message;
  delete exception.Message;
  return exception;
}, "decorateServiceException");

// node_modules/@smithy/smithy-client/dist-es/defaults-mode.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var loadConfigsForDefaultMode = /* @__PURE__ */ __name((mode) => {
  switch (mode) {
    case "standard":
      return {
        retryMode: "standard",
        connectionTimeout: 3100
      };
    case "in-region":
      return {
        retryMode: "standard",
        connectionTimeout: 1100
      };
    case "cross-region":
      return {
        retryMode: "standard",
        connectionTimeout: 3100
      };
    case "mobile":
      return {
        retryMode: "standard",
        connectionTimeout: 3e4
      };
    default:
      return {};
  }
}, "loadConfigsForDefaultMode");

// node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getChecksumConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
  const checksumAlgorithms = [];
  for (const id in AlgorithmId) {
    const algorithmId = AlgorithmId[id];
    if (runtimeConfig[algorithmId] === void 0) {
      continue;
    }
    checksumAlgorithms.push({
      algorithmId: () => algorithmId,
      checksumConstructor: () => runtimeConfig[algorithmId]
    });
  }
  return {
    addChecksumAlgorithm(algo) {
      checksumAlgorithms.push(algo);
    },
    checksumAlgorithms() {
      return checksumAlgorithms;
    }
  };
}, "getChecksumConfiguration");
var resolveChecksumRuntimeConfig = /* @__PURE__ */ __name((clientConfig) => {
  const runtimeConfig = {};
  clientConfig.checksumAlgorithms().forEach((checksumAlgorithm) => {
    runtimeConfig[checksumAlgorithm.algorithmId()] = checksumAlgorithm.checksumConstructor();
  });
  return runtimeConfig;
}, "resolveChecksumRuntimeConfig");

// node_modules/@smithy/smithy-client/dist-es/extensions/retry.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getRetryConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
  return {
    setRetryStrategy(retryStrategy) {
      runtimeConfig.retryStrategy = retryStrategy;
    },
    retryStrategy() {
      return runtimeConfig.retryStrategy;
    }
  };
}, "getRetryConfiguration");
var resolveRetryRuntimeConfig = /* @__PURE__ */ __name((retryStrategyConfiguration) => {
  const runtimeConfig = {};
  runtimeConfig.retryStrategy = retryStrategyConfiguration.retryStrategy();
  return runtimeConfig;
}, "resolveRetryRuntimeConfig");

// node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js
var getDefaultExtensionConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
  return Object.assign(getChecksumConfiguration(runtimeConfig), getRetryConfiguration(runtimeConfig));
}, "getDefaultExtensionConfiguration");
var resolveDefaultRuntimeConfig = /* @__PURE__ */ __name((config) => {
  return Object.assign(resolveChecksumRuntimeConfig(config), resolveRetryRuntimeConfig(config));
}, "resolveDefaultRuntimeConfig");

// node_modules/@smithy/smithy-client/dist-es/get-value-from-text-node.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getValueFromTextNode = /* @__PURE__ */ __name((obj) => {
  const textNodeName = "#text";
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key][textNodeName] !== void 0) {
      obj[key] = obj[key][textNodeName];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      obj[key] = getValueFromTextNode(obj[key]);
    }
  }
  return obj;
}, "getValueFromTextNode");

// node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var NoOpLogger = class {
  trace() {
  }
  debug() {
  }
  info() {
  }
  warn() {
  }
  error() {
  }
};
__name(NoOpLogger, "NoOpLogger");

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/ProtocolLib.js
var ProtocolLib = class {
  queryCompat;
  constructor(queryCompat = false) {
    this.queryCompat = queryCompat;
  }
  resolveRestContentType(defaultContentType, inputSchema) {
    const members = inputSchema.getMemberSchemas();
    const httpPayloadMember = Object.values(members).find((m3) => {
      return !!m3.getMergedTraits().httpPayload;
    });
    if (httpPayloadMember) {
      const mediaType = httpPayloadMember.getMergedTraits().mediaType;
      if (mediaType) {
        return mediaType;
      } else if (httpPayloadMember.isStringSchema()) {
        return "text/plain";
      } else if (httpPayloadMember.isBlobSchema()) {
        return "application/octet-stream";
      } else {
        return defaultContentType;
      }
    } else if (!inputSchema.isUnitSchema()) {
      const hasBody = Object.values(members).find((m3) => {
        const { httpQuery, httpQueryParams, httpHeader, httpLabel, httpPrefixHeaders } = m3.getMergedTraits();
        const noPrefixHeaders = httpPrefixHeaders === void 0;
        return !httpQuery && !httpQueryParams && !httpHeader && !httpLabel && noPrefixHeaders;
      });
      if (hasBody) {
        return defaultContentType;
      }
    }
  }
  async getErrorSchemaOrThrowBaseException(errorIdentifier, defaultNamespace, response, dataObject, metadata, getErrorSchema) {
    let namespace = defaultNamespace;
    let errorName = errorIdentifier;
    if (errorIdentifier.includes("#")) {
      [namespace, errorName] = errorIdentifier.split("#");
    }
    const errorMetadata = {
      $metadata: metadata,
      $fault: response.statusCode < 500 ? "client" : "server"
    };
    const registry = TypeRegistry.for(namespace);
    try {
      const errorSchema = getErrorSchema?.(registry, errorName) ?? registry.getSchema(errorIdentifier);
      return { errorSchema, errorMetadata };
    } catch (e2) {
      dataObject.message = dataObject.message ?? dataObject.Message ?? "UnknownError";
      const synthetic = TypeRegistry.for("smithy.ts.sdk.synthetic." + namespace);
      const baseExceptionSchema = synthetic.getBaseException();
      if (baseExceptionSchema) {
        const ErrorCtor = synthetic.getErrorCtor(baseExceptionSchema) ?? Error;
        throw this.decorateServiceException(Object.assign(new ErrorCtor({ name: errorName }), errorMetadata), dataObject);
      }
      throw this.decorateServiceException(Object.assign(new Error(errorName), errorMetadata), dataObject);
    }
  }
  decorateServiceException(exception, additions = {}) {
    if (this.queryCompat) {
      const msg = exception.Message ?? additions.Message;
      const error = decorateServiceException(exception, additions);
      if (msg) {
        error.Message = msg;
        error.message = msg;
      }
      return error;
    }
    return decorateServiceException(exception, additions);
  }
  setQueryCompatError(output, response) {
    const queryErrorHeader = response.headers?.["x-amzn-query-error"];
    if (output !== void 0 && queryErrorHeader != null) {
      const [Code, Type] = queryErrorHeader.split(";");
      const entries = Object.entries(output);
      const Error2 = {
        Code,
        Type
      };
      Object.assign(output, Error2);
      for (const [k2, v3] of entries) {
        Error2[k2] = v3;
      }
      delete Error2.__type;
      output.Error = Error2;
    }
  }
  queryCompatOutput(queryCompatErrorData, errorData) {
    if (queryCompatErrorData.Error) {
      errorData.Error = queryCompatErrorData.Error;
    }
    if (queryCompatErrorData.Type) {
      errorData.Type = queryCompatErrorData.Type;
    }
    if (queryCompatErrorData.Code) {
      errorData.Code = queryCompatErrorData.Code;
    }
  }
};
__name(ProtocolLib, "ProtocolLib");

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/ConfigurableSerdeContext.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var SerdeContextConfig = class {
  serdeContext;
  setSerdeContext(serdeContext) {
    this.serdeContext = serdeContext;
  }
};
__name(SerdeContextConfig, "SerdeContextConfig");

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/XmlShapeDeserializer.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/xml-builder/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/xml-builder/dist-es/XmlNode.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/xml-builder/dist-es/escape-attribute.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(escapeAttribute, "escapeAttribute");

// node_modules/@aws-sdk/xml-builder/dist-es/XmlText.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/xml-builder/dist-es/escape-element.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function escapeElement(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#x0D;").replace(/\n/g, "&#x0A;").replace(/\u0085/g, "&#x85;").replace(/\u2028/, "&#x2028;");
}
__name(escapeElement, "escapeElement");

// node_modules/@aws-sdk/xml-builder/dist-es/XmlText.js
var XmlText = class {
  value;
  constructor(value) {
    this.value = value;
  }
  toString() {
    return escapeElement("" + this.value);
  }
};
__name(XmlText, "XmlText");

// node_modules/@aws-sdk/xml-builder/dist-es/XmlNode.js
var XmlNode = class {
  name;
  children;
  attributes = {};
  static of(name, childText, withName) {
    const node = new XmlNode(name);
    if (childText !== void 0) {
      node.addChildNode(new XmlText(childText));
    }
    if (withName !== void 0) {
      node.withName(withName);
    }
    return node;
  }
  constructor(name, children = []) {
    this.name = name;
    this.children = children;
  }
  withName(name) {
    this.name = name;
    return this;
  }
  addAttribute(name, value) {
    this.attributes[name] = value;
    return this;
  }
  addChildNode(child) {
    this.children.push(child);
    return this;
  }
  removeAttribute(name) {
    delete this.attributes[name];
    return this;
  }
  n(name) {
    this.name = name;
    return this;
  }
  c(child) {
    this.children.push(child);
    return this;
  }
  a(name, value) {
    if (value != null) {
      this.attributes[name] = value;
    }
    return this;
  }
  cc(input, field, withName = field) {
    if (input[field] != null) {
      const node = XmlNode.of(field, input[field]).withName(withName);
      this.c(node);
    }
  }
  l(input, listName, memberName, valueProvider) {
    if (input[listName] != null) {
      const nodes = valueProvider();
      nodes.map((node) => {
        node.withName(memberName);
        this.c(node);
      });
    }
  }
  lc(input, listName, memberName, valueProvider) {
    if (input[listName] != null) {
      const nodes = valueProvider();
      const containerNode = new XmlNode(memberName);
      nodes.map((node) => {
        containerNode.c(node);
      });
      this.c(containerNode);
    }
  }
  toString() {
    const hasChildren = Boolean(this.children.length);
    let xmlText = `<${this.name}`;
    const attributes = this.attributes;
    for (const attributeName of Object.keys(attributes)) {
      const attribute = attributes[attributeName];
      if (attribute != null) {
        xmlText += ` ${attributeName}="${escapeAttribute("" + attribute)}"`;
      }
    }
    return xmlText += !hasChildren ? "/>" : `>${this.children.map((c2) => c2.toString()).join("")}</${this.name}>`;
  }
};
__name(XmlNode, "XmlNode");

// node_modules/@aws-sdk/xml-builder/dist-es/xml-parser.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var parser;
function parseXML(xmlString) {
  if (!parser) {
    parser = new DOMParser();
  }
  const xmlDocument = parser.parseFromString(xmlString, "application/xml");
  if (xmlDocument.getElementsByTagName("parsererror").length > 0) {
    throw new Error("DOMParser XML parsing error.");
  }
  const xmlToObj = /* @__PURE__ */ __name((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) {
        return node.textContent;
      }
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node;
      if (element.attributes.length === 0 && element.childNodes.length === 0) {
        return "";
      }
      const obj = {};
      const attributes = Array.from(element.attributes);
      for (const attr of attributes) {
        obj[`${attr.name}`] = attr.value;
      }
      const childNodes = Array.from(element.childNodes);
      for (const child of childNodes) {
        const childResult = xmlToObj(child);
        if (childResult != null) {
          const childName = child.nodeName;
          if (childNodes.length === 1 && attributes.length === 0 && childName === "#text") {
            return childResult;
          }
          if (obj[childName]) {
            if (Array.isArray(obj[childName])) {
              obj[childName].push(childResult);
            } else {
              obj[childName] = [obj[childName], childResult];
            }
          } else {
            obj[childName] = childResult;
          }
        } else if (childNodes.length === 1 && attributes.length === 0) {
          return element.textContent;
        }
      }
      return obj;
    }
    return null;
  }, "xmlToObj");
  return {
    [xmlDocument.documentElement.nodeName]: xmlToObj(xmlDocument.documentElement)
  };
}
__name(parseXML, "parseXML");

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/XmlShapeDeserializer.js
init_dist_es();
var XmlShapeDeserializer = class extends SerdeContextConfig {
  settings;
  stringDeserializer;
  constructor(settings) {
    super();
    this.settings = settings;
    this.stringDeserializer = new FromStringShapeDeserializer(settings);
  }
  setSerdeContext(serdeContext) {
    this.serdeContext = serdeContext;
    this.stringDeserializer.setSerdeContext(serdeContext);
  }
  read(schema, bytes, key) {
    const ns2 = NormalizedSchema.of(schema);
    const memberSchemas = ns2.getMemberSchemas();
    const isEventPayload = ns2.isStructSchema() && ns2.isMemberSchema() && !!Object.values(memberSchemas).find((memberNs) => {
      return !!memberNs.getMemberTraits().eventPayload;
    });
    if (isEventPayload) {
      const output = {};
      const memberName = Object.keys(memberSchemas)[0];
      const eventMemberSchema = memberSchemas[memberName];
      if (eventMemberSchema.isBlobSchema()) {
        output[memberName] = bytes;
      } else {
        output[memberName] = this.read(memberSchemas[memberName], bytes);
      }
      return output;
    }
    const xmlString = (this.serdeContext?.utf8Encoder ?? toUtf8)(bytes);
    const parsedObject = this.parseXml(xmlString);
    return this.readSchema(schema, key ? parsedObject[key] : parsedObject);
  }
  readSchema(_schema, value) {
    const ns2 = NormalizedSchema.of(_schema);
    if (ns2.isUnitSchema()) {
      return;
    }
    const traits = ns2.getMergedTraits();
    if (ns2.isListSchema() && !Array.isArray(value)) {
      return this.readSchema(ns2, [value]);
    }
    if (value == null) {
      return value;
    }
    if (typeof value === "object") {
      const sparse = !!traits.sparse;
      const flat = !!traits.xmlFlattened;
      if (ns2.isListSchema()) {
        const listValue = ns2.getValueSchema();
        const buffer2 = [];
        const sourceKey = listValue.getMergedTraits().xmlName ?? "member";
        const source = flat ? value : (value[0] ?? value)[sourceKey];
        const sourceArray = Array.isArray(source) ? source : [source];
        for (const v3 of sourceArray) {
          if (v3 != null || sparse) {
            buffer2.push(this.readSchema(listValue, v3));
          }
        }
        return buffer2;
      }
      const buffer = {};
      if (ns2.isMapSchema()) {
        const keyNs = ns2.getKeySchema();
        const memberNs = ns2.getValueSchema();
        let entries;
        if (flat) {
          entries = Array.isArray(value) ? value : [value];
        } else {
          entries = Array.isArray(value.entry) ? value.entry : [value.entry];
        }
        const keyProperty = keyNs.getMergedTraits().xmlName ?? "key";
        const valueProperty = memberNs.getMergedTraits().xmlName ?? "value";
        for (const entry of entries) {
          const key = entry[keyProperty];
          const value2 = entry[valueProperty];
          if (value2 != null || sparse) {
            buffer[key] = this.readSchema(memberNs, value2);
          }
        }
        return buffer;
      }
      if (ns2.isStructSchema()) {
        for (const [memberName, memberSchema] of ns2.structIterator()) {
          const memberTraits = memberSchema.getMergedTraits();
          const xmlObjectKey = !memberTraits.httpPayload ? memberSchema.getMemberTraits().xmlName ?? memberName : memberTraits.xmlName ?? memberSchema.getName();
          if (value[xmlObjectKey] != null) {
            buffer[memberName] = this.readSchema(memberSchema, value[xmlObjectKey]);
          }
        }
        return buffer;
      }
      if (ns2.isDocumentSchema()) {
        return value;
      }
      throw new Error(`@aws-sdk/core/protocols - xml deserializer unhandled schema type for ${ns2.getName(true)}`);
    }
    if (ns2.isListSchema()) {
      return [];
    }
    if (ns2.isMapSchema() || ns2.isStructSchema()) {
      return {};
    }
    return this.stringDeserializer.read(ns2, value);
  }
  parseXml(xml) {
    if (xml.length) {
      let parsedObj;
      try {
        parsedObj = parseXML(xml);
      } catch (e2) {
        if (e2 && typeof e2 === "object") {
          Object.defineProperty(e2, "$responseBodyText", {
            value: xml
          });
        }
        throw e2;
      }
      const textNodeName = "#text";
      const key = Object.keys(parsedObj)[0];
      const parsedObjToReturn = parsedObj[key];
      if (parsedObjToReturn[textNodeName]) {
        parsedObjToReturn[key] = parsedObjToReturn[textNodeName];
        delete parsedObjToReturn[textNodeName];
      }
      return getValueFromTextNode(parsedObjToReturn);
    }
    return {};
  }
};
__name(XmlShapeDeserializer, "XmlShapeDeserializer");

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/AwsRestXmlProtocol.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/parseXmlBody.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var loadRestXmlErrorCode = /* @__PURE__ */ __name((output, data) => {
  if (data?.Error?.Code !== void 0) {
    return data.Error.Code;
  }
  if (data?.Code !== void 0) {
    return data.Code;
  }
  if (output.statusCode == 404) {
    return "NotFound";
  }
}, "loadRestXmlErrorCode");

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/XmlCodec.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/XmlShapeSerializer.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var XmlShapeSerializer = class extends SerdeContextConfig {
  settings;
  stringBuffer;
  byteBuffer;
  buffer;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  write(schema, value) {
    const ns2 = NormalizedSchema.of(schema);
    if (ns2.isStringSchema() && typeof value === "string") {
      this.stringBuffer = value;
    } else if (ns2.isBlobSchema()) {
      this.byteBuffer = "byteLength" in value ? value : (this.serdeContext?.base64Decoder ?? fromBase64)(value);
    } else {
      this.buffer = this.writeStruct(ns2, value, void 0);
      const traits = ns2.getMergedTraits();
      if (traits.httpPayload && !traits.xmlName) {
        this.buffer.withName(ns2.getName());
      }
    }
  }
  flush() {
    if (this.byteBuffer !== void 0) {
      const bytes = this.byteBuffer;
      delete this.byteBuffer;
      return bytes;
    }
    if (this.stringBuffer !== void 0) {
      const str = this.stringBuffer;
      delete this.stringBuffer;
      return str;
    }
    const buffer = this.buffer;
    if (this.settings.xmlNamespace) {
      if (!buffer?.attributes?.["xmlns"]) {
        buffer.addAttribute("xmlns", this.settings.xmlNamespace);
      }
    }
    delete this.buffer;
    return buffer.toString();
  }
  writeStruct(ns2, value, parentXmlns) {
    const traits = ns2.getMergedTraits();
    const name = ns2.isMemberSchema() && !traits.httpPayload ? ns2.getMemberTraits().xmlName ?? ns2.getMemberName() : traits.xmlName ?? ns2.getName();
    if (!name || !ns2.isStructSchema()) {
      throw new Error(`@aws-sdk/core/protocols - xml serializer, cannot write struct with empty name or non-struct, schema=${ns2.getName(true)}.`);
    }
    const structXmlNode = XmlNode.of(name);
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(ns2, parentXmlns);
    for (const [memberName, memberSchema] of ns2.structIterator()) {
      const val = value[memberName];
      if (val != null || memberSchema.isIdempotencyToken()) {
        if (memberSchema.getMergedTraits().xmlAttribute) {
          structXmlNode.addAttribute(memberSchema.getMergedTraits().xmlName ?? memberName, this.writeSimple(memberSchema, val));
          continue;
        }
        if (memberSchema.isListSchema()) {
          this.writeList(memberSchema, val, structXmlNode, xmlns);
        } else if (memberSchema.isMapSchema()) {
          this.writeMap(memberSchema, val, structXmlNode, xmlns);
        } else if (memberSchema.isStructSchema()) {
          structXmlNode.addChildNode(this.writeStruct(memberSchema, val, xmlns));
        } else {
          const memberNode = XmlNode.of(memberSchema.getMergedTraits().xmlName ?? memberSchema.getMemberName());
          this.writeSimpleInto(memberSchema, val, memberNode, xmlns);
          structXmlNode.addChildNode(memberNode);
        }
      }
    }
    if (xmlns) {
      structXmlNode.addAttribute(xmlnsAttr, xmlns);
    }
    return structXmlNode;
  }
  writeList(listMember, array, container, parentXmlns) {
    if (!listMember.isMemberSchema()) {
      throw new Error(`@aws-sdk/core/protocols - xml serializer, cannot write non-member list: ${listMember.getName(true)}`);
    }
    const listTraits = listMember.getMergedTraits();
    const listValueSchema = listMember.getValueSchema();
    const listValueTraits = listValueSchema.getMergedTraits();
    const sparse = !!listValueTraits.sparse;
    const flat = !!listTraits.xmlFlattened;
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(listMember, parentXmlns);
    const writeItem = /* @__PURE__ */ __name((container2, value) => {
      if (listValueSchema.isListSchema()) {
        this.writeList(listValueSchema, Array.isArray(value) ? value : [value], container2, xmlns);
      } else if (listValueSchema.isMapSchema()) {
        this.writeMap(listValueSchema, value, container2, xmlns);
      } else if (listValueSchema.isStructSchema()) {
        const struct = this.writeStruct(listValueSchema, value, xmlns);
        container2.addChildNode(struct.withName(flat ? listTraits.xmlName ?? listMember.getMemberName() : listValueTraits.xmlName ?? "member"));
      } else {
        const listItemNode = XmlNode.of(flat ? listTraits.xmlName ?? listMember.getMemberName() : listValueTraits.xmlName ?? "member");
        this.writeSimpleInto(listValueSchema, value, listItemNode, xmlns);
        container2.addChildNode(listItemNode);
      }
    }, "writeItem");
    if (flat) {
      for (const value of array) {
        if (sparse || value != null) {
          writeItem(container, value);
        }
      }
    } else {
      const listNode = XmlNode.of(listTraits.xmlName ?? listMember.getMemberName());
      if (xmlns) {
        listNode.addAttribute(xmlnsAttr, xmlns);
      }
      for (const value of array) {
        if (sparse || value != null) {
          writeItem(listNode, value);
        }
      }
      container.addChildNode(listNode);
    }
  }
  writeMap(mapMember, map, container, parentXmlns, containerIsMap = false) {
    if (!mapMember.isMemberSchema()) {
      throw new Error(`@aws-sdk/core/protocols - xml serializer, cannot write non-member map: ${mapMember.getName(true)}`);
    }
    const mapTraits = mapMember.getMergedTraits();
    const mapKeySchema = mapMember.getKeySchema();
    const mapKeyTraits = mapKeySchema.getMergedTraits();
    const keyTag = mapKeyTraits.xmlName ?? "key";
    const mapValueSchema = mapMember.getValueSchema();
    const mapValueTraits = mapValueSchema.getMergedTraits();
    const valueTag = mapValueTraits.xmlName ?? "value";
    const sparse = !!mapValueTraits.sparse;
    const flat = !!mapTraits.xmlFlattened;
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(mapMember, parentXmlns);
    const addKeyValue = /* @__PURE__ */ __name((entry, key, val) => {
      const keyNode = XmlNode.of(keyTag, key);
      const [keyXmlnsAttr, keyXmlns] = this.getXmlnsAttribute(mapKeySchema, xmlns);
      if (keyXmlns) {
        keyNode.addAttribute(keyXmlnsAttr, keyXmlns);
      }
      entry.addChildNode(keyNode);
      let valueNode = XmlNode.of(valueTag);
      if (mapValueSchema.isListSchema()) {
        this.writeList(mapValueSchema, val, valueNode, xmlns);
      } else if (mapValueSchema.isMapSchema()) {
        this.writeMap(mapValueSchema, val, valueNode, xmlns, true);
      } else if (mapValueSchema.isStructSchema()) {
        valueNode = this.writeStruct(mapValueSchema, val, xmlns);
      } else {
        this.writeSimpleInto(mapValueSchema, val, valueNode, xmlns);
      }
      entry.addChildNode(valueNode);
    }, "addKeyValue");
    if (flat) {
      for (const [key, val] of Object.entries(map)) {
        if (sparse || val != null) {
          const entry = XmlNode.of(mapTraits.xmlName ?? mapMember.getMemberName());
          addKeyValue(entry, key, val);
          container.addChildNode(entry);
        }
      }
    } else {
      let mapNode;
      if (!containerIsMap) {
        mapNode = XmlNode.of(mapTraits.xmlName ?? mapMember.getMemberName());
        if (xmlns) {
          mapNode.addAttribute(xmlnsAttr, xmlns);
        }
        container.addChildNode(mapNode);
      }
      for (const [key, val] of Object.entries(map)) {
        if (sparse || val != null) {
          const entry = XmlNode.of("entry");
          addKeyValue(entry, key, val);
          (containerIsMap ? container : mapNode).addChildNode(entry);
        }
      }
    }
  }
  writeSimple(_schema, value) {
    if (null === value) {
      throw new Error("@aws-sdk/core/protocols - (XML serializer) cannot write null value.");
    }
    const ns2 = NormalizedSchema.of(_schema);
    let nodeContents = null;
    if (value && typeof value === "object") {
      if (ns2.isBlobSchema()) {
        nodeContents = (this.serdeContext?.base64Encoder ?? toBase64)(value);
      } else if (ns2.isTimestampSchema() && value instanceof Date) {
        const format2 = determineTimestampFormat(ns2, this.settings);
        switch (format2) {
          case 5:
            nodeContents = value.toISOString().replace(".000Z", "Z");
            break;
          case 6:
            nodeContents = dateToUtcString(value);
            break;
          case 7:
            nodeContents = String(value.getTime() / 1e3);
            break;
          default:
            console.warn("Missing timestamp format, using http date", value);
            nodeContents = dateToUtcString(value);
            break;
        }
      } else if (ns2.isBigDecimalSchema() && value) {
        if (value instanceof NumericValue) {
          return value.string;
        }
        return String(value);
      } else if (ns2.isMapSchema() || ns2.isListSchema()) {
        throw new Error("@aws-sdk/core/protocols - xml serializer, cannot call _write() on List/Map schema, call writeList or writeMap() instead.");
      } else {
        throw new Error(`@aws-sdk/core/protocols - xml serializer, unhandled schema type for object value and schema: ${ns2.getName(true)}`);
      }
    }
    if (ns2.isBooleanSchema() || ns2.isNumericSchema() || ns2.isBigIntegerSchema() || ns2.isBigDecimalSchema()) {
      nodeContents = String(value);
    }
    if (ns2.isStringSchema()) {
      if (value === void 0 && ns2.isIdempotencyToken()) {
        nodeContents = v4();
      } else {
        nodeContents = String(value);
      }
    }
    if (nodeContents === null) {
      throw new Error(`Unhandled schema-value pair ${ns2.getName(true)}=${value}`);
    }
    return nodeContents;
  }
  writeSimpleInto(_schema, value, into, parentXmlns) {
    const nodeContents = this.writeSimple(_schema, value);
    const ns2 = NormalizedSchema.of(_schema);
    const content = new XmlText(nodeContents);
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(ns2, parentXmlns);
    if (xmlns) {
      into.addAttribute(xmlnsAttr, xmlns);
    }
    into.addChildNode(content);
  }
  getXmlnsAttribute(ns2, parentXmlns) {
    const traits = ns2.getMergedTraits();
    const [prefix, xmlns] = traits.xmlNamespace ?? [];
    if (xmlns && xmlns !== parentXmlns) {
      return [prefix ? `xmlns:${prefix}` : "xmlns", xmlns];
    }
    return [void 0, void 0];
  }
};
__name(XmlShapeSerializer, "XmlShapeSerializer");

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/XmlCodec.js
var XmlCodec = class extends SerdeContextConfig {
  settings;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  createSerializer() {
    const serializer = new XmlShapeSerializer(this.settings);
    serializer.setSerdeContext(this.serdeContext);
    return serializer;
  }
  createDeserializer() {
    const deserializer = new XmlShapeDeserializer(this.settings);
    deserializer.setSerdeContext(this.serdeContext);
    return deserializer;
  }
};
__name(XmlCodec, "XmlCodec");

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/AwsRestXmlProtocol.js
var AwsRestXmlProtocol = class extends HttpBindingProtocol {
  codec;
  serializer;
  deserializer;
  mixin = new ProtocolLib();
  constructor(options) {
    super(options);
    const settings = {
      timestampFormat: {
        useTrait: true,
        default: 5
      },
      httpBindings: true,
      xmlNamespace: options.xmlNamespace,
      serviceNamespace: options.defaultNamespace
    };
    this.codec = new XmlCodec(settings);
    this.serializer = new HttpInterceptingShapeSerializer(this.codec.createSerializer(), settings);
    this.deserializer = new HttpInterceptingShapeDeserializer(this.codec.createDeserializer(), settings);
  }
  getPayloadCodec() {
    return this.codec;
  }
  getShapeId() {
    return "aws.protocols#restXml";
  }
  async serializeRequest(operationSchema, input, context) {
    const request = await super.serializeRequest(operationSchema, input, context);
    const inputSchema = NormalizedSchema.of(operationSchema.input);
    if (!request.headers["content-type"]) {
      const contentType = this.mixin.resolveRestContentType(this.getDefaultContentType(), inputSchema);
      if (contentType) {
        request.headers["content-type"] = contentType;
      }
    }
    if (request.headers["content-type"] === this.getDefaultContentType()) {
      if (typeof request.body === "string") {
        request.body = '<?xml version="1.0" encoding="UTF-8"?>' + request.body;
      }
    }
    return request;
  }
  async deserializeResponse(operationSchema, context, response) {
    return super.deserializeResponse(operationSchema, context, response);
  }
  async handleError(operationSchema, context, response, dataObject, metadata) {
    const errorIdentifier = loadRestXmlErrorCode(response, dataObject) ?? "Unknown";
    const { errorSchema, errorMetadata } = await this.mixin.getErrorSchemaOrThrowBaseException(errorIdentifier, this.options.defaultNamespace, response, dataObject, metadata);
    const ns2 = NormalizedSchema.of(errorSchema);
    const message = dataObject.Error?.message ?? dataObject.Error?.Message ?? dataObject.message ?? dataObject.Message ?? "Unknown";
    const ErrorCtor = TypeRegistry.for(errorSchema[1]).getErrorCtor(errorSchema) ?? Error;
    const exception = new ErrorCtor(message);
    await this.deserializeHttpMessage(errorSchema, context, response, dataObject);
    const output = {};
    for (const [name, member2] of ns2.structIterator()) {
      const target = member2.getMergedTraits().xmlName ?? name;
      const value = dataObject.Error?.[target] ?? dataObject[target];
      output[name] = this.codec.createDeserializer().readSchema(member2, value);
    }
    throw this.mixin.decorateServiceException(Object.assign(exception, errorMetadata, {
      $fault: ns2.getMergedTraits().error,
      message
    }, output), dataObject);
  }
  getDefaultContentType() {
    return "application/xml";
  }
};
__name(AwsRestXmlProtocol, "AwsRestXmlProtocol");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getChecksumAlgorithmForRequest.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/types.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var CLIENT_SUPPORTED_ALGORITHMS = [
  ChecksumAlgorithm.CRC32,
  ChecksumAlgorithm.CRC32C,
  ChecksumAlgorithm.CRC64NVME,
  ChecksumAlgorithm.SHA1,
  ChecksumAlgorithm.SHA256
];
var PRIORITY_ORDER_ALGORITHMS = [
  ChecksumAlgorithm.SHA256,
  ChecksumAlgorithm.SHA1,
  ChecksumAlgorithm.CRC32,
  ChecksumAlgorithm.CRC32C,
  ChecksumAlgorithm.CRC64NVME
];

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getChecksumAlgorithmForRequest.js
var getChecksumAlgorithmForRequest = /* @__PURE__ */ __name((input, { requestChecksumRequired, requestAlgorithmMember, requestChecksumCalculation }) => {
  if (!requestAlgorithmMember) {
    return requestChecksumCalculation === RequestChecksumCalculation.WHEN_SUPPORTED || requestChecksumRequired ? DEFAULT_CHECKSUM_ALGORITHM : void 0;
  }
  if (!input[requestAlgorithmMember]) {
    return void 0;
  }
  const checksumAlgorithm = input[requestAlgorithmMember];
  if (!CLIENT_SUPPORTED_ALGORITHMS.includes(checksumAlgorithm)) {
    throw new Error(`The checksum algorithm "${checksumAlgorithm}" is not supported by the client. Select one of ${CLIENT_SUPPORTED_ALGORITHMS}.`);
  }
  return checksumAlgorithm;
}, "getChecksumAlgorithmForRequest");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getChecksumLocationName.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getChecksumLocationName = /* @__PURE__ */ __name((algorithm) => algorithm === ChecksumAlgorithm.MD5 ? "content-md5" : `x-amz-checksum-${algorithm.toLowerCase()}`, "getChecksumLocationName");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/hasHeader.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var hasHeader2 = /* @__PURE__ */ __name((header, headers) => {
  const soughtHeader = header.toLowerCase();
  for (const headerName of Object.keys(headers)) {
    if (soughtHeader === headerName.toLowerCase()) {
      return true;
    }
  }
  return false;
}, "hasHeader");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/hasHeaderWithPrefix.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var hasHeaderWithPrefix = /* @__PURE__ */ __name((headerPrefix, headers) => {
  const soughtHeaderPrefix = headerPrefix.toLowerCase();
  for (const headerName of Object.keys(headers)) {
    if (headerName.toLowerCase().startsWith(soughtHeaderPrefix)) {
      return true;
    }
  }
  return false;
}, "hasHeaderWithPrefix");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/isStreaming.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var isStreaming = /* @__PURE__ */ __name((body) => body !== void 0 && typeof body !== "string" && !ArrayBuffer.isView(body) && !isArrayBuffer(body), "isStreaming");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/selectChecksumAlgorithmFunction.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/crc32c/build/module/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/tslib/tslib.es6.mjs
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function __awaiter(thisArg, _arguments, P2, generator) {
  function adopt(value) {
    return value instanceof P2 ? value : new P2(function(resolve) {
      resolve(value);
    });
  }
  __name(adopt, "adopt");
  return new (P2 || (P2 = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e2) {
        reject(e2);
      }
    }
    __name(fulfilled, "fulfilled");
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e2) {
        reject(e2);
      }
    }
    __name(rejected, "rejected");
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    __name(step, "step");
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
__name(__awaiter, "__awaiter");
function __generator(thisArg, body) {
  var _2 = { label: 0, sent: function() {
    if (t2[0] & 1)
      throw t2[1];
    return t2[1];
  }, trys: [], ops: [] }, f2, y3, t2, g3 = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g3.next = verb(0), g3["throw"] = verb(1), g3["return"] = verb(2), typeof Symbol === "function" && (g3[Symbol.iterator] = function() {
    return this;
  }), g3;
  function verb(n2) {
    return function(v3) {
      return step([n2, v3]);
    };
  }
  __name(verb, "verb");
  function step(op) {
    if (f2)
      throw new TypeError("Generator is already executing.");
    while (g3 && (g3 = 0, op[0] && (_2 = 0)), _2)
      try {
        if (f2 = 1, y3 && (t2 = op[0] & 2 ? y3["return"] : op[0] ? y3["throw"] || ((t2 = y3["return"]) && t2.call(y3), 0) : y3.next) && !(t2 = t2.call(y3, op[1])).done)
          return t2;
        if (y3 = 0, t2)
          op = [op[0] & 2, t2.value];
        switch (op[0]) {
          case 0:
          case 1:
            t2 = op;
            break;
          case 4:
            _2.label++;
            return { value: op[1], done: false };
          case 5:
            _2.label++;
            y3 = op[1];
            op = [0];
            continue;
          case 7:
            op = _2.ops.pop();
            _2.trys.pop();
            continue;
          default:
            if (!(t2 = _2.trys, t2 = t2.length > 0 && t2[t2.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _2 = 0;
              continue;
            }
            if (op[0] === 3 && (!t2 || op[1] > t2[0] && op[1] < t2[3])) {
              _2.label = op[1];
              break;
            }
            if (op[0] === 6 && _2.label < t2[1]) {
              _2.label = t2[1];
              t2 = op;
              break;
            }
            if (t2 && _2.label < t2[2]) {
              _2.label = t2[2];
              _2.ops.push(op);
              break;
            }
            if (t2[2])
              _2.ops.pop();
            _2.trys.pop();
            continue;
        }
        op = body.call(thisArg, _2);
      } catch (e2) {
        op = [6, e2];
        y3 = 0;
      } finally {
        f2 = t2 = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
  __name(step, "step");
}
__name(__generator, "__generator");
function __values(o2) {
  var s2 = typeof Symbol === "function" && Symbol.iterator, m3 = s2 && o2[s2], i2 = 0;
  if (m3)
    return m3.call(o2);
  if (o2 && typeof o2.length === "number")
    return {
      next: function() {
        if (o2 && i2 >= o2.length)
          o2 = void 0;
        return { value: o2 && o2[i2++], done: !o2 };
      }
    };
  throw new TypeError(s2 ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
__name(__values, "__values");

// node_modules/@aws-crypto/util/build/module/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/util/build/module/convertToBuffer.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/fromUtf8.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var fromUtf82 = /* @__PURE__ */ __name((input) => new TextEncoder().encode(input), "fromUtf8");

// node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/toUtf8.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/util/build/module/convertToBuffer.js
var fromUtf83 = typeof Buffer !== "undefined" && Buffer.from ? function(input) {
  return Buffer.from(input, "utf8");
} : fromUtf82;
function convertToBuffer(data) {
  if (data instanceof Uint8Array)
    return data;
  if (typeof data === "string") {
    return fromUtf83(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
  }
  return new Uint8Array(data);
}
__name(convertToBuffer, "convertToBuffer");

// node_modules/@aws-crypto/util/build/module/isEmptyData.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function isEmptyData(data) {
  if (typeof data === "string") {
    return data.length === 0;
  }
  return data.byteLength === 0;
}
__name(isEmptyData, "isEmptyData");

// node_modules/@aws-crypto/util/build/module/numToUint8.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function numToUint8(num) {
  return new Uint8Array([
    (num & 4278190080) >> 24,
    (num & 16711680) >> 16,
    (num & 65280) >> 8,
    num & 255
  ]);
}
__name(numToUint8, "numToUint8");

// node_modules/@aws-crypto/util/build/module/uint32ArrayFrom.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function uint32ArrayFrom(a_lookUpTable2) {
  if (!Uint32Array.from) {
    var return_array = new Uint32Array(a_lookUpTable2.length);
    var a_index = 0;
    while (a_index < a_lookUpTable2.length) {
      return_array[a_index] = a_lookUpTable2[a_index];
      a_index += 1;
    }
    return return_array;
  }
  return Uint32Array.from(a_lookUpTable2);
}
__name(uint32ArrayFrom, "uint32ArrayFrom");

// node_modules/@aws-crypto/crc32c/build/module/aws_crc32c.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var AwsCrc32c = (
  /** @class */
  function() {
    function AwsCrc32c2() {
      this.crc32c = new Crc32c();
    }
    __name(AwsCrc32c2, "AwsCrc32c");
    AwsCrc32c2.prototype.update = function(toHash) {
      if (isEmptyData(toHash))
        return;
      this.crc32c.update(convertToBuffer(toHash));
    };
    AwsCrc32c2.prototype.digest = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          return [2, numToUint8(this.crc32c.digest())];
        });
      });
    };
    AwsCrc32c2.prototype.reset = function() {
      this.crc32c = new Crc32c();
    };
    return AwsCrc32c2;
  }()
);

// node_modules/@aws-crypto/crc32c/build/module/index.js
var Crc32c = (
  /** @class */
  function() {
    function Crc32c2() {
      this.checksum = 4294967295;
    }
    __name(Crc32c2, "Crc32c");
    Crc32c2.prototype.update = function(data) {
      var e_1, _a;
      try {
        for (var data_1 = __values(data), data_1_1 = data_1.next(); !data_1_1.done; data_1_1 = data_1.next()) {
          var byte = data_1_1.value;
          this.checksum = this.checksum >>> 8 ^ lookupTable[(this.checksum ^ byte) & 255];
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (data_1_1 && !data_1_1.done && (_a = data_1.return))
            _a.call(data_1);
        } finally {
          if (e_1)
            throw e_1.error;
        }
      }
      return this;
    };
    Crc32c2.prototype.digest = function() {
      return (this.checksum ^ 4294967295) >>> 0;
    };
    return Crc32c2;
  }()
);
var a_lookupTable = [
  0,
  4067132163,
  3778769143,
  324072436,
  3348797215,
  904991772,
  648144872,
  3570033899,
  2329499855,
  2024987596,
  1809983544,
  2575936315,
  1296289744,
  3207089363,
  2893594407,
  1578318884,
  274646895,
  3795141740,
  4049975192,
  51262619,
  3619967088,
  632279923,
  922689671,
  3298075524,
  2592579488,
  1760304291,
  2075979607,
  2312596564,
  1562183871,
  2943781820,
  3156637768,
  1313733451,
  549293790,
  3537243613,
  3246849577,
  871202090,
  3878099393,
  357341890,
  102525238,
  4101499445,
  2858735121,
  1477399826,
  1264559846,
  3107202533,
  1845379342,
  2677391885,
  2361733625,
  2125378298,
  820201905,
  3263744690,
  3520608582,
  598981189,
  4151959214,
  85089709,
  373468761,
  3827903834,
  3124367742,
  1213305469,
  1526817161,
  2842354314,
  2107672161,
  2412447074,
  2627466902,
  1861252501,
  1098587580,
  3004210879,
  2688576843,
  1378610760,
  2262928035,
  1955203488,
  1742404180,
  2511436119,
  3416409459,
  969524848,
  714683780,
  3639785095,
  205050476,
  4266873199,
  3976438427,
  526918040,
  1361435347,
  2739821008,
  2954799652,
  1114974503,
  2529119692,
  1691668175,
  2005155131,
  2247081528,
  3690758684,
  697762079,
  986182379,
  3366744552,
  476452099,
  3993867776,
  4250756596,
  255256311,
  1640403810,
  2477592673,
  2164122517,
  1922457750,
  2791048317,
  1412925310,
  1197962378,
  3037525897,
  3944729517,
  427051182,
  170179418,
  4165941337,
  746937522,
  3740196785,
  3451792453,
  1070968646,
  1905808397,
  2213795598,
  2426610938,
  1657317369,
  3053634322,
  1147748369,
  1463399397,
  2773627110,
  4215344322,
  153784257,
  444234805,
  3893493558,
  1021025245,
  3467647198,
  3722505002,
  797665321,
  2197175160,
  1889384571,
  1674398607,
  2443626636,
  1164749927,
  3070701412,
  2757221520,
  1446797203,
  137323447,
  4198817972,
  3910406976,
  461344835,
  3484808360,
  1037989803,
  781091935,
  3705997148,
  2460548119,
  1623424788,
  1939049696,
  2180517859,
  1429367560,
  2807687179,
  3020495871,
  1180866812,
  410100952,
  3927582683,
  4182430767,
  186734380,
  3756733383,
  763408580,
  1053836080,
  3434856499,
  2722870694,
  1344288421,
  1131464017,
  2971354706,
  1708204729,
  2545590714,
  2229949006,
  1988219213,
  680717673,
  3673779818,
  3383336350,
  1002577565,
  4010310262,
  493091189,
  238226049,
  4233660802,
  2987750089,
  1082061258,
  1395524158,
  2705686845,
  1972364758,
  2279892693,
  2494862625,
  1725896226,
  952904198,
  3399985413,
  3656866545,
  731699698,
  4283874585,
  222117402,
  510512622,
  3959836397,
  3280807620,
  837199303,
  582374963,
  3504198960,
  68661723,
  4135334616,
  3844915500,
  390545967,
  1230274059,
  3141532936,
  2825850620,
  1510247935,
  2395924756,
  2091215383,
  1878366691,
  2644384480,
  3553878443,
  565732008,
  854102364,
  3229815391,
  340358836,
  3861050807,
  4117890627,
  119113024,
  1493875044,
  2875275879,
  3090270611,
  1247431312,
  2660249211,
  1828433272,
  2141937292,
  2378227087,
  3811616794,
  291187481,
  34330861,
  4032846830,
  615137029,
  3603020806,
  3314634738,
  939183345,
  1776939221,
  2609017814,
  2295496738,
  2058945313,
  2926798794,
  1545135305,
  1330124605,
  3173225534,
  4084100981,
  17165430,
  307568514,
  3762199681,
  888469610,
  3332340585,
  3587147933,
  665062302,
  2042050490,
  2346497209,
  2559330125,
  1793573966,
  3190661285,
  1279665062,
  1595330642,
  2910671697
];
var lookupTable = uint32ArrayFrom(a_lookupTable);

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getCrc32ChecksumAlgorithmFunction.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/crc32/build/module/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/crc32/build/module/aws_crc32.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var AwsCrc32 = (
  /** @class */
  function() {
    function AwsCrc322() {
      this.crc32 = new Crc32();
    }
    __name(AwsCrc322, "AwsCrc32");
    AwsCrc322.prototype.update = function(toHash) {
      if (isEmptyData(toHash))
        return;
      this.crc32.update(convertToBuffer(toHash));
    };
    AwsCrc322.prototype.digest = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          return [2, numToUint8(this.crc32.digest())];
        });
      });
    };
    AwsCrc322.prototype.reset = function() {
      this.crc32 = new Crc32();
    };
    return AwsCrc322;
  }()
);

// node_modules/@aws-crypto/crc32/build/module/index.js
var Crc32 = (
  /** @class */
  function() {
    function Crc322() {
      this.checksum = 4294967295;
    }
    __name(Crc322, "Crc32");
    Crc322.prototype.update = function(data) {
      var e_1, _a;
      try {
        for (var data_1 = __values(data), data_1_1 = data_1.next(); !data_1_1.done; data_1_1 = data_1.next()) {
          var byte = data_1_1.value;
          this.checksum = this.checksum >>> 8 ^ lookupTable2[(this.checksum ^ byte) & 255];
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (data_1_1 && !data_1_1.done && (_a = data_1.return))
            _a.call(data_1);
        } finally {
          if (e_1)
            throw e_1.error;
        }
      }
      return this;
    };
    Crc322.prototype.digest = function() {
      return (this.checksum ^ 4294967295) >>> 0;
    };
    return Crc322;
  }()
);
var a_lookUpTable = [
  0,
  1996959894,
  3993919788,
  2567524794,
  124634137,
  1886057615,
  3915621685,
  2657392035,
  249268274,
  2044508324,
  3772115230,
  2547177864,
  162941995,
  2125561021,
  3887607047,
  2428444049,
  498536548,
  1789927666,
  4089016648,
  2227061214,
  450548861,
  1843258603,
  4107580753,
  2211677639,
  325883990,
  1684777152,
  4251122042,
  2321926636,
  335633487,
  1661365465,
  4195302755,
  2366115317,
  997073096,
  1281953886,
  3579855332,
  2724688242,
  1006888145,
  1258607687,
  3524101629,
  2768942443,
  901097722,
  1119000684,
  3686517206,
  2898065728,
  853044451,
  1172266101,
  3705015759,
  2882616665,
  651767980,
  1373503546,
  3369554304,
  3218104598,
  565507253,
  1454621731,
  3485111705,
  3099436303,
  671266974,
  1594198024,
  3322730930,
  2970347812,
  795835527,
  1483230225,
  3244367275,
  3060149565,
  1994146192,
  31158534,
  2563907772,
  4023717930,
  1907459465,
  112637215,
  2680153253,
  3904427059,
  2013776290,
  251722036,
  2517215374,
  3775830040,
  2137656763,
  141376813,
  2439277719,
  3865271297,
  1802195444,
  476864866,
  2238001368,
  4066508878,
  1812370925,
  453092731,
  2181625025,
  4111451223,
  1706088902,
  314042704,
  2344532202,
  4240017532,
  1658658271,
  366619977,
  2362670323,
  4224994405,
  1303535960,
  984961486,
  2747007092,
  3569037538,
  1256170817,
  1037604311,
  2765210733,
  3554079995,
  1131014506,
  879679996,
  2909243462,
  3663771856,
  1141124467,
  855842277,
  2852801631,
  3708648649,
  1342533948,
  654459306,
  3188396048,
  3373015174,
  1466479909,
  544179635,
  3110523913,
  3462522015,
  1591671054,
  702138776,
  2966460450,
  3352799412,
  1504918807,
  783551873,
  3082640443,
  3233442989,
  3988292384,
  2596254646,
  62317068,
  1957810842,
  3939845945,
  2647816111,
  81470997,
  1943803523,
  3814918930,
  2489596804,
  225274430,
  2053790376,
  3826175755,
  2466906013,
  167816743,
  2097651377,
  4027552580,
  2265490386,
  503444072,
  1762050814,
  4150417245,
  2154129355,
  426522225,
  1852507879,
  4275313526,
  2312317920,
  282753626,
  1742555852,
  4189708143,
  2394877945,
  397917763,
  1622183637,
  3604390888,
  2714866558,
  953729732,
  1340076626,
  3518719985,
  2797360999,
  1068828381,
  1219638859,
  3624741850,
  2936675148,
  906185462,
  1090812512,
  3747672003,
  2825379669,
  829329135,
  1181335161,
  3412177804,
  3160834842,
  628085408,
  1382605366,
  3423369109,
  3138078467,
  570562233,
  1426400815,
  3317316542,
  2998733608,
  733239954,
  1555261956,
  3268935591,
  3050360625,
  752459403,
  1541320221,
  2607071920,
  3965973030,
  1969922972,
  40735498,
  2617837225,
  3943577151,
  1913087877,
  83908371,
  2512341634,
  3803740692,
  2075208622,
  213261112,
  2463272603,
  3855990285,
  2094854071,
  198958881,
  2262029012,
  4057260610,
  1759359992,
  534414190,
  2176718541,
  4139329115,
  1873836001,
  414664567,
  2282248934,
  4279200368,
  1711684554,
  285281116,
  2405801727,
  4167216745,
  1634467795,
  376229701,
  2685067896,
  3608007406,
  1308918612,
  956543938,
  2808555105,
  3495958263,
  1231636301,
  1047427035,
  2932959818,
  3654703836,
  1088359270,
  936918e3,
  2847714899,
  3736837829,
  1202900863,
  817233897,
  3183342108,
  3401237130,
  1404277552,
  615818150,
  3134207493,
  3453421203,
  1423857449,
  601450431,
  3009837614,
  3294710456,
  1567103746,
  711928724,
  3020668471,
  3272380065,
  1510334235,
  755167117
];
var lookupTable2 = uint32ArrayFrom(a_lookUpTable);

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getCrc32ChecksumAlgorithmFunction.browser.js
var getCrc32ChecksumAlgorithmFunction = /* @__PURE__ */ __name(() => AwsCrc32, "getCrc32ChecksumAlgorithmFunction");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/selectChecksumAlgorithmFunction.js
var selectChecksumAlgorithmFunction = /* @__PURE__ */ __name((checksumAlgorithm, config) => {
  switch (checksumAlgorithm) {
    case ChecksumAlgorithm.MD5:
      return config.md5;
    case ChecksumAlgorithm.CRC32:
      return getCrc32ChecksumAlgorithmFunction();
    case ChecksumAlgorithm.CRC32C:
      return AwsCrc32c;
    case ChecksumAlgorithm.CRC64NVME:
      if (typeof crc64NvmeCrtContainer.CrtCrc64Nvme !== "function") {
        throw new Error(`Please check whether you have installed the "@aws-sdk/crc64-nvme-crt" package explicitly. 
You must also register the package by calling [require("@aws-sdk/crc64-nvme-crt");] or an ESM equivalent such as [import "@aws-sdk/crc64-nvme-crt";]. 
For more information please go to https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt`);
      }
      return crc64NvmeCrtContainer.CrtCrc64Nvme;
    case ChecksumAlgorithm.SHA1:
      return config.sha1;
    case ChecksumAlgorithm.SHA256:
      return config.sha256;
    default:
      throw new Error(`Unsupported checksum algorithm: ${checksumAlgorithm}`);
  }
}, "selectChecksumAlgorithmFunction");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/stringHasher.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_dist_es();
var stringHasher = /* @__PURE__ */ __name((checksumAlgorithmFn, body) => {
  const hash = new checksumAlgorithmFn();
  hash.update(toUint8Array(body || ""));
  return hash.digest();
}, "stringHasher");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/flexibleChecksumsMiddleware.js
var flexibleChecksumsMiddlewareOptions = {
  name: "flexibleChecksumsMiddleware",
  step: "build",
  tags: ["BODY_CHECKSUM"],
  override: true
};
var flexibleChecksumsMiddleware = /* @__PURE__ */ __name((config, middlewareConfig) => (next, context) => async (args) => {
  if (!HttpRequest.isInstance(args.request)) {
    return next(args);
  }
  if (hasHeaderWithPrefix("x-amz-checksum-", args.request.headers)) {
    return next(args);
  }
  const { request, input } = args;
  const { body: requestBody, headers } = request;
  const { base64Encoder, streamHasher } = config;
  const { requestChecksumRequired, requestAlgorithmMember } = middlewareConfig;
  const requestChecksumCalculation = await config.requestChecksumCalculation();
  const requestAlgorithmMemberName = requestAlgorithmMember?.name;
  const requestAlgorithmMemberHttpHeader = requestAlgorithmMember?.httpHeader;
  if (requestAlgorithmMemberName && !input[requestAlgorithmMemberName]) {
    if (requestChecksumCalculation === RequestChecksumCalculation.WHEN_SUPPORTED || requestChecksumRequired) {
      input[requestAlgorithmMemberName] = DEFAULT_CHECKSUM_ALGORITHM;
      if (requestAlgorithmMemberHttpHeader) {
        headers[requestAlgorithmMemberHttpHeader] = DEFAULT_CHECKSUM_ALGORITHM;
      }
    }
  }
  const checksumAlgorithm = getChecksumAlgorithmForRequest(input, {
    requestChecksumRequired,
    requestAlgorithmMember: requestAlgorithmMember?.name,
    requestChecksumCalculation
  });
  let updatedBody = requestBody;
  let updatedHeaders = headers;
  if (checksumAlgorithm) {
    switch (checksumAlgorithm) {
      case ChecksumAlgorithm.CRC32:
        setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_CRC32", "U");
        break;
      case ChecksumAlgorithm.CRC32C:
        setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_CRC32C", "V");
        break;
      case ChecksumAlgorithm.CRC64NVME:
        setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_CRC64", "W");
        break;
      case ChecksumAlgorithm.SHA1:
        setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_SHA1", "X");
        break;
      case ChecksumAlgorithm.SHA256:
        setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_SHA256", "Y");
        break;
    }
    const checksumLocationName = getChecksumLocationName(checksumAlgorithm);
    const checksumAlgorithmFn = selectChecksumAlgorithmFunction(checksumAlgorithm, config);
    if (isStreaming(requestBody)) {
      const { getAwsChunkedEncodingStream: getAwsChunkedEncodingStream2, bodyLengthChecker } = config;
      updatedBody = getAwsChunkedEncodingStream2(typeof config.requestStreamBufferSize === "number" && config.requestStreamBufferSize >= 8 * 1024 ? createBufferedReadable(requestBody, config.requestStreamBufferSize, context.logger) : requestBody, {
        base64Encoder,
        bodyLengthChecker,
        checksumLocationName,
        checksumAlgorithmFn,
        streamHasher
      });
      updatedHeaders = {
        ...headers,
        "content-encoding": headers["content-encoding"] ? `${headers["content-encoding"]},aws-chunked` : "aws-chunked",
        "transfer-encoding": "chunked",
        "x-amz-decoded-content-length": headers["content-length"],
        "x-amz-content-sha256": "STREAMING-UNSIGNED-PAYLOAD-TRAILER",
        "x-amz-trailer": checksumLocationName
      };
      delete updatedHeaders["content-length"];
    } else if (!hasHeader2(checksumLocationName, headers)) {
      const rawChecksum = await stringHasher(checksumAlgorithmFn, requestBody);
      updatedHeaders = {
        ...headers,
        [checksumLocationName]: base64Encoder(rawChecksum)
      };
    }
  }
  const result = await next({
    ...args,
    request: {
      ...request,
      headers: updatedHeaders,
      body: updatedBody
    }
  });
  return result;
}, "flexibleChecksumsMiddleware");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getFlexibleChecksumsPlugin.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/flexibleChecksumsInputMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var flexibleChecksumsInputMiddlewareOptions = {
  name: "flexibleChecksumsInputMiddleware",
  toMiddleware: "serializerMiddleware",
  relation: "before",
  tags: ["BODY_CHECKSUM"],
  override: true
};
var flexibleChecksumsInputMiddleware = /* @__PURE__ */ __name((config, middlewareConfig) => (next, context) => async (args) => {
  const input = args.input;
  const { requestValidationModeMember } = middlewareConfig;
  const requestChecksumCalculation = await config.requestChecksumCalculation();
  const responseChecksumValidation = await config.responseChecksumValidation();
  switch (requestChecksumCalculation) {
    case RequestChecksumCalculation.WHEN_REQUIRED:
      setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_WHEN_REQUIRED", "a");
      break;
    case RequestChecksumCalculation.WHEN_SUPPORTED:
      setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_WHEN_SUPPORTED", "Z");
      break;
  }
  switch (responseChecksumValidation) {
    case ResponseChecksumValidation.WHEN_REQUIRED:
      setFeature(context, "FLEXIBLE_CHECKSUMS_RES_WHEN_REQUIRED", "c");
      break;
    case ResponseChecksumValidation.WHEN_SUPPORTED:
      setFeature(context, "FLEXIBLE_CHECKSUMS_RES_WHEN_SUPPORTED", "b");
      break;
  }
  if (requestValidationModeMember && !input[requestValidationModeMember]) {
    if (responseChecksumValidation === ResponseChecksumValidation.WHEN_SUPPORTED) {
      input[requestValidationModeMember] = "ENABLED";
    }
  }
  return next(args);
}, "flexibleChecksumsInputMiddleware");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/flexibleChecksumsResponseMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getChecksumAlgorithmListForResponse.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getChecksumAlgorithmListForResponse = /* @__PURE__ */ __name((responseAlgorithms = []) => {
  const validChecksumAlgorithms = [];
  for (const algorithm of PRIORITY_ORDER_ALGORITHMS) {
    if (!responseAlgorithms.includes(algorithm) || !CLIENT_SUPPORTED_ALGORITHMS.includes(algorithm)) {
      continue;
    }
    validChecksumAlgorithms.push(algorithm);
  }
  return validChecksumAlgorithms;
}, "getChecksumAlgorithmListForResponse");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/isChecksumWithPartNumber.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var isChecksumWithPartNumber = /* @__PURE__ */ __name((checksum) => {
  const lastHyphenIndex = checksum.lastIndexOf("-");
  if (lastHyphenIndex !== -1) {
    const numberPart = checksum.slice(lastHyphenIndex + 1);
    if (!numberPart.startsWith("0")) {
      const number = parseInt(numberPart, 10);
      if (!isNaN(number) && number >= 1 && number <= 1e4) {
        return true;
      }
    }
  }
  return false;
}, "isChecksumWithPartNumber");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/validateChecksumFromResponse.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getChecksum.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getChecksum = /* @__PURE__ */ __name(async (body, { checksumAlgorithmFn, base64Encoder }) => base64Encoder(await stringHasher(checksumAlgorithmFn, body)), "getChecksum");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/validateChecksumFromResponse.js
var validateChecksumFromResponse = /* @__PURE__ */ __name(async (response, { config, responseAlgorithms, logger: logger2 }) => {
  const checksumAlgorithms = getChecksumAlgorithmListForResponse(responseAlgorithms);
  const { body: responseBody, headers: responseHeaders } = response;
  for (const algorithm of checksumAlgorithms) {
    const responseHeader = getChecksumLocationName(algorithm);
    const checksumFromResponse = responseHeaders[responseHeader];
    if (checksumFromResponse) {
      let checksumAlgorithmFn;
      try {
        checksumAlgorithmFn = selectChecksumAlgorithmFunction(algorithm, config);
      } catch (error) {
        if (algorithm === ChecksumAlgorithm.CRC64NVME) {
          logger2?.warn(`Skipping ${ChecksumAlgorithm.CRC64NVME} checksum validation: ${error.message}`);
          continue;
        }
        throw error;
      }
      const { base64Encoder } = config;
      if (isStreaming(responseBody)) {
        response.body = createChecksumStream({
          expectedChecksum: checksumFromResponse,
          checksumSourceLocation: responseHeader,
          checksum: new checksumAlgorithmFn(),
          source: responseBody,
          base64Encoder
        });
        return;
      }
      const checksum = await getChecksum(responseBody, { checksumAlgorithmFn, base64Encoder });
      if (checksum === checksumFromResponse) {
        break;
      }
      throw new Error(`Checksum mismatch: expected "${checksum}" but received "${checksumFromResponse}" in response header "${responseHeader}".`);
    }
  }
}, "validateChecksumFromResponse");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/flexibleChecksumsResponseMiddleware.js
var flexibleChecksumsResponseMiddlewareOptions = {
  name: "flexibleChecksumsResponseMiddleware",
  toMiddleware: "deserializerMiddleware",
  relation: "after",
  tags: ["BODY_CHECKSUM"],
  override: true
};
var flexibleChecksumsResponseMiddleware = /* @__PURE__ */ __name((config, middlewareConfig) => (next, context) => async (args) => {
  if (!HttpRequest.isInstance(args.request)) {
    return next(args);
  }
  const input = args.input;
  const result = await next(args);
  const response = result.response;
  const { requestValidationModeMember, responseAlgorithms } = middlewareConfig;
  if (requestValidationModeMember && input[requestValidationModeMember] === "ENABLED") {
    const { clientName, commandName } = context;
    const isS3WholeObjectMultipartGetResponseChecksum = clientName === "S3Client" && commandName === "GetObjectCommand" && getChecksumAlgorithmListForResponse(responseAlgorithms).every((algorithm) => {
      const responseHeader = getChecksumLocationName(algorithm);
      const checksumFromResponse = response.headers[responseHeader];
      return !checksumFromResponse || isChecksumWithPartNumber(checksumFromResponse);
    });
    if (isS3WholeObjectMultipartGetResponseChecksum) {
      return result;
    }
    await validateChecksumFromResponse(response, {
      config,
      responseAlgorithms,
      logger: context.logger
    });
  }
  return result;
}, "flexibleChecksumsResponseMiddleware");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getFlexibleChecksumsPlugin.js
var getFlexibleChecksumsPlugin = /* @__PURE__ */ __name((config, middlewareConfig) => ({
  applyToStack: (clientStack) => {
    clientStack.add(flexibleChecksumsMiddleware(config, middlewareConfig), flexibleChecksumsMiddlewareOptions);
    clientStack.addRelativeTo(flexibleChecksumsInputMiddleware(config, middlewareConfig), flexibleChecksumsInputMiddlewareOptions);
    clientStack.addRelativeTo(flexibleChecksumsResponseMiddleware(config, middlewareConfig), flexibleChecksumsResponseMiddlewareOptions);
  }
}), "getFlexibleChecksumsPlugin");

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/resolveFlexibleChecksumsConfig.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var resolveFlexibleChecksumsConfig = /* @__PURE__ */ __name((input) => {
  const { requestChecksumCalculation, responseChecksumValidation, requestStreamBufferSize } = input;
  return Object.assign(input, {
    requestChecksumCalculation: normalizeProvider(requestChecksumCalculation ?? DEFAULT_REQUEST_CHECKSUM_CALCULATION),
    responseChecksumValidation: normalizeProvider(responseChecksumValidation ?? DEFAULT_RESPONSE_CHECKSUM_VALIDATION),
    requestStreamBufferSize: Number(requestStreamBufferSize ?? 0)
  });
}, "resolveFlexibleChecksumsConfig");

// node_modules/@aws-sdk/middleware-host-header/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function resolveHostHeaderConfig(input) {
  return input;
}
__name(resolveHostHeaderConfig, "resolveHostHeaderConfig");
var hostHeaderMiddleware = /* @__PURE__ */ __name((options) => (next) => async (args) => {
  if (!HttpRequest.isInstance(args.request))
    return next(args);
  const { request } = args;
  const { handlerProtocol = "" } = options.requestHandler.metadata || {};
  if (handlerProtocol.indexOf("h2") >= 0 && !request.headers[":authority"]) {
    delete request.headers["host"];
    request.headers[":authority"] = request.hostname + (request.port ? ":" + request.port : "");
  } else if (!request.headers["host"]) {
    let host = request.hostname;
    if (request.port != null)
      host += `:${request.port}`;
    request.headers["host"] = host;
  }
  return next(args);
}, "hostHeaderMiddleware");
var hostHeaderMiddlewareOptions = {
  name: "hostHeaderMiddleware",
  step: "build",
  priority: "low",
  tags: ["HOST"],
  override: true
};
var getHostHeaderPlugin = /* @__PURE__ */ __name((options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(hostHeaderMiddleware(options), hostHeaderMiddlewareOptions);
  }
}), "getHostHeaderPlugin");

// node_modules/@aws-sdk/middleware-logger/dist-es/loggerMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var loggerMiddleware = /* @__PURE__ */ __name(() => (next, context) => async (args) => {
  try {
    const response = await next(args);
    const { clientName, commandName, logger: logger2, dynamoDbDocumentClientOptions = {} } = context;
    const { overrideInputFilterSensitiveLog, overrideOutputFilterSensitiveLog } = dynamoDbDocumentClientOptions;
    const inputFilterSensitiveLog = overrideInputFilterSensitiveLog ?? context.inputFilterSensitiveLog;
    const outputFilterSensitiveLog = overrideOutputFilterSensitiveLog ?? context.outputFilterSensitiveLog;
    const { $metadata, ...outputWithoutMetadata } = response.output;
    logger2?.info?.({
      clientName,
      commandName,
      input: inputFilterSensitiveLog(args.input),
      output: outputFilterSensitiveLog(outputWithoutMetadata),
      metadata: $metadata
    });
    return response;
  } catch (error) {
    const { clientName, commandName, logger: logger2, dynamoDbDocumentClientOptions = {} } = context;
    const { overrideInputFilterSensitiveLog } = dynamoDbDocumentClientOptions;
    const inputFilterSensitiveLog = overrideInputFilterSensitiveLog ?? context.inputFilterSensitiveLog;
    logger2?.error?.({
      clientName,
      commandName,
      input: inputFilterSensitiveLog(args.input),
      error,
      metadata: error.$metadata
    });
    throw error;
  }
}, "loggerMiddleware");
var loggerMiddlewareOptions = {
  name: "loggerMiddleware",
  tags: ["LOGGER"],
  step: "initialize",
  override: true
};
var getLoggerPlugin = /* @__PURE__ */ __name((options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(loggerMiddleware(), loggerMiddlewareOptions);
  }
}), "getLoggerPlugin");

// node_modules/@aws-sdk/middleware-recursion-detection/dist-es/getRecursionDetectionPlugin.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/middleware-recursion-detection/dist-es/configuration.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var recursionDetectionMiddlewareOptions = {
  step: "build",
  tags: ["RECURSION_DETECTION"],
  name: "recursionDetectionMiddleware",
  override: true,
  priority: "low"
};

// node_modules/@aws-sdk/middleware-recursion-detection/dist-es/recursionDetectionMiddleware.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var recursionDetectionMiddleware = /* @__PURE__ */ __name(() => (next) => async (args) => next(args), "recursionDetectionMiddleware");

// node_modules/@aws-sdk/middleware-recursion-detection/dist-es/getRecursionDetectionPlugin.js
var getRecursionDetectionPlugin = /* @__PURE__ */ __name((options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(recursionDetectionMiddleware(), recursionDetectionMiddlewareOptions);
  }
}), "getRecursionDetectionPlugin");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/check-content-length-header.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var CONTENT_LENGTH_HEADER = "content-length";
var DECODED_CONTENT_LENGTH_HEADER = "x-amz-decoded-content-length";
function checkContentLengthHeader() {
  return (next, context) => async (args) => {
    const { request } = args;
    if (HttpRequest.isInstance(request)) {
      if (!(CONTENT_LENGTH_HEADER in request.headers) && !(DECODED_CONTENT_LENGTH_HEADER in request.headers)) {
        const message = `Are you using a Stream of unknown length as the Body of a PutObject request? Consider using Upload instead from @aws-sdk/lib-storage.`;
        if (typeof context?.logger?.warn === "function" && !(context.logger instanceof NoOpLogger)) {
          context.logger.warn(message);
        } else {
          console.warn(message);
        }
      }
    }
    return next({ ...args });
  };
}
__name(checkContentLengthHeader, "checkContentLengthHeader");
var checkContentLengthHeaderMiddlewareOptions = {
  step: "finalizeRequest",
  tags: ["CHECK_CONTENT_LENGTH_HEADER"],
  name: "getCheckContentLengthHeaderPlugin",
  override: true
};
var getCheckContentLengthHeaderPlugin = /* @__PURE__ */ __name((unused) => ({
  applyToStack: (clientStack) => {
    clientStack.add(checkContentLengthHeader(), checkContentLengthHeaderMiddlewareOptions);
  }
}), "getCheckContentLengthHeaderPlugin");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/region-redirect-endpoint-middleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var regionRedirectEndpointMiddleware = /* @__PURE__ */ __name((config) => {
  return (next, context) => async (args) => {
    const originalRegion = await config.region();
    const regionProviderRef = config.region;
    let unlock = /* @__PURE__ */ __name(() => {
    }, "unlock");
    if (context.__s3RegionRedirect) {
      Object.defineProperty(config, "region", {
        writable: false,
        value: async () => {
          return context.__s3RegionRedirect;
        }
      });
      unlock = /* @__PURE__ */ __name(() => Object.defineProperty(config, "region", {
        writable: true,
        value: regionProviderRef
      }), "unlock");
    }
    try {
      const result = await next(args);
      if (context.__s3RegionRedirect) {
        unlock();
        const region = await config.region();
        if (originalRegion !== region) {
          throw new Error("Region was not restored following S3 region redirect.");
        }
      }
      return result;
    } catch (e2) {
      unlock();
      throw e2;
    }
  };
}, "regionRedirectEndpointMiddleware");
var regionRedirectEndpointMiddlewareOptions = {
  tags: ["REGION_REDIRECT", "S3"],
  name: "regionRedirectEndpointMiddleware",
  override: true,
  relation: "before",
  toMiddleware: "endpointV2Middleware"
};

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/region-redirect-middleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function regionRedirectMiddleware(clientConfig) {
  return (next, context) => async (args) => {
    try {
      return await next(args);
    } catch (err) {
      if (clientConfig.followRegionRedirects) {
        const statusCode = err?.$metadata?.httpStatusCode;
        const isHeadBucket = context.commandName === "HeadBucketCommand";
        const bucketRegionHeader = err?.$response?.headers?.["x-amz-bucket-region"];
        if (bucketRegionHeader) {
          if (statusCode === 301 || statusCode === 400 && (err?.name === "IllegalLocationConstraintException" || isHeadBucket)) {
            try {
              const actualRegion = bucketRegionHeader;
              context.logger?.debug(`Redirecting from ${await clientConfig.region()} to ${actualRegion}`);
              context.__s3RegionRedirect = actualRegion;
            } catch (e2) {
              throw new Error("Region redirect failed: " + e2);
            }
            return next(args);
          }
        }
      }
      throw err;
    }
  };
}
__name(regionRedirectMiddleware, "regionRedirectMiddleware");
var regionRedirectMiddlewareOptions = {
  step: "initialize",
  tags: ["REGION_REDIRECT", "S3"],
  name: "regionRedirectMiddleware",
  override: true
};
var getRegionRedirectMiddlewarePlugin = /* @__PURE__ */ __name((clientConfig) => ({
  applyToStack: (clientStack) => {
    clientStack.add(regionRedirectMiddleware(clientConfig), regionRedirectMiddlewareOptions);
    clientStack.addRelativeTo(regionRedirectEndpointMiddleware(clientConfig), regionRedirectEndpointMiddlewareOptions);
  }
}), "getRegionRedirectMiddlewarePlugin");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-expires-middleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var s3ExpiresMiddleware = /* @__PURE__ */ __name((config) => {
  return (next, context) => async (args) => {
    const result = await next(args);
    const { response } = result;
    if (HttpResponse.isInstance(response)) {
      if (response.headers.expires) {
        response.headers.expiresstring = response.headers.expires;
        try {
          parseRfc7231DateTime(response.headers.expires);
        } catch (e2) {
          context.logger?.warn(`AWS SDK Warning for ${context.clientName}::${context.commandName} response parsing (${response.headers.expires}): ${e2}`);
          delete response.headers.expires;
        }
      }
    }
    return result;
  };
}, "s3ExpiresMiddleware");
var s3ExpiresMiddlewareOptions = {
  tags: ["S3"],
  name: "s3ExpiresMiddleware",
  override: true,
  relation: "after",
  toMiddleware: "deserializerMiddleware"
};
var getS3ExpiresMiddlewarePlugin = /* @__PURE__ */ __name((clientConfig) => ({
  applyToStack: (clientStack) => {
    clientStack.addRelativeTo(s3ExpiresMiddleware(clientConfig), s3ExpiresMiddlewareOptions);
  }
}), "getS3ExpiresMiddlewarePlugin");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/classes/S3ExpressIdentityCache.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var _S3ExpressIdentityCache = class {
  data;
  lastPurgeTime = Date.now();
  constructor(data = {}) {
    this.data = data;
  }
  get(key) {
    const entry = this.data[key];
    if (!entry) {
      return;
    }
    return entry;
  }
  set(key, entry) {
    this.data[key] = entry;
    return entry;
  }
  delete(key) {
    delete this.data[key];
  }
  async purgeExpired() {
    const now = Date.now();
    if (this.lastPurgeTime + _S3ExpressIdentityCache.EXPIRED_CREDENTIAL_PURGE_INTERVAL_MS > now) {
      return;
    }
    for (const key in this.data) {
      const entry = this.data[key];
      if (!entry.isRefreshing) {
        const credential = await entry.identity;
        if (credential.expiration) {
          if (credential.expiration.getTime() < now) {
            delete this.data[key];
          }
        }
      }
    }
  }
};
var S3ExpressIdentityCache = _S3ExpressIdentityCache;
__name(S3ExpressIdentityCache, "S3ExpressIdentityCache");
__publicField(S3ExpressIdentityCache, "EXPIRED_CREDENTIAL_PURGE_INTERVAL_MS", 3e4);

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/classes/S3ExpressIdentityCacheEntry.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var S3ExpressIdentityCacheEntry = class {
  _identity;
  isRefreshing;
  accessed;
  constructor(_identity, isRefreshing = false, accessed = Date.now()) {
    this._identity = _identity;
    this.isRefreshing = isRefreshing;
    this.accessed = accessed;
  }
  get identity() {
    this.accessed = Date.now();
    return this._identity;
  }
};
__name(S3ExpressIdentityCacheEntry, "S3ExpressIdentityCacheEntry");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/classes/S3ExpressIdentityProviderImpl.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var _S3ExpressIdentityProviderImpl = class {
  createSessionFn;
  cache;
  constructor(createSessionFn, cache2 = new S3ExpressIdentityCache()) {
    this.createSessionFn = createSessionFn;
    this.cache = cache2;
  }
  async getS3ExpressIdentity(awsIdentity, identityProperties) {
    const key = identityProperties.Bucket;
    const { cache: cache2 } = this;
    const entry = cache2.get(key);
    if (entry) {
      return entry.identity.then((identity) => {
        const isExpired = (identity.expiration?.getTime() ?? 0) < Date.now();
        if (isExpired) {
          return cache2.set(key, new S3ExpressIdentityCacheEntry(this.getIdentity(key))).identity;
        }
        const isExpiringSoon = (identity.expiration?.getTime() ?? 0) < Date.now() + _S3ExpressIdentityProviderImpl.REFRESH_WINDOW_MS;
        if (isExpiringSoon && !entry.isRefreshing) {
          entry.isRefreshing = true;
          this.getIdentity(key).then((id) => {
            cache2.set(key, new S3ExpressIdentityCacheEntry(Promise.resolve(id)));
          });
        }
        return identity;
      });
    }
    return cache2.set(key, new S3ExpressIdentityCacheEntry(this.getIdentity(key))).identity;
  }
  async getIdentity(key) {
    await this.cache.purgeExpired().catch((error) => {
      console.warn("Error while clearing expired entries in S3ExpressIdentityCache: \n" + error);
    });
    const session = await this.createSessionFn(key);
    if (!session.Credentials?.AccessKeyId || !session.Credentials?.SecretAccessKey) {
      throw new Error("s3#createSession response credential missing AccessKeyId or SecretAccessKey.");
    }
    const identity = {
      accessKeyId: session.Credentials.AccessKeyId,
      secretAccessKey: session.Credentials.SecretAccessKey,
      sessionToken: session.Credentials.SessionToken,
      expiration: session.Credentials.Expiration ? new Date(session.Credentials.Expiration) : void 0
    };
    return identity;
  }
};
var S3ExpressIdentityProviderImpl = _S3ExpressIdentityProviderImpl;
__name(S3ExpressIdentityProviderImpl, "S3ExpressIdentityProviderImpl");
__publicField(S3ExpressIdentityProviderImpl, "REFRESH_WINDOW_MS", 6e4);

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/classes/SignatureV4S3Express.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var S3_EXPRESS_BUCKET_TYPE = "Directory";
var S3_EXPRESS_BACKEND = "S3Express";
var S3_EXPRESS_AUTH_SCHEME = "sigv4-s3express";
var SESSION_TOKEN_QUERY_PARAM = "X-Amz-S3session-Token";
var SESSION_TOKEN_HEADER = SESSION_TOKEN_QUERY_PARAM.toLowerCase();

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/classes/SignatureV4S3Express.js
var SignatureV4S3Express = class extends SignatureV4 {
  async signWithCredentials(requestToSign, credentials, options) {
    const credentialsWithoutSessionToken = getCredentialsWithoutSessionToken(credentials);
    requestToSign.headers[SESSION_TOKEN_HEADER] = credentials.sessionToken;
    const privateAccess = this;
    setSingleOverride(privateAccess, credentialsWithoutSessionToken);
    return privateAccess.signRequest(requestToSign, options ?? {});
  }
  async presignWithCredentials(requestToSign, credentials, options) {
    const credentialsWithoutSessionToken = getCredentialsWithoutSessionToken(credentials);
    delete requestToSign.headers[SESSION_TOKEN_HEADER];
    requestToSign.headers[SESSION_TOKEN_QUERY_PARAM] = credentials.sessionToken;
    requestToSign.query = requestToSign.query ?? {};
    requestToSign.query[SESSION_TOKEN_QUERY_PARAM] = credentials.sessionToken;
    const privateAccess = this;
    setSingleOverride(privateAccess, credentialsWithoutSessionToken);
    return this.presign(requestToSign, options);
  }
};
__name(SignatureV4S3Express, "SignatureV4S3Express");
function getCredentialsWithoutSessionToken(credentials) {
  const credentialsWithoutSessionToken = {
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    expiration: credentials.expiration
  };
  return credentialsWithoutSessionToken;
}
__name(getCredentialsWithoutSessionToken, "getCredentialsWithoutSessionToken");
function setSingleOverride(privateAccess, credentialsWithoutSessionToken) {
  const id = setTimeout(() => {
    throw new Error("SignatureV4S3Express credential override was created but not called.");
  }, 10);
  const currentCredentialProvider = privateAccess.credentialProvider;
  const overrideCredentialsProviderOnce = /* @__PURE__ */ __name(() => {
    clearTimeout(id);
    privateAccess.credentialProvider = currentCredentialProvider;
    return Promise.resolve(credentialsWithoutSessionToken);
  }, "overrideCredentialsProviderOnce");
  privateAccess.credentialProvider = overrideCredentialsProviderOnce;
}
__name(setSingleOverride, "setSingleOverride");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/functions/s3ExpressMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var s3ExpressMiddleware = /* @__PURE__ */ __name((options) => {
  return (next, context) => async (args) => {
    if (context.endpointV2) {
      const endpoint = context.endpointV2;
      const isS3ExpressAuth = endpoint.properties?.authSchemes?.[0]?.name === S3_EXPRESS_AUTH_SCHEME;
      const isS3ExpressBucket = endpoint.properties?.backend === S3_EXPRESS_BACKEND || endpoint.properties?.bucketType === S3_EXPRESS_BUCKET_TYPE;
      if (isS3ExpressBucket) {
        setFeature(context, "S3_EXPRESS_BUCKET", "J");
        context.isS3ExpressBucket = true;
      }
      if (isS3ExpressAuth) {
        const requestBucket = args.input.Bucket;
        if (requestBucket) {
          const s3ExpressIdentity = await options.s3ExpressIdentityProvider.getS3ExpressIdentity(await options.credentials(), {
            Bucket: requestBucket
          });
          context.s3ExpressIdentity = s3ExpressIdentity;
          if (HttpRequest.isInstance(args.request) && s3ExpressIdentity.sessionToken) {
            args.request.headers[SESSION_TOKEN_HEADER] = s3ExpressIdentity.sessionToken;
          }
        }
      }
    }
    return next(args);
  };
}, "s3ExpressMiddleware");
var s3ExpressMiddlewareOptions = {
  name: "s3ExpressMiddleware",
  step: "build",
  tags: ["S3", "S3_EXPRESS"],
  override: true
};
var getS3ExpressPlugin = /* @__PURE__ */ __name((options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(s3ExpressMiddleware(options), s3ExpressMiddlewareOptions);
  }
}), "getS3ExpressPlugin");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/functions/s3ExpressHttpSigningMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/functions/signS3Express.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var signS3Express = /* @__PURE__ */ __name(async (s3ExpressIdentity, signingOptions, request, sigV4MultiRegionSigner) => {
  const signedRequest = await sigV4MultiRegionSigner.signWithCredentials(request, s3ExpressIdentity, {});
  if (signedRequest.headers["X-Amz-Security-Token"] || signedRequest.headers["x-amz-security-token"]) {
    throw new Error("X-Amz-Security-Token must not be set for s3-express requests.");
  }
  return signedRequest;
}, "signS3Express");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3-express/functions/s3ExpressHttpSigningMiddleware.js
var defaultErrorHandler2 = /* @__PURE__ */ __name((signingProperties) => (error) => {
  throw error;
}, "defaultErrorHandler");
var defaultSuccessHandler2 = /* @__PURE__ */ __name((httpResponse, signingProperties) => {
}, "defaultSuccessHandler");
var s3ExpressHttpSigningMiddleware = /* @__PURE__ */ __name((config) => (next, context) => async (args) => {
  if (!HttpRequest.isInstance(args.request)) {
    return next(args);
  }
  const smithyContext = getSmithyContext(context);
  const scheme = smithyContext.selectedHttpAuthScheme;
  if (!scheme) {
    throw new Error(`No HttpAuthScheme was selected: unable to sign request`);
  }
  const { httpAuthOption: { signingProperties = {} }, identity, signer } = scheme;
  let request;
  if (context.s3ExpressIdentity) {
    request = await signS3Express(context.s3ExpressIdentity, signingProperties, args.request, await config.signer());
  } else {
    request = await signer.sign(args.request, identity, signingProperties);
  }
  const output = await next({
    ...args,
    request
  }).catch((signer.errorHandler || defaultErrorHandler2)(signingProperties));
  (signer.successHandler || defaultSuccessHandler2)(output.response, signingProperties);
  return output;
}, "s3ExpressHttpSigningMiddleware");
var getS3ExpressHttpSigningPlugin = /* @__PURE__ */ __name((config) => ({
  applyToStack: (clientStack) => {
    clientStack.addRelativeTo(s3ExpressHttpSigningMiddleware(config), httpSigningMiddlewareOptions);
  }
}), "getS3ExpressHttpSigningPlugin");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/s3Configuration.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var resolveS3Config = /* @__PURE__ */ __name((input, { session }) => {
  const [s3ClientProvider, CreateSessionCommandCtor] = session;
  const { forcePathStyle, useAccelerateEndpoint, disableMultiregionAccessPoints, followRegionRedirects, s3ExpressIdentityProvider, bucketEndpoint, expectContinueHeader } = input;
  return Object.assign(input, {
    forcePathStyle: forcePathStyle ?? false,
    useAccelerateEndpoint: useAccelerateEndpoint ?? false,
    disableMultiregionAccessPoints: disableMultiregionAccessPoints ?? false,
    followRegionRedirects: followRegionRedirects ?? false,
    s3ExpressIdentityProvider: s3ExpressIdentityProvider ?? new S3ExpressIdentityProviderImpl(async (key) => s3ClientProvider().send(new CreateSessionCommandCtor({
      Bucket: key
    }))),
    bucketEndpoint: bucketEndpoint ?? false,
    expectContinueHeader: expectContinueHeader ?? 2097152
  });
}, "resolveS3Config");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/throw-200-exceptions.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var THROW_IF_EMPTY_BODY = {
  CopyObjectCommand: true,
  UploadPartCopyCommand: true,
  CompleteMultipartUploadCommand: true
};
var MAX_BYTES_TO_INSPECT = 3e3;
var throw200ExceptionsMiddleware = /* @__PURE__ */ __name((config) => (next, context) => async (args) => {
  const result = await next(args);
  const { response } = result;
  if (!HttpResponse.isInstance(response)) {
    return result;
  }
  const { statusCode, body: sourceBody } = response;
  if (statusCode < 200 || statusCode >= 300) {
    return result;
  }
  const isSplittableStream = typeof sourceBody?.stream === "function" || typeof sourceBody?.pipe === "function" || typeof sourceBody?.tee === "function";
  if (!isSplittableStream) {
    return result;
  }
  let bodyCopy = sourceBody;
  let body = sourceBody;
  if (sourceBody && typeof sourceBody === "object" && !(sourceBody instanceof Uint8Array)) {
    [bodyCopy, body] = await splitStream(sourceBody);
  }
  response.body = body;
  const bodyBytes = await collectBody2(bodyCopy, {
    streamCollector: async (stream) => {
      return headStream(stream, MAX_BYTES_TO_INSPECT);
    }
  });
  if (typeof bodyCopy?.destroy === "function") {
    bodyCopy.destroy();
  }
  const bodyStringTail = config.utf8Encoder(bodyBytes.subarray(bodyBytes.length - 16));
  if (bodyBytes.length === 0 && THROW_IF_EMPTY_BODY[context.commandName]) {
    const err = new Error("S3 aborted request");
    err.name = "InternalError";
    throw err;
  }
  if (bodyStringTail && bodyStringTail.endsWith("</Error>")) {
    response.statusCode = 400;
  }
  return result;
}, "throw200ExceptionsMiddleware");
var collectBody2 = /* @__PURE__ */ __name((streamBody = new Uint8Array(), context) => {
  if (streamBody instanceof Uint8Array) {
    return Promise.resolve(streamBody);
  }
  return context.streamCollector(streamBody) || Promise.resolve(new Uint8Array());
}, "collectBody");
var throw200ExceptionsMiddlewareOptions = {
  relation: "after",
  toMiddleware: "deserializerMiddleware",
  tags: ["THROW_200_EXCEPTIONS", "S3"],
  name: "throw200ExceptionsMiddleware",
  override: true
};
var getThrow200ExceptionsPlugin = /* @__PURE__ */ __name((config) => ({
  applyToStack: (clientStack) => {
    clientStack.addRelativeTo(throw200ExceptionsMiddleware(config), throw200ExceptionsMiddlewareOptions);
  }
}), "getThrow200ExceptionsPlugin");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/validate-bucket-name.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-arn-parser/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var validate = /* @__PURE__ */ __name((str) => typeof str === "string" && str.indexOf("arn:") === 0 && str.split(":").length >= 6, "validate");

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/bucket-endpoint-middleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function bucketEndpointMiddleware(options) {
  return (next, context) => async (args) => {
    if (options.bucketEndpoint) {
      const endpoint = context.endpointV2;
      if (endpoint) {
        const bucket = args.input.Bucket;
        if (typeof bucket === "string") {
          try {
            const bucketEndpointUrl = new URL(bucket);
            context.endpointV2 = {
              ...endpoint,
              url: bucketEndpointUrl
            };
          } catch (e2) {
            const warning = `@aws-sdk/middleware-sdk-s3: bucketEndpoint=true was set but Bucket=${bucket} could not be parsed as URL.`;
            if (context.logger?.constructor?.name === "NoOpLogger") {
              console.warn(warning);
            } else {
              context.logger?.warn?.(warning);
            }
            throw e2;
          }
        }
      }
    }
    return next(args);
  };
}
__name(bucketEndpointMiddleware, "bucketEndpointMiddleware");
var bucketEndpointMiddlewareOptions = {
  name: "bucketEndpointMiddleware",
  override: true,
  relation: "after",
  toMiddleware: "endpointV2Middleware"
};

// node_modules/@aws-sdk/middleware-sdk-s3/dist-es/validate-bucket-name.js
function validateBucketNameMiddleware({ bucketEndpoint }) {
  return (next) => async (args) => {
    const { input: { Bucket: Bucket2 } } = args;
    if (!bucketEndpoint && typeof Bucket2 === "string" && !validate(Bucket2) && Bucket2.indexOf("/") >= 0) {
      const err = new Error(`Bucket name shouldn't contain '/', received '${Bucket2}'`);
      err.name = "InvalidBucketName";
      throw err;
    }
    return next({ ...args });
  };
}
__name(validateBucketNameMiddleware, "validateBucketNameMiddleware");
var validateBucketNameMiddlewareOptions = {
  step: "initialize",
  tags: ["VALIDATE_BUCKET_NAME"],
  name: "validateBucketNameMiddleware",
  override: true
};
var getValidateBucketNamePlugin = /* @__PURE__ */ __name((options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(validateBucketNameMiddleware(options), validateBucketNameMiddlewareOptions);
    clientStack.addRelativeTo(bucketEndpointMiddleware(options), bucketEndpointMiddlewareOptions);
  }
}), "getValidateBucketNamePlugin");

// node_modules/@aws-sdk/middleware-user-agent/dist-es/configurations.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var DEFAULT_UA_APP_ID = void 0;
function isValidUserAgentAppId(appId) {
  if (appId === void 0) {
    return true;
  }
  return typeof appId === "string" && appId.length <= 50;
}
__name(isValidUserAgentAppId, "isValidUserAgentAppId");
function resolveUserAgentConfig(input) {
  const normalizedAppIdProvider = normalizeProvider2(input.userAgentAppId ?? DEFAULT_UA_APP_ID);
  const { customUserAgent } = input;
  return Object.assign(input, {
    customUserAgent: typeof customUserAgent === "string" ? [[customUserAgent]] : customUserAgent,
    userAgentAppId: async () => {
      const appId = await normalizedAppIdProvider();
      if (!isValidUserAgentAppId(appId)) {
        const logger2 = input.logger?.constructor?.name === "NoOpLogger" || !input.logger ? console : input.logger;
        if (typeof appId !== "string") {
          logger2?.warn("userAgentAppId must be a string or undefined.");
        } else if (appId.length > 50) {
          logger2?.warn("The provided userAgentAppId exceeds the maximum length of 50 characters.");
        }
      }
      return appId;
    }
  });
}
__name(resolveUserAgentConfig, "resolveUserAgentConfig");

// node_modules/@aws-sdk/middleware-user-agent/dist-es/user-agent-middleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/aws.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-endpoints/dist-es/cache/EndpointCache.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var EndpointCache = class {
  capacity;
  data = /* @__PURE__ */ new Map();
  parameters = [];
  constructor({ size, params }) {
    this.capacity = size ?? 50;
    if (params) {
      this.parameters = params;
    }
  }
  get(endpointParams, resolver) {
    const key = this.hash(endpointParams);
    if (key === false) {
      return resolver();
    }
    if (!this.data.has(key)) {
      if (this.data.size > this.capacity + 10) {
        const keys = this.data.keys();
        let i2 = 0;
        while (true) {
          const { value, done } = keys.next();
          this.data.delete(value);
          if (done || ++i2 > 10) {
            break;
          }
        }
      }
      this.data.set(key, resolver());
    }
    return this.data.get(key);
  }
  size() {
    return this.data.size;
  }
  hash(endpointParams) {
    let buffer = "";
    const { parameters } = this;
    if (parameters.length === 0) {
      return false;
    }
    for (const param of parameters) {
      const val = String(endpointParams[param] ?? "");
      if (val.includes("|;")) {
        return false;
      }
      buffer += val + "|;";
    }
    return buffer;
  }
};
__name(EndpointCache, "EndpointCache");

// node_modules/@smithy/util-endpoints/dist-es/lib/isIpAddress.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var IP_V4_REGEX = new RegExp(`^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}$`);
var isIpAddress = /* @__PURE__ */ __name((value) => IP_V4_REGEX.test(value) || value.startsWith("[") && value.endsWith("]"), "isIpAddress");

// node_modules/@smithy/util-endpoints/dist-es/lib/isValidHostLabel.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var VALID_HOST_LABEL_REGEX = new RegExp(`^(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$`);
var isValidHostLabel = /* @__PURE__ */ __name((value, allowSubDomains = false) => {
  if (!allowSubDomains) {
    return VALID_HOST_LABEL_REGEX.test(value);
  }
  const labels = value.split(".");
  for (const label of labels) {
    if (!isValidHostLabel(label)) {
      return false;
    }
  }
  return true;
}, "isValidHostLabel");

// node_modules/@smithy/util-endpoints/dist-es/utils/customEndpointFunctions.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var customEndpointFunctions = {};

// node_modules/@smithy/util-endpoints/dist-es/resolveEndpoint.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-endpoints/dist-es/debug/debugId.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var debugId = "endpoints";

// node_modules/@smithy/util-endpoints/dist-es/debug/toDebugString.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function toDebugString(input) {
  if (typeof input !== "object" || input == null) {
    return input;
  }
  if ("ref" in input) {
    return `$${toDebugString(input.ref)}`;
  }
  if ("fn" in input) {
    return `${input.fn}(${(input.argv || []).map(toDebugString).join(", ")})`;
  }
  return JSON.stringify(input, null, 2);
}
__name(toDebugString, "toDebugString");

// node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var EndpointError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "EndpointError";
  }
};
__name(EndpointError, "EndpointError");

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateRules.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateConditions.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateCondition.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-endpoints/dist-es/utils/callFunction.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateExpression.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-endpoints/dist-es/utils/endpointFunctions.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-endpoints/dist-es/lib/booleanEquals.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var booleanEquals = /* @__PURE__ */ __name((value1, value2) => value1 === value2, "booleanEquals");

// node_modules/@smithy/util-endpoints/dist-es/lib/getAttr.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-endpoints/dist-es/lib/getAttrPathList.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getAttrPathList = /* @__PURE__ */ __name((path) => {
  const parts = path.split(".");
  const pathList = [];
  for (const part of parts) {
    const squareBracketIndex = part.indexOf("[");
    if (squareBracketIndex !== -1) {
      if (part.indexOf("]") !== part.length - 1) {
        throw new EndpointError(`Path: '${path}' does not end with ']'`);
      }
      const arrayIndex = part.slice(squareBracketIndex + 1, -1);
      if (Number.isNaN(parseInt(arrayIndex))) {
        throw new EndpointError(`Invalid array index: '${arrayIndex}' in path: '${path}'`);
      }
      if (squareBracketIndex !== 0) {
        pathList.push(part.slice(0, squareBracketIndex));
      }
      pathList.push(arrayIndex);
    } else {
      pathList.push(part);
    }
  }
  return pathList;
}, "getAttrPathList");

// node_modules/@smithy/util-endpoints/dist-es/lib/getAttr.js
var getAttr = /* @__PURE__ */ __name((value, path) => getAttrPathList(path).reduce((acc, index) => {
  if (typeof acc !== "object") {
    throw new EndpointError(`Index '${index}' in '${path}' not found in '${JSON.stringify(value)}'`);
  } else if (Array.isArray(acc)) {
    return acc[parseInt(index)];
  }
  return acc[index];
}, value), "getAttr");

// node_modules/@smithy/util-endpoints/dist-es/lib/isSet.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var isSet = /* @__PURE__ */ __name((value) => value != null, "isSet");

// node_modules/@smithy/util-endpoints/dist-es/lib/not.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var not = /* @__PURE__ */ __name((value) => !value, "not");

// node_modules/@smithy/util-endpoints/dist-es/lib/parseURL.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var DEFAULT_PORTS = {
  [EndpointURLScheme.HTTP]: 80,
  [EndpointURLScheme.HTTPS]: 443
};
var parseURL = /* @__PURE__ */ __name((value) => {
  const whatwgURL = (() => {
    try {
      if (value instanceof URL) {
        return value;
      }
      if (typeof value === "object" && "hostname" in value) {
        const { hostname: hostname2, port, protocol: protocol2 = "", path = "", query = {} } = value;
        const url = new URL(`${protocol2}//${hostname2}${port ? `:${port}` : ""}${path}`);
        url.search = Object.entries(query).map(([k2, v3]) => `${k2}=${v3}`).join("&");
        return url;
      }
      return new URL(value);
    } catch (error) {
      return null;
    }
  })();
  if (!whatwgURL) {
    console.error(`Unable to parse ${JSON.stringify(value)} as a whatwg URL.`);
    return null;
  }
  const urlString = whatwgURL.href;
  const { host, hostname, pathname, protocol, search } = whatwgURL;
  if (search) {
    return null;
  }
  const scheme = protocol.slice(0, -1);
  if (!Object.values(EndpointURLScheme).includes(scheme)) {
    return null;
  }
  const isIp = isIpAddress(hostname);
  const inputContainsDefaultPort = urlString.includes(`${host}:${DEFAULT_PORTS[scheme]}`) || typeof value === "string" && value.includes(`${host}:${DEFAULT_PORTS[scheme]}`);
  const authority = `${host}${inputContainsDefaultPort ? `:${DEFAULT_PORTS[scheme]}` : ``}`;
  return {
    scheme,
    authority,
    path: pathname,
    normalizedPath: pathname.endsWith("/") ? pathname : `${pathname}/`,
    isIp
  };
}, "parseURL");

// node_modules/@smithy/util-endpoints/dist-es/lib/stringEquals.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var stringEquals = /* @__PURE__ */ __name((value1, value2) => value1 === value2, "stringEquals");

// node_modules/@smithy/util-endpoints/dist-es/lib/substring.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var substring = /* @__PURE__ */ __name((input, start, stop, reverse) => {
  if (start >= stop || input.length < stop) {
    return null;
  }
  if (!reverse) {
    return input.substring(start, stop);
  }
  return input.substring(input.length - stop, input.length - start);
}, "substring");

// node_modules/@smithy/util-endpoints/dist-es/lib/uriEncode.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var uriEncode = /* @__PURE__ */ __name((value) => encodeURIComponent(value).replace(/[!*'()]/g, (c2) => `%${c2.charCodeAt(0).toString(16).toUpperCase()}`), "uriEncode");

// node_modules/@smithy/util-endpoints/dist-es/utils/endpointFunctions.js
var endpointFunctions = {
  booleanEquals,
  getAttr,
  isSet,
  isValidHostLabel,
  not,
  parseURL,
  stringEquals,
  substring,
  uriEncode
};

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateTemplate.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var evaluateTemplate = /* @__PURE__ */ __name((template, options) => {
  const evaluatedTemplateArr = [];
  const templateContext = {
    ...options.endpointParams,
    ...options.referenceRecord
  };
  let currentIndex = 0;
  while (currentIndex < template.length) {
    const openingBraceIndex = template.indexOf("{", currentIndex);
    if (openingBraceIndex === -1) {
      evaluatedTemplateArr.push(template.slice(currentIndex));
      break;
    }
    evaluatedTemplateArr.push(template.slice(currentIndex, openingBraceIndex));
    const closingBraceIndex = template.indexOf("}", openingBraceIndex);
    if (closingBraceIndex === -1) {
      evaluatedTemplateArr.push(template.slice(openingBraceIndex));
      break;
    }
    if (template[openingBraceIndex + 1] === "{" && template[closingBraceIndex + 1] === "}") {
      evaluatedTemplateArr.push(template.slice(openingBraceIndex + 1, closingBraceIndex));
      currentIndex = closingBraceIndex + 2;
    }
    const parameterName = template.substring(openingBraceIndex + 1, closingBraceIndex);
    if (parameterName.includes("#")) {
      const [refName, attrName] = parameterName.split("#");
      evaluatedTemplateArr.push(getAttr(templateContext[refName], attrName));
    } else {
      evaluatedTemplateArr.push(templateContext[parameterName]);
    }
    currentIndex = closingBraceIndex + 1;
  }
  return evaluatedTemplateArr.join("");
}, "evaluateTemplate");

// node_modules/@smithy/util-endpoints/dist-es/utils/getReferenceValue.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getReferenceValue = /* @__PURE__ */ __name(({ ref }, options) => {
  const referenceRecord = {
    ...options.endpointParams,
    ...options.referenceRecord
  };
  return referenceRecord[ref];
}, "getReferenceValue");

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateExpression.js
var evaluateExpression = /* @__PURE__ */ __name((obj, keyName, options) => {
  if (typeof obj === "string") {
    return evaluateTemplate(obj, options);
  } else if (obj["fn"]) {
    return group.callFunction(obj, options);
  } else if (obj["ref"]) {
    return getReferenceValue(obj, options);
  }
  throw new EndpointError(`'${keyName}': ${String(obj)} is not a string, function or reference.`);
}, "evaluateExpression");
var callFunction = /* @__PURE__ */ __name(({ fn, argv }, options) => {
  const evaluatedArgs = argv.map((arg) => ["boolean", "number"].includes(typeof arg) ? arg : group.evaluateExpression(arg, "arg", options));
  const fnSegments = fn.split(".");
  if (fnSegments[0] in customEndpointFunctions && fnSegments[1] != null) {
    return customEndpointFunctions[fnSegments[0]][fnSegments[1]](...evaluatedArgs);
  }
  return endpointFunctions[fn](...evaluatedArgs);
}, "callFunction");
var group = {
  evaluateExpression,
  callFunction
};

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateCondition.js
var evaluateCondition = /* @__PURE__ */ __name(({ assign, ...fnArgs }, options) => {
  if (assign && assign in options.referenceRecord) {
    throw new EndpointError(`'${assign}' is already defined in Reference Record.`);
  }
  const value = callFunction(fnArgs, options);
  options.logger?.debug?.(`${debugId} evaluateCondition: ${toDebugString(fnArgs)} = ${toDebugString(value)}`);
  return {
    result: value === "" ? true : !!value,
    ...assign != null && { toAssign: { name: assign, value } }
  };
}, "evaluateCondition");

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateConditions.js
var evaluateConditions = /* @__PURE__ */ __name((conditions = [], options) => {
  const conditionsReferenceRecord = {};
  for (const condition of conditions) {
    const { result, toAssign } = evaluateCondition(condition, {
      ...options,
      referenceRecord: {
        ...options.referenceRecord,
        ...conditionsReferenceRecord
      }
    });
    if (!result) {
      return { result };
    }
    if (toAssign) {
      conditionsReferenceRecord[toAssign.name] = toAssign.value;
      options.logger?.debug?.(`${debugId} assign: ${toAssign.name} := ${toDebugString(toAssign.value)}`);
    }
  }
  return { result: true, referenceRecord: conditionsReferenceRecord };
}, "evaluateConditions");

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateEndpointRule.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-endpoints/dist-es/utils/getEndpointHeaders.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getEndpointHeaders = /* @__PURE__ */ __name((headers, options) => Object.entries(headers).reduce((acc, [headerKey, headerVal]) => ({
  ...acc,
  [headerKey]: headerVal.map((headerValEntry) => {
    const processedExpr = evaluateExpression(headerValEntry, "Header value entry", options);
    if (typeof processedExpr !== "string") {
      throw new EndpointError(`Header '${headerKey}' value '${processedExpr}' is not a string`);
    }
    return processedExpr;
  })
}), {}), "getEndpointHeaders");

// node_modules/@smithy/util-endpoints/dist-es/utils/getEndpointProperties.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getEndpointProperties = /* @__PURE__ */ __name((properties, options) => Object.entries(properties).reduce((acc, [propertyKey, propertyVal]) => ({
  ...acc,
  [propertyKey]: group2.getEndpointProperty(propertyVal, options)
}), {}), "getEndpointProperties");
var getEndpointProperty = /* @__PURE__ */ __name((property, options) => {
  if (Array.isArray(property)) {
    return property.map((propertyEntry) => getEndpointProperty(propertyEntry, options));
  }
  switch (typeof property) {
    case "string":
      return evaluateTemplate(property, options);
    case "object":
      if (property === null) {
        throw new EndpointError(`Unexpected endpoint property: ${property}`);
      }
      return group2.getEndpointProperties(property, options);
    case "boolean":
      return property;
    default:
      throw new EndpointError(`Unexpected endpoint property type: ${typeof property}`);
  }
}, "getEndpointProperty");
var group2 = {
  getEndpointProperty,
  getEndpointProperties
};

// node_modules/@smithy/util-endpoints/dist-es/utils/getEndpointUrl.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getEndpointUrl = /* @__PURE__ */ __name((endpointUrl, options) => {
  const expression = evaluateExpression(endpointUrl, "Endpoint URL", options);
  if (typeof expression === "string") {
    try {
      return new URL(expression);
    } catch (error) {
      console.error(`Failed to construct URL with ${expression}`, error);
      throw error;
    }
  }
  throw new EndpointError(`Endpoint URL must be a string, got ${typeof expression}`);
}, "getEndpointUrl");

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateEndpointRule.js
var evaluateEndpointRule = /* @__PURE__ */ __name((endpointRule, options) => {
  const { conditions, endpoint } = endpointRule;
  const { result, referenceRecord } = evaluateConditions(conditions, options);
  if (!result) {
    return;
  }
  const endpointRuleOptions = {
    ...options,
    referenceRecord: { ...options.referenceRecord, ...referenceRecord }
  };
  const { url, properties, headers } = endpoint;
  options.logger?.debug?.(`${debugId} Resolving endpoint from template: ${toDebugString(endpoint)}`);
  return {
    ...headers != void 0 && {
      headers: getEndpointHeaders(headers, endpointRuleOptions)
    },
    ...properties != void 0 && {
      properties: getEndpointProperties(properties, endpointRuleOptions)
    },
    url: getEndpointUrl(url, endpointRuleOptions)
  };
}, "evaluateEndpointRule");

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateErrorRule.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var evaluateErrorRule = /* @__PURE__ */ __name((errorRule, options) => {
  const { conditions, error } = errorRule;
  const { result, referenceRecord } = evaluateConditions(conditions, options);
  if (!result) {
    return;
  }
  throw new EndpointError(evaluateExpression(error, "Error", {
    ...options,
    referenceRecord: { ...options.referenceRecord, ...referenceRecord }
  }));
}, "evaluateErrorRule");

// node_modules/@smithy/util-endpoints/dist-es/utils/evaluateRules.js
var evaluateRules = /* @__PURE__ */ __name((rules, options) => {
  for (const rule of rules) {
    if (rule.type === "endpoint") {
      const endpointOrUndefined = evaluateEndpointRule(rule, options);
      if (endpointOrUndefined) {
        return endpointOrUndefined;
      }
    } else if (rule.type === "error") {
      evaluateErrorRule(rule, options);
    } else if (rule.type === "tree") {
      const endpointOrUndefined = group3.evaluateTreeRule(rule, options);
      if (endpointOrUndefined) {
        return endpointOrUndefined;
      }
    } else {
      throw new EndpointError(`Unknown endpoint rule: ${rule}`);
    }
  }
  throw new EndpointError(`Rules evaluation failed`);
}, "evaluateRules");
var evaluateTreeRule = /* @__PURE__ */ __name((treeRule, options) => {
  const { conditions, rules } = treeRule;
  const { result, referenceRecord } = evaluateConditions(conditions, options);
  if (!result) {
    return;
  }
  return group3.evaluateRules(rules, {
    ...options,
    referenceRecord: { ...options.referenceRecord, ...referenceRecord }
  });
}, "evaluateTreeRule");
var group3 = {
  evaluateRules,
  evaluateTreeRule
};

// node_modules/@smithy/util-endpoints/dist-es/resolveEndpoint.js
var resolveEndpoint = /* @__PURE__ */ __name((ruleSetObject, options) => {
  const { endpointParams, logger: logger2 } = options;
  const { parameters, rules } = ruleSetObject;
  options.logger?.debug?.(`${debugId} Initial EndpointParams: ${toDebugString(endpointParams)}`);
  const paramsWithDefault = Object.entries(parameters).filter(([, v3]) => v3.default != null).map(([k2, v3]) => [k2, v3.default]);
  if (paramsWithDefault.length > 0) {
    for (const [paramKey, paramDefaultValue] of paramsWithDefault) {
      endpointParams[paramKey] = endpointParams[paramKey] ?? paramDefaultValue;
    }
  }
  const requiredParams = Object.entries(parameters).filter(([, v3]) => v3.required).map(([k2]) => k2);
  for (const requiredParam of requiredParams) {
    if (endpointParams[requiredParam] == null) {
      throw new EndpointError(`Missing required parameter: '${requiredParam}'`);
    }
  }
  const endpoint = evaluateRules(rules, { endpointParams, logger: logger2, referenceRecord: {} });
  options.logger?.debug?.(`${debugId} Resolved endpoint: ${toDebugString(endpoint)}`);
  return endpoint;
}, "resolveEndpoint");

// node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/isVirtualHostableS3Bucket.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/lib/isIpAddress.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/isVirtualHostableS3Bucket.js
var isVirtualHostableS3Bucket = /* @__PURE__ */ __name((value, allowSubDomains = false) => {
  if (allowSubDomains) {
    for (const label of value.split(".")) {
      if (!isVirtualHostableS3Bucket(label)) {
        return false;
      }
    }
    return true;
  }
  if (!isValidHostLabel(value)) {
    return false;
  }
  if (value.length < 3 || value.length > 63) {
    return false;
  }
  if (value !== value.toLowerCase()) {
    return false;
  }
  if (isIpAddress(value)) {
    return false;
  }
  return true;
}, "isVirtualHostableS3Bucket");

// node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/parseArn.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var ARN_DELIMITER = ":";
var RESOURCE_DELIMITER = "/";
var parseArn = /* @__PURE__ */ __name((value) => {
  const segments = value.split(ARN_DELIMITER);
  if (segments.length < 6)
    return null;
  const [arn, partition2, service, region, accountId, ...resourcePath] = segments;
  if (arn !== "arn" || partition2 === "" || service === "" || resourcePath.join(ARN_DELIMITER) === "")
    return null;
  const resourceId = resourcePath.map((resource) => resource.split(RESOURCE_DELIMITER)).flat();
  return {
    partition: partition2,
    service,
    region,
    accountId,
    resourceId
  };
}, "parseArn");

// node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/partition.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/partitions.json
var partitions_default = {
  partitions: [{
    id: "aws",
    outputs: {
      dnsSuffix: "amazonaws.com",
      dualStackDnsSuffix: "api.aws",
      implicitGlobalRegion: "us-east-1",
      name: "aws",
      supportsDualStack: true,
      supportsFIPS: true
    },
    regionRegex: "^(us|eu|ap|sa|ca|me|af|il|mx)\\-\\w+\\-\\d+$",
    regions: {
      "af-south-1": {
        description: "Africa (Cape Town)"
      },
      "ap-east-1": {
        description: "Asia Pacific (Hong Kong)"
      },
      "ap-east-2": {
        description: "Asia Pacific (Taipei)"
      },
      "ap-northeast-1": {
        description: "Asia Pacific (Tokyo)"
      },
      "ap-northeast-2": {
        description: "Asia Pacific (Seoul)"
      },
      "ap-northeast-3": {
        description: "Asia Pacific (Osaka)"
      },
      "ap-south-1": {
        description: "Asia Pacific (Mumbai)"
      },
      "ap-south-2": {
        description: "Asia Pacific (Hyderabad)"
      },
      "ap-southeast-1": {
        description: "Asia Pacific (Singapore)"
      },
      "ap-southeast-2": {
        description: "Asia Pacific (Sydney)"
      },
      "ap-southeast-3": {
        description: "Asia Pacific (Jakarta)"
      },
      "ap-southeast-4": {
        description: "Asia Pacific (Melbourne)"
      },
      "ap-southeast-5": {
        description: "Asia Pacific (Malaysia)"
      },
      "ap-southeast-6": {
        description: "Asia Pacific (New Zealand)"
      },
      "ap-southeast-7": {
        description: "Asia Pacific (Thailand)"
      },
      "aws-global": {
        description: "aws global region"
      },
      "ca-central-1": {
        description: "Canada (Central)"
      },
      "ca-west-1": {
        description: "Canada West (Calgary)"
      },
      "eu-central-1": {
        description: "Europe (Frankfurt)"
      },
      "eu-central-2": {
        description: "Europe (Zurich)"
      },
      "eu-north-1": {
        description: "Europe (Stockholm)"
      },
      "eu-south-1": {
        description: "Europe (Milan)"
      },
      "eu-south-2": {
        description: "Europe (Spain)"
      },
      "eu-west-1": {
        description: "Europe (Ireland)"
      },
      "eu-west-2": {
        description: "Europe (London)"
      },
      "eu-west-3": {
        description: "Europe (Paris)"
      },
      "il-central-1": {
        description: "Israel (Tel Aviv)"
      },
      "me-central-1": {
        description: "Middle East (UAE)"
      },
      "me-south-1": {
        description: "Middle East (Bahrain)"
      },
      "mx-central-1": {
        description: "Mexico (Central)"
      },
      "sa-east-1": {
        description: "South America (Sao Paulo)"
      },
      "us-east-1": {
        description: "US East (N. Virginia)"
      },
      "us-east-2": {
        description: "US East (Ohio)"
      },
      "us-west-1": {
        description: "US West (N. California)"
      },
      "us-west-2": {
        description: "US West (Oregon)"
      }
    }
  }, {
    id: "aws-cn",
    outputs: {
      dnsSuffix: "amazonaws.com.cn",
      dualStackDnsSuffix: "api.amazonwebservices.com.cn",
      implicitGlobalRegion: "cn-northwest-1",
      name: "aws-cn",
      supportsDualStack: true,
      supportsFIPS: true
    },
    regionRegex: "^cn\\-\\w+\\-\\d+$",
    regions: {
      "aws-cn-global": {
        description: "aws-cn global region"
      },
      "cn-north-1": {
        description: "China (Beijing)"
      },
      "cn-northwest-1": {
        description: "China (Ningxia)"
      }
    }
  }, {
    id: "aws-eusc",
    outputs: {
      dnsSuffix: "amazonaws.eu",
      dualStackDnsSuffix: "api.amazonwebservices.eu",
      implicitGlobalRegion: "eusc-de-east-1",
      name: "aws-eusc",
      supportsDualStack: true,
      supportsFIPS: true
    },
    regionRegex: "^eusc\\-(de)\\-\\w+\\-\\d+$",
    regions: {
      "eusc-de-east-1": {
        description: "EU (Germany)"
      }
    }
  }, {
    id: "aws-iso",
    outputs: {
      dnsSuffix: "c2s.ic.gov",
      dualStackDnsSuffix: "api.aws.ic.gov",
      implicitGlobalRegion: "us-iso-east-1",
      name: "aws-iso",
      supportsDualStack: true,
      supportsFIPS: true
    },
    regionRegex: "^us\\-iso\\-\\w+\\-\\d+$",
    regions: {
      "aws-iso-global": {
        description: "aws-iso global region"
      },
      "us-iso-east-1": {
        description: "US ISO East"
      },
      "us-iso-west-1": {
        description: "US ISO WEST"
      }
    }
  }, {
    id: "aws-iso-b",
    outputs: {
      dnsSuffix: "sc2s.sgov.gov",
      dualStackDnsSuffix: "api.aws.scloud",
      implicitGlobalRegion: "us-isob-east-1",
      name: "aws-iso-b",
      supportsDualStack: true,
      supportsFIPS: true
    },
    regionRegex: "^us\\-isob\\-\\w+\\-\\d+$",
    regions: {
      "aws-iso-b-global": {
        description: "aws-iso-b global region"
      },
      "us-isob-east-1": {
        description: "US ISOB East (Ohio)"
      },
      "us-isob-west-1": {
        description: "US ISOB West"
      }
    }
  }, {
    id: "aws-iso-e",
    outputs: {
      dnsSuffix: "cloud.adc-e.uk",
      dualStackDnsSuffix: "api.cloud-aws.adc-e.uk",
      implicitGlobalRegion: "eu-isoe-west-1",
      name: "aws-iso-e",
      supportsDualStack: true,
      supportsFIPS: true
    },
    regionRegex: "^eu\\-isoe\\-\\w+\\-\\d+$",
    regions: {
      "aws-iso-e-global": {
        description: "aws-iso-e global region"
      },
      "eu-isoe-west-1": {
        description: "EU ISOE West"
      }
    }
  }, {
    id: "aws-iso-f",
    outputs: {
      dnsSuffix: "csp.hci.ic.gov",
      dualStackDnsSuffix: "api.aws.hci.ic.gov",
      implicitGlobalRegion: "us-isof-south-1",
      name: "aws-iso-f",
      supportsDualStack: true,
      supportsFIPS: true
    },
    regionRegex: "^us\\-isof\\-\\w+\\-\\d+$",
    regions: {
      "aws-iso-f-global": {
        description: "aws-iso-f global region"
      },
      "us-isof-east-1": {
        description: "US ISOF EAST"
      },
      "us-isof-south-1": {
        description: "US ISOF SOUTH"
      }
    }
  }, {
    id: "aws-us-gov",
    outputs: {
      dnsSuffix: "amazonaws.com",
      dualStackDnsSuffix: "api.aws",
      implicitGlobalRegion: "us-gov-west-1",
      name: "aws-us-gov",
      supportsDualStack: true,
      supportsFIPS: true
    },
    regionRegex: "^us\\-gov\\-\\w+\\-\\d+$",
    regions: {
      "aws-us-gov-global": {
        description: "aws-us-gov global region"
      },
      "us-gov-east-1": {
        description: "AWS GovCloud (US-East)"
      },
      "us-gov-west-1": {
        description: "AWS GovCloud (US-West)"
      }
    }
  }],
  version: "1.1"
};

// node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/partition.js
var selectedPartitionsInfo = partitions_default;
var selectedUserAgentPrefix = "";
var partition = /* @__PURE__ */ __name((value) => {
  const { partitions } = selectedPartitionsInfo;
  for (const partition2 of partitions) {
    const { regions, outputs } = partition2;
    for (const [region, regionData] of Object.entries(regions)) {
      if (region === value) {
        return {
          ...outputs,
          ...regionData
        };
      }
    }
  }
  for (const partition2 of partitions) {
    const { regionRegex, outputs } = partition2;
    if (new RegExp(regionRegex).test(value)) {
      return {
        ...outputs
      };
    }
  }
  const DEFAULT_PARTITION = partitions.find((partition2) => partition2.id === "aws");
  if (!DEFAULT_PARTITION) {
    throw new Error("Provided region was not found in the partition array or regex, and default partition with id 'aws' doesn't exist.");
  }
  return {
    ...DEFAULT_PARTITION.outputs
  };
}, "partition");
var getUserAgentPrefix = /* @__PURE__ */ __name(() => selectedUserAgentPrefix, "getUserAgentPrefix");

// node_modules/@aws-sdk/util-endpoints/dist-es/aws.js
var awsEndpointFunctions = {
  isVirtualHostableS3Bucket,
  parseArn,
  partition
};
customEndpointFunctions.aws = awsEndpointFunctions;

// node_modules/@aws-sdk/util-endpoints/dist-es/resolveDefaultAwsRegionalEndpointsConfig.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/url-parser/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/querystring-parser/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function parseQueryString(querystring) {
  const query = {};
  querystring = querystring.replace(/^\?/, "");
  if (querystring) {
    for (const pair of querystring.split("&")) {
      let [key, value = null] = pair.split("=");
      key = decodeURIComponent(key);
      if (value) {
        value = decodeURIComponent(value);
      }
      if (!(key in query)) {
        query[key] = value;
      } else if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    }
  }
  return query;
}
__name(parseQueryString, "parseQueryString");

// node_modules/@smithy/url-parser/dist-es/index.js
var parseUrl = /* @__PURE__ */ __name((url) => {
  if (typeof url === "string") {
    return parseUrl(new URL(url));
  }
  const { hostname, pathname, port, protocol, search } = url;
  let query;
  if (search) {
    query = parseQueryString(search);
  }
  return {
    hostname,
    port: port ? parseInt(port) : void 0,
    protocol,
    path: pathname,
    query
  };
}, "parseUrl");

// node_modules/@aws-sdk/util-endpoints/dist-es/resolveEndpoint.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/types/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/types/EndpointError.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/types/EndpointRuleObject.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/types/ErrorRuleObject.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/types/RuleSetObject.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/types/TreeRuleObject.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-endpoints/dist-es/types/shared.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/middleware-user-agent/dist-es/check-features.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var ACCOUNT_ID_ENDPOINT_REGEX = /\d{12}\.ddb/;
async function checkFeatures(context, config, args) {
  const request = args.request;
  if (request?.headers?.["smithy-protocol"] === "rpc-v2-cbor") {
    setFeature(context, "PROTOCOL_RPC_V2_CBOR", "M");
  }
  if (typeof config.retryStrategy === "function") {
    const retryStrategy = await config.retryStrategy();
    if (typeof retryStrategy.acquireInitialRetryToken === "function") {
      if (retryStrategy.constructor?.name?.includes("Adaptive")) {
        setFeature(context, "RETRY_MODE_ADAPTIVE", "F");
      } else {
        setFeature(context, "RETRY_MODE_STANDARD", "E");
      }
    } else {
      setFeature(context, "RETRY_MODE_LEGACY", "D");
    }
  }
  if (typeof config.accountIdEndpointMode === "function") {
    const endpointV2 = context.endpointV2;
    if (String(endpointV2?.url?.hostname).match(ACCOUNT_ID_ENDPOINT_REGEX)) {
      setFeature(context, "ACCOUNT_ID_ENDPOINT", "O");
    }
    switch (await config.accountIdEndpointMode?.()) {
      case "disabled":
        setFeature(context, "ACCOUNT_ID_MODE_DISABLED", "Q");
        break;
      case "preferred":
        setFeature(context, "ACCOUNT_ID_MODE_PREFERRED", "P");
        break;
      case "required":
        setFeature(context, "ACCOUNT_ID_MODE_REQUIRED", "R");
        break;
    }
  }
  const identity = context.__smithy_context?.selectedHttpAuthScheme?.identity;
  if (identity?.$source) {
    const credentials = identity;
    if (credentials.accountId) {
      setFeature(context, "RESOLVED_ACCOUNT_ID", "T");
    }
    for (const [key, value] of Object.entries(credentials.$source ?? {})) {
      setFeature(context, key, value);
    }
  }
}
__name(checkFeatures, "checkFeatures");

// node_modules/@aws-sdk/middleware-user-agent/dist-es/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var USER_AGENT = "user-agent";
var X_AMZ_USER_AGENT = "x-amz-user-agent";
var SPACE = " ";
var UA_NAME_SEPARATOR = "/";
var UA_NAME_ESCAPE_REGEX = /[^!$%&'*+\-.^_`|~\w]/g;
var UA_VALUE_ESCAPE_REGEX = /[^!$%&'*+\-.^_`|~\w#]/g;
var UA_ESCAPE_CHAR = "-";

// node_modules/@aws-sdk/middleware-user-agent/dist-es/encode-features.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var BYTE_LIMIT = 1024;
function encodeFeatures(features) {
  let buffer = "";
  for (const key in features) {
    const val = features[key];
    if (buffer.length + val.length + 1 <= BYTE_LIMIT) {
      if (buffer.length) {
        buffer += "," + val;
      } else {
        buffer += val;
      }
      continue;
    }
    break;
  }
  return buffer;
}
__name(encodeFeatures, "encodeFeatures");

// node_modules/@aws-sdk/middleware-user-agent/dist-es/user-agent-middleware.js
var userAgentMiddleware = /* @__PURE__ */ __name((options) => (next, context) => async (args) => {
  const { request } = args;
  if (!HttpRequest.isInstance(request)) {
    return next(args);
  }
  const { headers } = request;
  const userAgent = context?.userAgent?.map(escapeUserAgent) || [];
  const defaultUserAgent = (await options.defaultUserAgentProvider()).map(escapeUserAgent);
  await checkFeatures(context, options, args);
  const awsContext = context;
  defaultUserAgent.push(`m/${encodeFeatures(Object.assign({}, context.__smithy_context?.features, awsContext.__aws_sdk_context?.features))}`);
  const customUserAgent = options?.customUserAgent?.map(escapeUserAgent) || [];
  const appId = await options.userAgentAppId();
  if (appId) {
    defaultUserAgent.push(escapeUserAgent([`app`, `${appId}`]));
  }
  const prefix = getUserAgentPrefix();
  const sdkUserAgentValue = (prefix ? [prefix] : []).concat([...defaultUserAgent, ...userAgent, ...customUserAgent]).join(SPACE);
  const normalUAValue = [
    ...defaultUserAgent.filter((section) => section.startsWith("aws-sdk-")),
    ...customUserAgent
  ].join(SPACE);
  if (options.runtime !== "browser") {
    if (normalUAValue) {
      headers[X_AMZ_USER_AGENT] = headers[X_AMZ_USER_AGENT] ? `${headers[USER_AGENT]} ${normalUAValue}` : normalUAValue;
    }
    headers[USER_AGENT] = sdkUserAgentValue;
  } else {
    headers[X_AMZ_USER_AGENT] = sdkUserAgentValue;
  }
  return next({
    ...args,
    request
  });
}, "userAgentMiddleware");
var escapeUserAgent = /* @__PURE__ */ __name((userAgentPair) => {
  const name = userAgentPair[0].split(UA_NAME_SEPARATOR).map((part) => part.replace(UA_NAME_ESCAPE_REGEX, UA_ESCAPE_CHAR)).join(UA_NAME_SEPARATOR);
  const version = userAgentPair[1]?.replace(UA_VALUE_ESCAPE_REGEX, UA_ESCAPE_CHAR);
  const prefixSeparatorIndex = name.indexOf(UA_NAME_SEPARATOR);
  const prefix = name.substring(0, prefixSeparatorIndex);
  let uaName = name.substring(prefixSeparatorIndex + 1);
  if (prefix === "api") {
    uaName = uaName.toLowerCase();
  }
  return [prefix, uaName, version].filter((item) => item && item.length > 0).reduce((acc, item, index) => {
    switch (index) {
      case 0:
        return item;
      case 1:
        return `${acc}/${item}`;
      default:
        return `${acc}#${item}`;
    }
  }, "");
}, "escapeUserAgent");
var getUserAgentMiddlewareOptions = {
  name: "getUserAgentMiddleware",
  step: "build",
  priority: "low",
  tags: ["SET_USER_AGENT", "USER_AGENT"],
  override: true
};
var getUserAgentPlugin = /* @__PURE__ */ __name((config) => ({
  applyToStack: (clientStack) => {
    clientStack.add(userAgentMiddleware(config), getUserAgentMiddlewareOptions);
  }
}), "getUserAgentPlugin");

// node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseDualstackEndpointConfigOptions.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var DEFAULT_USE_DUALSTACK_ENDPOINT = false;

// node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseFipsEndpointConfigOptions.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var DEFAULT_USE_FIPS_ENDPOINT = false;

// node_modules/@smithy/config-resolver/dist-es/regionConfig/resolveRegionConfig.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/config-resolver/dist-es/regionConfig/checkRegion.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var validRegions = /* @__PURE__ */ new Set();
var checkRegion = /* @__PURE__ */ __name((region, check = isValidHostLabel) => {
  if (!validRegions.has(region) && !check(region)) {
    if (region === "*") {
      console.warn(`@smithy/config-resolver WARN - Please use the caller region instead of "*". See "sigv4a" in https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/CLIENTS.md.`);
    } else {
      throw new Error(`Region not accepted: region="${region}" is not a valid hostname component.`);
    }
  } else {
    validRegions.add(region);
  }
}, "checkRegion");

// node_modules/@smithy/config-resolver/dist-es/regionConfig/getRealRegion.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var isFipsRegion = /* @__PURE__ */ __name((region) => typeof region === "string" && (region.startsWith("fips-") || region.endsWith("-fips")), "isFipsRegion");

// node_modules/@smithy/config-resolver/dist-es/regionConfig/getRealRegion.js
var getRealRegion = /* @__PURE__ */ __name((region) => isFipsRegion(region) ? ["fips-aws-global", "aws-fips"].includes(region) ? "us-east-1" : region.replace(/fips-(dkr-|prod-)?|-fips/, "") : region, "getRealRegion");

// node_modules/@smithy/config-resolver/dist-es/regionConfig/resolveRegionConfig.js
var resolveRegionConfig = /* @__PURE__ */ __name((input) => {
  const { region, useFipsEndpoint } = input;
  if (!region) {
    throw new Error("Region is missing");
  }
  return Object.assign(input, {
    region: async () => {
      const providedRegion = typeof region === "function" ? await region() : region;
      const realRegion = getRealRegion(providedRegion);
      checkRegion(realRegion);
      return realRegion;
    },
    useFipsEndpoint: async () => {
      const providedRegion = typeof region === "string" ? region : await region();
      if (isFipsRegion(providedRegion)) {
        return true;
      }
      return typeof useFipsEndpoint !== "function" ? Promise.resolve(!!useFipsEndpoint) : useFipsEndpoint();
    }
  });
}, "resolveRegionConfig");

// node_modules/@smithy/eventstream-serde-config-resolver/dist-es/EventStreamSerdeConfig.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var resolveEventStreamSerdeConfig = /* @__PURE__ */ __name((input) => Object.assign(input, {
  eventStreamMarshaller: input.eventStreamSerdeProvider(input)
}), "resolveEventStreamSerdeConfig");

// node_modules/@smithy/middleware-content-length/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var CONTENT_LENGTH_HEADER2 = "content-length";
function contentLengthMiddleware(bodyLengthChecker) {
  return (next) => async (args) => {
    const request = args.request;
    if (HttpRequest.isInstance(request)) {
      const { body, headers } = request;
      if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf(CONTENT_LENGTH_HEADER2) === -1) {
        try {
          const length = bodyLengthChecker(body);
          request.headers = {
            ...request.headers,
            [CONTENT_LENGTH_HEADER2]: String(length)
          };
        } catch (error) {
        }
      }
    }
    return next({
      ...args,
      request
    });
  };
}
__name(contentLengthMiddleware, "contentLengthMiddleware");
var contentLengthMiddlewareOptions = {
  step: "build",
  tags: ["SET_CONTENT_LENGTH", "CONTENT_LENGTH"],
  name: "contentLengthMiddleware",
  override: true
};
var getContentLengthPlugin = /* @__PURE__ */ __name((options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(contentLengthMiddleware(options.bodyLengthChecker), contentLengthMiddlewareOptions);
  }
}), "getContentLengthPlugin");

// node_modules/@smithy/middleware-endpoint/dist-es/adaptors/getEndpointFromInstructions.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/middleware-endpoint/dist-es/service-customizations/s3.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var resolveParamsForS3 = /* @__PURE__ */ __name(async (endpointParams) => {
  const bucket = endpointParams?.Bucket || "";
  if (typeof endpointParams.Bucket === "string") {
    endpointParams.Bucket = bucket.replace(/#/g, encodeURIComponent("#")).replace(/\?/g, encodeURIComponent("?"));
  }
  if (isArnBucketName(bucket)) {
    if (endpointParams.ForcePathStyle === true) {
      throw new Error("Path-style addressing cannot be used with ARN buckets");
    }
  } else if (!isDnsCompatibleBucketName(bucket) || bucket.indexOf(".") !== -1 && !String(endpointParams.Endpoint).startsWith("http:") || bucket.toLowerCase() !== bucket || bucket.length < 3) {
    endpointParams.ForcePathStyle = true;
  }
  if (endpointParams.DisableMultiRegionAccessPoints) {
    endpointParams.disableMultiRegionAccessPoints = true;
    endpointParams.DisableMRAP = true;
  }
  return endpointParams;
}, "resolveParamsForS3");
var DOMAIN_PATTERN = /^[a-z0-9][a-z0-9\.\-]{1,61}[a-z0-9]$/;
var IP_ADDRESS_PATTERN = /(\d+\.){3}\d+/;
var DOTS_PATTERN = /\.\./;
var isDnsCompatibleBucketName = /* @__PURE__ */ __name((bucketName) => DOMAIN_PATTERN.test(bucketName) && !IP_ADDRESS_PATTERN.test(bucketName) && !DOTS_PATTERN.test(bucketName), "isDnsCompatibleBucketName");
var isArnBucketName = /* @__PURE__ */ __name((bucketName) => {
  const [arn, partition2, service, , , bucket] = bucketName.split(":");
  const isArn = arn === "arn" && bucketName.split(":").length >= 6;
  const isValidArn = Boolean(isArn && partition2 && service && bucket);
  if (isArn && !isValidArn) {
    throw new Error(`Invalid ARN: ${bucketName} was an invalid ARN.`);
  }
  return isValidArn;
}, "isArnBucketName");

// node_modules/@smithy/middleware-endpoint/dist-es/adaptors/createConfigValueProvider.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var createConfigValueProvider = /* @__PURE__ */ __name((configKey, canonicalEndpointParamKey, config) => {
  const configProvider = /* @__PURE__ */ __name(async () => {
    const configValue = config[configKey] ?? config[canonicalEndpointParamKey];
    if (typeof configValue === "function") {
      return configValue();
    }
    return configValue;
  }, "configProvider");
  if (configKey === "credentialScope" || canonicalEndpointParamKey === "CredentialScope") {
    return async () => {
      const credentials = typeof config.credentials === "function" ? await config.credentials() : config.credentials;
      const configValue = credentials?.credentialScope ?? credentials?.CredentialScope;
      return configValue;
    };
  }
  if (configKey === "accountId" || canonicalEndpointParamKey === "AccountId") {
    return async () => {
      const credentials = typeof config.credentials === "function" ? await config.credentials() : config.credentials;
      const configValue = credentials?.accountId ?? credentials?.AccountId;
      return configValue;
    };
  }
  if (configKey === "endpoint" || canonicalEndpointParamKey === "endpoint") {
    return async () => {
      if (config.isCustomEndpoint === false) {
        return void 0;
      }
      const endpoint = await configProvider();
      if (endpoint && typeof endpoint === "object") {
        if ("url" in endpoint) {
          return endpoint.url.href;
        }
        if ("hostname" in endpoint) {
          const { protocol, hostname, port, path } = endpoint;
          return `${protocol}//${hostname}${port ? ":" + port : ""}${path}`;
        }
      }
      return endpoint;
    };
  }
  return configProvider;
}, "createConfigValueProvider");

// node_modules/@smithy/middleware-endpoint/dist-es/adaptors/getEndpointFromConfig.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getEndpointFromConfig = /* @__PURE__ */ __name(async (serviceId) => void 0, "getEndpointFromConfig");

// node_modules/@smithy/middleware-endpoint/dist-es/adaptors/toEndpointV1.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var toEndpointV1 = /* @__PURE__ */ __name((endpoint) => {
  if (typeof endpoint === "object") {
    if ("url" in endpoint) {
      return parseUrl(endpoint.url);
    }
    return endpoint;
  }
  return parseUrl(endpoint);
}, "toEndpointV1");

// node_modules/@smithy/middleware-endpoint/dist-es/adaptors/getEndpointFromInstructions.js
var getEndpointFromInstructions = /* @__PURE__ */ __name(async (commandInput, instructionsSupplier, clientConfig, context) => {
  if (!clientConfig.isCustomEndpoint) {
    let endpointFromConfig;
    if (clientConfig.serviceConfiguredEndpoint) {
      endpointFromConfig = await clientConfig.serviceConfiguredEndpoint();
    } else {
      endpointFromConfig = await getEndpointFromConfig(clientConfig.serviceId);
    }
    if (endpointFromConfig) {
      clientConfig.endpoint = () => Promise.resolve(toEndpointV1(endpointFromConfig));
      clientConfig.isCustomEndpoint = true;
    }
  }
  const endpointParams = await resolveParams(commandInput, instructionsSupplier, clientConfig);
  if (typeof clientConfig.endpointProvider !== "function") {
    throw new Error("config.endpointProvider is not set.");
  }
  const endpoint = clientConfig.endpointProvider(endpointParams, context);
  return endpoint;
}, "getEndpointFromInstructions");
var resolveParams = /* @__PURE__ */ __name(async (commandInput, instructionsSupplier, clientConfig) => {
  const endpointParams = {};
  const instructions = instructionsSupplier?.getEndpointParameterInstructions?.() || {};
  for (const [name, instruction] of Object.entries(instructions)) {
    switch (instruction.type) {
      case "staticContextParams":
        endpointParams[name] = instruction.value;
        break;
      case "contextParams":
        endpointParams[name] = commandInput[instruction.name];
        break;
      case "clientContextParams":
      case "builtInParams":
        endpointParams[name] = await createConfigValueProvider(instruction.name, name, clientConfig)();
        break;
      case "operationContextParams":
        endpointParams[name] = instruction.get(commandInput);
        break;
      default:
        throw new Error("Unrecognized endpoint parameter instruction: " + JSON.stringify(instruction));
    }
  }
  if (Object.keys(instructions).length === 0) {
    Object.assign(endpointParams, clientConfig);
  }
  if (String(clientConfig.serviceId).toLowerCase() === "s3") {
    await resolveParamsForS3(endpointParams);
  }
  return endpointParams;
}, "resolveParams");

// node_modules/@smithy/middleware-endpoint/dist-es/endpointMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var endpointMiddleware = /* @__PURE__ */ __name(({ config, instructions }) => {
  return (next, context) => async (args) => {
    if (config.isCustomEndpoint) {
      setFeature2(context, "ENDPOINT_OVERRIDE", "N");
    }
    const endpoint = await getEndpointFromInstructions(args.input, {
      getEndpointParameterInstructions() {
        return instructions;
      }
    }, { ...config }, context);
    context.endpointV2 = endpoint;
    context.authSchemes = endpoint.properties?.authSchemes;
    const authScheme = context.authSchemes?.[0];
    if (authScheme) {
      context["signing_region"] = authScheme.signingRegion;
      context["signing_service"] = authScheme.signingName;
      const smithyContext = getSmithyContext(context);
      const httpAuthOption = smithyContext?.selectedHttpAuthScheme?.httpAuthOption;
      if (httpAuthOption) {
        httpAuthOption.signingProperties = Object.assign(httpAuthOption.signingProperties || {}, {
          signing_region: authScheme.signingRegion,
          signingRegion: authScheme.signingRegion,
          signing_service: authScheme.signingName,
          signingName: authScheme.signingName,
          signingRegionSet: authScheme.signingRegionSet
        }, authScheme.properties);
      }
    }
    return next({
      ...args
    });
  };
}, "endpointMiddleware");

// node_modules/@smithy/middleware-endpoint/dist-es/getEndpointPlugin.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var endpointMiddlewareOptions = {
  step: "serialize",
  tags: ["ENDPOINT_PARAMETERS", "ENDPOINT_V2", "ENDPOINT"],
  name: "endpointV2Middleware",
  override: true,
  relation: "before",
  toMiddleware: serializerMiddlewareOption.name
};
var getEndpointPlugin = /* @__PURE__ */ __name((config, instructions) => ({
  applyToStack: (clientStack) => {
    clientStack.addRelativeTo(endpointMiddleware({
      config,
      instructions
    }), endpointMiddlewareOptions);
  }
}), "getEndpointPlugin");

// node_modules/@smithy/middleware-endpoint/dist-es/resolveEndpointConfig.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var resolveEndpointConfig = /* @__PURE__ */ __name((input) => {
  const tls = input.tls ?? true;
  const { endpoint, useDualstackEndpoint, useFipsEndpoint } = input;
  const customEndpointProvider = endpoint != null ? async () => toEndpointV1(await normalizeProvider(endpoint)()) : void 0;
  const isCustomEndpoint = !!endpoint;
  const resolvedConfig = Object.assign(input, {
    endpoint: customEndpointProvider,
    tls,
    isCustomEndpoint,
    useDualstackEndpoint: normalizeProvider(useDualstackEndpoint ?? false),
    useFipsEndpoint: normalizeProvider(useFipsEndpoint ?? false)
  });
  let configuredEndpointPromise = void 0;
  resolvedConfig.serviceConfiguredEndpoint = async () => {
    if (input.serviceId && !configuredEndpointPromise) {
      configuredEndpointPromise = getEndpointFromConfig(input.serviceId);
    }
    return configuredEndpointPromise;
  };
  return resolvedConfig;
}, "resolveEndpointConfig");

// node_modules/@smithy/util-retry/dist-es/AdaptiveRetryStrategy.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-retry/dist-es/config.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var RETRY_MODES;
(function(RETRY_MODES2) {
  RETRY_MODES2["STANDARD"] = "standard";
  RETRY_MODES2["ADAPTIVE"] = "adaptive";
})(RETRY_MODES || (RETRY_MODES = {}));
var DEFAULT_MAX_ATTEMPTS = 3;
var DEFAULT_RETRY_MODE = RETRY_MODES.STANDARD;

// node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/service-error-classification/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/service-error-classification/dist-es/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var THROTTLING_ERROR_CODES = [
  "BandwidthLimitExceeded",
  "EC2ThrottledException",
  "LimitExceededException",
  "PriorRequestNotComplete",
  "ProvisionedThroughputExceededException",
  "RequestLimitExceeded",
  "RequestThrottled",
  "RequestThrottledException",
  "SlowDown",
  "ThrottledException",
  "Throttling",
  "ThrottlingException",
  "TooManyRequestsException",
  "TransactionInProgressException"
];
var TRANSIENT_ERROR_CODES = ["TimeoutError", "RequestTimeout", "RequestTimeoutException"];
var TRANSIENT_ERROR_STATUS_CODES = [500, 502, 503, 504];
var NODEJS_TIMEOUT_ERROR_CODES = ["ECONNRESET", "ECONNREFUSED", "EPIPE", "ETIMEDOUT"];
var NODEJS_NETWORK_ERROR_CODES = ["EHOSTUNREACH", "ENETUNREACH", "ENOTFOUND"];

// node_modules/@smithy/service-error-classification/dist-es/index.js
var isRetryableByTrait = /* @__PURE__ */ __name((error) => error?.$retryable !== void 0, "isRetryableByTrait");
var isClockSkewCorrectedError = /* @__PURE__ */ __name((error) => error.$metadata?.clockSkewCorrected, "isClockSkewCorrectedError");
var isBrowserNetworkError = /* @__PURE__ */ __name((error) => {
  const errorMessages = /* @__PURE__ */ new Set([
    "Failed to fetch",
    "NetworkError when attempting to fetch resource",
    "The Internet connection appears to be offline",
    "Load failed",
    "Network request failed"
  ]);
  const isValid = error && error instanceof TypeError;
  if (!isValid) {
    return false;
  }
  return errorMessages.has(error.message);
}, "isBrowserNetworkError");
var isThrottlingError = /* @__PURE__ */ __name((error) => error.$metadata?.httpStatusCode === 429 || THROTTLING_ERROR_CODES.includes(error.name) || error.$retryable?.throttling == true, "isThrottlingError");
var isTransientError = /* @__PURE__ */ __name((error, depth = 0) => isRetryableByTrait(error) || isClockSkewCorrectedError(error) || TRANSIENT_ERROR_CODES.includes(error.name) || NODEJS_TIMEOUT_ERROR_CODES.includes(error?.code || "") || NODEJS_NETWORK_ERROR_CODES.includes(error?.code || "") || TRANSIENT_ERROR_STATUS_CODES.includes(error.$metadata?.httpStatusCode || 0) || isBrowserNetworkError(error) || error.cause !== void 0 && depth <= 10 && isTransientError(error.cause, depth + 1), "isTransientError");
var isServerError = /* @__PURE__ */ __name((error) => {
  if (error.$metadata?.httpStatusCode !== void 0) {
    const statusCode = error.$metadata.httpStatusCode;
    if (500 <= statusCode && statusCode <= 599 && !isTransientError(error)) {
      return true;
    }
    return false;
  }
  return false;
}, "isServerError");

// node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js
var _DefaultRateLimiter = class {
  beta;
  minCapacity;
  minFillRate;
  scaleConstant;
  smooth;
  currentCapacity = 0;
  enabled = false;
  lastMaxRate = 0;
  measuredTxRate = 0;
  requestCount = 0;
  fillRate;
  lastThrottleTime;
  lastTimestamp = 0;
  lastTxRateBucket;
  maxCapacity;
  timeWindow = 0;
  constructor(options) {
    this.beta = options?.beta ?? 0.7;
    this.minCapacity = options?.minCapacity ?? 1;
    this.minFillRate = options?.minFillRate ?? 0.5;
    this.scaleConstant = options?.scaleConstant ?? 0.4;
    this.smooth = options?.smooth ?? 0.8;
    const currentTimeInSeconds = this.getCurrentTimeInSeconds();
    this.lastThrottleTime = currentTimeInSeconds;
    this.lastTxRateBucket = Math.floor(this.getCurrentTimeInSeconds());
    this.fillRate = this.minFillRate;
    this.maxCapacity = this.minCapacity;
  }
  getCurrentTimeInSeconds() {
    return Date.now() / 1e3;
  }
  async getSendToken() {
    return this.acquireTokenBucket(1);
  }
  async acquireTokenBucket(amount) {
    if (!this.enabled) {
      return;
    }
    this.refillTokenBucket();
    if (amount > this.currentCapacity) {
      const delay = (amount - this.currentCapacity) / this.fillRate * 1e3;
      await new Promise((resolve) => _DefaultRateLimiter.setTimeoutFn(resolve, delay));
    }
    this.currentCapacity = this.currentCapacity - amount;
  }
  refillTokenBucket() {
    const timestamp = this.getCurrentTimeInSeconds();
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      return;
    }
    const fillAmount = (timestamp - this.lastTimestamp) * this.fillRate;
    this.currentCapacity = Math.min(this.maxCapacity, this.currentCapacity + fillAmount);
    this.lastTimestamp = timestamp;
  }
  updateClientSendingRate(response) {
    let calculatedRate;
    this.updateMeasuredRate();
    if (isThrottlingError(response)) {
      const rateToUse = !this.enabled ? this.measuredTxRate : Math.min(this.measuredTxRate, this.fillRate);
      this.lastMaxRate = rateToUse;
      this.calculateTimeWindow();
      this.lastThrottleTime = this.getCurrentTimeInSeconds();
      calculatedRate = this.cubicThrottle(rateToUse);
      this.enableTokenBucket();
    } else {
      this.calculateTimeWindow();
      calculatedRate = this.cubicSuccess(this.getCurrentTimeInSeconds());
    }
    const newRate = Math.min(calculatedRate, 2 * this.measuredTxRate);
    this.updateTokenBucketRate(newRate);
  }
  calculateTimeWindow() {
    this.timeWindow = this.getPrecise(Math.pow(this.lastMaxRate * (1 - this.beta) / this.scaleConstant, 1 / 3));
  }
  cubicThrottle(rateToUse) {
    return this.getPrecise(rateToUse * this.beta);
  }
  cubicSuccess(timestamp) {
    return this.getPrecise(this.scaleConstant * Math.pow(timestamp - this.lastThrottleTime - this.timeWindow, 3) + this.lastMaxRate);
  }
  enableTokenBucket() {
    this.enabled = true;
  }
  updateTokenBucketRate(newRate) {
    this.refillTokenBucket();
    this.fillRate = Math.max(newRate, this.minFillRate);
    this.maxCapacity = Math.max(newRate, this.minCapacity);
    this.currentCapacity = Math.min(this.currentCapacity, this.maxCapacity);
  }
  updateMeasuredRate() {
    const t2 = this.getCurrentTimeInSeconds();
    const timeBucket = Math.floor(t2 * 2) / 2;
    this.requestCount++;
    if (timeBucket > this.lastTxRateBucket) {
      const currentRate = this.requestCount / (timeBucket - this.lastTxRateBucket);
      this.measuredTxRate = this.getPrecise(currentRate * this.smooth + this.measuredTxRate * (1 - this.smooth));
      this.requestCount = 0;
      this.lastTxRateBucket = timeBucket;
    }
  }
  getPrecise(num) {
    return parseFloat(num.toFixed(8));
  }
};
var DefaultRateLimiter = _DefaultRateLimiter;
__name(DefaultRateLimiter, "DefaultRateLimiter");
__publicField(DefaultRateLimiter, "setTimeoutFn", setTimeout);

// node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-retry/dist-es/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var DEFAULT_RETRY_DELAY_BASE = 100;
var MAXIMUM_RETRY_DELAY = 20 * 1e3;
var THROTTLING_RETRY_DELAY_BASE = 500;
var INITIAL_RETRY_TOKENS = 500;
var RETRY_COST = 5;
var TIMEOUT_RETRY_COST = 10;
var NO_RETRY_INCREMENT = 1;
var INVOCATION_ID_HEADER = "amz-sdk-invocation-id";
var REQUEST_HEADER = "amz-sdk-request";

// node_modules/@smithy/util-retry/dist-es/defaultRetryBackoffStrategy.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getDefaultRetryBackoffStrategy = /* @__PURE__ */ __name(() => {
  let delayBase = DEFAULT_RETRY_DELAY_BASE;
  const computeNextBackoffDelay = /* @__PURE__ */ __name((attempts) => {
    return Math.floor(Math.min(MAXIMUM_RETRY_DELAY, Math.random() * 2 ** attempts * delayBase));
  }, "computeNextBackoffDelay");
  const setDelayBase = /* @__PURE__ */ __name((delay) => {
    delayBase = delay;
  }, "setDelayBase");
  return {
    computeNextBackoffDelay,
    setDelayBase
  };
}, "getDefaultRetryBackoffStrategy");

// node_modules/@smithy/util-retry/dist-es/defaultRetryToken.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var createDefaultRetryToken = /* @__PURE__ */ __name(({ retryDelay, retryCount, retryCost }) => {
  const getRetryCount = /* @__PURE__ */ __name(() => retryCount, "getRetryCount");
  const getRetryDelay = /* @__PURE__ */ __name(() => Math.min(MAXIMUM_RETRY_DELAY, retryDelay), "getRetryDelay");
  const getRetryCost = /* @__PURE__ */ __name(() => retryCost, "getRetryCost");
  return {
    getRetryCount,
    getRetryDelay,
    getRetryCost
  };
}, "createDefaultRetryToken");

// node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js
var StandardRetryStrategy = class {
  maxAttempts;
  mode = RETRY_MODES.STANDARD;
  capacity = INITIAL_RETRY_TOKENS;
  retryBackoffStrategy = getDefaultRetryBackoffStrategy();
  maxAttemptsProvider;
  constructor(maxAttempts) {
    this.maxAttempts = maxAttempts;
    this.maxAttemptsProvider = typeof maxAttempts === "function" ? maxAttempts : async () => maxAttempts;
  }
  async acquireInitialRetryToken(retryTokenScope) {
    return createDefaultRetryToken({
      retryDelay: DEFAULT_RETRY_DELAY_BASE,
      retryCount: 0
    });
  }
  async refreshRetryTokenForRetry(token, errorInfo) {
    const maxAttempts = await this.getMaxAttempts();
    if (this.shouldRetry(token, errorInfo, maxAttempts)) {
      const errorType = errorInfo.errorType;
      this.retryBackoffStrategy.setDelayBase(errorType === "THROTTLING" ? THROTTLING_RETRY_DELAY_BASE : DEFAULT_RETRY_DELAY_BASE);
      const delayFromErrorType = this.retryBackoffStrategy.computeNextBackoffDelay(token.getRetryCount());
      const retryDelay = errorInfo.retryAfterHint ? Math.max(errorInfo.retryAfterHint.getTime() - Date.now() || 0, delayFromErrorType) : delayFromErrorType;
      const capacityCost = this.getCapacityCost(errorType);
      this.capacity -= capacityCost;
      return createDefaultRetryToken({
        retryDelay,
        retryCount: token.getRetryCount() + 1,
        retryCost: capacityCost
      });
    }
    throw new Error("No retry token available");
  }
  recordSuccess(token) {
    this.capacity = Math.max(INITIAL_RETRY_TOKENS, this.capacity + (token.getRetryCost() ?? NO_RETRY_INCREMENT));
  }
  getCapacity() {
    return this.capacity;
  }
  async getMaxAttempts() {
    try {
      return await this.maxAttemptsProvider();
    } catch (error) {
      console.warn(`Max attempts provider could not resolve. Using default of ${DEFAULT_MAX_ATTEMPTS}`);
      return DEFAULT_MAX_ATTEMPTS;
    }
  }
  shouldRetry(tokenToRenew, errorInfo, maxAttempts) {
    const attempts = tokenToRenew.getRetryCount() + 1;
    return attempts < maxAttempts && this.capacity >= this.getCapacityCost(errorInfo.errorType) && this.isRetryableError(errorInfo.errorType);
  }
  getCapacityCost(errorType) {
    return errorType === "TRANSIENT" ? TIMEOUT_RETRY_COST : RETRY_COST;
  }
  isRetryableError(errorType) {
    return errorType === "THROTTLING" || errorType === "TRANSIENT";
  }
};
__name(StandardRetryStrategy, "StandardRetryStrategy");

// node_modules/@smithy/util-retry/dist-es/AdaptiveRetryStrategy.js
var AdaptiveRetryStrategy = class {
  maxAttemptsProvider;
  rateLimiter;
  standardRetryStrategy;
  mode = RETRY_MODES.ADAPTIVE;
  constructor(maxAttemptsProvider, options) {
    this.maxAttemptsProvider = maxAttemptsProvider;
    const { rateLimiter } = options ?? {};
    this.rateLimiter = rateLimiter ?? new DefaultRateLimiter();
    this.standardRetryStrategy = new StandardRetryStrategy(maxAttemptsProvider);
  }
  async acquireInitialRetryToken(retryTokenScope) {
    await this.rateLimiter.getSendToken();
    return this.standardRetryStrategy.acquireInitialRetryToken(retryTokenScope);
  }
  async refreshRetryTokenForRetry(tokenToRenew, errorInfo) {
    this.rateLimiter.updateClientSendingRate(errorInfo);
    return this.standardRetryStrategy.refreshRetryTokenForRetry(tokenToRenew, errorInfo);
  }
  recordSuccess(token) {
    this.rateLimiter.updateClientSendingRate({});
    this.standardRetryStrategy.recordSuccess(token);
  }
};
__name(AdaptiveRetryStrategy, "AdaptiveRetryStrategy");

// node_modules/@smithy/middleware-retry/dist-es/util.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var asSdkError = /* @__PURE__ */ __name((error) => {
  if (error instanceof Error)
    return error;
  if (error instanceof Object)
    return Object.assign(new Error(), error);
  if (typeof error === "string")
    return new Error(error);
  return new Error(`AWS SDK error wrapper for ${error}`);
}, "asSdkError");

// node_modules/@smithy/middleware-retry/dist-es/configurations.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var resolveRetryConfig = /* @__PURE__ */ __name((input) => {
  const { retryStrategy, retryMode: _retryMode, maxAttempts: _maxAttempts } = input;
  const maxAttempts = normalizeProvider(_maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  return Object.assign(input, {
    maxAttempts,
    retryStrategy: async () => {
      if (retryStrategy) {
        return retryStrategy;
      }
      const retryMode = await normalizeProvider(_retryMode)();
      if (retryMode === RETRY_MODES.ADAPTIVE) {
        return new AdaptiveRetryStrategy(maxAttempts);
      }
      return new StandardRetryStrategy(maxAttempts);
    }
  });
}, "resolveRetryConfig");

// node_modules/@smithy/middleware-retry/dist-es/retryMiddleware.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/middleware-retry/dist-es/isStreamingPayload/isStreamingPayload.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var isStreamingPayload = /* @__PURE__ */ __name((request) => request?.body instanceof ReadableStream, "isStreamingPayload");

// node_modules/@smithy/middleware-retry/dist-es/retryMiddleware.js
var retryMiddleware = /* @__PURE__ */ __name((options) => (next, context) => async (args) => {
  let retryStrategy = await options.retryStrategy();
  const maxAttempts = await options.maxAttempts();
  if (isRetryStrategyV2(retryStrategy)) {
    retryStrategy = retryStrategy;
    let retryToken = await retryStrategy.acquireInitialRetryToken(context["partition_id"]);
    let lastError = new Error();
    let attempts = 0;
    let totalRetryDelay = 0;
    const { request } = args;
    const isRequest = HttpRequest.isInstance(request);
    if (isRequest) {
      request.headers[INVOCATION_ID_HEADER] = v4();
    }
    while (true) {
      try {
        if (isRequest) {
          request.headers[REQUEST_HEADER] = `attempt=${attempts + 1}; max=${maxAttempts}`;
        }
        const { response, output } = await next(args);
        retryStrategy.recordSuccess(retryToken);
        output.$metadata.attempts = attempts + 1;
        output.$metadata.totalRetryDelay = totalRetryDelay;
        return { response, output };
      } catch (e2) {
        const retryErrorInfo = getRetryErrorInfo(e2);
        lastError = asSdkError(e2);
        if (isRequest && isStreamingPayload(request)) {
          (context.logger instanceof NoOpLogger ? console : context.logger)?.warn("An error was encountered in a non-retryable streaming request.");
          throw lastError;
        }
        try {
          retryToken = await retryStrategy.refreshRetryTokenForRetry(retryToken, retryErrorInfo);
        } catch (refreshError) {
          if (!lastError.$metadata) {
            lastError.$metadata = {};
          }
          lastError.$metadata.attempts = attempts + 1;
          lastError.$metadata.totalRetryDelay = totalRetryDelay;
          throw lastError;
        }
        attempts = retryToken.getRetryCount();
        const delay = retryToken.getRetryDelay();
        totalRetryDelay += delay;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  } else {
    retryStrategy = retryStrategy;
    if (retryStrategy?.mode)
      context.userAgent = [...context.userAgent || [], ["cfg/retry-mode", retryStrategy.mode]];
    return retryStrategy.retry(next, args);
  }
}, "retryMiddleware");
var isRetryStrategyV2 = /* @__PURE__ */ __name((retryStrategy) => typeof retryStrategy.acquireInitialRetryToken !== "undefined" && typeof retryStrategy.refreshRetryTokenForRetry !== "undefined" && typeof retryStrategy.recordSuccess !== "undefined", "isRetryStrategyV2");
var getRetryErrorInfo = /* @__PURE__ */ __name((error) => {
  const errorInfo = {
    error,
    errorType: getRetryErrorType(error)
  };
  const retryAfterHint = getRetryAfterHint(error.$response);
  if (retryAfterHint) {
    errorInfo.retryAfterHint = retryAfterHint;
  }
  return errorInfo;
}, "getRetryErrorInfo");
var getRetryErrorType = /* @__PURE__ */ __name((error) => {
  if (isThrottlingError(error))
    return "THROTTLING";
  if (isTransientError(error))
    return "TRANSIENT";
  if (isServerError(error))
    return "SERVER_ERROR";
  return "CLIENT_ERROR";
}, "getRetryErrorType");
var retryMiddlewareOptions = {
  name: "retryMiddleware",
  tags: ["RETRY"],
  step: "finalizeRequest",
  priority: "high",
  override: true
};
var getRetryPlugin = /* @__PURE__ */ __name((options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(retryMiddleware(options), retryMiddlewareOptions);
  }
}), "getRetryPlugin");
var getRetryAfterHint = /* @__PURE__ */ __name((response) => {
  if (!HttpResponse.isInstance(response))
    return;
  const retryAfterHeaderName = Object.keys(response.headers).find((key) => key.toLowerCase() === "retry-after");
  if (!retryAfterHeaderName)
    return;
  const retryAfter = response.headers[retryAfterHeaderName];
  const retryAfterSeconds = Number(retryAfter);
  if (!Number.isNaN(retryAfterSeconds))
    return new Date(retryAfterSeconds * 1e3);
  const retryAfterDate = new Date(retryAfter);
  return retryAfterDate;
}, "getRetryAfterHint");

// node_modules/@aws-sdk/client-s3/dist-es/auth/httpAuthSchemeProvider.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/signature-v4-multi-region/dist-es/SignatureV4MultiRegion.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/signature-v4-multi-region/dist-es/signature-v4-crt-container.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var signatureV4CrtContainer = {
  CrtSignerV4: null
};

// node_modules/@aws-sdk/signature-v4-multi-region/dist-es/SignatureV4MultiRegion.js
var SignatureV4MultiRegion = class {
  sigv4aSigner;
  sigv4Signer;
  signerOptions;
  static sigv4aDependency() {
    if (typeof signatureV4CrtContainer.CrtSignerV4 === "function") {
      return "crt";
    } else if (typeof signatureV4aContainer.SignatureV4a === "function") {
      return "js";
    }
    return "none";
  }
  constructor(options) {
    this.sigv4Signer = new SignatureV4S3Express(options);
    this.signerOptions = options;
  }
  async sign(requestToSign, options = {}) {
    if (options.signingRegion === "*") {
      return this.getSigv4aSigner().sign(requestToSign, options);
    }
    return this.sigv4Signer.sign(requestToSign, options);
  }
  async signWithCredentials(requestToSign, credentials, options = {}) {
    if (options.signingRegion === "*") {
      const signer = this.getSigv4aSigner();
      const CrtSignerV4 = signatureV4CrtContainer.CrtSignerV4;
      if (CrtSignerV4 && signer instanceof CrtSignerV4) {
        return signer.signWithCredentials(requestToSign, credentials, options);
      } else {
        throw new Error(`signWithCredentials with signingRegion '*' is only supported when using the CRT dependency @aws-sdk/signature-v4-crt. Please check whether you have installed the "@aws-sdk/signature-v4-crt" package explicitly. You must also register the package by calling [require("@aws-sdk/signature-v4-crt");] or an ESM equivalent such as [import "@aws-sdk/signature-v4-crt";]. For more information please go to https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt`);
      }
    }
    return this.sigv4Signer.signWithCredentials(requestToSign, credentials, options);
  }
  async presign(originalRequest, options = {}) {
    if (options.signingRegion === "*") {
      const signer = this.getSigv4aSigner();
      const CrtSignerV4 = signatureV4CrtContainer.CrtSignerV4;
      if (CrtSignerV4 && signer instanceof CrtSignerV4) {
        return signer.presign(originalRequest, options);
      } else {
        throw new Error(`presign with signingRegion '*' is only supported when using the CRT dependency @aws-sdk/signature-v4-crt. Please check whether you have installed the "@aws-sdk/signature-v4-crt" package explicitly. You must also register the package by calling [require("@aws-sdk/signature-v4-crt");] or an ESM equivalent such as [import "@aws-sdk/signature-v4-crt";]. For more information please go to https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt`);
      }
    }
    return this.sigv4Signer.presign(originalRequest, options);
  }
  async presignWithCredentials(originalRequest, credentials, options = {}) {
    if (options.signingRegion === "*") {
      throw new Error("Method presignWithCredentials is not supported for [signingRegion=*].");
    }
    return this.sigv4Signer.presignWithCredentials(originalRequest, credentials, options);
  }
  getSigv4aSigner() {
    if (!this.sigv4aSigner) {
      const CrtSignerV4 = signatureV4CrtContainer.CrtSignerV4;
      const JsSigV4aSigner = signatureV4aContainer.SignatureV4a;
      if (this.signerOptions.runtime === "node") {
        if (!CrtSignerV4 && !JsSigV4aSigner) {
          throw new Error("Neither CRT nor JS SigV4a implementation is available. Please load either @aws-sdk/signature-v4-crt or @aws-sdk/signature-v4a. For more information please go to https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt");
        }
        if (CrtSignerV4 && typeof CrtSignerV4 === "function") {
          this.sigv4aSigner = new CrtSignerV4({
            ...this.signerOptions,
            signingAlgorithm: 1
          });
        } else if (JsSigV4aSigner && typeof JsSigV4aSigner === "function") {
          this.sigv4aSigner = new JsSigV4aSigner({
            ...this.signerOptions
          });
        } else {
          throw new Error("Available SigV4a implementation is not a valid constructor. Please ensure you've properly imported @aws-sdk/signature-v4-crt or @aws-sdk/signature-v4a.For more information please go to https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt");
        }
      } else {
        if (!JsSigV4aSigner || typeof JsSigV4aSigner !== "function") {
          throw new Error("JS SigV4a implementation is not available or not a valid constructor. Please check whether you have installed the @aws-sdk/signature-v4a package explicitly. The CRT implementation is not available for browsers. You must also register the package by calling [require('@aws-sdk/signature-v4a');] or an ESM equivalent such as [import '@aws-sdk/signature-v4a';]. For more information please go to https://github.com/aws/aws-sdk-js-v3#using-javascript-non-crt-implementation-of-sigv4a");
        }
        this.sigv4aSigner = new JsSigV4aSigner({
          ...this.signerOptions
        });
      }
    }
    return this.sigv4aSigner;
  }
};
__name(SignatureV4MultiRegion, "SignatureV4MultiRegion");

// node_modules/@aws-sdk/client-s3/dist-es/endpoint/endpointResolver.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/client-s3/dist-es/endpoint/ruleset.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var cs2 = "required";
var ct = "type";
var cu = "rules";
var cv = "conditions";
var cw = "fn";
var cx = "argv";
var cy = "ref";
var cz = "assign";
var cA = "url";
var cB = "properties";
var cC = "backend";
var cD = "authSchemes";
var cE = "disableDoubleEncoding";
var cF = "signingName";
var cG = "signingRegion";
var cH = "headers";
var cI = "signingRegionSet";
var a2 = 6;
var b = false;
var c = true;
var d = "isSet";
var e = "booleanEquals";
var f = "error";
var g2 = "aws.partition";
var h = "stringEquals";
var i = "getAttr";
var j = "name";
var k = "substring";
var l = "bucketSuffix";
var m2 = "parseURL";
var n = "endpoint";
var o = "tree";
var p2 = "aws.isVirtualHostableS3Bucket";
var q = "{url#scheme}://{Bucket}.{url#authority}{url#path}";
var r = "not";
var s = "accessPointSuffix";
var t = "{url#scheme}://{url#authority}{url#path}";
var u = "hardwareType";
var v2 = "regionPrefix";
var w = "bucketAliasSuffix";
var x2 = "outpostId";
var y2 = "isValidHostLabel";
var z2 = "sigv4a";
var A = "s3-outposts";
var B = "s3";
var C = "{url#scheme}://{url#authority}{url#normalizedPath}{Bucket}";
var D = "https://{Bucket}.s3-accelerate.{partitionResult#dnsSuffix}";
var E2 = "https://{Bucket}.s3.{partitionResult#dnsSuffix}";
var F = "aws.parseArn";
var G = "bucketArn";
var H = "arnType";
var I2 = "";
var J = "s3-object-lambda";
var K = "accesspoint";
var L = "accessPointName";
var M = "{url#scheme}://{accessPointName}-{bucketArn#accountId}.{url#authority}{url#path}";
var N2 = "mrapPartition";
var O2 = "outpostType";
var P = "arnPrefix";
var Q = "{url#scheme}://{url#authority}{url#normalizedPath}{uri_encoded_bucket}";
var R = "https://s3.{partitionResult#dnsSuffix}/{uri_encoded_bucket}";
var S2 = "https://s3.{partitionResult#dnsSuffix}";
var T = { [cs2]: false, [ct]: "string" };
var U = { [cs2]: true, "default": false, [ct]: "boolean" };
var V = { [cs2]: false, [ct]: "boolean" };
var W = { [cw]: e, [cx]: [{ [cy]: "Accelerate" }, true] };
var X = { [cw]: e, [cx]: [{ [cy]: "UseFIPS" }, true] };
var Y = { [cw]: e, [cx]: [{ [cy]: "UseDualStack" }, true] };
var Z = { [cw]: d, [cx]: [{ [cy]: "Endpoint" }] };
var aa = { [cw]: g2, [cx]: [{ [cy]: "Region" }], [cz]: "partitionResult" };
var ab = { [cw]: h, [cx]: [{ [cw]: i, [cx]: [{ [cy]: "partitionResult" }, j] }, "aws-cn"] };
var ac = { [cw]: d, [cx]: [{ [cy]: "Bucket" }] };
var ad = { [cy]: "Bucket" };
var ae = { [cv]: [W], [f]: "S3Express does not support S3 Accelerate.", [ct]: f };
var af = { [cv]: [Z, { [cw]: m2, [cx]: [{ [cy]: "Endpoint" }], [cz]: "url" }], [cu]: [{ [cv]: [{ [cw]: d, [cx]: [{ [cy]: "DisableS3ExpressSessionAuth" }] }, { [cw]: e, [cx]: [{ [cy]: "DisableS3ExpressSessionAuth" }, true] }], [cu]: [{ [cv]: [{ [cw]: e, [cx]: [{ [cw]: i, [cx]: [{ [cy]: "url" }, "isIp"] }, true] }], [cu]: [{ [cv]: [{ [cw]: "uriEncode", [cx]: [ad], [cz]: "uri_encoded_bucket" }], [cu]: [{ [n]: { [cA]: "{url#scheme}://{url#authority}/{uri_encoded_bucket}{url#path}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }], [ct]: o }], [ct]: o }, { [cv]: [{ [cw]: p2, [cx]: [ad, false] }], [cu]: [{ [n]: { [cA]: q, [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }], [ct]: o }, { [f]: "S3Express bucket name is not a valid virtual hostable name.", [ct]: f }], [ct]: o }, { [cv]: [{ [cw]: e, [cx]: [{ [cw]: i, [cx]: [{ [cy]: "url" }, "isIp"] }, true] }], [cu]: [{ [cv]: [{ [cw]: "uriEncode", [cx]: [ad], [cz]: "uri_encoded_bucket" }], [cu]: [{ [n]: { [cA]: "{url#scheme}://{url#authority}/{uri_encoded_bucket}{url#path}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }], [ct]: o }], [ct]: o }, { [cv]: [{ [cw]: p2, [cx]: [ad, false] }], [cu]: [{ [n]: { [cA]: q, [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }], [ct]: o }, { [f]: "S3Express bucket name is not a valid virtual hostable name.", [ct]: f }], [ct]: o };
var ag = { [cw]: m2, [cx]: [{ [cy]: "Endpoint" }], [cz]: "url" };
var ah = { [cw]: e, [cx]: [{ [cw]: i, [cx]: [{ [cy]: "url" }, "isIp"] }, true] };
var ai = { [cy]: "url" };
var aj = { [cw]: "uriEncode", [cx]: [ad], [cz]: "uri_encoded_bucket" };
var ak = { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: "s3express", [cG]: "{Region}" }] };
var al = {};
var am = { [cw]: p2, [cx]: [ad, false] };
var an2 = { [f]: "S3Express bucket name is not a valid virtual hostable name.", [ct]: f };
var ao = { [cw]: d, [cx]: [{ [cy]: "UseS3ExpressControlEndpoint" }] };
var ap = { [cw]: e, [cx]: [{ [cy]: "UseS3ExpressControlEndpoint" }, true] };
var aq = { [cw]: r, [cx]: [Z] };
var ar2 = { [cw]: e, [cx]: [{ [cy]: "UseDualStack" }, false] };
var as = { [cw]: e, [cx]: [{ [cy]: "UseFIPS" }, false] };
var at = { [f]: "Unrecognized S3Express bucket name format.", [ct]: f };
var au2 = { [cw]: r, [cx]: [ac] };
var av = { [cy]: u };
var aw = { [cv]: [aq], [f]: "Expected a endpoint to be specified but no endpoint was found", [ct]: f };
var ax = { [cD]: [{ [cE]: true, [j]: z2, [cF]: A, [cI]: ["*"] }, { [cE]: true, [j]: "sigv4", [cF]: A, [cG]: "{Region}" }] };
var ay = { [cw]: e, [cx]: [{ [cy]: "ForcePathStyle" }, false] };
var az = { [cy]: "ForcePathStyle" };
var aA = { [cw]: e, [cx]: [{ [cy]: "Accelerate" }, false] };
var aB = { [cw]: h, [cx]: [{ [cy]: "Region" }, "aws-global"] };
var aC = { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: B, [cG]: "us-east-1" }] };
var aD = { [cw]: r, [cx]: [aB] };
var aE = { [cw]: e, [cx]: [{ [cy]: "UseGlobalEndpoint" }, true] };
var aF = { [cA]: "https://{Bucket}.s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: B, [cG]: "{Region}" }] }, [cH]: {} };
var aG = { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: B, [cG]: "{Region}" }] };
var aH = { [cw]: e, [cx]: [{ [cy]: "UseGlobalEndpoint" }, false] };
var aI = { [cA]: "https://{Bucket}.s3-fips.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} };
var aJ = { [cA]: "https://{Bucket}.s3-accelerate.dualstack.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} };
var aK = { [cA]: "https://{Bucket}.s3.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} };
var aL = { [cw]: e, [cx]: [{ [cw]: i, [cx]: [ai, "isIp"] }, false] };
var aM = { [cA]: C, [cB]: aG, [cH]: {} };
var aN = { [cA]: q, [cB]: aG, [cH]: {} };
var aO = { [n]: aN, [ct]: n };
var aP = { [cA]: D, [cB]: aG, [cH]: {} };
var aQ = { [cA]: "https://{Bucket}.s3.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} };
var aR = { [f]: "Invalid region: region was not a valid DNS name.", [ct]: f };
var aS = { [cy]: G };
var aT = { [cy]: H };
var aU = { [cw]: i, [cx]: [aS, "service"] };
var aV = { [cy]: L };
var aW = { [cv]: [Y], [f]: "S3 Object Lambda does not support Dual-stack", [ct]: f };
var aX = { [cv]: [W], [f]: "S3 Object Lambda does not support S3 Accelerate", [ct]: f };
var aY = { [cv]: [{ [cw]: d, [cx]: [{ [cy]: "DisableAccessPoints" }] }, { [cw]: e, [cx]: [{ [cy]: "DisableAccessPoints" }, true] }], [f]: "Access points are not supported for this operation", [ct]: f };
var aZ = { [cv]: [{ [cw]: d, [cx]: [{ [cy]: "UseArnRegion" }] }, { [cw]: e, [cx]: [{ [cy]: "UseArnRegion" }, false] }, { [cw]: r, [cx]: [{ [cw]: h, [cx]: [{ [cw]: i, [cx]: [aS, "region"] }, "{Region}"] }] }], [f]: "Invalid configuration: region from ARN `{bucketArn#region}` does not match client region `{Region}` and UseArnRegion is `false`", [ct]: f };
var ba = { [cw]: i, [cx]: [{ [cy]: "bucketPartition" }, j] };
var bb = { [cw]: i, [cx]: [aS, "accountId"] };
var bc = { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: J, [cG]: "{bucketArn#region}" }] };
var bd = { [f]: "Invalid ARN: The access point name may only contain a-z, A-Z, 0-9 and `-`. Found: `{accessPointName}`", [ct]: f };
var be = { [f]: "Invalid ARN: The account id may only contain a-z, A-Z, 0-9 and `-`. Found: `{bucketArn#accountId}`", [ct]: f };
var bf = { [f]: "Invalid region in ARN: `{bucketArn#region}` (invalid DNS name)", [ct]: f };
var bg = { [f]: "Client was configured for partition `{partitionResult#name}` but ARN (`{Bucket}`) has `{bucketPartition#name}`", [ct]: f };
var bh = { [f]: "Invalid ARN: The ARN may only contain a single resource component after `accesspoint`.", [ct]: f };
var bi = { [f]: "Invalid ARN: Expected a resource of the format `accesspoint:<accesspoint name>` but no name was provided", [ct]: f };
var bj = { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: B, [cG]: "{bucketArn#region}" }] };
var bk = { [cD]: [{ [cE]: true, [j]: z2, [cF]: A, [cI]: ["*"] }, { [cE]: true, [j]: "sigv4", [cF]: A, [cG]: "{bucketArn#region}" }] };
var bl = { [cw]: F, [cx]: [ad] };
var bm = { [cA]: "https://s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aG, [cH]: {} };
var bn2 = { [cA]: "https://s3-fips.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aG, [cH]: {} };
var bo = { [cA]: "https://s3.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aG, [cH]: {} };
var bp = { [cA]: Q, [cB]: aG, [cH]: {} };
var bq = { [cA]: "https://s3.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aG, [cH]: {} };
var br = { [cy]: "UseObjectLambdaEndpoint" };
var bs2 = { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: J, [cG]: "{Region}" }] };
var bt = { [cA]: "https://s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} };
var bu = { [cA]: "https://s3-fips.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} };
var bv = { [cA]: "https://s3.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} };
var bw = { [cA]: t, [cB]: aG, [cH]: {} };
var bx = { [cA]: "https://s3.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} };
var by = [{ [cy]: "Region" }];
var bz = [{ [cy]: "Endpoint" }];
var bA = [ad];
var bB = [W];
var bC = [Z, ag];
var bD = [{ [cw]: d, [cx]: [{ [cy]: "DisableS3ExpressSessionAuth" }] }, { [cw]: e, [cx]: [{ [cy]: "DisableS3ExpressSessionAuth" }, true] }];
var bE = [aj];
var bF = [am];
var bG = [aa];
var bH = [X, Y];
var bI = [X, ar2];
var bJ = [as, Y];
var bK = [as, ar2];
var bL = [{ [cw]: k, [cx]: [ad, 6, 14, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 14, 16, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bM = [{ [cv]: [X, Y], [n]: { [cA]: "https://{Bucket}.s3express-fips-{s3expressAvailabilityZoneId}.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: {} }, [ct]: n }, { [cv]: bI, [n]: { [cA]: "https://{Bucket}.s3express-fips-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: {} }, [ct]: n }, { [cv]: bJ, [n]: { [cA]: "https://{Bucket}.s3express-{s3expressAvailabilityZoneId}.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: {} }, [ct]: n }, { [cv]: bK, [n]: { [cA]: "https://{Bucket}.s3express-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: {} }, [ct]: n }];
var bN = [{ [cw]: k, [cx]: [ad, 6, 15, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 15, 17, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bO = [{ [cw]: k, [cx]: [ad, 6, 19, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 19, 21, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bP = [{ [cw]: k, [cx]: [ad, 6, 20, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 20, 22, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bQ = [{ [cw]: k, [cx]: [ad, 6, 26, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 26, 28, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bR = [{ [cv]: [X, Y], [n]: { [cA]: "https://{Bucket}.s3express-fips-{s3expressAvailabilityZoneId}.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }, { [cv]: bI, [n]: { [cA]: "https://{Bucket}.s3express-fips-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }, { [cv]: bJ, [n]: { [cA]: "https://{Bucket}.s3express-{s3expressAvailabilityZoneId}.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }, { [cv]: bK, [n]: { [cA]: "https://{Bucket}.s3express-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }];
var bS = [ad, 0, 7, true];
var bT = [{ [cw]: k, [cx]: [ad, 7, 15, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 15, 17, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bU = [{ [cw]: k, [cx]: [ad, 7, 16, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 16, 18, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bV = [{ [cw]: k, [cx]: [ad, 7, 20, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 20, 22, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bW = [{ [cw]: k, [cx]: [ad, 7, 21, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 21, 23, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bX = [{ [cw]: k, [cx]: [ad, 7, 27, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 27, 29, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bY = [ac];
var bZ = [{ [cw]: y2, [cx]: [{ [cy]: x2 }, false] }];
var ca = [{ [cw]: h, [cx]: [{ [cy]: v2 }, "beta"] }];
var cb = ["*"];
var cc = [{ [cw]: y2, [cx]: [{ [cy]: "Region" }, false] }];
var cd = [{ [cw]: h, [cx]: [{ [cy]: "Region" }, "us-east-1"] }];
var ce = [{ [cw]: h, [cx]: [aT, K] }];
var cf = [{ [cw]: i, [cx]: [aS, "resourceId[1]"], [cz]: L }, { [cw]: r, [cx]: [{ [cw]: h, [cx]: [aV, I2] }] }];
var cg = [aS, "resourceId[1]"];
var ch = [Y];
var ci2 = [{ [cw]: r, [cx]: [{ [cw]: h, [cx]: [{ [cw]: i, [cx]: [aS, "region"] }, I2] }] }];
var cj = [{ [cw]: r, [cx]: [{ [cw]: d, [cx]: [{ [cw]: i, [cx]: [aS, "resourceId[2]"] }] }] }];
var ck = [aS, "resourceId[2]"];
var cl = [{ [cw]: g2, [cx]: [{ [cw]: i, [cx]: [aS, "region"] }], [cz]: "bucketPartition" }];
var cm = [{ [cw]: h, [cx]: [ba, { [cw]: i, [cx]: [{ [cy]: "partitionResult" }, j] }] }];
var cn = [{ [cw]: y2, [cx]: [{ [cw]: i, [cx]: [aS, "region"] }, true] }];
var co = [{ [cw]: y2, [cx]: [bb, false] }];
var cp = [{ [cw]: y2, [cx]: [aV, false] }];
var cq = [X];
var cr = [{ [cw]: y2, [cx]: [{ [cy]: "Region" }, true] }];
var _data = { version: "1.0", parameters: { Bucket: T, Region: T, UseFIPS: U, UseDualStack: U, Endpoint: T, ForcePathStyle: U, Accelerate: U, UseGlobalEndpoint: U, UseObjectLambdaEndpoint: V, Key: T, Prefix: T, CopySource: T, DisableAccessPoints: V, DisableMultiRegionAccessPoints: U, UseArnRegion: V, UseS3ExpressControlEndpoint: V, DisableS3ExpressSessionAuth: V }, [cu]: [{ [cv]: [{ [cw]: d, [cx]: by }], [cu]: [{ [cv]: [W, X], error: "Accelerate cannot be used with FIPS", [ct]: f }, { [cv]: [Y, Z], error: "Cannot set dual-stack in combination with a custom endpoint.", [ct]: f }, { [cv]: [Z, X], error: "A custom endpoint cannot be combined with FIPS", [ct]: f }, { [cv]: [Z, W], error: "A custom endpoint cannot be combined with S3 Accelerate", [ct]: f }, { [cv]: [X, aa, ab], error: "Partition does not support FIPS", [ct]: f }, { [cv]: [ac, { [cw]: k, [cx]: [ad, 0, a2, c], [cz]: l }, { [cw]: h, [cx]: [{ [cy]: l }, "--x-s3"] }], [cu]: [ae, af, { [cv]: [ao, ap], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: [aj, aq], [cu]: [{ [cv]: bH, endpoint: { [cA]: "https://s3express-control-fips.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bI, endpoint: { [cA]: "https://s3express-control-fips.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bJ, endpoint: { [cA]: "https://s3express-control.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bK, endpoint: { [cA]: "https://s3express-control.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: ak, [cH]: al }, [ct]: n }], [ct]: o }], [ct]: o }], [ct]: o }, { [cv]: bF, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: bD, [cu]: [{ [cv]: bL, [cu]: bM, [ct]: o }, { [cv]: bN, [cu]: bM, [ct]: o }, { [cv]: bO, [cu]: bM, [ct]: o }, { [cv]: bP, [cu]: bM, [ct]: o }, { [cv]: bQ, [cu]: bM, [ct]: o }, at], [ct]: o }, { [cv]: bL, [cu]: bR, [ct]: o }, { [cv]: bN, [cu]: bR, [ct]: o }, { [cv]: bO, [cu]: bR, [ct]: o }, { [cv]: bP, [cu]: bR, [ct]: o }, { [cv]: bQ, [cu]: bR, [ct]: o }, at], [ct]: o }], [ct]: o }, an2], [ct]: o }, { [cv]: [ac, { [cw]: k, [cx]: bS, [cz]: s }, { [cw]: h, [cx]: [{ [cy]: s }, "--xa-s3"] }], [cu]: [ae, af, { [cv]: bF, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: bD, [cu]: [{ [cv]: bT, [cu]: bM, [ct]: o }, { [cv]: bU, [cu]: bM, [ct]: o }, { [cv]: bV, [cu]: bM, [ct]: o }, { [cv]: bW, [cu]: bM, [ct]: o }, { [cv]: bX, [cu]: bM, [ct]: o }, at], [ct]: o }, { [cv]: bT, [cu]: bR, [ct]: o }, { [cv]: bU, [cu]: bR, [ct]: o }, { [cv]: bV, [cu]: bR, [ct]: o }, { [cv]: bW, [cu]: bR, [ct]: o }, { [cv]: bX, [cu]: bR, [ct]: o }, at], [ct]: o }], [ct]: o }, an2], [ct]: o }, { [cv]: [au2, ao, ap], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: bC, endpoint: { [cA]: t, [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bH, endpoint: { [cA]: "https://s3express-control-fips.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bI, endpoint: { [cA]: "https://s3express-control-fips.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bJ, endpoint: { [cA]: "https://s3express-control.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bK, endpoint: { [cA]: "https://s3express-control.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: al }, [ct]: n }], [ct]: o }], [ct]: o }, { [cv]: [ac, { [cw]: k, [cx]: [ad, 49, 50, c], [cz]: u }, { [cw]: k, [cx]: [ad, 8, 12, c], [cz]: v2 }, { [cw]: k, [cx]: bS, [cz]: w }, { [cw]: k, [cx]: [ad, 32, 49, c], [cz]: x2 }, { [cw]: g2, [cx]: by, [cz]: "regionPartition" }, { [cw]: h, [cx]: [{ [cy]: w }, "--op-s3"] }], [cu]: [{ [cv]: bZ, [cu]: [{ [cv]: [{ [cw]: h, [cx]: [av, "e"] }], [cu]: [{ [cv]: ca, [cu]: [aw, { [cv]: bC, endpoint: { [cA]: "https://{Bucket}.ec2.{url#authority}", [cB]: ax, [cH]: al }, [ct]: n }], [ct]: o }, { endpoint: { [cA]: "https://{Bucket}.ec2.s3-outposts.{Region}.{regionPartition#dnsSuffix}", [cB]: ax, [cH]: al }, [ct]: n }], [ct]: o }, { [cv]: [{ [cw]: h, [cx]: [av, "o"] }], [cu]: [{ [cv]: ca, [cu]: [aw, { [cv]: bC, endpoint: { [cA]: "https://{Bucket}.op-{outpostId}.{url#authority}", [cB]: ax, [cH]: al }, [ct]: n }], [ct]: o }, { endpoint: { [cA]: "https://{Bucket}.op-{outpostId}.s3-outposts.{Region}.{regionPartition#dnsSuffix}", [cB]: ax, [cH]: al }, [ct]: n }], [ct]: o }, { error: 'Unrecognized hardware type: "Expected hardware type o or e but got {hardwareType}"', [ct]: f }], [ct]: o }, { error: "Invalid ARN: The outpost Id must only contain a-z, A-Z, 0-9 and `-`.", [ct]: f }], [ct]: o }, { [cv]: bY, [cu]: [{ [cv]: [Z, { [cw]: r, [cx]: [{ [cw]: d, [cx]: [{ [cw]: m2, [cx]: bz }] }] }], error: "Custom endpoint `{Endpoint}` was not a valid URI", [ct]: f }, { [cv]: [ay, am], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cc, [cu]: [{ [cv]: [W, ab], error: "S3 Accelerate cannot be used in this region", [ct]: f }, { [cv]: [Y, X, aA, aq, aB], endpoint: { [cA]: "https://{Bucket}.s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [Y, X, aA, aq, aD, aE], [cu]: [{ endpoint: aF, [ct]: n }], [ct]: o }, { [cv]: [Y, X, aA, aq, aD, aH], endpoint: aF, [ct]: n }, { [cv]: [ar2, X, aA, aq, aB], endpoint: { [cA]: "https://{Bucket}.s3-fips.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar2, X, aA, aq, aD, aE], [cu]: [{ endpoint: aI, [ct]: n }], [ct]: o }, { [cv]: [ar2, X, aA, aq, aD, aH], endpoint: aI, [ct]: n }, { [cv]: [Y, as, W, aq, aB], endpoint: { [cA]: "https://{Bucket}.s3-accelerate.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [Y, as, W, aq, aD, aE], [cu]: [{ endpoint: aJ, [ct]: n }], [ct]: o }, { [cv]: [Y, as, W, aq, aD, aH], endpoint: aJ, [ct]: n }, { [cv]: [Y, as, aA, aq, aB], endpoint: { [cA]: "https://{Bucket}.s3.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [Y, as, aA, aq, aD, aE], [cu]: [{ endpoint: aK, [ct]: n }], [ct]: o }, { [cv]: [Y, as, aA, aq, aD, aH], endpoint: aK, [ct]: n }, { [cv]: [ar2, as, aA, Z, ag, ah, aB], endpoint: { [cA]: C, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar2, as, aA, Z, ag, aL, aB], endpoint: { [cA]: q, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar2, as, aA, Z, ag, ah, aD, aE], [cu]: [{ [cv]: cd, endpoint: aM, [ct]: n }, { endpoint: aM, [ct]: n }], [ct]: o }, { [cv]: [ar2, as, aA, Z, ag, aL, aD, aE], [cu]: [{ [cv]: cd, endpoint: aN, [ct]: n }, aO], [ct]: o }, { [cv]: [ar2, as, aA, Z, ag, ah, aD, aH], endpoint: aM, [ct]: n }, { [cv]: [ar2, as, aA, Z, ag, aL, aD, aH], endpoint: aN, [ct]: n }, { [cv]: [ar2, as, W, aq, aB], endpoint: { [cA]: D, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar2, as, W, aq, aD, aE], [cu]: [{ [cv]: cd, endpoint: aP, [ct]: n }, { endpoint: aP, [ct]: n }], [ct]: o }, { [cv]: [ar2, as, W, aq, aD, aH], endpoint: aP, [ct]: n }, { [cv]: [ar2, as, aA, aq, aB], endpoint: { [cA]: E2, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar2, as, aA, aq, aD, aE], [cu]: [{ [cv]: cd, endpoint: { [cA]: E2, [cB]: aG, [cH]: al }, [ct]: n }, { endpoint: aQ, [ct]: n }], [ct]: o }, { [cv]: [ar2, as, aA, aq, aD, aH], endpoint: aQ, [ct]: n }], [ct]: o }, aR], [ct]: o }], [ct]: o }, { [cv]: [Z, ag, { [cw]: h, [cx]: [{ [cw]: i, [cx]: [ai, "scheme"] }, "http"] }, { [cw]: p2, [cx]: [ad, c] }, ay, as, ar2, aA], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cc, [cu]: [aO], [ct]: o }, aR], [ct]: o }], [ct]: o }, { [cv]: [ay, { [cw]: F, [cx]: bA, [cz]: G }], [cu]: [{ [cv]: [{ [cw]: i, [cx]: [aS, "resourceId[0]"], [cz]: H }, { [cw]: r, [cx]: [{ [cw]: h, [cx]: [aT, I2] }] }], [cu]: [{ [cv]: [{ [cw]: h, [cx]: [aU, J] }], [cu]: [{ [cv]: ce, [cu]: [{ [cv]: cf, [cu]: [aW, aX, { [cv]: ci2, [cu]: [aY, { [cv]: cj, [cu]: [aZ, { [cv]: cl, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cm, [cu]: [{ [cv]: cn, [cu]: [{ [cv]: [{ [cw]: h, [cx]: [bb, I2] }], error: "Invalid ARN: Missing account id", [ct]: f }, { [cv]: co, [cu]: [{ [cv]: cp, [cu]: [{ [cv]: bC, endpoint: { [cA]: M, [cB]: bc, [cH]: al }, [ct]: n }, { [cv]: cq, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-object-lambda-fips.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bc, [cH]: al }, [ct]: n }, { endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-object-lambda.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bc, [cH]: al }, [ct]: n }], [ct]: o }, bd], [ct]: o }, be], [ct]: o }, bf], [ct]: o }, bg], [ct]: o }], [ct]: o }], [ct]: o }, bh], [ct]: o }, { error: "Invalid ARN: bucket ARN is missing a region", [ct]: f }], [ct]: o }, bi], [ct]: o }, { error: "Invalid ARN: Object Lambda ARNs only support `accesspoint` arn types, but found: `{arnType}`", [ct]: f }], [ct]: o }, { [cv]: ce, [cu]: [{ [cv]: cf, [cu]: [{ [cv]: ci2, [cu]: [{ [cv]: ce, [cu]: [{ [cv]: ci2, [cu]: [aY, { [cv]: cj, [cu]: [aZ, { [cv]: cl, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: [{ [cw]: h, [cx]: [ba, "{partitionResult#name}"] }], [cu]: [{ [cv]: cn, [cu]: [{ [cv]: [{ [cw]: h, [cx]: [aU, B] }], [cu]: [{ [cv]: co, [cu]: [{ [cv]: cp, [cu]: [{ [cv]: bB, error: "Access Points do not support S3 Accelerate", [ct]: f }, { [cv]: bH, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint-fips.dualstack.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bj, [cH]: al }, [ct]: n }, { [cv]: bI, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint-fips.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bj, [cH]: al }, [ct]: n }, { [cv]: bJ, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint.dualstack.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bj, [cH]: al }, [ct]: n }, { [cv]: [as, ar2, Z, ag], endpoint: { [cA]: M, [cB]: bj, [cH]: al }, [ct]: n }, { [cv]: bK, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bj, [cH]: al }, [ct]: n }], [ct]: o }, bd], [ct]: o }, be], [ct]: o }, { error: "Invalid ARN: The ARN was not for the S3 service, found: {bucketArn#service}", [ct]: f }], [ct]: o }, bf], [ct]: o }, bg], [ct]: o }], [ct]: o }], [ct]: o }, bh], [ct]: o }], [ct]: o }], [ct]: o }, { [cv]: [{ [cw]: y2, [cx]: [aV, c] }], [cu]: [{ [cv]: ch, error: "S3 MRAP does not support dual-stack", [ct]: f }, { [cv]: cq, error: "S3 MRAP does not support FIPS", [ct]: f }, { [cv]: bB, error: "S3 MRAP does not support S3 Accelerate", [ct]: f }, { [cv]: [{ [cw]: e, [cx]: [{ [cy]: "DisableMultiRegionAccessPoints" }, c] }], error: "Invalid configuration: Multi-Region Access Point ARNs are disabled.", [ct]: f }, { [cv]: [{ [cw]: g2, [cx]: by, [cz]: N2 }], [cu]: [{ [cv]: [{ [cw]: h, [cx]: [{ [cw]: i, [cx]: [{ [cy]: N2 }, j] }, { [cw]: i, [cx]: [aS, "partition"] }] }], [cu]: [{ endpoint: { [cA]: "https://{accessPointName}.accesspoint.s3-global.{mrapPartition#dnsSuffix}", [cB]: { [cD]: [{ [cE]: c, name: z2, [cF]: B, [cI]: cb }] }, [cH]: al }, [ct]: n }], [ct]: o }, { error: "Client was configured for partition `{mrapPartition#name}` but bucket referred to partition `{bucketArn#partition}`", [ct]: f }], [ct]: o }], [ct]: o }, { error: "Invalid Access Point Name", [ct]: f }], [ct]: o }, bi], [ct]: o }, { [cv]: [{ [cw]: h, [cx]: [aU, A] }], [cu]: [{ [cv]: ch, error: "S3 Outposts does not support Dual-stack", [ct]: f }, { [cv]: cq, error: "S3 Outposts does not support FIPS", [ct]: f }, { [cv]: bB, error: "S3 Outposts does not support S3 Accelerate", [ct]: f }, { [cv]: [{ [cw]: d, [cx]: [{ [cw]: i, [cx]: [aS, "resourceId[4]"] }] }], error: "Invalid Arn: Outpost Access Point ARN contains sub resources", [ct]: f }, { [cv]: [{ [cw]: i, [cx]: cg, [cz]: x2 }], [cu]: [{ [cv]: bZ, [cu]: [aZ, { [cv]: cl, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cm, [cu]: [{ [cv]: cn, [cu]: [{ [cv]: co, [cu]: [{ [cv]: [{ [cw]: i, [cx]: ck, [cz]: O2 }], [cu]: [{ [cv]: [{ [cw]: i, [cx]: [aS, "resourceId[3]"], [cz]: L }], [cu]: [{ [cv]: [{ [cw]: h, [cx]: [{ [cy]: O2 }, K] }], [cu]: [{ [cv]: bC, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.{outpostId}.{url#authority}", [cB]: bk, [cH]: al }, [ct]: n }, { endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.{outpostId}.s3-outposts.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bk, [cH]: al }, [ct]: n }], [ct]: o }, { error: "Expected an outpost type `accesspoint`, found {outpostType}", [ct]: f }], [ct]: o }, { error: "Invalid ARN: expected an access point name", [ct]: f }], [ct]: o }, { error: "Invalid ARN: Expected a 4-component resource", [ct]: f }], [ct]: o }, be], [ct]: o }, bf], [ct]: o }, bg], [ct]: o }], [ct]: o }], [ct]: o }, { error: "Invalid ARN: The outpost Id may only contain a-z, A-Z, 0-9 and `-`. Found: `{outpostId}`", [ct]: f }], [ct]: o }, { error: "Invalid ARN: The Outpost Id was not set", [ct]: f }], [ct]: o }, { error: "Invalid ARN: Unrecognized format: {Bucket} (type: {arnType})", [ct]: f }], [ct]: o }, { error: "Invalid ARN: No ARN type specified", [ct]: f }], [ct]: o }, { [cv]: [{ [cw]: k, [cx]: [ad, 0, 4, b], [cz]: P }, { [cw]: h, [cx]: [{ [cy]: P }, "arn:"] }, { [cw]: r, [cx]: [{ [cw]: d, [cx]: [bl] }] }], error: "Invalid ARN: `{Bucket}` was not a valid ARN", [ct]: f }, { [cv]: [{ [cw]: e, [cx]: [az, c] }, bl], error: "Path-style addressing cannot be used with ARN buckets", [ct]: f }, { [cv]: bE, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: [aA], [cu]: [{ [cv]: [Y, aq, X, aB], endpoint: { [cA]: "https://s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [Y, aq, X, aD, aE], [cu]: [{ endpoint: bm, [ct]: n }], [ct]: o }, { [cv]: [Y, aq, X, aD, aH], endpoint: bm, [ct]: n }, { [cv]: [ar2, aq, X, aB], endpoint: { [cA]: "https://s3-fips.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar2, aq, X, aD, aE], [cu]: [{ endpoint: bn2, [ct]: n }], [ct]: o }, { [cv]: [ar2, aq, X, aD, aH], endpoint: bn2, [ct]: n }, { [cv]: [Y, aq, as, aB], endpoint: { [cA]: "https://s3.dualstack.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [Y, aq, as, aD, aE], [cu]: [{ endpoint: bo, [ct]: n }], [ct]: o }, { [cv]: [Y, aq, as, aD, aH], endpoint: bo, [ct]: n }, { [cv]: [ar2, Z, ag, as, aB], endpoint: { [cA]: Q, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar2, Z, ag, as, aD, aE], [cu]: [{ [cv]: cd, endpoint: bp, [ct]: n }, { endpoint: bp, [ct]: n }], [ct]: o }, { [cv]: [ar2, Z, ag, as, aD, aH], endpoint: bp, [ct]: n }, { [cv]: [ar2, aq, as, aB], endpoint: { [cA]: R, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar2, aq, as, aD, aE], [cu]: [{ [cv]: cd, endpoint: { [cA]: R, [cB]: aG, [cH]: al }, [ct]: n }, { endpoint: bq, [ct]: n }], [ct]: o }, { [cv]: [ar2, aq, as, aD, aH], endpoint: bq, [ct]: n }], [ct]: o }, { error: "Path-style addressing cannot be used with S3 Accelerate", [ct]: f }], [ct]: o }], [ct]: o }], [ct]: o }, { [cv]: [{ [cw]: d, [cx]: [br] }, { [cw]: e, [cx]: [br, c] }], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cr, [cu]: [aW, aX, { [cv]: bC, endpoint: { [cA]: t, [cB]: bs2, [cH]: al }, [ct]: n }, { [cv]: cq, endpoint: { [cA]: "https://s3-object-lambda-fips.{Region}.{partitionResult#dnsSuffix}", [cB]: bs2, [cH]: al }, [ct]: n }, { endpoint: { [cA]: "https://s3-object-lambda.{Region}.{partitionResult#dnsSuffix}", [cB]: bs2, [cH]: al }, [ct]: n }], [ct]: o }, aR], [ct]: o }], [ct]: o }, { [cv]: [au2], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cr, [cu]: [{ [cv]: [X, Y, aq, aB], endpoint: { [cA]: "https://s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [X, Y, aq, aD, aE], [cu]: [{ endpoint: bt, [ct]: n }], [ct]: o }, { [cv]: [X, Y, aq, aD, aH], endpoint: bt, [ct]: n }, { [cv]: [X, ar2, aq, aB], endpoint: { [cA]: "https://s3-fips.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [X, ar2, aq, aD, aE], [cu]: [{ endpoint: bu, [ct]: n }], [ct]: o }, { [cv]: [X, ar2, aq, aD, aH], endpoint: bu, [ct]: n }, { [cv]: [as, Y, aq, aB], endpoint: { [cA]: "https://s3.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [as, Y, aq, aD, aE], [cu]: [{ endpoint: bv, [ct]: n }], [ct]: o }, { [cv]: [as, Y, aq, aD, aH], endpoint: bv, [ct]: n }, { [cv]: [as, ar2, Z, ag, aB], endpoint: { [cA]: t, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [as, ar2, Z, ag, aD, aE], [cu]: [{ [cv]: cd, endpoint: bw, [ct]: n }, { endpoint: bw, [ct]: n }], [ct]: o }, { [cv]: [as, ar2, Z, ag, aD, aH], endpoint: bw, [ct]: n }, { [cv]: [as, ar2, aq, aB], endpoint: { [cA]: S2, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [as, ar2, aq, aD, aE], [cu]: [{ [cv]: cd, endpoint: { [cA]: S2, [cB]: aG, [cH]: al }, [ct]: n }, { endpoint: bx, [ct]: n }], [ct]: o }, { [cv]: [as, ar2, aq, aD, aH], endpoint: bx, [ct]: n }], [ct]: o }, aR], [ct]: o }], [ct]: o }], [ct]: o }, { error: "A region must be set when sending requests to S3.", [ct]: f }] };
var ruleSet = _data;

// node_modules/@aws-sdk/client-s3/dist-es/endpoint/endpointResolver.js
var cache = new EndpointCache({
  size: 50,
  params: [
    "Accelerate",
    "Bucket",
    "DisableAccessPoints",
    "DisableMultiRegionAccessPoints",
    "DisableS3ExpressSessionAuth",
    "Endpoint",
    "ForcePathStyle",
    "Region",
    "UseArnRegion",
    "UseDualStack",
    "UseFIPS",
    "UseGlobalEndpoint",
    "UseObjectLambdaEndpoint",
    "UseS3ExpressControlEndpoint"
  ]
});
var defaultEndpointResolver = /* @__PURE__ */ __name((endpointParams, context = {}) => {
  return cache.get(endpointParams, () => resolveEndpoint(ruleSet, {
    endpointParams,
    logger: context.logger
  }));
}, "defaultEndpointResolver");
customEndpointFunctions.aws = awsEndpointFunctions;

// node_modules/@aws-sdk/client-s3/dist-es/auth/httpAuthSchemeProvider.js
var createEndpointRuleSetHttpAuthSchemeParametersProvider = /* @__PURE__ */ __name((defaultHttpAuthSchemeParametersProvider) => async (config, context, input) => {
  if (!input) {
    throw new Error(`Could not find \`input\` for \`defaultEndpointRuleSetHttpAuthSchemeParametersProvider\``);
  }
  const defaultParameters = await defaultHttpAuthSchemeParametersProvider(config, context, input);
  const instructionsFn = getSmithyContext(context)?.commandInstance?.constructor?.getEndpointParameterInstructions;
  if (!instructionsFn) {
    throw new Error(`getEndpointParameterInstructions() is not defined on \`${context.commandName}\``);
  }
  const endpointParameters = await resolveParams(input, { getEndpointParameterInstructions: instructionsFn }, config);
  return Object.assign(defaultParameters, endpointParameters);
}, "createEndpointRuleSetHttpAuthSchemeParametersProvider");
var _defaultS3HttpAuthSchemeParametersProvider = /* @__PURE__ */ __name(async (config, context, input) => {
  return {
    operation: getSmithyContext(context).operation,
    region: await normalizeProvider(config.region)() || (() => {
      throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
    })()
  };
}, "_defaultS3HttpAuthSchemeParametersProvider");
var defaultS3HttpAuthSchemeParametersProvider = createEndpointRuleSetHttpAuthSchemeParametersProvider(_defaultS3HttpAuthSchemeParametersProvider);
function createAwsAuthSigv4HttpAuthOption(authParameters) {
  return {
    schemeId: "aws.auth#sigv4",
    signingProperties: {
      name: "s3",
      region: authParameters.region
    },
    propertiesExtractor: (config, context) => ({
      signingProperties: {
        config,
        context
      }
    })
  };
}
__name(createAwsAuthSigv4HttpAuthOption, "createAwsAuthSigv4HttpAuthOption");
function createAwsAuthSigv4aHttpAuthOption(authParameters) {
  return {
    schemeId: "aws.auth#sigv4a",
    signingProperties: {
      name: "s3",
      region: authParameters.region
    },
    propertiesExtractor: (config, context) => ({
      signingProperties: {
        config,
        context
      }
    })
  };
}
__name(createAwsAuthSigv4aHttpAuthOption, "createAwsAuthSigv4aHttpAuthOption");
var createEndpointRuleSetHttpAuthSchemeProvider = /* @__PURE__ */ __name((defaultEndpointResolver2, defaultHttpAuthSchemeResolver, createHttpAuthOptionFunctions) => {
  const endpointRuleSetHttpAuthSchemeProvider = /* @__PURE__ */ __name((authParameters) => {
    const endpoint = defaultEndpointResolver2(authParameters);
    const authSchemes = endpoint.properties?.authSchemes;
    if (!authSchemes) {
      return defaultHttpAuthSchemeResolver(authParameters);
    }
    const options = [];
    for (const scheme of authSchemes) {
      const { name: resolvedName, properties = {}, ...rest } = scheme;
      const name = resolvedName.toLowerCase();
      if (resolvedName !== name) {
        console.warn(`HttpAuthScheme has been normalized with lowercasing: \`${resolvedName}\` to \`${name}\``);
      }
      let schemeId;
      if (name === "sigv4a") {
        schemeId = "aws.auth#sigv4a";
        const sigv4Present = authSchemes.find((s2) => {
          const name2 = s2.name.toLowerCase();
          return name2 !== "sigv4a" && name2.startsWith("sigv4");
        });
        if (SignatureV4MultiRegion.sigv4aDependency() === "none" && sigv4Present) {
          continue;
        }
      } else if (name.startsWith("sigv4")) {
        schemeId = "aws.auth#sigv4";
      } else {
        throw new Error(`Unknown HttpAuthScheme found in \`@smithy.rules#endpointRuleSet\`: \`${name}\``);
      }
      const createOption = createHttpAuthOptionFunctions[schemeId];
      if (!createOption) {
        throw new Error(`Could not find HttpAuthOption create function for \`${schemeId}\``);
      }
      const option = createOption(authParameters);
      option.schemeId = schemeId;
      option.signingProperties = { ...option.signingProperties || {}, ...rest, ...properties };
      options.push(option);
    }
    return options;
  }, "endpointRuleSetHttpAuthSchemeProvider");
  return endpointRuleSetHttpAuthSchemeProvider;
}, "createEndpointRuleSetHttpAuthSchemeProvider");
var _defaultS3HttpAuthSchemeProvider = /* @__PURE__ */ __name((authParameters) => {
  const options = [];
  switch (authParameters.operation) {
    default: {
      options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
      options.push(createAwsAuthSigv4aHttpAuthOption(authParameters));
    }
  }
  return options;
}, "_defaultS3HttpAuthSchemeProvider");
var defaultS3HttpAuthSchemeProvider = createEndpointRuleSetHttpAuthSchemeProvider(defaultEndpointResolver, _defaultS3HttpAuthSchemeProvider, {
  "aws.auth#sigv4": createAwsAuthSigv4HttpAuthOption,
  "aws.auth#sigv4a": createAwsAuthSigv4aHttpAuthOption
});
var resolveHttpAuthSchemeConfig = /* @__PURE__ */ __name((config) => {
  const config_0 = resolveAwsSdkSigV4Config(config);
  const config_1 = resolveAwsSdkSigV4AConfig(config_0);
  return Object.assign(config_1, {
    authSchemePreference: normalizeProvider(config.authSchemePreference ?? [])
  });
}, "resolveHttpAuthSchemeConfig");

// node_modules/@aws-sdk/client-s3/dist-es/commands/CreateSessionCommand.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/client-s3/dist-es/endpoint/EndpointParameters.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var resolveClientEndpointParameters = /* @__PURE__ */ __name((options) => {
  return Object.assign(options, {
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    forcePathStyle: options.forcePathStyle ?? false,
    useAccelerateEndpoint: options.useAccelerateEndpoint ?? false,
    useGlobalEndpoint: options.useGlobalEndpoint ?? false,
    disableMultiregionAccessPoints: options.disableMultiregionAccessPoints ?? false,
    defaultSigningName: "s3"
  });
}, "resolveClientEndpointParameters");
var commonParams = {
  ForcePathStyle: { type: "clientContextParams", name: "forcePathStyle" },
  UseArnRegion: { type: "clientContextParams", name: "useArnRegion" },
  DisableMultiRegionAccessPoints: { type: "clientContextParams", name: "disableMultiregionAccessPoints" },
  Accelerate: { type: "clientContextParams", name: "useAccelerateEndpoint" },
  DisableS3ExpressSessionAuth: { type: "clientContextParams", name: "disableS3ExpressSessionAuth" },
  UseGlobalEndpoint: { type: "builtInParams", name: "useGlobalEndpoint" },
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
};

// node_modules/@aws-sdk/client-s3/dist-es/schemas/schemas_0.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/client-s3/dist-es/models/models_0.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/client-s3/dist-es/models/S3ServiceException.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var S3ServiceException = class extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, S3ServiceException.prototype);
  }
};
__name(S3ServiceException, "S3ServiceException");

// node_modules/@aws-sdk/client-s3/dist-es/models/models_0.js
var NoSuchUpload = class extends S3ServiceException {
  name = "NoSuchUpload";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NoSuchUpload",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NoSuchUpload.prototype);
  }
};
__name(NoSuchUpload, "NoSuchUpload");
var ObjectNotInActiveTierError = class extends S3ServiceException {
  name = "ObjectNotInActiveTierError";
  $fault = "client";
  constructor(opts) {
    super({
      name: "ObjectNotInActiveTierError",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ObjectNotInActiveTierError.prototype);
  }
};
__name(ObjectNotInActiveTierError, "ObjectNotInActiveTierError");
var BucketAlreadyExists = class extends S3ServiceException {
  name = "BucketAlreadyExists";
  $fault = "client";
  constructor(opts) {
    super({
      name: "BucketAlreadyExists",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, BucketAlreadyExists.prototype);
  }
};
__name(BucketAlreadyExists, "BucketAlreadyExists");
var BucketAlreadyOwnedByYou = class extends S3ServiceException {
  name = "BucketAlreadyOwnedByYou";
  $fault = "client";
  constructor(opts) {
    super({
      name: "BucketAlreadyOwnedByYou",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, BucketAlreadyOwnedByYou.prototype);
  }
};
__name(BucketAlreadyOwnedByYou, "BucketAlreadyOwnedByYou");
var NoSuchBucket = class extends S3ServiceException {
  name = "NoSuchBucket";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NoSuchBucket",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NoSuchBucket.prototype);
  }
};
__name(NoSuchBucket, "NoSuchBucket");
var InvalidObjectState = class extends S3ServiceException {
  name = "InvalidObjectState";
  $fault = "client";
  StorageClass;
  AccessTier;
  constructor(opts) {
    super({
      name: "InvalidObjectState",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidObjectState.prototype);
    this.StorageClass = opts.StorageClass;
    this.AccessTier = opts.AccessTier;
  }
};
__name(InvalidObjectState, "InvalidObjectState");
var NoSuchKey = class extends S3ServiceException {
  name = "NoSuchKey";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NoSuchKey",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NoSuchKey.prototype);
  }
};
__name(NoSuchKey, "NoSuchKey");
var NotFound = class extends S3ServiceException {
  name = "NotFound";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NotFound",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NotFound.prototype);
  }
};
__name(NotFound, "NotFound");

// node_modules/@aws-sdk/client-s3/dist-es/models/models_1.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var EncryptionTypeMismatch = class extends S3ServiceException {
  name = "EncryptionTypeMismatch";
  $fault = "client";
  constructor(opts) {
    super({
      name: "EncryptionTypeMismatch",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, EncryptionTypeMismatch.prototype);
  }
};
__name(EncryptionTypeMismatch, "EncryptionTypeMismatch");
var InvalidRequest = class extends S3ServiceException {
  name = "InvalidRequest";
  $fault = "client";
  constructor(opts) {
    super({
      name: "InvalidRequest",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidRequest.prototype);
  }
};
__name(InvalidRequest, "InvalidRequest");
var InvalidWriteOffset = class extends S3ServiceException {
  name = "InvalidWriteOffset";
  $fault = "client";
  constructor(opts) {
    super({
      name: "InvalidWriteOffset",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidWriteOffset.prototype);
  }
};
__name(InvalidWriteOffset, "InvalidWriteOffset");
var TooManyParts = class extends S3ServiceException {
  name = "TooManyParts";
  $fault = "client";
  constructor(opts) {
    super({
      name: "TooManyParts",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, TooManyParts.prototype);
  }
};
__name(TooManyParts, "TooManyParts");
var IdempotencyParameterMismatch = class extends S3ServiceException {
  name = "IdempotencyParameterMismatch";
  $fault = "client";
  constructor(opts) {
    super({
      name: "IdempotencyParameterMismatch",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, IdempotencyParameterMismatch.prototype);
  }
};
__name(IdempotencyParameterMismatch, "IdempotencyParameterMismatch");
var ObjectAlreadyInActiveTierError = class extends S3ServiceException {
  name = "ObjectAlreadyInActiveTierError";
  $fault = "client";
  constructor(opts) {
    super({
      name: "ObjectAlreadyInActiveTierError",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ObjectAlreadyInActiveTierError.prototype);
  }
};
__name(ObjectAlreadyInActiveTierError, "ObjectAlreadyInActiveTierError");

// node_modules/@aws-sdk/client-s3/dist-es/schemas/schemas_0.js
var _A = "Account";
var _AAO = "AnalyticsAndOperator";
var _AC = "AccelerateConfiguration";
var _ACL = "AccessControlList";
var _ACL_ = "ACL";
var _ACLn = "AnalyticsConfigurationList";
var _ACP = "AccessControlPolicy";
var _ACT = "AccessControlTranslation";
var _ACn = "AnalyticsConfiguration";
var _AD = "AbortDate";
var _AED = "AnalyticsExportDestination";
var _AF = "AnalyticsFilter";
var _AH = "AllowedHeaders";
var _AHl = "AllowedHeader";
var _AI = "AccountId";
var _AIMU = "AbortIncompleteMultipartUpload";
var _AKI = "AccessKeyId";
var _AM = "AllowedMethods";
var _AMU = "AbortMultipartUpload";
var _AMUO = "AbortMultipartUploadOutput";
var _AMUR = "AbortMultipartUploadRequest";
var _AMl = "AllowedMethod";
var _AO = "AllowedOrigins";
var _AOl = "AllowedOrigin";
var _APA = "AccessPointAlias";
var _APAc = "AccessPointArn";
var _AQRD = "AllowQuotedRecordDelimiter";
var _AR = "AcceptRanges";
var _ARI = "AbortRuleId";
var _AS = "ArchiveStatus";
var _ASBD = "AnalyticsS3BucketDestination";
var _ASSEBD = "ApplyServerSideEncryptionByDefault";
var _AT = "AccessTier";
var _An = "And";
var _B = "Bucket";
var _BA = "BucketArn";
var _BAE = "BucketAlreadyExists";
var _BAI = "BucketAccountId";
var _BAOBY = "BucketAlreadyOwnedByYou";
var _BGR = "BypassGovernanceRetention";
var _BI = "BucketInfo";
var _BKE = "BucketKeyEnabled";
var _BLC = "BucketLifecycleConfiguration";
var _BLN = "BucketLocationName";
var _BLS = "BucketLoggingStatus";
var _BLT = "BucketLocationType";
var _BN = "BucketName";
var _BP = "BytesProcessed";
var _BPA = "BlockPublicAcls";
var _BPP = "BlockPublicPolicy";
var _BR = "BucketRegion";
var _BRy = "BytesReturned";
var _BS = "BytesScanned";
var _Bo = "Body";
var _Bu = "Buckets";
var _C = "Checksum";
var _CA = "ChecksumAlgorithm";
var _CACL = "CannedACL";
var _CB = "CreateBucket";
var _CBC = "CreateBucketConfiguration";
var _CBMC = "CreateBucketMetadataConfiguration";
var _CBMCR = "CreateBucketMetadataConfigurationRequest";
var _CBMTC = "CreateBucketMetadataTableConfiguration";
var _CBMTCR = "CreateBucketMetadataTableConfigurationRequest";
var _CBO = "CreateBucketOutput";
var _CBR = "CreateBucketRequest";
var _CC = "CacheControl";
var _CCRC = "ChecksumCRC32";
var _CCRCC = "ChecksumCRC32C";
var _CCRCNVME = "ChecksumCRC64NVME";
var _CC_ = "Cache-Control";
var _CD = "CreationDate";
var _CD_ = "Content-Disposition";
var _CDo = "ContentDisposition";
var _CE = "ContinuationEvent";
var _CE_ = "Content-Encoding";
var _CEo = "ContentEncoding";
var _CF = "CloudFunction";
var _CFC = "CloudFunctionConfiguration";
var _CL = "ContentLanguage";
var _CL_ = "Content-Language";
var _CL__ = "Content-Length";
var _CLo = "ContentLength";
var _CM = "Content-MD5";
var _CMD = "ContentMD5";
var _CMU = "CompletedMultipartUpload";
var _CMUO = "CompleteMultipartUploadOutput";
var _CMUOr = "CreateMultipartUploadOutput";
var _CMUR = "CompleteMultipartUploadResult";
var _CMURo = "CompleteMultipartUploadRequest";
var _CMURr = "CreateMultipartUploadRequest";
var _CMUo = "CompleteMultipartUpload";
var _CMUr = "CreateMultipartUpload";
var _CMh = "ChecksumMode";
var _CO = "CopyObject";
var _COO = "CopyObjectOutput";
var _COR = "CopyObjectResult";
var _CORSC = "CORSConfiguration";
var _CORSR = "CORSRules";
var _CORSRu = "CORSRule";
var _CORo = "CopyObjectRequest";
var _CP = "CommonPrefix";
var _CPL = "CommonPrefixList";
var _CPLo = "CompletedPartList";
var _CPR = "CopyPartResult";
var _CPo = "CompletedPart";
var _CPom = "CommonPrefixes";
var _CR = "ContentRange";
var _CRSBA = "ConfirmRemoveSelfBucketAccess";
var _CR_ = "Content-Range";
var _CS = "CopySource";
var _CSHA = "ChecksumSHA1";
var _CSHAh = "ChecksumSHA256";
var _CSIM = "CopySourceIfMatch";
var _CSIMS = "CopySourceIfModifiedSince";
var _CSINM = "CopySourceIfNoneMatch";
var _CSIUS = "CopySourceIfUnmodifiedSince";
var _CSO = "CreateSessionOutput";
var _CSR = "CreateSessionResult";
var _CSRo = "CopySourceRange";
var _CSRr = "CreateSessionRequest";
var _CSSSECA = "CopySourceSSECustomerAlgorithm";
var _CSSSECK = "CopySourceSSECustomerKey";
var _CSSSECKMD = "CopySourceSSECustomerKeyMD5";
var _CSV = "CSV";
var _CSVI = "CopySourceVersionId";
var _CSVIn = "CSVInput";
var _CSVO = "CSVOutput";
var _CSo = "ConfigurationState";
var _CSr = "CreateSession";
var _CT = "ChecksumType";
var _CT_ = "Content-Type";
var _CTl = "ClientToken";
var _CTo = "ContentType";
var _CTom = "CompressionType";
var _CTon = "ContinuationToken";
var _Co = "Condition";
var _Cod = "Code";
var _Com = "Comments";
var _Con = "Contents";
var _Cont = "Cont";
var _Cr = "Credentials";
var _D = "Days";
var _DAI = "DaysAfterInitiation";
var _DB = "DeleteBucket";
var _DBAC = "DeleteBucketAnalyticsConfiguration";
var _DBACR = "DeleteBucketAnalyticsConfigurationRequest";
var _DBC = "DeleteBucketCors";
var _DBCR = "DeleteBucketCorsRequest";
var _DBE = "DeleteBucketEncryption";
var _DBER = "DeleteBucketEncryptionRequest";
var _DBIC = "DeleteBucketInventoryConfiguration";
var _DBICR = "DeleteBucketInventoryConfigurationRequest";
var _DBITC = "DeleteBucketIntelligentTieringConfiguration";
var _DBITCR = "DeleteBucketIntelligentTieringConfigurationRequest";
var _DBL = "DeleteBucketLifecycle";
var _DBLR = "DeleteBucketLifecycleRequest";
var _DBMC = "DeleteBucketMetadataConfiguration";
var _DBMCR = "DeleteBucketMetadataConfigurationRequest";
var _DBMCRe = "DeleteBucketMetricsConfigurationRequest";
var _DBMCe = "DeleteBucketMetricsConfiguration";
var _DBMTC = "DeleteBucketMetadataTableConfiguration";
var _DBMTCR = "DeleteBucketMetadataTableConfigurationRequest";
var _DBOC = "DeleteBucketOwnershipControls";
var _DBOCR = "DeleteBucketOwnershipControlsRequest";
var _DBP = "DeleteBucketPolicy";
var _DBPR = "DeleteBucketPolicyRequest";
var _DBR = "DeleteBucketRequest";
var _DBRR = "DeleteBucketReplicationRequest";
var _DBRe = "DeleteBucketReplication";
var _DBT = "DeleteBucketTagging";
var _DBTR = "DeleteBucketTaggingRequest";
var _DBW = "DeleteBucketWebsite";
var _DBWR = "DeleteBucketWebsiteRequest";
var _DE = "DataExport";
var _DIM = "DestinationIfMatch";
var _DIMS = "DestinationIfModifiedSince";
var _DINM = "DestinationIfNoneMatch";
var _DIUS = "DestinationIfUnmodifiedSince";
var _DM = "DeleteMarker";
var _DME = "DeleteMarkerEntry";
var _DMR = "DeleteMarkerReplication";
var _DMVI = "DeleteMarkerVersionId";
var _DMe = "DeleteMarkers";
var _DN = "DisplayName";
var _DO = "DeletedObject";
var _DOO = "DeleteObjectOutput";
var _DOOe = "DeleteObjectsOutput";
var _DOR = "DeleteObjectRequest";
var _DORe = "DeleteObjectsRequest";
var _DOT = "DeleteObjectTagging";
var _DOTO = "DeleteObjectTaggingOutput";
var _DOTR = "DeleteObjectTaggingRequest";
var _DOe = "DeletedObjects";
var _DOel = "DeleteObject";
var _DOele = "DeleteObjects";
var _DPAB = "DeletePublicAccessBlock";
var _DPABR = "DeletePublicAccessBlockRequest";
var _DR = "DataRedundancy";
var _DRe = "DefaultRetention";
var _DRel = "DeleteResult";
var _DRes = "DestinationResult";
var _Da = "Date";
var _De = "Delete";
var _Del = "Deleted";
var _Deli = "Delimiter";
var _Des = "Destination";
var _Desc = "Description";
var _Det = "Details";
var _E = "Expiration";
var _EA = "EmailAddress";
var _EBC = "EventBridgeConfiguration";
var _EBO = "ExpectedBucketOwner";
var _EC = "EncryptionConfiguration";
var _ECr = "ErrorCode";
var _ED = "ErrorDetails";
var _EDr = "ErrorDocument";
var _EE = "EndEvent";
var _EH = "ExposeHeaders";
var _EHx = "ExposeHeader";
var _EM = "ErrorMessage";
var _EODM = "ExpiredObjectDeleteMarker";
var _EOR = "ExistingObjectReplication";
var _ES = "ExpiresString";
var _ESBO = "ExpectedSourceBucketOwner";
var _ET = "ETag";
var _ETM = "EncryptionTypeMismatch";
var _ETn = "EncryptionType";
var _ETnc = "EncodingType";
var _ETv = "EventThreshold";
var _ETx = "ExpressionType";
var _En = "Encryption";
var _Ena = "Enabled";
var _End = "End";
var _Er = "Errors";
var _Err = "Error";
var _Ev = "Events";
var _Eve = "Event";
var _Ex = "Expires";
var _Exp = "Expression";
var _F = "Filter";
var _FD = "FieldDelimiter";
var _FHI = "FileHeaderInfo";
var _FO = "FetchOwner";
var _FR = "FilterRule";
var _FRL = "FilterRuleList";
var _FRi = "FilterRules";
var _Fi = "Field";
var _Fo = "Format";
var _Fr = "Frequency";
var _G = "Grants";
var _GBA = "GetBucketAcl";
var _GBAC = "GetBucketAccelerateConfiguration";
var _GBACO = "GetBucketAccelerateConfigurationOutput";
var _GBACOe = "GetBucketAnalyticsConfigurationOutput";
var _GBACR = "GetBucketAccelerateConfigurationRequest";
var _GBACRe = "GetBucketAnalyticsConfigurationRequest";
var _GBACe = "GetBucketAnalyticsConfiguration";
var _GBAO = "GetBucketAclOutput";
var _GBAR = "GetBucketAclRequest";
var _GBC = "GetBucketCors";
var _GBCO = "GetBucketCorsOutput";
var _GBCR = "GetBucketCorsRequest";
var _GBE = "GetBucketEncryption";
var _GBEO = "GetBucketEncryptionOutput";
var _GBER = "GetBucketEncryptionRequest";
var _GBIC = "GetBucketInventoryConfiguration";
var _GBICO = "GetBucketInventoryConfigurationOutput";
var _GBICR = "GetBucketInventoryConfigurationRequest";
var _GBITC = "GetBucketIntelligentTieringConfiguration";
var _GBITCO = "GetBucketIntelligentTieringConfigurationOutput";
var _GBITCR = "GetBucketIntelligentTieringConfigurationRequest";
var _GBL = "GetBucketLocation";
var _GBLC = "GetBucketLifecycleConfiguration";
var _GBLCO = "GetBucketLifecycleConfigurationOutput";
var _GBLCR = "GetBucketLifecycleConfigurationRequest";
var _GBLO = "GetBucketLocationOutput";
var _GBLOe = "GetBucketLoggingOutput";
var _GBLR = "GetBucketLocationRequest";
var _GBLRe = "GetBucketLoggingRequest";
var _GBLe = "GetBucketLogging";
var _GBMC = "GetBucketMetadataConfiguration";
var _GBMCO = "GetBucketMetadataConfigurationOutput";
var _GBMCOe = "GetBucketMetricsConfigurationOutput";
var _GBMCR = "GetBucketMetadataConfigurationResult";
var _GBMCRe = "GetBucketMetadataConfigurationRequest";
var _GBMCRet = "GetBucketMetricsConfigurationRequest";
var _GBMCe = "GetBucketMetricsConfiguration";
var _GBMTC = "GetBucketMetadataTableConfiguration";
var _GBMTCO = "GetBucketMetadataTableConfigurationOutput";
var _GBMTCR = "GetBucketMetadataTableConfigurationResult";
var _GBMTCRe = "GetBucketMetadataTableConfigurationRequest";
var _GBNC = "GetBucketNotificationConfiguration";
var _GBNCR = "GetBucketNotificationConfigurationRequest";
var _GBOC = "GetBucketOwnershipControls";
var _GBOCO = "GetBucketOwnershipControlsOutput";
var _GBOCR = "GetBucketOwnershipControlsRequest";
var _GBP = "GetBucketPolicy";
var _GBPO = "GetBucketPolicyOutput";
var _GBPR = "GetBucketPolicyRequest";
var _GBPS = "GetBucketPolicyStatus";
var _GBPSO = "GetBucketPolicyStatusOutput";
var _GBPSR = "GetBucketPolicyStatusRequest";
var _GBR = "GetBucketReplication";
var _GBRO = "GetBucketReplicationOutput";
var _GBRP = "GetBucketRequestPayment";
var _GBRPO = "GetBucketRequestPaymentOutput";
var _GBRPR = "GetBucketRequestPaymentRequest";
var _GBRR = "GetBucketReplicationRequest";
var _GBT = "GetBucketTagging";
var _GBTO = "GetBucketTaggingOutput";
var _GBTR = "GetBucketTaggingRequest";
var _GBV = "GetBucketVersioning";
var _GBVO = "GetBucketVersioningOutput";
var _GBVR = "GetBucketVersioningRequest";
var _GBW = "GetBucketWebsite";
var _GBWO = "GetBucketWebsiteOutput";
var _GBWR = "GetBucketWebsiteRequest";
var _GFC = "GrantFullControl";
var _GJP = "GlacierJobParameters";
var _GO = "GetObject";
var _GOA = "GetObjectAcl";
var _GOAO = "GetObjectAclOutput";
var _GOAOe = "GetObjectAttributesOutput";
var _GOAP = "GetObjectAttributesParts";
var _GOAR = "GetObjectAclRequest";
var _GOARe = "GetObjectAttributesResponse";
var _GOARet = "GetObjectAttributesRequest";
var _GOAe = "GetObjectAttributes";
var _GOLC = "GetObjectLockConfiguration";
var _GOLCO = "GetObjectLockConfigurationOutput";
var _GOLCR = "GetObjectLockConfigurationRequest";
var _GOLH = "GetObjectLegalHold";
var _GOLHO = "GetObjectLegalHoldOutput";
var _GOLHR = "GetObjectLegalHoldRequest";
var _GOO = "GetObjectOutput";
var _GOR = "GetObjectRequest";
var _GORO = "GetObjectRetentionOutput";
var _GORR = "GetObjectRetentionRequest";
var _GORe = "GetObjectRetention";
var _GOT = "GetObjectTagging";
var _GOTO = "GetObjectTaggingOutput";
var _GOTOe = "GetObjectTorrentOutput";
var _GOTR = "GetObjectTaggingRequest";
var _GOTRe = "GetObjectTorrentRequest";
var _GOTe = "GetObjectTorrent";
var _GPAB = "GetPublicAccessBlock";
var _GPABO = "GetPublicAccessBlockOutput";
var _GPABR = "GetPublicAccessBlockRequest";
var _GR = "GrantRead";
var _GRACP = "GrantReadACP";
var _GW = "GrantWrite";
var _GWACP = "GrantWriteACP";
var _Gr = "Grant";
var _Gra = "Grantee";
var _HB = "HeadBucket";
var _HBO = "HeadBucketOutput";
var _HBR = "HeadBucketRequest";
var _HECRE = "HttpErrorCodeReturnedEquals";
var _HN = "HostName";
var _HO = "HeadObject";
var _HOO = "HeadObjectOutput";
var _HOR = "HeadObjectRequest";
var _HRC = "HttpRedirectCode";
var _I = "Id";
var _IC = "InventoryConfiguration";
var _ICL = "InventoryConfigurationList";
var _ID = "ID";
var _IDn = "IndexDocument";
var _IDnv = "InventoryDestination";
var _IE = "IsEnabled";
var _IEn = "InventoryEncryption";
var _IF = "InventoryFilter";
var _IL = "IsLatest";
var _IM = "IfMatch";
var _IMIT = "IfMatchInitiatedTime";
var _IMLMT = "IfMatchLastModifiedTime";
var _IMS = "IfMatchSize";
var _IMS_ = "If-Modified-Since";
var _IMSf = "IfModifiedSince";
var _IMUR = "InitiateMultipartUploadResult";
var _IM_ = "If-Match";
var _INM = "IfNoneMatch";
var _INM_ = "If-None-Match";
var _IOF = "InventoryOptionalFields";
var _IOS = "InvalidObjectState";
var _IOV = "IncludedObjectVersions";
var _IP = "IsPublic";
var _IPA = "IgnorePublicAcls";
var _IPM = "IdempotencyParameterMismatch";
var _IR = "InvalidRequest";
var _IRIP = "IsRestoreInProgress";
var _IS = "InputSerialization";
var _ISBD = "InventoryS3BucketDestination";
var _ISn = "InventorySchedule";
var _IT = "IsTruncated";
var _ITAO = "IntelligentTieringAndOperator";
var _ITC = "IntelligentTieringConfiguration";
var _ITCL = "IntelligentTieringConfigurationList";
var _ITCR = "InventoryTableConfigurationResult";
var _ITCU = "InventoryTableConfigurationUpdates";
var _ITCn = "InventoryTableConfiguration";
var _ITF = "IntelligentTieringFilter";
var _IUS = "IfUnmodifiedSince";
var _IUS_ = "If-Unmodified-Since";
var _IWO = "InvalidWriteOffset";
var _In = "Initiator";
var _Ini = "Initiated";
var _JSON = "JSON";
var _JSONI = "JSONInput";
var _JSONO = "JSONOutput";
var _JTC = "JournalTableConfiguration";
var _JTCR = "JournalTableConfigurationResult";
var _JTCU = "JournalTableConfigurationUpdates";
var _K = "Key";
var _KC = "KeyCount";
var _KI = "KeyId";
var _KKA = "KmsKeyArn";
var _KM = "KeyMarker";
var _KMSC = "KMSContext";
var _KMSKI = "KMSKeyId";
var _KMSMKID = "KMSMasterKeyID";
var _KPE = "KeyPrefixEquals";
var _L = "Location";
var _LAMBR = "ListAllMyBucketsResult";
var _LAMDBR = "ListAllMyDirectoryBucketsResult";
var _LB = "ListBuckets";
var _LBAC = "ListBucketAnalyticsConfigurations";
var _LBACO = "ListBucketAnalyticsConfigurationsOutput";
var _LBACR = "ListBucketAnalyticsConfigurationResult";
var _LBACRi = "ListBucketAnalyticsConfigurationsRequest";
var _LBIC = "ListBucketInventoryConfigurations";
var _LBICO = "ListBucketInventoryConfigurationsOutput";
var _LBICR = "ListBucketInventoryConfigurationsRequest";
var _LBITC = "ListBucketIntelligentTieringConfigurations";
var _LBITCO = "ListBucketIntelligentTieringConfigurationsOutput";
var _LBITCR = "ListBucketIntelligentTieringConfigurationsRequest";
var _LBMC = "ListBucketMetricsConfigurations";
var _LBMCO = "ListBucketMetricsConfigurationsOutput";
var _LBMCR = "ListBucketMetricsConfigurationsRequest";
var _LBO = "ListBucketsOutput";
var _LBR = "ListBucketsRequest";
var _LBRi = "ListBucketResult";
var _LC = "LocationConstraint";
var _LCi = "LifecycleConfiguration";
var _LDB = "ListDirectoryBuckets";
var _LDBO = "ListDirectoryBucketsOutput";
var _LDBR = "ListDirectoryBucketsRequest";
var _LE = "LoggingEnabled";
var _LEi = "LifecycleExpiration";
var _LFA = "LambdaFunctionArn";
var _LFC = "LambdaFunctionConfiguration";
var _LFCL = "LambdaFunctionConfigurationList";
var _LFCa = "LambdaFunctionConfigurations";
var _LH = "LegalHold";
var _LI = "LocationInfo";
var _LICR = "ListInventoryConfigurationsResult";
var _LM = "LastModified";
var _LMCR = "ListMetricsConfigurationsResult";
var _LMT = "LastModifiedTime";
var _LMU = "ListMultipartUploads";
var _LMUO = "ListMultipartUploadsOutput";
var _LMUR = "ListMultipartUploadsResult";
var _LMURi = "ListMultipartUploadsRequest";
var _LM_ = "Last-Modified";
var _LO = "ListObjects";
var _LOO = "ListObjectsOutput";
var _LOR = "ListObjectsRequest";
var _LOV = "ListObjectsV2";
var _LOVO = "ListObjectsV2Output";
var _LOVOi = "ListObjectVersionsOutput";
var _LOVR = "ListObjectsV2Request";
var _LOVRi = "ListObjectVersionsRequest";
var _LOVi = "ListObjectVersions";
var _LP = "ListParts";
var _LPO = "ListPartsOutput";
var _LPR = "ListPartsResult";
var _LPRi = "ListPartsRequest";
var _LR = "LifecycleRule";
var _LRAO = "LifecycleRuleAndOperator";
var _LRF = "LifecycleRuleFilter";
var _LRi = "LifecycleRules";
var _LVR = "ListVersionsResult";
var _M = "Metadata";
var _MAO = "MetricsAndOperator";
var _MAS = "MaxAgeSeconds";
var _MB = "MaxBuckets";
var _MC = "MetadataConfiguration";
var _MCL = "MetricsConfigurationList";
var _MCR = "MetadataConfigurationResult";
var _MCe = "MetricsConfiguration";
var _MD = "MetadataDirective";
var _MDB = "MaxDirectoryBuckets";
var _MDf = "MfaDelete";
var _ME = "MetadataEntry";
var _MF = "MetricsFilter";
var _MFA = "MFA";
var _MFAD = "MFADelete";
var _MK = "MaxKeys";
var _MM = "MissingMeta";
var _MOS = "MpuObjectSize";
var _MP = "MaxParts";
var _MTC = "MetadataTableConfiguration";
var _MTCR = "MetadataTableConfigurationResult";
var _MTEC = "MetadataTableEncryptionConfiguration";
var _MU = "MultipartUpload";
var _MUL = "MultipartUploadList";
var _MUa = "MaxUploads";
var _Ma = "Marker";
var _Me = "Metrics";
var _Mes = "Message";
var _Mi = "Minutes";
var _Mo = "Mode";
var _N = "Name";
var _NC = "NotificationConfiguration";
var _NCF = "NotificationConfigurationFilter";
var _NCT = "NextContinuationToken";
var _ND = "NoncurrentDays";
var _NF = "NotFound";
var _NKM = "NextKeyMarker";
var _NM = "NextMarker";
var _NNV = "NewerNoncurrentVersions";
var _NPNM = "NextPartNumberMarker";
var _NSB = "NoSuchBucket";
var _NSK = "NoSuchKey";
var _NSU = "NoSuchUpload";
var _NUIM = "NextUploadIdMarker";
var _NVE = "NoncurrentVersionExpiration";
var _NVIM = "NextVersionIdMarker";
var _NVT = "NoncurrentVersionTransitions";
var _NVTL = "NoncurrentVersionTransitionList";
var _NVTo = "NoncurrentVersionTransition";
var _O = "Owner";
var _OA = "ObjectAttributes";
var _OAIATE = "ObjectAlreadyInActiveTierError";
var _OC = "OwnershipControls";
var _OCR = "OwnershipControlsRule";
var _OCRw = "OwnershipControlsRules";
var _OF = "OptionalFields";
var _OI = "ObjectIdentifier";
var _OIL = "ObjectIdentifierList";
var _OL = "OutputLocation";
var _OLC = "ObjectLockConfiguration";
var _OLE = "ObjectLockEnabled";
var _OLEFB = "ObjectLockEnabledForBucket";
var _OLLH = "ObjectLockLegalHold";
var _OLLHS = "ObjectLockLegalHoldStatus";
var _OLM = "ObjectLockMode";
var _OLR = "ObjectLockRetention";
var _OLRUD = "ObjectLockRetainUntilDate";
var _OLRb = "ObjectLockRule";
var _OLb = "ObjectList";
var _ONIATE = "ObjectNotInActiveTierError";
var _OO = "ObjectOwnership";
var _OOA = "OptionalObjectAttributes";
var _OP = "ObjectParts";
var _OPb = "ObjectPart";
var _OS = "ObjectSize";
var _OSGT = "ObjectSizeGreaterThan";
var _OSLT = "ObjectSizeLessThan";
var _OSV = "OutputSchemaVersion";
var _OSu = "OutputSerialization";
var _OV = "ObjectVersion";
var _OVL = "ObjectVersionList";
var _Ob = "Objects";
var _Obj = "Object";
var _P = "Prefix";
var _PABC = "PublicAccessBlockConfiguration";
var _PBA = "PutBucketAcl";
var _PBAC = "PutBucketAccelerateConfiguration";
var _PBACR = "PutBucketAccelerateConfigurationRequest";
var _PBACRu = "PutBucketAnalyticsConfigurationRequest";
var _PBACu = "PutBucketAnalyticsConfiguration";
var _PBAR = "PutBucketAclRequest";
var _PBC = "PutBucketCors";
var _PBCR = "PutBucketCorsRequest";
var _PBE = "PutBucketEncryption";
var _PBER = "PutBucketEncryptionRequest";
var _PBIC = "PutBucketInventoryConfiguration";
var _PBICR = "PutBucketInventoryConfigurationRequest";
var _PBITC = "PutBucketIntelligentTieringConfiguration";
var _PBITCR = "PutBucketIntelligentTieringConfigurationRequest";
var _PBL = "PutBucketLogging";
var _PBLC = "PutBucketLifecycleConfiguration";
var _PBLCO = "PutBucketLifecycleConfigurationOutput";
var _PBLCR = "PutBucketLifecycleConfigurationRequest";
var _PBLR = "PutBucketLoggingRequest";
var _PBMC = "PutBucketMetricsConfiguration";
var _PBMCR = "PutBucketMetricsConfigurationRequest";
var _PBNC = "PutBucketNotificationConfiguration";
var _PBNCR = "PutBucketNotificationConfigurationRequest";
var _PBOC = "PutBucketOwnershipControls";
var _PBOCR = "PutBucketOwnershipControlsRequest";
var _PBP = "PutBucketPolicy";
var _PBPR = "PutBucketPolicyRequest";
var _PBR = "PutBucketReplication";
var _PBRP = "PutBucketRequestPayment";
var _PBRPR = "PutBucketRequestPaymentRequest";
var _PBRR = "PutBucketReplicationRequest";
var _PBT = "PutBucketTagging";
var _PBTR = "PutBucketTaggingRequest";
var _PBV = "PutBucketVersioning";
var _PBVR = "PutBucketVersioningRequest";
var _PBW = "PutBucketWebsite";
var _PBWR = "PutBucketWebsiteRequest";
var _PC = "PartsCount";
var _PDS = "PartitionDateSource";
var _PE = "ProgressEvent";
var _PI = "ParquetInput";
var _PL = "PartsList";
var _PN = "PartNumber";
var _PNM = "PartNumberMarker";
var _PO = "PutObject";
var _POA = "PutObjectAcl";
var _POAO = "PutObjectAclOutput";
var _POAR = "PutObjectAclRequest";
var _POLC = "PutObjectLockConfiguration";
var _POLCO = "PutObjectLockConfigurationOutput";
var _POLCR = "PutObjectLockConfigurationRequest";
var _POLH = "PutObjectLegalHold";
var _POLHO = "PutObjectLegalHoldOutput";
var _POLHR = "PutObjectLegalHoldRequest";
var _POO = "PutObjectOutput";
var _POR = "PutObjectRequest";
var _PORO = "PutObjectRetentionOutput";
var _PORR = "PutObjectRetentionRequest";
var _PORu = "PutObjectRetention";
var _POT = "PutObjectTagging";
var _POTO = "PutObjectTaggingOutput";
var _POTR = "PutObjectTaggingRequest";
var _PP = "PartitionedPrefix";
var _PPAB = "PutPublicAccessBlock";
var _PPABR = "PutPublicAccessBlockRequest";
var _PS = "PolicyStatus";
var _Pa = "Parts";
var _Par = "Part";
var _Parq = "Parquet";
var _Pay = "Payer";
var _Payl = "Payload";
var _Pe = "Permission";
var _Po = "Policy";
var _Pr = "Progress";
var _Pri = "Priority";
var _Pro = "Protocol";
var _Q = "Quiet";
var _QA = "QueueArn";
var _QC = "QuoteCharacter";
var _QCL = "QueueConfigurationList";
var _QCu = "QueueConfigurations";
var _QCue = "QueueConfiguration";
var _QEC = "QuoteEscapeCharacter";
var _QF = "QuoteFields";
var _Qu = "Queue";
var _R = "Rules";
var _RART = "RedirectAllRequestsTo";
var _RC = "RequestCharged";
var _RCC = "ResponseCacheControl";
var _RCD = "ResponseContentDisposition";
var _RCE = "ResponseContentEncoding";
var _RCL = "ResponseContentLanguage";
var _RCT = "ResponseContentType";
var _RCe = "ReplicationConfiguration";
var _RD = "RecordDelimiter";
var _RE = "ResponseExpires";
var _RED = "RestoreExpiryDate";
var _REe = "RecordExpiration";
var _REec = "RecordsEvent";
var _RKKID = "ReplicaKmsKeyID";
var _RKPW = "ReplaceKeyPrefixWith";
var _RKW = "ReplaceKeyWith";
var _RM = "ReplicaModifications";
var _RO = "RenameObject";
var _ROO = "RenameObjectOutput";
var _ROOe = "RestoreObjectOutput";
var _ROP = "RestoreOutputPath";
var _ROR = "RenameObjectRequest";
var _RORe = "RestoreObjectRequest";
var _ROe = "RestoreObject";
var _RP = "RequestPayer";
var _RPB = "RestrictPublicBuckets";
var _RPC = "RequestPaymentConfiguration";
var _RPe = "RequestProgress";
var _RR = "RoutingRules";
var _RRAO = "ReplicationRuleAndOperator";
var _RRF = "ReplicationRuleFilter";
var _RRe = "ReplicationRule";
var _RRep = "ReplicationRules";
var _RReq = "RequestRoute";
var _RRes = "RestoreRequest";
var _RRo = "RoutingRule";
var _RS = "ReplicationStatus";
var _RSe = "RestoreStatus";
var _RSen = "RenameSource";
var _RT = "ReplicationTime";
var _RTV = "ReplicationTimeValue";
var _RTe = "RequestToken";
var _RUD = "RetainUntilDate";
var _Ra = "Range";
var _Re = "Restore";
var _Rec = "Records";
var _Red = "Redirect";
var _Ret = "Retention";
var _Ro = "Role";
var _Ru = "Rule";
var _S = "Status";
var _SA = "StartAfter";
var _SAK = "SecretAccessKey";
var _SAs = "SseAlgorithm";
var _SB = "StreamingBlob";
var _SBD = "S3BucketDestination";
var _SC = "StorageClass";
var _SCA = "StorageClassAnalysis";
var _SCADE = "StorageClassAnalysisDataExport";
var _SCV = "SessionCredentialValue";
var _SCe = "SessionCredentials";
var _SCt = "StatusCode";
var _SDV = "SkipDestinationValidation";
var _SE = "StatsEvent";
var _SIM = "SourceIfMatch";
var _SIMS = "SourceIfModifiedSince";
var _SINM = "SourceIfNoneMatch";
var _SIUS = "SourceIfUnmodifiedSince";
var _SK = "SSE-KMS";
var _SKEO = "SseKmsEncryptedObjects";
var _SKF = "S3KeyFilter";
var _SKe = "S3Key";
var _SL = "S3Location";
var _SM = "SessionMode";
var _SOC = "SelectObjectContent";
var _SOCES = "SelectObjectContentEventStream";
var _SOCO = "SelectObjectContentOutput";
var _SOCR = "SelectObjectContentRequest";
var _SP = "SelectParameters";
var _SPi = "SimplePrefix";
var _SR = "ScanRange";
var _SS = "SSE-S3";
var _SSC = "SourceSelectionCriteria";
var _SSE = "ServerSideEncryption";
var _SSEA = "SSEAlgorithm";
var _SSEBD = "ServerSideEncryptionByDefault";
var _SSEC = "ServerSideEncryptionConfiguration";
var _SSECA = "SSECustomerAlgorithm";
var _SSECK = "SSECustomerKey";
var _SSECKMD = "SSECustomerKeyMD5";
var _SSEKMS = "SSEKMS";
var _SSEKMSEC = "SSEKMSEncryptionContext";
var _SSEKMSKI = "SSEKMSKeyId";
var _SSER = "ServerSideEncryptionRule";
var _SSERe = "ServerSideEncryptionRules";
var _SSES = "SSES3";
var _ST = "SessionToken";
var _STD = "S3TablesDestination";
var _STDR = "S3TablesDestinationResult";
var _S_ = "S3";
var _Sc = "Schedule";
var _Si = "Size";
var _St = "Start";
var _Sta = "Stats";
var _Su = "Suffix";
var _T = "Tags";
var _TA = "TableArn";
var _TAo = "TopicArn";
var _TB = "TargetBucket";
var _TBA = "TableBucketArn";
var _TBT = "TableBucketType";
var _TC = "TagCount";
var _TCL = "TopicConfigurationList";
var _TCo = "TopicConfigurations";
var _TCop = "TopicConfiguration";
var _TD = "TaggingDirective";
var _TDMOS = "TransitionDefaultMinimumObjectSize";
var _TG = "TargetGrants";
var _TGa = "TargetGrant";
var _TL = "TieringList";
var _TLr = "TransitionList";
var _TMP = "TooManyParts";
var _TN = "TableNamespace";
var _TNa = "TableName";
var _TOKF = "TargetObjectKeyFormat";
var _TP = "TargetPrefix";
var _TPC = "TotalPartsCount";
var _TS = "TagSet";
var _TSa = "TableStatus";
var _Ta = "Tag";
var _Tag = "Tagging";
var _Ti = "Tier";
var _Tie = "Tierings";
var _Tier = "Tiering";
var _Tim = "Time";
var _To = "Token";
var _Top = "Topic";
var _Tr = "Transitions";
var _Tra = "Transition";
var _Ty = "Type";
var _U = "Uploads";
var _UBMITC = "UpdateBucketMetadataInventoryTableConfiguration";
var _UBMITCR = "UpdateBucketMetadataInventoryTableConfigurationRequest";
var _UBMJTC = "UpdateBucketMetadataJournalTableConfiguration";
var _UBMJTCR = "UpdateBucketMetadataJournalTableConfigurationRequest";
var _UI = "UploadId";
var _UIM = "UploadIdMarker";
var _UM = "UserMetadata";
var _UP = "UploadPart";
var _UPC = "UploadPartCopy";
var _UPCO = "UploadPartCopyOutput";
var _UPCR = "UploadPartCopyRequest";
var _UPO = "UploadPartOutput";
var _UPR = "UploadPartRequest";
var _URI = "URI";
var _Up = "Upload";
var _V = "Value";
var _VC = "VersioningConfiguration";
var _VI = "VersionId";
var _VIM = "VersionIdMarker";
var _Ve = "Versions";
var _Ver = "Version";
var _WC = "WebsiteConfiguration";
var _WGOR = "WriteGetObjectResponse";
var _WGORR = "WriteGetObjectResponseRequest";
var _WOB = "WriteOffsetBytes";
var _WRL = "WebsiteRedirectLocation";
var _Y = "Years";
var _ar = "accept-ranges";
var _br = "bucket-region";
var _c = "client";
var _ct = "continuation-token";
var _d = "delimiter";
var _e2 = "error";
var _eP = "eventPayload";
var _en = "endpoint";
var _et = "encoding-type";
var _fo = "fetch-owner";
var _h = "http";
var _hE = "httpError";
var _hH = "httpHeader";
var _hL = "hostLabel";
var _hP = "httpPayload";
var _hPH = "httpPrefixHeaders";
var _hQ = "httpQuery";
var _hi = "http://www.w3.org/2001/XMLSchema-instance";
var _i = "id";
var _iT = "idempotencyToken";
var _km = "key-marker";
var _m = "marker";
var _mb = "max-buckets";
var _mdb = "max-directory-buckets";
var _mk = "max-keys";
var _mp = "max-parts";
var _mu = "max-uploads";
var _p = "prefix";
var _pN = "partNumber";
var _pnm = "part-number-marker";
var _rcc = "response-cache-control";
var _rcd = "response-content-disposition";
var _rce = "response-content-encoding";
var _rcl = "response-content-language";
var _rct = "response-content-type";
var _re = "response-expires";
var _s2 = "streaming";
var _sa = "start-after";
var _sm = "smithy.ts.sdk.synthetic.com.amazonaws.s3";
var _uI = "uploadId";
var _uim = "upload-id-marker";
var _vI = "versionId";
var _vim = "version-id-marker";
var _x = "xsi";
var _xA = "xmlAttribute";
var _xF = "xmlFlattened";
var _xN = "xmlName";
var _xNm = "xmlNamespace";
var _xaa = "x-amz-acl";
var _xaad = "x-amz-abort-date";
var _xaapa = "x-amz-access-point-alias";
var _xaari = "x-amz-abort-rule-id";
var _xaas = "x-amz-archive-status";
var _xaba = "x-amz-bucket-arn";
var _xabgr = "x-amz-bypass-governance-retention";
var _xabln = "x-amz-bucket-location-name";
var _xablt = "x-amz-bucket-location-type";
var _xabole = "x-amz-bucket-object-lock-enabled";
var _xabolt = "x-amz-bucket-object-lock-token";
var _xabr = "x-amz-bucket-region";
var _xaca = "x-amz-checksum-algorithm";
var _xacc = "x-amz-checksum-crc32";
var _xacc_ = "x-amz-checksum-crc32c";
var _xacc__ = "x-amz-checksum-crc64nvme";
var _xacm = "x-amz-checksum-mode";
var _xacrsba = "x-amz-confirm-remove-self-bucket-access";
var _xacs = "x-amz-checksum-sha1";
var _xacs_ = "x-amz-checksum-sha256";
var _xacs__ = "x-amz-copy-source";
var _xacsim = "x-amz-copy-source-if-match";
var _xacsims = "x-amz-copy-source-if-modified-since";
var _xacsinm = "x-amz-copy-source-if-none-match";
var _xacsius = "x-amz-copy-source-if-unmodified-since";
var _xacsm = "x-amz-create-session-mode";
var _xacsr = "x-amz-copy-source-range";
var _xacssseca = "x-amz-copy-source-server-side-encryption-customer-algorithm";
var _xacssseck = "x-amz-copy-source-server-side-encryption-customer-key";
var _xacssseckM = "x-amz-copy-source-server-side-encryption-customer-key-MD5";
var _xacsvi = "x-amz-copy-source-version-id";
var _xact = "x-amz-checksum-type";
var _xact_ = "x-amz-client-token";
var _xadm = "x-amz-delete-marker";
var _xae = "x-amz-expiration";
var _xaebo = "x-amz-expected-bucket-owner";
var _xafec = "x-amz-fwd-error-code";
var _xafem = "x-amz-fwd-error-message";
var _xafhCC = "x-amz-fwd-header-Cache-Control";
var _xafhCD = "x-amz-fwd-header-Content-Disposition";
var _xafhCE = "x-amz-fwd-header-Content-Encoding";
var _xafhCL = "x-amz-fwd-header-Content-Language";
var _xafhCR = "x-amz-fwd-header-Content-Range";
var _xafhCT = "x-amz-fwd-header-Content-Type";
var _xafhE = "x-amz-fwd-header-ETag";
var _xafhE_ = "x-amz-fwd-header-Expires";
var _xafhLM = "x-amz-fwd-header-Last-Modified";
var _xafhar = "x-amz-fwd-header-accept-ranges";
var _xafhxacc = "x-amz-fwd-header-x-amz-checksum-crc32";
var _xafhxacc_ = "x-amz-fwd-header-x-amz-checksum-crc32c";
var _xafhxacc__ = "x-amz-fwd-header-x-amz-checksum-crc64nvme";
var _xafhxacs = "x-amz-fwd-header-x-amz-checksum-sha1";
var _xafhxacs_ = "x-amz-fwd-header-x-amz-checksum-sha256";
var _xafhxadm = "x-amz-fwd-header-x-amz-delete-marker";
var _xafhxae = "x-amz-fwd-header-x-amz-expiration";
var _xafhxamm = "x-amz-fwd-header-x-amz-missing-meta";
var _xafhxampc = "x-amz-fwd-header-x-amz-mp-parts-count";
var _xafhxaollh = "x-amz-fwd-header-x-amz-object-lock-legal-hold";
var _xafhxaolm = "x-amz-fwd-header-x-amz-object-lock-mode";
var _xafhxaolrud = "x-amz-fwd-header-x-amz-object-lock-retain-until-date";
var _xafhxar = "x-amz-fwd-header-x-amz-restore";
var _xafhxarc = "x-amz-fwd-header-x-amz-request-charged";
var _xafhxars = "x-amz-fwd-header-x-amz-replication-status";
var _xafhxasc = "x-amz-fwd-header-x-amz-storage-class";
var _xafhxasse = "x-amz-fwd-header-x-amz-server-side-encryption";
var _xafhxasseakki = "x-amz-fwd-header-x-amz-server-side-encryption-aws-kms-key-id";
var _xafhxassebke = "x-amz-fwd-header-x-amz-server-side-encryption-bucket-key-enabled";
var _xafhxasseca = "x-amz-fwd-header-x-amz-server-side-encryption-customer-algorithm";
var _xafhxasseckM = "x-amz-fwd-header-x-amz-server-side-encryption-customer-key-MD5";
var _xafhxatc = "x-amz-fwd-header-x-amz-tagging-count";
var _xafhxavi = "x-amz-fwd-header-x-amz-version-id";
var _xafs = "x-amz-fwd-status";
var _xagfc = "x-amz-grant-full-control";
var _xagr = "x-amz-grant-read";
var _xagra = "x-amz-grant-read-acp";
var _xagw = "x-amz-grant-write";
var _xagwa = "x-amz-grant-write-acp";
var _xaimit = "x-amz-if-match-initiated-time";
var _xaimlmt = "x-amz-if-match-last-modified-time";
var _xaims = "x-amz-if-match-size";
var _xam = "x-amz-meta-";
var _xam_ = "x-amz-mfa";
var _xamd = "x-amz-metadata-directive";
var _xamm = "x-amz-missing-meta";
var _xamos = "x-amz-mp-object-size";
var _xamp = "x-amz-max-parts";
var _xampc = "x-amz-mp-parts-count";
var _xaoa = "x-amz-object-attributes";
var _xaollh = "x-amz-object-lock-legal-hold";
var _xaolm = "x-amz-object-lock-mode";
var _xaolrud = "x-amz-object-lock-retain-until-date";
var _xaoo = "x-amz-object-ownership";
var _xaooa = "x-amz-optional-object-attributes";
var _xaos = "x-amz-object-size";
var _xapnm = "x-amz-part-number-marker";
var _xar = "x-amz-restore";
var _xarc = "x-amz-request-charged";
var _xarop = "x-amz-restore-output-path";
var _xarp = "x-amz-request-payer";
var _xarr = "x-amz-request-route";
var _xars = "x-amz-replication-status";
var _xars_ = "x-amz-rename-source";
var _xarsim = "x-amz-rename-source-if-match";
var _xarsims = "x-amz-rename-source-if-modified-since";
var _xarsinm = "x-amz-rename-source-if-none-match";
var _xarsius = "x-amz-rename-source-if-unmodified-since";
var _xart = "x-amz-request-token";
var _xasc = "x-amz-storage-class";
var _xasca = "x-amz-sdk-checksum-algorithm";
var _xasdv = "x-amz-skip-destination-validation";
var _xasebo = "x-amz-source-expected-bucket-owner";
var _xasse = "x-amz-server-side-encryption";
var _xasseakki = "x-amz-server-side-encryption-aws-kms-key-id";
var _xassebke = "x-amz-server-side-encryption-bucket-key-enabled";
var _xassec = "x-amz-server-side-encryption-context";
var _xasseca = "x-amz-server-side-encryption-customer-algorithm";
var _xasseck = "x-amz-server-side-encryption-customer-key";
var _xasseckM = "x-amz-server-side-encryption-customer-key-MD5";
var _xat = "x-amz-tagging";
var _xatc = "x-amz-tagging-count";
var _xatd = "x-amz-tagging-directive";
var _xatdmos = "x-amz-transition-default-minimum-object-size";
var _xavi = "x-amz-version-id";
var _xawob = "x-amz-write-offset-bytes";
var _xawrl = "x-amz-website-redirect-location";
var _xs = "xsi:type";
var n0 = "com.amazonaws.s3";
var CopySourceSSECustomerKey = [0, n0, _CSSSECK, 8, 0];
var SessionCredentialValue = [0, n0, _SCV, 8, 0];
var SSECustomerKey = [0, n0, _SSECK, 8, 0];
var SSEKMSEncryptionContext = [0, n0, _SSEKMSEC, 8, 0];
var SSEKMSKeyId = [0, n0, _SSEKMSKI, 8, 0];
var StreamingBlob = [
  0,
  n0,
  _SB,
  {
    [_s2]: 1
  },
  42
];
var AbortIncompleteMultipartUpload = [3, n0, _AIMU, 0, [_DAI], [1]];
var AbortMultipartUploadOutput = [
  3,
  n0,
  _AMUO,
  0,
  [_RC],
  [
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var AbortMultipartUploadRequest = [
  3,
  n0,
  _AMUR,
  0,
  [_B, _K, _UI, _RP, _EBO, _IMIT],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hQ]: _uI
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      6,
      {
        [_hH]: _xaimit
      }
    ]
  ]
];
var AccelerateConfiguration = [3, n0, _AC, 0, [_S], [0]];
var AccessControlPolicy = [
  3,
  n0,
  _ACP,
  0,
  [_G, _O],
  [
    [
      () => Grants,
      {
        [_xN]: _ACL
      }
    ],
    () => Owner
  ]
];
var AccessControlTranslation = [3, n0, _ACT, 0, [_O], [0]];
var AnalyticsAndOperator = [
  3,
  n0,
  _AAO,
  0,
  [_P, _T],
  [
    0,
    [
      () => TagSet,
      {
        [_xN]: _Ta,
        [_xF]: 1
      }
    ]
  ]
];
var AnalyticsConfiguration = [
  3,
  n0,
  _ACn,
  0,
  [_I, _F, _SCA],
  [0, [() => AnalyticsFilter, 0], () => StorageClassAnalysis]
];
var AnalyticsExportDestination = [
  3,
  n0,
  _AED,
  0,
  [_SBD],
  [() => AnalyticsS3BucketDestination]
];
var AnalyticsS3BucketDestination = [3, n0, _ASBD, 0, [_Fo, _BAI, _B, _P], [0, 0, 0, 0]];
var Bucket = [3, n0, _B, 0, [_N, _CD, _BR, _BA], [0, 4, 0, 0]];
var BucketAlreadyExists2 = [
  -3,
  n0,
  _BAE,
  {
    [_e2]: _c,
    [_hE]: 409
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(BucketAlreadyExists2, BucketAlreadyExists);
var BucketAlreadyOwnedByYou2 = [
  -3,
  n0,
  _BAOBY,
  {
    [_e2]: _c,
    [_hE]: 409
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(BucketAlreadyOwnedByYou2, BucketAlreadyOwnedByYou);
var BucketInfo = [3, n0, _BI, 0, [_DR, _Ty], [0, 0]];
var BucketLifecycleConfiguration = [
  3,
  n0,
  _BLC,
  0,
  [_R],
  [
    [
      () => LifecycleRules,
      {
        [_xN]: _Ru,
        [_xF]: 1
      }
    ]
  ]
];
var BucketLoggingStatus = [3, n0, _BLS, 0, [_LE], [[() => LoggingEnabled, 0]]];
var Checksum = [
  3,
  n0,
  _C,
  0,
  [_CCRC, _CCRCC, _CCRCNVME, _CSHA, _CSHAh, _CT],
  [0, 0, 0, 0, 0, 0]
];
var CommonPrefix = [3, n0, _CP, 0, [_P], [0]];
var CompletedMultipartUpload = [
  3,
  n0,
  _CMU,
  0,
  [_Pa],
  [
    [
      () => CompletedPartList,
      {
        [_xN]: _Par,
        [_xF]: 1
      }
    ]
  ]
];
var CompletedPart = [
  3,
  n0,
  _CPo,
  0,
  [_ET, _CCRC, _CCRCC, _CCRCNVME, _CSHA, _CSHAh, _PN],
  [0, 0, 0, 0, 0, 0, 1]
];
var CompleteMultipartUploadOutput = [
  3,
  n0,
  _CMUO,
  {
    [_xN]: _CMUR
  },
  [_L, _B, _K, _E, _ET, _CCRC, _CCRCC, _CCRCNVME, _CSHA, _CSHAh, _CT, _SSE, _VI, _SSEKMSKI, _BKE, _RC],
  [
    0,
    0,
    0,
    [
      0,
      {
        [_hH]: _xae
      }
    ],
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      0,
      {
        [_hH]: _xavi
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var CompleteMultipartUploadRequest = [
  3,
  n0,
  _CMURo,
  0,
  [
    _B,
    _K,
    _MU,
    _UI,
    _CCRC,
    _CCRCC,
    _CCRCNVME,
    _CSHA,
    _CSHAh,
    _CT,
    _MOS,
    _RP,
    _EBO,
    _IM,
    _INM,
    _SSECA,
    _SSECK,
    _SSECKMD
  ],
  [
    [0, 1],
    [0, 1],
    [
      () => CompletedMultipartUpload,
      {
        [_xN]: _CMUo,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hQ]: _uI
      }
    ],
    [
      0,
      {
        [_hH]: _xacc
      }
    ],
    [
      0,
      {
        [_hH]: _xacc_
      }
    ],
    [
      0,
      {
        [_hH]: _xacc__
      }
    ],
    [
      0,
      {
        [_hH]: _xacs
      }
    ],
    [
      0,
      {
        [_hH]: _xacs_
      }
    ],
    [
      0,
      {
        [_hH]: _xact
      }
    ],
    [
      1,
      {
        [_hH]: _xamos
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _IM_
      }
    ],
    [
      0,
      {
        [_hH]: _INM_
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ]
  ]
];
var Condition = [3, n0, _Co, 0, [_HECRE, _KPE], [0, 0]];
var ContinuationEvent = [3, n0, _CE, 0, [], []];
var CopyObjectOutput = [
  3,
  n0,
  _COO,
  0,
  [_COR, _E, _CSVI, _VI, _SSE, _SSECA, _SSECKMD, _SSEKMSKI, _SSEKMSEC, _BKE, _RC],
  [
    [() => CopyObjectResult, 16],
    [
      0,
      {
        [_hH]: _xae
      }
    ],
    [
      0,
      {
        [_hH]: _xacsvi
      }
    ],
    [
      0,
      {
        [_hH]: _xavi
      }
    ],
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      () => SSEKMSEncryptionContext,
      {
        [_hH]: _xassec
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var CopyObjectRequest = [
  3,
  n0,
  _CORo,
  0,
  [
    _ACL_,
    _B,
    _CC,
    _CA,
    _CDo,
    _CEo,
    _CL,
    _CTo,
    _CS,
    _CSIM,
    _CSIMS,
    _CSINM,
    _CSIUS,
    _Ex,
    _GFC,
    _GR,
    _GRACP,
    _GWACP,
    _IM,
    _INM,
    _K,
    _M,
    _MD,
    _TD,
    _SSE,
    _SC,
    _WRL,
    _SSECA,
    _SSECK,
    _SSECKMD,
    _SSEKMSKI,
    _SSEKMSEC,
    _BKE,
    _CSSSECA,
    _CSSSECK,
    _CSSSECKMD,
    _RP,
    _Tag,
    _OLM,
    _OLRUD,
    _OLLHS,
    _EBO,
    _ESBO
  ],
  [
    [
      0,
      {
        [_hH]: _xaa
      }
    ],
    [0, 1],
    [
      0,
      {
        [_hH]: _CC_
      }
    ],
    [
      0,
      {
        [_hH]: _xaca
      }
    ],
    [
      0,
      {
        [_hH]: _CD_
      }
    ],
    [
      0,
      {
        [_hH]: _CE_
      }
    ],
    [
      0,
      {
        [_hH]: _CL_
      }
    ],
    [
      0,
      {
        [_hH]: _CT_
      }
    ],
    [
      0,
      {
        [_hH]: _xacs__
      }
    ],
    [
      0,
      {
        [_hH]: _xacsim
      }
    ],
    [
      4,
      {
        [_hH]: _xacsims
      }
    ],
    [
      0,
      {
        [_hH]: _xacsinm
      }
    ],
    [
      4,
      {
        [_hH]: _xacsius
      }
    ],
    [
      4,
      {
        [_hH]: _Ex
      }
    ],
    [
      0,
      {
        [_hH]: _xagfc
      }
    ],
    [
      0,
      {
        [_hH]: _xagr
      }
    ],
    [
      0,
      {
        [_hH]: _xagra
      }
    ],
    [
      0,
      {
        [_hH]: _xagwa
      }
    ],
    [
      0,
      {
        [_hH]: _IM_
      }
    ],
    [
      0,
      {
        [_hH]: _INM_
      }
    ],
    [0, 1],
    [
      128 | 0,
      {
        [_hPH]: _xam
      }
    ],
    [
      0,
      {
        [_hH]: _xamd
      }
    ],
    [
      0,
      {
        [_hH]: _xatd
      }
    ],
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      0,
      {
        [_hH]: _xasc
      }
    ],
    [
      0,
      {
        [_hH]: _xawrl
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      () => SSEKMSEncryptionContext,
      {
        [_hH]: _xassec
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      0,
      {
        [_hH]: _xacssseca
      }
    ],
    [
      () => CopySourceSSECustomerKey,
      {
        [_hH]: _xacssseck
      }
    ],
    [
      0,
      {
        [_hH]: _xacssseckM
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xat
      }
    ],
    [
      0,
      {
        [_hH]: _xaolm
      }
    ],
    [
      5,
      {
        [_hH]: _xaolrud
      }
    ],
    [
      0,
      {
        [_hH]: _xaollh
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xasebo
      }
    ]
  ]
];
var CopyObjectResult = [
  3,
  n0,
  _COR,
  0,
  [_ET, _LM, _CT, _CCRC, _CCRCC, _CCRCNVME, _CSHA, _CSHAh],
  [0, 4, 0, 0, 0, 0, 0, 0]
];
var CopyPartResult = [
  3,
  n0,
  _CPR,
  0,
  [_ET, _LM, _CCRC, _CCRCC, _CCRCNVME, _CSHA, _CSHAh],
  [0, 4, 0, 0, 0, 0, 0]
];
var CORSConfiguration = [
  3,
  n0,
  _CORSC,
  0,
  [_CORSR],
  [
    [
      () => CORSRules,
      {
        [_xN]: _CORSRu,
        [_xF]: 1
      }
    ]
  ]
];
var CORSRule = [
  3,
  n0,
  _CORSRu,
  0,
  [_ID, _AH, _AM, _AO, _EH, _MAS],
  [
    0,
    [
      64 | 0,
      {
        [_xN]: _AHl,
        [_xF]: 1
      }
    ],
    [
      64 | 0,
      {
        [_xN]: _AMl,
        [_xF]: 1
      }
    ],
    [
      64 | 0,
      {
        [_xN]: _AOl,
        [_xF]: 1
      }
    ],
    [
      64 | 0,
      {
        [_xN]: _EHx,
        [_xF]: 1
      }
    ],
    1
  ]
];
var CreateBucketConfiguration = [
  3,
  n0,
  _CBC,
  0,
  [_LC, _L, _B, _T],
  [0, () => LocationInfo, () => BucketInfo, [() => TagSet, 0]]
];
var CreateBucketMetadataConfigurationRequest = [
  3,
  n0,
  _CBMCR,
  0,
  [_B, _CMD, _CA, _MC, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => MetadataConfiguration,
      {
        [_xN]: _MC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var CreateBucketMetadataTableConfigurationRequest = [
  3,
  n0,
  _CBMTCR,
  0,
  [_B, _CMD, _CA, _MTC, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => MetadataTableConfiguration,
      {
        [_xN]: _MTC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var CreateBucketOutput = [
  3,
  n0,
  _CBO,
  0,
  [_L, _BA],
  [
    [
      0,
      {
        [_hH]: _L
      }
    ],
    [
      0,
      {
        [_hH]: _xaba
      }
    ]
  ]
];
var CreateBucketRequest = [
  3,
  n0,
  _CBR,
  0,
  [_ACL_, _B, _CBC, _GFC, _GR, _GRACP, _GW, _GWACP, _OLEFB, _OO],
  [
    [
      0,
      {
        [_hH]: _xaa
      }
    ],
    [0, 1],
    [
      () => CreateBucketConfiguration,
      {
        [_xN]: _CBC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xagfc
      }
    ],
    [
      0,
      {
        [_hH]: _xagr
      }
    ],
    [
      0,
      {
        [_hH]: _xagra
      }
    ],
    [
      0,
      {
        [_hH]: _xagw
      }
    ],
    [
      0,
      {
        [_hH]: _xagwa
      }
    ],
    [
      2,
      {
        [_hH]: _xabole
      }
    ],
    [
      0,
      {
        [_hH]: _xaoo
      }
    ]
  ]
];
var CreateMultipartUploadOutput = [
  3,
  n0,
  _CMUOr,
  {
    [_xN]: _IMUR
  },
  [_AD, _ARI, _B, _K, _UI, _SSE, _SSECA, _SSECKMD, _SSEKMSKI, _SSEKMSEC, _BKE, _RC, _CA, _CT],
  [
    [
      4,
      {
        [_hH]: _xaad
      }
    ],
    [
      0,
      {
        [_hH]: _xaari
      }
    ],
    [
      0,
      {
        [_xN]: _B
      }
    ],
    0,
    0,
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      () => SSEKMSEncryptionContext,
      {
        [_hH]: _xassec
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ],
    [
      0,
      {
        [_hH]: _xaca
      }
    ],
    [
      0,
      {
        [_hH]: _xact
      }
    ]
  ]
];
var CreateMultipartUploadRequest = [
  3,
  n0,
  _CMURr,
  0,
  [
    _ACL_,
    _B,
    _CC,
    _CDo,
    _CEo,
    _CL,
    _CTo,
    _Ex,
    _GFC,
    _GR,
    _GRACP,
    _GWACP,
    _K,
    _M,
    _SSE,
    _SC,
    _WRL,
    _SSECA,
    _SSECK,
    _SSECKMD,
    _SSEKMSKI,
    _SSEKMSEC,
    _BKE,
    _RP,
    _Tag,
    _OLM,
    _OLRUD,
    _OLLHS,
    _EBO,
    _CA,
    _CT
  ],
  [
    [
      0,
      {
        [_hH]: _xaa
      }
    ],
    [0, 1],
    [
      0,
      {
        [_hH]: _CC_
      }
    ],
    [
      0,
      {
        [_hH]: _CD_
      }
    ],
    [
      0,
      {
        [_hH]: _CE_
      }
    ],
    [
      0,
      {
        [_hH]: _CL_
      }
    ],
    [
      0,
      {
        [_hH]: _CT_
      }
    ],
    [
      4,
      {
        [_hH]: _Ex
      }
    ],
    [
      0,
      {
        [_hH]: _xagfc
      }
    ],
    [
      0,
      {
        [_hH]: _xagr
      }
    ],
    [
      0,
      {
        [_hH]: _xagra
      }
    ],
    [
      0,
      {
        [_hH]: _xagwa
      }
    ],
    [0, 1],
    [
      128 | 0,
      {
        [_hPH]: _xam
      }
    ],
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      0,
      {
        [_hH]: _xasc
      }
    ],
    [
      0,
      {
        [_hH]: _xawrl
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      () => SSEKMSEncryptionContext,
      {
        [_hH]: _xassec
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xat
      }
    ],
    [
      0,
      {
        [_hH]: _xaolm
      }
    ],
    [
      5,
      {
        [_hH]: _xaolrud
      }
    ],
    [
      0,
      {
        [_hH]: _xaollh
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xaca
      }
    ],
    [
      0,
      {
        [_hH]: _xact
      }
    ]
  ]
];
var CreateSessionOutput = [
  3,
  n0,
  _CSO,
  {
    [_xN]: _CSR
  },
  [_SSE, _SSEKMSKI, _SSEKMSEC, _BKE, _Cr],
  [
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      () => SSEKMSEncryptionContext,
      {
        [_hH]: _xassec
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      () => SessionCredentials,
      {
        [_xN]: _Cr
      }
    ]
  ]
];
var CreateSessionRequest = [
  3,
  n0,
  _CSRr,
  0,
  [_SM, _B, _SSE, _SSEKMSKI, _SSEKMSEC, _BKE],
  [
    [
      0,
      {
        [_hH]: _xacsm
      }
    ],
    [0, 1],
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      () => SSEKMSEncryptionContext,
      {
        [_hH]: _xassec
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ]
  ]
];
var CSVInput = [
  3,
  n0,
  _CSVIn,
  0,
  [_FHI, _Com, _QEC, _RD, _FD, _QC, _AQRD],
  [0, 0, 0, 0, 0, 0, 2]
];
var CSVOutput = [3, n0, _CSVO, 0, [_QF, _QEC, _RD, _FD, _QC], [0, 0, 0, 0, 0]];
var DefaultRetention = [3, n0, _DRe, 0, [_Mo, _D, _Y], [0, 1, 1]];
var Delete = [
  3,
  n0,
  _De,
  0,
  [_Ob, _Q],
  [
    [
      () => ObjectIdentifierList,
      {
        [_xN]: _Obj,
        [_xF]: 1
      }
    ],
    2
  ]
];
var DeleteBucketAnalyticsConfigurationRequest = [
  3,
  n0,
  _DBACR,
  0,
  [_B, _I, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketCorsRequest = [
  3,
  n0,
  _DBCR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketEncryptionRequest = [
  3,
  n0,
  _DBER,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketIntelligentTieringConfigurationRequest = [
  3,
  n0,
  _DBITCR,
  0,
  [_B, _I, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketInventoryConfigurationRequest = [
  3,
  n0,
  _DBICR,
  0,
  [_B, _I, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketLifecycleRequest = [
  3,
  n0,
  _DBLR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketMetadataConfigurationRequest = [
  3,
  n0,
  _DBMCR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketMetadataTableConfigurationRequest = [
  3,
  n0,
  _DBMTCR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketMetricsConfigurationRequest = [
  3,
  n0,
  _DBMCRe,
  0,
  [_B, _I, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketOwnershipControlsRequest = [
  3,
  n0,
  _DBOCR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketPolicyRequest = [
  3,
  n0,
  _DBPR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketReplicationRequest = [
  3,
  n0,
  _DBRR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketRequest = [
  3,
  n0,
  _DBR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketTaggingRequest = [
  3,
  n0,
  _DBTR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeleteBucketWebsiteRequest = [
  3,
  n0,
  _DBWR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeletedObject = [3, n0, _DO, 0, [_K, _VI, _DM, _DMVI], [0, 0, 2, 0]];
var DeleteMarkerEntry = [
  3,
  n0,
  _DME,
  0,
  [_O, _K, _VI, _IL, _LM],
  [() => Owner, 0, 0, 2, 4]
];
var DeleteMarkerReplication = [3, n0, _DMR, 0, [_S], [0]];
var DeleteObjectOutput = [
  3,
  n0,
  _DOO,
  0,
  [_DM, _VI, _RC],
  [
    [
      2,
      {
        [_hH]: _xadm
      }
    ],
    [
      0,
      {
        [_hH]: _xavi
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var DeleteObjectRequest = [
  3,
  n0,
  _DOR,
  0,
  [_B, _K, _MFA, _VI, _RP, _BGR, _EBO, _IM, _IMLMT, _IMS],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hH]: _xam_
      }
    ],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      2,
      {
        [_hH]: _xabgr
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _IM_
      }
    ],
    [
      6,
      {
        [_hH]: _xaimlmt
      }
    ],
    [
      1,
      {
        [_hH]: _xaims
      }
    ]
  ]
];
var DeleteObjectsOutput = [
  3,
  n0,
  _DOOe,
  {
    [_xN]: _DRel
  },
  [_Del, _RC, _Er],
  [
    [
      () => DeletedObjects,
      {
        [_xF]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ],
    [
      () => Errors,
      {
        [_xN]: _Err,
        [_xF]: 1
      }
    ]
  ]
];
var DeleteObjectsRequest = [
  3,
  n0,
  _DORe,
  0,
  [_B, _De, _MFA, _RP, _BGR, _EBO, _CA],
  [
    [0, 1],
    [
      () => Delete,
      {
        [_xN]: _De,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xam_
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      2,
      {
        [_hH]: _xabgr
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ]
  ]
];
var DeleteObjectTaggingOutput = [
  3,
  n0,
  _DOTO,
  0,
  [_VI],
  [
    [
      0,
      {
        [_hH]: _xavi
      }
    ]
  ]
];
var DeleteObjectTaggingRequest = [
  3,
  n0,
  _DOTR,
  0,
  [_B, _K, _VI, _EBO],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var DeletePublicAccessBlockRequest = [
  3,
  n0,
  _DPABR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var Destination = [
  3,
  n0,
  _Des,
  0,
  [_B, _A, _SC, _ACT, _EC, _RT, _Me],
  [0, 0, 0, () => AccessControlTranslation, () => EncryptionConfiguration, () => ReplicationTime, () => Metrics]
];
var DestinationResult = [3, n0, _DRes, 0, [_TBT, _TBA, _TN], [0, 0, 0]];
var Encryption = [3, n0, _En, 0, [_ETn, _KMSKI, _KMSC], [0, [() => SSEKMSKeyId, 0], 0]];
var EncryptionConfiguration = [3, n0, _EC, 0, [_RKKID], [0]];
var EncryptionTypeMismatch2 = [
  -3,
  n0,
  _ETM,
  {
    [_e2]: _c,
    [_hE]: 400
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(EncryptionTypeMismatch2, EncryptionTypeMismatch);
var EndEvent = [3, n0, _EE, 0, [], []];
var _Error = [3, n0, _Err, 0, [_K, _VI, _Cod, _Mes], [0, 0, 0, 0]];
var ErrorDetails = [3, n0, _ED, 0, [_ECr, _EM], [0, 0]];
var ErrorDocument = [3, n0, _EDr, 0, [_K], [0]];
var EventBridgeConfiguration = [3, n0, _EBC, 0, [], []];
var ExistingObjectReplication = [3, n0, _EOR, 0, [_S], [0]];
var FilterRule = [3, n0, _FR, 0, [_N, _V], [0, 0]];
var GetBucketAccelerateConfigurationOutput = [
  3,
  n0,
  _GBACO,
  {
    [_xN]: _AC
  },
  [_S, _RC],
  [
    0,
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var GetBucketAccelerateConfigurationRequest = [
  3,
  n0,
  _GBACR,
  0,
  [_B, _EBO, _RP],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ]
  ]
];
var GetBucketAclOutput = [
  3,
  n0,
  _GBAO,
  {
    [_xN]: _ACP
  },
  [_O, _G],
  [
    () => Owner,
    [
      () => Grants,
      {
        [_xN]: _ACL
      }
    ]
  ]
];
var GetBucketAclRequest = [
  3,
  n0,
  _GBAR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketAnalyticsConfigurationOutput = [
  3,
  n0,
  _GBACOe,
  0,
  [_ACn],
  [[() => AnalyticsConfiguration, 16]]
];
var GetBucketAnalyticsConfigurationRequest = [
  3,
  n0,
  _GBACRe,
  0,
  [_B, _I, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketCorsOutput = [
  3,
  n0,
  _GBCO,
  {
    [_xN]: _CORSC
  },
  [_CORSR],
  [
    [
      () => CORSRules,
      {
        [_xN]: _CORSRu,
        [_xF]: 1
      }
    ]
  ]
];
var GetBucketCorsRequest = [
  3,
  n0,
  _GBCR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketEncryptionOutput = [
  3,
  n0,
  _GBEO,
  0,
  [_SSEC],
  [[() => ServerSideEncryptionConfiguration, 16]]
];
var GetBucketEncryptionRequest = [
  3,
  n0,
  _GBER,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketIntelligentTieringConfigurationOutput = [
  3,
  n0,
  _GBITCO,
  0,
  [_ITC],
  [[() => IntelligentTieringConfiguration, 16]]
];
var GetBucketIntelligentTieringConfigurationRequest = [
  3,
  n0,
  _GBITCR,
  0,
  [_B, _I, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketInventoryConfigurationOutput = [
  3,
  n0,
  _GBICO,
  0,
  [_IC],
  [[() => InventoryConfiguration, 16]]
];
var GetBucketInventoryConfigurationRequest = [
  3,
  n0,
  _GBICR,
  0,
  [_B, _I, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketLifecycleConfigurationOutput = [
  3,
  n0,
  _GBLCO,
  {
    [_xN]: _LCi
  },
  [_R, _TDMOS],
  [
    [
      () => LifecycleRules,
      {
        [_xN]: _Ru,
        [_xF]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xatdmos
      }
    ]
  ]
];
var GetBucketLifecycleConfigurationRequest = [
  3,
  n0,
  _GBLCR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketLocationOutput = [
  3,
  n0,
  _GBLO,
  {
    [_xN]: _LC
  },
  [_LC],
  [0]
];
var GetBucketLocationRequest = [
  3,
  n0,
  _GBLR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketLoggingOutput = [
  3,
  n0,
  _GBLOe,
  {
    [_xN]: _BLS
  },
  [_LE],
  [[() => LoggingEnabled, 0]]
];
var GetBucketLoggingRequest = [
  3,
  n0,
  _GBLRe,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketMetadataConfigurationOutput = [
  3,
  n0,
  _GBMCO,
  0,
  [_GBMCR],
  [[() => GetBucketMetadataConfigurationResult, 16]]
];
var GetBucketMetadataConfigurationRequest = [
  3,
  n0,
  _GBMCRe,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketMetadataConfigurationResult = [
  3,
  n0,
  _GBMCR,
  0,
  [_MCR],
  [() => MetadataConfigurationResult]
];
var GetBucketMetadataTableConfigurationOutput = [
  3,
  n0,
  _GBMTCO,
  0,
  [_GBMTCR],
  [[() => GetBucketMetadataTableConfigurationResult, 16]]
];
var GetBucketMetadataTableConfigurationRequest = [
  3,
  n0,
  _GBMTCRe,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketMetadataTableConfigurationResult = [
  3,
  n0,
  _GBMTCR,
  0,
  [_MTCR, _S, _Err],
  [() => MetadataTableConfigurationResult, 0, () => ErrorDetails]
];
var GetBucketMetricsConfigurationOutput = [
  3,
  n0,
  _GBMCOe,
  0,
  [_MCe],
  [[() => MetricsConfiguration, 16]]
];
var GetBucketMetricsConfigurationRequest = [
  3,
  n0,
  _GBMCRet,
  0,
  [_B, _I, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketNotificationConfigurationRequest = [
  3,
  n0,
  _GBNCR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketOwnershipControlsOutput = [
  3,
  n0,
  _GBOCO,
  0,
  [_OC],
  [[() => OwnershipControls, 16]]
];
var GetBucketOwnershipControlsRequest = [
  3,
  n0,
  _GBOCR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketPolicyOutput = [3, n0, _GBPO, 0, [_Po], [[0, 16]]];
var GetBucketPolicyRequest = [
  3,
  n0,
  _GBPR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketPolicyStatusOutput = [3, n0, _GBPSO, 0, [_PS], [[() => PolicyStatus, 16]]];
var GetBucketPolicyStatusRequest = [
  3,
  n0,
  _GBPSR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketReplicationOutput = [
  3,
  n0,
  _GBRO,
  0,
  [_RCe],
  [[() => ReplicationConfiguration, 16]]
];
var GetBucketReplicationRequest = [
  3,
  n0,
  _GBRR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketRequestPaymentOutput = [
  3,
  n0,
  _GBRPO,
  {
    [_xN]: _RPC
  },
  [_Pay],
  [0]
];
var GetBucketRequestPaymentRequest = [
  3,
  n0,
  _GBRPR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketTaggingOutput = [
  3,
  n0,
  _GBTO,
  {
    [_xN]: _Tag
  },
  [_TS],
  [[() => TagSet, 0]]
];
var GetBucketTaggingRequest = [
  3,
  n0,
  _GBTR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketVersioningOutput = [
  3,
  n0,
  _GBVO,
  {
    [_xN]: _VC
  },
  [_S, _MFAD],
  [
    0,
    [
      0,
      {
        [_xN]: _MDf
      }
    ]
  ]
];
var GetBucketVersioningRequest = [
  3,
  n0,
  _GBVR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetBucketWebsiteOutput = [
  3,
  n0,
  _GBWO,
  {
    [_xN]: _WC
  },
  [_RART, _IDn, _EDr, _RR],
  [() => RedirectAllRequestsTo, () => IndexDocument, () => ErrorDocument, [() => RoutingRules, 0]]
];
var GetBucketWebsiteRequest = [
  3,
  n0,
  _GBWR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetObjectAclOutput = [
  3,
  n0,
  _GOAO,
  {
    [_xN]: _ACP
  },
  [_O, _G, _RC],
  [
    () => Owner,
    [
      () => Grants,
      {
        [_xN]: _ACL
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var GetObjectAclRequest = [
  3,
  n0,
  _GOAR,
  0,
  [_B, _K, _VI, _RP, _EBO],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetObjectAttributesOutput = [
  3,
  n0,
  _GOAOe,
  {
    [_xN]: _GOARe
  },
  [_DM, _LM, _VI, _RC, _ET, _C, _OP, _SC, _OS],
  [
    [
      2,
      {
        [_hH]: _xadm
      }
    ],
    [
      4,
      {
        [_hH]: _LM_
      }
    ],
    [
      0,
      {
        [_hH]: _xavi
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ],
    0,
    () => Checksum,
    [() => GetObjectAttributesParts, 0],
    0,
    1
  ]
];
var GetObjectAttributesParts = [
  3,
  n0,
  _GOAP,
  0,
  [_TPC, _PNM, _NPNM, _MP, _IT, _Pa],
  [
    [
      1,
      {
        [_xN]: _PC
      }
    ],
    0,
    0,
    1,
    2,
    [
      () => PartsList,
      {
        [_xN]: _Par,
        [_xF]: 1
      }
    ]
  ]
];
var GetObjectAttributesRequest = [
  3,
  n0,
  _GOARet,
  0,
  [_B, _K, _VI, _MP, _PNM, _SSECA, _SSECK, _SSECKMD, _RP, _EBO, _OA],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      1,
      {
        [_hH]: _xamp
      }
    ],
    [
      0,
      {
        [_hH]: _xapnm
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      64 | 0,
      {
        [_hH]: _xaoa
      }
    ]
  ]
];
var GetObjectLegalHoldOutput = [
  3,
  n0,
  _GOLHO,
  0,
  [_LH],
  [
    [
      () => ObjectLockLegalHold,
      {
        [_xN]: _LH,
        [_hP]: 1
      }
    ]
  ]
];
var GetObjectLegalHoldRequest = [
  3,
  n0,
  _GOLHR,
  0,
  [_B, _K, _VI, _RP, _EBO],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetObjectLockConfigurationOutput = [
  3,
  n0,
  _GOLCO,
  0,
  [_OLC],
  [[() => ObjectLockConfiguration, 16]]
];
var GetObjectLockConfigurationRequest = [
  3,
  n0,
  _GOLCR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetObjectOutput = [
  3,
  n0,
  _GOO,
  0,
  [
    _Bo,
    _DM,
    _AR,
    _E,
    _Re,
    _LM,
    _CLo,
    _ET,
    _CCRC,
    _CCRCC,
    _CCRCNVME,
    _CSHA,
    _CSHAh,
    _CT,
    _MM,
    _VI,
    _CC,
    _CDo,
    _CEo,
    _CL,
    _CR,
    _CTo,
    _Ex,
    _ES,
    _WRL,
    _SSE,
    _M,
    _SSECA,
    _SSECKMD,
    _SSEKMSKI,
    _BKE,
    _SC,
    _RC,
    _RS,
    _PC,
    _TC,
    _OLM,
    _OLRUD,
    _OLLHS
  ],
  [
    [() => StreamingBlob, 16],
    [
      2,
      {
        [_hH]: _xadm
      }
    ],
    [
      0,
      {
        [_hH]: _ar
      }
    ],
    [
      0,
      {
        [_hH]: _xae
      }
    ],
    [
      0,
      {
        [_hH]: _xar
      }
    ],
    [
      4,
      {
        [_hH]: _LM_
      }
    ],
    [
      1,
      {
        [_hH]: _CL__
      }
    ],
    [
      0,
      {
        [_hH]: _ET
      }
    ],
    [
      0,
      {
        [_hH]: _xacc
      }
    ],
    [
      0,
      {
        [_hH]: _xacc_
      }
    ],
    [
      0,
      {
        [_hH]: _xacc__
      }
    ],
    [
      0,
      {
        [_hH]: _xacs
      }
    ],
    [
      0,
      {
        [_hH]: _xacs_
      }
    ],
    [
      0,
      {
        [_hH]: _xact
      }
    ],
    [
      1,
      {
        [_hH]: _xamm
      }
    ],
    [
      0,
      {
        [_hH]: _xavi
      }
    ],
    [
      0,
      {
        [_hH]: _CC_
      }
    ],
    [
      0,
      {
        [_hH]: _CD_
      }
    ],
    [
      0,
      {
        [_hH]: _CE_
      }
    ],
    [
      0,
      {
        [_hH]: _CL_
      }
    ],
    [
      0,
      {
        [_hH]: _CR_
      }
    ],
    [
      0,
      {
        [_hH]: _CT_
      }
    ],
    [
      4,
      {
        [_hH]: _Ex
      }
    ],
    [
      0,
      {
        [_hH]: _ES
      }
    ],
    [
      0,
      {
        [_hH]: _xawrl
      }
    ],
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      128 | 0,
      {
        [_hPH]: _xam
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      0,
      {
        [_hH]: _xasc
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ],
    [
      0,
      {
        [_hH]: _xars
      }
    ],
    [
      1,
      {
        [_hH]: _xampc
      }
    ],
    [
      1,
      {
        [_hH]: _xatc
      }
    ],
    [
      0,
      {
        [_hH]: _xaolm
      }
    ],
    [
      5,
      {
        [_hH]: _xaolrud
      }
    ],
    [
      0,
      {
        [_hH]: _xaollh
      }
    ]
  ]
];
var GetObjectRequest = [
  3,
  n0,
  _GOR,
  0,
  [
    _B,
    _IM,
    _IMSf,
    _INM,
    _IUS,
    _K,
    _Ra,
    _RCC,
    _RCD,
    _RCE,
    _RCL,
    _RCT,
    _RE,
    _VI,
    _SSECA,
    _SSECK,
    _SSECKMD,
    _RP,
    _PN,
    _EBO,
    _CMh
  ],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _IM_
      }
    ],
    [
      4,
      {
        [_hH]: _IMS_
      }
    ],
    [
      0,
      {
        [_hH]: _INM_
      }
    ],
    [
      4,
      {
        [_hH]: _IUS_
      }
    ],
    [0, 1],
    [
      0,
      {
        [_hH]: _Ra
      }
    ],
    [
      0,
      {
        [_hQ]: _rcc
      }
    ],
    [
      0,
      {
        [_hQ]: _rcd
      }
    ],
    [
      0,
      {
        [_hQ]: _rce
      }
    ],
    [
      0,
      {
        [_hQ]: _rcl
      }
    ],
    [
      0,
      {
        [_hQ]: _rct
      }
    ],
    [
      6,
      {
        [_hQ]: _re
      }
    ],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      1,
      {
        [_hQ]: _pN
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xacm
      }
    ]
  ]
];
var GetObjectRetentionOutput = [
  3,
  n0,
  _GORO,
  0,
  [_Ret],
  [
    [
      () => ObjectLockRetention,
      {
        [_xN]: _Ret,
        [_hP]: 1
      }
    ]
  ]
];
var GetObjectRetentionRequest = [
  3,
  n0,
  _GORR,
  0,
  [_B, _K, _VI, _RP, _EBO],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetObjectTaggingOutput = [
  3,
  n0,
  _GOTO,
  {
    [_xN]: _Tag
  },
  [_VI, _TS],
  [
    [
      0,
      {
        [_hH]: _xavi
      }
    ],
    [() => TagSet, 0]
  ]
];
var GetObjectTaggingRequest = [
  3,
  n0,
  _GOTR,
  0,
  [_B, _K, _VI, _EBO, _RP],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ]
  ]
];
var GetObjectTorrentOutput = [
  3,
  n0,
  _GOTOe,
  0,
  [_Bo, _RC],
  [
    [() => StreamingBlob, 16],
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var GetObjectTorrentRequest = [
  3,
  n0,
  _GOTRe,
  0,
  [_B, _K, _RP, _EBO],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GetPublicAccessBlockOutput = [
  3,
  n0,
  _GPABO,
  0,
  [_PABC],
  [[() => PublicAccessBlockConfiguration, 16]]
];
var GetPublicAccessBlockRequest = [
  3,
  n0,
  _GPABR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var GlacierJobParameters = [3, n0, _GJP, 0, [_Ti], [0]];
var Grant = [
  3,
  n0,
  _Gr,
  0,
  [_Gra, _Pe],
  [
    [
      () => Grantee,
      {
        [_xNm]: [_x, _hi]
      }
    ],
    0
  ]
];
var Grantee = [
  3,
  n0,
  _Gra,
  0,
  [_DN, _EA, _ID, _URI, _Ty],
  [
    0,
    0,
    0,
    0,
    [
      0,
      {
        [_xN]: _xs,
        [_xA]: 1
      }
    ]
  ]
];
var HeadBucketOutput = [
  3,
  n0,
  _HBO,
  0,
  [_BA, _BLT, _BLN, _BR, _APA],
  [
    [
      0,
      {
        [_hH]: _xaba
      }
    ],
    [
      0,
      {
        [_hH]: _xablt
      }
    ],
    [
      0,
      {
        [_hH]: _xabln
      }
    ],
    [
      0,
      {
        [_hH]: _xabr
      }
    ],
    [
      2,
      {
        [_hH]: _xaapa
      }
    ]
  ]
];
var HeadBucketRequest = [
  3,
  n0,
  _HBR,
  0,
  [_B, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var HeadObjectOutput = [
  3,
  n0,
  _HOO,
  0,
  [
    _DM,
    _AR,
    _E,
    _Re,
    _AS,
    _LM,
    _CLo,
    _CCRC,
    _CCRCC,
    _CCRCNVME,
    _CSHA,
    _CSHAh,
    _CT,
    _ET,
    _MM,
    _VI,
    _CC,
    _CDo,
    _CEo,
    _CL,
    _CTo,
    _CR,
    _Ex,
    _ES,
    _WRL,
    _SSE,
    _M,
    _SSECA,
    _SSECKMD,
    _SSEKMSKI,
    _BKE,
    _SC,
    _RC,
    _RS,
    _PC,
    _TC,
    _OLM,
    _OLRUD,
    _OLLHS
  ],
  [
    [
      2,
      {
        [_hH]: _xadm
      }
    ],
    [
      0,
      {
        [_hH]: _ar
      }
    ],
    [
      0,
      {
        [_hH]: _xae
      }
    ],
    [
      0,
      {
        [_hH]: _xar
      }
    ],
    [
      0,
      {
        [_hH]: _xaas
      }
    ],
    [
      4,
      {
        [_hH]: _LM_
      }
    ],
    [
      1,
      {
        [_hH]: _CL__
      }
    ],
    [
      0,
      {
        [_hH]: _xacc
      }
    ],
    [
      0,
      {
        [_hH]: _xacc_
      }
    ],
    [
      0,
      {
        [_hH]: _xacc__
      }
    ],
    [
      0,
      {
        [_hH]: _xacs
      }
    ],
    [
      0,
      {
        [_hH]: _xacs_
      }
    ],
    [
      0,
      {
        [_hH]: _xact
      }
    ],
    [
      0,
      {
        [_hH]: _ET
      }
    ],
    [
      1,
      {
        [_hH]: _xamm
      }
    ],
    [
      0,
      {
        [_hH]: _xavi
      }
    ],
    [
      0,
      {
        [_hH]: _CC_
      }
    ],
    [
      0,
      {
        [_hH]: _CD_
      }
    ],
    [
      0,
      {
        [_hH]: _CE_
      }
    ],
    [
      0,
      {
        [_hH]: _CL_
      }
    ],
    [
      0,
      {
        [_hH]: _CT_
      }
    ],
    [
      0,
      {
        [_hH]: _CR_
      }
    ],
    [
      4,
      {
        [_hH]: _Ex
      }
    ],
    [
      0,
      {
        [_hH]: _ES
      }
    ],
    [
      0,
      {
        [_hH]: _xawrl
      }
    ],
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      128 | 0,
      {
        [_hPH]: _xam
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      0,
      {
        [_hH]: _xasc
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ],
    [
      0,
      {
        [_hH]: _xars
      }
    ],
    [
      1,
      {
        [_hH]: _xampc
      }
    ],
    [
      1,
      {
        [_hH]: _xatc
      }
    ],
    [
      0,
      {
        [_hH]: _xaolm
      }
    ],
    [
      5,
      {
        [_hH]: _xaolrud
      }
    ],
    [
      0,
      {
        [_hH]: _xaollh
      }
    ]
  ]
];
var HeadObjectRequest = [
  3,
  n0,
  _HOR,
  0,
  [
    _B,
    _IM,
    _IMSf,
    _INM,
    _IUS,
    _K,
    _Ra,
    _RCC,
    _RCD,
    _RCE,
    _RCL,
    _RCT,
    _RE,
    _VI,
    _SSECA,
    _SSECK,
    _SSECKMD,
    _RP,
    _PN,
    _EBO,
    _CMh
  ],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _IM_
      }
    ],
    [
      4,
      {
        [_hH]: _IMS_
      }
    ],
    [
      0,
      {
        [_hH]: _INM_
      }
    ],
    [
      4,
      {
        [_hH]: _IUS_
      }
    ],
    [0, 1],
    [
      0,
      {
        [_hH]: _Ra
      }
    ],
    [
      0,
      {
        [_hQ]: _rcc
      }
    ],
    [
      0,
      {
        [_hQ]: _rcd
      }
    ],
    [
      0,
      {
        [_hQ]: _rce
      }
    ],
    [
      0,
      {
        [_hQ]: _rcl
      }
    ],
    [
      0,
      {
        [_hQ]: _rct
      }
    ],
    [
      6,
      {
        [_hQ]: _re
      }
    ],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      1,
      {
        [_hQ]: _pN
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xacm
      }
    ]
  ]
];
var IdempotencyParameterMismatch2 = [
  -3,
  n0,
  _IPM,
  {
    [_e2]: _c,
    [_hE]: 400
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(IdempotencyParameterMismatch2, IdempotencyParameterMismatch);
var IndexDocument = [3, n0, _IDn, 0, [_Su], [0]];
var Initiator = [3, n0, _In, 0, [_ID, _DN], [0, 0]];
var InputSerialization = [
  3,
  n0,
  _IS,
  0,
  [_CSV, _CTom, _JSON, _Parq],
  [() => CSVInput, 0, () => JSONInput, () => ParquetInput]
];
var IntelligentTieringAndOperator = [
  3,
  n0,
  _ITAO,
  0,
  [_P, _T],
  [
    0,
    [
      () => TagSet,
      {
        [_xN]: _Ta,
        [_xF]: 1
      }
    ]
  ]
];
var IntelligentTieringConfiguration = [
  3,
  n0,
  _ITC,
  0,
  [_I, _F, _S, _Tie],
  [
    0,
    [() => IntelligentTieringFilter, 0],
    0,
    [
      () => TieringList,
      {
        [_xN]: _Tier,
        [_xF]: 1
      }
    ]
  ]
];
var IntelligentTieringFilter = [
  3,
  n0,
  _ITF,
  0,
  [_P, _Ta, _An],
  [0, () => Tag, [() => IntelligentTieringAndOperator, 0]]
];
var InvalidObjectState2 = [
  -3,
  n0,
  _IOS,
  {
    [_e2]: _c,
    [_hE]: 403
  },
  [_SC, _AT],
  [0, 0]
];
TypeRegistry.for(n0).registerError(InvalidObjectState2, InvalidObjectState);
var InvalidRequest2 = [
  -3,
  n0,
  _IR,
  {
    [_e2]: _c,
    [_hE]: 400
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(InvalidRequest2, InvalidRequest);
var InvalidWriteOffset2 = [
  -3,
  n0,
  _IWO,
  {
    [_e2]: _c,
    [_hE]: 400
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(InvalidWriteOffset2, InvalidWriteOffset);
var InventoryConfiguration = [
  3,
  n0,
  _IC,
  0,
  [_Des, _IE, _F, _I, _IOV, _OF, _Sc],
  [
    [() => InventoryDestination, 0],
    2,
    () => InventoryFilter,
    0,
    0,
    [() => InventoryOptionalFields, 0],
    () => InventorySchedule
  ]
];
var InventoryDestination = [
  3,
  n0,
  _IDnv,
  0,
  [_SBD],
  [[() => InventoryS3BucketDestination, 0]]
];
var InventoryEncryption = [
  3,
  n0,
  _IEn,
  0,
  [_SSES, _SSEKMS],
  [
    [
      () => SSES3,
      {
        [_xN]: _SS
      }
    ],
    [
      () => SSEKMS,
      {
        [_xN]: _SK
      }
    ]
  ]
];
var InventoryFilter = [3, n0, _IF, 0, [_P], [0]];
var InventoryS3BucketDestination = [
  3,
  n0,
  _ISBD,
  0,
  [_AI, _B, _Fo, _P, _En],
  [0, 0, 0, 0, [() => InventoryEncryption, 0]]
];
var InventorySchedule = [3, n0, _ISn, 0, [_Fr], [0]];
var InventoryTableConfiguration = [
  3,
  n0,
  _ITCn,
  0,
  [_CSo, _EC],
  [0, () => MetadataTableEncryptionConfiguration]
];
var InventoryTableConfigurationResult = [
  3,
  n0,
  _ITCR,
  0,
  [_CSo, _TSa, _Err, _TNa, _TA],
  [0, 0, () => ErrorDetails, 0, 0]
];
var InventoryTableConfigurationUpdates = [
  3,
  n0,
  _ITCU,
  0,
  [_CSo, _EC],
  [0, () => MetadataTableEncryptionConfiguration]
];
var JournalTableConfiguration = [
  3,
  n0,
  _JTC,
  0,
  [_REe, _EC],
  [() => RecordExpiration, () => MetadataTableEncryptionConfiguration]
];
var JournalTableConfigurationResult = [
  3,
  n0,
  _JTCR,
  0,
  [_TSa, _Err, _TNa, _TA, _REe],
  [0, () => ErrorDetails, 0, 0, () => RecordExpiration]
];
var JournalTableConfigurationUpdates = [
  3,
  n0,
  _JTCU,
  0,
  [_REe],
  [() => RecordExpiration]
];
var JSONInput = [3, n0, _JSONI, 0, [_Ty], [0]];
var JSONOutput = [3, n0, _JSONO, 0, [_RD], [0]];
var LambdaFunctionConfiguration = [
  3,
  n0,
  _LFC,
  0,
  [_I, _LFA, _Ev, _F],
  [
    0,
    [
      0,
      {
        [_xN]: _CF
      }
    ],
    [
      64 | 0,
      {
        [_xN]: _Eve,
        [_xF]: 1
      }
    ],
    [() => NotificationConfigurationFilter, 0]
  ]
];
var LifecycleExpiration = [3, n0, _LEi, 0, [_Da, _D, _EODM], [5, 1, 2]];
var LifecycleRule = [
  3,
  n0,
  _LR,
  0,
  [_E, _ID, _P, _F, _S, _Tr, _NVT, _NVE, _AIMU],
  [
    () => LifecycleExpiration,
    0,
    0,
    [() => LifecycleRuleFilter, 0],
    0,
    [
      () => TransitionList,
      {
        [_xN]: _Tra,
        [_xF]: 1
      }
    ],
    [
      () => NoncurrentVersionTransitionList,
      {
        [_xN]: _NVTo,
        [_xF]: 1
      }
    ],
    () => NoncurrentVersionExpiration,
    () => AbortIncompleteMultipartUpload
  ]
];
var LifecycleRuleAndOperator = [
  3,
  n0,
  _LRAO,
  0,
  [_P, _T, _OSGT, _OSLT],
  [
    0,
    [
      () => TagSet,
      {
        [_xN]: _Ta,
        [_xF]: 1
      }
    ],
    1,
    1
  ]
];
var LifecycleRuleFilter = [
  3,
  n0,
  _LRF,
  0,
  [_P, _Ta, _OSGT, _OSLT, _An],
  [0, () => Tag, 1, 1, [() => LifecycleRuleAndOperator, 0]]
];
var ListBucketAnalyticsConfigurationsOutput = [
  3,
  n0,
  _LBACO,
  {
    [_xN]: _LBACR
  },
  [_IT, _CTon, _NCT, _ACLn],
  [
    2,
    0,
    0,
    [
      () => AnalyticsConfigurationList,
      {
        [_xN]: _ACn,
        [_xF]: 1
      }
    ]
  ]
];
var ListBucketAnalyticsConfigurationsRequest = [
  3,
  n0,
  _LBACRi,
  0,
  [_B, _CTon, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _ct
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var ListBucketIntelligentTieringConfigurationsOutput = [
  3,
  n0,
  _LBITCO,
  0,
  [_IT, _CTon, _NCT, _ITCL],
  [
    2,
    0,
    0,
    [
      () => IntelligentTieringConfigurationList,
      {
        [_xN]: _ITC,
        [_xF]: 1
      }
    ]
  ]
];
var ListBucketIntelligentTieringConfigurationsRequest = [
  3,
  n0,
  _LBITCR,
  0,
  [_B, _CTon, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _ct
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var ListBucketInventoryConfigurationsOutput = [
  3,
  n0,
  _LBICO,
  {
    [_xN]: _LICR
  },
  [_CTon, _ICL, _IT, _NCT],
  [
    0,
    [
      () => InventoryConfigurationList,
      {
        [_xN]: _IC,
        [_xF]: 1
      }
    ],
    2,
    0
  ]
];
var ListBucketInventoryConfigurationsRequest = [
  3,
  n0,
  _LBICR,
  0,
  [_B, _CTon, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _ct
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var ListBucketMetricsConfigurationsOutput = [
  3,
  n0,
  _LBMCO,
  {
    [_xN]: _LMCR
  },
  [_IT, _CTon, _NCT, _MCL],
  [
    2,
    0,
    0,
    [
      () => MetricsConfigurationList,
      {
        [_xN]: _MCe,
        [_xF]: 1
      }
    ]
  ]
];
var ListBucketMetricsConfigurationsRequest = [
  3,
  n0,
  _LBMCR,
  0,
  [_B, _CTon, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _ct
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var ListBucketsOutput = [
  3,
  n0,
  _LBO,
  {
    [_xN]: _LAMBR
  },
  [_Bu, _O, _CTon, _P],
  [[() => Buckets, 0], () => Owner, 0, 0]
];
var ListBucketsRequest = [
  3,
  n0,
  _LBR,
  0,
  [_MB, _CTon, _P, _BR],
  [
    [
      1,
      {
        [_hQ]: _mb
      }
    ],
    [
      0,
      {
        [_hQ]: _ct
      }
    ],
    [
      0,
      {
        [_hQ]: _p
      }
    ],
    [
      0,
      {
        [_hQ]: _br
      }
    ]
  ]
];
var ListDirectoryBucketsOutput = [
  3,
  n0,
  _LDBO,
  {
    [_xN]: _LAMDBR
  },
  [_Bu, _CTon],
  [[() => Buckets, 0], 0]
];
var ListDirectoryBucketsRequest = [
  3,
  n0,
  _LDBR,
  0,
  [_CTon, _MDB],
  [
    [
      0,
      {
        [_hQ]: _ct
      }
    ],
    [
      1,
      {
        [_hQ]: _mdb
      }
    ]
  ]
];
var ListMultipartUploadsOutput = [
  3,
  n0,
  _LMUO,
  {
    [_xN]: _LMUR
  },
  [_B, _KM, _UIM, _NKM, _P, _Deli, _NUIM, _MUa, _IT, _U, _CPom, _ETnc, _RC],
  [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    2,
    [
      () => MultipartUploadList,
      {
        [_xN]: _Up,
        [_xF]: 1
      }
    ],
    [
      () => CommonPrefixList,
      {
        [_xF]: 1
      }
    ],
    0,
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var ListMultipartUploadsRequest = [
  3,
  n0,
  _LMURi,
  0,
  [_B, _Deli, _ETnc, _KM, _MUa, _P, _UIM, _EBO, _RP],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _d
      }
    ],
    [
      0,
      {
        [_hQ]: _et
      }
    ],
    [
      0,
      {
        [_hQ]: _km
      }
    ],
    [
      1,
      {
        [_hQ]: _mu
      }
    ],
    [
      0,
      {
        [_hQ]: _p
      }
    ],
    [
      0,
      {
        [_hQ]: _uim
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ]
  ]
];
var ListObjectsOutput = [
  3,
  n0,
  _LOO,
  {
    [_xN]: _LBRi
  },
  [_IT, _Ma, _NM, _Con, _N, _P, _Deli, _MK, _CPom, _ETnc, _RC],
  [
    2,
    0,
    0,
    [
      () => ObjectList,
      {
        [_xF]: 1
      }
    ],
    0,
    0,
    0,
    1,
    [
      () => CommonPrefixList,
      {
        [_xF]: 1
      }
    ],
    0,
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var ListObjectsRequest = [
  3,
  n0,
  _LOR,
  0,
  [_B, _Deli, _ETnc, _Ma, _MK, _P, _RP, _EBO, _OOA],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _d
      }
    ],
    [
      0,
      {
        [_hQ]: _et
      }
    ],
    [
      0,
      {
        [_hQ]: _m
      }
    ],
    [
      1,
      {
        [_hQ]: _mk
      }
    ],
    [
      0,
      {
        [_hQ]: _p
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      64 | 0,
      {
        [_hH]: _xaooa
      }
    ]
  ]
];
var ListObjectsV2Output = [
  3,
  n0,
  _LOVO,
  {
    [_xN]: _LBRi
  },
  [_IT, _Con, _N, _P, _Deli, _MK, _CPom, _ETnc, _KC, _CTon, _NCT, _SA, _RC],
  [
    2,
    [
      () => ObjectList,
      {
        [_xF]: 1
      }
    ],
    0,
    0,
    0,
    1,
    [
      () => CommonPrefixList,
      {
        [_xF]: 1
      }
    ],
    0,
    1,
    0,
    0,
    0,
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var ListObjectsV2Request = [
  3,
  n0,
  _LOVR,
  0,
  [_B, _Deli, _ETnc, _MK, _P, _CTon, _FO, _SA, _RP, _EBO, _OOA],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _d
      }
    ],
    [
      0,
      {
        [_hQ]: _et
      }
    ],
    [
      1,
      {
        [_hQ]: _mk
      }
    ],
    [
      0,
      {
        [_hQ]: _p
      }
    ],
    [
      0,
      {
        [_hQ]: _ct
      }
    ],
    [
      2,
      {
        [_hQ]: _fo
      }
    ],
    [
      0,
      {
        [_hQ]: _sa
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      64 | 0,
      {
        [_hH]: _xaooa
      }
    ]
  ]
];
var ListObjectVersionsOutput = [
  3,
  n0,
  _LOVOi,
  {
    [_xN]: _LVR
  },
  [_IT, _KM, _VIM, _NKM, _NVIM, _Ve, _DMe, _N, _P, _Deli, _MK, _CPom, _ETnc, _RC],
  [
    2,
    0,
    0,
    0,
    0,
    [
      () => ObjectVersionList,
      {
        [_xN]: _Ver,
        [_xF]: 1
      }
    ],
    [
      () => DeleteMarkers,
      {
        [_xN]: _DM,
        [_xF]: 1
      }
    ],
    0,
    0,
    0,
    1,
    [
      () => CommonPrefixList,
      {
        [_xF]: 1
      }
    ],
    0,
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var ListObjectVersionsRequest = [
  3,
  n0,
  _LOVRi,
  0,
  [_B, _Deli, _ETnc, _KM, _MK, _P, _VIM, _EBO, _RP, _OOA],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _d
      }
    ],
    [
      0,
      {
        [_hQ]: _et
      }
    ],
    [
      0,
      {
        [_hQ]: _km
      }
    ],
    [
      1,
      {
        [_hQ]: _mk
      }
    ],
    [
      0,
      {
        [_hQ]: _p
      }
    ],
    [
      0,
      {
        [_hQ]: _vim
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      64 | 0,
      {
        [_hH]: _xaooa
      }
    ]
  ]
];
var ListPartsOutput = [
  3,
  n0,
  _LPO,
  {
    [_xN]: _LPR
  },
  [_AD, _ARI, _B, _K, _UI, _PNM, _NPNM, _MP, _IT, _Pa, _In, _O, _SC, _RC, _CA, _CT],
  [
    [
      4,
      {
        [_hH]: _xaad
      }
    ],
    [
      0,
      {
        [_hH]: _xaari
      }
    ],
    0,
    0,
    0,
    0,
    0,
    1,
    2,
    [
      () => Parts,
      {
        [_xN]: _Par,
        [_xF]: 1
      }
    ],
    () => Initiator,
    () => Owner,
    0,
    [
      0,
      {
        [_hH]: _xarc
      }
    ],
    0,
    0
  ]
];
var ListPartsRequest = [
  3,
  n0,
  _LPRi,
  0,
  [_B, _K, _MP, _PNM, _UI, _RP, _EBO, _SSECA, _SSECK, _SSECKMD],
  [
    [0, 1],
    [0, 1],
    [
      1,
      {
        [_hQ]: _mp
      }
    ],
    [
      0,
      {
        [_hQ]: _pnm
      }
    ],
    [
      0,
      {
        [_hQ]: _uI
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ]
  ]
];
var LocationInfo = [3, n0, _LI, 0, [_Ty, _N], [0, 0]];
var LoggingEnabled = [
  3,
  n0,
  _LE,
  0,
  [_TB, _TG, _TP, _TOKF],
  [0, [() => TargetGrants, 0], 0, [() => TargetObjectKeyFormat, 0]]
];
var MetadataConfiguration = [
  3,
  n0,
  _MC,
  0,
  [_JTC, _ITCn],
  [() => JournalTableConfiguration, () => InventoryTableConfiguration]
];
var MetadataConfigurationResult = [
  3,
  n0,
  _MCR,
  0,
  [_DRes, _JTCR, _ITCR],
  [() => DestinationResult, () => JournalTableConfigurationResult, () => InventoryTableConfigurationResult]
];
var MetadataEntry = [3, n0, _ME, 0, [_N, _V], [0, 0]];
var MetadataTableConfiguration = [3, n0, _MTC, 0, [_STD], [() => S3TablesDestination]];
var MetadataTableConfigurationResult = [
  3,
  n0,
  _MTCR,
  0,
  [_STDR],
  [() => S3TablesDestinationResult]
];
var MetadataTableEncryptionConfiguration = [3, n0, _MTEC, 0, [_SAs, _KKA], [0, 0]];
var Metrics = [3, n0, _Me, 0, [_S, _ETv], [0, () => ReplicationTimeValue]];
var MetricsAndOperator = [
  3,
  n0,
  _MAO,
  0,
  [_P, _T, _APAc],
  [
    0,
    [
      () => TagSet,
      {
        [_xN]: _Ta,
        [_xF]: 1
      }
    ],
    0
  ]
];
var MetricsConfiguration = [3, n0, _MCe, 0, [_I, _F], [0, [() => MetricsFilter, 0]]];
var MultipartUpload = [
  3,
  n0,
  _MU,
  0,
  [_UI, _K, _Ini, _SC, _O, _In, _CA, _CT],
  [0, 0, 4, 0, () => Owner, () => Initiator, 0, 0]
];
var NoncurrentVersionExpiration = [3, n0, _NVE, 0, [_ND, _NNV], [1, 1]];
var NoncurrentVersionTransition = [3, n0, _NVTo, 0, [_ND, _SC, _NNV], [1, 0, 1]];
var NoSuchBucket2 = [
  -3,
  n0,
  _NSB,
  {
    [_e2]: _c,
    [_hE]: 404
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(NoSuchBucket2, NoSuchBucket);
var NoSuchKey2 = [
  -3,
  n0,
  _NSK,
  {
    [_e2]: _c,
    [_hE]: 404
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(NoSuchKey2, NoSuchKey);
var NoSuchUpload2 = [
  -3,
  n0,
  _NSU,
  {
    [_e2]: _c,
    [_hE]: 404
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(NoSuchUpload2, NoSuchUpload);
var NotFound2 = [
  -3,
  n0,
  _NF,
  {
    [_e2]: _c
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(NotFound2, NotFound);
var NotificationConfiguration = [
  3,
  n0,
  _NC,
  0,
  [_TCo, _QCu, _LFCa, _EBC],
  [
    [
      () => TopicConfigurationList,
      {
        [_xN]: _TCop,
        [_xF]: 1
      }
    ],
    [
      () => QueueConfigurationList,
      {
        [_xN]: _QCue,
        [_xF]: 1
      }
    ],
    [
      () => LambdaFunctionConfigurationList,
      {
        [_xN]: _CFC,
        [_xF]: 1
      }
    ],
    () => EventBridgeConfiguration
  ]
];
var NotificationConfigurationFilter = [
  3,
  n0,
  _NCF,
  0,
  [_K],
  [
    [
      () => S3KeyFilter,
      {
        [_xN]: _SKe
      }
    ]
  ]
];
var _Object = [
  3,
  n0,
  _Obj,
  0,
  [_K, _LM, _ET, _CA, _CT, _Si, _SC, _O, _RSe],
  [
    0,
    4,
    0,
    [
      64 | 0,
      {
        [_xF]: 1
      }
    ],
    0,
    1,
    0,
    () => Owner,
    () => RestoreStatus
  ]
];
var ObjectAlreadyInActiveTierError2 = [
  -3,
  n0,
  _OAIATE,
  {
    [_e2]: _c,
    [_hE]: 403
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(ObjectAlreadyInActiveTierError2, ObjectAlreadyInActiveTierError);
var ObjectIdentifier = [3, n0, _OI, 0, [_K, _VI, _ET, _LMT, _Si], [0, 0, 0, 6, 1]];
var ObjectLockConfiguration = [3, n0, _OLC, 0, [_OLE, _Ru], [0, () => ObjectLockRule]];
var ObjectLockLegalHold = [3, n0, _OLLH, 0, [_S], [0]];
var ObjectLockRetention = [3, n0, _OLR, 0, [_Mo, _RUD], [0, 5]];
var ObjectLockRule = [3, n0, _OLRb, 0, [_DRe], [() => DefaultRetention]];
var ObjectNotInActiveTierError2 = [
  -3,
  n0,
  _ONIATE,
  {
    [_e2]: _c,
    [_hE]: 403
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(ObjectNotInActiveTierError2, ObjectNotInActiveTierError);
var ObjectPart = [
  3,
  n0,
  _OPb,
  0,
  [_PN, _Si, _CCRC, _CCRCC, _CCRCNVME, _CSHA, _CSHAh],
  [1, 1, 0, 0, 0, 0, 0]
];
var ObjectVersion = [
  3,
  n0,
  _OV,
  0,
  [_ET, _CA, _CT, _Si, _SC, _K, _VI, _IL, _LM, _O, _RSe],
  [
    0,
    [
      64 | 0,
      {
        [_xF]: 1
      }
    ],
    0,
    1,
    0,
    0,
    0,
    2,
    4,
    () => Owner,
    () => RestoreStatus
  ]
];
var OutputLocation = [3, n0, _OL, 0, [_S_], [[() => S3Location, 0]]];
var OutputSerialization = [
  3,
  n0,
  _OSu,
  0,
  [_CSV, _JSON],
  [() => CSVOutput, () => JSONOutput]
];
var Owner = [3, n0, _O, 0, [_DN, _ID], [0, 0]];
var OwnershipControls = [
  3,
  n0,
  _OC,
  0,
  [_R],
  [
    [
      () => OwnershipControlsRules,
      {
        [_xN]: _Ru,
        [_xF]: 1
      }
    ]
  ]
];
var OwnershipControlsRule = [3, n0, _OCR, 0, [_OO], [0]];
var ParquetInput = [3, n0, _PI, 0, [], []];
var Part = [
  3,
  n0,
  _Par,
  0,
  [_PN, _LM, _ET, _Si, _CCRC, _CCRCC, _CCRCNVME, _CSHA, _CSHAh],
  [1, 4, 0, 1, 0, 0, 0, 0, 0]
];
var PartitionedPrefix = [
  3,
  n0,
  _PP,
  {
    [_xN]: _PP
  },
  [_PDS],
  [0]
];
var PolicyStatus = [
  3,
  n0,
  _PS,
  0,
  [_IP],
  [
    [
      2,
      {
        [_xN]: _IP
      }
    ]
  ]
];
var Progress = [3, n0, _Pr, 0, [_BS, _BP, _BRy], [1, 1, 1]];
var ProgressEvent = [
  3,
  n0,
  _PE,
  0,
  [_Det],
  [
    [
      () => Progress,
      {
        [_eP]: 1
      }
    ]
  ]
];
var PublicAccessBlockConfiguration = [
  3,
  n0,
  _PABC,
  0,
  [_BPA, _IPA, _BPP, _RPB],
  [
    [
      2,
      {
        [_xN]: _BPA
      }
    ],
    [
      2,
      {
        [_xN]: _IPA
      }
    ],
    [
      2,
      {
        [_xN]: _BPP
      }
    ],
    [
      2,
      {
        [_xN]: _RPB
      }
    ]
  ]
];
var PutBucketAccelerateConfigurationRequest = [
  3,
  n0,
  _PBACR,
  0,
  [_B, _AC, _EBO, _CA],
  [
    [0, 1],
    [
      () => AccelerateConfiguration,
      {
        [_xN]: _AC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ]
  ]
];
var PutBucketAclRequest = [
  3,
  n0,
  _PBAR,
  0,
  [_ACL_, _ACP, _B, _CMD, _CA, _GFC, _GR, _GRACP, _GW, _GWACP, _EBO],
  [
    [
      0,
      {
        [_hH]: _xaa
      }
    ],
    [
      () => AccessControlPolicy,
      {
        [_xN]: _ACP,
        [_hP]: 1
      }
    ],
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xagfc
      }
    ],
    [
      0,
      {
        [_hH]: _xagr
      }
    ],
    [
      0,
      {
        [_hH]: _xagra
      }
    ],
    [
      0,
      {
        [_hH]: _xagw
      }
    ],
    [
      0,
      {
        [_hH]: _xagwa
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketAnalyticsConfigurationRequest = [
  3,
  n0,
  _PBACRu,
  0,
  [_B, _I, _ACn, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      () => AnalyticsConfiguration,
      {
        [_xN]: _ACn,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketCorsRequest = [
  3,
  n0,
  _PBCR,
  0,
  [_B, _CORSC, _CMD, _CA, _EBO],
  [
    [0, 1],
    [
      () => CORSConfiguration,
      {
        [_xN]: _CORSC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketEncryptionRequest = [
  3,
  n0,
  _PBER,
  0,
  [_B, _CMD, _CA, _SSEC, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => ServerSideEncryptionConfiguration,
      {
        [_xN]: _SSEC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketIntelligentTieringConfigurationRequest = [
  3,
  n0,
  _PBITCR,
  0,
  [_B, _I, _EBO, _ITC],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      () => IntelligentTieringConfiguration,
      {
        [_xN]: _ITC,
        [_hP]: 1
      }
    ]
  ]
];
var PutBucketInventoryConfigurationRequest = [
  3,
  n0,
  _PBICR,
  0,
  [_B, _I, _IC, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      () => InventoryConfiguration,
      {
        [_xN]: _IC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketLifecycleConfigurationOutput = [
  3,
  n0,
  _PBLCO,
  0,
  [_TDMOS],
  [
    [
      0,
      {
        [_hH]: _xatdmos
      }
    ]
  ]
];
var PutBucketLifecycleConfigurationRequest = [
  3,
  n0,
  _PBLCR,
  0,
  [_B, _CA, _LCi, _EBO, _TDMOS],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => BucketLifecycleConfiguration,
      {
        [_xN]: _LCi,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xatdmos
      }
    ]
  ]
];
var PutBucketLoggingRequest = [
  3,
  n0,
  _PBLR,
  0,
  [_B, _BLS, _CMD, _CA, _EBO],
  [
    [0, 1],
    [
      () => BucketLoggingStatus,
      {
        [_xN]: _BLS,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketMetricsConfigurationRequest = [
  3,
  n0,
  _PBMCR,
  0,
  [_B, _I, _MCe, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hQ]: _i
      }
    ],
    [
      () => MetricsConfiguration,
      {
        [_xN]: _MCe,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketNotificationConfigurationRequest = [
  3,
  n0,
  _PBNCR,
  0,
  [_B, _NC, _EBO, _SDV],
  [
    [0, 1],
    [
      () => NotificationConfiguration,
      {
        [_xN]: _NC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      2,
      {
        [_hH]: _xasdv
      }
    ]
  ]
];
var PutBucketOwnershipControlsRequest = [
  3,
  n0,
  _PBOCR,
  0,
  [_B, _CMD, _EBO, _OC, _CA],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      () => OwnershipControls,
      {
        [_xN]: _OC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ]
  ]
];
var PutBucketPolicyRequest = [
  3,
  n0,
  _PBPR,
  0,
  [_B, _CMD, _CA, _CRSBA, _Po, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      2,
      {
        [_hH]: _xacrsba
      }
    ],
    [0, 16],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketReplicationRequest = [
  3,
  n0,
  _PBRR,
  0,
  [_B, _CMD, _CA, _RCe, _To, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => ReplicationConfiguration,
      {
        [_xN]: _RCe,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xabolt
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketRequestPaymentRequest = [
  3,
  n0,
  _PBRPR,
  0,
  [_B, _CMD, _CA, _RPC, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => RequestPaymentConfiguration,
      {
        [_xN]: _RPC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketTaggingRequest = [
  3,
  n0,
  _PBTR,
  0,
  [_B, _CMD, _CA, _Tag, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => Tagging,
      {
        [_xN]: _Tag,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketVersioningRequest = [
  3,
  n0,
  _PBVR,
  0,
  [_B, _CMD, _CA, _MFA, _VC, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xam_
      }
    ],
    [
      () => VersioningConfiguration,
      {
        [_xN]: _VC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutBucketWebsiteRequest = [
  3,
  n0,
  _PBWR,
  0,
  [_B, _CMD, _CA, _WC, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => WebsiteConfiguration,
      {
        [_xN]: _WC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutObjectAclOutput = [
  3,
  n0,
  _POAO,
  0,
  [_RC],
  [
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var PutObjectAclRequest = [
  3,
  n0,
  _POAR,
  0,
  [_ACL_, _ACP, _B, _CMD, _CA, _GFC, _GR, _GRACP, _GW, _GWACP, _K, _RP, _VI, _EBO],
  [
    [
      0,
      {
        [_hH]: _xaa
      }
    ],
    [
      () => AccessControlPolicy,
      {
        [_xN]: _ACP,
        [_hP]: 1
      }
    ],
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xagfc
      }
    ],
    [
      0,
      {
        [_hH]: _xagr
      }
    ],
    [
      0,
      {
        [_hH]: _xagra
      }
    ],
    [
      0,
      {
        [_hH]: _xagw
      }
    ],
    [
      0,
      {
        [_hH]: _xagwa
      }
    ],
    [0, 1],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutObjectLegalHoldOutput = [
  3,
  n0,
  _POLHO,
  0,
  [_RC],
  [
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var PutObjectLegalHoldRequest = [
  3,
  n0,
  _POLHR,
  0,
  [_B, _K, _LH, _RP, _VI, _CMD, _CA, _EBO],
  [
    [0, 1],
    [0, 1],
    [
      () => ObjectLockLegalHold,
      {
        [_xN]: _LH,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutObjectLockConfigurationOutput = [
  3,
  n0,
  _POLCO,
  0,
  [_RC],
  [
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var PutObjectLockConfigurationRequest = [
  3,
  n0,
  _POLCR,
  0,
  [_B, _OLC, _RP, _To, _CMD, _CA, _EBO],
  [
    [0, 1],
    [
      () => ObjectLockConfiguration,
      {
        [_xN]: _OLC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xabolt
      }
    ],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutObjectOutput = [
  3,
  n0,
  _POO,
  0,
  [
    _E,
    _ET,
    _CCRC,
    _CCRCC,
    _CCRCNVME,
    _CSHA,
    _CSHAh,
    _CT,
    _SSE,
    _VI,
    _SSECA,
    _SSECKMD,
    _SSEKMSKI,
    _SSEKMSEC,
    _BKE,
    _Si,
    _RC
  ],
  [
    [
      0,
      {
        [_hH]: _xae
      }
    ],
    [
      0,
      {
        [_hH]: _ET
      }
    ],
    [
      0,
      {
        [_hH]: _xacc
      }
    ],
    [
      0,
      {
        [_hH]: _xacc_
      }
    ],
    [
      0,
      {
        [_hH]: _xacc__
      }
    ],
    [
      0,
      {
        [_hH]: _xacs
      }
    ],
    [
      0,
      {
        [_hH]: _xacs_
      }
    ],
    [
      0,
      {
        [_hH]: _xact
      }
    ],
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      0,
      {
        [_hH]: _xavi
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      () => SSEKMSEncryptionContext,
      {
        [_hH]: _xassec
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      1,
      {
        [_hH]: _xaos
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var PutObjectRequest = [
  3,
  n0,
  _POR,
  0,
  [
    _ACL_,
    _Bo,
    _B,
    _CC,
    _CDo,
    _CEo,
    _CL,
    _CLo,
    _CMD,
    _CTo,
    _CA,
    _CCRC,
    _CCRCC,
    _CCRCNVME,
    _CSHA,
    _CSHAh,
    _Ex,
    _IM,
    _INM,
    _GFC,
    _GR,
    _GRACP,
    _GWACP,
    _K,
    _WOB,
    _M,
    _SSE,
    _SC,
    _WRL,
    _SSECA,
    _SSECK,
    _SSECKMD,
    _SSEKMSKI,
    _SSEKMSEC,
    _BKE,
    _RP,
    _Tag,
    _OLM,
    _OLRUD,
    _OLLHS,
    _EBO
  ],
  [
    [
      0,
      {
        [_hH]: _xaa
      }
    ],
    [() => StreamingBlob, 16],
    [0, 1],
    [
      0,
      {
        [_hH]: _CC_
      }
    ],
    [
      0,
      {
        [_hH]: _CD_
      }
    ],
    [
      0,
      {
        [_hH]: _CE_
      }
    ],
    [
      0,
      {
        [_hH]: _CL_
      }
    ],
    [
      1,
      {
        [_hH]: _CL__
      }
    ],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _CT_
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xacc
      }
    ],
    [
      0,
      {
        [_hH]: _xacc_
      }
    ],
    [
      0,
      {
        [_hH]: _xacc__
      }
    ],
    [
      0,
      {
        [_hH]: _xacs
      }
    ],
    [
      0,
      {
        [_hH]: _xacs_
      }
    ],
    [
      4,
      {
        [_hH]: _Ex
      }
    ],
    [
      0,
      {
        [_hH]: _IM_
      }
    ],
    [
      0,
      {
        [_hH]: _INM_
      }
    ],
    [
      0,
      {
        [_hH]: _xagfc
      }
    ],
    [
      0,
      {
        [_hH]: _xagr
      }
    ],
    [
      0,
      {
        [_hH]: _xagra
      }
    ],
    [
      0,
      {
        [_hH]: _xagwa
      }
    ],
    [0, 1],
    [
      1,
      {
        [_hH]: _xawob
      }
    ],
    [
      128 | 0,
      {
        [_hPH]: _xam
      }
    ],
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      0,
      {
        [_hH]: _xasc
      }
    ],
    [
      0,
      {
        [_hH]: _xawrl
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      () => SSEKMSEncryptionContext,
      {
        [_hH]: _xassec
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xat
      }
    ],
    [
      0,
      {
        [_hH]: _xaolm
      }
    ],
    [
      5,
      {
        [_hH]: _xaolrud
      }
    ],
    [
      0,
      {
        [_hH]: _xaollh
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutObjectRetentionOutput = [
  3,
  n0,
  _PORO,
  0,
  [_RC],
  [
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var PutObjectRetentionRequest = [
  3,
  n0,
  _PORR,
  0,
  [_B, _K, _Ret, _RP, _VI, _BGR, _CMD, _CA, _EBO],
  [
    [0, 1],
    [0, 1],
    [
      () => ObjectLockRetention,
      {
        [_xN]: _Ret,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      2,
      {
        [_hH]: _xabgr
      }
    ],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var PutObjectTaggingOutput = [
  3,
  n0,
  _POTO,
  0,
  [_VI],
  [
    [
      0,
      {
        [_hH]: _xavi
      }
    ]
  ]
];
var PutObjectTaggingRequest = [
  3,
  n0,
  _POTR,
  0,
  [_B, _K, _VI, _CMD, _CA, _Tag, _EBO, _RP],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => Tagging,
      {
        [_xN]: _Tag,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ]
  ]
];
var PutPublicAccessBlockRequest = [
  3,
  n0,
  _PPABR,
  0,
  [_B, _CMD, _CA, _PABC, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => PublicAccessBlockConfiguration,
      {
        [_xN]: _PABC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var QueueConfiguration = [
  3,
  n0,
  _QCue,
  0,
  [_I, _QA, _Ev, _F],
  [
    0,
    [
      0,
      {
        [_xN]: _Qu
      }
    ],
    [
      64 | 0,
      {
        [_xN]: _Eve,
        [_xF]: 1
      }
    ],
    [() => NotificationConfigurationFilter, 0]
  ]
];
var RecordExpiration = [3, n0, _REe, 0, [_E, _D], [0, 1]];
var RecordsEvent = [
  3,
  n0,
  _REec,
  0,
  [_Payl],
  [
    [
      21,
      {
        [_eP]: 1
      }
    ]
  ]
];
var Redirect = [3, n0, _Red, 0, [_HN, _HRC, _Pro, _RKPW, _RKW], [0, 0, 0, 0, 0]];
var RedirectAllRequestsTo = [3, n0, _RART, 0, [_HN, _Pro], [0, 0]];
var RenameObjectOutput = [3, n0, _ROO, 0, [], []];
var RenameObjectRequest = [
  3,
  n0,
  _ROR,
  0,
  [_B, _K, _RSen, _DIM, _DINM, _DIMS, _DIUS, _SIM, _SINM, _SIMS, _SIUS, _CTl],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hH]: _xars_
      }
    ],
    [
      0,
      {
        [_hH]: _IM_
      }
    ],
    [
      0,
      {
        [_hH]: _INM_
      }
    ],
    [
      4,
      {
        [_hH]: _IMS_
      }
    ],
    [
      4,
      {
        [_hH]: _IUS_
      }
    ],
    [
      0,
      {
        [_hH]: _xarsim
      }
    ],
    [
      0,
      {
        [_hH]: _xarsinm
      }
    ],
    [
      6,
      {
        [_hH]: _xarsims
      }
    ],
    [
      6,
      {
        [_hH]: _xarsius
      }
    ],
    [
      0,
      {
        [_hH]: _xact_,
        [_iT]: 1
      }
    ]
  ]
];
var ReplicaModifications = [3, n0, _RM, 0, [_S], [0]];
var ReplicationConfiguration = [
  3,
  n0,
  _RCe,
  0,
  [_Ro, _R],
  [
    0,
    [
      () => ReplicationRules,
      {
        [_xN]: _Ru,
        [_xF]: 1
      }
    ]
  ]
];
var ReplicationRule = [
  3,
  n0,
  _RRe,
  0,
  [_ID, _Pri, _P, _F, _S, _SSC, _EOR, _Des, _DMR],
  [
    0,
    1,
    0,
    [() => ReplicationRuleFilter, 0],
    0,
    () => SourceSelectionCriteria,
    () => ExistingObjectReplication,
    () => Destination,
    () => DeleteMarkerReplication
  ]
];
var ReplicationRuleAndOperator = [
  3,
  n0,
  _RRAO,
  0,
  [_P, _T],
  [
    0,
    [
      () => TagSet,
      {
        [_xN]: _Ta,
        [_xF]: 1
      }
    ]
  ]
];
var ReplicationRuleFilter = [
  3,
  n0,
  _RRF,
  0,
  [_P, _Ta, _An],
  [0, () => Tag, [() => ReplicationRuleAndOperator, 0]]
];
var ReplicationTime = [3, n0, _RT, 0, [_S, _Tim], [0, () => ReplicationTimeValue]];
var ReplicationTimeValue = [3, n0, _RTV, 0, [_Mi], [1]];
var RequestPaymentConfiguration = [3, n0, _RPC, 0, [_Pay], [0]];
var RequestProgress = [3, n0, _RPe, 0, [_Ena], [2]];
var RestoreObjectOutput = [
  3,
  n0,
  _ROOe,
  0,
  [_RC, _ROP],
  [
    [
      0,
      {
        [_hH]: _xarc
      }
    ],
    [
      0,
      {
        [_hH]: _xarop
      }
    ]
  ]
];
var RestoreObjectRequest = [
  3,
  n0,
  _RORe,
  0,
  [_B, _K, _VI, _RRes, _RP, _CA, _EBO],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hQ]: _vI
      }
    ],
    [
      () => RestoreRequest,
      {
        [_hP]: 1,
        [_xN]: _RRes
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var RestoreRequest = [
  3,
  n0,
  _RRes,
  0,
  [_D, _GJP, _Ty, _Ti, _Desc, _SP, _OL],
  [1, () => GlacierJobParameters, 0, 0, 0, () => SelectParameters, [() => OutputLocation, 0]]
];
var RestoreStatus = [3, n0, _RSe, 0, [_IRIP, _RED], [2, 4]];
var RoutingRule = [3, n0, _RRo, 0, [_Co, _Red], [() => Condition, () => Redirect]];
var S3KeyFilter = [
  3,
  n0,
  _SKF,
  0,
  [_FRi],
  [
    [
      () => FilterRuleList,
      {
        [_xN]: _FR,
        [_xF]: 1
      }
    ]
  ]
];
var S3Location = [
  3,
  n0,
  _SL,
  0,
  [_BN, _P, _En, _CACL, _ACL, _Tag, _UM, _SC],
  [0, 0, [() => Encryption, 0], 0, [() => Grants, 0], [() => Tagging, 0], [() => UserMetadata, 0], 0]
];
var S3TablesDestination = [3, n0, _STD, 0, [_TBA, _TNa], [0, 0]];
var S3TablesDestinationResult = [3, n0, _STDR, 0, [_TBA, _TNa, _TA, _TN], [0, 0, 0, 0]];
var ScanRange = [3, n0, _SR, 0, [_St, _End], [1, 1]];
var SelectObjectContentOutput = [
  3,
  n0,
  _SOCO,
  0,
  [_Payl],
  [[() => SelectObjectContentEventStream, 16]]
];
var SelectObjectContentRequest = [
  3,
  n0,
  _SOCR,
  0,
  [_B, _K, _SSECA, _SSECK, _SSECKMD, _Exp, _ETx, _RPe, _IS, _OSu, _SR, _EBO],
  [
    [0, 1],
    [0, 1],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    0,
    0,
    () => RequestProgress,
    () => InputSerialization,
    () => OutputSerialization,
    () => ScanRange,
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var SelectParameters = [
  3,
  n0,
  _SP,
  0,
  [_IS, _ETx, _Exp, _OSu],
  [() => InputSerialization, 0, 0, () => OutputSerialization]
];
var ServerSideEncryptionByDefault = [
  3,
  n0,
  _SSEBD,
  0,
  [_SSEA, _KMSMKID],
  [0, [() => SSEKMSKeyId, 0]]
];
var ServerSideEncryptionConfiguration = [
  3,
  n0,
  _SSEC,
  0,
  [_R],
  [
    [
      () => ServerSideEncryptionRules,
      {
        [_xN]: _Ru,
        [_xF]: 1
      }
    ]
  ]
];
var ServerSideEncryptionRule = [
  3,
  n0,
  _SSER,
  0,
  [_ASSEBD, _BKE],
  [[() => ServerSideEncryptionByDefault, 0], 2]
];
var SessionCredentials = [
  3,
  n0,
  _SCe,
  0,
  [_AKI, _SAK, _ST, _E],
  [
    [
      0,
      {
        [_xN]: _AKI
      }
    ],
    [
      () => SessionCredentialValue,
      {
        [_xN]: _SAK
      }
    ],
    [
      () => SessionCredentialValue,
      {
        [_xN]: _ST
      }
    ],
    [
      4,
      {
        [_xN]: _E
      }
    ]
  ]
];
var SimplePrefix = [
  3,
  n0,
  _SPi,
  {
    [_xN]: _SPi
  },
  [],
  []
];
var SourceSelectionCriteria = [
  3,
  n0,
  _SSC,
  0,
  [_SKEO, _RM],
  [() => SseKmsEncryptedObjects, () => ReplicaModifications]
];
var SSEKMS = [
  3,
  n0,
  _SSEKMS,
  {
    [_xN]: _SK
  },
  [_KI],
  [[() => SSEKMSKeyId, 0]]
];
var SseKmsEncryptedObjects = [3, n0, _SKEO, 0, [_S], [0]];
var SSES3 = [
  3,
  n0,
  _SSES,
  {
    [_xN]: _SS
  },
  [],
  []
];
var Stats = [3, n0, _Sta, 0, [_BS, _BP, _BRy], [1, 1, 1]];
var StatsEvent = [
  3,
  n0,
  _SE,
  0,
  [_Det],
  [
    [
      () => Stats,
      {
        [_eP]: 1
      }
    ]
  ]
];
var StorageClassAnalysis = [
  3,
  n0,
  _SCA,
  0,
  [_DE],
  [() => StorageClassAnalysisDataExport]
];
var StorageClassAnalysisDataExport = [
  3,
  n0,
  _SCADE,
  0,
  [_OSV, _Des],
  [0, () => AnalyticsExportDestination]
];
var Tag = [3, n0, _Ta, 0, [_K, _V], [0, 0]];
var Tagging = [3, n0, _Tag, 0, [_TS], [[() => TagSet, 0]]];
var TargetGrant = [
  3,
  n0,
  _TGa,
  0,
  [_Gra, _Pe],
  [
    [
      () => Grantee,
      {
        [_xNm]: [_x, _hi]
      }
    ],
    0
  ]
];
var TargetObjectKeyFormat = [
  3,
  n0,
  _TOKF,
  0,
  [_SPi, _PP],
  [
    [
      () => SimplePrefix,
      {
        [_xN]: _SPi
      }
    ],
    [
      () => PartitionedPrefix,
      {
        [_xN]: _PP
      }
    ]
  ]
];
var Tiering = [3, n0, _Tier, 0, [_D, _AT], [1, 0]];
var TooManyParts2 = [
  -3,
  n0,
  _TMP,
  {
    [_e2]: _c,
    [_hE]: 400
  },
  [],
  []
];
TypeRegistry.for(n0).registerError(TooManyParts2, TooManyParts);
var TopicConfiguration = [
  3,
  n0,
  _TCop,
  0,
  [_I, _TAo, _Ev, _F],
  [
    0,
    [
      0,
      {
        [_xN]: _Top
      }
    ],
    [
      64 | 0,
      {
        [_xN]: _Eve,
        [_xF]: 1
      }
    ],
    [() => NotificationConfigurationFilter, 0]
  ]
];
var Transition = [3, n0, _Tra, 0, [_Da, _D, _SC], [5, 1, 0]];
var UpdateBucketMetadataInventoryTableConfigurationRequest = [
  3,
  n0,
  _UBMITCR,
  0,
  [_B, _CMD, _CA, _ITCn, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => InventoryTableConfigurationUpdates,
      {
        [_xN]: _ITCn,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var UpdateBucketMetadataJournalTableConfigurationRequest = [
  3,
  n0,
  _UBMJTCR,
  0,
  [_B, _CMD, _CA, _JTC, _EBO],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      () => JournalTableConfigurationUpdates,
      {
        [_xN]: _JTC,
        [_hP]: 1
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var UploadPartCopyOutput = [
  3,
  n0,
  _UPCO,
  0,
  [_CSVI, _CPR, _SSE, _SSECA, _SSECKMD, _SSEKMSKI, _BKE, _RC],
  [
    [
      0,
      {
        [_hH]: _xacsvi
      }
    ],
    [() => CopyPartResult, 16],
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var UploadPartCopyRequest = [
  3,
  n0,
  _UPCR,
  0,
  [
    _B,
    _CS,
    _CSIM,
    _CSIMS,
    _CSINM,
    _CSIUS,
    _CSRo,
    _K,
    _PN,
    _UI,
    _SSECA,
    _SSECK,
    _SSECKMD,
    _CSSSECA,
    _CSSSECK,
    _CSSSECKMD,
    _RP,
    _EBO,
    _ESBO
  ],
  [
    [0, 1],
    [
      0,
      {
        [_hH]: _xacs__
      }
    ],
    [
      0,
      {
        [_hH]: _xacsim
      }
    ],
    [
      4,
      {
        [_hH]: _xacsims
      }
    ],
    [
      0,
      {
        [_hH]: _xacsinm
      }
    ],
    [
      4,
      {
        [_hH]: _xacsius
      }
    ],
    [
      0,
      {
        [_hH]: _xacsr
      }
    ],
    [0, 1],
    [
      1,
      {
        [_hQ]: _pN
      }
    ],
    [
      0,
      {
        [_hQ]: _uI
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      0,
      {
        [_hH]: _xacssseca
      }
    ],
    [
      () => CopySourceSSECustomerKey,
      {
        [_hH]: _xacssseck
      }
    ],
    [
      0,
      {
        [_hH]: _xacssseckM
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ],
    [
      0,
      {
        [_hH]: _xasebo
      }
    ]
  ]
];
var UploadPartOutput = [
  3,
  n0,
  _UPO,
  0,
  [_SSE, _ET, _CCRC, _CCRCC, _CCRCNVME, _CSHA, _CSHAh, _SSECA, _SSECKMD, _SSEKMSKI, _BKE, _RC],
  [
    [
      0,
      {
        [_hH]: _xasse
      }
    ],
    [
      0,
      {
        [_hH]: _ET
      }
    ],
    [
      0,
      {
        [_hH]: _xacc
      }
    ],
    [
      0,
      {
        [_hH]: _xacc_
      }
    ],
    [
      0,
      {
        [_hH]: _xacc__
      }
    ],
    [
      0,
      {
        [_hH]: _xacs
      }
    ],
    [
      0,
      {
        [_hH]: _xacs_
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xasseakki
      }
    ],
    [
      2,
      {
        [_hH]: _xassebke
      }
    ],
    [
      0,
      {
        [_hH]: _xarc
      }
    ]
  ]
];
var UploadPartRequest = [
  3,
  n0,
  _UPR,
  0,
  [
    _Bo,
    _B,
    _CLo,
    _CMD,
    _CA,
    _CCRC,
    _CCRCC,
    _CCRCNVME,
    _CSHA,
    _CSHAh,
    _K,
    _PN,
    _UI,
    _SSECA,
    _SSECK,
    _SSECKMD,
    _RP,
    _EBO
  ],
  [
    [() => StreamingBlob, 16],
    [0, 1],
    [
      1,
      {
        [_hH]: _CL__
      }
    ],
    [
      0,
      {
        [_hH]: _CM
      }
    ],
    [
      0,
      {
        [_hH]: _xasca
      }
    ],
    [
      0,
      {
        [_hH]: _xacc
      }
    ],
    [
      0,
      {
        [_hH]: _xacc_
      }
    ],
    [
      0,
      {
        [_hH]: _xacc__
      }
    ],
    [
      0,
      {
        [_hH]: _xacs
      }
    ],
    [
      0,
      {
        [_hH]: _xacs_
      }
    ],
    [0, 1],
    [
      1,
      {
        [_hQ]: _pN
      }
    ],
    [
      0,
      {
        [_hQ]: _uI
      }
    ],
    [
      0,
      {
        [_hH]: _xasseca
      }
    ],
    [
      () => SSECustomerKey,
      {
        [_hH]: _xasseck
      }
    ],
    [
      0,
      {
        [_hH]: _xasseckM
      }
    ],
    [
      0,
      {
        [_hH]: _xarp
      }
    ],
    [
      0,
      {
        [_hH]: _xaebo
      }
    ]
  ]
];
var VersioningConfiguration = [
  3,
  n0,
  _VC,
  0,
  [_MFAD, _S],
  [
    [
      0,
      {
        [_xN]: _MDf
      }
    ],
    0
  ]
];
var WebsiteConfiguration = [
  3,
  n0,
  _WC,
  0,
  [_EDr, _IDn, _RART, _RR],
  [() => ErrorDocument, () => IndexDocument, () => RedirectAllRequestsTo, [() => RoutingRules, 0]]
];
var WriteGetObjectResponseRequest = [
  3,
  n0,
  _WGORR,
  0,
  [
    _RReq,
    _RTe,
    _Bo,
    _SCt,
    _ECr,
    _EM,
    _AR,
    _CC,
    _CDo,
    _CEo,
    _CL,
    _CLo,
    _CR,
    _CTo,
    _CCRC,
    _CCRCC,
    _CCRCNVME,
    _CSHA,
    _CSHAh,
    _DM,
    _ET,
    _Ex,
    _E,
    _LM,
    _MM,
    _M,
    _OLM,
    _OLLHS,
    _OLRUD,
    _PC,
    _RS,
    _RC,
    _Re,
    _SSE,
    _SSECA,
    _SSEKMSKI,
    _SSECKMD,
    _SC,
    _TC,
    _VI,
    _BKE
  ],
  [
    [
      0,
      {
        [_hL]: 1,
        [_hH]: _xarr
      }
    ],
    [
      0,
      {
        [_hH]: _xart
      }
    ],
    [() => StreamingBlob, 16],
    [
      1,
      {
        [_hH]: _xafs
      }
    ],
    [
      0,
      {
        [_hH]: _xafec
      }
    ],
    [
      0,
      {
        [_hH]: _xafem
      }
    ],
    [
      0,
      {
        [_hH]: _xafhar
      }
    ],
    [
      0,
      {
        [_hH]: _xafhCC
      }
    ],
    [
      0,
      {
        [_hH]: _xafhCD
      }
    ],
    [
      0,
      {
        [_hH]: _xafhCE
      }
    ],
    [
      0,
      {
        [_hH]: _xafhCL
      }
    ],
    [
      1,
      {
        [_hH]: _CL__
      }
    ],
    [
      0,
      {
        [_hH]: _xafhCR
      }
    ],
    [
      0,
      {
        [_hH]: _xafhCT
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxacc
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxacc_
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxacc__
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxacs
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxacs_
      }
    ],
    [
      2,
      {
        [_hH]: _xafhxadm
      }
    ],
    [
      0,
      {
        [_hH]: _xafhE
      }
    ],
    [
      4,
      {
        [_hH]: _xafhE_
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxae
      }
    ],
    [
      4,
      {
        [_hH]: _xafhLM
      }
    ],
    [
      1,
      {
        [_hH]: _xafhxamm
      }
    ],
    [
      128 | 0,
      {
        [_hPH]: _xam
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxaolm
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxaollh
      }
    ],
    [
      5,
      {
        [_hH]: _xafhxaolrud
      }
    ],
    [
      1,
      {
        [_hH]: _xafhxampc
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxars
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxarc
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxar
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxasse
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxasseca
      }
    ],
    [
      () => SSEKMSKeyId,
      {
        [_hH]: _xafhxasseakki
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxasseckM
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxasc
      }
    ],
    [
      1,
      {
        [_hH]: _xafhxatc
      }
    ],
    [
      0,
      {
        [_hH]: _xafhxavi
      }
    ],
    [
      2,
      {
        [_hH]: _xafhxassebke
      }
    ]
  ]
];
var __Unit = "unit";
var S3ServiceException2 = [-3, _sm, "S3ServiceException", 0, [], []];
TypeRegistry.for(_sm).registerError(S3ServiceException2, S3ServiceException);
var AllowedHeaders = 64 | 0;
var AllowedMethods = 64 | 0;
var AllowedOrigins = 64 | 0;
var AnalyticsConfigurationList = [1, n0, _ACLn, 0, [() => AnalyticsConfiguration, 0]];
var Buckets = [
  1,
  n0,
  _Bu,
  0,
  [
    () => Bucket,
    {
      [_xN]: _B
    }
  ]
];
var ChecksumAlgorithmList = 64 | 0;
var CommonPrefixList = [1, n0, _CPL, 0, () => CommonPrefix];
var CompletedPartList = [1, n0, _CPLo, 0, () => CompletedPart];
var CORSRules = [1, n0, _CORSR, 0, [() => CORSRule, 0]];
var DeletedObjects = [1, n0, _DOe, 0, () => DeletedObject];
var DeleteMarkers = [1, n0, _DMe, 0, () => DeleteMarkerEntry];
var Errors = [1, n0, _Er, 0, () => _Error];
var EventList = 64 | 0;
var ExposeHeaders = 64 | 0;
var FilterRuleList = [1, n0, _FRL, 0, () => FilterRule];
var Grants = [
  1,
  n0,
  _G,
  0,
  [
    () => Grant,
    {
      [_xN]: _Gr
    }
  ]
];
var IntelligentTieringConfigurationList = [
  1,
  n0,
  _ITCL,
  0,
  [() => IntelligentTieringConfiguration, 0]
];
var InventoryConfigurationList = [1, n0, _ICL, 0, [() => InventoryConfiguration, 0]];
var InventoryOptionalFields = [
  1,
  n0,
  _IOF,
  0,
  [
    0,
    {
      [_xN]: _Fi
    }
  ]
];
var LambdaFunctionConfigurationList = [
  1,
  n0,
  _LFCL,
  0,
  [() => LambdaFunctionConfiguration, 0]
];
var LifecycleRules = [1, n0, _LRi, 0, [() => LifecycleRule, 0]];
var MetricsConfigurationList = [1, n0, _MCL, 0, [() => MetricsConfiguration, 0]];
var MultipartUploadList = [1, n0, _MUL, 0, () => MultipartUpload];
var NoncurrentVersionTransitionList = [1, n0, _NVTL, 0, () => NoncurrentVersionTransition];
var ObjectAttributesList = 64 | 0;
var ObjectIdentifierList = [1, n0, _OIL, 0, () => ObjectIdentifier];
var ObjectList = [1, n0, _OLb, 0, [() => _Object, 0]];
var ObjectVersionList = [1, n0, _OVL, 0, [() => ObjectVersion, 0]];
var OptionalObjectAttributesList = 64 | 0;
var OwnershipControlsRules = [1, n0, _OCRw, 0, () => OwnershipControlsRule];
var Parts = [1, n0, _Pa, 0, () => Part];
var PartsList = [1, n0, _PL, 0, () => ObjectPart];
var QueueConfigurationList = [1, n0, _QCL, 0, [() => QueueConfiguration, 0]];
var ReplicationRules = [1, n0, _RRep, 0, [() => ReplicationRule, 0]];
var RoutingRules = [
  1,
  n0,
  _RR,
  0,
  [
    () => RoutingRule,
    {
      [_xN]: _RRo
    }
  ]
];
var ServerSideEncryptionRules = [1, n0, _SSERe, 0, [() => ServerSideEncryptionRule, 0]];
var TagSet = [
  1,
  n0,
  _TS,
  0,
  [
    () => Tag,
    {
      [_xN]: _Ta
    }
  ]
];
var TargetGrants = [
  1,
  n0,
  _TG,
  0,
  [
    () => TargetGrant,
    {
      [_xN]: _Gr
    }
  ]
];
var TieringList = [1, n0, _TL, 0, () => Tiering];
var TopicConfigurationList = [1, n0, _TCL, 0, [() => TopicConfiguration, 0]];
var TransitionList = [1, n0, _TLr, 0, () => Transition];
var UserMetadata = [
  1,
  n0,
  _UM,
  0,
  [
    () => MetadataEntry,
    {
      [_xN]: _ME
    }
  ]
];
var Metadata = 128 | 0;
var AnalyticsFilter = [
  3,
  n0,
  _AF,
  0,
  [_P, _Ta, _An],
  [0, () => Tag, [() => AnalyticsAndOperator, 0]]
];
var MetricsFilter = [
  3,
  n0,
  _MF,
  0,
  [_P, _Ta, _APAc, _An],
  [0, () => Tag, 0, [() => MetricsAndOperator, 0]]
];
var SelectObjectContentEventStream = [
  3,
  n0,
  _SOCES,
  {
    [_s2]: 1
  },
  [_Rec, _Sta, _Pr, _Cont, _End],
  [[() => RecordsEvent, 0], [() => StatsEvent, 0], [() => ProgressEvent, 0], () => ContinuationEvent, () => EndEvent]
];
var AbortMultipartUpload = [
  9,
  n0,
  _AMU,
  {
    [_h]: ["DELETE", "/{Key+}?x-id=AbortMultipartUpload", 204]
  },
  () => AbortMultipartUploadRequest,
  () => AbortMultipartUploadOutput
];
var CompleteMultipartUpload = [
  9,
  n0,
  _CMUo,
  {
    [_h]: ["POST", "/{Key+}", 200]
  },
  () => CompleteMultipartUploadRequest,
  () => CompleteMultipartUploadOutput
];
var CopyObject = [
  9,
  n0,
  _CO,
  {
    [_h]: ["PUT", "/{Key+}?x-id=CopyObject", 200]
  },
  () => CopyObjectRequest,
  () => CopyObjectOutput
];
var CreateBucket = [
  9,
  n0,
  _CB,
  {
    [_h]: ["PUT", "/", 200]
  },
  () => CreateBucketRequest,
  () => CreateBucketOutput
];
var CreateBucketMetadataConfiguration = [
  9,
  n0,
  _CBMC,
  {
    [_h]: ["POST", "/?metadataConfiguration", 200]
  },
  () => CreateBucketMetadataConfigurationRequest,
  () => __Unit
];
var CreateBucketMetadataTableConfiguration = [
  9,
  n0,
  _CBMTC,
  {
    [_h]: ["POST", "/?metadataTable", 200]
  },
  () => CreateBucketMetadataTableConfigurationRequest,
  () => __Unit
];
var CreateMultipartUpload = [
  9,
  n0,
  _CMUr,
  {
    [_h]: ["POST", "/{Key+}?uploads", 200]
  },
  () => CreateMultipartUploadRequest,
  () => CreateMultipartUploadOutput
];
var CreateSession = [
  9,
  n0,
  _CSr,
  {
    [_h]: ["GET", "/?session", 200]
  },
  () => CreateSessionRequest,
  () => CreateSessionOutput
];
var DeleteBucket = [
  9,
  n0,
  _DB,
  {
    [_h]: ["DELETE", "/", 204]
  },
  () => DeleteBucketRequest,
  () => __Unit
];
var DeleteBucketAnalyticsConfiguration = [
  9,
  n0,
  _DBAC,
  {
    [_h]: ["DELETE", "/?analytics", 204]
  },
  () => DeleteBucketAnalyticsConfigurationRequest,
  () => __Unit
];
var DeleteBucketCors = [
  9,
  n0,
  _DBC,
  {
    [_h]: ["DELETE", "/?cors", 204]
  },
  () => DeleteBucketCorsRequest,
  () => __Unit
];
var DeleteBucketEncryption = [
  9,
  n0,
  _DBE,
  {
    [_h]: ["DELETE", "/?encryption", 204]
  },
  () => DeleteBucketEncryptionRequest,
  () => __Unit
];
var DeleteBucketIntelligentTieringConfiguration = [
  9,
  n0,
  _DBITC,
  {
    [_h]: ["DELETE", "/?intelligent-tiering", 204]
  },
  () => DeleteBucketIntelligentTieringConfigurationRequest,
  () => __Unit
];
var DeleteBucketInventoryConfiguration = [
  9,
  n0,
  _DBIC,
  {
    [_h]: ["DELETE", "/?inventory", 204]
  },
  () => DeleteBucketInventoryConfigurationRequest,
  () => __Unit
];
var DeleteBucketLifecycle = [
  9,
  n0,
  _DBL,
  {
    [_h]: ["DELETE", "/?lifecycle", 204]
  },
  () => DeleteBucketLifecycleRequest,
  () => __Unit
];
var DeleteBucketMetadataConfiguration = [
  9,
  n0,
  _DBMC,
  {
    [_h]: ["DELETE", "/?metadataConfiguration", 204]
  },
  () => DeleteBucketMetadataConfigurationRequest,
  () => __Unit
];
var DeleteBucketMetadataTableConfiguration = [
  9,
  n0,
  _DBMTC,
  {
    [_h]: ["DELETE", "/?metadataTable", 204]
  },
  () => DeleteBucketMetadataTableConfigurationRequest,
  () => __Unit
];
var DeleteBucketMetricsConfiguration = [
  9,
  n0,
  _DBMCe,
  {
    [_h]: ["DELETE", "/?metrics", 204]
  },
  () => DeleteBucketMetricsConfigurationRequest,
  () => __Unit
];
var DeleteBucketOwnershipControls = [
  9,
  n0,
  _DBOC,
  {
    [_h]: ["DELETE", "/?ownershipControls", 204]
  },
  () => DeleteBucketOwnershipControlsRequest,
  () => __Unit
];
var DeleteBucketPolicy = [
  9,
  n0,
  _DBP,
  {
    [_h]: ["DELETE", "/?policy", 204]
  },
  () => DeleteBucketPolicyRequest,
  () => __Unit
];
var DeleteBucketReplication = [
  9,
  n0,
  _DBRe,
  {
    [_h]: ["DELETE", "/?replication", 204]
  },
  () => DeleteBucketReplicationRequest,
  () => __Unit
];
var DeleteBucketTagging = [
  9,
  n0,
  _DBT,
  {
    [_h]: ["DELETE", "/?tagging", 204]
  },
  () => DeleteBucketTaggingRequest,
  () => __Unit
];
var DeleteBucketWebsite = [
  9,
  n0,
  _DBW,
  {
    [_h]: ["DELETE", "/?website", 204]
  },
  () => DeleteBucketWebsiteRequest,
  () => __Unit
];
var DeleteObject = [
  9,
  n0,
  _DOel,
  {
    [_h]: ["DELETE", "/{Key+}?x-id=DeleteObject", 204]
  },
  () => DeleteObjectRequest,
  () => DeleteObjectOutput
];
var DeleteObjects = [
  9,
  n0,
  _DOele,
  {
    [_h]: ["POST", "/?delete", 200]
  },
  () => DeleteObjectsRequest,
  () => DeleteObjectsOutput
];
var DeleteObjectTagging = [
  9,
  n0,
  _DOT,
  {
    [_h]: ["DELETE", "/{Key+}?tagging", 204]
  },
  () => DeleteObjectTaggingRequest,
  () => DeleteObjectTaggingOutput
];
var DeletePublicAccessBlock = [
  9,
  n0,
  _DPAB,
  {
    [_h]: ["DELETE", "/?publicAccessBlock", 204]
  },
  () => DeletePublicAccessBlockRequest,
  () => __Unit
];
var GetBucketAccelerateConfiguration = [
  9,
  n0,
  _GBAC,
  {
    [_h]: ["GET", "/?accelerate", 200]
  },
  () => GetBucketAccelerateConfigurationRequest,
  () => GetBucketAccelerateConfigurationOutput
];
var GetBucketAcl = [
  9,
  n0,
  _GBA,
  {
    [_h]: ["GET", "/?acl", 200]
  },
  () => GetBucketAclRequest,
  () => GetBucketAclOutput
];
var GetBucketAnalyticsConfiguration = [
  9,
  n0,
  _GBACe,
  {
    [_h]: ["GET", "/?analytics&x-id=GetBucketAnalyticsConfiguration", 200]
  },
  () => GetBucketAnalyticsConfigurationRequest,
  () => GetBucketAnalyticsConfigurationOutput
];
var GetBucketCors = [
  9,
  n0,
  _GBC,
  {
    [_h]: ["GET", "/?cors", 200]
  },
  () => GetBucketCorsRequest,
  () => GetBucketCorsOutput
];
var GetBucketEncryption = [
  9,
  n0,
  _GBE,
  {
    [_h]: ["GET", "/?encryption", 200]
  },
  () => GetBucketEncryptionRequest,
  () => GetBucketEncryptionOutput
];
var GetBucketIntelligentTieringConfiguration = [
  9,
  n0,
  _GBITC,
  {
    [_h]: ["GET", "/?intelligent-tiering&x-id=GetBucketIntelligentTieringConfiguration", 200]
  },
  () => GetBucketIntelligentTieringConfigurationRequest,
  () => GetBucketIntelligentTieringConfigurationOutput
];
var GetBucketInventoryConfiguration = [
  9,
  n0,
  _GBIC,
  {
    [_h]: ["GET", "/?inventory&x-id=GetBucketInventoryConfiguration", 200]
  },
  () => GetBucketInventoryConfigurationRequest,
  () => GetBucketInventoryConfigurationOutput
];
var GetBucketLifecycleConfiguration = [
  9,
  n0,
  _GBLC,
  {
    [_h]: ["GET", "/?lifecycle", 200]
  },
  () => GetBucketLifecycleConfigurationRequest,
  () => GetBucketLifecycleConfigurationOutput
];
var GetBucketLocation = [
  9,
  n0,
  _GBL,
  {
    [_h]: ["GET", "/?location", 200]
  },
  () => GetBucketLocationRequest,
  () => GetBucketLocationOutput
];
var GetBucketLogging = [
  9,
  n0,
  _GBLe,
  {
    [_h]: ["GET", "/?logging", 200]
  },
  () => GetBucketLoggingRequest,
  () => GetBucketLoggingOutput
];
var GetBucketMetadataConfiguration = [
  9,
  n0,
  _GBMC,
  {
    [_h]: ["GET", "/?metadataConfiguration", 200]
  },
  () => GetBucketMetadataConfigurationRequest,
  () => GetBucketMetadataConfigurationOutput
];
var GetBucketMetadataTableConfiguration = [
  9,
  n0,
  _GBMTC,
  {
    [_h]: ["GET", "/?metadataTable", 200]
  },
  () => GetBucketMetadataTableConfigurationRequest,
  () => GetBucketMetadataTableConfigurationOutput
];
var GetBucketMetricsConfiguration = [
  9,
  n0,
  _GBMCe,
  {
    [_h]: ["GET", "/?metrics&x-id=GetBucketMetricsConfiguration", 200]
  },
  () => GetBucketMetricsConfigurationRequest,
  () => GetBucketMetricsConfigurationOutput
];
var GetBucketNotificationConfiguration = [
  9,
  n0,
  _GBNC,
  {
    [_h]: ["GET", "/?notification", 200]
  },
  () => GetBucketNotificationConfigurationRequest,
  () => NotificationConfiguration
];
var GetBucketOwnershipControls = [
  9,
  n0,
  _GBOC,
  {
    [_h]: ["GET", "/?ownershipControls", 200]
  },
  () => GetBucketOwnershipControlsRequest,
  () => GetBucketOwnershipControlsOutput
];
var GetBucketPolicy = [
  9,
  n0,
  _GBP,
  {
    [_h]: ["GET", "/?policy", 200]
  },
  () => GetBucketPolicyRequest,
  () => GetBucketPolicyOutput
];
var GetBucketPolicyStatus = [
  9,
  n0,
  _GBPS,
  {
    [_h]: ["GET", "/?policyStatus", 200]
  },
  () => GetBucketPolicyStatusRequest,
  () => GetBucketPolicyStatusOutput
];
var GetBucketReplication = [
  9,
  n0,
  _GBR,
  {
    [_h]: ["GET", "/?replication", 200]
  },
  () => GetBucketReplicationRequest,
  () => GetBucketReplicationOutput
];
var GetBucketRequestPayment = [
  9,
  n0,
  _GBRP,
  {
    [_h]: ["GET", "/?requestPayment", 200]
  },
  () => GetBucketRequestPaymentRequest,
  () => GetBucketRequestPaymentOutput
];
var GetBucketTagging = [
  9,
  n0,
  _GBT,
  {
    [_h]: ["GET", "/?tagging", 200]
  },
  () => GetBucketTaggingRequest,
  () => GetBucketTaggingOutput
];
var GetBucketVersioning = [
  9,
  n0,
  _GBV,
  {
    [_h]: ["GET", "/?versioning", 200]
  },
  () => GetBucketVersioningRequest,
  () => GetBucketVersioningOutput
];
var GetBucketWebsite = [
  9,
  n0,
  _GBW,
  {
    [_h]: ["GET", "/?website", 200]
  },
  () => GetBucketWebsiteRequest,
  () => GetBucketWebsiteOutput
];
var GetObject = [
  9,
  n0,
  _GO,
  {
    [_h]: ["GET", "/{Key+}?x-id=GetObject", 200]
  },
  () => GetObjectRequest,
  () => GetObjectOutput
];
var GetObjectAcl = [
  9,
  n0,
  _GOA,
  {
    [_h]: ["GET", "/{Key+}?acl", 200]
  },
  () => GetObjectAclRequest,
  () => GetObjectAclOutput
];
var GetObjectAttributes = [
  9,
  n0,
  _GOAe,
  {
    [_h]: ["GET", "/{Key+}?attributes", 200]
  },
  () => GetObjectAttributesRequest,
  () => GetObjectAttributesOutput
];
var GetObjectLegalHold = [
  9,
  n0,
  _GOLH,
  {
    [_h]: ["GET", "/{Key+}?legal-hold", 200]
  },
  () => GetObjectLegalHoldRequest,
  () => GetObjectLegalHoldOutput
];
var GetObjectLockConfiguration = [
  9,
  n0,
  _GOLC,
  {
    [_h]: ["GET", "/?object-lock", 200]
  },
  () => GetObjectLockConfigurationRequest,
  () => GetObjectLockConfigurationOutput
];
var GetObjectRetention = [
  9,
  n0,
  _GORe,
  {
    [_h]: ["GET", "/{Key+}?retention", 200]
  },
  () => GetObjectRetentionRequest,
  () => GetObjectRetentionOutput
];
var GetObjectTagging = [
  9,
  n0,
  _GOT,
  {
    [_h]: ["GET", "/{Key+}?tagging", 200]
  },
  () => GetObjectTaggingRequest,
  () => GetObjectTaggingOutput
];
var GetObjectTorrent = [
  9,
  n0,
  _GOTe,
  {
    [_h]: ["GET", "/{Key+}?torrent", 200]
  },
  () => GetObjectTorrentRequest,
  () => GetObjectTorrentOutput
];
var GetPublicAccessBlock = [
  9,
  n0,
  _GPAB,
  {
    [_h]: ["GET", "/?publicAccessBlock", 200]
  },
  () => GetPublicAccessBlockRequest,
  () => GetPublicAccessBlockOutput
];
var HeadBucket = [
  9,
  n0,
  _HB,
  {
    [_h]: ["HEAD", "/", 200]
  },
  () => HeadBucketRequest,
  () => HeadBucketOutput
];
var HeadObject = [
  9,
  n0,
  _HO,
  {
    [_h]: ["HEAD", "/{Key+}", 200]
  },
  () => HeadObjectRequest,
  () => HeadObjectOutput
];
var ListBucketAnalyticsConfigurations = [
  9,
  n0,
  _LBAC,
  {
    [_h]: ["GET", "/?analytics&x-id=ListBucketAnalyticsConfigurations", 200]
  },
  () => ListBucketAnalyticsConfigurationsRequest,
  () => ListBucketAnalyticsConfigurationsOutput
];
var ListBucketIntelligentTieringConfigurations = [
  9,
  n0,
  _LBITC,
  {
    [_h]: ["GET", "/?intelligent-tiering&x-id=ListBucketIntelligentTieringConfigurations", 200]
  },
  () => ListBucketIntelligentTieringConfigurationsRequest,
  () => ListBucketIntelligentTieringConfigurationsOutput
];
var ListBucketInventoryConfigurations = [
  9,
  n0,
  _LBIC,
  {
    [_h]: ["GET", "/?inventory&x-id=ListBucketInventoryConfigurations", 200]
  },
  () => ListBucketInventoryConfigurationsRequest,
  () => ListBucketInventoryConfigurationsOutput
];
var ListBucketMetricsConfigurations = [
  9,
  n0,
  _LBMC,
  {
    [_h]: ["GET", "/?metrics&x-id=ListBucketMetricsConfigurations", 200]
  },
  () => ListBucketMetricsConfigurationsRequest,
  () => ListBucketMetricsConfigurationsOutput
];
var ListBuckets = [
  9,
  n0,
  _LB,
  {
    [_h]: ["GET", "/?x-id=ListBuckets", 200]
  },
  () => ListBucketsRequest,
  () => ListBucketsOutput
];
var ListDirectoryBuckets = [
  9,
  n0,
  _LDB,
  {
    [_h]: ["GET", "/?x-id=ListDirectoryBuckets", 200]
  },
  () => ListDirectoryBucketsRequest,
  () => ListDirectoryBucketsOutput
];
var ListMultipartUploads = [
  9,
  n0,
  _LMU,
  {
    [_h]: ["GET", "/?uploads", 200]
  },
  () => ListMultipartUploadsRequest,
  () => ListMultipartUploadsOutput
];
var ListObjects = [
  9,
  n0,
  _LO,
  {
    [_h]: ["GET", "/", 200]
  },
  () => ListObjectsRequest,
  () => ListObjectsOutput
];
var ListObjectsV2 = [
  9,
  n0,
  _LOV,
  {
    [_h]: ["GET", "/?list-type=2", 200]
  },
  () => ListObjectsV2Request,
  () => ListObjectsV2Output
];
var ListObjectVersions = [
  9,
  n0,
  _LOVi,
  {
    [_h]: ["GET", "/?versions", 200]
  },
  () => ListObjectVersionsRequest,
  () => ListObjectVersionsOutput
];
var ListParts = [
  9,
  n0,
  _LP,
  {
    [_h]: ["GET", "/{Key+}?x-id=ListParts", 200]
  },
  () => ListPartsRequest,
  () => ListPartsOutput
];
var PutBucketAccelerateConfiguration = [
  9,
  n0,
  _PBAC,
  {
    [_h]: ["PUT", "/?accelerate", 200]
  },
  () => PutBucketAccelerateConfigurationRequest,
  () => __Unit
];
var PutBucketAcl = [
  9,
  n0,
  _PBA,
  {
    [_h]: ["PUT", "/?acl", 200]
  },
  () => PutBucketAclRequest,
  () => __Unit
];
var PutBucketAnalyticsConfiguration = [
  9,
  n0,
  _PBACu,
  {
    [_h]: ["PUT", "/?analytics", 200]
  },
  () => PutBucketAnalyticsConfigurationRequest,
  () => __Unit
];
var PutBucketCors = [
  9,
  n0,
  _PBC,
  {
    [_h]: ["PUT", "/?cors", 200]
  },
  () => PutBucketCorsRequest,
  () => __Unit
];
var PutBucketEncryption = [
  9,
  n0,
  _PBE,
  {
    [_h]: ["PUT", "/?encryption", 200]
  },
  () => PutBucketEncryptionRequest,
  () => __Unit
];
var PutBucketIntelligentTieringConfiguration = [
  9,
  n0,
  _PBITC,
  {
    [_h]: ["PUT", "/?intelligent-tiering", 200]
  },
  () => PutBucketIntelligentTieringConfigurationRequest,
  () => __Unit
];
var PutBucketInventoryConfiguration = [
  9,
  n0,
  _PBIC,
  {
    [_h]: ["PUT", "/?inventory", 200]
  },
  () => PutBucketInventoryConfigurationRequest,
  () => __Unit
];
var PutBucketLifecycleConfiguration = [
  9,
  n0,
  _PBLC,
  {
    [_h]: ["PUT", "/?lifecycle", 200]
  },
  () => PutBucketLifecycleConfigurationRequest,
  () => PutBucketLifecycleConfigurationOutput
];
var PutBucketLogging = [
  9,
  n0,
  _PBL,
  {
    [_h]: ["PUT", "/?logging", 200]
  },
  () => PutBucketLoggingRequest,
  () => __Unit
];
var PutBucketMetricsConfiguration = [
  9,
  n0,
  _PBMC,
  {
    [_h]: ["PUT", "/?metrics", 200]
  },
  () => PutBucketMetricsConfigurationRequest,
  () => __Unit
];
var PutBucketNotificationConfiguration = [
  9,
  n0,
  _PBNC,
  {
    [_h]: ["PUT", "/?notification", 200]
  },
  () => PutBucketNotificationConfigurationRequest,
  () => __Unit
];
var PutBucketOwnershipControls = [
  9,
  n0,
  _PBOC,
  {
    [_h]: ["PUT", "/?ownershipControls", 200]
  },
  () => PutBucketOwnershipControlsRequest,
  () => __Unit
];
var PutBucketPolicy = [
  9,
  n0,
  _PBP,
  {
    [_h]: ["PUT", "/?policy", 200]
  },
  () => PutBucketPolicyRequest,
  () => __Unit
];
var PutBucketReplication = [
  9,
  n0,
  _PBR,
  {
    [_h]: ["PUT", "/?replication", 200]
  },
  () => PutBucketReplicationRequest,
  () => __Unit
];
var PutBucketRequestPayment = [
  9,
  n0,
  _PBRP,
  {
    [_h]: ["PUT", "/?requestPayment", 200]
  },
  () => PutBucketRequestPaymentRequest,
  () => __Unit
];
var PutBucketTagging = [
  9,
  n0,
  _PBT,
  {
    [_h]: ["PUT", "/?tagging", 200]
  },
  () => PutBucketTaggingRequest,
  () => __Unit
];
var PutBucketVersioning = [
  9,
  n0,
  _PBV,
  {
    [_h]: ["PUT", "/?versioning", 200]
  },
  () => PutBucketVersioningRequest,
  () => __Unit
];
var PutBucketWebsite = [
  9,
  n0,
  _PBW,
  {
    [_h]: ["PUT", "/?website", 200]
  },
  () => PutBucketWebsiteRequest,
  () => __Unit
];
var PutObject = [
  9,
  n0,
  _PO,
  {
    [_h]: ["PUT", "/{Key+}?x-id=PutObject", 200]
  },
  () => PutObjectRequest,
  () => PutObjectOutput
];
var PutObjectAcl = [
  9,
  n0,
  _POA,
  {
    [_h]: ["PUT", "/{Key+}?acl", 200]
  },
  () => PutObjectAclRequest,
  () => PutObjectAclOutput
];
var PutObjectLegalHold = [
  9,
  n0,
  _POLH,
  {
    [_h]: ["PUT", "/{Key+}?legal-hold", 200]
  },
  () => PutObjectLegalHoldRequest,
  () => PutObjectLegalHoldOutput
];
var PutObjectLockConfiguration = [
  9,
  n0,
  _POLC,
  {
    [_h]: ["PUT", "/?object-lock", 200]
  },
  () => PutObjectLockConfigurationRequest,
  () => PutObjectLockConfigurationOutput
];
var PutObjectRetention = [
  9,
  n0,
  _PORu,
  {
    [_h]: ["PUT", "/{Key+}?retention", 200]
  },
  () => PutObjectRetentionRequest,
  () => PutObjectRetentionOutput
];
var PutObjectTagging = [
  9,
  n0,
  _POT,
  {
    [_h]: ["PUT", "/{Key+}?tagging", 200]
  },
  () => PutObjectTaggingRequest,
  () => PutObjectTaggingOutput
];
var PutPublicAccessBlock = [
  9,
  n0,
  _PPAB,
  {
    [_h]: ["PUT", "/?publicAccessBlock", 200]
  },
  () => PutPublicAccessBlockRequest,
  () => __Unit
];
var RenameObject = [
  9,
  n0,
  _RO,
  {
    [_h]: ["PUT", "/{Key+}?renameObject", 200]
  },
  () => RenameObjectRequest,
  () => RenameObjectOutput
];
var RestoreObject = [
  9,
  n0,
  _ROe,
  {
    [_h]: ["POST", "/{Key+}?restore", 200]
  },
  () => RestoreObjectRequest,
  () => RestoreObjectOutput
];
var SelectObjectContent = [
  9,
  n0,
  _SOC,
  {
    [_h]: ["POST", "/{Key+}?select&select-type=2", 200]
  },
  () => SelectObjectContentRequest,
  () => SelectObjectContentOutput
];
var UpdateBucketMetadataInventoryTableConfiguration = [
  9,
  n0,
  _UBMITC,
  {
    [_h]: ["PUT", "/?metadataInventoryTable", 200]
  },
  () => UpdateBucketMetadataInventoryTableConfigurationRequest,
  () => __Unit
];
var UpdateBucketMetadataJournalTableConfiguration = [
  9,
  n0,
  _UBMJTC,
  {
    [_h]: ["PUT", "/?metadataJournalTable", 200]
  },
  () => UpdateBucketMetadataJournalTableConfigurationRequest,
  () => __Unit
];
var UploadPart = [
  9,
  n0,
  _UP,
  {
    [_h]: ["PUT", "/{Key+}?x-id=UploadPart", 200]
  },
  () => UploadPartRequest,
  () => UploadPartOutput
];
var UploadPartCopy = [
  9,
  n0,
  _UPC,
  {
    [_h]: ["PUT", "/{Key+}?x-id=UploadPartCopy", 200]
  },
  () => UploadPartCopyRequest,
  () => UploadPartCopyOutput
];
var WriteGetObjectResponse = [
  9,
  n0,
  _WGOR,
  {
    [_en]: ["{RequestRoute}."],
    [_h]: ["POST", "/WriteGetObjectResponse", 200]
  },
  () => WriteGetObjectResponseRequest,
  () => __Unit
];

// node_modules/@aws-sdk/client-s3/dist-es/commands/CreateSessionCommand.js
var CreateSessionCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  DisableS3ExpressSessionAuth: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs3, config, o2) {
  return [getEndpointPlugin(config, Command2.getEndpointParameterInstructions()), getThrow200ExceptionsPlugin(config)];
}).s("AmazonS3", "CreateSession", {}).n("S3Client", "CreateSessionCommand").sc(CreateSession).build() {
};
__name(CreateSessionCommand, "CreateSessionCommand");

// node_modules/@aws-sdk/client-s3/dist-es/runtimeConfig.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/client-s3/package.json
var package_default = {
  name: "@aws-sdk/client-s3",
  description: "AWS SDK for JavaScript S3 Client for Node.js, Browser and React Native",
  version: "3.933.0",
  scripts: {
    build: "concurrently 'yarn:build:cjs' 'yarn:build:es' 'yarn:build:types'",
    "build:cjs": "node ../../scripts/compilation/inline client-s3",
    "build:es": "tsc -p tsconfig.es.json",
    "build:include:deps": "lerna run --scope $npm_package_name --include-dependencies build",
    "build:types": "tsc -p tsconfig.types.json",
    "build:types:downlevel": "downlevel-dts dist-types dist-types/ts3.4",
    clean: "rimraf ./dist-* && rimraf *.tsbuildinfo",
    "extract:docs": "api-extractor run --local",
    "generate:client": "node ../../scripts/generate-clients/single-service --solo s3",
    test: "yarn g:vitest run",
    "test:browser": "node ./test/browser-build/esbuild && yarn g:vitest run -c vitest.config.browser.mts",
    "test:browser:watch": "node ./test/browser-build/esbuild && yarn g:vitest watch -c vitest.config.browser.mts",
    "test:e2e": "yarn g:vitest run -c vitest.config.e2e.mts && yarn test:browser",
    "test:e2e:watch": "yarn g:vitest watch -c vitest.config.e2e.mts",
    "test:integration": "yarn g:vitest run -c vitest.config.integ.mts",
    "test:integration:watch": "yarn g:vitest watch -c vitest.config.integ.mts",
    "test:watch": "yarn g:vitest watch"
  },
  main: "./dist-cjs/index.js",
  types: "./dist-types/index.d.ts",
  module: "./dist-es/index.js",
  sideEffects: false,
  dependencies: {
    "@aws-crypto/sha1-browser": "5.2.0",
    "@aws-crypto/sha256-browser": "5.2.0",
    "@aws-crypto/sha256-js": "5.2.0",
    "@aws-sdk/core": "3.932.0",
    "@aws-sdk/credential-provider-node": "3.933.0",
    "@aws-sdk/middleware-bucket-endpoint": "3.930.0",
    "@aws-sdk/middleware-expect-continue": "3.930.0",
    "@aws-sdk/middleware-flexible-checksums": "3.932.0",
    "@aws-sdk/middleware-host-header": "3.930.0",
    "@aws-sdk/middleware-location-constraint": "3.930.0",
    "@aws-sdk/middleware-logger": "3.930.0",
    "@aws-sdk/middleware-recursion-detection": "3.933.0",
    "@aws-sdk/middleware-sdk-s3": "3.932.0",
    "@aws-sdk/middleware-ssec": "3.930.0",
    "@aws-sdk/middleware-user-agent": "3.932.0",
    "@aws-sdk/region-config-resolver": "3.930.0",
    "@aws-sdk/signature-v4-multi-region": "3.932.0",
    "@aws-sdk/types": "3.930.0",
    "@aws-sdk/util-endpoints": "3.930.0",
    "@aws-sdk/util-user-agent-browser": "3.930.0",
    "@aws-sdk/util-user-agent-node": "3.932.0",
    "@smithy/config-resolver": "^4.4.3",
    "@smithy/core": "^3.18.2",
    "@smithy/eventstream-serde-browser": "^4.2.5",
    "@smithy/eventstream-serde-config-resolver": "^4.3.5",
    "@smithy/eventstream-serde-node": "^4.2.5",
    "@smithy/fetch-http-handler": "^5.3.6",
    "@smithy/hash-blob-browser": "^4.2.6",
    "@smithy/hash-node": "^4.2.5",
    "@smithy/hash-stream-node": "^4.2.5",
    "@smithy/invalid-dependency": "^4.2.5",
    "@smithy/md5-js": "^4.2.5",
    "@smithy/middleware-content-length": "^4.2.5",
    "@smithy/middleware-endpoint": "^4.3.9",
    "@smithy/middleware-retry": "^4.4.9",
    "@smithy/middleware-serde": "^4.2.5",
    "@smithy/middleware-stack": "^4.2.5",
    "@smithy/node-config-provider": "^4.3.5",
    "@smithy/node-http-handler": "^4.4.5",
    "@smithy/protocol-http": "^5.3.5",
    "@smithy/smithy-client": "^4.9.5",
    "@smithy/types": "^4.9.0",
    "@smithy/url-parser": "^4.2.5",
    "@smithy/util-base64": "^4.3.0",
    "@smithy/util-body-length-browser": "^4.2.0",
    "@smithy/util-body-length-node": "^4.2.1",
    "@smithy/util-defaults-mode-browser": "^4.3.8",
    "@smithy/util-defaults-mode-node": "^4.2.11",
    "@smithy/util-endpoints": "^3.2.5",
    "@smithy/util-middleware": "^4.2.5",
    "@smithy/util-retry": "^4.2.5",
    "@smithy/util-stream": "^4.5.6",
    "@smithy/util-utf8": "^4.2.0",
    "@smithy/util-waiter": "^4.2.5",
    tslib: "^2.6.2"
  },
  devDependencies: {
    "@aws-sdk/signature-v4-crt": "3.932.0",
    "@tsconfig/node18": "18.2.4",
    "@types/node": "^18.19.69",
    concurrently: "7.0.0",
    "downlevel-dts": "0.10.1",
    rimraf: "3.0.2",
    typescript: "~5.8.3"
  },
  engines: {
    node: ">=18.0.0"
  },
  typesVersions: {
    "<4.0": {
      "dist-types/*": [
        "dist-types/ts3.4/*"
      ]
    }
  },
  files: [
    "dist-*/**"
  ],
  author: {
    name: "AWS SDK for JavaScript Team",
    url: "https://aws.amazon.com/javascript/"
  },
  license: "Apache-2.0",
  browser: {
    "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.browser"
  },
  "react-native": {
    "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.native"
  },
  homepage: "https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-s3",
  repository: {
    type: "git",
    url: "https://github.com/aws/aws-sdk-js-v3.git",
    directory: "clients/client-s3"
  }
};

// node_modules/@aws-crypto/sha1-browser/build/module/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha1-browser/build/module/crossPlatformSha1.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha1-browser/build/module/webCryptoSha1.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/util-utf8/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/util-utf8/dist-es/fromUtf8.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var fromUtf84 = /* @__PURE__ */ __name((input) => new TextEncoder().encode(input), "fromUtf8");

// node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/util-utf8/dist-es/toUtf8.browser.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha1-browser/build/module/isEmptyData.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function isEmptyData2(data) {
  if (typeof data === "string") {
    return data.length === 0;
  }
  return data.byteLength === 0;
}
__name(isEmptyData2, "isEmptyData");

// node_modules/@aws-crypto/sha1-browser/build/module/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var SHA_1_HASH = { name: "SHA-1" };
var SHA_1_HMAC_ALGO = {
  name: "HMAC",
  hash: SHA_1_HASH
};
var EMPTY_DATA_SHA_1 = new Uint8Array([
  218,
  57,
  163,
  238,
  94,
  107,
  75,
  13,
  50,
  85,
  191,
  239,
  149,
  96,
  24,
  144,
  175,
  216,
  7,
  9
]);

// node_modules/@aws-sdk/util-locate-window/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var fallbackWindow = {};
function locateWindow() {
  if (typeof window !== "undefined") {
    return window;
  } else if (typeof self !== "undefined") {
    return self;
  }
  return fallbackWindow;
}
__name(locateWindow, "locateWindow");

// node_modules/@aws-crypto/sha1-browser/build/module/webCryptoSha1.js
var Sha1 = (
  /** @class */
  function() {
    function Sha13(secret) {
      this.toHash = new Uint8Array(0);
      if (secret !== void 0) {
        this.key = new Promise(function(resolve, reject) {
          locateWindow().crypto.subtle.importKey("raw", convertToBuffer2(secret), SHA_1_HMAC_ALGO, false, ["sign"]).then(resolve, reject);
        });
        this.key.catch(function() {
        });
      }
    }
    __name(Sha13, "Sha1");
    Sha13.prototype.update = function(data) {
      if (isEmptyData2(data)) {
        return;
      }
      var update = convertToBuffer2(data);
      var typedArray = new Uint8Array(this.toHash.byteLength + update.byteLength);
      typedArray.set(this.toHash, 0);
      typedArray.set(update, this.toHash.byteLength);
      this.toHash = typedArray;
    };
    Sha13.prototype.digest = function() {
      var _this = this;
      if (this.key) {
        return this.key.then(function(key) {
          return locateWindow().crypto.subtle.sign(SHA_1_HMAC_ALGO, key, _this.toHash).then(function(data) {
            return new Uint8Array(data);
          });
        });
      }
      if (isEmptyData2(this.toHash)) {
        return Promise.resolve(EMPTY_DATA_SHA_1);
      }
      return Promise.resolve().then(function() {
        return locateWindow().crypto.subtle.digest(SHA_1_HASH, _this.toHash);
      }).then(function(data) {
        return Promise.resolve(new Uint8Array(data));
      });
    };
    Sha13.prototype.reset = function() {
      this.toHash = new Uint8Array(0);
    };
    return Sha13;
  }()
);
function convertToBuffer2(data) {
  if (typeof data === "string") {
    return fromUtf84(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
  }
  return new Uint8Array(data);
}
__name(convertToBuffer2, "convertToBuffer");

// node_modules/@aws-crypto/supports-web-crypto/build/module/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/supports-web-crypto/build/module/supportsWebCrypto.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var subtleCryptoMethods = [
  "decrypt",
  "digest",
  "encrypt",
  "exportKey",
  "generateKey",
  "importKey",
  "sign",
  "verify"
];
function supportsWebCrypto(window2) {
  if (supportsSecureRandom(window2) && typeof window2.crypto.subtle === "object") {
    var subtle = window2.crypto.subtle;
    return supportsSubtleCrypto(subtle);
  }
  return false;
}
__name(supportsWebCrypto, "supportsWebCrypto");
function supportsSecureRandom(window2) {
  if (typeof window2 === "object" && typeof window2.crypto === "object") {
    var getRandomValues = window2.crypto.getRandomValues;
    return typeof getRandomValues === "function";
  }
  return false;
}
__name(supportsSecureRandom, "supportsSecureRandom");
function supportsSubtleCrypto(subtle) {
  return subtle && subtleCryptoMethods.every(function(methodName) {
    return typeof subtle[methodName] === "function";
  });
}
__name(supportsSubtleCrypto, "supportsSubtleCrypto");

// node_modules/@aws-crypto/sha1-browser/build/module/crossPlatformSha1.js
var Sha12 = (
  /** @class */
  function() {
    function Sha13(secret) {
      if (supportsWebCrypto(locateWindow())) {
        this.hash = new Sha1(secret);
      } else {
        throw new Error("SHA1 not supported");
      }
    }
    __name(Sha13, "Sha1");
    Sha13.prototype.update = function(data, encoding) {
      this.hash.update(convertToBuffer(data));
    };
    Sha13.prototype.digest = function() {
      return this.hash.digest();
    };
    Sha13.prototype.reset = function() {
      this.hash.reset();
    };
    return Sha13;
  }()
);

// node_modules/@aws-crypto/sha256-browser/build/module/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha256-browser/build/module/crossPlatformSha256.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha256-browser/build/module/webCryptoSha256.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha256-browser/build/module/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var SHA_256_HASH = { name: "SHA-256" };
var SHA_256_HMAC_ALGO = {
  name: "HMAC",
  hash: SHA_256_HASH
};
var EMPTY_DATA_SHA_256 = new Uint8Array([
  227,
  176,
  196,
  66,
  152,
  252,
  28,
  20,
  154,
  251,
  244,
  200,
  153,
  111,
  185,
  36,
  39,
  174,
  65,
  228,
  100,
  155,
  147,
  76,
  164,
  149,
  153,
  27,
  120,
  82,
  184,
  85
]);

// node_modules/@aws-crypto/sha256-browser/build/module/webCryptoSha256.js
var Sha256 = (
  /** @class */
  function() {
    function Sha2564(secret) {
      this.toHash = new Uint8Array(0);
      this.secret = secret;
      this.reset();
    }
    __name(Sha2564, "Sha256");
    Sha2564.prototype.update = function(data) {
      if (isEmptyData(data)) {
        return;
      }
      var update = convertToBuffer(data);
      var typedArray = new Uint8Array(this.toHash.byteLength + update.byteLength);
      typedArray.set(this.toHash, 0);
      typedArray.set(update, this.toHash.byteLength);
      this.toHash = typedArray;
    };
    Sha2564.prototype.digest = function() {
      var _this = this;
      if (this.key) {
        return this.key.then(function(key) {
          return locateWindow().crypto.subtle.sign(SHA_256_HMAC_ALGO, key, _this.toHash).then(function(data) {
            return new Uint8Array(data);
          });
        });
      }
      if (isEmptyData(this.toHash)) {
        return Promise.resolve(EMPTY_DATA_SHA_256);
      }
      return Promise.resolve().then(function() {
        return locateWindow().crypto.subtle.digest(SHA_256_HASH, _this.toHash);
      }).then(function(data) {
        return Promise.resolve(new Uint8Array(data));
      });
    };
    Sha2564.prototype.reset = function() {
      var _this = this;
      this.toHash = new Uint8Array(0);
      if (this.secret && this.secret !== void 0) {
        this.key = new Promise(function(resolve, reject) {
          locateWindow().crypto.subtle.importKey("raw", convertToBuffer(_this.secret), SHA_256_HMAC_ALGO, false, ["sign"]).then(resolve, reject);
        });
        this.key.catch(function() {
        });
      }
    };
    return Sha2564;
  }()
);

// node_modules/@aws-crypto/sha256-js/build/module/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha256-js/build/module/jsSha256.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-crypto/sha256-js/build/module/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var BLOCK_SIZE = 64;
var DIGEST_LENGTH = 32;
var KEY = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var INIT = [
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
];
var MAX_HASHABLE_LENGTH = Math.pow(2, 53) - 1;

// node_modules/@aws-crypto/sha256-js/build/module/RawSha256.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var RawSha256 = (
  /** @class */
  function() {
    function RawSha2562() {
      this.state = Int32Array.from(INIT);
      this.temp = new Int32Array(64);
      this.buffer = new Uint8Array(64);
      this.bufferLength = 0;
      this.bytesHashed = 0;
      this.finished = false;
    }
    __name(RawSha2562, "RawSha256");
    RawSha2562.prototype.update = function(data) {
      if (this.finished) {
        throw new Error("Attempted to update an already finished hash.");
      }
      var position = 0;
      var byteLength = data.byteLength;
      this.bytesHashed += byteLength;
      if (this.bytesHashed * 8 > MAX_HASHABLE_LENGTH) {
        throw new Error("Cannot hash more than 2^53 - 1 bits");
      }
      while (byteLength > 0) {
        this.buffer[this.bufferLength++] = data[position++];
        byteLength--;
        if (this.bufferLength === BLOCK_SIZE) {
          this.hashBuffer();
          this.bufferLength = 0;
        }
      }
    };
    RawSha2562.prototype.digest = function() {
      if (!this.finished) {
        var bitsHashed = this.bytesHashed * 8;
        var bufferView = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
        var undecoratedLength = this.bufferLength;
        bufferView.setUint8(this.bufferLength++, 128);
        if (undecoratedLength % BLOCK_SIZE >= BLOCK_SIZE - 8) {
          for (var i2 = this.bufferLength; i2 < BLOCK_SIZE; i2++) {
            bufferView.setUint8(i2, 0);
          }
          this.hashBuffer();
          this.bufferLength = 0;
        }
        for (var i2 = this.bufferLength; i2 < BLOCK_SIZE - 8; i2++) {
          bufferView.setUint8(i2, 0);
        }
        bufferView.setUint32(BLOCK_SIZE - 8, Math.floor(bitsHashed / 4294967296), true);
        bufferView.setUint32(BLOCK_SIZE - 4, bitsHashed);
        this.hashBuffer();
        this.finished = true;
      }
      var out = new Uint8Array(DIGEST_LENGTH);
      for (var i2 = 0; i2 < 8; i2++) {
        out[i2 * 4] = this.state[i2] >>> 24 & 255;
        out[i2 * 4 + 1] = this.state[i2] >>> 16 & 255;
        out[i2 * 4 + 2] = this.state[i2] >>> 8 & 255;
        out[i2 * 4 + 3] = this.state[i2] >>> 0 & 255;
      }
      return out;
    };
    RawSha2562.prototype.hashBuffer = function() {
      var _a = this, buffer = _a.buffer, state = _a.state;
      var state0 = state[0], state1 = state[1], state2 = state[2], state3 = state[3], state4 = state[4], state5 = state[5], state6 = state[6], state7 = state[7];
      for (var i2 = 0; i2 < BLOCK_SIZE; i2++) {
        if (i2 < 16) {
          this.temp[i2] = (buffer[i2 * 4] & 255) << 24 | (buffer[i2 * 4 + 1] & 255) << 16 | (buffer[i2 * 4 + 2] & 255) << 8 | buffer[i2 * 4 + 3] & 255;
        } else {
          var u2 = this.temp[i2 - 2];
          var t1_1 = (u2 >>> 17 | u2 << 15) ^ (u2 >>> 19 | u2 << 13) ^ u2 >>> 10;
          u2 = this.temp[i2 - 15];
          var t2_1 = (u2 >>> 7 | u2 << 25) ^ (u2 >>> 18 | u2 << 14) ^ u2 >>> 3;
          this.temp[i2] = (t1_1 + this.temp[i2 - 7] | 0) + (t2_1 + this.temp[i2 - 16] | 0);
        }
        var t1 = (((state4 >>> 6 | state4 << 26) ^ (state4 >>> 11 | state4 << 21) ^ (state4 >>> 25 | state4 << 7)) + (state4 & state5 ^ ~state4 & state6) | 0) + (state7 + (KEY[i2] + this.temp[i2] | 0) | 0) | 0;
        var t2 = ((state0 >>> 2 | state0 << 30) ^ (state0 >>> 13 | state0 << 19) ^ (state0 >>> 22 | state0 << 10)) + (state0 & state1 ^ state0 & state2 ^ state1 & state2) | 0;
        state7 = state6;
        state6 = state5;
        state5 = state4;
        state4 = state3 + t1 | 0;
        state3 = state2;
        state2 = state1;
        state1 = state0;
        state0 = t1 + t2 | 0;
      }
      state[0] += state0;
      state[1] += state1;
      state[2] += state2;
      state[3] += state3;
      state[4] += state4;
      state[5] += state5;
      state[6] += state6;
      state[7] += state7;
    };
    return RawSha2562;
  }()
);

// node_modules/@aws-crypto/sha256-js/build/module/jsSha256.js
var Sha2562 = (
  /** @class */
  function() {
    function Sha2564(secret) {
      this.secret = secret;
      this.hash = new RawSha256();
      this.reset();
    }
    __name(Sha2564, "Sha256");
    Sha2564.prototype.update = function(toHash) {
      if (isEmptyData(toHash) || this.error) {
        return;
      }
      try {
        this.hash.update(convertToBuffer(toHash));
      } catch (e2) {
        this.error = e2;
      }
    };
    Sha2564.prototype.digestSync = function() {
      if (this.error) {
        throw this.error;
      }
      if (this.outer) {
        if (!this.outer.finished) {
          this.outer.update(this.hash.digest());
        }
        return this.outer.digest();
      }
      return this.hash.digest();
    };
    Sha2564.prototype.digest = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          return [2, this.digestSync()];
        });
      });
    };
    Sha2564.prototype.reset = function() {
      this.hash = new RawSha256();
      if (this.secret) {
        this.outer = new RawSha256();
        var inner = bufferFromSecret(this.secret);
        var outer = new Uint8Array(BLOCK_SIZE);
        outer.set(inner);
        for (var i2 = 0; i2 < BLOCK_SIZE; i2++) {
          inner[i2] ^= 54;
          outer[i2] ^= 92;
        }
        this.hash.update(inner);
        this.outer.update(outer);
        for (var i2 = 0; i2 < inner.byteLength; i2++) {
          inner[i2] = 0;
        }
      }
    };
    return Sha2564;
  }()
);
function bufferFromSecret(secret) {
  var input = convertToBuffer(secret);
  if (input.byteLength > BLOCK_SIZE) {
    var bufferHash = new RawSha256();
    bufferHash.update(input);
    input = bufferHash.digest();
  }
  var buffer = new Uint8Array(BLOCK_SIZE);
  buffer.set(input);
  return buffer;
}
__name(bufferFromSecret, "bufferFromSecret");

// node_modules/@aws-crypto/sha256-browser/build/module/crossPlatformSha256.js
var Sha2563 = (
  /** @class */
  function() {
    function Sha2564(secret) {
      if (supportsWebCrypto(locateWindow())) {
        this.hash = new Sha256(secret);
      } else {
        this.hash = new Sha2562(secret);
      }
    }
    __name(Sha2564, "Sha256");
    Sha2564.prototype.update = function(data, encoding) {
      this.hash.update(convertToBuffer(data));
    };
    Sha2564.prototype.digest = function() {
      return this.hash.digest();
    };
    Sha2564.prototype.reset = function() {
      this.hash.reset();
    };
    return Sha2564;
  }()
);

// node_modules/@aws-sdk/util-user-agent-browser/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var createDefaultUserAgentProvider = /* @__PURE__ */ __name(({ serviceId, clientVersion }) => async (config) => {
  const navigator = typeof window !== "undefined" ? window.navigator : void 0;
  const uaString = navigator?.userAgent ?? "";
  const osName = navigator?.userAgentData?.platform ?? fallback.os(uaString) ?? "other";
  const osVersion = void 0;
  const brands = navigator?.userAgentData?.brands ?? [];
  const brand = brands[brands.length - 1];
  const browserName = brand?.brand ?? fallback.browser(uaString) ?? "unknown";
  const browserVersion = brand?.version ?? "unknown";
  const sections = [
    ["aws-sdk-js", clientVersion],
    ["ua", "2.1"],
    [`os/${osName}`, osVersion],
    ["lang/js"],
    ["md/browser", `${browserName}_${browserVersion}`]
  ];
  if (serviceId) {
    sections.push([`api/${serviceId}`, clientVersion]);
  }
  const appId = await config?.userAgentAppId?.();
  if (appId) {
    sections.push([`app/${appId}`]);
  }
  return sections;
}, "createDefaultUserAgentProvider");
var fallback = {
  os(ua) {
    if (/iPhone|iPad|iPod/.test(ua))
      return "iOS";
    if (/Macintosh|Mac OS X/.test(ua))
      return "macOS";
    if (/Windows NT/.test(ua))
      return "Windows";
    if (/Android/.test(ua))
      return "Android";
    if (/Linux/.test(ua))
      return "Linux";
    return void 0;
  },
  browser(ua) {
    if (/EdgiOS|EdgA|Edg\//.test(ua))
      return "Microsoft Edge";
    if (/Firefox\//.test(ua))
      return "Firefox";
    if (/Chrome\//.test(ua))
      return "Chrome";
    if (/Safari\//.test(ua))
      return "Safari";
    return void 0;
  }
};

// node_modules/@smithy/eventstream-serde-browser/dist-es/EventStreamMarshaller.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/eventstream-serde-universal/dist-es/EventStreamMarshaller.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/eventstream-codec/dist-es/EventStreamCodec.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/eventstream-codec/dist-es/HeaderMarshaller.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/eventstream-codec/dist-es/Int64.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var Int642 = class {
  bytes;
  constructor(bytes) {
    this.bytes = bytes;
    if (bytes.byteLength !== 8) {
      throw new Error("Int64 buffers must be exactly 8 bytes");
    }
  }
  static fromNumber(number) {
    if (number > 9223372036854776e3 || number < -9223372036854776e3) {
      throw new Error(`${number} is too large (or, if negative, too small) to represent as an Int64`);
    }
    const bytes = new Uint8Array(8);
    for (let i2 = 7, remaining = Math.abs(Math.round(number)); i2 > -1 && remaining > 0; i2--, remaining /= 256) {
      bytes[i2] = remaining;
    }
    if (number < 0) {
      negate2(bytes);
    }
    return new Int642(bytes);
  }
  valueOf() {
    const bytes = this.bytes.slice(0);
    const negative = bytes[0] & 128;
    if (negative) {
      negate2(bytes);
    }
    return parseInt(toHex(bytes), 16) * (negative ? -1 : 1);
  }
  toString() {
    return String(this.valueOf());
  }
};
__name(Int642, "Int64");
function negate2(bytes) {
  for (let i2 = 0; i2 < 8; i2++) {
    bytes[i2] ^= 255;
  }
  for (let i2 = 7; i2 > -1; i2--) {
    bytes[i2]++;
    if (bytes[i2] !== 0)
      break;
  }
}
__name(negate2, "negate");

// node_modules/@smithy/eventstream-codec/dist-es/HeaderMarshaller.js
var HeaderMarshaller = class {
  toUtf8;
  fromUtf8;
  constructor(toUtf82, fromUtf85) {
    this.toUtf8 = toUtf82;
    this.fromUtf8 = fromUtf85;
  }
  format(headers) {
    const chunks = [];
    for (const headerName of Object.keys(headers)) {
      const bytes = this.fromUtf8(headerName);
      chunks.push(Uint8Array.from([bytes.byteLength]), bytes, this.formatHeaderValue(headers[headerName]));
    }
    const out = new Uint8Array(chunks.reduce((carry, bytes) => carry + bytes.byteLength, 0));
    let position = 0;
    for (const chunk of chunks) {
      out.set(chunk, position);
      position += chunk.byteLength;
    }
    return out;
  }
  formatHeaderValue(header) {
    switch (header.type) {
      case "boolean":
        return Uint8Array.from([header.value ? 0 : 1]);
      case "byte":
        return Uint8Array.from([2, header.value]);
      case "short":
        const shortView = new DataView(new ArrayBuffer(3));
        shortView.setUint8(0, 3);
        shortView.setInt16(1, header.value, false);
        return new Uint8Array(shortView.buffer);
      case "integer":
        const intView = new DataView(new ArrayBuffer(5));
        intView.setUint8(0, 4);
        intView.setInt32(1, header.value, false);
        return new Uint8Array(intView.buffer);
      case "long":
        const longBytes = new Uint8Array(9);
        longBytes[0] = 5;
        longBytes.set(header.value.bytes, 1);
        return longBytes;
      case "binary":
        const binView = new DataView(new ArrayBuffer(3 + header.value.byteLength));
        binView.setUint8(0, 6);
        binView.setUint16(1, header.value.byteLength, false);
        const binBytes = new Uint8Array(binView.buffer);
        binBytes.set(header.value, 3);
        return binBytes;
      case "string":
        const utf8Bytes = this.fromUtf8(header.value);
        const strView = new DataView(new ArrayBuffer(3 + utf8Bytes.byteLength));
        strView.setUint8(0, 7);
        strView.setUint16(1, utf8Bytes.byteLength, false);
        const strBytes = new Uint8Array(strView.buffer);
        strBytes.set(utf8Bytes, 3);
        return strBytes;
      case "timestamp":
        const tsBytes = new Uint8Array(9);
        tsBytes[0] = 8;
        tsBytes.set(Int642.fromNumber(header.value.valueOf()).bytes, 1);
        return tsBytes;
      case "uuid":
        if (!UUID_PATTERN2.test(header.value)) {
          throw new Error(`Invalid UUID received: ${header.value}`);
        }
        const uuidBytes = new Uint8Array(17);
        uuidBytes[0] = 9;
        uuidBytes.set(fromHex(header.value.replace(/\-/g, "")), 1);
        return uuidBytes;
    }
  }
  parse(headers) {
    const out = {};
    let position = 0;
    while (position < headers.byteLength) {
      const nameLength = headers.getUint8(position++);
      const name = this.toUtf8(new Uint8Array(headers.buffer, headers.byteOffset + position, nameLength));
      position += nameLength;
      switch (headers.getUint8(position++)) {
        case 0:
          out[name] = {
            type: BOOLEAN_TAG,
            value: true
          };
          break;
        case 1:
          out[name] = {
            type: BOOLEAN_TAG,
            value: false
          };
          break;
        case 2:
          out[name] = {
            type: BYTE_TAG,
            value: headers.getInt8(position++)
          };
          break;
        case 3:
          out[name] = {
            type: SHORT_TAG,
            value: headers.getInt16(position, false)
          };
          position += 2;
          break;
        case 4:
          out[name] = {
            type: INT_TAG,
            value: headers.getInt32(position, false)
          };
          position += 4;
          break;
        case 5:
          out[name] = {
            type: LONG_TAG,
            value: new Int642(new Uint8Array(headers.buffer, headers.byteOffset + position, 8))
          };
          position += 8;
          break;
        case 6:
          const binaryLength = headers.getUint16(position, false);
          position += 2;
          out[name] = {
            type: BINARY_TAG,
            value: new Uint8Array(headers.buffer, headers.byteOffset + position, binaryLength)
          };
          position += binaryLength;
          break;
        case 7:
          const stringLength = headers.getUint16(position, false);
          position += 2;
          out[name] = {
            type: STRING_TAG,
            value: this.toUtf8(new Uint8Array(headers.buffer, headers.byteOffset + position, stringLength))
          };
          position += stringLength;
          break;
        case 8:
          out[name] = {
            type: TIMESTAMP_TAG,
            value: new Date(new Int642(new Uint8Array(headers.buffer, headers.byteOffset + position, 8)).valueOf())
          };
          position += 8;
          break;
        case 9:
          const uuidBytes = new Uint8Array(headers.buffer, headers.byteOffset + position, 16);
          position += 16;
          out[name] = {
            type: UUID_TAG,
            value: `${toHex(uuidBytes.subarray(0, 4))}-${toHex(uuidBytes.subarray(4, 6))}-${toHex(uuidBytes.subarray(6, 8))}-${toHex(uuidBytes.subarray(8, 10))}-${toHex(uuidBytes.subarray(10))}`
          };
          break;
        default:
          throw new Error(`Unrecognized header type tag`);
      }
    }
    return out;
  }
};
__name(HeaderMarshaller, "HeaderMarshaller");
var HEADER_VALUE_TYPE2;
(function(HEADER_VALUE_TYPE3) {
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["boolTrue"] = 0] = "boolTrue";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["boolFalse"] = 1] = "boolFalse";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["byte"] = 2] = "byte";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["short"] = 3] = "short";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["integer"] = 4] = "integer";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["long"] = 5] = "long";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["byteArray"] = 6] = "byteArray";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["string"] = 7] = "string";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["timestamp"] = 8] = "timestamp";
  HEADER_VALUE_TYPE3[HEADER_VALUE_TYPE3["uuid"] = 9] = "uuid";
})(HEADER_VALUE_TYPE2 || (HEADER_VALUE_TYPE2 = {}));
var BOOLEAN_TAG = "boolean";
var BYTE_TAG = "byte";
var SHORT_TAG = "short";
var INT_TAG = "integer";
var LONG_TAG = "long";
var BINARY_TAG = "binary";
var STRING_TAG = "string";
var TIMESTAMP_TAG = "timestamp";
var UUID_TAG = "uuid";
var UUID_PATTERN2 = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

// node_modules/@smithy/eventstream-codec/dist-es/splitMessage.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var PRELUDE_MEMBER_LENGTH = 4;
var PRELUDE_LENGTH = PRELUDE_MEMBER_LENGTH * 2;
var CHECKSUM_LENGTH = 4;
var MINIMUM_MESSAGE_LENGTH = PRELUDE_LENGTH + CHECKSUM_LENGTH * 2;
function splitMessage({ byteLength, byteOffset, buffer }) {
  if (byteLength < MINIMUM_MESSAGE_LENGTH) {
    throw new Error("Provided message too short to accommodate event stream message overhead");
  }
  const view = new DataView(buffer, byteOffset, byteLength);
  const messageLength = view.getUint32(0, false);
  if (byteLength !== messageLength) {
    throw new Error("Reported message length does not match received message length");
  }
  const headerLength = view.getUint32(PRELUDE_MEMBER_LENGTH, false);
  const expectedPreludeChecksum = view.getUint32(PRELUDE_LENGTH, false);
  const expectedMessageChecksum = view.getUint32(byteLength - CHECKSUM_LENGTH, false);
  const checksummer = new Crc32().update(new Uint8Array(buffer, byteOffset, PRELUDE_LENGTH));
  if (expectedPreludeChecksum !== checksummer.digest()) {
    throw new Error(`The prelude checksum specified in the message (${expectedPreludeChecksum}) does not match the calculated CRC32 checksum (${checksummer.digest()})`);
  }
  checksummer.update(new Uint8Array(buffer, byteOffset + PRELUDE_LENGTH, byteLength - (PRELUDE_LENGTH + CHECKSUM_LENGTH)));
  if (expectedMessageChecksum !== checksummer.digest()) {
    throw new Error(`The message checksum (${checksummer.digest()}) did not match the expected value of ${expectedMessageChecksum}`);
  }
  return {
    headers: new DataView(buffer, byteOffset + PRELUDE_LENGTH + CHECKSUM_LENGTH, headerLength),
    body: new Uint8Array(buffer, byteOffset + PRELUDE_LENGTH + CHECKSUM_LENGTH + headerLength, messageLength - headerLength - (PRELUDE_LENGTH + CHECKSUM_LENGTH + CHECKSUM_LENGTH))
  };
}
__name(splitMessage, "splitMessage");

// node_modules/@smithy/eventstream-codec/dist-es/EventStreamCodec.js
var EventStreamCodec = class {
  headerMarshaller;
  messageBuffer;
  isEndOfStream;
  constructor(toUtf82, fromUtf85) {
    this.headerMarshaller = new HeaderMarshaller(toUtf82, fromUtf85);
    this.messageBuffer = [];
    this.isEndOfStream = false;
  }
  feed(message) {
    this.messageBuffer.push(this.decode(message));
  }
  endOfStream() {
    this.isEndOfStream = true;
  }
  getMessage() {
    const message = this.messageBuffer.pop();
    const isEndOfStream = this.isEndOfStream;
    return {
      getMessage() {
        return message;
      },
      isEndOfStream() {
        return isEndOfStream;
      }
    };
  }
  getAvailableMessages() {
    const messages = this.messageBuffer;
    this.messageBuffer = [];
    const isEndOfStream = this.isEndOfStream;
    return {
      getMessages() {
        return messages;
      },
      isEndOfStream() {
        return isEndOfStream;
      }
    };
  }
  encode({ headers: rawHeaders, body }) {
    const headers = this.headerMarshaller.format(rawHeaders);
    const length = headers.byteLength + body.byteLength + 16;
    const out = new Uint8Array(length);
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    const checksum = new Crc32();
    view.setUint32(0, length, false);
    view.setUint32(4, headers.byteLength, false);
    view.setUint32(8, checksum.update(out.subarray(0, 8)).digest(), false);
    out.set(headers, 12);
    out.set(body, headers.byteLength + 12);
    view.setUint32(length - 4, checksum.update(out.subarray(8, length - 4)).digest(), false);
    return out;
  }
  decode(message) {
    const { headers, body } = splitMessage(message);
    return { headers: this.headerMarshaller.parse(headers), body };
  }
  formatHeaders(rawHeaders) {
    return this.headerMarshaller.format(rawHeaders);
  }
};
__name(EventStreamCodec, "EventStreamCodec");

// node_modules/@smithy/eventstream-codec/dist-es/MessageDecoderStream.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var MessageDecoderStream = class {
  options;
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const bytes of this.options.inputStream) {
      const decoded = this.options.decoder.decode(bytes);
      yield decoded;
    }
  }
};
__name(MessageDecoderStream, "MessageDecoderStream");

// node_modules/@smithy/eventstream-codec/dist-es/MessageEncoderStream.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var MessageEncoderStream = class {
  options;
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const msg of this.options.messageStream) {
      const encoded = this.options.encoder.encode(msg);
      yield encoded;
    }
    if (this.options.includeEndFrame) {
      yield new Uint8Array(0);
    }
  }
};
__name(MessageEncoderStream, "MessageEncoderStream");

// node_modules/@smithy/eventstream-codec/dist-es/SmithyMessageDecoderStream.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var SmithyMessageDecoderStream = class {
  options;
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const message of this.options.messageStream) {
      const deserialized = await this.options.deserializer(message);
      if (deserialized === void 0)
        continue;
      yield deserialized;
    }
  }
};
__name(SmithyMessageDecoderStream, "SmithyMessageDecoderStream");

// node_modules/@smithy/eventstream-codec/dist-es/SmithyMessageEncoderStream.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var SmithyMessageEncoderStream = class {
  options;
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const chunk of this.options.inputStream) {
      const payloadBuf = this.options.serializer(chunk);
      yield payloadBuf;
    }
  }
};
__name(SmithyMessageEncoderStream, "SmithyMessageEncoderStream");

// node_modules/@smithy/eventstream-serde-universal/dist-es/getChunkedStream.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function getChunkedStream(source) {
  let currentMessageTotalLength = 0;
  let currentMessagePendingLength = 0;
  let currentMessage = null;
  let messageLengthBuffer = null;
  const allocateMessage = /* @__PURE__ */ __name((size) => {
    if (typeof size !== "number") {
      throw new Error("Attempted to allocate an event message where size was not a number: " + size);
    }
    currentMessageTotalLength = size;
    currentMessagePendingLength = 4;
    currentMessage = new Uint8Array(size);
    const currentMessageView = new DataView(currentMessage.buffer);
    currentMessageView.setUint32(0, size, false);
  }, "allocateMessage");
  const iterator = /* @__PURE__ */ __name(async function* () {
    const sourceIterator = source[Symbol.asyncIterator]();
    while (true) {
      const { value, done } = await sourceIterator.next();
      if (done) {
        if (!currentMessageTotalLength) {
          return;
        } else if (currentMessageTotalLength === currentMessagePendingLength) {
          yield currentMessage;
        } else {
          throw new Error("Truncated event message received.");
        }
        return;
      }
      const chunkLength = value.length;
      let currentOffset = 0;
      while (currentOffset < chunkLength) {
        if (!currentMessage) {
          const bytesRemaining = chunkLength - currentOffset;
          if (!messageLengthBuffer) {
            messageLengthBuffer = new Uint8Array(4);
          }
          const numBytesForTotal = Math.min(4 - currentMessagePendingLength, bytesRemaining);
          messageLengthBuffer.set(value.slice(currentOffset, currentOffset + numBytesForTotal), currentMessagePendingLength);
          currentMessagePendingLength += numBytesForTotal;
          currentOffset += numBytesForTotal;
          if (currentMessagePendingLength < 4) {
            break;
          }
          allocateMessage(new DataView(messageLengthBuffer.buffer).getUint32(0, false));
          messageLengthBuffer = null;
        }
        const numBytesToWrite = Math.min(currentMessageTotalLength - currentMessagePendingLength, chunkLength - currentOffset);
        currentMessage.set(value.slice(currentOffset, currentOffset + numBytesToWrite), currentMessagePendingLength);
        currentMessagePendingLength += numBytesToWrite;
        currentOffset += numBytesToWrite;
        if (currentMessageTotalLength && currentMessageTotalLength === currentMessagePendingLength) {
          yield currentMessage;
          currentMessage = null;
          currentMessageTotalLength = 0;
          currentMessagePendingLength = 0;
        }
      }
    }
  }, "iterator");
  return {
    [Symbol.asyncIterator]: iterator
  };
}
__name(getChunkedStream, "getChunkedStream");

// node_modules/@smithy/eventstream-serde-universal/dist-es/getUnmarshalledStream.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function getMessageUnmarshaller(deserializer, toUtf82) {
  return async function(message) {
    const { value: messageType } = message.headers[":message-type"];
    if (messageType === "error") {
      const unmodeledError = new Error(message.headers[":error-message"].value || "UnknownError");
      unmodeledError.name = message.headers[":error-code"].value;
      throw unmodeledError;
    } else if (messageType === "exception") {
      const code = message.headers[":exception-type"].value;
      const exception = { [code]: message };
      const deserializedException = await deserializer(exception);
      if (deserializedException.$unknown) {
        const error = new Error(toUtf82(message.body));
        error.name = code;
        throw error;
      }
      throw deserializedException[code];
    } else if (messageType === "event") {
      const event = {
        [message.headers[":event-type"].value]: message
      };
      const deserialized = await deserializer(event);
      if (deserialized.$unknown)
        return;
      return deserialized;
    } else {
      throw Error(`Unrecognizable event type: ${message.headers[":event-type"].value}`);
    }
  };
}
__name(getMessageUnmarshaller, "getMessageUnmarshaller");

// node_modules/@smithy/eventstream-serde-universal/dist-es/EventStreamMarshaller.js
var EventStreamMarshaller = class {
  eventStreamCodec;
  utfEncoder;
  constructor({ utf8Encoder, utf8Decoder }) {
    this.eventStreamCodec = new EventStreamCodec(utf8Encoder, utf8Decoder);
    this.utfEncoder = utf8Encoder;
  }
  deserialize(body, deserializer) {
    const inputStream = getChunkedStream(body);
    return new SmithyMessageDecoderStream({
      messageStream: new MessageDecoderStream({ inputStream, decoder: this.eventStreamCodec }),
      deserializer: getMessageUnmarshaller(deserializer, this.utfEncoder)
    });
  }
  serialize(inputStream, serializer) {
    return new MessageEncoderStream({
      messageStream: new SmithyMessageEncoderStream({ inputStream, serializer }),
      encoder: this.eventStreamCodec,
      includeEndFrame: true
    });
  }
};
__name(EventStreamMarshaller, "EventStreamMarshaller");

// node_modules/@smithy/eventstream-serde-browser/dist-es/utils.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var readableStreamtoIterable = /* @__PURE__ */ __name((readableStream) => ({
  [Symbol.asyncIterator]: async function* () {
    const reader = readableStream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }
}), "readableStreamtoIterable");
var iterableToReadableStream = /* @__PURE__ */ __name((asyncIterable) => {
  const iterator = asyncIterable[Symbol.asyncIterator]();
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await iterator.next();
      if (done) {
        return controller.close();
      }
      controller.enqueue(value);
    }
  });
}, "iterableToReadableStream");

// node_modules/@smithy/eventstream-serde-browser/dist-es/EventStreamMarshaller.js
var EventStreamMarshaller2 = class {
  universalMarshaller;
  constructor({ utf8Encoder, utf8Decoder }) {
    this.universalMarshaller = new EventStreamMarshaller({
      utf8Decoder,
      utf8Encoder
    });
  }
  deserialize(body, deserializer) {
    const bodyIterable = isReadableStream2(body) ? readableStreamtoIterable(body) : body;
    return this.universalMarshaller.deserialize(bodyIterable, deserializer);
  }
  serialize(input, serializer) {
    const serialziedIterable = this.universalMarshaller.serialize(input, serializer);
    return typeof ReadableStream === "function" ? iterableToReadableStream(serialziedIterable) : serialziedIterable;
  }
};
__name(EventStreamMarshaller2, "EventStreamMarshaller");
var isReadableStream2 = /* @__PURE__ */ __name((body) => typeof ReadableStream === "function" && body instanceof ReadableStream, "isReadableStream");

// node_modules/@smithy/eventstream-serde-browser/dist-es/provider.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var eventStreamSerdeProvider = /* @__PURE__ */ __name((options) => new EventStreamMarshaller2(options), "eventStreamSerdeProvider");

// node_modules/@smithy/hash-blob-browser/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/chunked-blob-reader/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function blobReader(blob, onChunk, chunkSize = 1024 * 1024) {
  const size = blob.size;
  let totalBytesRead = 0;
  while (totalBytesRead < size) {
    const slice = blob.slice(totalBytesRead, Math.min(size, totalBytesRead + chunkSize));
    onChunk(new Uint8Array(await slice.arrayBuffer()));
    totalBytesRead += slice.size;
  }
}
__name(blobReader, "blobReader");

// node_modules/@smithy/hash-blob-browser/dist-es/index.js
var blobHasher = /* @__PURE__ */ __name(async function blobHasher2(hashCtor, blob) {
  const hash = new hashCtor();
  await blobReader(blob, (chunk) => {
    hash.update(chunk);
  });
  return hash.digest();
}, "blobHasher");

// node_modules/@smithy/invalid-dependency/dist-es/invalidProvider.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var invalidProvider = /* @__PURE__ */ __name((message) => () => Promise.reject(message), "invalidProvider");

// node_modules/@smithy/md5-js/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_dist_es();

// node_modules/@smithy/md5-js/dist-es/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var BLOCK_SIZE2 = 64;
var DIGEST_LENGTH2 = 16;
var INIT2 = [1732584193, 4023233417, 2562383102, 271733878];

// node_modules/@smithy/md5-js/dist-es/index.js
var Md5 = class {
  state;
  buffer;
  bufferLength;
  bytesHashed;
  finished;
  constructor() {
    this.reset();
  }
  update(sourceData) {
    if (isEmptyData3(sourceData)) {
      return;
    } else if (this.finished) {
      throw new Error("Attempted to update an already finished hash.");
    }
    const data = convertToBuffer3(sourceData);
    let position = 0;
    let { byteLength } = data;
    this.bytesHashed += byteLength;
    while (byteLength > 0) {
      this.buffer.setUint8(this.bufferLength++, data[position++]);
      byteLength--;
      if (this.bufferLength === BLOCK_SIZE2) {
        this.hashBuffer();
        this.bufferLength = 0;
      }
    }
  }
  async digest() {
    if (!this.finished) {
      const { buffer, bufferLength: undecoratedLength, bytesHashed } = this;
      const bitsHashed = bytesHashed * 8;
      buffer.setUint8(this.bufferLength++, 128);
      if (undecoratedLength % BLOCK_SIZE2 >= BLOCK_SIZE2 - 8) {
        for (let i2 = this.bufferLength; i2 < BLOCK_SIZE2; i2++) {
          buffer.setUint8(i2, 0);
        }
        this.hashBuffer();
        this.bufferLength = 0;
      }
      for (let i2 = this.bufferLength; i2 < BLOCK_SIZE2 - 8; i2++) {
        buffer.setUint8(i2, 0);
      }
      buffer.setUint32(BLOCK_SIZE2 - 8, bitsHashed >>> 0, true);
      buffer.setUint32(BLOCK_SIZE2 - 4, Math.floor(bitsHashed / 4294967296), true);
      this.hashBuffer();
      this.finished = true;
    }
    const out = new DataView(new ArrayBuffer(DIGEST_LENGTH2));
    for (let i2 = 0; i2 < 4; i2++) {
      out.setUint32(i2 * 4, this.state[i2], true);
    }
    return new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
  }
  hashBuffer() {
    const { buffer, state } = this;
    let a3 = state[0], b2 = state[1], c2 = state[2], d2 = state[3];
    a3 = ff(a3, b2, c2, d2, buffer.getUint32(0, true), 7, 3614090360);
    d2 = ff(d2, a3, b2, c2, buffer.getUint32(4, true), 12, 3905402710);
    c2 = ff(c2, d2, a3, b2, buffer.getUint32(8, true), 17, 606105819);
    b2 = ff(b2, c2, d2, a3, buffer.getUint32(12, true), 22, 3250441966);
    a3 = ff(a3, b2, c2, d2, buffer.getUint32(16, true), 7, 4118548399);
    d2 = ff(d2, a3, b2, c2, buffer.getUint32(20, true), 12, 1200080426);
    c2 = ff(c2, d2, a3, b2, buffer.getUint32(24, true), 17, 2821735955);
    b2 = ff(b2, c2, d2, a3, buffer.getUint32(28, true), 22, 4249261313);
    a3 = ff(a3, b2, c2, d2, buffer.getUint32(32, true), 7, 1770035416);
    d2 = ff(d2, a3, b2, c2, buffer.getUint32(36, true), 12, 2336552879);
    c2 = ff(c2, d2, a3, b2, buffer.getUint32(40, true), 17, 4294925233);
    b2 = ff(b2, c2, d2, a3, buffer.getUint32(44, true), 22, 2304563134);
    a3 = ff(a3, b2, c2, d2, buffer.getUint32(48, true), 7, 1804603682);
    d2 = ff(d2, a3, b2, c2, buffer.getUint32(52, true), 12, 4254626195);
    c2 = ff(c2, d2, a3, b2, buffer.getUint32(56, true), 17, 2792965006);
    b2 = ff(b2, c2, d2, a3, buffer.getUint32(60, true), 22, 1236535329);
    a3 = gg(a3, b2, c2, d2, buffer.getUint32(4, true), 5, 4129170786);
    d2 = gg(d2, a3, b2, c2, buffer.getUint32(24, true), 9, 3225465664);
    c2 = gg(c2, d2, a3, b2, buffer.getUint32(44, true), 14, 643717713);
    b2 = gg(b2, c2, d2, a3, buffer.getUint32(0, true), 20, 3921069994);
    a3 = gg(a3, b2, c2, d2, buffer.getUint32(20, true), 5, 3593408605);
    d2 = gg(d2, a3, b2, c2, buffer.getUint32(40, true), 9, 38016083);
    c2 = gg(c2, d2, a3, b2, buffer.getUint32(60, true), 14, 3634488961);
    b2 = gg(b2, c2, d2, a3, buffer.getUint32(16, true), 20, 3889429448);
    a3 = gg(a3, b2, c2, d2, buffer.getUint32(36, true), 5, 568446438);
    d2 = gg(d2, a3, b2, c2, buffer.getUint32(56, true), 9, 3275163606);
    c2 = gg(c2, d2, a3, b2, buffer.getUint32(12, true), 14, 4107603335);
    b2 = gg(b2, c2, d2, a3, buffer.getUint32(32, true), 20, 1163531501);
    a3 = gg(a3, b2, c2, d2, buffer.getUint32(52, true), 5, 2850285829);
    d2 = gg(d2, a3, b2, c2, buffer.getUint32(8, true), 9, 4243563512);
    c2 = gg(c2, d2, a3, b2, buffer.getUint32(28, true), 14, 1735328473);
    b2 = gg(b2, c2, d2, a3, buffer.getUint32(48, true), 20, 2368359562);
    a3 = hh(a3, b2, c2, d2, buffer.getUint32(20, true), 4, 4294588738);
    d2 = hh(d2, a3, b2, c2, buffer.getUint32(32, true), 11, 2272392833);
    c2 = hh(c2, d2, a3, b2, buffer.getUint32(44, true), 16, 1839030562);
    b2 = hh(b2, c2, d2, a3, buffer.getUint32(56, true), 23, 4259657740);
    a3 = hh(a3, b2, c2, d2, buffer.getUint32(4, true), 4, 2763975236);
    d2 = hh(d2, a3, b2, c2, buffer.getUint32(16, true), 11, 1272893353);
    c2 = hh(c2, d2, a3, b2, buffer.getUint32(28, true), 16, 4139469664);
    b2 = hh(b2, c2, d2, a3, buffer.getUint32(40, true), 23, 3200236656);
    a3 = hh(a3, b2, c2, d2, buffer.getUint32(52, true), 4, 681279174);
    d2 = hh(d2, a3, b2, c2, buffer.getUint32(0, true), 11, 3936430074);
    c2 = hh(c2, d2, a3, b2, buffer.getUint32(12, true), 16, 3572445317);
    b2 = hh(b2, c2, d2, a3, buffer.getUint32(24, true), 23, 76029189);
    a3 = hh(a3, b2, c2, d2, buffer.getUint32(36, true), 4, 3654602809);
    d2 = hh(d2, a3, b2, c2, buffer.getUint32(48, true), 11, 3873151461);
    c2 = hh(c2, d2, a3, b2, buffer.getUint32(60, true), 16, 530742520);
    b2 = hh(b2, c2, d2, a3, buffer.getUint32(8, true), 23, 3299628645);
    a3 = ii2(a3, b2, c2, d2, buffer.getUint32(0, true), 6, 4096336452);
    d2 = ii2(d2, a3, b2, c2, buffer.getUint32(28, true), 10, 1126891415);
    c2 = ii2(c2, d2, a3, b2, buffer.getUint32(56, true), 15, 2878612391);
    b2 = ii2(b2, c2, d2, a3, buffer.getUint32(20, true), 21, 4237533241);
    a3 = ii2(a3, b2, c2, d2, buffer.getUint32(48, true), 6, 1700485571);
    d2 = ii2(d2, a3, b2, c2, buffer.getUint32(12, true), 10, 2399980690);
    c2 = ii2(c2, d2, a3, b2, buffer.getUint32(40, true), 15, 4293915773);
    b2 = ii2(b2, c2, d2, a3, buffer.getUint32(4, true), 21, 2240044497);
    a3 = ii2(a3, b2, c2, d2, buffer.getUint32(32, true), 6, 1873313359);
    d2 = ii2(d2, a3, b2, c2, buffer.getUint32(60, true), 10, 4264355552);
    c2 = ii2(c2, d2, a3, b2, buffer.getUint32(24, true), 15, 2734768916);
    b2 = ii2(b2, c2, d2, a3, buffer.getUint32(52, true), 21, 1309151649);
    a3 = ii2(a3, b2, c2, d2, buffer.getUint32(16, true), 6, 4149444226);
    d2 = ii2(d2, a3, b2, c2, buffer.getUint32(44, true), 10, 3174756917);
    c2 = ii2(c2, d2, a3, b2, buffer.getUint32(8, true), 15, 718787259);
    b2 = ii2(b2, c2, d2, a3, buffer.getUint32(36, true), 21, 3951481745);
    state[0] = a3 + state[0] & 4294967295;
    state[1] = b2 + state[1] & 4294967295;
    state[2] = c2 + state[2] & 4294967295;
    state[3] = d2 + state[3] & 4294967295;
  }
  reset() {
    this.state = Uint32Array.from(INIT2);
    this.buffer = new DataView(new ArrayBuffer(BLOCK_SIZE2));
    this.bufferLength = 0;
    this.bytesHashed = 0;
    this.finished = false;
  }
};
__name(Md5, "Md5");
function cmn(q2, a3, b2, x3, s2, t2) {
  a3 = (a3 + q2 & 4294967295) + (x3 + t2 & 4294967295) & 4294967295;
  return (a3 << s2 | a3 >>> 32 - s2) + b2 & 4294967295;
}
__name(cmn, "cmn");
function ff(a3, b2, c2, d2, x3, s2, t2) {
  return cmn(b2 & c2 | ~b2 & d2, a3, b2, x3, s2, t2);
}
__name(ff, "ff");
function gg(a3, b2, c2, d2, x3, s2, t2) {
  return cmn(b2 & d2 | c2 & ~d2, a3, b2, x3, s2, t2);
}
__name(gg, "gg");
function hh(a3, b2, c2, d2, x3, s2, t2) {
  return cmn(b2 ^ c2 ^ d2, a3, b2, x3, s2, t2);
}
__name(hh, "hh");
function ii2(a3, b2, c2, d2, x3, s2, t2) {
  return cmn(c2 ^ (b2 | ~d2), a3, b2, x3, s2, t2);
}
__name(ii2, "ii");
function isEmptyData3(data) {
  if (typeof data === "string") {
    return data.length === 0;
  }
  return data.byteLength === 0;
}
__name(isEmptyData3, "isEmptyData");
function convertToBuffer3(data) {
  if (typeof data === "string") {
    return fromUtf8(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
  }
  return new Uint8Array(data);
}
__name(convertToBuffer3, "convertToBuffer");

// node_modules/@aws-sdk/client-s3/dist-es/runtimeConfig.shared.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_dist_es();
var getRuntimeConfig = /* @__PURE__ */ __name((config) => {
  return {
    apiVersion: "2006-03-01",
    base64Decoder: config?.base64Decoder ?? fromBase64,
    base64Encoder: config?.base64Encoder ?? toBase64,
    disableHostPrefix: config?.disableHostPrefix ?? false,
    endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
    extensions: config?.extensions ?? [],
    getAwsChunkedEncodingStream: config?.getAwsChunkedEncodingStream ?? getAwsChunkedEncodingStream,
    httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultS3HttpAuthSchemeProvider,
    httpAuthSchemes: config?.httpAuthSchemes ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      },
      {
        schemeId: "aws.auth#sigv4a",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4a"),
        signer: new AwsSdkSigV4ASigner()
      }
    ],
    logger: config?.logger ?? new NoOpLogger(),
    protocol: config?.protocol ?? new AwsRestXmlProtocol({
      defaultNamespace: "com.amazonaws.s3",
      xmlNamespace: "http://s3.amazonaws.com/doc/2006-03-01/"
    }),
    sdkStreamMixin: config?.sdkStreamMixin ?? sdkStreamMixin,
    serviceId: config?.serviceId ?? "S3",
    signerConstructor: config?.signerConstructor ?? SignatureV4MultiRegion,
    signingEscapePath: config?.signingEscapePath ?? false,
    urlParser: config?.urlParser ?? parseUrl,
    useArnRegion: config?.useArnRegion ?? void 0,
    utf8Decoder: config?.utf8Decoder ?? fromUtf8,
    utf8Encoder: config?.utf8Encoder ?? toUtf8
  };
}, "getRuntimeConfig");

// node_modules/@smithy/util-defaults-mode-browser/dist-es/resolveDefaultsModeConfig.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@smithy/util-defaults-mode-browser/dist-es/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var DEFAULTS_MODE_OPTIONS = ["in-region", "cross-region", "mobile", "standard", "legacy"];

// node_modules/@smithy/util-defaults-mode-browser/dist-es/resolveDefaultsModeConfig.js
var resolveDefaultsModeConfig = /* @__PURE__ */ __name(({ defaultsMode } = {}) => memoize(async () => {
  const mode = typeof defaultsMode === "function" ? await defaultsMode() : defaultsMode;
  switch (mode?.toLowerCase()) {
    case "auto":
      return Promise.resolve(useMobileConfiguration() ? "mobile" : "standard");
    case "mobile":
    case "in-region":
    case "cross-region":
    case "standard":
    case "legacy":
      return Promise.resolve(mode?.toLocaleLowerCase());
    case void 0:
      return Promise.resolve("legacy");
    default:
      throw new Error(`Invalid parameter for "defaultsMode", expect ${DEFAULTS_MODE_OPTIONS.join(", ")}, got ${mode}`);
  }
}), "resolveDefaultsModeConfig");
var useMobileConfiguration = /* @__PURE__ */ __name(() => {
  const navigator = window?.navigator;
  if (navigator?.connection) {
    const { effectiveType, rtt, downlink } = navigator?.connection;
    const slow = typeof effectiveType === "string" && effectiveType !== "4g" || Number(rtt) > 100 || Number(downlink) < 10;
    if (slow) {
      return true;
    }
  }
  return navigator?.userAgentData?.mobile || typeof navigator?.maxTouchPoints === "number" && navigator?.maxTouchPoints > 1;
}, "useMobileConfiguration");

// node_modules/@aws-sdk/client-s3/dist-es/runtimeConfig.browser.js
var getRuntimeConfig2 = /* @__PURE__ */ __name((config) => {
  const defaultsMode = resolveDefaultsModeConfig(config);
  const defaultConfigProvider = /* @__PURE__ */ __name(() => defaultsMode().then(loadConfigsForDefaultMode), "defaultConfigProvider");
  const clientSharedValues = getRuntimeConfig(config);
  return {
    ...clientSharedValues,
    ...config,
    runtime: "browser",
    defaultsMode,
    bodyLengthChecker: config?.bodyLengthChecker ?? calculateBodyLength,
    credentialDefaultProvider: config?.credentialDefaultProvider ?? ((_2) => () => Promise.reject(new Error("Credential is missing"))),
    defaultUserAgentProvider: config?.defaultUserAgentProvider ?? createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: package_default.version }),
    eventStreamSerdeProvider: config?.eventStreamSerdeProvider ?? eventStreamSerdeProvider,
    maxAttempts: config?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    md5: config?.md5 ?? Md5,
    region: config?.region ?? invalidProvider("Region is missing"),
    requestHandler: FetchHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
    retryMode: config?.retryMode ?? (async () => (await defaultConfigProvider()).retryMode || DEFAULT_RETRY_MODE),
    sha1: config?.sha1 ?? Sha12,
    sha256: config?.sha256 ?? Sha2563,
    streamCollector: config?.streamCollector ?? streamCollector,
    streamHasher: config?.streamHasher ?? blobHasher,
    useDualstackEndpoint: config?.useDualstackEndpoint ?? (() => Promise.resolve(DEFAULT_USE_DUALSTACK_ENDPOINT)),
    useFipsEndpoint: config?.useFipsEndpoint ?? (() => Promise.resolve(DEFAULT_USE_FIPS_ENDPOINT))
  };
}, "getRuntimeConfig");

// node_modules/@aws-sdk/client-s3/dist-es/runtimeExtensions.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/region-config-resolver/dist-es/extensions/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getAwsRegionExtensionConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
  return {
    setRegion(region) {
      runtimeConfig.region = region;
    },
    region() {
      return runtimeConfig.region;
    }
  };
}, "getAwsRegionExtensionConfiguration");
var resolveAwsRegionExtensionConfiguration = /* @__PURE__ */ __name((awsRegionExtensionConfiguration) => {
  return {
    region: awsRegionExtensionConfiguration.region()
  };
}, "resolveAwsRegionExtensionConfiguration");

// node_modules/@aws-sdk/client-s3/dist-es/auth/httpAuthExtensionConfiguration.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var getHttpAuthExtensionConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
  const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
  let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
  let _credentials = runtimeConfig.credentials;
  return {
    setHttpAuthScheme(httpAuthScheme) {
      const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
      if (index === -1) {
        _httpAuthSchemes.push(httpAuthScheme);
      } else {
        _httpAuthSchemes.splice(index, 1, httpAuthScheme);
      }
    },
    httpAuthSchemes() {
      return _httpAuthSchemes;
    },
    setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
      _httpAuthSchemeProvider = httpAuthSchemeProvider;
    },
    httpAuthSchemeProvider() {
      return _httpAuthSchemeProvider;
    },
    setCredentials(credentials) {
      _credentials = credentials;
    },
    credentials() {
      return _credentials;
    }
  };
}, "getHttpAuthExtensionConfiguration");
var resolveHttpAuthRuntimeConfig = /* @__PURE__ */ __name((config) => {
  return {
    httpAuthSchemes: config.httpAuthSchemes(),
    httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
    credentials: config.credentials()
  };
}, "resolveHttpAuthRuntimeConfig");

// node_modules/@aws-sdk/client-s3/dist-es/runtimeExtensions.js
var resolveRuntimeExtensions = /* @__PURE__ */ __name((runtimeConfig, extensions) => {
  const extensionConfiguration = Object.assign(getAwsRegionExtensionConfiguration(runtimeConfig), getDefaultExtensionConfiguration(runtimeConfig), getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
  extensions.forEach((extension) => extension.configure(extensionConfiguration));
  return Object.assign(runtimeConfig, resolveAwsRegionExtensionConfiguration(extensionConfiguration), resolveDefaultRuntimeConfig(extensionConfiguration), resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
}, "resolveRuntimeExtensions");

// node_modules/@aws-sdk/client-s3/dist-es/S3Client.js
var S3Client = class extends Client {
  config;
  constructor(...[configuration]) {
    const _config_0 = getRuntimeConfig2(configuration || {});
    super(_config_0);
    this.initConfig = _config_0;
    const _config_1 = resolveClientEndpointParameters(_config_0);
    const _config_2 = resolveUserAgentConfig(_config_1);
    const _config_3 = resolveFlexibleChecksumsConfig(_config_2);
    const _config_4 = resolveRetryConfig(_config_3);
    const _config_5 = resolveRegionConfig(_config_4);
    const _config_6 = resolveHostHeaderConfig(_config_5);
    const _config_7 = resolveEndpointConfig(_config_6);
    const _config_8 = resolveEventStreamSerdeConfig(_config_7);
    const _config_9 = resolveHttpAuthSchemeConfig(_config_8);
    const _config_10 = resolveS3Config(_config_9, { session: [() => this, CreateSessionCommand] });
    const _config_11 = resolveRuntimeExtensions(_config_10, configuration?.extensions || []);
    this.config = _config_11;
    this.middlewareStack.use(getSchemaSerdePlugin(this.config));
    this.middlewareStack.use(getUserAgentPlugin(this.config));
    this.middlewareStack.use(getRetryPlugin(this.config));
    this.middlewareStack.use(getContentLengthPlugin(this.config));
    this.middlewareStack.use(getHostHeaderPlugin(this.config));
    this.middlewareStack.use(getLoggerPlugin(this.config));
    this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
    this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
      httpAuthSchemeParametersProvider: defaultS3HttpAuthSchemeParametersProvider,
      identityProviderConfigProvider: async (config) => new DefaultIdentityProviderConfig({
        "aws.auth#sigv4": config.credentials,
        "aws.auth#sigv4a": config.credentials
      })
    }));
    this.middlewareStack.use(getHttpSigningPlugin(this.config));
    this.middlewareStack.use(getValidateBucketNamePlugin(this.config));
    this.middlewareStack.use(getAddExpectContinuePlugin(this.config));
    this.middlewareStack.use(getRegionRedirectMiddlewarePlugin(this.config));
    this.middlewareStack.use(getS3ExpressPlugin(this.config));
    this.middlewareStack.use(getS3ExpressHttpSigningPlugin(this.config));
  }
  destroy() {
    super.destroy();
  }
};
__name(S3Client, "S3Client");

// node_modules/@aws-sdk/middleware-ssec/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function ssecMiddleware(options) {
  return (next) => async (args) => {
    const input = { ...args.input };
    const properties = [
      {
        target: "SSECustomerKey",
        hash: "SSECustomerKeyMD5"
      },
      {
        target: "CopySourceSSECustomerKey",
        hash: "CopySourceSSECustomerKeyMD5"
      }
    ];
    for (const prop of properties) {
      const value = input[prop.target];
      if (value) {
        let valueForHash;
        if (typeof value === "string") {
          if (isValidBase64EncodedSSECustomerKey(value, options)) {
            valueForHash = options.base64Decoder(value);
          } else {
            valueForHash = options.utf8Decoder(value);
            input[prop.target] = options.base64Encoder(valueForHash);
          }
        } else {
          valueForHash = ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : new Uint8Array(value);
          input[prop.target] = options.base64Encoder(valueForHash);
        }
        const hash = new options.md5();
        hash.update(valueForHash);
        input[prop.hash] = options.base64Encoder(await hash.digest());
      }
    }
    return next({
      ...args,
      input
    });
  };
}
__name(ssecMiddleware, "ssecMiddleware");
var ssecMiddlewareOptions = {
  name: "ssecMiddleware",
  step: "initialize",
  tags: ["SSE"],
  override: true
};
var getSsecPlugin = /* @__PURE__ */ __name((config) => ({
  applyToStack: (clientStack) => {
    clientStack.add(ssecMiddleware(config), ssecMiddlewareOptions);
  }
}), "getSsecPlugin");
function isValidBase64EncodedSSECustomerKey(str, options) {
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (!base64Regex.test(str))
    return false;
  try {
    const decodedBytes = options.base64Decoder(str);
    return decodedBytes.length === 32;
  } catch {
    return false;
  }
}
__name(isValidBase64EncodedSSECustomerKey, "isValidBase64EncodedSSECustomerKey");

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteObjectCommand.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var DeleteObjectCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs3, config, o2) {
  return [getEndpointPlugin(config, Command2.getEndpointParameterInstructions()), getThrow200ExceptionsPlugin(config)];
}).s("AmazonS3", "DeleteObject", {}).n("S3Client", "DeleteObjectCommand").sc(DeleteObject).build() {
};
__name(DeleteObjectCommand, "DeleteObjectCommand");

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetObjectCommand.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var GetObjectCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs3, config, o2) {
  return [
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestChecksumRequired: false,
      requestValidationModeMember: "ChecksumMode",
      responseAlgorithms: ["CRC64NVME", "CRC32", "CRC32C", "SHA256", "SHA1"]
    }),
    getSsecPlugin(config),
    getS3ExpiresMiddlewarePlugin(config)
  ];
}).s("AmazonS3", "GetObject", {}).n("S3Client", "GetObjectCommand").sc(GetObject).build() {
};
__name(GetObjectCommand, "GetObjectCommand");

// node_modules/@aws-sdk/client-s3/dist-es/commands/HeadObjectCommand.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var HeadObjectCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs3, config, o2) {
  return [
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config),
    getS3ExpiresMiddlewarePlugin(config)
  ];
}).s("AmazonS3", "HeadObject", {}).n("S3Client", "HeadObjectCommand").sc(HeadObject).build() {
};
__name(HeadObjectCommand, "HeadObjectCommand");

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutObjectCommand.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var PutObjectCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs3, config, o2) {
  return [
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: false
    }),
    getCheckContentLengthHeaderPlugin(config),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "PutObject", {}).n("S3Client", "PutObjectCommand").sc(PutObject).build() {
};
__name(PutObjectCommand, "PutObjectCommand");

// node_modules/@aws-sdk/s3-request-presigner/dist-es/getSignedUrl.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/util-format-url/dist-es/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function formatUrl(request) {
  const { port, query } = request;
  let { protocol, path, hostname } = request;
  if (protocol && protocol.slice(-1) !== ":") {
    protocol += ":";
  }
  if (port) {
    hostname += `:${port}`;
  }
  if (path && path.charAt(0) !== "/") {
    path = `/${path}`;
  }
  let queryString = query ? buildQueryString(query) : "";
  if (queryString && queryString[0] !== "?") {
    queryString = `?${queryString}`;
  }
  let auth = "";
  if (request.username != null || request.password != null) {
    const username = request.username ?? "";
    const password = request.password ?? "";
    auth = `${username}:${password}@`;
  }
  let fragment = "";
  if (request.fragment) {
    fragment = `#${request.fragment}`;
  }
  return `${protocol}//${auth}${hostname}${path}${queryString}${fragment}`;
}
__name(formatUrl, "formatUrl");

// node_modules/@aws-sdk/s3-request-presigner/dist-es/presigner.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@aws-sdk/s3-request-presigner/dist-es/constants.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var UNSIGNED_PAYLOAD2 = "UNSIGNED-PAYLOAD";
var SHA256_HEADER2 = "X-Amz-Content-Sha256";

// node_modules/@aws-sdk/s3-request-presigner/dist-es/presigner.js
var S3RequestPresigner = class {
  signer;
  constructor(options) {
    const resolvedOptions = {
      service: options.signingName || options.service || "s3",
      uriEscapePath: options.uriEscapePath || false,
      applyChecksum: options.applyChecksum || false,
      ...options
    };
    this.signer = new SignatureV4MultiRegion(resolvedOptions);
  }
  presign(requestToSign, { unsignableHeaders = /* @__PURE__ */ new Set(), hoistableHeaders = /* @__PURE__ */ new Set(), unhoistableHeaders = /* @__PURE__ */ new Set(), ...options } = {}) {
    this.prepareRequest(requestToSign, {
      unsignableHeaders,
      unhoistableHeaders,
      hoistableHeaders
    });
    return this.signer.presign(requestToSign, {
      expiresIn: 900,
      unsignableHeaders,
      unhoistableHeaders,
      ...options
    });
  }
  presignWithCredentials(requestToSign, credentials, { unsignableHeaders = /* @__PURE__ */ new Set(), hoistableHeaders = /* @__PURE__ */ new Set(), unhoistableHeaders = /* @__PURE__ */ new Set(), ...options } = {}) {
    this.prepareRequest(requestToSign, {
      unsignableHeaders,
      unhoistableHeaders,
      hoistableHeaders
    });
    return this.signer.presignWithCredentials(requestToSign, credentials, {
      expiresIn: 900,
      unsignableHeaders,
      unhoistableHeaders,
      ...options
    });
  }
  prepareRequest(requestToSign, { unsignableHeaders = /* @__PURE__ */ new Set(), unhoistableHeaders = /* @__PURE__ */ new Set(), hoistableHeaders = /* @__PURE__ */ new Set() } = {}) {
    unsignableHeaders.add("content-type");
    Object.keys(requestToSign.headers).map((header) => header.toLowerCase()).filter((header) => header.startsWith("x-amz-server-side-encryption")).forEach((header) => {
      if (!hoistableHeaders.has(header)) {
        unhoistableHeaders.add(header);
      }
    });
    requestToSign.headers[SHA256_HEADER2] = UNSIGNED_PAYLOAD2;
    const currentHostHeader = requestToSign.headers.host;
    const port = requestToSign.port;
    const expectedHostHeader = `${requestToSign.hostname}${requestToSign.port != null ? ":" + port : ""}`;
    if (!currentHostHeader || currentHostHeader === requestToSign.hostname && requestToSign.port != null) {
      requestToSign.headers.host = expectedHostHeader;
    }
  }
};
__name(S3RequestPresigner, "S3RequestPresigner");

// node_modules/@aws-sdk/s3-request-presigner/dist-es/getSignedUrl.js
var getSignedUrl = /* @__PURE__ */ __name(async (client, command, options = {}) => {
  let s3Presigner;
  let region;
  if (typeof client.config.endpointProvider === "function") {
    const endpointV2 = await getEndpointFromInstructions(command.input, command.constructor, client.config);
    const authScheme = endpointV2.properties?.authSchemes?.[0];
    if (authScheme?.name === "sigv4a") {
      region = authScheme?.signingRegionSet?.join(",");
    } else {
      region = authScheme?.signingRegion;
    }
    s3Presigner = new S3RequestPresigner({
      ...client.config,
      signingName: authScheme?.signingName,
      region: async () => region
    });
  } else {
    s3Presigner = new S3RequestPresigner(client.config);
  }
  const presignInterceptMiddleware = /* @__PURE__ */ __name((next, context) => async (args) => {
    const { request } = args;
    if (!HttpRequest.isInstance(request)) {
      throw new Error("Request to be presigned is not an valid HTTP request.");
    }
    delete request.headers["amz-sdk-invocation-id"];
    delete request.headers["amz-sdk-request"];
    delete request.headers["x-amz-user-agent"];
    let presigned2;
    const presignerOptions = {
      ...options,
      signingRegion: options.signingRegion ?? context["signing_region"] ?? region,
      signingService: options.signingService ?? context["signing_service"]
    };
    if (context.s3ExpressIdentity) {
      presigned2 = await s3Presigner.presignWithCredentials(request, context.s3ExpressIdentity, presignerOptions);
    } else {
      presigned2 = await s3Presigner.presign(request, presignerOptions);
    }
    return {
      response: {},
      output: {
        $metadata: { httpStatusCode: 200 },
        presigned: presigned2
      }
    };
  }, "presignInterceptMiddleware");
  const middlewareName = "presignInterceptMiddleware";
  const clientStack = client.middlewareStack.clone();
  clientStack.addRelativeTo(presignInterceptMiddleware, {
    name: middlewareName,
    relation: "before",
    toMiddleware: "awsAuthMiddleware",
    override: true
  });
  const handler = command.resolveMiddleware(clientStack, client.config, {});
  const { output } = await handler({ input: command.input });
  const { presigned } = output;
  return formatUrl(presigned);
}, "getSignedUrl");

// src/index.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
var ENTITY_TABLE_MAP = {
  "PPM_PLAN": "ppm_plan",
  "OPERATION": "operation",
  "BUDGET_LINE": "budget_line",
  "LIVRABLE": "livrable",
  "ENTREPRISE": "entreprise",
  "GROUPEMENT": "groupement",
  "PROCEDURE": "procedure",
  "RECOURS": "recours",
  "ATTRIBUTION": "attribution",
  "ANO": "ano",
  "ECHEANCIER": "echeancier",
  "CLE_REPARTITION": "cle_repartition",
  "VISA_CF": "visa_cf",
  "ORDRE_SERVICE": "ordre_service",
  "AVENANT": "avenant",
  "RESILIATION": "resiliation",
  "GARANTIE": "garantie",
  "CLOTURE": "cloture",
  "DOCUMENT": "document",
  "DECOMPTE": "decompte",
  "DIFFICULTE": "difficulte"
};
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}
__name(errorResponse, "errorResponse");
function snakeToCamel(obj) {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_2, letter) => letter.toUpperCase());
      let value = obj[key];
      if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value)) {
        const numericKeys = ["montant", "total", "pourcentage", "pourcent"];
        if (numericKeys.some((k2) => camelKey.toLowerCase().includes(k2))) {
          value = parseFloat(value);
        }
      }
      acc[camelKey] = snakeToCamel(value);
      return acc;
    }, {});
  }
  return obj;
}
__name(snakeToCamel, "snakeToCamel");
function camelToSnake(obj) {
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      acc[snakeKey] = camelToSnake(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}
__name(camelToSnake, "camelToSnake");
async function queryDatabase(sql, env) {
  const db = Ys(env.DATABASE_URL);
  try {
    const result = await db(sql);
    return snakeToCamel(result);
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}
__name(queryDatabase, "queryDatabase");
async function getEntities(entityType, filter, env) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  let sql = `SELECT * FROM ${tableName}`;
  sql += " ORDER BY created_at DESC";
  return await queryDatabase(sql, env);
}
__name(getEntities, "getEntities");
async function getEntity(entityType, id, env) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  const sql = `SELECT * FROM ${tableName} WHERE id = '${id}'`;
  const result = await queryDatabase(sql, env);
  if (result.length === 0) {
    throw new Error("Entity not found");
  }
  return result[0];
}
__name(getEntity, "getEntity");
async function createEntity(entityType, data, env) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  const snakeData = camelToSnake(data);
  const columns = Object.keys(snakeData).filter((k2) => k2 !== "id");
  const values = columns.map((col) => {
    const val = snakeData[col];
    if (val === null || val === void 0)
      return "NULL";
    if (typeof val === "object")
      return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
    if (typeof val === "string")
      return `'${val.replace(/'/g, "''")}'`;
    return val;
  });
  const sql = `
    INSERT INTO ${tableName} (${columns.join(", ")})
    VALUES (${values.join(", ")})
    RETURNING *
  `;
  const result = await queryDatabase(sql, env);
  return result[0];
}
__name(createEntity, "createEntity");
async function updateEntity(entityType, id, patch, env) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  const snakePatch = camelToSnake(patch);
  const setClause = Object.keys(snakePatch).filter((k2) => k2 !== "id" && k2 !== "created_at").map((col) => {
    const val = snakePatch[col];
    if (val === null || val === void 0)
      return `${col} = NULL`;
    if (typeof val === "object")
      return `${col} = '${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
    if (typeof val === "string")
      return `${col} = '${val.replace(/'/g, "''")}'`;
    return `${col} = ${val}`;
  }).join(", ");
  const sql = `
    UPDATE ${tableName}
    SET ${setClause}
    WHERE id = '${id}'
    RETURNING *
  `;
  const result = await queryDatabase(sql, env);
  if (result.length === 0) {
    throw new Error("Entity not found");
  }
  return result[0];
}
__name(updateEntity, "updateEntity");
async function deleteEntity(entityType, id, env) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  const sql = `DELETE FROM ${tableName} WHERE id = '${id}' RETURNING *`;
  const result = await queryDatabase(sql, env);
  if (result.length === 0) {
    throw new Error("Entity not found");
  }
  return { success: true, deleted: result[0] };
}
__name(deleteEntity, "deleteEntity");
function getR2Client(env) {
  return new S3Client({
    region: "auto",
    endpoint: "https://a406a344d14de27baff112ae126d7144.r2.cloudflarestorage.com",
    credentials: {
      accessKeyId: "d508cf1caa97484a4dca02b300d3f891",
      secretAccessKey: "dadd484fb1d960ac8b66543be18eda446755df83f4d36223b9d7249b50bad317"
    }
  });
}
__name(getR2Client, "getR2Client");
async function uploadFileToR2(fileData, fileName, contentType, env) {
  const s3Client = getR2Client(env);
  const command = new PutObjectCommand({
    Bucket: "sidcf",
    Key: fileName,
    Body: fileData,
    ContentType: contentType
  });
  await s3Client.send(command);
  const publicUrl = `https://a406a344d14de27baff112ae126d7144.r2.cloudflarestorage.com/sidcf/${fileName}`;
  return publicUrl;
}
__name(uploadFileToR2, "uploadFileToR2");
async function getSignedDownloadUrl(fileName, env) {
  const s3Client = getR2Client(env);
  const command = new GetObjectCommand({
    Bucket: "sidcf",
    Key: fileName
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}
__name(getSignedDownloadUrl, "getSignedDownloadUrl");
async function deleteFileFromR2(fileName, env) {
  const s3Client = getR2Client(env);
  const command = new DeleteObjectCommand({
    Bucket: "sidcf",
    Key: fileName
  });
  await s3Client.send(command);
  return { success: true };
}
__name(deleteFileFromR2, "deleteFileFromR2");
async function getFileMetadata(fileName, env) {
  const s3Client = getR2Client(env);
  const command = new HeadObjectCommand({
    Bucket: "sidcf",
    Key: fileName
  });
  const response = await s3Client.send(command);
  return {
    size: response.ContentLength,
    contentType: response.ContentType,
    lastModified: response.LastModified
  };
}
__name(getFileMetadata, "getFileMetadata");
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  if (method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  try {
    if (path === "/health" || path === "/") {
      return jsonResponse({
        status: "ok",
        service: "SIDCF Portal API",
        version: "1.0.0",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (method === "GET" && path.match(/^\/api\/entities\/([A-Z_]+)$/)) {
      const entityType = path.split("/")[3];
      const filter = url.searchParams.get("filter") ? JSON.parse(url.searchParams.get("filter")) : null;
      const entities = await getEntities(entityType, filter, env);
      return jsonResponse(entities);
    }
    if (method === "GET" && path.match(/^\/api\/entities\/([A-Z_]+)\/[a-zA-Z0-9_-]+$/)) {
      const parts = path.split("/");
      const entityType = parts[3];
      const id = parts[4];
      const entity = await getEntity(entityType, id, env);
      return jsonResponse(entity);
    }
    if (method === "POST" && path.match(/^\/api\/entities\/([A-Z_]+)$/)) {
      const entityType = path.split("/")[3];
      const data = await request.json();
      const created = await createEntity(entityType, data, env);
      return jsonResponse(created, 201);
    }
    if (method === "PUT" && path.match(/^\/api\/entities\/([A-Z_]+)\/[a-zA-Z0-9_-]+$/)) {
      const parts = path.split("/");
      const entityType = parts[3];
      const id = parts[4];
      const patch = await request.json();
      const updated = await updateEntity(entityType, id, patch, env);
      return jsonResponse(updated);
    }
    if (method === "DELETE" && path.match(/^\/api\/entities\/([A-Z_]+)\/[a-zA-Z0-9_-]+$/)) {
      const parts = path.split("/");
      const entityType = parts[3];
      const id = parts[4];
      const result = await deleteEntity(entityType, id, env);
      return jsonResponse(result);
    }
    if (method === "POST" && path === "/api/files/upload") {
      const formData = await request.formData();
      const file = formData.get("file");
      const fileName = formData.get("fileName") || file.name;
      if (!file) {
        return errorResponse("No file provided", 400);
      }
      const arrayBuffer = await file.arrayBuffer();
      const url2 = await uploadFileToR2(
        new Uint8Array(arrayBuffer),
        fileName,
        file.type,
        env
      );
      return jsonResponse({
        success: true,
        url: url2,
        fileName,
        size: file.size,
        contentType: file.type
      });
    }
    if (method === "GET" && path.match(/^\/api\/files\/download\/.+$/)) {
      const fileName = path.split("/").slice(4).join("/");
      const signedUrl = await getSignedDownloadUrl(fileName, env);
      return jsonResponse({ url: signedUrl });
    }
    if (method === "DELETE" && path.match(/^\/api\/files\/.+$/)) {
      const fileName = path.split("/").slice(3).join("/");
      const result = await deleteFileFromR2(fileName, env);
      return jsonResponse(result);
    }
    if (method === "GET" && path.match(/^\/api\/files\/metadata\/.+$/)) {
      const fileName = path.split("/").slice(4).join("/");
      const metadata = await getFileMetadata(fileName, env);
      return jsonResponse(metadata);
    }
    if (method === "GET" && path === "/api/stats") {
      const stats = await queryDatabase("SELECT * FROM v_stats_global", env);
      return jsonResponse(stats[0] || {});
    }
    if (method === "GET" && path === "/api/operations/full") {
      const operations = await queryDatabase("SELECT * FROM v_operations_full ORDER BY created_at DESC", env);
      return jsonResponse(operations);
    }
    if (method === "GET" && path === "/api/config/phases") {
      const phases = await queryDatabase("SELECT * FROM phase_config WHERE is_active = true ORDER BY mode_passation, phase_order", env);
      return jsonResponse(phases);
    }
    if (method === "GET" && path.match(/^\/api\/config\/phases\/[A-Z]+$/)) {
      const modePassation = path.split("/")[4];
      const phases = await queryDatabase(
        `SELECT * FROM phase_config WHERE mode_passation = '${modePassation}' AND is_active = true ORDER BY phase_order`,
        env
      );
      return jsonResponse(phases);
    }
    if (method === "PUT" && path.match(/^\/api\/config\/phases\/\d+$/)) {
      const id = path.split("/")[4];
      const data = await request.json();
      const snakeData = camelToSnake(data);
      const setClause = Object.keys(snakeData).filter((k2) => k2 !== "id" && k2 !== "created_at").map((col) => {
        const val = snakeData[col];
        if (val === null || val === void 0)
          return `${col} = NULL`;
        if (typeof val === "boolean")
          return `${col} = ${val}`;
        if (typeof val === "number")
          return `${col} = ${val}`;
        return `${col} = '${String(val).replace(/'/g, "''")}'`;
      }).join(", ");
      const sql = `UPDATE phase_config SET ${setClause} WHERE id = ${id} RETURNING *`;
      const result = await queryDatabase(sql, env);
      if (result.length === 0) {
        return errorResponse("Phase configuration not found", 404);
      }
      return jsonResponse(result[0]);
    }
    if (method === "POST" && path === "/api/config/phases") {
      const data = await request.json();
      const snakeData = camelToSnake(data);
      const columns = Object.keys(snakeData).filter((k2) => k2 !== "id");
      const values = columns.map((col) => {
        const val = snakeData[col];
        if (val === null || val === void 0)
          return "NULL";
        if (typeof val === "boolean")
          return val;
        if (typeof val === "number")
          return val;
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      const sql = `INSERT INTO phase_config (${columns.join(", ")}) VALUES (${values.join(", ")}) RETURNING *`;
      const result = await queryDatabase(sql, env);
      return jsonResponse(result[0], 201);
    }
    if (method === "DELETE" && path.match(/^\/api\/config\/phases\/\d+$/)) {
      const id = path.split("/")[4];
      const result = await queryDatabase(`DELETE FROM phase_config WHERE id = ${id} RETURNING *`, env);
      if (result.length === 0) {
        return errorResponse("Phase configuration not found", 404);
      }
      return jsonResponse({ success: true, deleted: result[0] });
    }
    return errorResponse("Route not found", 404);
  } catch (error) {
    console.error("Request error:", error);
    return errorResponse(error.message, 500);
  }
}
__name(handleRequest, "handleRequest");
var src_default = {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e2) {
      console.error("Failed to drain the unused request body.", e2);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function reduceError(e2) {
  return {
    name: e2?.name,
    message: e2?.message ?? String(e2),
    stack: e2?.stack,
    cause: e2?.cause === void 0 ? void 0 : reduceError(e2.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e2) {
    const error = reduceError(e2);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-fP9Tqa/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-fP9Tqa/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

@neondatabase/serverless/index.mjs:
  (*! Bundled license information:
  
  ieee754/index.js:
    (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)
  
  buffer/index.js:
    (*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <https://feross.org>
     * @license  MIT
     *)
  *)
*/
//# sourceMappingURL=index.js.map
