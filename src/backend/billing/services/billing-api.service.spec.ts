import { WebhookStatus } from '@prisma/client';
import { BillingApiService } from './billing-api.service';

describe('BillingApiService webhook reliability', () => {
  const prisma = {
    paymentWebhook: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as any;

  const stripeService = {
    verifyWebhook: jest.fn(),
    handleWebhookEvent: jest.fn(),
  } as any;

  const paystackService = {
    verifyWebhookSignature: jest.fn(),
    handleWebhookEvent: jest.fn(),
  } as any;

  const svc = new BillingApiService(
    prisma,
    {} as any,
    {} as any,
    {} as any,
    stripeService,
    paystackService,
    {} as any,
    {} as any,
    {} as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips duplicate stripe webhooks using external id', async () => {
    stripeService.verifyWebhook.mockReturnValue({ id: 'evt_1', type: 'charge.succeeded' });
    prisma.paymentWebhook.findUnique.mockResolvedValue({ id: 'wh_existing' });

    const res = await svc.handleStripeWebhook('sig', '{}');

    expect(res).toEqual({
      received: true,
      provider: 'stripe',
      eventType: 'charge.succeeded',
      duplicate: true,
    });
    expect(stripeService.handleWebhookEvent).not.toHaveBeenCalled();
    expect(prisma.paymentWebhook.create).not.toHaveBeenCalled();
  });

  it('marks stripe webhook processed on success', async () => {
    stripeService.verifyWebhook.mockReturnValue({ id: 'evt_2', type: 'invoice.paid' });
    prisma.paymentWebhook.findUnique.mockResolvedValue(null);
    prisma.paymentWebhook.create.mockResolvedValue({ id: 'wh_new' });
    stripeService.handleWebhookEvent.mockResolvedValue(undefined);

    const res = await svc.handleStripeWebhook('sig', '{}');

    expect(res).toEqual({
      received: true,
      provider: 'stripe',
      eventType: 'invoice.paid',
    });
    expect(prisma.paymentWebhook.create).toHaveBeenCalled();
    expect(prisma.paymentWebhook.update).toHaveBeenCalledWith({
      where: { id: 'wh_new' },
      data: expect.objectContaining({ status: WebhookStatus.PROCESSED }),
    });
  });

  it('marks paystack webhook failed when handler throws', async () => {
    paystackService.verifyWebhookSignature.mockReturnValue(true);
    prisma.paymentWebhook.findUnique.mockResolvedValue(null);
    prisma.paymentWebhook.create.mockResolvedValue({ id: 'wh_paystack' });
    paystackService.handleWebhookEvent.mockRejectedValue(new Error('boom'));

    await expect(
      svc.handlePaystackWebhook(
        'sig',
        JSON.stringify({ event: 'charge.success', data: { id: 12345 } }),
      ),
    ).rejects.toThrow('boom');

    expect(prisma.paymentWebhook.update).toHaveBeenCalledWith({
      where: { id: 'wh_paystack' },
      data: expect.objectContaining({
        status: WebhookStatus.FAILED,
        errorMessage: 'boom',
      }),
    });
  });
});
