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

export class ContractError extends ApiError {
  constructor(message = "The backend returned an unexpected response.") {
    super(502, message);
    this.name = "ContractError";
  }
}

export function invalidContract(): never {
  throw new ContractError();
}
