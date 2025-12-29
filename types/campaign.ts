export interface Campaign {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: any; // O Firestore Timestamp pode ser complexo, 'any' simplifica por agora
}
