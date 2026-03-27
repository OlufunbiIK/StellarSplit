export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  createdAt: string;
}

export interface SplitRequest {
  groupId: string;
  members: Member[];
  amount: number;
  description: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
