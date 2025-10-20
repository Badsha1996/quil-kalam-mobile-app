const structure = [
  {
    name: "Act I: Departure",
    type: "folder",
    color: "#10B981",
    icon: "🚀",
    children: [
      {
        name: "1. Ordinary World",
        content:
          "Introduce the hero in their normal life before the adventure begins. Establish their routine, relationships, and inner conflicts. Show what they stand to lose.",
      },
      {
        name: "2. Call to Adventure",
        content:
          "The hero is presented with a challenge, problem, or adventure that disrupts their ordinary world. This could be a message, discovery, or event that forces change.",
      },
      {
        name: "3. Refusal of the Call",
        content:
          "Initially, the hero is reluctant to accept the challenge due to fear, insecurity, or obligation. They hesitate and consider staying in their comfortable existence.",
      },
      {
        name: "4. Meeting the Mentor",
        content:
          "The hero meets a mentor who provides guidance, training, wisdom, or magical gifts that will help on the journey. The mentor prepares them for what lies ahead.",
      },
      {
        name: "5. Crossing the Threshold",
        content:
          "The hero commits to the adventure and crosses into the special world, leaving their ordinary life behind. There's no turning back from this point.",
      },
    ],
  },
  {
    name: "Act II: Initiation",
    type: "folder",
    color: "#F59E0B",
    icon: "⚔️",
    children: [
      {
        name: "6. Tests, Allies, Enemies",
        content:
          "The hero faces a series of challenges and meets allies who help and enemies who hinder. They learn the rules of the special world and begin transformation.",
      },
      {
        name: "7. Approach to Inmost Cave",
        content:
          "The hero prepares for the major challenge in the special world's most dangerous location. They make final preparations and confront their deepest fears.",
      },
      {
        name: "8. Ordeal",
        content:
          "The hero faces their greatest fear or most difficult challenge, experiencing a 'death' and 'rebirth' moment. This is the central crisis of the story.",
      },
      {
        name: "9. Reward",
        content:
          "The hero achieves their goal or gains a reward (sword, elixir, knowledge, reconciliation). They have proven themselves worthy but aren't safe yet.",
      },
    ],
  },
  {
    name: "Act III: Return",
    type: "folder",
    color: "#EF4444",
    icon: "🏆",
    children: [
      {
        name: "10. The Road Back",
        content:
          "The hero begins the journey back to the ordinary world, often pursued by vengeful forces. The stakes are raised as they race toward safety.",
      },
      {
        name: "11. Resurrection",
        content:
          "The hero faces a final test where they must use everything learned on the journey. This is the climax where they prove their transformation is complete.",
      },
      {
        name: "12. Return with Elixir",
        content:
          "The hero returns home transformed with knowledge, power, or wisdom that benefits their ordinary world. They have achieved mastery of both worlds.",
      },
    ],
  },
];

const structure2 = [
  {
    name: "Act I: Setup",
    type: "folder",
    color: "#3B82F6",
    icon: "🎬",
    children: [
      {
        name: "Opening Image",
        content:
          "A snapshot of the hero's life before the adventure begins. Establish the ordinary world and what needs to change.",
      },
      {
        name: "Theme Stated",
        content:
          "The central theme or message of the story is hinted at, usually through a conversation with a secondary character.",
      },
      {
        name: "Setup",
        content:
          "Introduce main characters, setting, and the protagonist's world. Show their flaws, desires, and the status quo.",
      },
      {
        name: "Catalyst",
        content:
          "The inciting incident that disrupts the hero's ordinary world and sets the story in motion.",
      },
      {
        name: "Debate",
        content:
          "The hero hesitates, weighing the risks and consequences of embarking on the journey.",
      },
    ],
  },
  {
    name: "Act II: Confrontation",
    type: "folder",
    color: "#8B5CF6",
    icon: "💥",
    children: [
      {
        name: "Break Into Two",
        content:
          "The hero makes a choice and fully enters the new world or situation, leaving the old world behind.",
      },
      {
        name: "B Story",
        content:
          "Introduce a secondary storyline, often a love story or friendship that supports the theme.",
      },
      {
        name: "Fun and Games",
        content:
          "The premise is explored through a series of challenges, discoveries, and character development.",
      },
      {
        name: "Midpoint",
        content:
          "A major event that raises stakes, often a false victory or defeat that changes the direction.",
      },
      {
        name: "Bad Guys Close In",
        content:
          "Internal and external pressures intensify as the antagonist gains ground.",
      },
      {
        name: "All Is Lost",
        content:
          "The lowest point where everything seems hopeless and the hero appears defeated.",
      },
      {
        name: "Dark Night of the Soul",
        content:
          "The hero hits rock bottom and must find the inner strength to continue.",
      },
    ],
  },
  {
    name: "Act III: Resolution",
    type: "folder",
    color: "#06B6D4",
    icon: "🎯",
    children: [
      {
        name: "Break Into Three",
        content:
          "The hero finds a solution, often combining lessons from both A and B stories.",
      },
      {
        name: "Finale",
        content:
          "The climax where the hero confronts the main conflict using everything they've learned.",
      },
      {
        name: "Final Image",
        content:
          "The opposite of the opening image, showing how the hero and their world have changed.",
      },
    ],
  },
];

