export interface User {
  _id: string;
  username: string;
  email: string;
  isVerified: boolean;
  createdAt?: string;
}
