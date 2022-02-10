import fetch, {
  FetchError,
  Headers,
  Request,
  RequestInfo,
  RequestInit,
  Response,
} from "node-fetch";

type CallbackFn = (
  error: Error | null,
  body: string | null,
  response: Response | null
) => void;

export default function request(url: RequestInfo, callback: CallbackFn): void;
export default function request(
  url: RequestInfo,
  options: RequestInit,
  callback: CallbackFn
): void;

export default function request(
  url: RequestInfo,
  optionsOrCallback: unknown,
  callback?: unknown
): void {
  const options =
    typeof optionsOrCallback === "object" && optionsOrCallback !== null
      ? optionsOrCallback
      : {};
  const realCallback =
    typeof callback === "function"
      ? callback
      : typeof optionsOrCallback === "function"
      ? optionsOrCallback
      : null;

  if (realCallback === null) {
    throw new Error("No callback was provided");
  }

  fetch(url, options).then(
    (response) =>
      response.text().then((textResponse) => {
        realCallback(null, textResponse, response);
      }),
    (error) => realCallback(error, null, null)
  );
}

export { Headers, FetchError, Request, Response };
