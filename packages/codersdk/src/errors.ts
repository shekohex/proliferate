export interface FieldError {
	field: string;
	detail: string;
}

type FieldErrors = Record<FieldError["field"], FieldError["detail"]>;

export interface ApiErrorResponse {
	message: string;
	detail?: string;
	validations?: FieldError[];
}

export class CoderError extends Error {
	constructor(
		public readonly response: Response,
		public readonly data: ApiErrorResponse,
	) {
		super(data.message || response.statusText);
		this.name = "CoderError";
	}

	get status() {
		return this.response.status;
	}
}

export type ApiError = CoderError;

export const isApiError = (err: unknown): err is ApiError => {
	return (
		err !== null &&
		typeof err === "object" &&
		"name" in err &&
		(err as { name: unknown }).name === "CoderError" &&
		"data" in err
	);
};

export const isApiErrorResponse = (err: unknown): err is ApiErrorResponse => {
	return (
		typeof err === "object" &&
		err !== null &&
		"message" in err &&
		typeof err.message === "string" &&
		(!("detail" in err) || err.detail === undefined || typeof err.detail === "string") &&
		(!("validations" in err) || err.validations === undefined || Array.isArray(err.validations))
	);
};

export const hasApiFieldErrors = (error: ApiError): boolean =>
	Array.isArray(error.data.validations);

export const isApiValidationError = (error: unknown): error is ApiError => {
	return isApiError(error) && hasApiFieldErrors(error);
};

export const hasError = (error: unknown) => error !== undefined && error !== null;

const Language = {
	errorsByCode: {
		defaultErrorCode: "Invalid value",
	},
};

export const mapApiErrorToFieldErrors = (apiErrorResponse: ApiErrorResponse): FieldErrors => {
	const result: FieldErrors = {};

	if (apiErrorResponse.validations) {
		for (const error of apiErrorResponse.validations) {
			result[error.field] = error.detail || Language.errorsByCode.defaultErrorCode;
		}
	}

	return result;
};

export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
	if (isApiError(error) && error.data.message) {
		return error.data.message;
	}
	if (isApiErrorResponse(error)) {
		return error.message;
	}
	if (error && typeof error === "string") {
		return error;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return defaultMessage;
};

export const getValidationErrorMessage = (error: unknown): string => {
	const validationErrors =
		isApiError(error) && error.data.validations ? error.data.validations : [];
	return validationErrors.map((error) => error.detail).join("\n");
};

export const getErrorDetail = (error: unknown): string | undefined => {
	if (error instanceof DetailedError) {
		return error.detail;
	}

	if (isApiError(error) && error.data.detail) {
		return error.data.detail;
	}

	if (isApiErrorResponse(error) && error.detail) {
		return error.detail;
	}

	if (error instanceof Error) {
		return "Please check the developer console for more details.";
	}

	return undefined;
};

export const getErrorStatus = (error: unknown): number | undefined => {
	if (isApiError(error)) {
		return error.status;
	}

	return undefined;
};

export class DetailedError extends Error {
	constructor(
		message: string,
		public detail?: string,
	) {
		super(message);
	}
}