const structure3 = [
  {
    name: "Opening Image",
    type: "document",
    content:
      "A visual that represents the tone and theme of the story. Shows the hero's world before change.",
  },
  {
    name: "Theme Stated",
    type: "document",
    content:
      "The moral or lesson the hero will learn, usually stated by another character early in the story.",
  },
  {
    name: "Set-up",
    type: "folder",
    color: "#EC4899",
    icon: "🏗️",
    children: [
      {
        name: "Catalyst",
        content:
          "The inciting incident that kicks off the story and presents the hero with a challenge.",
      },
      {
        name: "Debate",
        content:
          "The hero weighs the pros and cons of accepting the challenge or making a change.",
      },
    ],
  },
  {
    name: "Break into Act II",
    type: "document",
    content:
      "The hero makes a decision and crosses the threshold into the new world or situation.",
  },
  {
    name: "B Story",
    type: "document",
    content:
      "The relationship story that carries the theme and helps the hero grow.",
  },
  {
    name: "Fun and Games",
    type: "folder",
    color: "#F59E0B",
    icon: "🎮",
    children: [
      {
        name: "Midpoint",
        content:
          "A big event that raises stakes - either a false victory or false defeat.",
      },
      {
        name: "Bad Guys Close In",
        content: "Internal and external forces tighten their grip on the hero.",
      },
    ],
  },
  {
    name: "All Is Lost",
    type: "document",
    content: "The lowest point where everything seems hopeless for the hero.",
  },
  {
    name: "Dark Night of the Soul",
    type: "document",
    content:
      "The hero reflects on their journey and finds the will to continue.",
  },
  {
    name: "Break into Act III",
    type: "document",
    content:
      "The hero finds a solution by combining lessons from A and B stories.",
  },
  {
    name: "Finale",
    type: "folder",
    color: "#10B981",
    icon: "🏁",
    children: [
      {
        name: "Final Image",
        content:
          "The opposite of the opening image, showing how the hero has changed.",
      },
    ],
  },
];

const structure4 = [
  {
    name: "Hook",
    type: "document",
    content:
      "Start with the opposite of your resolution. Show a character in a state that contrasts with who they'll become.",
  },
  {
    name: "Plot Turn 1",
    type: "document",
    content:
      "The inciting incident that moves the story from the hook into the main conflict. Introduces the central problem.",
  },
  {
    name: "Pinch 1",
    type: "document",
    content:
      "Apply pressure to the characters. Force them to step up and make decisions, often introducing the antagonist.",
  },
  {
    name: "Midpoint",
    type: "document",
    content:
      "The moment when characters move from reaction to action. They understand what's really at stake.",
  },
  {
    name: "Pinch 2",
    type: "document",
    content:
      "Apply even more pressure. The worst happens, plans fail, and things look hopeless.",
  },
  {
    name: "Plot Turn 2",
    type: "document",
    content:
      "The final piece of the puzzle falls into place. Characters discover what they need to resolve the story.",
  },
  {
    name: "Resolution",
    type: "document",
    content:
      "The climax and conclusion. Characters confront the main conflict and demonstrate their growth.",
  },
];

const structure5 = [
  {
    name: "Step 1: One Sentence Summary",
    type: "document",
    content:
      "Write a one-sentence summary of your novel that hooks the reader.",
  },
  {
    name: "Step 2: One Paragraph Summary",
    type: "document",
    content:
      "Expand the sentence into a full paragraph describing the story setup, major disasters, and ending.",
  },
  {
    name: "Step 3: Character Sketches",
    type: "folder",
    color: "#8B5CF6",
    icon: "👤",
    children: [
      {
        name: "Main Character",
        content:
          "Define your protagonist's name, story goal, motivation, conflict, epiphany, and summary.",
      },
      {
        name: "Antagonist",
        content:
          "Define the main opposing force - could be a person, system, or internal conflict.",
      },
      {
        name: "Supporting Characters",
        content:
          "Brief sketches of other important characters and their roles.",
      },
    ],
  },
  {
    name: "Step 4: Expand to One Page",
    type: "document",
    content:
      "Expand each sentence of your paragraph into a full paragraph, creating a one-page synopsis.",
  },
  {
    name: "Step 5: Character Charts",
    type: "folder",
    color: "#EC4899",
    icon: "📋",
    children: [
      {
        name: "Main Character Details",
        content:
          "Full background, personality traits, appearance, and character arc.",
      },
      {
        name: "Supporting Cast Details",
        content: "Complete profiles for all major supporting characters.",
      },
    ],
  },
  {
    name: "Step 6: Expand to Four Pages",
    type: "document",
    content:
      "Expand each paragraph from the one-page synopsis into a full page, creating a four-page detailed outline.",
  },
  {
    name: "Step 7: Scene List",
    type: "folder",
    color: "#10B981",
    icon: "🎬",
    children: [
      {
        name: "Scene Planning",
        content:
          "Create a list of every scene in the novel with POV character and brief description.",
      },
    ],
  },
];
export { structure, structure2, structure3, structure4, structure5 };
