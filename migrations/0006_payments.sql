-- Settle-ups between us ("נועה העבירה לדנה ₪200 בביט"), see src/data/budget.ts. By payment id.
CREATE TABLE payments (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
