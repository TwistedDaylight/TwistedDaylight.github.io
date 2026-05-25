/*
 * Kill Team Rules Data
 * ====================
 * HOW TO ADD RULES:
 *   1. Add an entry to the RULES array below.
 *   2. Set "category" to one of the ids in CATEGORIES.
 *   3. Add edition text under "editions" using the edition keys (kt21, kt24).
 *      Only include editions where the rule exists or differs — omit the key
 *      entirely if the rule did not exist in that edition.
 *   4. Mark content you're unsure about with ⚠ at the start of the text.
 *
 * EDITION KEYS:
 *   kt21 = Kill Team 2021 (2nd Edition)
 *   kt24 = Kill Team 2024 (latest update)
 */

const KILL_TEAM_DATA = {

  editions: {
    kt21: {
      id: 'kt21',
      label: 'Kill Team 2021',
      shortLabel: '2021',
      color: '#c8a030',
      bg: 'rgba(200,160,48,0.12)',
      border: 'rgba(200,160,48,0.3)',
      description: '2nd Edition core rules, released 2021.'
    },
    kt24: {
      id: 'kt24',
      label: 'Kill Team 2024',
      shortLabel: '2024',
      color: '#5a9fd4',
      bg: 'rgba(90,159,212,0.12)',
      border: 'rgba(90,159,212,0.3)',
      description: 'Updated rules and annual changes, 2024.'
    }
  },

  categories: [
    { id: 'overview',    label: 'Game Overview' },
    { id: 'sequence',   label: 'Phases & Sequence' },
    { id: 'actions',    label: 'Actions' },
    { id: 'orders',     label: 'Orders' },
    { id: 'shooting',   label: 'Shooting' },
    { id: 'fighting',   label: 'Fighting' },
    { id: 'terrain',    label: 'Terrain & Cover' },
    { id: 'command',    label: 'Command Points' },
    { id: 'ploys',      label: 'Ploys' },
    { id: 'objectives', label: 'Tac Ops & Objectives' },
    { id: 'conditions', label: 'Conditions & States' },
  ],

  rules: [

    // ─── GAME OVERVIEW ────────────────────────────────────────────────────────

    {
      id: 'kill-team',
      keyword: 'Kill Team',
      category: 'overview',
      tags: ['team', 'composition', 'operatives', 'roster'],
      editions: {
        kt21: 'A kill team is a small group of operatives — typically 6 to 15 models depending on the faction. Each team is built from a datacard roster. The number of operatives and their point costs are defined per-team in the team rules (Compendium or team-specific book).',
        kt24: 'Same core concept. Rosters and operative counts may be adjusted in updated team rules. Some teams introduced in 2024 seasons have specific roster sizes defined in their individual rules.',
      }
    },
    {
      id: 'operative',
      keyword: 'Operative',
      category: 'overview',
      tags: ['model', 'datacard', 'characteristics'],
      editions: {
        kt21: 'An operative is a single model in a kill team. Each operative has a datacard listing its characteristics: M (Move), APL (Action Point Limit), GA (Group Activation), DF (Defence), SV (Save), W (Wounds). Operatives also have a list of weapons and any special abilities.',
        kt24: 'Same as 2021. Some datasheets were revised with updated characteristic values or new special rules in the 2024 season updates.',
      }
    },
    {
      id: 'datacard',
      keyword: 'Datacard / Datasheet',
      category: 'overview',
      tags: ['card', 'stats', 'profile', 'characteristics'],
      editions: {
        kt21: 'Each operative type has a datacard showing its statline and weapons. Characteristics are: M (Move in inches), APL (Action Point Limit), GA (Group Activation — how many activate together), DF (Defence dice), SV (Save value, e.g. 4+), W (Wounds). Weapons show: A (Attacks), BS or WS (Ballistic/Weapon Skill), D (Damage), SR (Special Rules), !  (Critical Hit effect).',
        kt24: 'Same format. Updated versions of some existing datacards may have revised values. New season teams may introduce new special rule keywords on their datacards.',
      }
    },
    {
      id: 'victory-points',
      keyword: 'Victory Points (VP)',
      category: 'overview',
      tags: ['vp', 'scoring', 'win', 'score'],
      editions: {
        kt21: 'Victory Points (VP) are the primary scoring currency. Players score VP by completing Tac Ops and controlling objectives. The player with the most VP at the end of the 4th Turning Point wins. On a tie, the player who scored more VP from Tac Ops wins; if still tied, the game is a draw.',
        kt24: 'VP still the primary currency. Kill Ops and Crit Ops were added as additional structured VP sources in 2024. Tiebreaker rules may have been updated — verify in your rulebook.',
      }
    },

    // ─── PHASES & SEQUENCE ────────────────────────────────────────────────────

    {
      id: 'turning-points',
      keyword: 'Turning Points',
      category: 'sequence',
      tags: ['round', 'turn', 'game length', 'structure'],
      editions: {
        kt21: 'A game of Kill Team lasts 4 Turning Points. Each Turning Point consists of the following phases in order: 1. Strategy Phase, 2. Firefight Phase. The game ends after the 4th Turning Point and VP are totalled.',
        kt24: 'Still 4 Turning Points. Phases within a Turning Point may have been renamed or reordered — verify in current rulebook. ⚠ Phase structure details may differ.',
      }
    },
    {
      id: 'strategy-phase',
      keyword: 'Strategy Phase',
      category: 'sequence',
      tags: ['phase', 'cp', 'ploys', 'strategic'],
      editions: {
        kt21: 'At the start of each Turning Point\'s Strategy Phase: (1) Both players gain 2 Command Points (CP). (2) Both players may use Strategic Ploys by spending CP. (3) Any other strategic effects are resolved. The Strategy Phase ends when both players have completed all strategic actions.',
        kt24: '⚠ CP gain amount and strategic actions may have changed. Verify exact CP gain and order of operations in your 2024 rulebook.',
      }
    },
    {
      id: 'firefight-phase',
      keyword: 'Firefight Phase',
      category: 'sequence',
      tags: ['phase', 'activation', 'alternating', 'actions'],
      editions: {
        kt21: 'In the Firefight Phase, players alternate activating Ready operatives. The player who won Initiative activates first. Each activation: pick one Ready operative → perform actions up to its APL → mark as Activated. Continue alternating until all operatives on both sides are Activated. If one player runs out of Ready operatives, the other player activates all remaining ones consecutively.',
        kt24: '⚠ Alternating activation structure is the same. Some details about what happens when one team is exhausted may have changed. Verify in your rulebook.',
      }
    },
    {
      id: 'initiative',
      keyword: 'Initiative',
      category: 'sequence',
      tags: ['roll', 'first player', 'turn order', 'd6'],
      editions: {
        kt21: 'At the start of the Firefight Phase, both players roll a D6. The player with the higher result wins Initiative and activates their first operative first in this Turning Point. On a tie, re-roll. The player who wins Initiative also activates the second operative if their opponent has no Ready operatives left.',
        kt24: '⚠ Basic Initiative roll-off is the same. Some Tac Ops or abilities may modify Initiative — verify in your rulebook.',
      }
    },
    {
      id: 'group-activation',
      keyword: 'Group Activation (GA)',
      category: 'sequence',
      tags: ['ga', 'group', 'multiple', 'activate'],
      editions: {
        kt21: 'The GA characteristic shows how many operatives of that type can be activated as a group in a single activation. For example, GA 2 means you can activate up to 2 operatives of that type together, spending each one\'s AP independently. This still counts as one activation for the alternating sequence.',
        kt24: '⚠ GA mechanic is the same in principle. Some teams\' GA values may have changed in updated datasheets.',
      }
    },

    // ─── ACTIONS ──────────────────────────────────────────────────────────────

    {
      id: 'apl',
      keyword: 'Action Point Limit (APL)',
      category: 'actions',
      tags: ['ap', 'apl', 'action points', 'actions per turn'],
      editions: {
        kt21: 'Each operative\'s datacard shows its APL characteristic (usually 2). During an activation, the operative can perform a number of actions up to its APL. Each standard action costs 1 AP. Some actions or abilities may cost 2 AP or have other costs. Unused AP is lost at the end of the activation.',
        kt24: 'Same APL system. Some updated datasheets may have different APL values. ⚠ Verify if any universal changes to APL costs were made in 2024.',
      }
    },
    {
      id: 'normal-move',
      keyword: 'Normal Move',
      category: 'actions',
      tags: ['move', 'movement', 'M', 'inches'],
      editions: {
        kt21: 'Cost: 1 AP. Move the operative up to its M (Move) characteristic in inches. The operative cannot move through other models or impassable terrain. It can move through and over terrain features, climbing and descending, but this may cost extra movement. The operative cannot end its move on top of another model.',
        kt24: 'Same rules. ⚠ Any movement interaction changes with terrain should be verified in the 2024 rulebook.',
      }
    },
    {
      id: 'dash',
      keyword: 'Dash',
      category: 'actions',
      tags: ['move', 'extra movement', 'sprint'],
      editions: {
        kt21: 'Cost: 1 AP. Move the operative up to 3 inches. This movement follows the same rules as a Normal Move. An operative can Dash even if it has already used a Normal Move action this activation, giving it extra distance.',
        kt24: '⚠ Dash distance or restrictions may have changed. Verify in your 2024 rulebook.',
      }
    },
    {
      id: 'fall-back',
      keyword: 'Fall Back',
      category: 'actions',
      tags: ['retreat', 'disengage', 'firefight range', 'escape'],
      editions: {
        kt21: 'Cost: 1 AP. Only available if the operative is within Firefight Range (1") of an enemy operative. Move the operative up to its M characteristic. After Falling Back, the operative cannot use a Shoot or Fight action this activation. This is how operatives escape melee.',
        kt24: '⚠ Restrictions on actions after Fall Back may differ. Verify in your 2024 rulebook.',
      }
    },
    {
      id: 'charge',
      keyword: 'Charge',
      category: 'actions',
      tags: ['charge', 'melee', 'firefight range', 'overwatch'],
      editions: {
        kt21: 'Cost: 1 AP. Move the operative up to its M+2" (Move characteristic plus 2 inches). The operative must end this move within Firefight Range (1") of a visible enemy operative. This move may trigger Overwatch from enemy operatives with the Overwatch action readied. After Charging, the operative may immediately perform a Fight action (if it has AP remaining).',
        kt24: '⚠ Charge distance or interaction with Overwatch may differ in 2024. Verify in your rulebook.',
      }
    },
    {
      id: 'shoot-action',
      keyword: 'Shoot',
      category: 'actions',
      tags: ['shooting', 'ranged', 'attack', 'bs'],
      editions: {
        kt21: 'Cost: 1 AP. Select a visible enemy operative within range of a ranged weapon. Make a shooting attack with one weapon. The operative must be in Engage order (or have an ability allowing shooting in Conceal order). Cannot be used if the operative is within Firefight Range (1") of an enemy (must Fight instead).',
        kt24: '⚠ Restrictions on shooting from combat or order requirements may have changed. Verify in your 2024 rulebook.',
      }
    },
    {
      id: 'fight-action',
      keyword: 'Fight',
      category: 'actions',
      tags: ['melee', 'close combat', 'ws', 'firefight range'],
      editions: {
        kt21: 'Cost: 1 AP. The operative must be within Firefight Range (1") of an enemy operative. Make a melee attack using one of the operative\'s melee weapons. Both the attacker and the target roll their attack dice simultaneously (a Firefight). See Fighting rules for the full resolution sequence.',
        kt24: '⚠ Fight action sequence or simultaneous resolution rules may have been updated in 2024. Verify in your rulebook.',
      }
    },
    {
      id: 'overwatch',
      keyword: 'Overwatch',
      category: 'actions',
      tags: ['reaction', 'shoot', 'charge reaction', 'readied'],
      editions: {
        kt21: 'Cost: 1 AP. The operative readies itself for Overwatch. Until the next time it is activated, if an enemy operative within range and LoS performs a Charge, Normal Move, or Dash, the operative may immediately make a free Shoot action against that enemy as a reaction. Overwatch ends after the shot is resolved or at the end of the Turning Point.',
        kt24: '⚠ Overwatch mechanics were significantly updated in some 2024 season rules. The triggers and resolution may differ. Verify carefully in your 2024 rulebook.',
      }
    },
    {
      id: 'pick-up',
      keyword: 'Pick Up',
      category: 'actions',
      tags: ['objective', 'marker', 'token'],
      editions: {
        kt21: 'Cost: 1 AP. The operative picks up an objective marker or token that is in base contact with it. The specific rules for what happens when an objective is picked up depend on the mission being played.',
        kt24: '⚠ Pick Up rules may have mission-specific changes. Core action is the same.',
      }
    },
    {
      id: 'conceal-action',
      keyword: 'Conceal (Action)',
      category: 'actions',
      tags: ['order', 'conceal', 'hide', 'stealth'],
      editions: {
        kt21: 'Cost: 1 AP. Change the operative\'s order from Engage to Conceal. The operative may also make a free Normal Move as part of this action (moving to better cover, for example), though some versions of the rule just change the order without a free move — verify in your edition.',
        kt24: '⚠ Whether the Conceal action includes a free move may differ. Verify in your 2024 rulebook.',
      }
    },

    // ─── ORDERS ───────────────────────────────────────────────────────────────

    {
      id: 'engage-order',
      keyword: 'Engage Order',
      category: 'orders',
      tags: ['order', 'engage', 'shoot', 'visible'],
      editions: {
        kt21: 'An operative with Engage order can be targeted by enemy Shoot actions normally. It can also use Shoot actions itself. Operatives start each Turning Point in Engage order by default (unless specified otherwise). The order marker (Engage side up) is placed next to the operative.',
        kt24: '⚠ Default starting order may differ in some 2024 season rules. Verify in your rulebook.',
      }
    },
    {
      id: 'conceal-order',
      keyword: 'Conceal Order',
      category: 'orders',
      tags: ['order', 'conceal', 'hidden', 'cannot target'],
      editions: {
        kt21: 'An operative with Conceal order cannot be targeted by enemy Shoot actions unless the attacker is within Engagement Range (2"). The concealed operative must also have line of sight broken by terrain to benefit fully — if fully visible with no cover, the enemy can shoot them regardless. Operatives in Conceal order can still be fought in melee (Fight action) normally.',
        kt24: '⚠ The exact targeting restrictions for Conceal order may have been refined in 2024. Verify the precise wording in your rulebook.',
      }
    },

    // ─── SHOOTING ─────────────────────────────────────────────────────────────

    {
      id: 'shooting-sequence',
      keyword: 'Shooting Attack Sequence',
      category: 'shooting',
      tags: ['shooting', 'attack', 'sequence', 'steps', 'how to'],
      editions: {
        kt21: 'Steps: (1) Declare target — must be visible and in range. (2) Roll attack dice — roll a number of D6 equal to the weapon\'s A (Attacks) characteristic. (3) Retain hits — on a roll equal to or higher than BS, the die is a normal hit; on an unmodified 6 (or weapon\'s crit threshold), it is a critical hit. (4) The target makes saves — for each hit, roll a D6; on SV or higher it is saved; critical hits may have special save rules. (5) Apply damage — unsaved hits deal damage.',
        kt24: '⚠ The basic sequence is the same. Step details (especially critical hit saves) may have been updated. Verify in your 2024 rulebook.',
      }
    },
    {
      id: 'attack-characteristic',
      keyword: 'Attacks (A)',
      category: 'shooting',
      tags: ['attacks', 'dice', 'A', 'weapon stat'],
      editions: {
        kt21: 'The A characteristic on a weapon profile indicates how many D6 to roll when making an attack (shooting or fighting) with that weapon. Higher A means more dice and statistically more hits.',
        kt24: 'Same. Some weapon profiles in updated datacards may have revised A values.',
      }
    },
    {
      id: 'ballistic-skill',
      keyword: 'Ballistic Skill (BS)',
      category: 'shooting',
      tags: ['bs', 'to hit', 'shooting', 'skill'],
      editions: {
        kt21: 'BS is the minimum roll needed on each attack die for a ranged attack to score a hit. For example, BS 3+ means a D6 roll of 3, 4, 5, or 6 is a hit. An unmodified 1 always misses. An unmodified 6 is always a critical hit (or whatever the weapon\'s crit threshold is). Cover and other modifiers do not change BS — they affect saves instead.',
        kt24: 'Same BS mechanic. ⚠ Whether cover modifies BS or saves may have changed. Verify in your 2024 rulebook.',
      }
    },
    {
      id: 'critical-hits',
      keyword: 'Critical Hits',
      category: 'shooting',
      tags: ['crit', '6', 'critical', 'special effect'],
      editions: {
        kt21: 'A critical hit is scored when an attack die shows an unmodified 6 (or lower if the weapon has a "Lethal X+" special rule). Critical hits deal the weapon\'s critical damage (the ! value on the datacard) instead of its normal damage. Critical hits also bypass some or all save abilities in certain circumstances — check the specific rule being triggered.',
        kt24: '⚠ Critical hit rules and their interaction with saves may have changed. Some 2024 updates adjusted how critical saves (like shields) work. Verify in your rulebook.',
      }
    },
    {
      id: 'save-rolls',
      keyword: 'Save Rolls',
      category: 'shooting',
      tags: ['save', 'sv', 'defence', 'armour'],
      editions: {
        kt21: 'For each unsaved hit that wounds, the target rolls a D6. On a result equal to or higher than the operative\'s SV (Save) characteristic, the wound is saved and no damage is dealt. Some attacks ignore saves (e.g. mortal wounds or specific weapon rules). Critical hits may be saved differently depending on the weapon\'s critical rule.',
        kt24: '⚠ Save roll details, including what can and cannot be saved against critical hits, may differ. Verify in your 2024 rulebook.',
      }
    },
    {
      id: 'defence-dice',
      keyword: 'Defence (DF)',
      category: 'shooting',
      tags: ['df', 'defence', 'dice', 'block'],
      editions: {
        kt21: 'The DF characteristic indicates the number of defence dice the operative rolls when targeted by a shooting or fighting attack. Defence dice results of 6 are saves (blocks); results of 5 are also saves if the operative is in Cover. ⚠ The exact defence dice mechanic varies — verify in your rulebook whether DF is a flat save or a dice pool.',
        kt24: '⚠ This characteristic and its interaction with Cover may have changed significantly. Verify in your 2024 rulebook.',
      }
    },
    {
      id: 'wounds',
      keyword: 'Wounds (W)',
      category: 'shooting',
      tags: ['wounds', 'health', 'damage track', 'w'],
      editions: {
        kt21: 'W is the number of wounds an operative can sustain before being incapacitated. Each point of damage from an unsaved wound reduces the operative\'s remaining wounds by 1 (or by the damage value of the attack). When an operative\'s wounds reach 0, it is Incapacitated and removed from the battlefield.',
        kt24: 'Same mechanic. Some revised datasheets may have updated W values.',
      }
    },
    {
      id: 'weapon-special-rules',
      keyword: 'Weapon Special Rules',
      category: 'shooting',
      tags: ['special rules', 'keywords', 'weapon traits'],
      editions: {
        kt21: 'Weapons have Special Rules (SR) that modify how they work. Common examples: AP 1/2 (subtract 1 or 2 from enemy save rolls), Lethal 5+ (critical hits on 5+), Blast X" (hits all operatives within X"), Torrent X" (no LoS required, all in range hit automatically), Ceaseless (re-roll misses), Fusillade (roll extra dice), Relentless (retain one extra hit die). See individual weapon profiles for their specific SRs.',
        kt24: '⚠ New special rules keywords may have been added in 2024. Some existing rules may have been clarified. Verify the full keyword list in your 2024 rulebook.',
      }
    },
    {
      id: 'lethal',
      keyword: 'Lethal X+',
      category: 'shooting',
      tags: ['lethal', 'special rule', 'critical threshold'],
      editions: {
        kt21: 'Unmodified attack rolls of X or higher (e.g. Lethal 5+ means 5 or 6) count as critical hits in addition to the normal critical threshold of 6. This effectively makes it easier to score critical hits with the weapon.',
        kt24: 'Same rule. Some weapons may have gained or lost Lethal in updated profiles.',
      }
    },
    {
      id: 'ap',
      keyword: 'AP (Armour Penetration)',
      category: 'shooting',
      tags: ['ap', 'armour penetration', 'save modifier', 'special rule'],
      editions: {
        kt21: 'AP X (e.g. AP 1, AP 2) subtracts X from the target\'s SV for save rolls against that attack. An operative with SV 4+ targeted by an AP 1 weapon saves on a 5+. If AP reduces SV below 1+, saves cannot be taken at all against that attack.',
        kt24: 'Same rule and interaction. ⚠ Whether AP affects cover saves separately may differ. Verify in your 2024 rulebook.',
      }
    },

    // ─── FIGHTING (MELEE) ─────────────────────────────────────────────────────

    {
      id: 'fighting-sequence',
      keyword: 'Fight Sequence (Firefight)',
      category: 'fighting',
      tags: ['fight', 'melee', 'sequence', 'firefight', 'simultaneous'],
      editions: {
        kt21: 'When a Fight action is declared: both the attacker and the target roll their respective attack dice simultaneously. Hits are determined by WS for each side. Each side then makes saves against the other\'s hits. Damage is applied simultaneously. The target may also spend 1 AP to fight back (if it has AP remaining). This results in a "Firefight" where both operatives can wound each other.',
        kt24: '⚠ The simultaneous fight resolution may have been changed to a sequential or modified system in 2024. This is a commonly revised mechanic. Verify carefully in your 2024 rulebook.',
      }
    },
    {
      id: 'weapon-skill',
      keyword: 'Weapon Skill (WS)',
      category: 'fighting',
      tags: ['ws', 'melee', 'to hit', 'skill'],
      editions: {
        kt21: 'WS is the minimum roll needed on each attack die for a melee attack to score a hit. Works the same as BS but for Fight actions. An unmodified 6 is always a critical hit (or lower if the weapon has Lethal X+). An unmodified 1 always misses.',
        kt24: 'Same mechanic. WS values on specific datacards may have been revised.',
      }
    },
    {
      id: 'firefight-range',
      keyword: 'Firefight Range',
      category: 'fighting',
      tags: ['1 inch', 'melee range', 'engagement', 'close combat'],
      editions: {
        kt21: 'Firefight Range is 1 inch. Operatives within 1" of each other are said to be "in Firefight Range." This is the range at which Fight actions can be taken. Operatives in Firefight Range cannot use Shoot actions (they must Fight or Fall Back instead). Charging requires ending within Firefight Range of the target.',
        kt24: 'Firefight Range remains 1". ⚠ Verify if any edge cases around shooting from Firefight Range changed in 2024.',
      }
    },
    {
      id: 'engagement-range',
      keyword: 'Engagement Range',
      category: 'fighting',
      tags: ['2 inch', 'engagement', 'conceal order'],
      editions: {
        kt21: 'Engagement Range is 2 inches. It is used primarily for the Conceal Order rule — operatives with Conceal order can still be targeted by Shoot actions if the attacker is within Engagement Range (2"). It may also be referenced by some abilities or Tac Ops.',
        kt24: 'Engagement Range remains 2". ⚠ Verify any uses in 2024 rules.',
      }
    },

    // ─── TERRAIN & COVER ──────────────────────────────────────────────────────

    {
      id: 'line-of-sight',
      keyword: 'Line of Sight (LoS)',
      category: 'terrain',
      tags: ['los', 'visibility', 'target', 'sight'],
      editions: {
        kt21: 'To target an enemy with a Shoot action, the attacker must have line of sight. Draw an imaginary line from any part of the attacker\'s model (typically the head or eyes) to any part of the target model. If no terrain or model fully blocks this line, LoS exists. Obscuring terrain blocks LoS entirely. Partial blocking may grant Cover.',
        kt24: '⚠ LoS rules (what counts as blocking, head vs whole model) may have been clarified in 2024. Verify exact wording in your rulebook.',
      }
    },
    {
      id: 'light-cover',
      keyword: 'Light Cover',
      category: 'terrain',
      tags: ['cover', 'save bonus', 'partial cover'],
      editions: {
        kt21: 'If a target operative is partially obscured by terrain (but not Obscuring terrain), it benefits from Light Cover. Light Cover gives +1 to the target\'s SV for save rolls against Shoot actions from the attacker who has partial LoS. Does not apply in melee (Fight actions). ⚠ The exact definition of "partially obscured" should be verified.',
        kt24: '⚠ Cover save bonuses and definition of Light vs Heavy may have changed. Verify in your 2024 rulebook.',
      }
    },
    {
      id: 'heavy-cover',
      keyword: 'Heavy Cover',
      category: 'terrain',
      tags: ['cover', 'save bonus', 'substantial cover'],
      editions: {
        kt21: 'Heavy Cover provides a greater save bonus than Light Cover (+2 to SV rather than +1). It applies when the operative is more substantially obscured — typically when more than half the model is behind a terrain feature. ⚠ The boundary between Light and Heavy Cover is often a source of debate; verify the exact definition in your edition.',
        kt24: '⚠ Cover tiers and bonuses may have changed. Verify in your 2024 rulebook.',
      }
    },
    {
      id: 'obscuring',
      keyword: 'Obscuring Terrain',
      category: 'terrain',
      tags: ['obscuring', 'los blocker', 'no sight'],
      editions: {
        kt21: 'Obscuring terrain completely blocks line of sight. No Shoot action can target an operative that is behind or within Obscuring terrain if the attacker\'s LoS passes through that terrain. Examples include dense woods, walls, and buildings designated as Obscuring by the terrain setup rules. Operatives wholly within Obscuring terrain also benefit from its protection.',
        kt24: '⚠ Definition and interaction with Obscuring terrain may have been clarified in 2024. Verify in your rulebook.',
      }
    },
    {
      id: 'traversal',
      keyword: 'Traversal (Climbing)',
      category: 'terrain',
      tags: ['climb', 'ascend', 'descend', 'movement terrain'],
      editions: {
        kt21: 'Operatives can climb up and down terrain. Climbing costs movement equal to the vertical distance climbed. For example, climbing a 3" wall costs 3" of the operative\'s Move. Operatives cannot end a move mid-climb. Some terrain types (Barricades, Walls, etc.) have specific traversal rules.',
        kt24: '⚠ Traversal cost or rules may have been simplified or changed. Verify in your 2024 rulebook.',
      }
    },

    // ─── COMMAND POINTS ───────────────────────────────────────────────────────

    {
      id: 'command-points',
      keyword: 'Command Points (CP)',
      category: 'command',
      tags: ['cp', 'command', 'resource', 'ploys'],
      editions: {
        kt21: 'Command Points (CP) are a resource spent to use Ploys. Both players start the game with 0 CP. At the start of each Turning Point\'s Strategy Phase, each player gains 2 CP. CP can also be gained from certain abilities, Strategic Ploys, or Tac Ops. The maximum CP a player can hold at any time is 5; any CP gained above 5 is lost.',
        kt24: '⚠ CP gain amount (2 per TP) and maximum cap may have changed. Verify in your 2024 rulebook.',
      }
    },
    {
      id: 'cp-spend',
      keyword: 'Spending Command Points',
      category: 'command',
      tags: ['cp', 'spend', 'ploys', 'cost'],
      editions: {
        kt21: 'CP are spent to use Ploys — Tactical Ploys during the Firefight Phase, and Strategic Ploys during the Strategy Phase. Each ploy lists its CP cost. CP cannot be saved in excess of 5 (max). CP spent is removed from your pool. There is no limit to how many different ploys you use per game, only your available CP.',
        kt24: '⚠ Restrictions on ploy usage (once per phase, once per TP, etc.) may differ. Verify in your 2024 rulebook.',
      }
    },

    // ─── PLOYS ────────────────────────────────────────────────────────────────

    {
      id: 'strategic-ploys',
      keyword: 'Strategic Ploys',
      category: 'ploys',
      tags: ['ploy', 'strategic phase', 'cp', 'setup'],
      editions: {
        kt21: 'Strategic Ploys are team-specific abilities used during the Strategy Phase at the start of each Turning Point. Each kill team has its own set of Strategic Ploys listed in its team rules. They cost CP to activate and provide powerful effects for the upcoming Turning Point. Some Strategic Ploys are one-use only or have other restrictions.',
        kt24: 'Same concept. Individual teams\' Strategic Ploys may have been updated.',
      }
    },
    {
      id: 'tactical-ploys',
      keyword: 'Tactical Ploys',
      category: 'ploys',
      tags: ['ploy', 'firefight phase', 'cp', 'reaction'],
      editions: {
        kt21: 'Tactical Ploys are team-specific abilities used during the Firefight Phase. They are activated in response to specific triggers (e.g. "when one of your operatives is activated," "when an enemy shoots at one of your operatives"). Each has a CP cost. Teams have their own set of Tactical Ploys plus access to some universal ones.',
        kt24: 'Same concept. Individual team Tactical Ploys may have been updated.',
      }
    },
    {
      id: 'universal-tactical-ploys',
      keyword: 'Universal Tactical Ploys',
      category: 'ploys',
      tags: ['universal', 'tactical ploy', 'all teams', 'core ploys'],
      editions: {
        kt21: 'All kill teams have access to a set of universal Tactical Ploys regardless of faction. These include options like Brace (reduce damage), Balanced Tactic (gain extra AP), and others listed in the core rules. ⚠ The exact list of universal ploys should be verified in your core rulebook.',
        kt24: '⚠ The list of universal Tactical Ploys may have been updated in 2024. Some may have been added, removed, or changed. Verify in your 2024 rulebook.',
      }
    },

    // ─── TAC OPS & OBJECTIVES ─────────────────────────────────────────────────

    {
      id: 'tac-ops',
      keyword: 'Tac Ops (Tactical Operations)',
      category: 'objectives',
      tags: ['tac ops', 'objectives', 'vp', 'secret', 'cards'],
      editions: {
        kt21: 'Tac Ops are secret mission objectives that each player pursues independently. At game start, each player draws (or selects) a hand of Tac Op cards from their team\'s available Tac Ops. During each Turning Point, a player may score VP by completing the conditions on their Tac Ops. Tac Ops are typically revealed when the player claims them, not before. Different kill teams have access to different pools of Tac Ops based on their faction and archetype.',
        kt24: '⚠ Tac Op categories, draw size, and reveal timing may have changed in 2024. Verify in your rulebook.',
      }
    },
    {
      id: 'kill-ops',
      keyword: 'Kill Ops',
      category: 'objectives',
      tags: ['kill ops', 'scoring', 'vp', 'eliminate'],
      editions: {
        kt21: 'Kill Ops were not a formally defined scoring category in the 2021 base rules. Scoring for eliminating operatives was handled through specific mission rules or Tac Ops.',
        kt24: 'Kill Ops are a structured VP scoring mechanic introduced in 2024. Players score VP for eliminating enemy operatives under specific conditions defined by the mission\'s Kill Op objectives. ⚠ Exact VP amounts and triggering conditions should be verified in your 2024 rulebook.',
      }
    },
    {
      id: 'crit-ops',
      keyword: 'Crit Ops (Critical Operations)',
      category: 'objectives',
      tags: ['crit ops', 'scoring', 'vp', 'mission objectives'],
      editions: {
        kt21: 'Crit Ops were not a formally defined scoring category in the 2021 base rules. Critical mission-specific scoring was handled through mission rules directly.',
        kt24: 'Crit Ops are a structured scoring mechanic introduced in 2024 representing high-value mission objectives. Both players pursue the same Crit Op objectives listed in the mission. ⚠ Exact mechanics, VP values, and timing should be verified in your 2024 rulebook.',
      }
    },
    {
      id: 'objective-markers',
      keyword: 'Objective Markers',
      category: 'objectives',
      tags: ['objective', 'marker', 'token', 'control'],
      editions: {
        kt21: 'Objective markers are tokens placed on the battlefield at the start of the game according to the mission layout. Operatives can control objectives by being within a specified range (usually 2") with no enemy operatives also within that range. Controlling objectives scores VP as defined by the mission.',
        kt24: 'Same core concept. ⚠ Control range or scoring timing may differ. Verify in your 2024 mission rules.',
      }
    },
    {
      id: 'controlling-objectives',
      keyword: 'Controlling Objectives',
      category: 'objectives',
      tags: ['control', 'objective', 'contest', 'vp'],
      editions: {
        kt21: 'An objective marker is controlled by the player who has more operatives within the control range (typically 2") compared to their opponent. If both players have equal numbers of operatives within range, the objective is contested and not controlled by either player. Incapacitated operatives do not count for objective control.',
        kt24: '⚠ Control mechanics may have been updated in 2024. Verify in your rulebook.',
      }
    },

    // ─── CONDITIONS & STATES ──────────────────────────────────────────────────

    {
      id: 'incapacitated',
      keyword: 'Incapacitated',
      category: 'conditions',
      tags: ['dead', 'removed', 'wounds', 'eliminated'],
      editions: {
        kt21: 'An operative is Incapacitated when its Wounds (W) are reduced to 0. An Incapacitated operative is immediately removed from the battlefield. It no longer counts for any game purposes (objectives, activations, etc.). Incapacitating enemy operatives may score VP through Kill Ops (2024) or specific Tac Ops.',
        kt24: 'Same removal rule. VP scoring from incapacitation is formalized through Kill Ops in 2024.',
      }
    },
    {
      id: 'ready-activated',
      keyword: 'Ready / Activated States',
      category: 'conditions',
      tags: ['ready', 'activated', 'state', 'token'],
      editions: {
        kt21: 'Operatives are either Ready or Activated during the Firefight Phase. All operatives start the Firefight Phase as Ready. When an operative is activated and performs its actions, it becomes Activated and cannot be activated again this Turning Point. Ready markers/tokens track this state. At the start of the next Turning Point\'s Firefight Phase, all surviving operatives revert to Ready.',
        kt24: 'Same Ready/Activated system.',
      }
    },
    {
      id: 'injured',
      keyword: 'Injured',
      category: 'conditions',
      tags: ['injured', 'wounds', 'half', 'debuff'],
      editions: {
        kt21: 'Some operatives have Injured abilities that trigger when they are reduced to half their starting Wounds or fewer (rounding up). These are listed on the operative\'s datacard. For example, an operative with W 12 becomes Injured at 6 wounds or fewer, potentially gaining a negative modifier to its characteristics.',
        kt24: 'Same Injured trigger. Specific Injured effects vary by operative datacard.',
      }
    },
    {
      id: 'stagger',
      keyword: 'Stagger',
      category: 'conditions',
      tags: ['stagger', 'debuff', 'apl', 'melee effect'],
      editions: {
        kt21: '⚠ Stagger as a formal condition may exist in some team-specific rules or weapon special rules in 2021. Verify if this is a universal condition or team-specific in your edition.',
        kt24: '⚠ Stagger as a universal condition status may have been added or clarified in 2024. Verify in your rulebook.',
      }
    },

  ], // end rules

}; // end KILL_TEAM_DATA
