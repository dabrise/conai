import type { AdasModule } from '../types';

export const DEFAULT_ADAS_MODULES: AdasModule[] = [
  {
    id: 'eco-roll',
    name: 'Eco-Roll (Cruise Control)',
    shortName: 'Eco-Roll',
    enabled: true,
    difficulty: 'hard',
    description: 'Most complicated ADAS feature. Drivers are fundamentally confused about how and when it activates. Causes social stress when truck slows down unexpectedly.',
    knowledge: `Eco-Roll (CC with Eco-Roll) Knowledge Base:

What it is: Eco-Roll is a fuel-saving feature within the Cruise Control system. When conditions allow, the truck automatically coasts (disengages the drivetrain) on downhill slopes or when momentum is sufficient, reducing fuel consumption.

Three modes:
1. Active: The truck is currently coasting to save fuel. The engine is at idle while the truck uses its momentum.
2. Standby: Eco-Roll is enabled but conditions aren't currently right for coasting (e.g., too steep, speed too low).
3. Off: Eco-Roll has been deactivated by the driver or system.

Activation conditions (ALL must be met):
- Cruise Control must be active
- Vehicle speed within the Eco-Roll speed range
- Road gradient must be favorable (slight downhill or flat)
- No active braking or acceleration
- Retarder/engine brake not engaged
- No sharp curves detected ahead

Common driver confusions:
- "Why did the truck slow down?" -> Eco-Roll released the gas to coast and save fuel
- "Why won't it activate?" -> One of the activation conditions isn't met
- "Other drivers are getting annoyed behind me" -> Social stress from unexpected speed reduction
- "Is something wrong with my truck?" -> No, this is normal energy-saving behavior

Key phrases for explaining:
- "Eco-Roll is coasting to save fuel"
- "The truck is using its momentum instead of engine power"
- "Eco-Roll deactivated because [specific condition changed]"
- "This is normal behavior designed to reduce fuel consumption"`,
  },
  {
    id: 'lka',
    name: 'Lane Keep Assist (LKA)',
    shortName: 'LKA',
    enabled: true,
    difficulty: 'medium',
    description: 'Moderate complexity. Inconsistent performance causes scary moments. Drivers experience unexpected steering corrections and silent disengagements.',
    knowledge: `Lane Keep Assist (LKA) Knowledge Base:

What it is: LKA uses a camera to detect lane markings and provides gentle steering corrections to help keep the truck centered in its lane. It is a support system, NOT autonomous steering.

How it works:
- Camera monitors lane markings ahead
- System applies gentle steering torque when the truck drifts toward a lane boundary
- Driver always has priority -- any steering input overrides LKA
- Works best on highways with clear, well-maintained lane markings

Limitations (critical for trust):
- CANNOT function without visible lane markings (snow, rain, faded markings, construction zones)
- Reduced performance in low light, fog, or direct sunlight/glare
- May disengage silently on sharp curves
- Does NOT work at very low speeds (e.g., parking, traffic jams)
- Slush, mud, or debris on the camera lens will degrade or disable it

Common driver confusions:
- "It suddenly stopped working" -> Lane markings likely became unclear (snow, faded, construction)
- "It scared me with a sudden correction" -> Driver was drifting and LKA intervened
- "Why does it wobble on curves?" -> The system has limits on curve radius it can handle
- "It works sometimes and not others" -> Depends on lane marking quality and visibility

Key phrases for explaining:
- "LKA relies on visible lane markings to function"
- "The camera can't see the lane -- LKA is temporarily reduced"
- "That was LKA gently correcting your lane position"
- "You're always in control -- your steering overrides LKA"
- "LKA is a support system, not autopilot"`,
  },
  {
    id: 'isa',
    name: 'Intelligent Speed Assist (ISA)',
    shortName: 'ISA',
    enabled: true,
    difficulty: 'easy',
    description: 'Easiest to understand. Concept is clear but drivers question technical accuracy of speed limit data and get frustrated by false warnings.',
    knowledge: `Intelligent Speed Assist (ISA) Knowledge Base:

What it is: ISA uses camera-based sign recognition and/or map data to detect the current speed limit, and alerts the driver when they exceed it. Depending on configuration, it may also provide gentle resistance on the accelerator pedal.

How it works:
- Camera reads speed limit signs
- Map database provides supplementary speed limit information
- System compares current speed against detected limit
- Alerts via visual display, audible warning, and/or haptic feedback (pedal vibration)
- Driver can always override by pressing firmly on the accelerator

Limitations (critical for trust):
- Camera may misread signs (temporary signs, obscured signs, unusual formats)
- Map data may be outdated (new speed zones, construction)
- Cannot always distinguish between main road and adjacent road signs
- Weather conditions (snow covering signs, fog) reduce camera reliability
- Some temporary speed limits may not be in the map database

Common driver confusions:
- "It keeps warning me but I'm going the right speed" -> Sign may have been misread or map data is outdated
- "Why does it think the limit is 50 on a highway?" -> Possibly reading an exit ramp or parallel road sign
- "It never warns me when the limit changes" -> The sign may be obscured or in an unusual position
- "I trust my own eyes more than the system" -> That's valid; ISA is a support tool, not a replacement for driver awareness

Key phrases for explaining:
- "ISA detected a speed limit of [X] km/h"
- "The camera may have misread a sign -- trust your own observation"
- "ISA combines camera and map data, but neither is perfect"
- "You can always override ISA -- it's advisory, not mandatory"`,
  },
  {
    id: 'bsw',
    name: 'Blind Spot Warning (BSW)',
    shortName: 'BSW',
    enabled: false,
    difficulty: 'easy',
    description: 'Lower difficulty but high learning potential. Drivers experience alert fatigue from false warnings about non-existent vehicles.',
    knowledge: `Blind Spot Warning (BSW) Knowledge Base:

What it is: BSW uses radar sensors to detect vehicles in the truck's blind spots (areas not visible in mirrors). It alerts the driver visually (light in mirror) and/or audibly when a vehicle is detected in the blind zone during lane changes.

How it works:
- Radar sensors monitor blind spot zones on both sides of the truck
- Visual indicator (typically a light in or near the side mirror) shows when a vehicle is detected
- If the driver activates the turn signal while a vehicle is in the blind spot, an audible/haptic warning is triggered
- System is active above a minimum speed threshold

Limitations:
- May produce false alerts from guardrails, barriers, or road infrastructure
- Stationary objects at certain angles may trigger warnings
- Very small vehicles (motorcycles, bicycles) may not always be reliably detected
- Sensor coverage has defined zones -- some blind spots may not be fully covered
- Heavy rain or spray may affect sensor performance

Common driver confusions:
- "It keeps warning but nothing is there" -> Likely detecting guardrails or infrastructure
- "I don't trust it anymore because of false alarms" -> Alert fatigue is a real problem; understanding the false alarm sources helps
- "Can it see motorcycles?" -> Detection of smaller vehicles is less reliable

Key phrases for explaining:
- "BSW detected something in your blind spot on the [left/right]"
- "That may have been a false alert from road infrastructure"
- "BSW is most reliable for detecting larger vehicles like cars and trucks"
- "Always check your mirrors -- BSW is an additional safety layer, not a replacement"`,
  },
  {
    id: 'ldw',
    name: 'Lane Departure Warning (LDW/LDWAS)',
    shortName: 'LDW',
    enabled: false,
    difficulty: 'easy',
    description: 'Simplest warning system. Alerts when leaving lane unintentionally. Low confusion potential but important for understanding warning vs. assist distinction.',
    knowledge: `Lane Departure Warning (LDW / LDWAS) Knowledge Base:

What it is: LDW monitors lane markings and warns the driver when the truck begins to drift out of its lane without a turn signal being activated. Unlike LKA, it does NOT steer -- it only warns.

How it works:
- Camera tracks lane markings
- When the truck approaches or crosses a lane boundary without turn signal, a warning is triggered
- Warning is typically haptic (seat vibration or steering vibration) and/or audible
- No steering intervention -- warning only
- Active above a minimum speed

Difference from LKA:
- LDW = Warning only (alerts you)
- LKA = Active assist (gently steers you back)
- LDW is the simpler, more passive system

Limitations:
- Same camera-based limitations as LKA (needs visible markings)
- May warn during intentional lane departures where driver forgot to signal
- Can be perceived as annoying if driver frequently changes lanes without signaling

Key phrases for explaining:
- "LDW noticed you were leaving the lane without signaling"
- "That vibration was a lane departure warning -- just an alert, not steering"
- "LDW only watches and warns; it doesn't steer for you"`,
  },
];
