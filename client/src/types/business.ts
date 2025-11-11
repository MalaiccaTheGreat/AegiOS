// Basic Business type definition
export interface Business {
  id: string;
  name: string;
  // Add other business properties as needed
  [key: string]: any;
}

export interface InsertBusiness {
  name: string;
  // Add other insert properties as needed
  [key: string]: any;
}
