import { ResilientEventBus } from './resilient-event-bus.service';
import { EventDlqService } from './event-dlq.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('ResilientEventBus', () => {
  let bus: ResilientEventBus;
  let eventEmitter: { emitAsync: jest.Mock };
  let dlqService: { recordFailure: jest.Mock };

  beforeEach(() => {
    eventEmitter = { emitAsync: jest.fn() };
    dlqService = {
      recordFailure: jest.fn().mockResolvedValue({ id: 'dlq-1' }),
    };

    bus = new ResilientEventBus(
      eventEmitter as unknown as EventEmitter2,
      dlqService as unknown as EventDlqService,
    );
  });

  it('returns success on first try when no listener fails', async () => {
    eventEmitter.emitAsync.mockResolvedValue([true, true]);

    const result = await bus.emit('test.event', { foo: 1 });

    expect(result).toEqual({ success: true, attempts: 1 });
    expect(dlqService.recordFailure).not.toHaveBeenCalled();
  });

  it('retries with exponential backoff and recovers', async () => {
    eventEmitter.emitAsync
      .mockRejectedValueOnce(new Error('boom-1'))
      .mockRejectedValueOnce(new Error('boom-2'))
      .mockResolvedValueOnce([true]);

    const result = await bus.emit(
      'test.event',
      { foo: 1 },
      { baseBackoffMs: 1 },
    );

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
    expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(3);
    expect(dlqService.recordFailure).not.toHaveBeenCalled();
  });

  it('persists to DLQ after exhausting retries', async () => {
    eventEmitter.emitAsync.mockRejectedValue(new Error('still-broken'));

    const result = await bus.emit(
      'test.event',
      { foo: 1 },
      { baseBackoffMs: 1, maxAttempts: 2 },
    );

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(2);
    expect(result.failedEventId).toBe('dlq-1');
    expect(dlqService.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'test.event',
        payload: { foo: 1 },
        attempts: 2,
        maxAttempts: 2,
      }),
    );
  });

  it('treats handler-returned Error values as failures', async () => {
    eventEmitter.emitAsync.mockResolvedValue([true, new Error('listener-err')]);

    const result = await bus.emit(
      'test.event',
      { foo: 1 },
      { baseBackoffMs: 1, maxAttempts: 1 },
    );

    expect(result.success).toBe(false);
    expect(dlqService.recordFailure).toHaveBeenCalled();
  });
});
