/* BotFit session + exercise copy. Week 1 starts Mon Aug 17, 2026. */
window.BOTFIT = {
  week1Monday: "2026-08-17",
  athlete: "Jon Mcgee",
  warmup: [
    {
      id: "spin",
      title: "Spin bike · 5 min easy",
      detail: "Hop on a spin bike. Easy gear, easy breath. You should be able to talk. This is just to get warm, not a workout."
    },
    {
      id: "hinge",
      title: "Hip hinge drill · 10 reps",
      detail: "No weight. Soft knees (unlock them, then freeze). Push your butt back like you are closing a car door with it. Keep a flat back — imagine a broomstick along your spine. Stand up by driving your hips forward. That hinge is the same pattern you will use on RDLs."
    },
    {
      id: "squat",
      title: "Bodyweight squat · 10",
      detail: "Feet about shoulder-width, toes a little out. Sit down between your feet. Chest up. Stand up. If your heels lift, take a slightly wider stance."
    },
    {
      id: "scap",
      title: "Scapular push-up or wall slide · 10",
      detail: "Scapular = shoulder blade. Scapular push-up: get in a plank or knee-plank, arms straight, and only move the shoulder blades — let the chest sink, then push the floor away so your upper back rounds a little. The elbows do not bend. Wall slide: back to a wall, arms in a goal-post, slide them up and down without the low back leaving the wall. Pick one."
    },
    {
      id: "deadbug",
      title: "Dead bug · 6 / side",
      detail: "Lie on your back. Arms straight up. Knees bent over hips (tabletop). Flatten your low back into the floor — that is the whole point. Slowly reach one arm back and the opposite leg out. If the back peels off the floor, shorten the reach. Switch sides. That is one each."
    },
    {
      id: "ramp",
      title: "First lift · 1–2 light ramp-up sets",
      detail: "On the first exercise only: do 1–2 easy sets with a lighter weight than you plan to use. You are greasing the motion, not chasing fatigue. Then start the logged work sets."
    }
  ],
  intensity: {
    1: "Week 1: 2 sets. Stop with 3 reps in reserve — you could have done 3 more. Learn the room.",
    2: "3 sets. Stop with 2–3 reps in reserve. Add the smallest weight jump only when you hit the top of the rep range on every set.",
    3: "3 sets. Stop with 2–3 reps in reserve. Add the smallest weight jump only when you hit the top of the rep range on every set.",
    4: "3 sets. Stop with 2–3 reps in reserve. Add the smallest weight jump only when you hit the top of the rep range on every set.",
    5: "3 sets. Last set can be 1–2 reps in reserve if form is clean.",
    6: "3 sets. Last set can be 1–2 reps in reserve if form is clean.",
    7: "3 sets. Last set can be 1–2 reps in reserve if form is clean.",
    8: "Week 8 deload: 2 sets. Re-test comfortable working weights. Do not grind."
  }
};

