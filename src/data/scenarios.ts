import type { Scenario } from '../types';

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'pre-drive',
    name: 'Pre-Drive (Stationary)',
    icon: 'ParkingSquare',
    description: 'Truck is stationary. Driver preparing for shift. Good time for learning and onboarding.',
    active: false,
    contextPrompt: `Current driving context: The truck is STATIONARY. The driver is preparing for their shift or is at a rest stop.
This is a good moment for detailed explanations, onboarding new features, and learning.
The driver has time and attention available. You can offer: "Would you like me to walk you through any features before we get going?"`,
    triggers: [
      { id: 'pre-1', label: 'New ADAS update available', prompt: 'TRIGGER: A new ADAS software update has been applied. The driver needs to be informed about changes. Proactively introduce the update and offer to explain what changed.', fired: false },
      { id: 'pre-2', label: 'First time using this truck', prompt: 'TRIGGER: This is the driver\'s first time in this specific truck. Offer a brief introduction to the ADAS features available and how to access help.', fired: false },
      { id: 'pre-3', label: 'Driver asks about features', prompt: 'TRIGGER: The driver is asking about available ADAS features before starting to drive. Give a comprehensive but friendly overview. Offer to deep-dive into any specific feature.', fired: false },
    ],
  },
  {
    id: 'highway',
    name: 'Highway Driving',
    icon: 'Route',
    description: 'Active driving on highway. High speed, cruise control likely active. Focus on concise, safety-first communication.',
    active: false,
    contextPrompt: `Current driving context: The driver is ACTIVELY DRIVING on a HIGHWAY at high speed.
Cruise Control and Eco-Roll may be active. LKA is likely engaged. ISA is monitoring speed limits.
This is NOT a learning moment. The driver's cognitive load is high.
Only speak when safety or clarity requires it. Offer to explain more "at the next stop."
The driver's hands are on the wheel and attention must stay on the road.`,
    triggers: [
      { id: 'hw-1', label: 'Eco-Roll activates', prompt: 'TRIGGER: Eco-Roll has just activated. The truck is coasting to save fuel. The driver may notice a slight deceleration. If they ask, explain briefly.', fired: false },
      { id: 'hw-2', label: 'Eco-Roll deactivates unexpectedly', prompt: 'TRIGGER: Eco-Roll has suddenly deactivated due to road gradient change. The driver may be confused about why the truck behavior changed.', fired: false },
      { id: 'hw-3', label: 'LKA steering correction', prompt: 'TRIGGER: LKA just made a steering correction. The driver felt the wheel move. They may be startled. Reassure briefly.', fired: false },
      { id: 'hw-4', label: 'LKA disengages (poor markings)', prompt: 'TRIGGER: LKA has disengaged because lane markings are no longer visible (faded, covered by snow/slush). The driver needs to know they are now fully responsible for steering.', fired: false },
      { id: 'hw-5', label: 'ISA speed warning', prompt: 'TRIGGER: ISA has detected a speed limit change and is warning the driver. The displayed limit may or may not match what the driver sees on road signs.', fired: false },
      { id: 'hw-6', label: 'ISA false warning', prompt: 'TRIGGER: ISA is showing a speed limit that seems incorrect (e.g., 50 km/h on highway). This is likely a misread sign from an adjacent road or exit ramp.', fired: false },
    ],
  },
  {
    id: 'rural',
    name: 'Rural / Country Road',
    icon: 'TreePine',
    description: 'Driving on rural roads. Variable conditions, possibly winding. ADAS may behave differently than on highways.',
    active: false,
    contextPrompt: `Current driving context: The driver is on a RURAL/COUNTRY ROAD.
Conditions are variable: winding roads, narrower lanes, possibly poor lane markings, lower speeds.
LKA may perform inconsistently due to lane marking quality. ISA may encounter ambiguous speed limits.
Be prepared for more questions about system behavior in these conditions.
Driver may be less familiar with how ADAS behaves outside highway conditions.`,
    triggers: [
      { id: 'ru-1', label: 'LKA struggles with narrow road', prompt: 'TRIGGER: LKA is struggling on this narrow, winding road. It may be making frequent or unnecessary corrections. The driver is getting frustrated.', fired: false },
      { id: 'ru-2', label: 'Speed limit ambiguity', prompt: 'TRIGGER: ISA is uncertain about the current speed limit. Signs may be obscured or the map data may not match the actual road.', fired: false },
      { id: 'ru-3', label: 'Poor visibility conditions', prompt: 'TRIGGER: Visibility is reduced (fog, rain, dusk). Camera-dependent systems (LKA, ISA, LDW) may have degraded performance. The driver should be informed.', fired: false },
    ],
  },
  {
    id: 'city',
    name: 'Urban / City Driving',
    icon: 'Building2',
    description: 'Low speed city driving. Frequent stops, turns, pedestrians. Different ADAS behavior than highway.',
    active: false,
    contextPrompt: `Current driving context: The driver is in URBAN/CITY traffic.
Low speed, frequent stops, turns, and lane changes. Pedestrians and cyclists present.
Many ADAS features may be inactive or behaving differently at low speeds.
LKA typically deactivates below minimum speed. BSW is important for lane changes.
The driver is managing complex traffic and has high cognitive load.`,
    triggers: [
      { id: 'ci-1', label: 'BSW alert in traffic', prompt: 'TRIGGER: BSW is alerting about a vehicle (or possible false alert from infrastructure) in the blind spot during a lane change maneuver in city traffic.', fired: false },
      { id: 'ci-2', label: 'ADAS features inactive at low speed', prompt: 'TRIGGER: Driver notices that LKA or other features aren\'t working. They are inactive because the truck is below the minimum activation speed for these systems.', fired: false },
    ],
  },
  {
    id: 'adverse',
    name: 'Adverse Conditions',
    icon: 'CloudSnow',
    description: 'Bad weather: snow, heavy rain, fog, ice. Multiple ADAS systems may be degraded or disabled.',
    active: false,
    contextPrompt: `Current driving context: ADVERSE WEATHER CONDITIONS are present (snow, heavy rain, fog, ice, or combination).
Multiple ADAS systems are likely degraded or disabled:
- Camera systems (LKA, ISA, LDW) may be blocked by snow, rain, or fog
- Lane markings may be covered
- Sensor accuracy may be reduced
This is a high-stress moment. The driver needs clear, honest information about what is and isn't working.
Be direct about limitations. Never overstate system capability.
Reinforce: "You're the driver and always in control."`,
    triggers: [
      { id: 'ad-1', label: 'Multiple systems degraded', prompt: 'TRIGGER: Multiple ADAS systems have reduced functionality due to weather. The driver needs a brief, clear status of what\'s working and what\'s not.', fired: false },
      { id: 'ad-2', label: 'Camera blocked', prompt: 'TRIGGER: The forward camera is blocked (snow, ice, spray). LKA, ISA, and LDW are all disabled. The driver needs to know this clearly.', fired: false },
      { id: 'ad-3', label: 'Unexpected system disengage', prompt: 'TRIGGER: An ADAS system has disengaged silently or with only a generic warning during challenging conditions. The driver may not have noticed or understood.', fired: false },
    ],
  },
];
