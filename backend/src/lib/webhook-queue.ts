/**
 * Webhook processing queue — decouples webhook receipt from processing.
 *
 * Pattern: Acknowledge the webhook immediately (200), then process asynchronously.
 * This prevents payment gateways from retrying due to slow DB operations.
 *
 * Current implementation: in-process queue with concurrency control.
 * For production at scale: replace with BullMQ + Redis for persistence and retry.
 *
 * Usage:
 *   webhookQueue.enqueue("stripe", event.id, async () => { ... });
 */
import { logger } from "./logger.js";

type QueuedJob = {
  id: string;
  source: string;
  execute: () => Promise<void>;
  enqueuedAt: number;
};

class WebhookQueue {
  private queue: QueuedJob[] = [];
  private processing = 0;
  private readonly maxConcurrency: number;

  constructor(maxConcurrency = 5) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Enqueue a webhook processing job. Executes asynchronously with concurrency control.
   */
  enqueue(source: string, id: string, execute: () => Promise<void>): void {
    this.queue.push({ id, source, execute, enqueuedAt: Date.now() });
    this.drain();
  }

  private drain(): void {
    while (this.processing < this.maxConcurrency && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.processing++;

      const start = Date.now();
      job
        .execute()
        .then(() => {
          logger.debug("webhook_job_completed", {
            source: job.source,
            id: job.id,
            durationMs: Date.now() - start,
            queueWaitMs: start - job.enqueuedAt,
          });
        })
        .catch((err) => {
          logger.error("webhook_job_failed", {
            source: job.source,
            id: job.id,
            error: err instanceof Error ? err.message : String(err),
            durationMs: Date.now() - start,
          });
        })
        .finally(() => {
          this.processing--;
          this.drain();
        });
    }
  }

  /** Current queue depth (for monitoring). */
  get depth(): number {
    return this.queue.length;
  }

  /** Number of jobs currently processing. */
  get active(): number {
    return this.processing;
  }
}

/** Singleton webhook queue for the application. */
export const webhookQueue = new WebhookQueue(
  Number(process.env.WEBHOOK_CONCURRENCY) || 5,
);
