/**
 * IP Protection Utilities
 * Provides cryptographic hashing and timestamping for idea protection
 */

import crypto from 'crypto';

/**
 * Generate a cryptographic hash for an idea
 * This serves as proof of ownership at a specific time
 */
export function generateIdeaHash(
  title: string,
  description: string,
  ownerId: string,
  timestamp: Date
): string {
  const content = `${title}|${description}|${ownerId}|${timestamp.toISOString()}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Create a timestamped version entry for idea history
 */
export function createVersionEntry(
  content: string,
  changedBy: string,
  versionNumber: number
) {
  return {
    version: versionNumber,
    content,
    timestamp: new Date(),
    changedBy,
  };
}

/**
 * Verify idea integrity by comparing hash
 */
export function verifyIdeaIntegrity(
  idea: {
    title: string;
    description: string;
    owner: { toString: () => string };
    createdAt: Date;
    ideaHash: string;
  }
): boolean {
  const expectedHash = generateIdeaHash(
    idea.title,
    idea.description,
    idea.owner.toString(),
    idea.createdAt
  );
  return expectedHash === idea.ideaHash;
}

/**
 * Generate IP protection certificate text
 */
export function generateIPCertificate(idea: {
  title: string;
  ideaHash: string;
  createdAt: Date;
  owner: { name: string; email: string };
}): string {
  return `
INTELLECTUAL PROPERTY CERTIFICATE
==================================

Idea Title: ${idea.title}
Owner: ${idea.owner.name} (${idea.owner.email})
Created: ${idea.createdAt.toISOString()}
Hash: ${idea.ideaHash}

This certificate proves that the above idea was registered on IdeaConnect
at the specified date and time. The cryptographic hash serves as proof
of ownership and can be used to verify the idea's authenticity.

Certificate Generated: ${new Date().toISOString()}
  `.trim();
}

