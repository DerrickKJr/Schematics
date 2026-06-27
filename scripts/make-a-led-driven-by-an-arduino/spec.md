# Design spec — make a led driven by an arduino

_Produced by the Spec Agent._

# LED Driver – Arduino GPIO → Current-Limiting Resistor → LED

## 1. One-Line Summary
A single LED driven directly from an Arduino digital output pin through a current-limiting resistor.

---

## 2. Bill of Materials

| Ref | Component | Role | Value / Part |
|-----|-----------|------|--------------|
| U1 | Arduino Uno R3 (pin header footprint) | Microcontroller / signal source | — |
| R1 | Resistor | Current limiter | 220 Ω, 1/4 W — LCSC **C58678** |
| LED1 | Red LED (3mm or 5mm) | Visual indicator | Vf ≈ 2.0 V, 20 mA — LCSC **C84256** |

---

## 3. Net List

```
Arduino Pin 13  →  R1 pin 1
R1 pin 2        →  LED1 Anode
LED1 Cathode    →  GND (Arduino GND pin)
```

---

## 4. Key Values / Calculations

| Parameter | Value |
|-----------|-------|
| Supply voltage (Vout pin 13) | 5 V |
| LED forward voltage (Vf) | 2.0 V |
| Desired LED current (If) | ~15 mA |
| Required resistance | (5 V − 2.0 V) / 0.015 A = **200 Ω** |
| Chosen standard value | **220 Ω** (next standard value above 200 Ω) |
| Actual current with 220 Ω | (5 − 2.0) / 220 ≈ **13.6 mA** ✓ (within 20 mA max) |

---

**Notes:**
- Arduino Pin 13 is used because it has an on-board LED already connected, making firmware testing trivial (`digitalWrite(13, HIGH/LOW)`).
- GND must be shared between the Arduino and the schematic ground net.
- No external power supply needed; the Arduino is powered via USB.
