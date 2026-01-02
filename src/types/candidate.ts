export interface Candidate {
  id: string;
  name: string;
  partylist: string;
  icon: string;
  position: 'President' | 'Secretary' | 'Treasurer' | 'Auditor' | 'Public Information Officer' | 'Senior High School Vice President' | 'Junior High School Vice President' | 'Protocol Officer' | 'Grade 8 Representative' | 'Grade 9 Representative' | 'Grade 10 Representative' | 'Grade 11 Representative' | 'Grade 12 Representative';
}