window.BOTFIT.exercises = {
  "hs-chest-press": {
    name: "Hammer Strength chest press",
    where: "Hammer Strength chest press",
    setup: "Sit down. If there is a seat-height pin, set it so the handles line up with the middle of your chest — not your collarbone, not your belly. Feet flat. Grab both handles. If there is a foot lever that brings the handles in, use it so you start from a comfortable stretch instead of a reach.",
    cues: [
      "Drive the handles out and a little together, like closing a book in front of you.",
      "Keep your shoulder blades on the pad. Do not shrug toward your ears.",
      "Exhale as you press. Do not bounce at the bottom.",
      "Stop just short of slamming your elbows straight.",
      "If one side is weaker, that side picks the weight."
    ],
    reps: "8–12",
    setsMin: 2,
    setsMax: 3,
    rest: 120,
    log: "weight-reps"
  },
  "incline-db-press": {
    name: "Incline dumbbell press",
    where: "Flat/incline benches + Dumbbell rack",
    setup: "Set the bench to about 30° — one or two notches up from flat, not a steep shoulder-press angle. Grab dumbbells you can press for 8 clean reps. Sit, rest them on your thighs, lie back, and kick them up to your shoulders one at a time.",
    cues: [
      "Start with the bells at the sides of your shoulders, palms forward or slightly in.",
      "Press up and a little toward the middle so they almost meet at the top.",
      "Lower slowly until the bells are about chest height.",
      "Keep your low back lightly on the bench. Do not arch into a rainbow.",
      "Wrists stay stacked over elbows, not bent back."
    ],
    reps: "8–10",
    setsMin: 2,
    setsMax: 3,
    rest: 120,
    log: "weight-reps"
  },
  "sa-cable-press": {
    name: "Half-kneeling single-arm cable press",
    where: "Life Fitness dual adjustable pulley / cable tower",
    setup: "Set one pulley to about chest height. Clip on a single handle. Kneel facing away from the tower so the cable comes from behind you. Same-side knee down as the working arm is fine (right knee down if pressing with the right). Get tall before you press.",
    cues: [
      "Tall kneel: ribs down, squeeze the glute of the down-leg.",
      "Press the handle straight out from your chest.",
      "Do not lean your torso into the press, and do not let the cable twist you.",
      "Other hand can rest on your hip.",
      "Finish all reps on one side, then switch. That is one set."
    ],
    reps: "10 / side",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps",
    perSide: true
  },
  "db-lateral": {
    name: "Dumbbell lateral raise",
    where: "Dumbbell rack (go lighter than you think)",
    setup: "Stand with a light dumbbell in each hand, arms hanging. Put a soft bend in your elbows and freeze that bend — it does not change. You will be surprised how light these need to be.",
    cues: [
      "Raise the bells out to the sides like you are pouring two pitchers.",
      "Stop just below shoulder height. No higher.",
      "Lead with the elbows, not the hands.",
      "Do not shrug. Keep your neck long.",
      "Lower slower than you lifted."
    ],
    reps: "12–15",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps"
  },
  "triceps-pressdown": {
    name: "Cable triceps pressdown",
    where: "Life Fitness dual adjustable pulley / cable tower — straight bar or rope",
    setup: "Set the pulley high. Clip on the straight bar or a rope. Stand close, feet under you. Grab the attachment and pin your elbows to your ribs before you move. That pinned position is the whole exercise.",
    cues: [
      "Only your forearms move. Elbows stay glued to your sides.",
      "Push down until the arms are straight and squeeze the back of the arm.",
      "Do not lean your whole body into it.",
      "Let the bar come back up only to about chest height.",
      "If the elbows flare out, the weight is too heavy."
    ],
    reps: "10–15",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps"
  },
  "pallof": {
    name: "Pallof press",
    where: "Life Fitness dual adjustable pulley / cable tower",
    setup: "Set the cable at chest height. Clip a handle. Stand sideways to the tower, feet about hip-width. Hold the handle at your sternum with both hands. Step out until the cable wants to twist you toward the machine. That twist is the work.",
    cues: [
      "Press your hands straight out in front of your chest and hold a beat.",
      "The cable will try to rotate you. Do not let it. That is anti-rotation — you are bracing so your ribs stay square.",
      "Squeeze your glutes. Ribs down.",
      "Hands stay at chest height, not drifting up or down.",
      "Do all reps facing one way, then turn around and do the other side."
    ],
    reps: "10 / side",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps",
    perSide: true
  },
  "front-plank": {
    name: "Front plank",
    where: "Floor — near the benches is fine",
    setup: "Forearms on the floor, elbows under shoulders, legs straight, toes down. Body in one line from head to heels. Start the hold when you are already tight, not after you sag.",
    cues: [
      "Squeeze your glutes like you are holding a wallet between your cheeks.",
      "Pull your ribs down so the low back does not sag.",
      "Push the floor away with your forearms.",
      "Look at the floor just ahead of your hands. Do not crane up.",
      "If the hips pike up, you are hiding. Drop them back to a straight line."
    ],
    reps: "30–45s",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "time",
    hold: 30
  },
  "assisted-pullup": {
    name: "Assisted pull-up",
    where: "Assisted pull-up and dip station",
    setup: "Kneel on the pad (or stand on it if that is how this unit works). More help weight = easier. Pick a help number that lets you do 6 clean reps. Use a grip that feels natural — palms toward you or slightly in is friendlier than a wide overhand for a newbie.",
    cues: [
      "Start from a long-arm hang with a tiny bend in the elbows so you are not hanging off dead ligaments.",
      "Pull your elbows down toward your back pockets.",
      "Chest toward the bar. Do not hunt the bar with your chin.",
      "Lower all the way. Do not bounce out of the bottom.",
      "If you only get 4 ugly reps, add more help."
    ],
    reps: "6–10",
    setsMin: 2,
    setsMax: 3,
    rest: 120,
    log: "weight-reps",
    weightLabel: "Help wt"
  },
  "seated-row": {
    name: "Seated cable row",
    where: "Life Fitness dual adjustable pulley / cable tower — low pulley, straight/row attachment or two handles",
    setup: "Pulley on the lowest setting. Sit on a bench facing the tower, or on the floor with feet braced on the base. Grab the attachment with arms long. Sit tall and get your chest up before the first pull.",
    cues: [
      "Pull the handle to your lower ribs, not your neck.",
      "Squeeze your shoulder blades together like you are pinching a pencil.",
      "Do not yank with your lower back.",
      "Let the arms go long at the end, but do not slump.",
      "Pause a beat at your ribs."
    ],
    reps: "8–12",
    setsMin: 2,
    setsMax: 3,
    rest: 120,
    log: "weight-reps"
  },
  "db-rdl": {
    name: "Dumbbell Romanian deadlift",
    where: "Dumbbell rack, then stand in open floor",
    setup: "Stand with a dumbbell in each hand, bells in front of your thighs. Soft knees — unlock them and freeze that bend. That knee angle stays the same the whole set. This is a hip move, not a squat.",
    cues: [
      "Push your hips back like you are closing a car door with your butt.",
      "The dumbbells slide down the front of your thighs.",
      "Stop around mid-shin, when you feel a stretch in the hamstrings (the backs of your thighs).",
      "Back stays flat. If it rounds, you went too far — come up an inch.",
      "Stand up by driving the hips forward, not by leaning back and looking at the ceiling."
    ],
    reps: "8–10",
    setsMin: 2,
    setsMax: 3,
    rest: 120,
    log: "weight-reps",
    safety: "If your low back talks, skip this hinge and go to the next move. On Thursday, skip a third hinge if the back is talking."
  },
  "sa-cable-row": {
    name: "Single-arm cable row",
    where: "Life Fitness dual adjustable pulley / cable tower",
    setup: "Pulley at about belly-button height. One handle. Stand staggered — opposite foot forward from the working arm — or sit if that feels more stable. Other hand can hold the tower.",
    cues: [
      "Pull the handle to the side of your ribs.",
      "Think elbow to the hip, not hand to the armpit.",
      "Do not twist your torso to cheat the last few inches.",
      "Let the shoulder blade slide forward at the end, then pull it back.",
      "Same reps each side."
    ],
    reps: "10 / side",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps",
    perSide: true
  },
  "face-pull": {
    name: "Face pull",
    where: "Life Fitness dual adjustable pulley / cable tower — rope attachment",
    setup: "Pulley at about face height. Clip the rope. Grab the ends with thumbs pointing back toward you. Step back so the stack is already a little off at the start.",
    cues: [
      "Pull the rope toward your ears, not your chest.",
      "As you pull, rotate the hands so your knuckles end up by your ears (thumbs back). That rotation is external rotation — you are turning the upper arm out.",
      "You should feel the back of the shoulders, not a trap shrug.",
      "Do not lean back to move more weight.",
      "These stay light and crisp."
    ],
    reps: "12–15",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps"
  },
  "db-curl": {
    name: "Dumbbell curl",
    where: "Dumbbell rack",
    setup: "Stand with a dumbbell in each hand, arms hanging. Palms can start facing forward, or start facing in and turn up as you curl (whichever feels smoother on the elbow).",
    cues: [
      "Keep your elbows pinned near your sides.",
      "Curl without swinging your torso.",
      "Squeeze at the top, then lower all the way — a straight arm at the bottom is correct.",
      "Do not let the bells swing out in front and then up.",
      "If you have to lean back, go lighter."
    ],
    reps: "10–12",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps"
  },
  "suitcase": {
    name: "Suitcase carry",
    where: "Dumbbell rack or Kettlebell rack, then walk the floor",
    setup: "Pick up one heavy-ish dumbbell or kettlebell in one hand, like a suitcase. Other hand empty. Stand up tall and get level before you take a step.",
    cues: [
      "Walk tall. Pretend there is a book on your head.",
      "Do not lean away from the weight, and do not collapse into it. Shoulders stay level.",
      "Ribs down.",
      "Short, normal steps — this is not a race.",
      "Switch hands each set."
    ],
    reps: "30–45s / side",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-time",
    hold: 30,
    perSide: true
  },
  "goblet": {
    name: "Goblet squat",
    where: "Kettlebell rack or Dumbbell rack",
    setup: "Grab a kettlebell and hold it at your chest — handle up or bell up, whichever you can keep glued to your sternum. Elbows point down and in. Feet about shoulder-width, toes slightly out.",
    cues: [
      "Sit down between your feet, not just back onto your heels.",
      "Elbows stay inside your knees at the bottom.",
      "Chest up so the bell does not drift away from you.",
      "Knees track over the middle of your feet, not caving in.",
      "Stand up by pushing the floor away."
    ],
    reps: "8–12",
    setsMin: 2,
    setsMax: 3,
    rest: 120,
    log: "weight-reps"
  },
  "split-squat": {
    name: "Split squat",
    where: "Open floor by the Flat/incline benches. Skip the Smith if it feels sketchy — split squat is the newbie pick.",
    setup: "Stand in a split stance: one foot forward, one back, about a walking-stride apart. Back heel up. Hold a dumbbell in each hand, or one kettlebell goblet-style at your chest. Both feet stay on the floor (you can put the back foot on a bench later; not today).",
    cues: [
      "Drop the back knee toward the floor.",
      "Front shin stays pretty vertical. Most of the work is the front leg.",
      "Do not slam the back knee.",
      "Torso stays tall. Do not fold over the front thigh.",
      "Do all reps on one side, then switch. That is one set."
    ],
    reps: "8–10 / side",
    setsMin: 2,
    setsMax: 3,
    rest: 120,
    log: "weight-reps",
    perSide: true
  },
  "step-up": {
    name: "Step-up",
    where: "Flat/incline benches — use a flat bench",
    setup: "Stand facing a flat bench. The whole foot goes on the bench, heel included — not just the toes. Hold light dumbbells or go bodyweight. If the bench feels high, use a lower box or just bodyweight.",
    cues: [
      "Drive through the heel of the foot that is on the bench.",
      "Stand all the way up on that leg. Do not shove off the trailing toe.",
      "Control the way down. Do not flop.",
      "If you wobble hard, drop the bells and use your hands for a tap of balance, then try again.",
      "Same reps each side."
    ],
    reps: "8 / side",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps",
    perSide: true
  },
  "leg-machine": {
    name: "Seated lower-body machine",
    where: "seated lower-body machine (fallback: walking lunges) · Dumbbell rack",
    setup: "If you can tell what the machine is: sit, adjust the pad, start light. Quads (leg extension): pad on the shins, kick out. Hamstrings (leg curl): pad behind the lower legs, curl under. Inner thighs (adductor): pads on the insides of the knees. If the label is a mystery or the setup feels wrong, skip it and do walking lunges — dumbbells at your sides, step forward, both knees bend, back knee toward the floor, then step the other foot through.",
    cues: [
      "Machine: move through a range that does not pinch. 10–15 smooth reps. Do not slam the stack.",
      "Lunges: torso tall, front knee over mid-foot.",
      "If the front knee caves in, take a shorter step.",
      "When in doubt, lunges. Log whichever you did in the note box.",
      "Stop if anything sharp shows up in the knee or hip."
    ],
    reps: "10–15 (or 8–10 lunges / side)",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps",
    note: true
  },
  "woodchop": {
    name: "Cable wood chop",
    where: "Life Fitness dual adjustable pulley / cable tower",
    setup: "Set the pulley high (high-to-low chop). One handle. Stand sideways, feet a little wider than your hips. Grab the handle with both hands up by the high shoulder. Arms fairly straight.",
    cues: [
      "Pull the handle down and across your body to the opposite hip.",
      "Rotate through your ribs and hips, not just your arms.",
      "Feet stay planted. You are chopping wood, not spinning.",
      "Do not let the cable yank you back up — return under control.",
      "Switch sides each set."
    ],
    reps: "10 / side",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps",
    perSide: true
  },
  "side-plank": {
    name: "Side plank",
    where: "Floor",
    setup: "Lie on one side. Forearm on the floor, elbow under the shoulder. Stack or stagger your feet. Lift the hips so the body is a straight line from head to heels. If a full side plank is too much, drop the bottom knee to the floor.",
    cues: [
      "Hips high. Do not let them sag toward the floor.",
      "Top shoulder stacked over the bottom one.",
      "Squeeze the bottom glute.",
      "Breathe. If you hold your breath you will quit early.",
      "Switch sides each set."
    ],
    reps: "25–40s / side",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "time",
    hold: 25,
    perSide: true
  },
  "lat-pulldown": {
    name: "Lat pulldown or assisted neutral-grip pull-up",
    where: "Life Fitness dual adjustable pulley / cable tower with a pulldown bar — or Assisted pull-up and dip station using the palms-in (neutral) grips",
    setup: "Pulldown: sit, pin your thighs under the pad if there is one, grab the bar a bit wider than your shoulders. Assisted: same station as Tuesday, but use the grips where the palms face each other. Pick whichever is free. If the pulldown setup is not obvious, use the assisted station.",
    cues: [
      "Pull your elbows down toward your hips.",
      "Lean back just a sliver, not a full lay-back.",
      "Do not shrug the first half of the pull.",
      "Let the arms go long at the top.",
      "Same rule as Tuesday: ugly reps mean more help or less stack."
    ],
    reps: "8–12",
    setsMin: 2,
    setsMax: 3,
    rest: 120,
    log: "weight-reps"
  },
  "chest-row": {
    name: "Chest-supported dumbbell row",
    where: "Flat/incline benches + Dumbbell rack",
    setup: "Set a bench to a low incline (~30°). Lie face-down with your chest on the pad and feet on the floor. Dumbbells hanging under your shoulders. Head stays in line with your spine — do not crane up to watch yourself in a mirror.",
    cues: [
      "Row the bells toward your hips, not your ears.",
      "Squeeze at the top and pause.",
      "Let the arms hang fully at the bottom.",
      "Chest stays glued to the bench so you cannot cheat with your low back.",
      "If the bench edge digs into your collarbone, scoot up an inch."
    ],
    reps: "8–12",
    setsMin: 2,
    setsMax: 3,
    rest: 120,
    log: "weight-reps"
  },
  "rear-delt": {
    name: "Cable rear-delt fly",
    where: "Life Fitness dual adjustable pulley / cable tower",
    setup: "Set both pulleys at about head height. Grab the left cable with your right hand and the right cable with your left so they cross in front of you. Step back to the middle. Soft bend in the elbows — freeze it.",
    cues: [
      "Open your arms out wide like you are spreading a curtain.",
      "Think pinkies back so the work is the back of the shoulder (the rear delt).",
      "Do not shrug.",
      "Do not turn it into a giant standing chest-fly with a backbend.",
      "Light weight. Feel the squeeze."
    ],
    reps: "12–15",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps"
  },
  "assisted-dip": {
    name: "Assisted dip or bench push-up",
    where: "Assisted pull-up and dip station — or a flat bench for push-ups",
    setup: "Dip: use the dip handles, kneel on the assist pad. More help weight = easier. Lean a tiny bit forward. If your shoulders complain at all, switch to bench push-ups: hands on a flat bench, body straight, feet on the floor. That is easier than a floor push-up and friendlier on the shoulders.",
    cues: [
      "Lower until your upper arms are about parallel to the floor.",
      "Do not crash to the bottom.",
      "Elbows about 45° from your body, not flared out to 90°.",
      "Lock out at the top without shrugging.",
      "Shoulders unhappy? Bench push-ups, no debate."
    ],
    reps: "6–10",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps",
    weightLabel: "Help wt / body"
  },
  "hammer-curl": {
    name: "Hammer curl",
    where: "Dumbbell rack",
    setup: "Stand with dumbbells at your sides, palms facing your thighs — like holding two hammers. That palm position stays the whole time. You do not twist.",
    cues: [
      "Elbows stay at your sides.",
      "Curl without twisting the wrists.",
      "This hits the muscle on the outside of the upper arm (brachialis) and the forearm, not just the biceps peak.",
      "Lower all the way.",
      "No swaying."
    ],
    reps: "10–12",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps"
  },
  "cable-er": {
    name: "Cable external rotation",
    where: "Life Fitness dual adjustable pulley / cable tower — very light",
    setup: "Pulley at elbow height. Stand sideways to the tower. Working elbow pinned to your ribs, forearm across your belly grabbing the handle. That is the start. Use the smallest plate that still moves the stack. This is not a hero lift.",
    cues: [
      "Rotate the forearm out, away from your belly, like opening a gate.",
      "The elbow never leaves your side.",
      "This is tiny and light on purpose — it is for the rotator cuff (the small muscles that keep the shoulder centered).",
      "Do not yank. If you have to lean, it is too heavy.",
      "12 easy reps each side."
    ],
    reps: "12 / side",
    setsMin: 2,
    setsMax: 2,
    rest: 90,
    log: "weight-reps",
    perSide: true
  },
  "db-shrug": {
    name: "Dumbbell shrug",
    where: "Dumbbell rack",
    setup: "Heavy-ish dumbbells at your sides. Stand tall. Arms long — and they stay long. You are not bending the elbows.",
    cues: [
      "Shrug your shoulders straight up toward your ears.",
      "Pause at the top.",
      "Lower slowly.",
      "Do not roll the shoulders in a circle.",
      "Head stays long. Do not poke your chin forward."
    ],
    reps: "10–12",
    setsMin: 2,
    setsMax: 3,
    rest: 90,
    log: "weight-reps"
  },
  "neck-iso": {
    name: "Neck isometrics",
    where: "Sit or stand anywhere quiet — you do not need a machine",
    setup: "Sit tall. You are not moving your head against a weight. You press your head gently into your own hand and match the pressure so nothing actually moves. Two rounds. Four directions each round: front, back, left, right. 10 seconds each.",
    cues: [
      "Hand on forehead: press the head into the hand for 10 seconds. Gentle.",
      "Hand on the back of the head: same.",
      "Hand on left temple, then right.",
      "Pressure is like pressing a ripe tomato — not a max effort.",
      "Breathe. If anything feels sharp, stop."
    ],
    reps: "10s each direction",
    setsMin: 2,
    setsMax: 2,
    rest: 60,
    log: "done"
  },
  "opt-spin": {
    name: "Easy spin (optional)",
    where: "Spin bikes",
    setup: "Hop on a spin bike. Light resistance. Easy pace you could talk through. This is a cooldown, not a workout. Skip it if you are done.",
    cues: [
      "Easy. You can talk.",
      "6 minutes and you are out.",
      "Skip without guilt if the session already did its job."
    ],
    reps: "6 min",
    setsMin: 1,
    setsMax: 1,
    rest: 0,
    log: "time",
    hold: 360,
    optional: true
  },
  "kb-deadlift": {
    name: "Kettlebell deadlift",
    where: "Kettlebell rack",
    setup: "Park a kettlebell on the floor between your feet. Soft knees. Hinge, grab the handle with both hands, stand up. Same car-door hinge as the warm-up.",
    cues: [
      "Flat back. Soft knees.",
      "The bell stays close to your legs.",
      "Stand tall at the top. Do not lean back.",
      "Hips and shoulders rise together — do not shoot the hips up first.",
      "10 clean reps. Then move."
    ],
    reps: "10",
    setsMin: 1,
    setsMax: 1,
    rest: 15,
    log: "weight-reps"
  },
  "db-press-circuit": {
    name: "Dumbbell press",
    where: "Dumbbell rack + Flat/incline benches (stand or sit)",
    setup: "Grab a pair you can press for 10 without a grind. Stand, or sit on a flat bench. Bells at your shoulders. Press to a soft lockout overhead (standing/seated) or off a bench if you prefer a regular press — pick one and keep it for every round.",
    cues: [
      "Wrists stacked over elbows.",
      "Do not shrug the bells into your ears.",
      "Lower to the shoulders under control.",
      "Ribs down so you are not arching to finish the last reps.",
      "10 reps. Rack them. Next move."
    ],
    reps: "10",
    setsMin: 1,
    setsMax: 1,
    rest: 15,
    log: "weight-reps"
  },
  "cable-row-circuit": {
    name: "Cable row",
    where: "Life Fitness dual adjustable pulley / cable tower — low pulley, row attachment",
    setup: "Same seated row setup as Tuesday. Pulley low. Sit tall. 10 reps, then get off the station so you are not camping.",
    cues: [
      "Chest up. Pull to the ribs.",
      "Do not yank with the low back.",
      "Squeeze, then let the arms go long.",
      "If someone is waiting, two handles standing is fine — same pull to the ribs.",
      "10 reps. Next."
    ],
    reps: "10",
    setsMin: 1,
    setsMax: 1,
    rest: 15,
    log: "weight-reps"
  },
  "goblet-circuit": {
    name: "Goblet squat",
    where: "Kettlebell rack",
    setup: "Bell at your chest, elbows in. Same goblet as Thursday. 10 reps.",
    cues: [
      "Sit between your feet.",
      "Elbows inside the knees.",
      "Chest up.",
      "Stand all the way up each rep.",
      "10 and go."
    ],
    reps: "10",
    setsMin: 1,
    setsMax: 1,
    rest: 15,
    log: "weight-reps"
  },
  "farmer-carry": {
    name: "Farmer carry",
    where: "Dumbbell rack or Kettlebell rack, then walk",
    setup: "One bell in each hand, heavy enough that you have to pay attention but you can still walk tall. Stand up, get level, then walk.",
    cues: [
      "Walk tall. Shoulders level.",
      "Do not lean. Do not shuffle-run.",
      "Ribs down, eyes forward.",
      "If a grip fails, set them down, shake out, finish the time.",
      "30–45 seconds, then that round is done."
    ],
    reps: "30–45s",
    setsMin: 1,
    setsMax: 1,
    rest: 90,
    log: "weight-time",
    hold: 30
  }
};

