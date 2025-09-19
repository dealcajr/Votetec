export interface Candidate {
  id: string;
  name: string;
  partylist: string;
  icon: string;
  position: 'President' | 'Vice President' | 'Secretary' | 'Treasurer' | 'Auditor' | 'Public Information Officer';
}
