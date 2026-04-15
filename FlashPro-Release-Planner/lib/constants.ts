// Shared constants for FlashPro Release Planner

export const SPRINT_KEYS = [
  'backlog', 'sprint1', 'sprint2', 'sprint3', 'sprint4',
  'sprint5', 'sprint6', 'sprint7', 'sprint8',
  'sprint9', 'sprint10', 'sprint11', 'sprint12',
] as const

export const SPRINT_NUM: Record<string, number> = {
  backlog: 0, sprint1: 1, sprint2: 2, sprint3: 3, sprint4: 4,
  sprint5: 5, sprint6: 6, sprint7: 7, sprint8: 8,
  sprint9: 9, sprint10: 10, sprint11: 11, sprint12: 12,
}

// Option C pastel palette — sprint header accent colours
// These are the *header bar* colours (medium saturation, readable on white text)
export const ALL_SPRINTS = [
  { key: 'sprint1',  label: 'Sprint 1',  color: '#5B8DEF' },  // Cornflower
  { key: 'sprint2',  label: 'Sprint 2',  color: '#7C6ED4' },  // Soft violet
  { key: 'sprint3',  label: 'Sprint 3',  color: '#9B59C4' },  // Muted purple
  { key: 'sprint4',  label: 'Sprint 4',  color: '#B06AB3' },  // Soft mauve
  { key: 'sprint5',  label: 'Sprint 5',  color: '#C0637A' },  // Dusty rose
  { key: 'sprint6',  label: 'Sprint 6',  color: '#D4845A' },  // Terracotta
  { key: 'sprint7',  label: 'Sprint 7',  color: '#5BA68C' },  // Sage teal
  { key: 'sprint8',  label: 'Sprint 8',  color: '#4A94B5' },  // Steel blue
  { key: 'sprint9',  label: 'Sprint 9',  color: '#6B8EC4' },  // Periwinkle
  { key: 'sprint10', label: 'Sprint 10', color: '#8D7EC8' },  // Lavender
  { key: 'sprint11', label: 'Sprint 11', color: '#5DA08A' },  // Sea green
  { key: 'sprint12', label: 'Sprint 12', color: '#4A8FAF' },  // Dusty teal
]

// Option C pastel stream defaults
export const DEFAULT_STREAMS = [
  { key: 's1', name: 'Stream 1', description: '', color: '#5B8DEF' },  // Cornflower
  { key: 's2', name: 'Stream 2', description: '', color: '#5BA68C' },  // Sage
  { key: 's3', name: 'Stream 3', description: '', color: '#B06AB3' },  // Mauve
  { key: 's4', name: 'Stream 4', description: '', color: '#D4845A' },  // Terracotta
]

export const MAX_SPRINTS = 12
export const MIN_SPRINTS = 1
export const MAX_STREAMS = 8
export const MIN_STREAMS = 2
export const DEFAULT_CAPACITY = 20
export const MAX_VERSIONS = 100
export const MAX_IMPORT_SIZE_MB = 10

/** Utility: derive sprint key from label like "Sprint 3" → "sprint3" */
export function labelToKey(label: string): string {
  if (!label || label.toLowerCase() === 'backlog') return 'backlog'
  const m = label.match(/(\d+)/)
  return m ? `sprint${m[1]}` : 'backlog'
}

/** Utility: canonical capacity key for a sprint×stream cell */
export function capacityKey(streamKey: string, sprintKey: string): string {
  return `${streamKey}_${sprintKey}`
}
