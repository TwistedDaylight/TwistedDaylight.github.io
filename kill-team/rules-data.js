/*
 * Kill Team Rules Data
 * ====================
 * HOW TO ADD A NEW RULE:
 *   Add an object to the RULES array:
 *   {
 *     id:       'unique-slug',          // stable ID, no spaces
 *     keyword:  'Rule Name',            // displayed title
 *     category: 'actions',             // must match a category id below
 *     tags:     ['tag1', 'tag2'],       // extra search terms
 *     versions: [                       // one entry per rulebook / update
 *       {
 *         date:   '2025-06',            // YYYY-MM  (or just YYYY)
 *         source: 'June 2025 Update',   // free-form label shown in UI
 *         text:   'Rule text...',
 *       },
 *     ]
 *   }
 *
 * HOW TO ADD A NEW VERSION TO AN EXISTING RULE:
 *   Find the rule by id and push a new object into its versions array.
 *   The UI always sorts newest-first, so order in the array doesn't matter.
 *
 * DATES: Use YYYY-MM when you know the month, YYYY when you don't.
 *   Examples: '2025-06', '2024', '2021-08'
 *
 * MARKING UNCERTAIN CONTENT: start the text with ⚠ — it will be highlighted.
 */

const KILL_TEAM_DATA = {

  categories: [
    { id: 'overview',    label: 'Game Overview' },
    { id: 'sequence',    label: 'Phases & Sequence' },
    { id: 'actions',     label: 'Actions' },
    { id: 'orders',      label: 'Orders' },
    { id: 'shooting',    label: 'Shooting' },
    { id: 'fighting',    label: 'Fighting' },
    { id: 'terrain',     label: 'Terrain & Cover' },
    { id: 'command',     label: 'Command Points' },
    { id: 'ploys',       label: 'Ploys' },
    { id: 'objectives',  label: 'Tac Ops & Objectives' },
    { id: 'conditions',  label: 'Conditions & States' },
  ],

  rules: [

    // ── GAME OVERVIEW ──────────────────────────────────────────────────────────

    {
      id: 'kill-team',
      keyword: 'Kill Team (Team Composition)',
      category: 'overview',
      tags: ['team', 'composition', 'operatives', 'roster', 'squad'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Same core concept. Rosters and operative counts may be adjusted in updated team rules. Some teams introduced in 2024 seasons have specific roster sizes defined in their individual rules.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'A kill team is a small group of operatives — typically 6 to 15 models depending on the faction. Each team is built from a datacard roster. The number of operatives and their point costs are defined per-team in the team rules (Compendium or team-specific book).',
        },
      ],
    },

    {
      id: 'operative',
      keyword: 'Operative',
      category: 'overview',
      tags: ['model', 'datacard', 'characteristics', 'profile'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Same as 2021. Some datasheets were revised with updated characteristic values or new special rules in 2024 season updates.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'An operative is a single model in a kill team. Each operative has a datacard listing its characteristics: M (Move), APL (Action Point Limit), GA (Group Activation), DF (Defence), SV (Save), W (Wounds). Operatives also have a list of weapons and any special abilities.',
        },
      ],
    },

    {
      id: 'datacard',
      keyword: 'Datacard / Datasheet',
      category: 'overview',
      tags: ['card', 'stats', 'profile', 'characteristics', 'statline'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Same format. Updated versions of some existing datacards may have revised values. New season teams may introduce new special rule keywords.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Each operative type has a datacard showing its statline and weapons. Characteristics: M (Move in inches), APL (Action Point Limit), GA (Group Activation), DF (Defence dice), SV (Save value e.g. 4+), W (Wounds). Weapons show: A (Attacks), BS or WS, D (Damage), SR (Special Rules), ! (Critical Hit effect).',
        },
      ],
    },

    {
      id: 'victory-points',
      keyword: 'Victory Points (VP)',
      category: 'overview',
      tags: ['vp', 'scoring', 'win', 'score', 'victory'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ VP still the primary currency. Kill Ops and Crit Ops were added as additional structured VP sources. Tiebreaker rules may have been updated — verify in your rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Victory Points (VP) are the primary scoring currency. Players score VP by completing Tac Ops and controlling objectives. The player with the most VP at the end of the 4th Turning Point wins. On a tie, the player who scored more VP from Tac Ops wins; if still tied, the game is a draw.',
        },
      ],
    },

    // ── PHASES & SEQUENCE ──────────────────────────────────────────────────────

    {
      id: 'turning-points',
      keyword: 'Turning Points',
      category: 'sequence',
      tags: ['round', 'turn', 'game length', 'structure', 'tp'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Still 4 Turning Points. Phase structure may have minor naming or ordering differences — verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'A game of Kill Team lasts 4 Turning Points. Each Turning Point consists of: 1. Strategy Phase, 2. Firefight Phase. The game ends after the 4th Turning Point and VP are totalled.',
        },
      ],
    },

    {
      id: 'strategy-phase',
      keyword: 'Strategy Phase',
      category: 'sequence',
      tags: ['phase', 'cp', 'ploys', 'strategic', 'start of turn'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ CP gain and strategic action order may differ. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'At the start of each Turning Point\'s Strategy Phase: (1) Both players gain 2 Command Points. (2) Both players may use Strategic Ploys by spending CP. (3) Any other strategic effects are resolved. Ends when both players pass.',
        },
      ],
    },

    {
      id: 'firefight-phase',
      keyword: 'Firefight Phase',
      category: 'sequence',
      tags: ['phase', 'activation', 'alternating', 'actions', 'main phase'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Alternating activation structure is the same. Some details about what happens when one team is exhausted may have changed. Verify in your rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Players alternate activating Ready operatives, starting with the Initiative holder. Each activation: pick one Ready operative → perform actions up to its APL → mark Activated. Continue alternating until all operatives are Activated. If one player runs out, the other activates all remaining operatives consecutively.',
        },
      ],
    },

    {
      id: 'initiative',
      keyword: 'Initiative',
      category: 'sequence',
      tags: ['roll', 'first player', 'turn order', 'd6', 'priority'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Basic roll-off is the same. Some abilities may modify the Initiative roll. Verify in your rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'At the start of the Firefight Phase, both players roll a D6. The higher result wins Initiative and activates first this Turning Point. Ties are re-rolled. The Initiative player also activates consecutively if their opponent has no Ready operatives left.',
        },
      ],
    },

    {
      id: 'group-activation',
      keyword: 'Group Activation (GA)',
      category: 'sequence',
      tags: ['ga', 'group', 'multiple', 'activate', 'together'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ GA mechanic is the same in principle. Some teams\' GA values may have changed in updated datasheets.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'The GA characteristic shows how many operatives of that type activate together in one activation. GA 2 means you can activate up to 2 of that type together, spending each one\'s AP independently. Still counts as one activation in the alternating sequence.',
        },
      ],
    },

    // ── ACTIONS ────────────────────────────────────────────────────────────────

    {
      id: 'apl',
      keyword: 'Action Point Limit (APL)',
      category: 'actions',
      tags: ['ap', 'apl', 'action points', 'actions per turn', 'activation'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Same APL system. Some updated datasheets may have different APL values. Verify if any universal APL cost changes were made.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Each operative\'s datacard shows its APL (usually 2). During an activation, the operative performs actions up to its APL. Each standard action costs 1 AP. Some actions cost 2 AP or have other costs. Unused AP is lost at the end of the activation.',
        },
      ],
    },

    {
      id: 'normal-move',
      keyword: 'Normal Move',
      category: 'actions',
      tags: ['move', 'movement', 'M', 'inches', 'walk'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Same core rules. Verify any terrain interaction changes in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Cost: 1 AP. Move the operative up to its M (Move) characteristic in inches. Cannot move through other models or impassable terrain. Can traverse terrain features (climbing costs extra movement). Cannot end on top of another model.',
        },
      ],
    },

    {
      id: 'dash',
      keyword: 'Dash',
      category: 'actions',
      tags: ['move', 'extra movement', 'sprint', '3 inch'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Dash distance or restrictions may have changed. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Cost: 1 AP. Move the operative up to 3 inches, following the same rules as a Normal Move. Can be used in the same activation as a Normal Move for extra distance.',
        },
      ],
    },

    {
      id: 'fall-back',
      keyword: 'Fall Back',
      category: 'actions',
      tags: ['retreat', 'disengage', 'firefight range', 'escape', 'melee'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Restrictions on actions after Fall Back may differ. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Cost: 1 AP. Only available within Firefight Range (1") of an enemy. Move up to M". After Falling Back, the operative cannot Shoot or Fight this activation. This is the primary way operatives escape melee.',
        },
      ],
    },

    {
      id: 'charge',
      keyword: 'Charge',
      category: 'actions',
      tags: ['charge', 'melee', 'firefight range', 'overwatch', 'M+2'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Charge distance or Overwatch interaction may differ. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Cost: 1 AP. Move up to M+2" and must end within Firefight Range (1") of a visible enemy. This movement may trigger Overwatch from readied enemy operatives. After Charging, may immediately Fight if AP remains.',
        },
      ],
    },

    {
      id: 'shoot-action',
      keyword: 'Shoot',
      category: 'actions',
      tags: ['shooting', 'ranged', 'attack', 'bs', 'gun'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Restrictions on shooting (order requirements, from combat) may have changed. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Cost: 1 AP. Select a visible enemy in range of a ranged weapon and make a shooting attack. The operative must be in Engage order (unless an ability says otherwise). Cannot Shoot while within Firefight Range (1") of an enemy — must Fight or Fall Back instead.',
        },
      ],
    },

    {
      id: 'fight-action',
      keyword: 'Fight',
      category: 'actions',
      tags: ['melee', 'close combat', 'ws', 'firefight range', '1 inch'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Fight action sequence may have been updated. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Cost: 1 AP. Must be within Firefight Range (1") of an enemy. Make a melee attack with one melee weapon. Both the attacker and the target roll attack dice simultaneously — a Firefight. See the Fight Sequence for full resolution.',
        },
      ],
    },

    {
      id: 'overwatch',
      keyword: 'Overwatch',
      category: 'actions',
      tags: ['reaction', 'shoot', 'charge reaction', 'readied', 'interrupt'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Overwatch mechanics were significantly updated in some 2024 season rules. Triggers and resolution may differ. Verify carefully in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Cost: 1 AP. The operative readies for Overwatch. Until next activated, if an enemy within range and LoS performs a Charge, Normal Move, or Dash, the operative may immediately make a free Shoot action against that enemy. Overwatch ends after the shot or at the end of the Turning Point.',
        },
      ],
    },

    {
      id: 'pick-up',
      keyword: 'Pick Up',
      category: 'actions',
      tags: ['objective', 'marker', 'token', 'item'],
      versions: [
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Cost: 1 AP. Pick up an objective marker or token in base contact. Exact rules depend on the mission being played.',
        },
      ],
    },

    {
      id: 'conceal-action',
      keyword: 'Conceal (Action)',
      category: 'actions',
      tags: ['order', 'conceal', 'hide', 'stealth', 'change order'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Whether the Conceal action includes a free move may differ. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Cost: 1 AP. Change the operative\'s order from Engage to Conceal. ⚠ Some editions allow a free Normal Move as part of this action — verify in your rulebook.',
        },
      ],
    },

    // ── ORDERS ─────────────────────────────────────────────────────────────────

    {
      id: 'engage-order',
      keyword: 'Engage Order',
      category: 'orders',
      tags: ['order', 'engage', 'shoot', 'visible', 'active'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Default starting order may differ in some 2024 rules. Verify.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'An operative with Engage order can be targeted by enemy Shoot actions normally and can itself use Shoot actions. Operatives start each Turning Point in Engage order by default. The Engage side of the order token faces up.',
        },
      ],
    },

    {
      id: 'conceal-order',
      keyword: 'Conceal Order',
      category: 'orders',
      tags: ['order', 'conceal', 'hidden', 'cannot target', 'stealth'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Targeting restrictions for Conceal order may have been refined. Verify the precise wording in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'An operative with Conceal order cannot be targeted by enemy Shoot actions unless the attacker is within Engagement Range (2"). Operatives in Conceal order can still be fought in melee (Fight action) normally.',
        },
      ],
    },

    // ── SHOOTING ───────────────────────────────────────────────────────────────

    {
      id: 'shooting-sequence',
      keyword: 'Shooting Attack Sequence',
      category: 'shooting',
      tags: ['shooting', 'attack', 'sequence', 'steps', 'how to shoot'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Basic sequence is the same. Critical hit save interactions may have changed. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Steps: (1) Declare target — must be visible and in range. (2) Roll attack dice — number of D6 equal to the weapon\'s A characteristic. (3) Retain hits — equal to or higher than BS = normal hit; unmodified 6 (or Lethal threshold) = critical hit. (4) Target makes saves — roll D6 per hit, save on SV or higher. (5) Apply damage — unsaved hits deal damage.',
        },
      ],
    },

    {
      id: 'ballistic-skill',
      keyword: 'Ballistic Skill (BS)',
      category: 'shooting',
      tags: ['bs', 'to hit', 'shooting', 'skill', 'accuracy'],
      versions: [
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'The minimum D6 roll needed to score a hit with a ranged attack. E.g. BS 3+ means a roll of 3, 4, 5, or 6 hits. An unmodified 1 always misses. An unmodified 6 is always a critical hit (or lower with Lethal X+). Cover does not affect BS — it affects saves.',
        },
      ],
    },

    {
      id: 'critical-hits',
      keyword: 'Critical Hits',
      category: 'shooting',
      tags: ['crit', '6', 'critical', 'special effect', 'mortal'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Critical hit interactions with saves may have changed in 2024. Some updates adjusted how critical saves (such as shields) work. Verify in your rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'A critical hit is scored when an attack die shows an unmodified 6 (or lower with a Lethal X+ special rule). Critical hits deal the weapon\'s ! (crit damage) value instead of normal damage. They may bypass some saves depending on the specific rule being triggered.',
        },
      ],
    },

    {
      id: 'save-rolls',
      keyword: 'Save Rolls',
      category: 'shooting',
      tags: ['save', 'sv', 'defence', 'armour', 'block'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ What can and cannot be saved against critical hits may differ. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'For each unsaved hit, the target rolls a D6. On a result equal to or higher than its SV characteristic, the wound is saved and no damage is dealt. Some attacks ignore saves (mortal wounds, specific weapon rules). Critical hits interact with saves differently depending on weapon rules.',
        },
      ],
    },

    {
      id: 'weapon-special-rules',
      keyword: 'Weapon Special Rules',
      category: 'shooting',
      tags: ['special rules', 'keywords', 'weapon traits', 'sr'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ New special rule keywords may have been added in 2024. Some existing rules may have been clarified or changed. Verify the full list in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Common weapon special rules: AP 1/2 (subtract from enemy SV), Lethal 5+ (crits on 5+), Blast X" (hits all in radius), Torrent X" (auto-hit, no LoS), Ceaseless (re-roll misses), Fusillade (extra dice), Relentless (retain one extra hit die). See individual weapon profiles.',
        },
      ],
    },

    {
      id: 'lethal',
      keyword: 'Lethal X+',
      category: 'shooting',
      tags: ['lethal', 'special rule', 'critical threshold', 'crit'],
      versions: [
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Unmodified attack rolls of X or higher count as critical hits in addition to the normal threshold of 6. E.g. Lethal 5+ means a roll of 5 or 6 is a critical hit. Makes it easier to score critical hits with that weapon.',
        },
      ],
    },

    {
      id: 'ap',
      keyword: 'AP (Armour Penetration)',
      category: 'shooting',
      tags: ['ap', 'armour penetration', 'save modifier', 'special rule'],
      versions: [
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'AP X subtracts X from the target\'s SV for save rolls (e.g. AP 1 against SV 4+ means the defender saves on 5+). If AP reduces SV below 1+, no save can be taken against that attack.',
        },
      ],
    },

    // ── FIGHTING (MELEE) ───────────────────────────────────────────────────────

    {
      id: 'fighting-sequence',
      keyword: 'Fight Sequence (Firefight)',
      category: 'fighting',
      tags: ['fight', 'melee', 'sequence', 'firefight', 'simultaneous', 'how to fight'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ The simultaneous fight resolution may have been changed to sequential or a modified system. This is a commonly revised mechanic. Verify carefully in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'When a Fight action is declared: both attacker and target roll their attack dice simultaneously. Hits determined by WS for each side. Both sides make saves against the other\'s hits. Damage applied simultaneously. The target may spend 1 AP to fight back if they have AP remaining — a "Firefight" where both can wound each other.',
        },
      ],
    },

    {
      id: 'weapon-skill',
      keyword: 'Weapon Skill (WS)',
      category: 'fighting',
      tags: ['ws', 'melee', 'to hit', 'skill', 'close combat'],
      versions: [
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'The minimum D6 roll needed to score a hit with a melee attack. Works the same as BS but for Fight actions. An unmodified 6 is always a critical hit (or lower with Lethal X+). An unmodified 1 always misses.',
        },
      ],
    },

    {
      id: 'firefight-range',
      keyword: 'Firefight Range',
      category: 'fighting',
      tags: ['1 inch', 'melee range', 'engagement', 'close combat', 'contact'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Verify any edge cases around shooting from Firefight Range in 2024.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Firefight Range is 1 inch. Operatives within 1" of each other can Fight. Operatives in Firefight Range cannot Shoot — they must Fight or Fall Back instead. Charging requires ending within Firefight Range of the target.',
        },
      ],
    },

    {
      id: 'engagement-range',
      keyword: 'Engagement Range',
      category: 'fighting',
      tags: ['2 inch', 'engagement', 'conceal order', 'range'],
      versions: [
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Engagement Range is 2 inches. Used primarily for the Conceal Order rule — operatives with Conceal order can still be targeted if the attacker is within 2". May also be referenced by abilities or Tac Ops.',
        },
      ],
    },

    // ── TERRAIN & COVER ────────────────────────────────────────────────────────

    {
      id: 'line-of-sight',
      keyword: 'Line of Sight (LoS)',
      category: 'terrain',
      tags: ['los', 'visibility', 'target', 'sight', 'see'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ LoS rules (what counts as blocking, head vs whole model) may have been clarified in 2024. Verify exact wording in your rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'To target an enemy with a Shoot action, the attacker must have line of sight. Draw an imaginary line from the attacker\'s model to any part of the target. If no terrain or model fully blocks this line, LoS exists. Obscuring terrain blocks LoS entirely. Partial blocking may grant Cover.',
        },
      ],
    },

    {
      id: 'light-cover',
      keyword: 'Light Cover',
      category: 'terrain',
      tags: ['cover', 'save bonus', 'partial cover', '+1'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Cover save bonuses and definition of Light vs Heavy may have changed. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'If a target is partially obscured by terrain (not Obscuring terrain), it benefits from Light Cover: +1 to SV for save rolls against Shoot actions from that attacker. Does not apply to Fight actions. ⚠ The exact definition of "partially obscured" should be verified.',
        },
      ],
    },

    {
      id: 'heavy-cover',
      keyword: 'Heavy Cover',
      category: 'terrain',
      tags: ['cover', 'save bonus', 'substantial cover', '+2'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Cover tiers and bonuses may have changed. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Heavy Cover gives +2 to SV (versus Light Cover\'s +1). Applies when the operative is substantially obscured — typically more than half the model is behind terrain. ⚠ The boundary between Light and Heavy Cover is often debated; verify in your edition.',
        },
      ],
    },

    {
      id: 'obscuring',
      keyword: 'Obscuring Terrain',
      category: 'terrain',
      tags: ['obscuring', 'los blocker', 'no sight', 'wall', 'dense'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Definition and interaction with Obscuring terrain may have been clarified in 2024. Verify in your rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Obscuring terrain completely blocks line of sight. No Shoot action can target an operative if LoS passes through Obscuring terrain. Examples include dense woods, walls, and buildings. Operatives wholly within Obscuring terrain also benefit from its protection.',
        },
      ],
    },

    {
      id: 'traversal',
      keyword: 'Traversal (Climbing)',
      category: 'terrain',
      tags: ['climb', 'ascend', 'descend', 'movement', 'vertical'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Traversal cost or rules may have been simplified or changed. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Operatives can climb up and down terrain. Climbing costs movement equal to the vertical distance. E.g. climbing a 3" wall costs 3" of M. Operatives cannot end a move mid-climb.',
        },
      ],
    },

    // ── COMMAND POINTS ─────────────────────────────────────────────────────────

    {
      id: 'command-points',
      keyword: 'Command Points (CP)',
      category: 'command',
      tags: ['cp', 'command', 'resource', 'ploys', 'points'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ CP gain amount (2 per TP) and maximum cap may have changed. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Both players start with 0 CP. At the start of each Turning Point\'s Strategy Phase, each player gains 2 CP. CP can also come from abilities, Strategic Ploys, or Tac Ops. Maximum: 5 CP at any time; excess is lost.',
        },
      ],
    },

    // ── PLOYS ──────────────────────────────────────────────────────────────────

    {
      id: 'strategic-ploys',
      keyword: 'Strategic Ploys',
      category: 'ploys',
      tags: ['ploy', 'strategic phase', 'cp', 'setup', 'powerful'],
      versions: [
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Team-specific abilities used during the Strategy Phase. Cost CP to activate. Provide powerful effects for the upcoming Turning Point. Some are one-use or have other restrictions. Each kill team has its own set in its team rules.',
        },
      ],
    },

    {
      id: 'tactical-ploys',
      keyword: 'Tactical Ploys',
      category: 'ploys',
      tags: ['ploy', 'firefight phase', 'cp', 'reaction', 'in-game'],
      versions: [
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Team-specific abilities used during the Firefight Phase, triggered by specific conditions (e.g. "when one of your operatives is activated"). Cost CP. Teams have their own Tactical Ploys plus some universal ones.',
        },
      ],
    },

    {
      id: 'universal-tactical-ploys',
      keyword: 'Universal Tactical Ploys',
      category: 'ploys',
      tags: ['universal', 'tactical ploy', 'all teams', 'core ploys'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ The list of universal Tactical Ploys may have been updated. Some may have been added, removed, or changed. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'All kill teams have access to a set of universal Tactical Ploys regardless of faction. These include options like Brace (reduce damage) and Balanced Tactic (gain extra AP), among others. ⚠ Verify the exact list in your core rulebook.',
        },
      ],
    },

    // ── TAC OPS & OBJECTIVES ───────────────────────────────────────────────────

    {
      id: 'tac-ops',
      keyword: 'Tac Ops (Tactical Operations)',
      category: 'objectives',
      tags: ['tac ops', 'objectives', 'vp', 'secret', 'cards', 'mission'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Tac Op categories, draw size, and reveal timing may have changed in 2024. Verify in your rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Secret mission objectives each player pursues independently. At game start, draw/select a hand of Tac Op cards. During each Turning Point, complete conditions to score VP. Tac Ops are typically revealed when claimed. Different teams have access to different pools based on faction and archetype.',
        },
      ],
    },

    {
      id: 'kill-ops',
      keyword: 'Kill Ops',
      category: 'objectives',
      tags: ['kill ops', 'scoring', 'vp', 'eliminate', 'kill'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: 'Kill Ops are a structured VP scoring mechanic introduced in 2024. Players score VP for eliminating enemy operatives under specific conditions defined by the mission\'s Kill Op objectives. ⚠ Exact VP amounts and triggering conditions should be verified in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Kill Ops were not a formally defined scoring category in the 2021 base rules. Scoring for eliminating operatives was handled through specific mission rules or Tac Ops.',
        },
      ],
    },

    {
      id: 'crit-ops',
      keyword: 'Crit Ops (Critical Operations)',
      category: 'objectives',
      tags: ['crit ops', 'scoring', 'vp', 'mission objectives', 'critical'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: 'Crit Ops are a structured scoring mechanic representing high-value mission objectives. Both players pursue the same Crit Op objectives listed in the mission. ⚠ Exact mechanics, VP values, and timing should be verified in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Crit Ops were not a formally defined scoring category in the 2021 base rules. Mission-specific critical objectives were handled through direct mission rules.',
        },
      ],
    },

    {
      id: 'objective-markers',
      keyword: 'Objective Markers',
      category: 'objectives',
      tags: ['objective', 'marker', 'token', 'control', 'terrain'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Control range or scoring timing may differ. Verify in your 2024 mission rules.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Tokens placed at game start per the mission layout. Operatives control objectives by being within the control range (usually 2") with no enemy also within that range. Controlling objectives scores VP as defined by the mission.',
        },
      ],
    },

    {
      id: 'controlling-objectives',
      keyword: 'Controlling Objectives',
      category: 'objectives',
      tags: ['control', 'objective', 'contest', 'vp', '2 inch'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: '⚠ Control mechanics may have been updated. Verify in your 2024 rulebook.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'An objective is controlled by the player with more operatives within the control range (typically 2") than their opponent. Equal numbers = contested (neither controls). Incapacitated operatives do not count.',
        },
      ],
    },

    // ── CONDITIONS & STATES ────────────────────────────────────────────────────

    {
      id: 'incapacitated',
      keyword: 'Incapacitated',
      category: 'conditions',
      tags: ['dead', 'removed', 'wounds', 'eliminated', '0 wounds'],
      versions: [
        {
          date: '2024-01',
          source: 'Kill Team 2024',
          text: 'Same removal rule. VP scoring from incapacitation is formalised through Kill Ops in 2024.',
        },
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'An operative is Incapacitated when its Wounds reach 0. Immediately removed from the battlefield. No longer counts for any game purposes (objectives, activations, etc.).',
        },
      ],
    },

    {
      id: 'ready-activated',
      keyword: 'Ready / Activated States',
      category: 'conditions',
      tags: ['ready', 'activated', 'state', 'token', 'marker'],
      versions: [
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Operatives are either Ready or Activated during the Firefight Phase. All start as Ready. When activated and actions completed, the operative becomes Activated and cannot activate again this Turning Point. At the start of the next Turning Point\'s Firefight Phase, all surviving operatives revert to Ready.',
        },
      ],
    },

    {
      id: 'injured',
      keyword: 'Injured',
      category: 'conditions',
      tags: ['injured', 'wounds', 'half', 'debuff', 'damage track'],
      versions: [
        {
          date: '2021-08',
          source: 'Kill Team 2021',
          text: 'Some operatives have Injured abilities that trigger when reduced to half their starting Wounds or fewer (round up). Listed on the operative\'s datacard. E.g. an operative with W 12 becomes Injured at 6 wounds — may gain negative characteristic modifiers.',
        },
      ],
    },

  ], // end rules

}; // end KILL_TEAM_DATA
