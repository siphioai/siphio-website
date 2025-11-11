/**
 * Simple in-memory rate limiter for API routes
 *
 * IMPORTANT: Initialize OUTSIDE of handler function to maintain state
 * between requests. If initialized inside handler, it creates a fresh
 * instance each time with no memory of previous requests.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  window: number; // Time window in seconds
  max: number; // Maximum requests in window
}

export class RateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;

    // Clean up old records every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if identifier is within rate limit
   * @param identifier - Unique identifier (e.g., user ID, IP address)
   * @returns true if within limit, false if exceeded
   */
  check(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // No record or window expired - create new record
    if (!record || now > record.resetAt) {
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + this.config.window * 1000,
      });
      return true;
    }

    // Rate limit exceeded
    if (record.count >= this.config.max) {
      return false;
    }

    // Increment count
    record.count++;
    return true;
  }

  /**
   * Get current rate limit status for identifier
   */
  getStatus(identifier: string): {
    count: number;
    limit: number;
    remaining: number;
    resetAt: number;
  } {
    const record = this.requests.get(identifier);
    const now = Date.now();

    if (!record || now > record.resetAt) {
      return {
        count: 0,
        limit: this.config.max,
        remaining: this.config.max,
        resetAt: now + this.config.window * 1000,
      };
    }

    return {
      count: record.count,
      limit: this.config.max,
      remaining: Math.max(0, this.config.max - record.count),
      resetAt: record.resetAt,
    };
  }

  /**
   * Clean up expired records
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [identifier, record] of this.requests.entries()) {
      if (now > record.resetAt) {
        this.requests.delete(identifier);
      }
    }
  }

  /**
   * Reset rate limit for identifier (useful for testing)
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limit records (useful for testing)
   */
  clearAll(): void {
    this.requests.clear();
  }
}