window.BOTFIT.mobility = [
  {
    id: "walk",
    title: "Easy walk (optional)",
    detail: "Outside or treadmill. Easy. You can talk the whole time. This is not a hike for time."
  },
  {
    id: "hipflexor",
    title: "Half-kneeling hip flexor stretch · 60s / side",
    timer: 60,
    detail: "Down on one knee, like a proposal. Tuck the pelvis under (squeeze the down-side glute) so you feel the front of that hip, not a low-back arch. Shift forward a little. Switch sides."
  },
  {
    id: "openbook",
    title: "T-spine open book · 8 / side",
    detail: "Lie on your side, knees bent, arms stacked in front of you. Keep the knees together and open the top arm across your body like you are opening a book, eyes following the hand. You are rotating the upper back (T-spine), not yanking the neck. Switch sides."
  },
  {
    id: "calf",
    title: "Calf stretch · 45s / side",
    detail: "Hands on a wall, one foot back, back heel down. Soft or straight back knee — both are fine. You should feel the calf, not the front of the ankle pinching. Switch."
  },
  {
    id: "chintuck",
    title: "Chin tucks · 2 × 8",
    detail: "Sit or stand tall. Make a double chin — slide your head straight back, not down. Hold a second, release. This is for the neck, not a nod."
  }
];

