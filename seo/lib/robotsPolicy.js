function parseRobots(text) {
  const groups = [];
  let current = null;
  for (const rawLine of (text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(':');
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'user-agent') {
      if (!current || current.rules.length > 0) {
        current = { userAgents: [value], rules: [] };
        groups.push(current);
      } else {
        current.userAgents.push(value);
      }
    } else if (key === 'disallow' || key === 'allow') {
      if (!current) continue;
      // `Disallow:` with an empty value conventionally means "allow everything" — a no-op, not a match-all rule.
      if (key === 'disallow' && value === '') continue;
      current.rules.push({ type: key, path: value });
    } else if (key === 'crawl-delay') {
      if (current) current.crawlDelay = Number(value);
    }
  }
  return { groups };
}

function groupForAgent(parsed, userAgent) {
  const ua = userAgent.toLowerCase();
  const exact = parsed.groups.find((g) => g.userAgents.some((a) => a.toLowerCase() === ua));
  if (exact) return exact;
  return parsed.groups.find((g) => g.userAgents.includes('*')) || null;
}

// Longest matching path wins (standard robots.txt precedence). No matching
// group or rule means allowed — callers that couldn't fetch/parse robots.txt
// at all should fail closed themselves rather than call this with nothing.
function isAllowed(parsed, userAgent, path) {
  const group = groupForAgent(parsed, userAgent);
  if (!group) return true;
  let matched = null;
  for (const rule of group.rules) {
    if (path.startsWith(rule.path) && (!matched || rule.path.length > matched.path.length)) {
      matched = rule;
    }
  }
  return !matched || matched.type === 'allow';
}

function crawlDelayFor(parsed, userAgent) {
  const group = groupForAgent(parsed, userAgent);
  return group && typeof group.crawlDelay === 'number' && !Number.isNaN(group.crawlDelay) ? group.crawlDelay : null;
}

module.exports = { parseRobots, isAllowed, crawlDelayFor, groupForAgent };
