#!/bin/bash
# Ralph - AI agent loop for autonomous development
# Usage: ./scripts/ralph.sh <prd-file> [--tool amp|claude] [max_iterations]
#
# Example:
#   ./scripts/ralph.sh tasks/phase1/backend.json --tool claude 10

set -e

# Parse arguments
PRD_FILE=""
TOOL="claude"
MAX_ITERATIONS=10

while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    -*)
      echo "Unknown option: $1"
      exit 1
      ;;
    *)
      if [[ -z "$PRD_FILE" ]]; then
        PRD_FILE="$1"
      elif [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

if [[ -z "$PRD_FILE" ]]; then
  echo "Usage: ./scripts/ralph.sh <prd-file> [--tool amp|claude] [max_iterations]"
  echo ""
  echo "Available PRD files:"
  find tasks -name "*.json" 2>/dev/null | sed 's/^/  /'
  exit 1
fi

if [[ ! -f "$PRD_FILE" ]]; then
  echo "Error: PRD file not found: $PRD_FILE"
  exit 1
fi

# Validate tool choice
if [[ "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
  echo "Error: Invalid tool '$TOOL'. Must be 'amp' or 'claude'."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PRD_DIR="$(dirname "$PRD_FILE")"
PROGRESS_FILE="${PRD_DIR}/progress.txt"

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "PRD: $PRD_FILE" >> "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "" >> "$PROGRESS_FILE"
  echo "## Codebase Patterns" >> "$PROGRESS_FILE"
  echo "" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

# Get branch name from PRD
BRANCH_NAME=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
if [[ -n "$BRANCH_NAME" ]]; then
  CURRENT_BRANCH=$(git branch --show-current)
  if [[ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]]; then
    echo "Checking out branch: $BRANCH_NAME"
    git checkout "$BRANCH_NAME" 2>/dev/null || git checkout -b "$BRANCH_NAME"
  fi
fi

echo "Starting Ralph"
echo "  PRD: $PRD_FILE"
echo "  Tool: $TOOL"
echo "  Max iterations: $MAX_ITERATIONS"
echo ""

# Generate the prompt
generate_prompt() {
  cat << 'EOF'
# Ralph Agent Instructions

You are an autonomous coding agent. Complete ONE user story per iteration.

## Your Task

1. Read the PRD file specified in the environment
2. Read progress.txt in the same directory (check Codebase Patterns first)
3. Read the project's CLAUDE.md for conventions
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single story following its acceptance criteria
6. Run quality checks
7. If checks pass, commit with: `feat: [Story ID] - [Story Title]`
8. Update the PRD to set `passes: true` for the completed story
9. Append progress to progress.txt

## Environment

EOF
  echo "PRD_FILE: $PRD_FILE"
  echo "PROGRESS_FILE: $PROGRESS_FILE"
  echo "PROJECT_ROOT: $PROJECT_ROOT"
  cat << 'EOF'

## Quality Checks

Backend:
```bash
cd backend && uv run ruff check . && uv run ruff format --check .
```

Frontend:
```bash
cd frontend && bun run typecheck && bun run lint
```

## Progress Report Format

APPEND to progress.txt:
```
## [Date/Time] - [Story ID]: [Title]
- What was implemented
- Files changed
- Learnings for future iterations
---
```

## Stop Condition

If ALL stories have `passes: true`: output `<promise>COMPLETE</promise>`
Otherwise: end normally (next iteration continues).

## Important

- ONE story per iteration
- Commit after each story
- Keep quality checks passing
- Read existing patterns before starting
EOF
}

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  # Check if all stories are complete
  INCOMPLETE=$(jq '[.userStories[] | select(.passes == false)] | length' "$PRD_FILE")
  if [[ "$INCOMPLETE" == "0" ]]; then
    echo ""
    echo "All stories complete!"
    exit 0
  fi

  # Run the selected tool
  if [[ "$TOOL" == "amp" ]]; then
    OUTPUT=$(generate_prompt | amp --dangerously-allow-all 2>&1 | tee /dev/stderr) || true
  else
    OUTPUT=$(generate_prompt | claude --dangerously-skip-permissions --print 2>&1 | tee /dev/stderr) || true
  fi
  
  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "Ralph completed all tasks!"
    exit 0
  fi
  
  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Reached max iterations ($MAX_ITERATIONS)."
echo "Check progress: $PROGRESS_FILE"
exit 1