window.BOTFIT.rideDurations = {
  wed: {
    1: "25–30 min",
    2: "30–40 min",
    3: "30–40 min",
    4: "30–40 min",
    5: "35–40 min",
    6: "35–40 min",
    7: "35–40 min",
    8: "30–40 min"
  },
  sat: {
    1: "35–45 min",
    2: "45–60 min",
    3: "45–60 min",
    4: "45–60 min",
    5: "50–70 min",
    6: "50–70 min",
    7: "50–70 min",
    8: "30–40 min"
  }
};

window.BOTFIT.rideTimerSeconds = {
  wed: { 1: 25 * 60, 2: 30 * 60, 3: 30 * 60, 4: 30 * 60, 5: 35 * 60, 6: 35 * 60, 7: 35 * 60, 8: 30 * 60 },
  sat: { 1: 35 * 60, 2: 45 * 60, 3: 45 * 60, 4: 45 * 60, 5: 50 * 60, 6: 50 * 60, 7: 50 * 60, 8: 30 * 60 }
};

window.BOTFIT.days = {
  1: {
    id: "mon",
    short: "Mon",
    title: "Upper Push + Core",
    blurb: "Chest, shoulders, triceps, trunk. ~40–50 min.",
    type: "lift",
    exercises: ["hs-chest-press", "incline-db-press", "sa-cable-press", "db-lateral", "triceps-pressdown", "pallof", "front-plank", "opt-spin"]
  },
  2: {
    id: "tue",
    short: "Tue",
    title: "Pull + Posterior",
    blurb: "Back, biceps, light hinges. ~40–50 min.",
    type: "lift",
    exercises: ["assisted-pullup", "seated-row", "db-rdl", "sa-cable-row", "face-pull", "db-curl", "suitcase"]
  },
  3: {
    id: "wed",
    short: "Wed",
    title: "Zone 2 ride",
    blurb: "Talk the whole time. Spin or easy outdoor. No intervals.",
    type: "ride",
    rideKey: "wed"
  },
  4: {
    id: "thu",
    short: "Thu",
    title: "Lower + Core",
    blurb: "Legs and hips in the gym, not on the bike. ~40–50 min.",
    type: "lift",
    exercises: ["goblet", "split-squat", "db-rdl", "step-up", "leg-machine", "woodchop", "side-plank"]
  },
  5: {
    id: "fri",
    short: "Fri",
    title: "Upper Pull / Arms / Neck",
    blurb: "Posture, arms, shirt-off work. ~40–50 min.",
    type: "lift",
    exercises: ["lat-pulldown", "chest-row", "rear-delt", "assisted-dip", "hammer-curl", "cable-er", "db-shrug", "neck-iso"]
  },
  6: {
    id: "sat",
    short: "Sat",
    title: "Easy ride or circuit",
    blurb: "Pick one. Easy outdoor talk-pace, or a short muscle circuit if weather or time sucks.",
    type: "sat",
    circuit: ["kb-deadlift", "db-press-circuit", "cable-row-circuit", "goblet-circuit", "farmer-carry"]
  },
  0: {
    id: "sun",
    short: "Sun",
    title: "Off",
    blurb: "Walk or 8–10 min mobility. No hard work.",
    type: "off"
  }
};
