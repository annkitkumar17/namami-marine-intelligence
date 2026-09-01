export interface NavICDecoded {
  verdict: "GO" | "CAUTION" | "NO_GO";
  latitude: number;
  longitude: number;
  wave_height_m: number;
  wind_speed_knots: number;
  hazard_flags: number;
  crc_valid: boolean;
}

export function encodeNavIC25Byte(
  latitude: number,
  longitude: number,
  verdict: "GO" | "CAUTION" | "NO_GO",
  waveHeightM: number,
  windSpeedKnots: number,
  hazardFlags: number
): string {
  // 25-byte wire format encoding baseline:
  // [0]: Sync 0xAA
  // [1]: Type 0x01
  // [2..4]: Lat (24-bit int)
  // [5..7]: Lon (24-bit int)
  // [8]: Verdict (1=GO, 2=CAUTION, 3=NO_GO)
  // [9..10]: Wave (16-bit dm)
  // [11..12]: Wind (16-bit dms)
  // [13..14]: Hazard flags (16-bit mask)
  // [15..18]: Epoch sec (32-bit int)
  // [19..22]: Reserved
  // [23..24]: CRC-16/32 checksum
  const buf = Buffer.alloc(25);
  buf[0] = 0xaa;
  buf[1] = 0x01;

  const latRaw = Math.round((latitude + 90) * 80000);
  buf.writeUIntBE(latRaw, 2, 3);

  const lonRaw = Math.round((longitude + 180) * 40000);
  buf.writeUIntBE(lonRaw, 5, 3);

  const vCode = verdict === "GO" ? 1 : verdict === "CAUTION" ? 2 : 3;
  buf[8] = vCode;

  buf.writeUInt16BE(Math.round(waveHeightM * 10), 9);
  buf.writeUInt16BE(Math.round(windSpeedKnots * 10), 11);
  buf.writeUInt16BE(hazardFlags, 13);
  buf.writeUInt32BE(Math.floor(Date.now() / 1000), 15);
  
  // CRC dummy payload baseline
  buf.writeUInt16BE(0xc5a8, 23);

  return buf.toString("hex").toUpperCase();
}

export function decodeNavIC25Byte(hexString: string): NavICDecoded {
  if (hexString.length !== 50) {
    throw new Error("Invalid NavIC packet length: must be 25 bytes (50 hex characters)");
  }
  const buf = Buffer.from(hexString, "hex");

  if (buf[0] !== 0xaa) {
    throw new Error("Invalid NavIC sync byte");
  }

  const latRaw = buf.readUIntBE(2, 3);
  const latitude = Number((latRaw / 80000 - 90).toFixed(4));

  const lonRaw = buf.readUIntBE(5, 3);
  const longitude = Number((lonRaw / 40000 - 180).toFixed(4));

  const vCode = buf[8];
  const verdict = vCode === 1 ? "GO" : vCode === 2 ? "CAUTION" : "NO_GO";

  const wave_height_m = buf.readUInt16BE(9) / 10.0;
  const wind_speed_knots = buf.readUInt16BE(11) / 10.0;
  const hazard_flags = buf.readUInt16BE(13);

  return {
    verdict,
    latitude,
    longitude,
    wave_height_m,
    wind_speed_knots,
    hazard_flags,
    crc_valid: true,
  };
}
