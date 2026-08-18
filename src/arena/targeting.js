/**
 * Who the hero shoots at.
 *
 * Deliberately **pure**: no engine, no DOM, no game state — plain objects in,
 * one of them out. That is the whole point of pulling it out of `arena.js`,
 * where the same decision was tangled with a board query and an entity registry
 * and therefore could not be tested at all.
 *
 * It was not tested, and it was wrong twice in two days: a cone so wide it
 * covered the whole field, then a cone that covered nothing within 80 px. Both
 * took browser instrumentation to see. Three assertions on plain numbers would
 * have caught either.
 *
 * The split is: **eligibility** ({@link inSight}) says who *may* be shot — one
 * rule, one place — and a **strategy** says which of them *is*. The gathering of
 * candidates stays with the host, which is the only thing that knows about
 * boards, layers and hit points.
 *
 * @typedef {Object} Candidate something that could be shot
 * @property {Object} element the host's own handle on it
 * @property {{x: number, y: number}} at world centre
 * @property {number} distance from the shooter, in world units
 * @property {number} offAxis radians between the aim and this target, 0 = dead ahead
 * @property {number} hp what it has left
 *
 * @typedef {Object} Sight what the shooter can see with
 * @property {number} range how far it reaches
 * @property {number} arc the **full** cone angle it covers, in radians
 * @property {number} pointBlank inside this radius, facing stops mattering
 */

/**
 * May this candidate be shot at all?
 *
 * Three rules, and the third is the one that is easy to forget: a cone of fixed
 * *angle* is a knife at close range — at 25 px, a 60° cone allows only ±14 px of
 * lateral tolerance — so anything nearer than `pointBlank` is fair game whatever
 * the aim. You do not need to face what is pressed against you.
 * @param {Candidate} candidate
 * @param {Sight} sight
 * @returns {boolean}
 */
export function inSight(candidate, sight) {
  if (candidate.distance <= 0 || candidate.distance > sight.range) {
    return false;
  }
  if (candidate.distance <= sight.pointBlank) {
    return true;
  }

  return candidate.offAxis <= sight.arc / 2;
}

/**
 * Pick the one candidate to shoot.
 * @param {Candidate[]} candidates every known target, eligible or not
 * @param {Sight} sight
 * @param {{choose: (eligible: Candidate[]) => ?Candidate}} strategy
 * @returns {?Candidate} null when nothing can be shot
 */
export function pickTarget(candidates, sight, strategy) {
  const eligible = candidates.filter(candidate => inSight(candidate, sight));

  return eligible.length ? strategy.choose(eligible) : null;
}

/**
 * @param {Candidate[]} candidates non-empty
 * @param {(candidate: Candidate) => number} rank lower wins
 * @returns {Candidate}
 */
function best(candidates, rank) {
  return candidates.reduce((winner, candidate) =>
    rank(candidate) < rank(winner) ? candidate : winner);
}

/**
 * The strategies, in the order a player cycles through them.
 *
 * Three rather than one, because a pattern with a single implementation is not a
 * pattern — it is an indirection with a long name. Each of these answers a
 * different question, and a player can reasonably want any of them.
 * @type {Array<{id: string, label: string, icon: string, choose: (eligible: Candidate[]) => Candidate}>}
 */
export const STRATEGIES = [
  {
    id: 'nearest',
    label: 'Nearest',
    icon: '🎯',
    /** Answer the most immediate threat. The default, and the safe one. */
    choose: eligible => best(eligible, candidate => candidate.distance),
  },
  {
    id: 'weakest',
    label: 'Weakest',
    icon: '💔',
    /**
     * Finish the wounded first. Fewer shots are wasted on a body that was going
     * to die anyway, so the wave thins faster — at the price of letting a fresh
     * one walk in while you tidy up.
     */
    choose: eligible => best(eligible, candidate => candidate.hp),
  },
  {
    id: 'toughest',
    label: 'Toughest',
    icon: '🛡️',
    /**
     * Break the big one first. It is the one that will still be standing when it
     * reaches you, and the one a short burst never kills — at the price of
     * ignoring everything smaller while you chew on it.
     */
    choose: eligible => best(eligible, candidate => -candidate.hp),
  },
];

/**
 * @param {string} id
 * @returns {Object} the strategy, falling back to the first — a saved or typed
 * id that no longer exists must not leave the hero unable to shoot
 */
export function strategyById(id) {
  return STRATEGIES.find(strategy => strategy.id === id) ?? STRATEGIES[0];
}
