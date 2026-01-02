export interface Campaign {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: any;
  nextSession?: string;
  quickNotes?: string;
}
