import {
  GUEST_PLAY_UNAVAILABLE,
  guestPlayMessage,
} from "@/features/auth/guest-access";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: string[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class GuestAccessError extends ApiError {
  readonly code = GUEST_PLAY_UNAVAILABLE;
  constructor() {
    super(403, guestPlayMessage);
  }
}

export class ContractError extends ApiError {
  constructor(message = "The backend returned an unexpected response.") {
    super(502, message);
    this.name = "ContractError";
  }
}

export function invalidContract(): never {
  throw new ContractError();
}
