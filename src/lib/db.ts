// Firebase integration removed for privacy and COPPA compliance.
//
// ETHICAL RATIONALE
// ─────────────────
// The previous version used Firebase Realtime Database to submit every practice
// session to a shared database that was streamed live to all site visitors.
// This was removed for the following reasons:
//
//  1. COPPA (Children's Online Privacy Protection Act, USA)
//     Music education tools are frequently used by children under 13. Collecting
//     and publicly displaying their self-reported mood scores, anxiety ratings,
//     and frustration data without verifiable parental consent violates COPPA.
//     Operators of websites directed at children face significant legal liability
//     for collecting personal information without a compliant consent mechanism.
//
//  2. Research ethics
//     In any legitimate research study, participants must provide informed consent
//     before their data is collected or shared, even anonymously. A checkbox
//     toggle on a website does not constitute adequate informed consent, especially
//     for minors. IRB/ethics board approval would be required before sharing
//     real participant data publicly.
//
//  3. Sensitive self-report data
//     Mood (1–7), anxiety (1–5), frustration, and flow state are personal,
//     health-adjacent measurements. Displaying them publicly, even without
//     names, is inappropriate for a general-audience tool used by young people.
//
// CURRENT BEHAVIOUR
// ─────────────────
// All session data is stored only in the user's own browser (localStorage via
// Zustand persist). Nothing is ever sent to any external server or database.
// Users can export their own data as CSV or JSON at any time from the Dashboard.

import type { PracticeSession } from '../types';

/** No-op: retained for interface compatibility. Session data stays in localStorage. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function submitSession(_session: PracticeSession): void {}
