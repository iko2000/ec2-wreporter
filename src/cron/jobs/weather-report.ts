//@ts-nocheck
import { fetchWeatherApi } from "openmeteo";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

type NextHour = { time: Date; temperature_2m: number };

export async function runWeatherEmailReport(
  latitude = 52.52,
  longitude = 13.41,
  to: string | string[] = process.env.MAIL_TO || ""
) {
  const params = {
    latitude,
    longitude,
    hourly: "temperature_2m",
    timezone: "auto"
  };

  console.log("RUnning the job...");
  const url = "https://api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);
  const response = responses[0];

  // Meta
  const latitudeOut = response.latitude();
  const longitudeOut = response.longitude();
  const elevation = response.elevation();
  const utcOffsetSeconds = response.utcOffsetSeconds();
  const tzName = (response as any).timezone?.() || "local to location";

  // Hourly series
  const hourly = response.hourly()!;
  const start = Number(hourly.time());
  const end = Number(hourly.timeEnd());
  const interval = hourly.interval();
  const steps = (end - start) / interval;
  const temps = Array.from(hourly.variables(0)!.valuesArray());

  const times: Date[] = Array.from({ length: steps }, (_, i) =>
    new Date((start + i * interval + utcOffsetSeconds) * 1000)
  );

  const hourlyPairs: NextHour[] = times.map((time, i) => ({
    time,
    temperature_2m: temps[i],
  }));

  const nowLocal = new Date(Date.now() + utcOffsetSeconds * 1000);
  const next6 = hourlyPairs.filter(r => r.time >= floorToHour(nowLocal)).slice(0, 6);
  const window6 = next6.length ? next6 : hourlyPairs.slice(0, 6);

  console.log(
    `\nCoordinates: ${latitudeOut.toFixed(3)}°, ${longitudeOut.toFixed(3)}°`,
    `\nElevation: ${Math.round(elevation)} m`,
    `\nTimezone: ${tzName}`,
    `\nUTC offset (s): ${utcOffsetSeconds}`
  );
  console.table(
    window6.map(x => ({
      time_local: toISOHour(x.time),
      temperature_2m: Number(x.temperature_2m.toFixed(1)),
    }))
  );

  const subject = buildSubject(window6, tzName);
  const html = buildHtmlTemplate({
    coords: { lat: latitudeOut, lon: longitudeOut, elevation, tzName },
    hours: window6,
  });
  const text = buildTextFallback({
    coords: { lat: latitudeOut, lon: longitudeOut, tzName },
    hours: window6,
  });

  await sendEmailWithResend({ to, subject, html, text });

  return window6;
}

// --- helpers ---------------------------------------------------------------

