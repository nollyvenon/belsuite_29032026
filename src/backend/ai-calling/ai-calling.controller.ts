import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import {
  AICallingListQueryDto,
  BookAppointmentDto,
  ConversationTurnDto,
  CreateVoiceAgentDto,
  StartAICallDto,
  TwilioVoiceWebhookDto,
} from './dto/ai-calling.dto';
import { AICallingService } from './ai-calling.service';

@Controller('api/ai-calling')
@UseGuards(JwtAuthGuard)
export class AICallingController {
  constructor(private readonly aiCallingService: AICallingService) {}

  @Post('agents')
  @HttpCode(HttpStatus.CREATED)
  createVoiceAgent(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateVoiceAgentDto,
  ): Promise<any> {
    return this.aiCallingService.createVoiceAgent(organizationId, userId, dto);
  }

  @Get('agents')
  listVoiceAgents(@Tenant() organizationId: string): Promise<any> {
    return this.aiCallingService.listVoiceAgents(organizationId);
  }

  @Post('calls/start')
  @HttpCode(HttpStatus.CREATED)
  startCall(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: StartAICallDto,
  ): Promise<any> {
    return this.aiCallingService.startCall(organizationId, userId, dto);
  }

  @Get('calls')
  listCalls(
    @Tenant() organizationId: string,
    @Query() query: AICallingListQueryDto,
  ): Promise<any> {
    return this.aiCallingService.listCalls(organizationId, query);
  }

  @Get('calls/:callId')
  getCall(
    @Tenant() organizationId: string,
    @Param('callId') callId: string,
  ): Promise<any> {
    return this.aiCallingService.getCall(organizationId, callId);
  }

  @Post('calls/:callId/turn')
  handleConversationTurn(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Param('callId') callId: string,
    @Body() dto: ConversationTurnDto,
  ): Promise<any> {
    return this.aiCallingService.handleConversationTurn(organizationId, userId, callId, dto);
  }

  @Post('calls/book-appointment')
  bookAppointment(
    @Tenant() organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: BookAppointmentDto,
  ): Promise<any> {
    return this.aiCallingService.bookAppointment(organizationId, userId, dto);
  }

  @Get('stats')
  getStats(
    @Tenant() organizationId: string,
    @Query('days') days?: string,
  ): Promise<any> {
    return this.aiCallingService.getStats(organizationId, Number(days) || 30);
  }

  @Public()
  @Post('webhooks/twilio/voice')
  @HttpCode(HttpStatus.OK)
  ingestTwilioVoiceWebhook(
    @Body() dto: TwilioVoiceWebhookDto,
    @Req() req: Request,
  ): Promise<any> {
    const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const signature = req.headers['x-twilio-signature'];
    return this.aiCallingService.ingestTwilioVoiceWebhook(
      callbackUrl,
      dto,
      Array.isArray(signature) ? signature[0] : signature,
    );
  }

  @Public()
  @Post('webhooks/twilio/recording')
  @HttpCode(HttpStatus.OK)
  ingestTwilioRecordingWebhook(
    @Body() dto: TwilioVoiceWebhookDto,
    @Req() req: Request,
  ): Promise<any> {
    const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const signature = req.headers['x-twilio-signature'];
    return this.aiCallingService.ingestTwilioRecordingWebhook(
      callbackUrl,
      dto,
      Array.isArray(signature) ? signature[0] : signature,
    );
  }
}
