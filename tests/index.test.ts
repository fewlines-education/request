import request from "../src/index";
import http from "http";
import net from "net";

let server: http.Server;

function getPort(): number {
  return (server.address() as net.AddressInfo).port;
}

beforeAll(() => {
  server = http
    .createServer((req, res) => {
      let body = "";
      if (req.url === "/get") {
        res.write("OK");
        res.end();
      }
      if (req.url === "/headers") {
        res.write(JSON.stringify(req.headers));
        res.end();
      }
      if (req.url === "/post" && req.method === "POST") {
        req.on("data", function (data) {
          body += data;
        });

        req.on("end", function () {
          res.write(body);
          res.end();
        });
      }
    })
    .listen(0);
});

afterAll(() => {
  server.close();
});

test("GET call without options", () => {
  expect.assertions(2);

  return new Promise((resolve) =>
    request(`http://localhost:${getPort()}/get`, (error, body) => {
      expect(body).toBe("OK");
      expect(error).toBe(null);
      resolve(true);
    })
  );
});

test("GET call with header", () => {
  expect.assertions(2);

  const headers = { authorization: "Bearer <token>" };

  return new Promise((resolve) =>
    request(
      `http://localhost:${getPort()}/headers`,
      { headers },
      (error, body) => {
        if (body === null) {
          return resolve(false);
        }
        const receivedHeaders = JSON.parse(body);
        expect(receivedHeaders).toMatchObject(headers);
        expect(error).toBe(null);
        resolve(true);
      }
    )
  );
});

test("GET call on invalid URL", () => {
  expect.assertions(3);

  return new Promise((resolve) =>
    request("invalid_url", (error) => {
      expect(error).not.toBe(null);
      expect(error?.name).toBe("TypeError");
      expect(error?.message).toBe("Only absolute URLs are supported");
      resolve(true);
    })
  );
});

test("GET call on non existant URL", () => {
  expect.assertions(3);

  return new Promise((resolve) =>
    request("http://wrong", (error) => {
      expect(error).not.toBe(null);
      expect(error?.name).toBe("FetchError");
      expect(error?.message).toBe(
        "request to http://wrong/ failed, reason: getaddrinfo ENOTFOUND wrong"
      );
      resolve(true);
    })
  );
});

test("POST call without data", () => {
  expect.assertions(2);

  return new Promise((resolve) =>
    request(
      `http://localhost:${getPort()}/post`,
      { method: "post" },
      (error, body) => {
        expect(body).toBe("");
        expect(error).toBe(null);
        resolve(true);
      }
    )
  );
});

test("POST call with data", () => {
  expect.assertions(2);
  const json = { hello: "world" };

  return new Promise((resolve) =>
    request(
      `http://localhost:${getPort()}/post`,
      { method: "post", body: JSON.stringify(json) },
      (error, body) => {
        expect(body).toBe(JSON.stringify(json));
        expect(error).toBe(null);
        resolve(true);
      }
    )
  );
});
