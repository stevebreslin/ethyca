#!/usr/bin/env node
/**
 * Generates db.json with submitted_at dates relative to today, so that
 * "overdue" records remain overdue regardless of when the candidate runs this.
 *
 * Runs automatically on `npm install` (postinstall) and `npm start` (prestart).
 * Can also be run manually: node generate-db.js
 */
const fs = require("fs");
const path = require("path");

function daysAgo(n, hour = 9, minute = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

const data = {
  policies: [
    {
      id: "pol-001",
      name: "Default Access Policy",
      request_type: "access",
      deadline_days: 30,
    },
    {
      id: "pol-002",
      name: "Right to Erasure Policy",
      request_type: "deletion",
      deadline_days: 45,
    },
    {
      id: "pol-003",
      name: "Data Portability Policy",
      request_type: "portability",
      deadline_days: 30,
    },
  ],

  privacy_requests: [
    // ── Within deadline (recent) ──────────────────────────────────────────
    {
      id: "req-001",
      name: "Alice Martin",
      email: "alice.martin@example.com",
      request_type: "access",
      status: "pending",
      submitted_at: daysAgo(26, 9, 15),
      assigned_to: "sarah@company.com",
      policy_id: "pol-001", // deadline 30d → 4 days remaining
    },
    {
      id: "req-003",
      name: "Carmen Silva",
      email: "carmen.silva@example.com",
      request_type: "portability",
      status: "in_progress",
      submitted_at: daysAgo(22, 14, 0),
      assigned_to: "sarah@company.com",
      policy_id: "pol-003", // deadline 30d → 8 days remaining
    },
    {
      id: "req-005",
      name: "Elena Petrov",
      email: "elena.petrov@example.com",
      request_type: "deletion",
      status: "pending",
      submitted_at: daysAgo(9, 16, 55),
      assigned_to: "priya@company.com",
      policy_id: "pol-002", // deadline 45d → 36 days remaining
    },
    {
      id: "req-006",
      name: "Frank Nguyen",
      email: "frank.n@example.com",
      request_type: "access",
      status: "in_progress",
      submitted_at: daysAgo(17, 10, 20),
      assigned_to: "priya@company.com",
      policy_id: "pol-001", // deadline 30d → 13 days remaining
    },
    {
      id: "req-007",
      name: "Grace Unassigned",
      email: "grace.u@example.com",
      request_type: "deletion",
      status: "pending",
      submitted_at: daysAgo(5, 7, 45),
      assigned_to: null,
      policy_id: null, // no policy — missing data edge case
    },
    {
      id: "req-009",
      name: "Jonas Weber",
      email: "j.weber@example.com",
      request_type: "access",
      status: "pending",
      submitted_at: daysAgo(7, 12, 0),
      assigned_to: "sarah@company.com",
      policy_id: "pol-001", // deadline 30d → 23 days remaining
    },
    {
      id: "req-010",
      name: "Jonas Weber",
      email: "j.weber@example.com",
      request_type: "deletion",
      status: "in_progress",
      submitted_at: daysAgo(19, 9, 0),
      assigned_to: "priya@company.com",
      policy_id: "pol-002", // deadline 45d → 26 days remaining
    },
    {
      id: "req-013",
      name: "Maya Patel",
      email: "m.patel@example.com",
      request_type: "portability",
      status: "pending",
      submitted_at: daysAgo(12, 9, 45),
      assigned_to: "priya@company.com",
      policy_id: "pol-003", // deadline 30d → 18 days remaining
    },
    {
      id: "req-023",
      name: "Will Chen",
      email: "w.chen@example.com",
      request_type: "access",
      status: "pending",
      submitted_at: daysAgo(8, 15, 30),
      assigned_to: "sarah@company.com",
      policy_id: "pol-004", // references a missing policy — edge case
    },
    {
      id: "req-024",
      name: "Xiu Huang",
      email: "x.huang@example.com",
      request_type: "portability",
      status: "in_progress",
      submitted_at: daysAgo(15, 11, 0),
      assigned_to: "priya@company.com",
      policy_id: "pol-003", // deadline 30d → 15 days remaining
    },
    {
      id: "req-028",
      name: "Bella Turner",
      email: "b.turner@example.com",
      request_type: "portability",
      status: "pending",
      submitted_at: daysAgo(5, 8, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-003", // deadline 30d → 25 days remaining
    },
    {
      id: "req-031",
      name: "Oscar Flynn",
      email: "o.flynn@example.com",
      request_type: "access",
      status: "pending",
      submitted_at: daysAgo(2, 10, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-001", // deadline 30d → 28 days remaining
    },
    {
      id: "req-033",
      name: "George Watts",
      email: "g.watts@example.com",
      request_type: "deletion",
      status: "in_progress",
      submitted_at: daysAgo(13, 8, 30),
      assigned_to: "priya@company.com",
      policy_id: "pol-002", // deadline 45d → 32 days remaining
    },
    {
      id: "req-036",
      name: "Julia Santos",
      email: "j.santos@example.com",
      request_type: "portability",
      status: "in_progress",
      submitted_at: daysAgo(10, 14, 0),
      assigned_to: "priya@company.com",
      policy_id: "pol-003", // deadline 30d → 20 days remaining
    },
    {
      id: "req-041",
      name: "Oscar Flynn",
      email: "o.flynn@example.com",
      request_type: "deletion",
      status: "pending",
      submitted_at: daysAgo(7, 9, 15),
      assigned_to: "sarah@company.com",
      policy_id: "pol-002", // deadline 45d → 38 days remaining
    },
    {
      id: "req-042",
      name: "Petra Novak",
      email: "p.novak@example.com",
      request_type: "access",
      status: "in_progress",
      submitted_at: daysAgo(16, 14, 30),
      assigned_to: "priya@company.com",
      policy_id: "pol-001", // deadline 30d → 14 days remaining
    },
    {
      id: "req-045",
      name: "George Watts",
      email: "g.watts@example.com",
      request_type: "access",
      status: "pending",
      submitted_at: daysAgo(4, 11, 45),
      assigned_to: "priya@company.com",
      policy_id: "pol-001", // deadline 30d → 26 days remaining
    },
    {
      id: "req-047",
      name: "Vincent Laforge",
      email: "v.laforge@example.com",
      request_type: "portability",
      status: "pending",
      submitted_at: daysAgo(11, 13, 0),
      assigned_to: "sarah@company.com",
      policy_id: "pol-003", // deadline 30d → 19 days remaining
    },
    {
      id: "req-050",
      name: "Yuki Tanabe",
      email: "y.tanabe@example.com",
      request_type: "portability",
      status: "pending",
      submitted_at: daysAgo(3, 8, 45),
      assigned_to: "sarah@company.com",
      policy_id: "pol-003", // deadline 30d → 27 days remaining
    },

    // ── OVERDUE — active requests past their policy deadline ──────────────
    {
      id: "req-016",
      name: "Priya Sharma",
      email: "priya.s@example.com",
      request_type: "access",
      status: "pending",
      submitted_at: daysAgo(66, 13, 0),
      assigned_to: null,
      policy_id: "pol-001", // deadline 30d → 36 days overdue, unassigned
    },
    {
      id: "req-020",
      name: "Tanya Brooks",
      email: "t.brooks@example.com",
      request_type: "portability",
      status: "pending",
      submitted_at: daysAgo(31, 14, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-003", // deadline 30d → 1 day overdue
    },
    {
      id: "req-025",
      name: "Yasmin Malik",
      email: "y.malik@example.com",
      request_type: "deletion",
      status: "pending",
      submitted_at: daysAgo(54, 9, 30),
      assigned_to: "james@company.com",
      policy_id: "pol-002", // deadline 45d → 9 days overdue
    },
    {
      id: "req-029",
      name: "Carlos Rivera",
      email: "c.rivera@example.com",
      request_type: "access",
      status: "in_progress",
      submitted_at: daysAgo(37, 14, 45),
      assigned_to: "sarah@company.com",
      policy_id: "pol-001", // deadline 30d → 7 days overdue
    },
    {
      id: "req-035",
      name: "Ivan Sokolov",
      email: "i.sokolov@example.com",
      request_type: "deletion",
      status: "pending",
      submitted_at: daysAgo(68, 9, 45),
      assigned_to: "sarah@company.com",
      policy_id: "pol-002", // deadline 45d → 23 days overdue
    },
    {
      id: "req-039",
      name: "Marco Rossi",
      email: "m.rossi@example.com",
      request_type: "access",
      status: "pending",
      submitted_at: daysAgo(45, 8, 0),
      assigned_to: "priya@company.com",
      policy_id: "pol-001", // deadline 30d → 15 days overdue
    },
    {
      id: "req-014",
      name: "Nadia Kowalski",
      email: "n.kowalski@example.com",
      request_type: "access",
      status: "in_progress",
      submitted_at: daysAgo(58, 10, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-001", // deadline 30d → 28 days overdue
    },
    {
      id: "req-018",
      name: "Rosa Fernandez",
      email: "r.fernandez@example.com",
      request_type: "deletion",
      status: "in_progress",
      submitted_at: daysAgo(61, 11, 30),
      assigned_to: "priya@company.com",
      policy_id: "pol-002", // deadline 45d → 16 days overdue
    },
    {
      id: "req-046",
      name: "Uma Krishnan",
      email: "u.krishnan@example.com",
      request_type: "deletion",
      status: "in_progress",
      submitted_at: daysAgo(74, 9, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-002", // deadline 45d → 29 days overdue
    },

    // ── Resolved (approved / denied) ─────────────────────────────────────
    {
      id: "req-002",
      name: "Brian Okafor",
      email: "b.okafor@example.com",
      request_type: "deletion",
      status: "approved",
      submitted_at: daysAgo(35, 11, 42),
      assigned_to: "james@company.com",
      policy_id: "pol-002",
    },
    {
      id: "req-004",
      name: "David Kim",
      email: "d.kim@example.com",
      request_type: "access",
      status: "denied",
      submitted_at: daysAgo(40, 8, 30),
      assigned_to: "james@company.com",
      policy_id: "pol-001",
    },
    {
      id: "req-008",
      name: "Henry Walsh",
      email: "h.walsh@example.com",
      request_type: "portability",
      status: "approved",
      submitted_at: daysAgo(27, 13, 10),
      assigned_to: "james@company.com",
      policy_id: "pol-003",
    },
    {
      id: "req-011",
      name: "Keiko Tanaka",
      email: "k.tanaka@example.com",
      request_type: "access",
      status: "approved",
      submitted_at: daysAgo(71, 11, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-001",
    },
    {
      id: "req-012",
      name: "Liam O'Brien",
      email: "l.obrien@example.com",
      request_type: "deletion",
      status: "denied",
      submitted_at: daysAgo(52, 14, 30),
      assigned_to: "sarah@company.com",
      policy_id: "pol-002",
    },
    {
      id: "req-015",
      name: "Omar Hassan",
      email: "o.hassan@example.com",
      request_type: "deletion",
      status: "approved",
      submitted_at: daysAgo(76, 8, 15),
      assigned_to: "sarah@company.com",
      policy_id: "pol-002",
    },
    {
      id: "req-017",
      name: "Quentin Dubois",
      email: "q.dubois@example.com",
      request_type: "portability",
      status: "denied",
      submitted_at: daysAgo(41, 16, 20),
      assigned_to: "james@company.com",
      policy_id: "pol-003",
    },
    {
      id: "req-019",
      name: "Samuel Lee",
      email: "s.lee@example.com",
      request_type: "access",
      status: "approved",
      submitted_at: daysAgo(47, 9, 0),
      assigned_to: "sarah@company.com",
      policy_id: "pol-001",
    },
    {
      id: "req-021",
      name: "Umar Diallo",
      email: "u.diallo@example.com",
      request_type: "access",
      status: "denied",
      submitted_at: daysAgo(43, 10, 45),
      assigned_to: "priya@company.com",
      policy_id: "pol-001",
    },
    {
      id: "req-022",
      name: "Vera Morozova",
      email: "v.morozova@example.com",
      request_type: "deletion",
      status: "approved",
      submitted_at: daysAgo(97, 8, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-002",
    },
    {
      id: "req-026",
      name: "Zoe Campbell",
      email: "z.campbell@example.com",
      request_type: "access",
      status: "approved",
      submitted_at: daysAgo(102, 13, 0),
      assigned_to: "sarah@company.com",
      policy_id: "pol-001",
    },
    {
      id: "req-027",
      name: "Aaron Mitchell",
      email: "a.mitchell@example.com",
      request_type: "deletion",
      status: "denied",
      submitted_at: daysAgo(56, 10, 15),
      assigned_to: "priya@company.com",
      policy_id: "pol-002",
    },
    {
      id: "req-030",
      name: "Diana Frost",
      email: "d.frost@example.com",
      request_type: "deletion",
      status: "approved",
      submitted_at: daysAgo(89, 9, 0),
      assigned_to: "priya@company.com",
      policy_id: "pol-002",
    },
    {
      id: "req-032",
      name: "Fatima Al-Hassan",
      email: "f.alhassan@example.com",
      request_type: "portability",
      status: "denied",
      submitted_at: daysAgo(64, 11, 30),
      assigned_to: "sarah@company.com",
      policy_id: "pol-003",
    },
    {
      id: "req-034",
      name: "Hannah Clarke",
      email: "h.clarke@example.com",
      request_type: "access",
      status: "approved",
      submitted_at: daysAgo(81, 13, 15),
      assigned_to: "james@company.com",
      policy_id: "pol-001",
    },
    {
      id: "req-037",
      name: "Kwame Asante",
      email: "k.asante@example.com",
      request_type: "access",
      status: "approved",
      submitted_at: daysAgo(107, 10, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-001",
    },
    {
      id: "req-038",
      name: "Laura Becker",
      email: "l.becker@example.com",
      request_type: "deletion",
      status: "denied",
      submitted_at: daysAgo(33, 15, 30),
      assigned_to: "sarah@company.com",
      policy_id: "pol-002",
    },
    {
      id: "req-040",
      name: "Nina Hoffman",
      email: "n.hoffman@example.com",
      request_type: "portability",
      status: "approved",
      submitted_at: daysAgo(50, 11, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-003",
    },
    {
      id: "req-043",
      name: "Raj Krishnamurthy",
      email: "r.krishnamurthy@example.com",
      request_type: "portability",
      status: "denied",
      submitted_at: daysAgo(38, 10, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-003",
    },
    {
      id: "req-044",
      name: "Sofia Andreou",
      email: "s.andreou@example.com",
      request_type: "deletion",
      status: "approved",
      submitted_at: daysAgo(112, 8, 30),
      assigned_to: "sarah@company.com",
      policy_id: "pol-002",
    },
    {
      id: "req-048",
      name: "Wendy Chang",
      email: "w.chang@example.com",
      request_type: "access",
      status: "approved",
      submitted_at: daysAgo(56, 10, 30),
      assigned_to: "priya@company.com",
      policy_id: "pol-001",
    },
    {
      id: "req-049",
      name: "Xander Novak",
      email: "x.novak@example.com",
      request_type: "deletion",
      status: "denied",
      submitted_at: daysAgo(25, 14, 0),
      assigned_to: "james@company.com",
      policy_id: "pol-002",
    },
  ],
};

fs.writeFileSync(
  path.join(__dirname, "db.json"),
  JSON.stringify(data, null, 2)
);
console.log("db.json regenerated with dates relative to", new Date().toDateString());
