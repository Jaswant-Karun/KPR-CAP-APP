export const nominalRollStudents = [
  {
    ticket: "57062",
    status: "approved",
    rollNo: "24CB023",
    name: "JASWANT KARUN S A",
    regNo: "2403711324421012",
    acy: "2025-26",
    batch: "II (2024-28)",
    percent: 13,
    hallTicketStatus: "pending",
    gender: "M",
    semester: 4,
  },
  {
    ticket: "57063",
    status: "approved",
    rollNo: "24CB024",
    name: "PRIYA M",
    regNo: "2403711324421013",
    acy: "2025-26",
    batch: "II (2024-28)",
    percent: 11,
    hallTicketStatus: "ready",
    gender: "F",
    semester: 4,
  },
  {
    ticket: "57064",
    status: "approved",
    rollNo: "24CB025",
    name: "ARUN K",
    regNo: "2403711324421014",
    acy: "2025-26",
    batch: "II (2024-28)",
    percent: 9,
    hallTicketStatus: "pending",
    gender: "M",
    semester: 4,
  },
];

export const nominalRollCoursesByTicket = {
  "57062": [
    { ticket: "538262", status: "ok", code: "U21AD401", name: "Machine Learning Essentials", credits: 3, sem: 4, type: "T", appear: "R", result: "ok", sa: "ok" },
    { ticket: "538263", status: "ok", code: "U21AD405", name: "Machine Learning Laboratory", credits: 2, sem: 4, type: "LwP", appear: "R", result: "ok", sa: "ok" },
    { ticket: "538264", status: "ok", code: "U21CB401", name: "Business Strategy", credits: 3, sem: 4, type: "T", appear: "R", result: "ok", sa: "ok" },
    { ticket: "538265", status: "ok", code: "U21CB402", name: "Design Studio II", credits: 1, sem: 4, type: "Design / Proto Studio", appear: "R", result: "ok", sa: "ok" },
    { ticket: "538266", status: "ok", code: "U21CS401", name: "Design and Analysis of Algorithms", credits: 3, sem: 4, type: "T", appear: "R", result: "ok", sa: "ok" },
    { ticket: "538267", status: "ok", code: "U21CS403", name: "Operating Systems", credits: 3, sem: 4, type: "T", appear: "R", result: "ok", sa: "ok" },
    { ticket: "538268", status: "ok", code: "U21CS404", name: "Operating Systems Laboratory", credits: 1, sem: 4, type: "L", appear: "R", result: "ok", sa: "ok" },
    { ticket: "538273", status: "blocked", code: "U21CYX01", name: "Air Pollution and Control", credits: 3, sem: 4, type: "T", appear: "R", result: "ok", sa: "ok" },
    { ticket: "538274", status: "ok", code: "U21MA409", name: "Statistical Methods", credits: 4, sem: 4, type: "TwL", appear: "R", result: "ok", sa: "ok" },
    { ticket: "538275", status: "ok", code: "U21ECX01", name: "Consumer Electronics", credits: 3, sem: 4, type: "T", appear: "R", result: "ok", sa: "ok" },
    { ticket: "538276", status: "ok", code: "U21MCB14", name: "Managerial Skills and Interpersonal Dynamics", credits: 3, sem: 4, type: "MOOC", appear: "R", result: "blocked", sa: "ok" },
    { ticket: "538269", status: "ok", code: "U21MYC04", name: "Indian Constitution", credits: 0, sem: 4, type: "MNC", appear: "R", result: "ok", sa: "ok" },
  ],
};

export const internalMarkRowsByTicket = {
  "57062": [
    { ticket: "538271", code: "U21SSG01", name: "Soft Skills - I", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538269", code: "U21MYC04", name: "Indian Constitution", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538268", code: "U21CS404", name: "Operating Systems Laboratory", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538265", code: "U21CB402", name: "Design Studio II", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538263", code: "U21AD405", name: "Machine Learning Laboratory", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538270", code: "U21OCB04", name: "AWS Cloud Driven Devops", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538276", code: "U21MCB14", name: "Managerial Skills and Interpersonal Dynamics", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538262", code: "U21AD401", name: "Machine Learning Essentials", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538264", code: "U21CB401", name: "Business Strategy", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538266", code: "U21CS401", name: "Design and Analysis of Algorithms", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538267", code: "U21CS403", name: "Operating Systems", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538274", code: "U21MA409", name: "Statistical Methods", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
    { ticket: "538275", code: "U21ECX01", name: "Consumer Electronics", sem: 4, fee: 0, internal: "SA", examDate: "SA" },
  ],
};

export const nominalRollHistoryByTicket = {
  "57062": [
    { action: "Nominal roll generated", by: "COE Admin", at: "2026-03-21 10:04" },
    { action: "Course list updated", by: "Faculty Advisor", at: "2026-03-22 15:31" },
    { action: "Internal marks published", by: "Exam Cell", at: "2026-03-24 09:12" },
  ],
};
