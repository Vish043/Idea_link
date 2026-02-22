/**
 * IP Protection Utilities
 * Provides cryptographic hashing and timestamping for idea protection
 */

import crypto from 'crypto';

/**
 * Generate a cryptographic hash for an idea
 * This serves as proof of ownership at a specific time
 * Enhanced to include comprehensive idea data for stronger proof
 */
export function generateIdeaHash(
  title: string,
  description: string,
  ownerId: string,
  timestamp: Date,
  additionalData?: {
    tags?: string[];
    requiredSkills?: string[];
    shortSummary?: string;
  }
): string {
  // Include all relevant data for comprehensive proof
  const tagsStr = additionalData?.tags ? additionalData.tags.sort().join(',') : '';
  const skillsStr = additionalData?.requiredSkills ? additionalData.requiredSkills.sort().join(',') : '';
  const summaryStr = additionalData?.shortSummary || '';
  
  const content = `${title}|${summaryStr}|${description}|${tagsStr}|${skillsStr}|${ownerId}|${timestamp.toISOString()}`;
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
 * Enhanced to verify with comprehensive data
 */
export function verifyIdeaIntegrity(
  idea: {
    title: string;
    description: string;
    owner: { toString: () => string };
    createdAt: Date;
    ideaHash: string;
    tags?: string[];
    requiredSkills?: string[];
    shortSummary?: string;
  }
): boolean {
  const expectedHash = generateIdeaHash(
    idea.title,
    idea.description,
    idea.owner.toString(),
    idea.createdAt,
    {
      tags: idea.tags,
      requiredSkills: idea.requiredSkills,
      shortSummary: idea.shortSummary,
    }
  );
  return expectedHash === idea.ideaHash;
}

/**
 * Generate comprehensive IP protection certificate
 * Includes all relevant information for legal proof of ownership
 */
export function generateIPCertificate(idea: {
  _id: string;
  title: string;
  shortSummary?: string;
  ideaHash: string;
  createdAt: Date;
  updatedAt?: Date;
  owner: { name: string; email: string };
  tags?: string[];
  requiredSkills?: string[];
  versionHistory?: Array<{
    version: number;
    timestamp: Date;
    changedBy?: { name: string; email: string } | string;
  }>;
  locked?: boolean;
  status?: string;
}): string {
  const now = new Date();
  const versionCount = idea.versionHistory?.length || 0;
  const isLocked = idea.locked ? 'Yes (Protected from further edits)' : 'No';
  const status = idea.status || 'Unknown';
  
  // Format version history
  let versionHistoryText = 'No version history available.';
  if (idea.versionHistory && idea.versionHistory.length > 0) {
    versionHistoryText = idea.versionHistory
      .map((v, idx) => {
        const changedBy = typeof v.changedBy === 'object' 
          ? `${v.changedBy.name} (${v.changedBy.email})`
          : 'Unknown';
        return `  Version ${v.version}: ${new Date(v.timestamp).toISOString()} by ${changedBy}`;
      })
      .join('\n');
  }

  // Format tags and skills
  const tagsText = idea.tags && idea.tags.length > 0 
    ? idea.tags.join(', ') 
    : 'None specified';
  const skillsText = idea.requiredSkills && idea.requiredSkills.length > 0
    ? idea.requiredSkills.join(', ')
    : 'None specified';

  return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    INTELLECTUAL PROPERTY CERTIFICATE                        ║
║                         IdeaConnect Platform                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

CERTIFICATE INFORMATION
────────────────────────────────────────────────────────────────────────────────
Certificate ID: CERT-${idea._id}-${now.getTime()}
Certificate Generated: ${now.toISOString()}
Platform: IdeaConnect
Certificate Type: Intellectual Property Ownership Proof

IDEA INFORMATION
────────────────────────────────────────────────────────────────────────────────
Idea ID: ${idea._id}
Title: ${idea.title}
${idea.shortSummary ? `Summary: ${idea.shortSummary}` : ''}
Status: ${status}
Locked: ${isLocked}

OWNERSHIP INFORMATION
────────────────────────────────────────────────────────────────────────────────
Owner Name: ${idea.owner.name}
Owner Email: ${idea.owner.email}
Registration Date: ${idea.createdAt.toISOString()}
${idea.updatedAt ? `Last Updated: ${idea.updatedAt.toISOString()}` : ''}

CRYPTOGRAPHIC PROOF
────────────────────────────────────────────────────────────────────────────────
Hash Algorithm: SHA-256
Idea Hash: ${idea.ideaHash}

This cryptographic hash serves as immutable proof of ownership at the time of
registration. The hash is generated using SHA-256 and includes the idea's
title, description, summary, tags, required skills, owner ID, and timestamp.

VERIFICATION
────────────────────────────────────────────────────────────────────────────────
To verify this certificate:
1. Visit the IdeaConnect platform
2. Navigate to the idea with ID: ${idea._id}
3. Compare the hash displayed with the hash in this certificate
4. Verify the owner information matches

VERSION HISTORY
────────────────────────────────────────────────────────────────────────────────
Total Versions: ${versionCount}
${versionHistoryText}

IDEA METADATA
────────────────────────────────────────────────────────────────────────────────
Tags: ${tagsText}
Required Skills: ${skillsText}

LEGAL DISCLAIMER
────────────────────────────────────────────────────────────────────────────────
This certificate is generated by the IdeaConnect platform and serves as a
timestamped record of idea registration. While this certificate provides
cryptographic proof of ownership at the time of registration, it does not
constitute legal advice or guarantee intellectual property rights. Users are
advised to consult with legal professionals for formal IP protection.

The cryptographic hash in this certificate can be used to verify the
authenticity and integrity of the idea as registered on the IdeaConnect
platform at the specified date and time.

────────────────────────────────────────────────────────────────────────────────
Certificate Generated: ${now.toISOString()}
Platform: IdeaConnect
For support: Contact IdeaConnect Platform Support

╔══════════════════════════════════════════════════════════════════════════════╗
║                    END OF CERTIFICATE                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `.trim();
}

/**
 * Generate a simplified certificate for quick reference
 */
export function generateSimpleCertificate(idea: {
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

