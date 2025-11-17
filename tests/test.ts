import request from "supertest";
import app from "./../src/app";

describe("API Tests", () => {

  test("GET /hello should return a greeting", async () => {
  //   const response = await request(app).get("/hello");

  //   expect(response.status).toBe(200);
  //   expect(response.body).toEqual({ message: "Hello World" });
  // });

  // test("POST /sum should return the sum of two numbers", async () => {
  //   const data = { a: 5, b: 7 };

    // const response = await request(app)
    //   .post("/sum")
    //   .send(data);

    // expect(response.status).toBe(200);
    // expect(response.body.result).toBe(12);
  });

});
