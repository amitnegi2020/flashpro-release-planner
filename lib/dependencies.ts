// Story-level dependencies from the dependency map
// key = story ID, value = array of story IDs that must be in an EQUAL or EARLIER sprint
export const STORY_DEPS: Record<string, string[]> = {
  // Approve and reject shop needs Register + User Management
  'O02': ['S01','S02','S03'], 'O03': ['S01'], 'O04': ['S01','S02','S03'],
  'O05': ['S01'], 'O06': ['S01'], 'O07': ['S01','S02','S03'],
  'O08': ['O07'], 'O09': ['O08'], 'O10': ['O09'],
  'O11': ['S01'], 'O12': ['O07'],
  // Setup shop needs O10 approval
  'S05': ['O10'], 'S06': ['O10'], 'S07': ['O10'], 'S08': ['O10'],
  'S09': ['O10'], 'S10': ['O10'], 'S11': ['O10'], 'S12': ['O10'],
  // Indicate status needs S11
  'O60': ['S11'],
  // Manage seller status needs approval
  'O13': ['O10'], 'O14': ['O10'], 'O15': ['O10'],
  // Warehouse needs shop live
  'S51': ['O10', 'O60'],
  'S52': ['O40', 'O41', 'S51'],
  // Shipping fleet needs delivery methods + 3PL
  'S49': ['O40', 'O41'],
  'S50': ['O40', 'O41'],
  // Configure seller exceptions needs delivery methods
  'O42': ['O40'],
  // Create offers needs commissions + taxes + shop
  'S13': ['O37', 'O39', 'O10'],
  'S14': ['O37', 'O39', 'O10'],
  'S15': ['O37', 'O39', 'O10'],
  // Manage stock/price/product need create offers
  'S16': ['S13'], 'S17': ['S13'],
  'S18': ['S13'], 'S19': ['S13'],
  'S20': ['S13'], 'S21': ['S13'], 'S22': ['S13'], 'S23': ['S13'],
  'S24': ['S13'], 'S25': ['S13'], 'S26': ['S13'],
  // Approve products needs submitted product
  'O16': ['S13'], 'O17': ['S13'], 'O18': ['S13'], 'O19': ['S13'],
  // Orders need product live
  'S39': ['S13', 'O17'], 'S40': ['S39'], 'S41': ['S40'],
  'S42': ['S13', 'O17'], 'S43': ['S13', 'O17'], 'S44': ['S43'],
  'S45': ['S39'], 'S46': ['S39'],
  // Returns need orders
  'S47': ['S39'], 'S48': ['S47'],
  // Override orders need orders
  'O46': ['S39'], 'O47': ['S40'], 'O49': ['S39'],
  'O48': ['S39'], 'O50': ['S41'], 'O65': ['S39'],
  // Override returns need returns
  'O43': ['S47'], 'O44': ['S47'], 'O45': ['S47'],
  // Promotions need products
  'S27': ['S13'], 'S28': ['S13'], 'S29': ['S13'],
  'S30': ['S13'], 'S31': ['S13'], 'S32': ['S13'],
  // Campaigns need products
  'O22': ['S13'], 'O23': ['S13'], 'O24': ['O23'], 'O25': ['O23'],
  'O26': ['S13'], 'O27': ['S13'], 'O28': ['S13'],
  // Enrol needs campaigns
  'S33': ['O22','O23'], 'S34': ['O27'], 'S36': ['O28'],
  'S35': ['O26'],
  // Manage shop needs shop to be set up first
  'S56': ['O10', 'S11'],
  'S57': ['O10'], 'S58': ['O10'],
  // Configure POD needs shop
  'S37': ['O10'], 'S38': ['O10'],
  // Disable POD needs POD enabled
  'O36': ['S37'],
  // Settlements adjustments need disbursement cycle
  'O61': ['O31'], 'O62': ['O31'], 'O63': ['O31'],
  // Views need data to exist
  'S53': ['S39'], 'S55': ['O31', 'S39'], 'S54': ['S27'],
  'O59': ['S39'], 'O58': ['O22'],
}

const SPRINT_ORDER: Record<string, number> = {
  'backlog': 999, 'sprint1': 1, 'sprint2': 2, 'sprint3': 3,
  'sprint4': 4, 'sprint5': 5, 'sprint6': 6, 'sprint7': 7, 'sprint8': 8,
}

export function checkDependencies(
  movedId: string,
  targetSprint: string,
  stories: { id: string; sprint: string }[]
): { broken: string[]; warnings: string[] } {
  const storyMap = Object.fromEntries(stories.map(s => [s.id, s.sprint]))
  const targetOrder = SPRINT_ORDER[targetSprint] || 999
  const broken: string[] = []
  const warnings: string[] = []

  const deps = STORY_DEPS[movedId] || []
  for (const depId of deps) {
    const depSprint = storyMap[depId]
    if (!depSprint) continue
    const depOrder = SPRINT_ORDER[depSprint] || 999
    if (depOrder > targetOrder) {
      broken.push(`${depId} (must come before ${movedId})`)
    }
  }

  // Also check: if something depends on movedId, it shouldn't be in an earlier sprint
  for (const [sid, deps] of Object.entries(STORY_DEPS)) {
    if (deps.includes(movedId)) {
      const sStory = stories.find(s => s.id === sid)
      if (!sStory) continue
      const sOrder = SPRINT_ORDER[sStory.sprint] || 999
      if (sOrder < targetOrder && sStory.sprint !== 'backlog') {
        warnings.push(`${sid} depends on ${movedId} but is already in an earlier sprint`)
      }
    }
  }

  return { broken, warnings }
}
