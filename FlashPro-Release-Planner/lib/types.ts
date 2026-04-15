// Shared domain types for FlashPro Release Planner

export interface Story {
  id: string
  headline: string
  persona: string
  goal: string
  action: string
  capability: string
  size: string
  pts: number
  sprint: string
  stream: string
  order?: number
  originalStoryId?: string
  isSplitChild?: boolean
  status?: string
  workflow?: string
  [key: string]: unknown  // dynamic fields from import
}

export interface Stream {
  key: string
  name: string
  description: string
  color: string
}

export interface Card {
  key: string
  label: string
  sub: string
  persona: string
  goal: string
  action: string
  ids: string[]
  pts: number
  count: number
  totalParts: number
  partLabel: string
}

export interface DepWarning {
  broken: string[]
  warnings: string[]
  storyId: string
  targetSprint: string
  targetStream: string
  originalSprint?: string
  originalStream?: string
  isAction?: boolean
  actionName?: string
  isGoal?: boolean
  goalName?: string
}

export interface VersionMeta {
  id: string
  name: string
  starred: boolean
  trigger: string
  savedAt: string
  storyCount: number
  plannedCount: number
  projectName: string
}

export interface MergeConflict {
  id: string
  issues: string[]
  existingHeadline: string
  incomingHeadline: string
  existingSprint: string
}

export interface ImportFeedback {
  type: 'success' | 'error' | 'warning'
  message: string
}

export interface RPConfirmData {
  file: File
  projectName: string
  storyCount: number
  streamCount: number
  savedAt: string
}

export type ViewMode = 'story' | 'action' | 'goal' | 'deps' | string
