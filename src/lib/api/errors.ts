import { GUEST_PLAY_UNAVAILABLE, accountRequiredMessage } from "./guest-access";

export const ATTEMPT_ACCESS_DENIED = "ATTEMPT_ACCESS_DENIED";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: string[],
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class GuestAccessError extends ApiError {
  readonly code = GUEST_PLAY_UNAVAILABLE;
  constructor() {
    super(403, accountRequiredMessage);
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
