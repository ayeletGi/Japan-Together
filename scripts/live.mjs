// Reads and changes the live trip changes (the D1 database behind the Worker).
//
//   npm run live -- show [kind] [key]          what is live now
//   npm run live -- set <kind> <key> '<json>'  replace one entry (--why "…" to say why)
//   npm run live -- patch <kind> <key> '<json>' merge fields into one entry (on the server)
//   npm run live -- delete <kind> <key>        back to the original plan for that entry
//   npm run live -- undo [kind [key]]          revert the latest change (of that kind / entry)
//   npm run live -- history [n]                the latest changes and who made them
//   npm run live -- pull                       copy what is live into src/data/live-seed.json
//   npm run live -- seed-sql > seed.sql        SQL that loads live-seed.json into a fresh database,
//                                              run after all migrations (0002 itself never changes)
//
// kind: events | added | days | expenses | photoFolders | lists | listItems | payments. The code comes from
// LIVE_PIN or the git-ignored file .live-pin; LIVE_URL overrides the site (e.g. http://127.0.0.1:8787).
import fs from 'node:fs';
import config from '../shared/live-kinds.json' with { type: 'json' };

const TABLES = config.tables;
const KINDS = Object.keys(TABLES);
const SEED = 'src/data/live-seed.json';
const BASE = (process.env.LIVE_URL ?? 'https://japan-together-demo.example.workers.dev').replace(
  /\/$/,
  '',
);
const USAGE_LINES = 15;

process.setUncaughtExceptionCaptureCallback((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

const args = process.argv.slice(2);
const whyAt = args.indexOf('--why');
if (whyAt >= 0 && args[whyAt + 1] === undefined) throw new Error('--why needs a reason after it');
const why = whyAt >= 0 ? args.splice(whyAt, 2)[1] : undefined;
const [command, ...rest] = args;

function pin() {
  const value =
    process.env.LIVE_PIN ??
    (fs.existsSync('.live-pin') ? fs.readFileSync('.live-pin', 'utf8') : '');
  if (!value.trim()) throw new Error('No code: set LIVE_PIN or create .live-pin');
  return value.trim();
}

async function call(path, init = {}) {
  const response = await fetch(BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.auth ? { Authorization: `Bearer ${pin()}` } : {}),
    },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${response.status}: ${text.slice(0, 200)}`);
  }
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body;
}

const changes = () => call('/api/changes');

function kindArg(kind) {
  if (!KINDS.includes(kind)) throw new Error(`kind must be one of ${KINDS.join(', ')}`);
  return kind;
}

const save = (kind, key, data, merge = false) =>
  call('/api/change', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ kind, key, data, merge, why }),
  });

const sql = (text) => (text === null ? 'NULL' : `'${String(text).replaceAll("'", "''")}'`);

switch (command) {
  case 'show': {
    const all = await changes();
    const [kind, key] = rest;
    console.log(
      JSON.stringify(key ? all[kindArg(kind)][key] : kind ? all[kindArg(kind)] : all, null, 2),
    );
    break;
  }
  case 'set':
  case 'patch': {
    const [kind, key, value] = rest;
    if (!key || value === undefined) throw new Error(`usage: ${command} <kind> <key> '<json>'`);
    let data;
    try {
      data = JSON.parse(value);
    } catch {
      throw new Error(`not JSON: ${value}`);
    }
    // patch: the server merges only these fields into the entry, so nothing else is overwritten.
    console.log(await save(kindArg(kind), key, data, command === 'patch'));
    break;
  }
  case 'delete': {
    const [kind, key] = rest;
    console.log(await save(kindArg(kind), key, null));
    break;
  }
  case 'undo': {
    const [kind, key] = rest;
    const scope = kind ? { kind: kindArg(kind), ...(key ? { key } : {}) } : {};
    console.log(
      await call('/api/undo', { method: 'POST', auth: true, body: JSON.stringify(scope) }),
    );
    break;
  }
  case 'history':
    for (const row of await call(`/api/history?limit=${rest[0] ?? 20}`, { auth: true })) {
      console.log(
        `#${row.id} ${row.at} ${row.who} ${row.kind}/${row.key}${row.undone ? ' (undone)' : ''}${row.why ? ` — ${row.why}` : ''}`,
      );
    }
    break;
  case 'pull': {
    const all = await changes();
    fs.writeFileSync(SEED, JSON.stringify(all, null, 2) + '\n');
    console.log(`${SEED} now matches version ${all.version}.`);
    break;
  }
  case 'seed-sql': {
    const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
    const at = new Date().toISOString();
    const lines = [`-- Generated from ${SEED} by npm run live -- seed-sql.`];
    for (const kind of KINDS) {
      for (const [key, data] of Object.entries(seed[kind] ?? {})) {
        lines.push(
          `INSERT OR REPLACE INTO ${TABLES[kind]} (key, data, updated_at, updated_by) VALUES (${sql(key)}, ${sql(JSON.stringify(data))}, ${sql(at)}, 'seed');`,
        );
      }
    }
    lines.push("UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'version';");
    console.log(lines.join('\n'));
    break;
  }
  default:
    console.log(
      fs
        .readFileSync(new URL(import.meta.url), 'utf8')
        .split('\n')
        .slice(0, USAGE_LINES)
        .join('\n'),
    );
    process.exitCode = command ? 1 : 0;
}
