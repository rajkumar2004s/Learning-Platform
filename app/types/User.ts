export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  token?: string;
  photoURL?: string;
}
