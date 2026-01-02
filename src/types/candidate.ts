export interface Candidate {
  id: string;
  name: string;
  partylist: string;
  icon: string;
  position: 'President' | 'Vice President' | 'Secretary' | 'Treasurer' | 'Auditor' | 'Public Information Officer' | 'Senior High school VP' | 'Junior High School VP' | 'Protocol Officer' | 'Representative Grade 8' | 'Representative Grade 9' | 'Representative Grade 10' | 'Representative Grade 11' | 'Representative Grade 12';
}
