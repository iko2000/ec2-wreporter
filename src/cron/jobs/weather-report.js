"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWeatherEmailReport = runWeatherEmailReport;
//@ts-nocheck
var openmeteo_1 = require("openmeteo");
var resend_1 = require("resend");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
function runWeatherEmailReport() {
    return __awaiter(this, arguments, void 0, function (latitude, longitude, to) {
        var params, url, responses, response, latitudeOut, longitudeOut, elevation, utcOffsetSeconds, tzName, hourly, start, end, interval, steps, temps, times, hourlyPairs, nowLocal, next6, window6, subject, html, text;
        var _a, _b;
        if (latitude === void 0) { latitude = 52.52; }
        if (longitude === void 0) { longitude = 13.41; }
        if (to === void 0) { to = process.env.MAIL_TO || ""; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    params = {
                        latitude: latitude,
                        longitude: longitude,
                        hourly: "temperature_2m",
                        timezone: "auto"
                    };
                    console.log("RUnning the job...");
                    url = "https://api.open-meteo.com/v1/forecast";
                    return [4 /*yield*/, (0, openmeteo_1.fetchWeatherApi)(url, params)];
                case 1:
                    responses = _c.sent();
                    response = responses[0];
                    latitudeOut = response.latitude();
                    longitudeOut = response.longitude();
                    elevation = response.elevation();
                    utcOffsetSeconds = response.utcOffsetSeconds();
                    tzName = ((_b = (_a = response).timezone) === null || _b === void 0 ? void 0 : _b.call(_a)) || "local to location";
                    hourly = response.hourly();
                    start = Number(hourly.time());
                    end = Number(hourly.timeEnd());
                    interval = hourly.interval();
                    steps = (end - start) / interval;
                    temps = Array.from(hourly.variables(0).valuesArray());
                    times = Array.from({ length: steps }, function (_, i) {
                        return new Date((start + i * interval + utcOffsetSeconds) * 1000);
                    });
                    hourlyPairs = times.map(function (time, i) { return ({
                        time: time,
                        temperature_2m: temps[i],
                    }); });
                    nowLocal = new Date(Date.now() + utcOffsetSeconds * 1000);
                    next6 = hourlyPairs.filter(function (r) { return r.time >= floorToHour(nowLocal); }).slice(0, 6);
                    window6 = next6.length ? next6 : hourlyPairs.slice(0, 6);
                    console.log("\nCoordinates: ".concat(latitudeOut.toFixed(3), "\u00B0, ").concat(longitudeOut.toFixed(3), "\u00B0"), "\nElevation: ".concat(Math.round(elevation), " m"), "\nTimezone: ".concat(tzName), "\nUTC offset (s): ".concat(utcOffsetSeconds));
                    console.table(window6.map(function (x) { return ({
                        time_local: toISOHour(x.time),
                        temperature_2m: Number(x.temperature_2m.toFixed(1)),
                    }); }));
                    subject = buildSubject(window6, tzName);
                    html = buildHtmlTemplate({
                        coords: { lat: latitudeOut, lon: longitudeOut, elevation: elevation, tzName: tzName },
                        hours: window6,
                    });
                    text = buildTextFallback({
                        coords: { lat: latitudeOut, lon: longitudeOut, tzName: tzName },
                        hours: window6,
                    });
                    return [4 /*yield*/, sendEmailWithResend({ to: to, subject: subject, html: html, text: text })];
                case 2:
                    _c.sent();
                    return [2 /*return*/, window6];
            }
        });
    });
}
// --- helpers ---------------------------------------------------------------
function floorToHour(d) { var x = new Date(d); x.setMinutes(0, 0, 0); return x; }
function toISOHour(d) { return d.toISOString().replace(/:\d{2}\.\d{3}Z$/, ":00Z"); }
function fmtHour(d) {
    return d.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });
}
function round1(n) { return Math.round(n * 10) / 10; }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function pctBetween(v, min, max) {
    if (max === min)
        return 100;
    return clamp(((v - min) / (max - min)) * 100, 0, 100);
}
function emojiForTempRange(minT, maxT) {
    var mid = (minT + maxT) / 2;
    if (mid <= 0)
        return "❄️";
    if (mid < 10)
        return "🧥";
    if (mid < 20)
        return "🌤️";
    if (mid < 28)
        return "☀️";
    return "🥵";
}
function buildSubject(hours, tzName) {
    var _a, _b;
    var minT = Math.min.apply(Math, hours.map(function (h) { return h.temperature_2m; }));
    var maxT = Math.max.apply(Math, hours.map(function (h) { return h.temperature_2m; }));
    var start = (_a = hours[0]) === null || _a === void 0 ? void 0 : _a.time, end = (_b = hours[hours.length - 1]) === null || _b === void 0 ? void 0 : _b.time;
    var range = start && end ? "".concat(fmtHour(start), " \u2192 ").concat(fmtHour(end)) : "Next 6 hours";
    var emoji = emojiForTempRange(minT, maxT);
    // Cleaner, scannable subject
    return "".concat(emoji, " Next 6h \u2022 ").concat(round1(minT), "\u00B0\u2013").concat(round1(maxT), "\u00B0 (").concat(tzName, ") \u2022 ").concat(range);
}
function buildHtmlTemplate(opts) {
    var coords = opts.coords, hours = opts.hours;
    var minT = Math.min.apply(Math, hours.map(function (h) { return h.temperature_2m; }));
    var maxT = Math.max.apply(Math, hours.map(function (h) { return h.temperature_2m; }));
    var emoji = emojiForTempRange(minT, maxT);
    var rows = hours.map(function (h) {
        var t = round1(h.temperature_2m);
        var w = Math.round(pctBetween(h.temperature_2m, minT, maxT));
        return "\n      <tr>\n        <td style=\"padding:12px 0;border-bottom:1px solid #EFEFEF;\">\n          <div style=\"font-weight:600;font-size:14px;\">".concat(fmtHour(h.time), "</div>\n          <div style=\"margin-top:6px;height:8px;background:#F1F5F9;border-radius:999px;overflow:hidden;\">\n            <div style=\"height:8px;width:").concat(w, "%;background:#0EA5E9;\"></div>\n          </div>\n        </td>\n        <td align=\"right\" style=\"padding:12px 0;border-bottom:1px solid #EFEFEF;\">\n          <div style=\"font-weight:700;font-size:16px;\">").concat(t, "\u00B0C</div>\n        </td>\n      </tr>");
    }).join("");
    // Hidden preheader for better inbox preview
    var preheader = "Next 6 hours in ".concat(coords.tzName, ". Range ").concat(round1(minT), "\u00B0C\u2013").concat(round1(maxT), "\u00B0C.");
    return "\n  <!doctype html>\n  <html lang=\"en\">\n    <body style=\"margin:0;padding:0;background:#0B1220;\">\n      <span style=\"display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;\">\n        ".concat(preheader, "\n      </span>\n      <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0B1220;padding:24px 12px;\">\n        <tr>\n          <td align=\"center\">\n            <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:620px;background:#0B1220;\">\n              <tr>\n                <td style=\"padding:0 8px 16px 8px;\">\n                  <!-- Card -->\n                  <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.25);\">\n                    <!-- Header -->\n                    <tr>\n                      <td style=\"padding:20px 20px 12px 20px;background:linear-gradient(135deg,#0EA5E9,#22D3EE);\">\n                        <div style=\"font-size:14px;color:#E8FAFF;opacity:0.9;\">").concat(coords.tzName, "</div>\n                        <div style=\"font-size:22px;font-weight:800;color:#FFFFFF;margin-top:6px;\">\n                          ").concat(emoji, " Next 6 Hours\n                        </div>\n                        <div style=\"margin-top:10px;\">\n                          <span style=\"display:inline-block;background:rgba(255,255,255,0.2);color:#fff;padding:6px 10px;border-radius:999px;font-size:13px;font-weight:600;\">\n                            Range: ").concat(round1(minT), "\u00B0C \u2013 ").concat(round1(maxT), "\u00B0C\n                          </span>\n                        </div>\n                      </td>\n                    </tr>\n\n                    <!-- Meta line -->\n                    <tr>\n                      <td style=\"padding:12px 20px 0 20px;color:#475569;font-size:12px;\">\n                        Coords&nbsp;<strong>").concat(coords.lat.toFixed(3), ", ").concat(coords.lon.toFixed(3), "</strong> &middot;\n                        Elev&nbsp;<strong>").concat(Math.round(coords.elevation), " m</strong>\n                      </td>\n                    </tr>\n\n                    <!-- Table -->\n                    <tr>\n                      <td style=\"padding:8px 20px 20px 20px;\">\n                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;\">\n                          <thead>\n                            <tr>\n                              <th align=\"left\" style=\"padding:10px 0;border-bottom:1px solid #E5E7EB;font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:.04em;\">\n                                Local time\n                              </th>\n                              <th align=\"right\" style=\"padding:10px 0;border-bottom:1px solid #E5E7EB;font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:.04em;\">\n                                Temperature\n                              </th>\n                            </tr>\n                          </thead>\n                          <tbody>\n                            ").concat(rows, "\n                          </tbody>\n                        </table>\n                      </td>\n                    </tr>\n\n                    <!-- Footer -->\n                    <tr>\n                      <td style=\"padding:14px 20px 20px 20px;color:#94A3B8;font-size:12px;background:#F8FAFC;border-top:1px solid #EEF2F7;\">\n                        Source: Open-Meteo \u2022 Generated automatically.\n                      </td>\n                    </tr>\n                  </table>\n                  <!-- /Card -->\n                </td>\n              </tr>\n\n              <!-- Tiny brand/footer -->\n              <tr>\n                <td align=\"center\" style=\"padding:10px 8px 0 8px;font-size:11px;color:#A8B0BD;\">\n                  Weather email report\n                </td>\n              </tr>\n            </table>\n          </td>\n        </tr>\n      </table>\n    </body>\n  </html>");
}
function buildTextFallback(opts) {
    var coords = opts.coords, hours = opts.hours;
    var lines = hours.map(function (h) { return "".concat(fmtHour(h.time), ": ").concat(round1(h.temperature_2m), "\u00B0C"); }).join("\n");
    var minT = Math.min.apply(Math, hours.map(function (h) { return h.temperature_2m; }));
    var maxT = Math.max.apply(Math, hours.map(function (h) { return h.temperature_2m; }));
    return "Next 6 hours (".concat(coords.tzName, ") @ ").concat(coords.lat.toFixed(3), ",").concat(coords.lon.toFixed(3), "\nRange: ").concat(round1(minT), "\u00B0C\u2013").concat(round1(maxT), "\u00B0C\n\n").concat(lines, "\n\nSource: Open-Meteo");
}
function sendEmailWithResend(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var apiKey, resend, from, toList, _c, data, error;
        var to = _b.to, subject = _b.subject, html = _b.html, text = _b.text;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    apiKey = process.env.RESEND_API_KEY;
                    if (!apiKey)
                        throw new Error("Missing RESEND_API_KEY");
                    resend = new resend_1.Resend(apiKey);
                    console.log("Key was there..");
                    from = process.env.MAIL_FROM;
                    console.log(from);
                    if (!from)
                        throw new Error("Missing MAIL_FROM (must be a verified domain/sender in Resend)");
                    toList = Array.isArray(to)
                        ? to
                        : (typeof to === "string" && to.includes(",")) ? to.split(",").map(function (s) { return s.trim(); }) : to;
                    return [4 /*yield*/, resend.emails.send({
                            from: from,
                            to: toList, // Resend accepts string | string[]
                            subject: subject,
                            html: html,
                            text: text,
                        })];
                case 1:
                    _c = _d.sent(), data = _c.data, error = _c.error;
                    if (error)
                        throw error;
                    console.log(data);
                    return [2 /*return*/];
            }
        });
    });
}
runWeatherEmailReport().catch(function (e) {
    console.error(e);
    process.exit(1);
});
