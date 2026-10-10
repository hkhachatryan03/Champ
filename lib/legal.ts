// ---------------------------------------------------------------------------
// Everything the Terms of Service and Privacy Policy say about *who you are*
// and *what you charge* lives here, so the legal pages never have to be edited
// just to change a name, an address, or a number.
//
// HOW TO FILL THIS IN
//  - Anything left as "" is simply left out of the pages (nothing breaks and no
//    "[placeholder]" ever shows to visitors).
//  - When you change the TEXT of either legal page in a way that matters to
//    users, change `version` and `effectiveDate` below. The version is saved
//    next to every new account, so you can always prove which text a person
//    accepted.
// ---------------------------------------------------------------------------

export const LEGAL = {
  /** The legal name of whoever runs Champ, exactly as registered (e.g. "Champ LLC"). */
  operatorName: "Champ",
  /** Company registration / tax number. Optional. */
  registrationNumber: "",
  /** Registered address. Optional. */
  address: "",
  /** Address for privacy requests. Optional — if empty, the Contact form is used. */
  privacyEmail: "",

  /** Changes whenever the legal text materially changes. Stored with each new account. */
  version: "2026-10-10",
  /** Shown at the top of both pages. */
  effectiveDate: "10 October 2026",

  /** The commercial terms described in the Terms of Service. */
  fee: {
    /** Success fee, as a percentage of the hired person's first monthly salary. */
    percent: 20,
    /** Months after a company account is created in which using Champ is free. */
    freeMonths: 3,
    /** A person first met on Champ and hired within this many months counts as "hired through Champ". */
    attributionMonths: 12,
    /** Days a company has to pay an invoice. */
    paymentDays: 14,
  },
} as const;
