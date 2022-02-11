# Request

<!-- TOC -->

- [Installation](#installation)
- [Common Usage](#common-usage)
  - [Plain text or HTML](#plain-text-or-html)
  - [JSON](#json)
  - [Simple Post](#simple-post)
  - [Post with JSON](#post-with-json)
  - [Post with form parameters](#post-with-form-parameters)
  - [Handling exceptions](#handling-exceptions)
  - [Handling client and server errors](#handling-client-and-server-errors)
- [API](#api)
  - [request(url[, options], callback)](#api)
  - [Options](#options)
    - [Default Headers](#default-headers)
    - [Custom Agent](#custom-agent)
  - [Class: Request](#class-request)
    - [new Request(input[, options])](#new-requestinput-options)
  - [Class: Response](#class-response)
    - [new Response([body[, options]])](#new-responsebody-options)
    - [response.ok](#responseok)
    - [response.redirected](#responseredirected)
    - [response.type](#responsetype)
  - [Class: Headers](#class-headers)
    - [new Headers([init])](#new-headersinit)
  - [Interface: Body](#interface-body)
    - [body.body](#bodybody)
    - [body.bodyUsed](#bodybodyused)
  - [Class: FetchError](#class-fetcherror)
- [TypeScript](#typescript)

## Installation

With Yarn:

```shell
yarn add @fewlines-education/request
```

With NPM:

```shell
npm install @fewlines-education/request
```

## Common Usage

With TypeScript or using ESM:

```typescript
import request from "@fewlines-education/request";
```

With CommonJS:

````javascript
const request = require("@fewlines-education/request").default;
```

### Plain text or HTML

```js
import request from "@fewlines-education/request";

request("https://github.com/", (error, body) => {
  console.log(body);
});
````

### JSON

```js
import request from "@fewlines-education/request";

reqest("https://api.github.com/users/github", (error, body) => {
  const data = JSON.parse(body);
  console.log(data);
});
```

### Simple Post

```js
import request from "@fewlines-education/request";

request(
  "https://httpbin.org/post",
  {
    method: "POST",
    body: "a=1",
  },
  (error, body) => {
    const data = JSON.parse(body);
    console.log(data);
  }
);
```

### Post with JSON

```js
import request from "@fewlines-education/request";

const body = { a: 1 };

request(
  "https://httpbin.org/post",
  {
    method: "post",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  },
  (error, body) => {
    const data = JSON.parse(body);
    console.log(data);
  }
);
```

### Post with form parameters

`URLSearchParams` is available on the global object in Node.js as of v10.0.0. See [official documentation](https://nodejs.org/api/url.html#url_class_urlsearchparams) for more usage methods.

NOTE: The `Content-Type` header is only set automatically to `x-www-form-urlencoded` when an instance of `URLSearchParams` is given as such:

```js
import request from "@fewlines-education/request";

const params = new URLSearchParams();
params.append("a", 1);

request(
  "https://httpbin.org/post",
  {
    method: "POST",
    body: params,
  },
  (error, body) => {
    const data = JSON.parse(body);
    console.log(data);
  }
);
```

### Handling exceptions

NOTE: 3xx-5xx responses are _NOT_ exceptions, and should be handled with the `Response`

```js
import request from "@fewlines-education/request";

request("https://domain.invalid/", (error) => {
  console.log(error);
});
```

### Handling client and server errors

It is common to create a helper function to check that the response contains no client (4xx) or server (5xx) error responses:

```js
import request from "@fewlines-education/request";

class HTTPResponseError extends Error {
  constructor(response, ...args) {
    super(
      `HTTP Error Response: ${response.status} ${response.statusText}`,
      ...args
    );
    this.response = response;
  }
}

const checkStatus = (response) => {
  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response;
  } else {
    throw new HTTPResponseError(response);
  }
};

request("https://httpbin.org/status/400", (error, body, response) => {
  try {
    checkStatus(response);
  } catch (error) {
    console.error(error);
    const errorBody = await error.response.text();
    console.error(`Error body: ${errorBody}`);
  }
});
```

### Accessing Headers and other Metadata

```js
import request from "@fewlines-education/request";

request("https://github.com/", (error, body, response) => {
  console.log(response.ok);
  console.log(response.status);
  console.log(response.statusText);
  console.log(response.headers.raw());
  console.log(response.headers.get("content-type"));
});
```

## API

### request(url[, options], callback)

- `url` A string representing the URL for fetching
- `options` [Options](#fetch-options) for the HTTP(S) request
- `callback` A function that will be called with:
  - `error` If an error occured, it will contain the error, otherwise this will be null
  - `body` The body of the response as a string
  - `response` The [Response](#class-response) of the request

Perform an HTTP(S) fetch.

`url` should be an absolute URL, such as `https://example.com/`. A path-relative URL (`/file/under/root`) or protocol-relative URL (`//can-be-http-or-https.com/`) will result in an error.

<a id="fetch-options"></a>

### Options

The default values are shown after each option key.

```js
{
	// These properties are part of the Fetch Standard
	method: 'GET',
	headers: {},            // Request headers. format is the identical to that accepted by the Headers constructor (see below)
	body: null,             // Request body. can be null, or a Node.js Readable stream
	redirect: 'follow',     // Set to `manual` to extract redirect headers, `error` to reject redirect
	signal: null,           // Pass an instance of AbortSignal to optionally abort requests

	// The following properties are node-fetch extensions
	follow: 20,             // maximum redirect count. 0 to not follow redirect
	compress: true,         // support gzip/deflate content encoding. false to disable
	size: 0,                // maximum response body size in bytes. 0 to disable
	agent: null,            // http(s).Agent instance or function that returns an instance (see below)
	highWaterMark: 16384,   // the maximum number of bytes to store in the internal buffer before ceasing to read from the underlying resource.
	insecureHTTPParser: false	// Use an insecure HTTP parser that accepts invalid HTTP headers when `true`.
}
```

#### Default Headers

If no values are set, the following request headers will be sent automatically:

| Header              | Value                                                  |
| ------------------- | ------------------------------------------------------ |
| `Accept-Encoding`   | `gzip,deflate,br` _(when `options.compress === true`)_ |
| `Accept`            | `*/*`                                                  |
| `Connection`        | `close` _(when no `options.agent` is present)_         |
| `Content-Length`    | _(automatically calculated, if possible)_              |
| `Host`              | _(host and port information from the target URI)_      |
| `Transfer-Encoding` | `chunked` _(when `req.body` is a stream)_              |
| `User-Agent`        | `node-fetch`                                           |

Note: when `body` is a `Stream`, `Content-Length` is not set automatically.

#### Custom Agent

The `agent` option allows you to specify networking related options which are out of the scope of Fetch, including and not limited to the following:

- Support self-signed certificate
- Use only IPv4 or IPv6
- Custom DNS Lookup

See [`http.Agent`](https://nodejs.org/api/http.html#http_new_agent_options) for more information.

In addition, the `agent` option accepts a function that returns `http`(s)`.Agent` instance given current [URL](https://nodejs.org/api/url.html), this is useful during a redirection chain across HTTP and HTTPS protocol.

```js
import http from "node:http";
import https from "node:https";

const httpAgent = new http.Agent({
  keepAlive: true,
});
const httpsAgent = new https.Agent({
  keepAlive: true,
});

const options = {
  agent: function (_parsedURL) {
    if (_parsedURL.protocol == "http:") {
      return httpAgent;
    } else {
      return httpsAgent;
    }
  },
};
```

### Class: Request

An HTTP(S) request containing information about URL, method, headers, and the body. This class implements the [Body](#iface-body) interface.

Due to the nature of Node.js, the following properties are not implemented at this moment:

- `type`
- `destination`
- `mode`
- `credentials`
- `cache`
- `integrity`
- `keepalive`

The following extension properties are provided:

- `follow`
- `compress`
- `counter`
- `agent`
- `highWaterMark`

See [options](#fetch-options) for exact meaning of these extensions.

#### new Request(input[, options])

<small>_(spec-compliant)_</small>

- `input` A string representing a URL, or another `Request` (which will be cloned)
- `options` [Options][#fetch-options] for the HTTP(S) request

Constructs a new `Request` object. The constructor is identical to that in the [browser](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request).

In most cases, directly `request(url, options, callback)` is simpler than creating a `Request` object.

<a id="class-response"></a>

### Class: Response

An HTTP(S) response. This class implements the [Body](#iface-body) interface.

The following properties are not implemented at this moment:

- `trailer`

#### new Response([body[, options]])

<small>_(spec-compliant)_</small>

- `body` A `String` or [`Readable` stream][node-readable]
- `options` A [`ResponseInit`][response-init] options dictionary

Constructs a new `Response` object. The constructor is identical to that in the [browser](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response).

Because Node.js does not implement service workers (for which this class was designed), one rarely has to construct a `Response` directly.

#### response.ok

<small>_(spec-compliant)_</small>

Convenience property representing if the request ended normally. Will evaluate to true if the response status was greater than or equal to 200 but smaller than 300.

#### response.redirected

<small>_(spec-compliant)_</small>

Convenience property representing if the request has been redirected at least once. Will evaluate to true if the internal redirect counter is greater than 0.

#### response.type

<small>_(deviation from spec)_</small>

Convenience property representing the response's type. request only supports `'default'` and `'error'` and does not make use of [filtered responses](https://fetch.spec.whatwg.org/#concept-filtered-response).

<a id="class-headers"></a>

### Class: Headers

This class allows manipulating and iterating over a set of HTTP headers. All methods specified in the [Fetch Standard][whatwg-fetch] are implemented.

#### new Headers([init])

<small>_(spec-compliant)_</small>

- `init` Optional argument to pre-fill the `Headers` object

Construct a new `Headers` object. `init` can be either `null`, a `Headers` object, an key-value map object or any iterable object.

```js
// Example adapted from https://fetch.spec.whatwg.org/#example-headers-class
import { Headers } from "@fewlines-education/request";

const meta = {
  "Content-Type": "text/xml",
};
const headers = new Headers(meta);

// The above is equivalent to
const meta = [["Content-Type", "text/xml"]];
const headers = new Headers(meta);

// You can in fact use any iterable objects, like a Map or even another Headers
const meta = new Map();
meta.set("Content-Type", "text/xml");
const headers = new Headers(meta);
const copyOfHeaders = new Headers(headers);
```

<a id="iface-body"></a>

### Interface: Body

`Body` is an abstract interface with methods that are applicable to both `Request` and `Response` classes.

#### body.body

<small>_(deviation from spec)_</small>

- Node.js [`Readable` stream][node-readable]

Data are encapsulated in the `Body` object. Note that while the [Fetch Standard][whatwg-fetch] requires the property to always be a WHATWG `ReadableStream`, in request it is a Node.js [`Readable` stream][node-readable].

#### body.bodyUsed

<small>_(spec-compliant)_</small>

- `Boolean`

A boolean property for if this body has been consumed. Per the specs, a consumed body cannot be used again.

<a id="class-fetcherror"></a>

### Class: FetchError

<small>_(node-fetch extension)_</small>

An operational error in the fetching process.

<a id="class-aborterror"></a>

## TypeScript

types are bundled with `@fewlines-education/request`, so you don't need to install any additional packages.
