export interface UserInterface {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;

  FirstNameTH?: string;
  LastNameTH?: string;
  FirstNameEN?: string;
  LastNameEN?: string;
  Email?: string;
  ProfileImageURL?: string;
  IDNumber?: string;
  Phone?: string;
  Birthday?: string;
  PDPAConsent?: boolean;
  PDPAConsentAt?: string | null;
  ProfileCompleted?: boolean;

  AccountTypeID?: number;
  IDDocTypeID?: number;

  AccountType?: any;
  IDDocType?: any;
}