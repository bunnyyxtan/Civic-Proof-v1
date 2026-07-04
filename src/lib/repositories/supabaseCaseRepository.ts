// src/lib/repositories/supabaseCaseRepository.ts
// Server-side Supabase implementation of CaseRepository using JSONB issue blobs

import { CaseRepository } from "./caseRepository";
import { CivicIssue, CorroborationRecord, TimelineEvent } from "../civic/types";
import { calculateHarmScore } from "../civic/scoring";
import { getSupabaseAdmin } from "../supabase/supabaseClient";

const TABLE_NAME = "civicproof_cases";

interface SupabaseCaseRow {
  id: string;
  data: CivicIssue;
  reported_at: string;
  updated_at: string;
}

function getReportedTimestamp(issue: CivicIssue): string {
  return issue.reportedAt || issue.createdAt || new Date().toISOString();
}

export class SupabaseCaseRepository implements CaseRepository {
  private getClient() {
    const client = getSupabaseAdmin();
    if (!client) {
      throw new Error("Supabase not configured");
    }
    return client;
  }

  private async upsertIssue(issue: CivicIssue): Promise<void> {
    const row: SupabaseCaseRow = {
      id: issue.id,
      data: issue,
      reported_at: getReportedTimestamp(issue),
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.getClient()
      .from(TABLE_NAME)
      .upsert(row);

    if (error) {
      throw new Error(error.message);
    }
  }

  async listCases(): Promise<CivicIssue[]> {
    const { data, error } = await this.getClient()
      .from(TABLE_NAME)
      .select("data")
      .order("reported_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row) => row.data as CivicIssue);
  }

  async getCaseById(id: string): Promise<CivicIssue | null> {
    const { data, error } = await this.getClient()
      .from(TABLE_NAME)
      .select("data")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.data as CivicIssue ?? null;
  }

  async createCase(issue: CivicIssue): Promise<CivicIssue> {
    await this.upsertIssue(issue);
    return issue;
  }

  async updateCase(id: string, patch: Partial<CivicIssue>): Promise<CivicIssue> {
    const existing = await this.getCaseById(id);
    if (!existing) {
      throw new Error(`Case with ID ${id} not found in Supabase repository.`);
    }

    const merged: CivicIssue = {
      ...existing,
      ...patch,
    };

    await this.upsertIssue(merged);
    return merged;
  }

  async addCorroboration(caseId: string, corroboration: CorroborationRecord): Promise<CivicIssue> {
    const issue = await this.getCaseById(caseId);
    if (!issue) {
      throw new Error(`Case with ID ${caseId} not found in Supabase repository.`);
    }

    const corroborations = issue.corroborations ? [...issue.corroborations] : [];
    const alreadyExists = corroborations.some(c => c.contributorName === corroboration.contributorName);
    if (!alreadyExists) {
      corroborations.push(corroboration);
    }

    const scoreResult = calculateHarmScore({
      category: issue.category,
      severity: issue.severity,
      riskFactors: issue.riskFactors,
      citizenNote: issue.evidence.description,
      corroborationCount: corroborations.length,
      daysSilent: 0,
      isOverdue: issue.status === "overdue",
    });

    const updated: CivicIssue = {
      ...issue,
      corroborations,
      harmScore: scoreResult.score,
    };

    await this.upsertIssue(updated);
    return updated;
  }

  async appendTimelineEvent(caseId: string, event: TimelineEvent): Promise<CivicIssue> {
    const issue = await this.getCaseById(caseId);
    if (!issue) {
      throw new Error(`Case with ID ${caseId} not found in Supabase repository.`);
    }

    const timeline = issue.timeline ? [...issue.timeline, event] : [event];
    const updated: CivicIssue = {
      ...issue,
      timeline,
    };

    await this.upsertIssue(updated);
    return updated;
  }
}
