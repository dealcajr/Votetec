"use server";
/**
 * @fileOverview Voting-related AI flows.
 *
 * - verifyVoter - Verifies a voter's identity from a photo.
 * - castVote - Records a vote for a candidate.
 * - getElectionResults - Retrieves the current election results.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  runTransaction,
  DocumentReference,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { Voter } from "@/types/voter";
import type { Candidate } from "@/types/candidate";

// Schemas
const VoterSchema = z.object({
  id: z.string(),
  name: z.string(),
  grade: z.string(),
  section: z.string().optional(),
  track: z.string().optional(),
  strand: z.string().optional(),
  hasVoted: z.boolean(),
});

const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  votes: z.number().optional(),
});

const VerifyVoterInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the voter's ID card, as a data URI that must include a MIME type and use Base64 encoding."
    ),
});

const VerifyVoterOutputSchema = z.object({
  voter: VoterSchema.nullable().describe(
    "The verified voter's information, or null if not found or already voted."
  ),
  candidates: z
    .array(CandidateSchema)
    .nullable()
    .describe("The list of candidates for the election."),
  error: z
    .string()
    .nullable()
    .describe("An error message if verification fails."),
});

const CastVoteInputSchema = z.object({
  voterId: z.string(),
  candidateId: z.string(),
});

const CastVoteOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().nullable(),
});

const ElectionResultsOutputSchema = z.object({
  candidates: z.array(CandidateSchema),
  totalVotes: z.number(),
});

// Exported Types
export type VerifyVoterOutput = z.infer<typeof VerifyVoterOutputSchema>;

// AI Flows
const verifyVoterFlow = ai.defineFlow(
  {
    name: "verifyVoterFlow",
    inputSchema: VerifyVoterInputSchema,
    outputSchema: VerifyVoterOutputSchema,
  },
  async ({ photoDataUri }) => {
    // In a real app, you'd use AI to extract text from the photoDataUri.
    // For this example, we'll simulate finding a specific voter.
    const MOCK_VOTER_ID = "VOTE-SH-67890"; // Assume AI extracts this from the ID photo

    try {
      const voterRef = doc(firestore, "voters", MOCK_VOTER_ID);
      const voterSnap = await getDoc(voterRef);

      if (!voterSnap.exists()) {
        return { voter: null, candidates: null, error: "Voter not found." };
      }

      const voter = voterSnap.data() as Voter;
      if (voter.hasVoted) {
        return {
          voter: null,
          candidates: null,
          error: "This voter has already cast their vote.",
        };
      }

      // If voter is valid, fetch candidates
      const candidatesQuery = collection(firestore, "candidates");
      const candidatesSnap = await getDocs(candidatesQuery);
      const candidates = candidatesSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Candidate)
      );

      return { voter, candidates, error: null };
    } catch (err: any) {
      console.error("Error in verifyVoterFlow:", err);
      return {
        voter: null,
        candidates: null,
        error: "An internal error occurred.",
      };
    }
  }
);

const castVoteFlow = ai.defineFlow(
  {
    name: "castVoteFlow",
    inputSchema: CastVoteInputSchema,
    outputSchema: CastVoteOutputSchema,
  },
  async ({ voterId, candidateId }) => {
    try {
      const voterRef = doc(firestore, "voters", voterId);
      const candidateRef = doc(firestore, "candidates", candidateId);

      await runTransaction(firestore, async (transaction) => {
        const voterDoc = await transaction.get(voterRef);
        if (!voterDoc.exists() || voterDoc.data().hasVoted) {
          throw new Error("Voter has already voted or does not exist.");
        }

        const candidateDoc = await transaction.get(candidateRef);
        if (!candidateDoc.exists()) {
          throw new Error("Candidate does not exist.");
        }

        const currentVotes = candidateDoc.data().votes || 0;

        // Mark voter as having voted and increment candidate's vote count
        transaction.update(voterRef, { hasVoted: true });
        transaction.update(candidateRef, { votes: currentVotes + 1 });
      });

      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error in castVoteFlow:", err);
      return { success: false, error: err.message };
    }
  }
);

const getElectionResultsFlow = ai.defineFlow(
  {
    name: "getElectionResultsFlow",
    outputSchema: ElectionResultsOutputSchema,
  },
  async () => {
    const candidatesQuery = collection(firestore, "candidates");
    const candidatesSnap = await getDocs(candidatesQuery);
    
    let totalVotes = 0;
    const candidates = candidatesSnap.docs.map((doc) => {
      const data = doc.data() as Omit<Candidate, 'id'>;
      const votes = data.votes || 0;
      totalVotes += votes;
      return { id: doc.id, ...data, votes };
    });

    return { candidates, totalVotes };
  }
);

// Exported wrapper functions
export async function verifyVoter(
  input: z.infer<typeof VerifyVoterInputSchema>
): Promise<VerifyVoterOutput> {
  return await verifyVoterFlow(input);
}

export async function castVote(
  input: z.infer<typeof CastVoteInputSchema>
): Promise<z.infer<typeof CastVoteOutputSchema>> {
  return await castVoteFlow(input);
}

export async function getElectionResults(): Promise<
  z.infer<typeof ElectionResultsOutputSchema>
> {
  return await getElectionResultsFlow();
}
