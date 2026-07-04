// src/lib/repositories/caseRepository.ts
// Port definition for CivicProof Case Repository

import { CivicIssue, CorroborationRecord, TimelineEvent } from "../civic/types";

export interface CaseRepository {
  /**
   * Retrieves a list of all active or closed civic issues.
   */
  listCases(): Promise<CivicIssue[]>;

  /**
   * Retrieves a specific civic case file by its unique ID.
   */
  getCaseById(id: string): Promise<CivicIssue | null>;

  /**
   * Creates and registers a brand new civic issue.
   */
  createCase(issue: CivicIssue): Promise<CivicIssue>;

  /**
   * Performs partial updates on an existing civic case.
   */
  updateCase(id: string, patch: Partial<CivicIssue>): Promise<CivicIssue>;

  /**
   * Appends a community signature/corroboration to a specific case.
   */
  addCorroboration(caseId: string, corroboration: CorroborationRecord): Promise<CivicIssue>;

  /**
   * Appends an event to the immutable timeline registry of a specific case.
   */
  appendTimelineEvent(caseId: string, event: TimelineEvent): Promise<CivicIssue>;
}
