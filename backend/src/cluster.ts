/**
 * Cluster mode entry point — spawns multiple worker processes.
 *
 * Uses Node.js cluster module to take advantage of multi-core CPUs.
 * Each worker runs the full Express app independently, sharing the same port.
 *
 * Usage:
 *   node dist/cluster.js          (production, auto-detects CPU count)
 *   WEB_CONCURRENCY=4 node dist/cluster.js  (explicit worker count)
 *
 * When to use:
 *   - Single server with multiple CPU cores
 *   - Want to handle more than ~10K req/s per instance
 *   - Alternative to container orchestration (K8s, ECS) for smaller deployments
 *
 * When NOT to use:
 *   - Already running multiple containers/pods (each is a single process)
 *   - Using serverless (Vercel/Lambda) — each invocation is isolated
 */
import cluster from "node:cluster";
import os from "node:os";

const WORKERS = Number(process.env.WEB_CONCURRENCY) || os.cpus().length;

if (cluster.isPrimary) {
  console.log(`[Cluster] Primary ${process.pid} starting ${WORKERS} workers`);

  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.warn(
      `[Cluster] Worker ${worker.process.pid} exited (code=${code}, signal=${signal}). Restarting...`,
    );
    // Auto-restart crashed workers
    cluster.fork();
  });
} else {
  // Workers run the full application
  import("./index.js");
}