function floorToHour(d: Date) { const x = new Date(d); x.setMinutes(0,0,0); return x; }
function toISOHour(d: Date) { return d.toISOString().replace(/:\d{2}\.\d{3}Z$/, ":00Z"); }
function fmtHour(d: Date) {
  return d.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });
}
function round1(n: number) { return Math.round(n * 10) / 10; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function pctBetween(v: number, min: number, max: number) {
  if (max === min) return 100;
  return clamp(((v - min) / (max - min)) * 100, 0, 100);
}
function emojiForTempRange(minT: number, maxT: number) {
  const mid = (minT + maxT) / 2;
  if (mid <= 0) return "❄️";
  if (mid < 10) return "🧥";
  if (mid < 20) return "🌤️";
  if (mid < 28) return "☀️";
  return "🥵";
}

function buildSubject(hours: NextHour[], tzName: string) {
  const minT = Math.min(...hours.map(h => h.temperature_2m));
  const maxT = Math.max(...hours.map(h => h.temperature_2m));
  const start = hours[0]?.time, end = hours[hours.length - 1]?.time;
  const range = start && end ? `${fmtHour(start)} → ${fmtHour(end)}` : "Next 6 hours";
  const emoji = emojiForTempRange(minT, maxT);
  // Cleaner, scannable subject
  return `${emoji} Next 6h • ${round1(minT)}°–${round1(maxT)}° (${tzName}) • ${range}`;
}

function buildHtmlTemplate(opts: {
  coords: { lat: number; lon: number; elevation: number; tzName: string };
  hours: NextHour[];
}) {
  const { coords, hours } = opts;

  const minT = Math.min(...hours.map(h => h.temperature_2m));
  const maxT = Math.max(...hours.map(h => h.temperature_2m));
  const emoji = emojiForTempRange(minT, maxT);

  const rows = hours.map(h => {
    const t = round1(h.temperature_2m);
    const w = Math.round(pctBetween(h.temperature_2m, minT, maxT));
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #EFEFEF;">
          <div style="font-weight:600;font-size:14px;">${fmtHour(h.time)}</div>
          <div style="margin-top:6px;height:8px;background:#F1F5F9;border-radius:999px;overflow:hidden;">
            <div style="height:8px;width:${w}%;background:#0EA5E9;"></div>
          </div>
        </td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid #EFEFEF;">
          <div style="font-weight:700;font-size:16px;">${t}°C</div>
        </td>
      </tr>`;
  }).join("");

  // Hidden preheader for better inbox preview
  const preheader = `Next 6 hours in ${coords.tzName}. Range ${round1(minT)}°C–${round1(maxT)}°C.`;

  return `
  <!doctype html>
  <html lang="en">
    <body style="margin:0;padding:0;background:#FFFFFF;">
      <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
        ${preheader}
      </span>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B1220;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#0B1220;">
              <tr>
                <td style="padding:0 8px 16px 8px;">
                  <!-- Card -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.25);">
                    <!-- Header -->
                    <tr>
                      <td style="padding:20px 20px 12px 20px;background:linear-gradient(135deg,#0EA5E9,#22D3EE);">
                        <div style="font-size:14px;color:#E8FAFF;opacity:0.9;">${coords.tzName}</div>
                        <div style="font-size:22px;font-weight:800;color:#FFFFFF;margin-top:6px;">
                          ${emoji} Next 6 Hours
                        </div>
                        <div style="margin-top:10px;">
                          <span style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;padding:6px 10px;border-radius:999px;font-size:13px;font-weight:600;">
                            Range: ${round1(minT)}°C – ${round1(maxT)}°C
                          </span>
                        </div>
                      </td>
                    </tr>

                    <!-- Meta line -->
                    <tr>
                      <td style="padding:12px 20px 0 20px;color:#475569;font-size:12px;">
                        Coords&nbsp;<strong>${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}</strong> &middot;
                        Elev&nbsp;<strong>${Math.round(coords.elevation)} m</strong>
                      </td>
                    </tr>

                    <!-- Table -->
                    <tr>
                      <td style="padding:8px 20px 20px 20px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                          <thead>
                            <tr>
                              <th align="left" style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:.04em;">
                                Local time
                              </th>
                              <th align="right" style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:.04em;">
                                Temperature
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            ${rows}
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding:14px 20px 20px 20px;color:#94A3B8;font-size:12px;background:#F8FAFC;border-top:1px solid #EEF2F7;">
                        Source: Open-Meteo • Generated automatically.
                      </td>
                    </tr>
                  </table>
                  <!-- /Card -->
                </td>
              </tr>

              <!-- Tiny brand/footer -->
              <tr>
                <td align="center" style="padding:10px 8px 0 8px;font-size:11px;color:#A8B0BD;">
                  Weather email report
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

function buildTextFallback(opts: {
  coords: { lat: number; lon: number; tzName: string };
  hours: NextHour[];
}) {
  const { coords, hours } = opts;
  const lines = hours.map(h => `${fmtHour(h.time)}: ${round1(h.temperature_2m)}°C`).join("\n");
  const minT = Math.min(...hours.map(h => h.temperature_2m));
  const maxT = Math.max(...hours.map(h => h.temperature_2m));
  return `Next 6 hours (${coords.tzName}) @ ${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}
Range: ${round1(minT)}°C–${round1(maxT)}°C

${lines}

Source: Open-Meteo`;
}

async function sendEmailWithResend({
  to, subject, html, text,
}: {
  to: string | string[]; subject: string; html: string; text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY!;
  console.log(process.env.RESEND_API_KEY)
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

  const resend = new Resend(apiKey);

  console.log("Key was there..");

  const from = process.env.MAIL_FROM!;
  console.log(from);

  if (!from) throw new Error("Missing MAIL_FROM (must be a verified domain/sender in Resend)");

  const toList = Array.isArray(to)
    ? to
    : (typeof to === "string" && to.includes(",")) ? to.split(",").map(s => s.trim()) : to;

  const { data, error } = await resend.emails.send({
    from,
    to: toList as any, // Resend accepts string | string[]
    subject,
    html,
    text,
  });

  if (error) throw error;

  console.log(data);
}

runWeatherEmailReport().catch((e) => {
  console.error(e);
  process.exit(1);
});
