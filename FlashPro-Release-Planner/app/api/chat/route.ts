export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { broadcast } from '../../../lib/broadcast'

const STATE_FILE = path.join(process.cwd(), 'planner-state.json')

function readState() {
  if (!fs.existsSync(STATE_FILE)) return null
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch { return null }
}
function writeState(state: any) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

export async function POST(req: NextRequest) {
  const { message, stories } = await req.json()
  const cmd = message.toLowerCase()
  let state = readState() || { stories: stories || [], sprints: {} }
  if (!state.stories) state.stories = stories || []

  const response: string[] = []
  let changed = false

  // Parse natural language commands — order matters: specific patterns checked first
  let matched = false

  // BUG-12 fix: "move all [persona] stories to sprint Y [stream Z]" — check BEFORE action match
  // BUG-05 fix: also parse optional stream parameter
  const movePersonaMatch = cmd.match(/move\s+(?:all\s+)?(operator|seller)\s+stories\s+to\s+sprint\s+(\d+)(?:\s+(?:\/\s*)?stream\s+(\d+))?/i)
  if (movePersonaMatch) {
    const persona = movePersonaMatch[1].charAt(0).toUpperCase() + movePersonaMatch[1].slice(1)
    const sprintNum = `sprint${movePersonaMatch[2]}`
    const streamNum = movePersonaMatch[3] ? `s${movePersonaMatch[3]}` : null
    let count = 0
    state.stories = state.stories.map((s: any) => {
      if (s.persona === persona) {
        count++
        return { ...s, sprint: sprintNum, ...(streamNum ? { stream: streamNum } : {}) }
      }
      return s
    })
    const streamSuffix = streamNum ? ` Stream ${movePersonaMatch[3]}` : ''
    response.push(`Moved ${count} ${persona} stories to Sprint ${movePersonaMatch[2]}${streamSuffix}`)
    changed = true; matched = true
  }

  // "move story X to sprint Y [/ stream Z]" — BUG-05 fix: parse optional stream
  const moveStoryMatch = cmd.match(/move\s+(?:story\s+)?([a-z]\d+[a-z]?)\s+to\s+sprint\s+(\d+)(?:\s+(?:\/\s*)?stream\s+(\d+))?/i)
  if (moveStoryMatch && !matched) {
    const storyId = moveStoryMatch[1].toUpperCase()
    const sprintNum = `sprint${moveStoryMatch[2]}`
    const streamNum = moveStoryMatch[3] ? `s${moveStoryMatch[3]}` : null
    let found = false
    state.stories = state.stories.map((s: any) => {
      if (s.id.toLowerCase() === storyId.toLowerCase()) {
        found = true
        return { ...s, sprint: sprintNum, ...(streamNum ? { stream: streamNum } : {}) }
      }
      return s
    })
    const streamSuffix = streamNum ? ` / Stream ${moveStoryMatch[3]}` : ''
    response.push(found ? `Moved ${storyId} to Sprint ${moveStoryMatch[2]}${streamSuffix}` : `Story ${storyId} not found`)
    changed = true; matched = true
  }

  // BUG-06 fix: "move phase X stories to sprint Y" — dynamically match by goal/action containing "phase X"
  const movePhaseMatch = cmd.match(/move\s+(?:all\s+)?phase\s+(\d+)\s+(?:stories\s+)?to\s+sprint\s+(\d+)/i)
  if (movePhaseMatch && !matched) {
    const phaseNum = movePhaseMatch[1]
    const sprintNum = `sprint${movePhaseMatch[2]}`
    const phaseKeyword = `phase ${phaseNum}`
    let count = 0
    state.stories = state.stories.map((s: any) => {
      const inPhase = [s.goal, s.action, s.headline, s.capability, s.workflow].some(
        (f: string) => f && f.toLowerCase().includes(phaseKeyword)
      )
      if (inPhase) { count++; return { ...s, sprint: sprintNum } }
      return s
    })
    response.push(`Moved ${count} Phase ${phaseNum} stories to Sprint ${movePhaseMatch[2]}`)
    changed = true; matched = true
  }

  // "move action [action name] to sprint Y [/ stream Z]"
  const moveActionMatch = cmd.match(/move\s+action\s+["']?([a-z\s&\-]+?)["']?\s+to\s+sprint\s+(\d+)(?:\s+(?:\/\s*)?stream\s+(\d+))?/i)
  if (moveActionMatch && !matched) {
    const actionName = moveActionMatch[1].trim().toLowerCase()
    const sprintNum = `sprint${moveActionMatch[2]}`
    const streamNum = moveActionMatch[3] ? `s${moveActionMatch[3]}` : null
    let count = 0
    state.stories = state.stories.map((s: any) => {
      if (s.action && s.action.toLowerCase().includes(actionName)) {
        count++
        return { ...s, sprint: sprintNum, ...(streamNum ? { stream: streamNum } : {}) }
      }
      return s
    })
    const streamSuffix = streamNum ? ` / Stream ${moveActionMatch[3]}` : ''
    response.push(`Moved ${count} stories matching action "${moveActionMatch[1]}" to Sprint ${moveActionMatch[2]}${streamSuffix}`)
    changed = true; matched = true
  }

  // "move goal [goal name] to sprint Y"
  const moveGoalMatch = cmd.match(/move\s+goal\s+["']?([a-z\s&\-]+?)["']?\s+to\s+sprint\s+(\d+)/i)
  if (moveGoalMatch && !matched) {
    const goalName = moveGoalMatch[1].trim().toLowerCase()
    const sprintNum = `sprint${moveGoalMatch[2]}`
    let count = 0
    state.stories = state.stories.map((s: any) => {
      if (s.goal.toLowerCase().includes(goalName)) { count++; return { ...s, sprint: sprintNum } }
      return s
    })
    response.push(`Moved ${count} stories from goal matching "${moveGoalMatch[1]}" to Sprint ${moveGoalMatch[2]}`)
    changed = true; matched = true
  }

  // "clear sprint Y" or "move sprint Y to backlog"
  const clearSprintMatch = cmd.match(/(?:clear\s+sprint\s+(\d+)|move\s+sprint\s+(\d+)\s+to\s+backlog)/)
  if (clearSprintMatch) {
    const sprintNum = clearSprintMatch[1] || clearSprintMatch[2]
    let count = 0
    state.stories = state.stories.map((s: any) => {
      if (s.sprint === `sprint${sprintNum}`) { count++; return { ...s, sprint: 'backlog' } }
      return s
    })
    response.push(`Moved ${count} stories from Sprint ${sprintNum} back to backlog`)
    changed = true
  }

  // "how many stories in sprint Y"
  const countMatch = cmd.match(/how many\s+(?:stories\s+)?in\s+sprint\s+(\d+)/)
  if (countMatch) {
    const sprintNum = `sprint${countMatch[1]}`
    const count = state.stories.filter((s: any) => s.sprint === sprintNum).length
    response.push(`Sprint ${countMatch[1]} has ${count} stories`)
  }

  // "show summary"
  if (cmd.includes('summary') || cmd.includes('how many') && !countMatch) {
    const sprintCounts: Record<string, number> = {}
    state.stories.forEach((s: any) => {
      sprintCounts[s.sprint] = (sprintCounts[s.sprint] || 0) + 1
    })
    const lines = Object.entries(sprintCounts).sort().map(([k, v]) => `${k}: ${v} stories`)
    response.push('Current plan:\n' + lines.join('\n'))
  }

  if (response.length === 0) {
    response.push("I can help you with:\n• \"Move Phase 0 stories to Sprint 1\"\n• \"Move story S01 to Sprint 2\"\n• \"Move all Operator stories to Sprint 1\"\n• \"Move goal Register & Setup Shop to Sprint 2\"\n• \"Move action Register to Sprint 1\"\n• \"Clear Sprint 3\"\n• \"Show summary\"")
  }

  if (changed) {
    // F23.04 fix: wrap state persistence in try/catch — failures are logged, not surfaced to user
    try {
      writeState(state)
      broadcast(state)
    } catch (e) {
      console.error('[chat] Failed to persist state after NLC command:', e)
    }
  }

  return NextResponse.json({ reply: response.join('\n'), state: changed ? state : null })
}
