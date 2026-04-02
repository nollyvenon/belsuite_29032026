import { Injectable } from '@nestjs/common';
import { InboundCallStatus } from '@prisma/client';
import { AIService } from '../ai/ai.service';
import { AIModel } from '../ai/types/ai.types';
import { PrismaService } from '../database/prisma.service';
import { CallQueryDto, LogInboundCallDto, UpdateCallDto } from './dto/call-center.dto';

@Injectable()
export class CallCenterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  async logCall(organizationId: string, dto: LogInboundCallDto) {
    return this.prisma.inboundCall.create({
      data: {
        organizationId,
        fromNumber: dto.fromNumber,
        toNumber: dto.toNumber,
        callerName: dto.callerName,
        status: dto.status ?? InboundCallStatus.RINGING,
        agentId: dto.agentId,
        queueName: dto.queueName,
        externalCallId: dto.externalCallId,
      },
    });
  }

  async updateCall(organizationId: string, callId: string, dto: UpdateCallDto) {
    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) data['status'] = dto.status;
    if (dto.durationSeconds !== undefined) data['durationSeconds'] = dto.durationSeconds;
    if (dto.agentId !== undefined) data['agentId'] = dto.agentId;
    if (dto.recordingUrl !== undefined) data['recordingUrl'] = dto.recordingUrl;
    if (dto.transcription !== undefined) data['transcription'] = dto.transcription;
    if (dto.notes !== undefined) data['notes'] = dto.notes;
    if (dto.status === 'ANSWERED') data['answeredAt'] = new Date();
    if (dto.status === 'COMPLETED' || dto.status === 'MISSED' || dto.status === 'VOICEMAIL') {
      data['endedAt'] = new Date();
    }

    return this.prisma.inboundCall.update({ where: { id: callId }, data });
  }

  async listCalls(organizationId: string, query: CallQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };
    if (query.status) where['status'] = query.status;
    if (query.agentId) where['agentId'] = query.agentId;

    const [total, calls] = await Promise.all([
      this.prisma.inboundCall.count({ where }),
      this.prisma.inboundCall.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { items: calls, total, page, limit };
  }

  async transcribeAndSummarize(organizationId: string, userId: string, callId: string) {
    const call = await this.prisma.inboundCall.findFirst({ where: { id: callId, organizationId } });
    if (!call?.transcription) return { error: 'No transcription available' };

    const prompt = `Summarize this call transcript in 2-3 sentences and identify: sentiment (positive/neutral/negative), key topics, and recommended follow-up action.

Transcript: ${call.transcription}

Return JSON: { summary: string, sentiment: "positive"|"neutral"|"negative", topics: string[], followUpAction: string }`;

    let result = {
      summary: 'Call transcription processed.',
      sentiment: 'neutral',
      topics: [] as string[],
      followUpAction: 'Review call recording.',
    };

    try {
      const res = await this.aiService.generateText(
        { prompt, model: AIModel.GPT_4_TURBO, temperature: 0.2, maxTokens: 400 },
        organizationId,
        userId,
        { type: 'best_quality' },
        true,
      );
      const parsed = this.safeJson(res.text);
      result = { ...result, ...parsed };
    } catch { /* use defaults */ }

    await this.prisma.inboundCall.update({
      where: { id: callId },
      data: { aiSummary: result.summary, sentiment: result.sentiment },
    });

    return { callId, ...result };
  }

  async getStats(organizationId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 29);

    const calls = await this.prisma.inboundCall.findMany({
      where: { organizationId, createdAt: { gte: since } },
    });

    const total = calls.length;
    const answered = calls.filter((c) => ['ANSWERED', 'COMPLETED', 'TRANSFERRED'].includes(c.status)).length;
    const missed = calls.filter((c) => c.status === 'MISSED').length;
    const voicemail = calls.filter((c) => c.status === 'VOICEMAIL').length;
    const avgDuration = answered > 0
      ? calls.filter((c) => c.durationSeconds > 0).reduce((s, c) => s + c.durationSeconds, 0) / Math.max(1, answered)
      : 0;

    const byAgent = new Map<string, { count: number; answered: number; totalDuration: number }>();
    for (const call of calls) {
      if (!call.agentId) continue;
      const current = byAgent.get(call.agentId) || { count: 0, answered: 0, totalDuration: 0 };
      current.count++;
      if (['ANSWERED', 'COMPLETED'].includes(call.status)) current.answered++;
      current.totalDuration += call.durationSeconds;
      byAgent.set(call.agentId, current);
    }

    return {
      periodDays: 30,
      totalCalls: total,
      answeredCalls: answered,
      missedCalls: missed,
      voicemailCalls: voicemail,
      answerRate: total > 0 ? Math.round((answered / total) * 100) : 0,
      avgDurationSeconds: Math.round(avgDuration),
      agentStats: Array.from(byAgent.entries()).map(([agentId, s]) => ({ agentId, ...s })),
    };
  }

  async getLiveQueue(organizationId: string) {
    const ringing = await this.prisma.inboundCall.findMany({
      where: { organizationId, status: InboundCallStatus.RINGING },
      orderBy: { createdAt: 'asc' },
    });

    return {
      queueSize: ringing.length,
      calls: ringing,
      longestWaitSeconds: ringing.length > 0
        ? Math.floor((Date.now() - new Date(ringing[0].createdAt).getTime()) / 1000)
        : 0,
    };
  }

  private safeJson(raw: string): Record<string, any> {
    try { return JSON.parse(raw); }
    catch {
      try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
      catch { return {}; }
    }
  }
}
