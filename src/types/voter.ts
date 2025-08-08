export interface Voter {
  id: string;
  name: string;
  grade: string;
  section?: string;
  track?: string;
  strand?: string;
  hasVoted: boolean;
}
